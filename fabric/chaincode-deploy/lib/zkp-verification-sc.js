'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

/**
 * ZKP Verification Smart Contract
 * Generates and validates Zero-Knowledge Proofs for public verification
 * Allows verification without revealing document contents
 */
class ZKPVerificationContract extends Contract {

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
        console.info('ZKP Verification Contract Ledger Initialized');
    }

    // -------------------- Proof Generation --------------------

    /**
     * Generate a public verification proof
     * @param {string} proofID - Unique proof ID
     * @param {string} documentID - Document to create proof for
     * @param {string} proofType - EXISTENCE, AUTHENTICITY, TRANSLATION_COMPLETE, LEGALIZED, APOSTILLED
     * @param {string} generatedBy - Who generated the proof
     */
    async generateProof(ctx, proofID, documentID, proofType, generatedBy) {
        const existingProof = await ctx.stub.getState(proofID);
        if (existingProof && existingProof.length > 0) {
            throw new Error(`Proof ${proofID} already exists`);
        }

        const validTypes = ['EXISTENCE', 'AUTHENTICITY', 'TRANSLATION_COMPLETE', 'LEGALIZED', 'APOSTILLED'];
        if (!validTypes.includes(proofType)) {
            throw new Error(`Invalid proof type: ${proofType}. Must be one of: ${validTypes.join(', ')}`);
        }

        // Generate public hash (simulated ZKP - in production use actual ZKP library)
        const timestamp = this._getTxTimestamp(ctx);
        const publicHash = this._generatePublicHash(documentID, proofType, timestamp);
        const verificationKey = this._generateVerificationKey(publicHash);

        const proof = {
            docType: 'zkpProof',
            proofID,
            publicHash,
            zkpVerificationKey: verificationKey,
            proofTimestamp: timestamp,
            documentReference: this._obfuscateReference(documentID),
            proofType,
            generatedBy,
            isValid: true,
            invalidatedAt: null,
            invalidationReason: null
        };

        await ctx.stub.putState(proofID, Buffer.from(JSON.stringify(proof)));

        // Create composite key for public hash lookup
        const hashKey = ctx.stub.createCompositeKey('publicHash~proof', [publicHash, proofID]);
        await ctx.stub.putState(hashKey, Buffer.from('\u0000'));

        // Create composite key for document lookup (internal only)
        const docKey = ctx.stub.createCompositeKey('document~proof', [documentID, proofID]);
        await ctx.stub.putState(docKey, Buffer.from('\u0000'));

        return {
            proofID,
            publicHash,
            verificationKey,
            proofType,
            timestamp,
            message: 'Proof generated successfully. Share the publicHash for verification.'
        };
    }

    /**
     * Get proof by ID (internal use)
     */
    async getProof(ctx, proofID) {
        const proofBytes = await ctx.stub.getState(proofID);
        if (!proofBytes || proofBytes.length === 0) {
            throw new Error(`Proof ${proofID} does not exist`);
        }
        return JSON.parse(proofBytes.toString());
    }

    // -------------------- Public Verification --------------------

    /**
     * Verify a proof using public hash (no data exposure)
     * This is the main public-facing verification function
     */
    async verifyProof(ctx, publicHash) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('publicHash~proof', [publicHash]);
        
        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const proofID = compositeKey.attributes[1];
            
            try {
                const proof = await this.getProof(ctx, proofID);
                
                if (!proof.isValid) {
                    return {
                        verified: false,
                        reason: 'Proof has been invalidated',
                        invalidatedAt: proof.invalidatedAt,
                        invalidationReason: proof.invalidationReason
                    };
                }

                // Return verification result without exposing document details
                return {
                    verified: true,
                    proofType: proof.proofType,
                    proofTimestamp: proof.proofTimestamp,
                    message: `Document has been verified as: ${proof.proofType}`,
                    publicHash: proof.publicHash
                };
            } catch (e) {
                continue;
            }
        }

        return {
            verified: false,
            reason: 'No valid proof found for this hash'
        };
    }

    /**
     * Verify using verification key
     */
    async verifyWithKey(ctx, publicHash, verificationKey) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('publicHash~proof', [publicHash]);
        
        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const proofID = compositeKey.attributes[1];
            
            try {
                const proof = await this.getProof(ctx, proofID);
                
                if (proof.zkpVerificationKey !== verificationKey) {
                    return {
                        verified: false,
                        reason: 'Verification key mismatch'
                    };
                }

                if (!proof.isValid) {
                    return {
                        verified: false,
                        reason: 'Proof has been invalidated'
                    };
                }

                return {
                    verified: true,
                    proofType: proof.proofType,
                    proofTimestamp: proof.proofTimestamp,
                    message: `Verified with key: ${proof.proofType}`
                };
            } catch (e) {
                continue;
            }
        }

        return {
            verified: false,
            reason: 'Proof not found'
        };
    }

    // -------------------- Proof Management --------------------

    /**
     * Invalidate a proof
     */
    async invalidateProof(ctx, proofID, reason, invalidatedBy) {
        const proof = await this.getProof(ctx, proofID);

        if (!proof.isValid) {
            throw new Error('Proof is already invalid');
        }

        proof.isValid = false;
        proof.invalidatedAt = this._getTxTimestamp(ctx);
        proof.invalidationReason = reason;
        proof.invalidatedBy = invalidatedBy;

        await ctx.stub.putState(proofID, Buffer.from(JSON.stringify(proof)));
        return {
            proofID,
            publicHash: proof.publicHash,
            message: 'Proof has been invalidated'
        };
    }

    /**
     * Get all proofs for a document (internal use only)
     */
    async getProofsByDocument(ctx, documentID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('document~proof', [documentID]);
        const proofs = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const proofID = compositeKey.attributes[1];
            const proof = await this.getProof(ctx, proofID);
            proofs.push(proof);
        }

        return proofs;
    }

    /**
     * Get public verification info for sharing
     */
    async getPublicVerificationInfo(ctx, documentID) {
        const proofs = await this.getProofsByDocument(ctx, documentID);
        const validProofs = proofs.filter(p => p.isValid);

        return validProofs.map(proof => ({
            publicHash: proof.publicHash,
            proofType: proof.proofType,
            proofTimestamp: proof.proofTimestamp,
            verificationUrl: `/verify?hash=${proof.publicHash}`
        }));
    }

    // -------------------- Helper Functions --------------------

    /**
     * Generate public hash (simulated - use actual ZKP in production)
     */
    _generatePublicHash(documentID, proofType, timestamp) {
        const data = `${documentID}:${proofType}:${timestamp}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate verification key
     */
    _generateVerificationKey(publicHash) {
        const data = `${publicHash}:vkey`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
    }

    /**
     * Obfuscate document reference
     */
    _obfuscateReference(documentID) {
        return crypto.createHash('sha256').update(documentID).digest('hex').substring(0, 16);
    }

    /**
     * Get proof history
     */
    async getProofHistory(ctx, proofID) {
        const iterator = await ctx.stub.getHistoryForKey(proofID);
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

module.exports = ZKPVerificationContract;