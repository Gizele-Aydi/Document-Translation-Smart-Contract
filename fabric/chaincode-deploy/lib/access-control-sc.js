'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Access Control / Permission Smart Contract
 * Implements role-based permissions for read/write/verify operations
 * Manages access tokens and permission grants
 */
class AccessControlContract extends Contract {
    // Helper function to get deterministic date string (YYYY-MM-DD)
    _getTxTimestamp(ctx) {
        const txTimestamp = ctx.stub.getTxTimestamp();
        let seconds;
        if (txTimestamp.seconds) {
            if (typeof txTimestamp.seconds.toInt === 'function') {
                seconds = txTimestamp.seconds.toInt();
            } else if (typeof txTimestamp.seconds === 'number') {
                seconds = txTimestamp.seconds;
            } else if (txTimestamp.seconds.low !== undefined) {
                seconds = txTimestamp.seconds.low;
            } else {
                seconds = parseInt(txTimestamp.seconds);
            }
        } else {
            throw new Error('Unable to extract seconds from transaction timestamp');
        }
        
        const date = new Date(seconds * 1000);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // Helper function to get deterministic full Date object for comparisons
    _getTxFullTimestamp(ctx) {
        const txTimestamp = ctx.stub.getTxTimestamp();
        let seconds;
        if (txTimestamp.seconds) {
            if (typeof txTimestamp.seconds.toInt === 'function') {
                seconds = txTimestamp.seconds.toInt();
            } else if (typeof txTimestamp.seconds === 'number') {
                seconds = txTimestamp.seconds;
            } else if (txTimestamp.seconds.low !== undefined) {
                seconds = txTimestamp.seconds.low;
            } else {
                seconds = parseInt(txTimestamp.seconds);
            }
        } else {
            throw new Error('Unable to extract seconds from transaction timestamp');
        }
        // Return a Date object for comparison logic
        return new Date(seconds * 1000);
    }
    
    async initLedger(ctx) {
        console.info('Access Control Contract Ledger Initialized');
    }

    // -------------------- Permission Grants --------------------

    /**
     * Grant access to a user
     * @param {Context} ctx - Transaction context
     * @param {string} tokenID - Unique token ID
     * @param {string} userID - User to grant access to
     * @param {string} role - User's role
     * @param {string} accessLevel - READ, WRITE, VERIFY, or ADMIN
     * @param {string} documentScope - JSON array of document IDs or ["*"] for all
     * @param {string} expiryDate - ISO date string for token expiry
     * @param {string} grantedBy - Admin who granted the access
     */
    async grantAccess(ctx, tokenID, userID, role, accessLevel, documentScope, expiryDate, grantedBy) {
        const existingToken = await ctx.stub.getState(tokenID);
        if (existingToken && existingToken.length > 0) {
            throw new Error(`Token ${tokenID} already exists`);
        }

        const validLevels = ['READ', 'WRITE', 'VERIFY', 'ADMIN'];
        if (!validLevels.includes(accessLevel)) {
            throw new Error(`Invalid access level: ${accessLevel}. Must be one of: ${validLevels.join(', ')}`);
        }

        const token = {
            docType: 'accessToken',
            tokenID,
            userID,
            role,
            accessLevel,
            documentScope: JSON.parse(documentScope),
            expiryDate,
            revoked: false,
            grantedBy,
            grantedAt: this._getTxTimestamp(ctx)
        };

        await ctx.stub.putState(tokenID, Buffer.from(JSON.stringify(token)));

        // Create composite key for user lookup
        const userKey = ctx.stub.createCompositeKey('user~token', [userID, tokenID]);
        await ctx.stub.putState(userKey, Buffer.from('\u0000'));

        return token;
    }

    /**
     * Get access token by ID
     */
    async getAccessToken(ctx, tokenID) {
        const tokenBytes = await ctx.stub.getState(tokenID);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Access token ${tokenID} does not exist`);
        }
        return JSON.parse(tokenBytes.toString());
    }

    /**
     * Check if a user has the required access level for a document
     * @returns {object} - { hasAccess: boolean, reason: string }
     */
    async checkAccess(ctx, userID, documentID, requiredLevel) {
        const levelHierarchy = { 'READ': 1, 'WRITE': 2, 'VERIFY': 3, 'ADMIN': 4 };
        
        // Get all tokens for user
        const iterator = await ctx.stub.getStateByPartialCompositeKey('user~token', [userID]);
        const now = this._getTxFullTimestamp(ctx);

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const tokenID = compositeKey.attributes[1];
            
            try {
                const token = await this.getAccessToken(ctx, tokenID);

                // Check if token is valid
                if (token.revoked) continue;
                if (new Date(token.expiryDate) < now) continue;

                // Check if token covers this document
                const coversDocument = token.documentScope.includes('*') || 
                                       token.documentScope.includes(documentID);
                if (!coversDocument) continue;

                // Check if access level is sufficient
                if (levelHierarchy[token.accessLevel] >= levelHierarchy[requiredLevel]) {
                    return {
                        hasAccess: true,
                        reason: 'Access granted',
                        token
                    };
                }
            } catch (error) {
                continue;
            }
        }

        return {
            hasAccess: false,
            reason: `User ${userID} does not have ${requiredLevel} access to document ${documentID}`
        };
    }

    /**
     * Revoke an access token
     */
    async revokeAccess(ctx, tokenID, revokedBy, reason) {
        const token = await this.getAccessToken(ctx, tokenID);

        if (token.revoked) {
            throw new Error('Token is already revoked');
        }

        token.revoked = true;
        token.revokedBy = revokedBy;
        token.revokedAt = this._getTxTimestamp(ctx);
        token.revocationReason = reason;

        await ctx.stub.putState(tokenID, Buffer.from(JSON.stringify(token)));
        return token;
    }

    /**
     * Get all active permissions for a user
     */
    async getActivePermissions(ctx, userID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('user~token', [userID]);
        const permissions = [];
        const now = this._getTxFullTimestamp(ctx);

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const tokenID = compositeKey.attributes[1];
            
            try {
                const token = await this.getAccessToken(ctx, tokenID);
                
                if (!token.revoked && new Date(token.expiryDate) >= now) {
                    permissions.push(token);
                }
            } catch (error) {
                continue;
            }
        }

        return permissions;
    }

    /**
     * Extend token expiry date
     */
    async extendTokenExpiry(ctx, tokenID, newExpiryDate, extendedBy) {
        const token = await this.getAccessToken(ctx, tokenID);

        if (token.revoked) {
            throw new Error('Cannot extend a revoked token');
        }

        token.expiryDate = newExpiryDate;
        token.lastExtension = {
            extendedBy,
            timestamp: this._getTxTimestamp(ctx)
        };

        await ctx.stub.putState(tokenID, Buffer.from(JSON.stringify(token)));
        return token;
    }

    /**
     * Update document scope for a token
     */
    async updateDocumentScope(ctx, tokenID, newScope, updatedBy) {
        const token = await this.getAccessToken(ctx, tokenID);

        if (token.revoked) {
            throw new Error('Cannot update a revoked token');
        }

        token.documentScope = JSON.parse(newScope);
        token.lastScopeUpdate = {
            updatedBy,
            timestamp: this._getTxTimestamp(ctx)
        };

        await ctx.stub.putState(tokenID, Buffer.from(JSON.stringify(token)));
        return token;
    }

    // -------------------- Role-Based Access Helpers --------------------

    /**
     * Check if user can perform translation operations
     */
    async canTranslate(ctx, userID, documentID) {
        return await this.checkAccess(ctx, userID, documentID, 'WRITE');
    }

    /**
     * Check if user can verify documents
     */
    async canVerify(ctx, userID, documentID) {
        return await this.checkAccess(ctx, userID, documentID, 'VERIFY');
    }

    /**
     * Check if user can read document
     */
    async canRead(ctx, userID, documentID) {
        return await this.checkAccess(ctx, userID, documentID, 'READ');
    }

    /**
     * Check if user has admin access
     */
    async isAdmin(ctx, userID) {
        const permissions = await this.getActivePermissions(ctx, userID);
        return permissions.some(p => p.accessLevel === 'ADMIN');
    }

    /**
     * Get token history
     */
    async getTokenHistory(ctx, tokenID) {
        const iterator = await ctx.stub.getHistoryForKey(tokenID);
        const history = [];
        
        for await (const res of iterator) {
            const tx = {
                txId: res.txId,
                timestamp: res.timestamp,
                isDelete: res.isDelete,
                value: res.isDelete ? null : JSON.parse(res.value.toString())
            };
            history.push(tx);
        }
        
        return history;
    }
}

module.exports = AccessControlContract;