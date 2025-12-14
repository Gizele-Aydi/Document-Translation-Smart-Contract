'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Identity & Licensing Smart Contract
 * Manages digital identities for translators, officials, notaries, embassies
 * Controls activation, expiration, and revocation of licenses
 */
class IdentityContract extends Contract {

    // Helper function to get deterministic timestamp
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

    async initLedger(ctx) {
        console.info('Identity Contract Ledger Initialized');
    }

    // -------------------- Identity Registration --------------------

    /**
     * Register a new identity/license
     * @param {Context} ctx - Transaction context
     * @param {string} identityID - Unique identity ID (hashed)
     * @param {string} role - Role type: TRANSLATOR, MOJ_OFFICER, MOFA_OFFICER, EMBASSY_OFFICER, NOTARY, CITIZEN
     * @param {string} name - Full name of the entity
     * @param {string} certificateHash - Hash of professional certificate
     * @param {string} validFrom - ISO date string
     * @param {string} validUntil - ISO date string
     * @param {string} issuingAuthority - Authority that issued the license
     */
    async registerIdentity(ctx, identityID, role, name, certificateHash, validFrom, validUntil, issuingAuthority) {
        // Check if identity already exists
        const existingIdentity = await ctx.stub.getState(identityID);
        if (existingIdentity && existingIdentity.length > 0) {
            throw new Error(`Identity ${identityID} already exists`);
        }

        const validRoles = ['TRANSLATOR', 'MOJ_OFFICER', 'MOFA_OFFICER', 'EMBASSY_OFFICER', 'NOTARY', 'CITIZEN', 'COMPETENT_AUTHORITY'];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
        }

        const identity = {
            docType: 'identity',
            identityID,
            role,
            name,
            certificateHash,
            validFrom,
            validUntil,
            revocationStatus: 'ACTIVE',
            issuingAuthority,
            registrationTimestamp: this._getTxTimestamp(ctx),
            suspensionHistory: []
        };

        await ctx.stub.putState(identityID, Buffer.from(JSON.stringify(identity)));
        
        // Create composite key for querying by role
        const roleKey = ctx.stub.createCompositeKey('role~identity', [role, identityID]);
        await ctx.stub.putState(roleKey, Buffer.from('\u0000'));

