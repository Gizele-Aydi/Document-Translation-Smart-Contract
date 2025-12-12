'use strict';

const { Contract } = require('fabric-contract-api');

class DocumentTranslationContract extends Contract {

    async initLedger(ctx) {
        console.info('Ledger initialized');
    }

    // -------------------- Document Functions --------------------

    async registerDocument(ctx, documentID, ownerID, issuer, docType) {
        const document = {
            documentID,
            ownerID,
            issuer,
            docType,
            status: 'SUBMITTED',
            submissionTimestamp: new Date().toISOString(),
            translations: []
        };
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    async getDocument(ctx, documentID) {
        const documentBytes = await ctx.stub.getState(documentID);
        if (!documentBytes || documentBytes.length === 0) {
            throw new Error(`Document ${documentID} does not exist`);
        }
        return JSON.parse(documentBytes.toString());
    }

    // -------------------- Translation Functions --------------------

    async assignTranslator(ctx, documentID, translatorID) {
        const document = await this.getDocument(ctx, documentID);
        
        // Allow assignment for both SUBMITTED and REQUIRES_RESUBMISSION statuses
        if (document.status !== 'SUBMITTED' && document.status !== 'REQUIRES_RESUBMISSION') {
            throw new Error('Document must be in SUBMITTED or REQUIRES_RESUBMISSION status to assign translator');
        }
        
        document.translatorID = translatorID;
        document.status = 'IN_TRANSLATION';
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
        document.status = 'REQUIRES_RESUBMISSION';
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return translation;
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
}

module.exports = DocumentTranslationContract;