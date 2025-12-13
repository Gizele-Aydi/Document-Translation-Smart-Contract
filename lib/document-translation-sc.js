'use strict';

const { Contract } = require('fabric-contract-api');

class DocumentTranslationContract extends Contract {

    async initLedger(ctx) {
        console.info('Ledger initialized');
    }

    // -------------------- Document Functions --------------------

    async registerDocument(ctx, documentID, ownerID, issuer, docType, encryptionMetadata = '{}') {
        const existingDoc = await ctx.stub.getState(documentID);
        if (existingDoc && existingDoc.length > 0) {
            throw new Error(`Document ${documentID} already exists`);
        }

        const document = {
            docType: 'document',
            documentID,
            ownerID,
            issuer,
            documentType: docType,
            status: 'SUBMITTED',
            submissionTimestamp: new Date().toISOString(),
            translations: [],
            encryptionMetadata: JSON.parse(encryptionMetadata),
            legalizationID: null,
            apostilleID: null,
            finalizedAt: null
        };
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        
        // Create composite key for owner lookup
        const ownerKey = ctx.stub.createCompositeKey('owner~document', [ownerID, documentID]);
        await ctx.stub.putState(ownerKey, Buffer.from('\u0000'));

        return document;
    }

    async getDocument(ctx, documentID) {
        const documentBytes = await ctx.stub.getState(documentID);
        if (!documentBytes || documentBytes.length === 0) {
            throw new Error(`Document ${documentID} does not exist`);
        }
        return JSON.parse(documentBytes.toString());
    }

    async getDocumentsByOwner(ctx, ownerID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('owner~document', [ownerID]);
        const documents = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const documentID = compositeKey.attributes[1];
            const document = await this.getDocument(ctx, documentID);
            documents.push(document);
        }