        return identity;
    }

    // -------------------- Identity Retrieval --------------------

    /**
     * Get identity by ID
     */
    async getIdentity(ctx, identityID) {
        const identityBytes = await ctx.stub.getState(identityID);
        if (!identityBytes || identityBytes.length === 0) {
            throw new Error(`Identity ${identityID} does not exist`);
        }
        return JSON.parse(identityBytes.toString());
    }

    /**
     * Verify if a license is currently valid
     * @returns {object} - { isValid: boolean, reason: string }
     */
    async verifyLicense(ctx, identityID) {
        const identity = await this.getIdentity(ctx, identityID);
        
        // Use the transaction timestamp for deterministic "now"
        const txTimestamp = ctx.stub.getTxTimestamp();
        const now = new Date(txTimestamp.seconds.toInt() * 1000); 
        
        const validFrom = new Date(identity.validFrom);
        const validUntil = new Date(identity.validUntil);

        if (identity.revocationStatus === 'REVOKED') {
            return { isValid: false, reason: 'License has been permanently revoked', identity };
        }

        if (identity.revocationStatus === 'SUSPENDED') {
            return { isValid: false, reason: 'License is currently suspended', identity };
        }

        if (now < validFrom) {
            return { isValid: false, reason: 'License is not yet valid', identity };
        }

        if (now > validUntil) {
            return { isValid: false, reason: 'License has expired', identity };
        }

        return { isValid: true, reason: 'License is valid', identity };
    }

    /**
     * Get all identities by role
     */
    async getIdentitiesByRole(ctx, role) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('role~identity', [role]);
        const identities = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const identityID = compositeKey.attributes[1];
            const identity = await this.getIdentity(ctx, identityID);
            
            // Only return active identities
            if (identity.revocationStatus === 'ACTIVE') {
                identities.push(identity);
            }
        }

        return identities;
    }

    /**
     * Get all valid translators
     */
    async getValidTranslators(ctx) {
        const translators = await this.getIdentitiesByRole(ctx, 'TRANSLATOR');
        const validTranslators = [];
        
        for (const translator of translators) {
            const verification = await this.verifyLicense(ctx, translator.identityID);
            if (verification.isValid) {
                validTranslators.push(translator);
            }
        }
        
        return validTranslators;
    }

    // -------------------- License Management --------------------

    /**
     * Suspend a license temporarily
     */
    async suspendLicense(ctx, identityID, reason, suspendedBy) {
        const identity = await this.getIdentity(ctx, identityID);

        if (identity.revocationStatus === 'REVOKED') {
            throw new Error('Cannot suspend a revoked license');
        }

        identity.revocationStatus = 'SUSPENDED';
        identity.suspensionHistory.push({
            action: 'SUSPENDED',
            reason,
            by: suspendedBy,
            timestamp: this._getTxTimestamp(ctx)
        });

        await ctx.stub.putState(identityID, Buffer.from(JSON.stringify(identity)));
        return identity;
    }

    /**
     * Reinstate a suspended license
     */
    async reinstateLicense(ctx, identityID, reinstatedBy) {
        const identity = await this.getIdentity(ctx, identityID);

        if (identity.revocationStatus !== 'SUSPENDED') {
            throw new Error('Can only reinstate a suspended license');
        }

        identity.revocationStatus = 'ACTIVE';
        identity.suspensionHistory.push({
            action: 'REINSTATED',
            by: reinstatedBy,
            timestamp: this._getTxTimestamp(ctx)
        });

        await ctx.stub.putState(identityID, Buffer.from(JSON.stringify(identity)));
        return identity;
    }

    /**
     * Permanently revoke a license
     */
    async revokeLicense(ctx, identityID, reason, revokedBy) {
        const identity = await this.getIdentity(ctx, identityID);

        if (identity.revocationStatus === 'REVOKED') {
            throw new Error('License is already revoked');
        }

        identity.revocationStatus = 'REVOKED';
        identity.revocationReason = reason;
        identity.revokedBy = revokedBy;
        identity.revocationTimestamp = this._getTxTimestamp(ctx);

        await ctx.stub.putState(identityID, Buffer.from(JSON.stringify(identity)));
        
        return identity;
    }

    /**
     * Renew/extend a license validity period
     */
    async renewLicense(ctx, identityID, newValidUntil, renewedBy) {
        const identity = await this.getIdentity(ctx, identityID);

        if (identity.revocationStatus === 'REVOKED') {
            throw new Error('Cannot renew a revoked license');
        }

        const oldValidUntil = identity.validUntil;
        identity.validUntil = newValidUntil;
        identity.revocationStatus = 'ACTIVE'; // Reactivate if was suspended
        
        if (!identity.renewalHistory) {
            identity.renewalHistory = [];
        }
        
        identity.renewalHistory.push({
            oldValidUntil,
            newValidUntil,
            renewedBy,
            timestamp: this._getTxTimestamp(ctx)
        });

        await ctx.stub.putState(identityID, Buffer.from(JSON.stringify(identity)));
        return identity;
    }

    /**
     * Update identity certificate hash (for certificate renewal)
     */
    async updateCertificate(ctx, identityID, newCertificateHash, updatedBy) {
        const identity = await this.getIdentity(ctx, identityID);

        identity.certificateHash = newCertificateHash;
        identity.lastCertificateUpdate = {
            updatedBy,
            timestamp: this._getTxTimestamp(ctx)
        };

        await ctx.stub.putState(identityID, Buffer.from(JSON.stringify(identity)));
        return identity;
    }

    // -------------------- Query Functions --------------------

    /**
     * Check if an identity has a specific role
     */
    async hasRole(ctx, identityID, requiredRole) {
        try {
            const identity = await this.getIdentity(ctx, identityID);
            const verification = await this.verifyLicense(ctx, identityID);
            
            return {
                hasRole: identity.role === requiredRole && verification.isValid,
                identity,
                verification
            };
        } catch (error) {
            return { hasRole: false, error: error.message };
        }
    }

    /**
     * Get identity history
     */
    async getIdentityHistory(ctx, identityID) {
        const iterator = await ctx.stub.getHistoryForKey(identityID);
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

module.exports = IdentityContract;