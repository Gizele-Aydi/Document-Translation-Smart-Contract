'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Attestation Smart Contract
 * Creates and verifies Attestation Assets (legalization, notarization, etc.)
 * Links them to documents and responsible institutions
 */
class AttestationContract extends Contract {

    async initLedger(ctx) {
        console.info('Attestation Contract Ledger Initialized');
    }

    // -------------------- Attestation Creation --------------------

    /**
     * Create an attestation asset
     * @param {string} attestationID - Unique attestation ID (hashed)
     * @param {string} issuerID - Authority/Institution ID
     * @param {string} documentHash - Reference to the document
     * @param {string} type - APOSTILLE, LEGALIZATION, NOTARIZATION
     * @param {string} signatureHash - e-seal or digital signature hash
     * @param {string} policyReference - Legal framework reference
     */
    async createAttestation(ctx, attestationID, issuerID, documentHash, type, signatureHash, policyReference) {
        const existingAtt = await ctx.stub.getState(attestationID);
        if (existingAtt && existingAtt.length > 0) {
            throw new Error(`Attestation ${attestationID} already exists`);
        }

        const validTypes = ['APOSTILLE', 'LEGALIZATION', 'NOTARIZATION'];
        if (!validTypes.includes(type)) {
            throw new Error(`Invalid attestation type: ${type}. Must be one of: ${validTypes.join(', ')}`);
        }

        const attestation = {
            docType: 'attestation',
            attestationID,
            issuerID,
            documentHash,
            type,
            signatureHash,
            timestamp: new Date().toISOString(),
            validityStatus: 'VALID',
            policyReference,
            expiryDate: null, // Can be set for time-limited attestations
            revocationHistory: []
        };

        await ctx.stub.putState(attestationID, Buffer.from(JSON.stringify(attestation)));

        // Create composite keys for lookups
        const docKey = ctx.stub.createCompositeKey('document~attestation', [documentHash, attestationID]);
        await ctx.stub.putState(docKey, Buffer.from('\u0000'));

        const issuerKey = ctx.stub.createCompositeKey('issuer~attestation', [issuerID, attestationID]);
        await ctx.stub.putState(issuerKey, Buffer.from('\u0000'));

        const typeKey = ctx.stub.createCompositeKey('type~attestation', [type, attestationID]);
        await ctx.stub.putState(typeKey, Buffer.from('\u0000'));

        return attestation;
    }

    /**
     * Get attestation by ID
     */
    async getAttestation(ctx, attestationID) {
        const attBytes = await ctx.stub.getState(attestationID);
        if (!attBytes || attBytes.length === 0) {
            throw new Error(`Attestation ${attestationID} does not exist`);
        }
        return JSON.parse(attBytes.toString());
    }

    // -------------------- Attestation Verification --------------------

    /**
     * Verify an attestation
     * @returns {object} - Verification result
     */
    async verifyAttestation(ctx, attestationID) {
        try {
            const attestation = await this.getAttestation(ctx, attestationID);
            const now = new Date();

            // Check validity status
            if (attestation.validityStatus !== 'VALID') {
                return {
                    isValid: false,
                    reason: `Attestation status: ${attestation.validityStatus}`,
                    attestation
                };
            }

            // Check expiry if set
            if (attestation.expiryDate && new Date(attestation.expiryDate) < now) {
                return {
                    isValid: false,
                    reason: 'Attestation has expired',
                    attestation
                };
            }

            return {
                isValid: true,
                reason: 'Attestation is valid',
                type: attestation.type,
                issuer: attestation.issuerID,
                timestamp: attestation.timestamp,
                attestation
            };
        } catch (error) {
            return {
                isValid: false,
                reason: 'Attestation not found',
                error: error.message
            };
        }
    }

    /**
     * Get all attestations for a document
     */
    async getAttestationsByDocument(ctx, documentHash) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('document~attestation', [documentHash]);
        const attestations = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const attestationID = compositeKey.attributes[1];
            const attestation = await this.getAttestation(ctx, attestationID);
            attestations.push(attestation);
        }

        return attestations;
    }

    /**
     * Get all attestations by issuer
     */
    async getAttestationsByIssuer(ctx, issuerID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('issuer~attestation', [issuerID]);
        const attestations = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const attestationID = compositeKey.attributes[1];
            const attestation = await this.getAttestation(ctx, attestationID);
            attestations.push(attestation);
        }

        return attestations;
    }

    /**
     * Get attestations by type
     */
    async getAttestationsByType(ctx, type) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('type~attestation', [type]);
        const attestations = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const attestationID = compositeKey.attributes[1];
            const attestation = await this.getAttestation(ctx, attestationID);
            attestations.push(attestation);
        }

        return attestations;
    }

    // -------------------- Attestation Management --------------------

    /**
     * Update validity status
     */
    async updateValidity(ctx, attestationID, newStatus, reason, updatedBy) {
        const attestation = await this.getAttestation(ctx, attestationID);

        const validStatuses = ['VALID', 'EXPIRED', 'REVOKED', 'SUSPENDED'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        const previousStatus = attestation.validityStatus;
        attestation.validityStatus = newStatus;
        attestation.revocationHistory.push({
            previousStatus,
            newStatus,
            reason,
            updatedBy,
            timestamp: new Date().toISOString()
        });

        await ctx.stub.putState(attestationID, Buffer.from(JSON.stringify(attestation)));
        return attestation;
    }

    /**
     * Revoke an attestation
     */
    async revokeAttestation(ctx, attestationID, reason, revokedBy) {
        return await this.updateValidity(ctx, attestationID, 'REVOKED', reason, revokedBy);
    }

    /**
     * Set expiry date for attestation
     */
    async setExpiryDate(ctx, attestationID, expiryDate, setBy) {
        const attestation = await this.getAttestation(ctx, attestationID);
        
        attestation.expiryDate = expiryDate;
        attestation.expirySetBy = setBy;
        attestation.expirySetAt = new Date().toISOString();

        await ctx.stub.putState(attestationID, Buffer.from(JSON.stringify(attestation)));
        return attestation;
    }

    /**
     * Get attestation history
     */
    async getAttestationHistory(ctx, attestationID) {
        const iterator = await ctx.stub.getHistoryForKey(attestationID);
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
     * Verify document has all required attestations
     */
    async verifyDocumentAttestations(ctx, documentHash, requiredTypes) {
        const attestations = await this.getAttestationsByDocument(ctx, documentHash);
        const required = JSON.parse(requiredTypes);
        
        const results = {};
        const missing = [];

        for (const type of required) {
            const matching = attestations.find(a => a.type === type && a.validityStatus === 'VALID');
            if (matching) {
                results[type] = { found: true, attestation: matching };
            } else {
                results[type] = { found: false };
                missing.push(type);
            }
        }

        return {
            allPresent: missing.length === 0,
            results,
            missing,
            totalAttestations: attestations.length
        };
    }
}

module.exports = AttestationContract;