        return documents;
    }

    // -------------------- Translation Functions --------------------

    async assignTranslator(ctx, documentID, translatorID) {
        const document = await this.getDocument(ctx, documentID);
        
        if (document.status !== 'SUBMITTED' && document.status !== 'REQUIRES_RESUBMISSION') {
            throw new Error('Document must be in SUBMITTED or REQUIRES_RESUBMISSION status to assign translator');
        }
        
        document.translatorID = translatorID;
        document.status = 'IN_TRANSLATION';
        document.assignedAt = new Date().toISOString();
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    async submitTranslation(ctx, documentID, translationID, targetLanguage, qaSignature = '') {
        const document = await this.getDocument(ctx, documentID);
        if (document.status !== 'IN_TRANSLATION') {
            throw new Error('Document must be in IN_TRANSLATION status to submit translation');
        }
        const translationRecord = {
            translationID,
            translatorID: document.translatorID,
            targetLanguage,
            timestamp: new Date().toISOString(),
            qaSignature,
            verificationStatus: qaSignature ? 'QA_PASSED' : 'PENDING_QA'
        };
        document.translations.push(translationRecord);
        document.status = 'TRANSLATED';
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return translationRecord;
    }

    // -------------------- QA Functions --------------------

    async qaApproveTranslation(ctx, documentID, translationID, qaOfficerID) {
        const document = await this.getDocument(ctx, documentID);
        const translation = document.translations.find(t => t.translationID === translationID);
        if (!translation) throw new Error(`Translation ${translationID} not found`);
        translation.qaSignature = qaOfficerID;
        translation.verificationStatus = 'QA_APPROVED';
        translation.qaApprovedAt = new Date().toISOString();
        document.status = 'QA_COMPLETED';
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return translation;
    }

    async rejectTranslation(ctx, documentID, translationID, reason) {
        const document = await this.getDocument(ctx, documentID);
        const translation = document.translations.find(t => t.translationID === translationID);
        if (!translation) throw new Error(`Translation ${translationID} not found`);
        translation.verificationStatus = 'REJECTED';
        translation.rejectionReason = reason;
        translation.rejectedAt = new Date().toISOString();
        document.status = 'REQUIRES_RESUBMISSION';
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return translation;
    }

    // -------------------- MoJ Approval Functions --------------------

    async mojApproveTranslation(ctx, documentID, mojOfficerID) {
        const document = await this.getDocument(ctx, documentID);
        
        if (document.status !== 'QA_COMPLETED') {
            throw new Error('Document must be in QA_COMPLETED status for MoJ approval');
        }

        document.status = 'MOJ_APPROVED';
        document.mojApproval = {
            officerID: mojOfficerID,
            timestamp: new Date().toISOString()
        };

        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    async mojRejectTranslation(ctx, documentID, mojOfficerID, reason) {
        const document = await this.getDocument(ctx, documentID);
        
        if (document.status !== 'QA_COMPLETED') {
            throw new Error('Document must be in QA_COMPLETED status for MoJ rejection');
        }

        document.status = 'MOJ_REJECTED';
        document.mojRejection = {
            officerID: mojOfficerID,
            reason,
            timestamp: new Date().toISOString()
        };

        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    // -------------------- Legalization & Apostille Links --------------------

    async linkLegalization(ctx, documentID, legalizationID) {
        const document = await this.getDocument(ctx, documentID);
        document.legalizationID = legalizationID;
        document.status = 'IN_LEGALIZATION';
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    async linkApostille(ctx, documentID, apostilleID) {
        const document = await this.getDocument(ctx, documentID);
        document.apostilleID = apostilleID;
        document.status = 'APOSTILLED';
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    async updateStatus(ctx, documentID, newStatus) {
        const validStatuses = [
            'SUBMITTED', 'IN_TRANSLATION', 'TRANSLATED', 'QA_COMPLETED', 
            'REQUIRES_RESUBMISSION', 'MOJ_APPROVED', 'MOJ_REJECTED',
            'IN_LEGALIZATION', 'LEGALIZED', 'APOSTILLED', 'FINALIZED'
        ];
        
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        const document = await this.getDocument(ctx, documentID);
        document.status = newStatus;
        document.statusUpdatedAt = new Date().toISOString();
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    // -------------------- Finalization --------------------

    async finalizeDocument(ctx, documentID) {
        const document = await this.getDocument(ctx, documentID);
        
        if (document.status !== 'APOSTILLED' && document.status !== 'LEGALIZED') {
            throw new Error('Document must be APOSTILLED or LEGALIZED to finalize');
        }

        document.status = 'FINALIZED';
        document.finalizedAt = new Date().toISOString();

        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    // -------------------- Encryption Metadata --------------------

    async updateEncryptionMetadata(ctx, documentID, encryptionMetadata) {
        const document = await this.getDocument(ctx, documentID);
        document.encryptionMetadata = JSON.parse(encryptionMetadata);
        document.encryptionUpdatedAt = new Date().toISOString();
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    // -------------------- History & Audit --------------------

    async getDocumentHistory(ctx, documentID) {
        const iterator = await ctx.stub.getHistoryForKey(documentID);
        const history = [];
        for await (const res of iterator) {
            const tx = {
                txId: res.txId,
                timestamp: res.timestamp,
                value: res.isDelete ? null : JSON.parse(res.value.toString())
            };
            history.push(tx);
        }
        return history;
    }

    // -------------------- Query Functions --------------------

    async getDocumentsByStatus(ctx, status) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const documents = [];

        for await (const result of iterator) {
            try {
                const value = JSON.parse(result.value.toString());
                if (value.docType === 'document' && value.status === status) {
                    documents.push(value);
                }
            } catch (e) {
                continue;
            }
        }

        return documents;
    }

    async getPendingTranslations(ctx) {
        return await this.getDocumentsByStatus(ctx, 'SUBMITTED');
    }

    async getInProgressTranslations(ctx) {
        return await this.getDocumentsByStatus(ctx, 'IN_TRANSLATION');
    }

    async getPendingQADocuments(ctx) {
        return await this.getDocumentsByStatus(ctx, 'TRANSLATED');
    }

    async getPendingMoJApproval(ctx) {
        return await this.getDocumentsByStatus(ctx, 'QA_COMPLETED');
    }
}

module.exports = DocumentTranslationContract;