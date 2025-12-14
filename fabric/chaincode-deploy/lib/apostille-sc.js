'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Apostille Smart Contract
 * Manages Apostille certificate creation, e-seal, and validation
 * Ensures only Competent Authority can issue certificates
 */
class ApostilleContract extends Contract {
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
        console.info('Apostille Contract Ledger Initialized');
    }

    // -------------------- Apostille Requests --------------------

    /**
     * Request an Apostille for a document
     * @param {string} requestID - Unique request ID
     * @param {string} documentID - Document to apostille
     * @param {string} translationID - Optional translation reference
     * @param {string} requestorID - Who is requesting
     */
    async requestApostille(ctx, requestID, documentID, translationID, requestorID) {
        const existingRequest = await ctx.stub.getState(requestID);
        if (existingRequest && existingRequest.length > 0) {
            throw new Error(`Apostille request ${requestID} already exists`);
        }

        const request = {
            docType: 'apostilleRequest',
            requestID,
            documentID,
            translationID: translationID || null,
            requestorID,
            status: 'PENDING',
            requestedAt: this._getTxTimestamp(ctx),
            apostilleID: null
        };

        await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(request)));

        // Create composite key for document lookup
        const docKey = ctx.stub.createCompositeKey('document~apostilleRequest', [documentID, requestID]);
        await ctx.stub.putState(docKey, Buffer.from('\u0000'));

        return request;
    }

    /**
     * Get apostille request
     */
    async getApostilleRequest(ctx, requestID) {
        const reqBytes = await ctx.stub.getState(requestID);
        if (!reqBytes || reqBytes.length === 0) {
            throw new Error(`Apostille request ${requestID} does not exist`);
        }
        return JSON.parse(reqBytes.toString());
    }

    // -------------------- Apostille Issuance --------------------

    /**
     * Issue an Apostille certificate (only by Competent Authority)
     * @param {string} apostilleID - Unique Apostille ID (hashed)
     * @param {string} requestID - Original request ID
     * @param {string} authorityID - Competent Authority ID
     * @param {string} eSealSignature - Digital e-seal signature
     * @param {string} apostilleNumber - Official Apostille number
     */
    async issueApostille(ctx, apostilleID, requestID, authorityID, eSealSignature, apostilleNumber) {
        // Check for existing apostille
        const existingApostille = await ctx.stub.getState(apostilleID);
        if (existingApostille && existingApostille.length > 0) {
            throw new Error(`Apostille ${apostilleID} already exists`);
        }

        // Get and verify request
        const request = await this.getApostilleRequest(ctx, requestID);
        if (request.status !== 'PENDING') {
            throw new Error(`Request ${requestID} is not pending. Current status: ${request.status}`);
        }

        const apostille = {
            docType: 'apostilleCertificate',
            apostilleID,
            apostilleNumber,
            documentHash: request.documentID,
            translationHash: request.translationID,
            issuingAuthority: authorityID,
            issueDate: this._getTxTimestamp(ctx),
            eSealSignature,
            validationStatus: 'ISSUED',
            requestID
        };

        await ctx.stub.putState(apostilleID, Buffer.from(JSON.stringify(apostille)));

        // Update request status
        request.status = 'ISSUED';
        request.apostilleID = apostilleID;
        request.issuedAt = this._getTxTimestamp(ctx);
        await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(request)));

        // Create composite key for document lookup
        const docKey = ctx.stub.createCompositeKey('document~apostille', [request.documentID, apostilleID]);
        await ctx.stub.putState(docKey, Buffer.from('\u0000'));

        return { apostille, request };
    }

    /**
     * Get Apostille certificate
     */
    async getApostille(ctx, apostilleID) {
        const apoBytes = await ctx.stub.getState(apostilleID);
        if (!apoBytes || apoBytes.length === 0) {
            throw new Error(`Apostille ${apostilleID} does not exist`);
        }
        return JSON.parse(apoBytes.toString());
    }

    /**
     * Verify an Apostille certificate (public verification)
     * @returns {object} - Verification result with limited info for privacy
     */
    async verifyApostille(ctx, apostilleID) {
        try {
            const apostille = await this.getApostille(ctx, apostilleID);
            
            return {
                isValid: apostille.validationStatus === 'ISSUED',
                apostilleNumber: apostille.apostilleNumber,
                issueDate: apostille.issueDate,
                issuingAuthority: apostille.issuingAuthority,
                validationStatus: apostille.validationStatus,
                message: apostille.validationStatus === 'ISSUED' 
                    ? 'Apostille certificate is valid' 
                    : `Apostille status: ${apostille.validationStatus}`
            };
        } catch (error) {
            return {
                isValid: false,
                message: 'Apostille certificate not found or invalid'
            };
        }
    }

    /**
     * Verify Apostille by document ID
     */
    async verifyApostilleByDocument(ctx, documentID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('document~apostille', [documentID]);
        const apostilles = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const apostilleID = compositeKey.attributes[1];
            const verification = await this.verifyApostille(ctx, apostilleID);
            apostilles.push({ apostilleID, ...verification });
        }

        if (apostilles.length === 0) {
            return { hasApostille: false, message: 'No Apostille found for this document' };
        }

        const validApostille = apostilles.find(a => a.isValid);
        return {
            hasApostille: true,
            isValid: !!validApostille,
            apostilles
        };
    }

    // -------------------- Apostille Management --------------------

    /**
     * Revoke an Apostille certificate
     */
    async revokeApostille(ctx, apostilleID, reason, revokedBy) {
        const apostille = await this.getApostille(ctx, apostilleID);

        if (apostille.validationStatus === 'REVOKED') {
            throw new Error('Apostille is already revoked');
        }

        apostille.validationStatus = 'REVOKED';
        apostille.revocationReason = reason;
        apostille.revokedBy = revokedBy;
        apostille.revokedAt = this._getTxTimestamp(ctx);

        await ctx.stub.putState(apostilleID, Buffer.from(JSON.stringify(apostille)));
        return apostille;
    }

    /**
     * Reject an Apostille request
     */
    async rejectApostilleRequest(ctx, requestID, reason, rejectedBy) {
        const request = await this.getApostilleRequest(ctx, requestID);

        if (request.status !== 'PENDING') {
            throw new Error(`Request ${requestID} is not pending`);
        }

        request.status = 'REJECTED';
        request.rejectionReason = reason;
        request.rejectedBy = rejectedBy;
        request.rejectedAt = this._getTxTimestamp(ctx);

        await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(request)));
        return request;
    }

    /**
     * Get all pending Apostille requests (for authority queue)
     */
    async getPendingRequests(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const pending = [];

        for await (const result of iterator) {
            try {
                const value = JSON.parse(result.value.toString());
                if (value.docType === 'apostilleRequest' && value.status === 'PENDING') {
                    pending.push(value);
                }
            } catch (e) {
                continue;
            }
        }

        return pending;
    }

    /**
     * Get Apostille history
     */
    async getApostilleHistory(ctx, apostilleID) {
        const iterator = await ctx.stub.getHistoryForKey(apostilleID);
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

    /**
     * Get all apostilles issued by an authority
     */
    async getApostillesByAuthority(ctx, authorityID) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const apostilles = [];

        for await (const result of iterator) {
            try {
                const value = JSON.parse(result.value.toString());
                if (value.docType === 'apostilleCertificate' && value.issuingAuthority === authorityID) {
                    apostilles.push(value);
                }
            } catch (e) {
                continue;
            }
        }

        return apostilles;
    }
}

module.exports = ApostilleContract;