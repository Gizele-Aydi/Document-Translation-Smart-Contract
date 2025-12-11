'use strict';

const { expect } = require('chai');
const { Context } = require('fabric-contract-api');
const DocumentTranslationContract = require('../lib/documentTranslationContract.js');

describe('DocumentTranslationContract - Full Functionality', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new DocumentTranslationContract();

        // In-memory mock ledger
        const ledger = {};

        ctx = new Context();
        ctx.stub = {
            putState: async (key, value) => {
                ledger[key] = value.toString();
            },
            getState: async (key) => {
                return ledger[key] ? Buffer.from(ledger[key]) : null;
            },
            deleteState: async (key) => {
                delete ledger[key];
            },
            getStateByRange: async () => {
                // Simple iterator for testing all entries
                const allValues = Object.keys(ledger).map(k => ({ key: k, value: Buffer.from(ledger[k]) }));
                return {
                    async *[Symbol.asyncIterator]() {
                        for (const val of allValues) yield val;
                    }
                };
            }
        };
    });

    it('should register a new document', async () => {
        const doc = await contract.registerDocument(ctx, 'DOC100', 'CITIZEN1', 'University1', 'Diploma');
        expect(doc.documentId).to.equal('DOC100');
        expect(doc.status).to.equal('SUBMITTED');
    });

    it('should assign translator to document', async () => {
        await contract.registerDocument(ctx, 'DOC101', 'CITIZEN2', 'University1', 'Transcript');
        const assigned = await contract.assignTranslator(ctx, 'DOC101', 'TRANSLATOR1');
        expect(assigned.translatorID).to.equal('TRANSLATOR1');
        const doc = await contract.getDocument(ctx, 'DOC101');
        expect(doc.status).to.equal('IN_TRANSLATION');
    });

    it('should submit a translation', async () => {
        await contract.registerDocument(ctx, 'DOC102', 'CITIZEN3', 'University1', 'Diploma');
        await contract.assignTranslator(ctx, 'DOC102', 'TRANSLATOR2');
        const translation = await contract.submitTranslation(ctx, 'DOC102', 'TRANS100', 'French');
        expect(translation.translationID).to.equal('TRANS100');
        expect(translation.verificationStatus).to.equal('PENDING');

        const doc = await contract.getDocument(ctx, 'DOC102');
        expect(doc.translations).to.have.lengthOf(1);
        expect(doc.status).to.equal('IN_TRANSLATION');
    });

    it('should QA approve a translation', async () => {
        await contract.registerDocument(ctx, 'DOC103', 'CITIZEN4', 'University1', 'Diploma');
        await contract.assignTranslator(ctx, 'DOC103', 'TRANSLATOR3');
        await contract.submitTranslation(ctx, 'DOC103', 'TRANS101', 'Arabic');
        const approved = await contract.qaApproveTranslation(ctx, 'DOC103', 'TRANS101', 'QA1');
        expect(approved.verificationStatus).to.equal('QA_APPROVED');
        expect(approved.qaSignature).to.equal('QA1');

        const doc = await contract.getDocument(ctx, 'DOC103');
        expect(doc.status).to.equal('QA_COMPLETED');
    });

    it('should QA reject a translation and allow resubmission', async () => {
        await contract.registerDocument(ctx, 'DOC104', 'CITIZEN5', 'University1', 'Transcript');
        await contract.assignTranslator(ctx, 'DOC104', 'TRANSLATOR4');
        await contract.submitTranslation(ctx, 'DOC104', 'TRANS102', 'English');

        const rejected = await contract.rejectTranslation(ctx, 'DOC104', 'TRANS102', 'Errors found');
        expect(rejected.verificationStatus).to.equal('REJECTED');
        expect(rejected.rejectionReason).to.equal('Errors found');

        const doc = await contract.getDocument(ctx, 'DOC104');
        expect(doc.status).to.equal('REQUIRES_RESUBMISSION');

        // Reassign another translator
        await contract.assignTranslator(ctx, 'DOC104', 'TRANSLATOR5');
        const translation2 = await contract.submitTranslation(ctx, 'DOC104', 'TRANS103', 'English');
        const approved = await contract.qaApproveTranslation(ctx, 'DOC104', 'TRANS103', 'QA2');
        expect(approved.verificationStatus).to.equal('QA_APPROVED');
        expect(approved.qaSignature).to.equal('QA2');

        const docFinal = await contract.getDocument(ctx, 'DOC104');
        expect(docFinal.status).to.equal('QA_COMPLETED');
        expect(docFinal.translations).to.have.lengthOf(2);
    });

    it('should retrieve document history (all translations)', async () => {
        await contract.registerDocument(ctx, 'DOC105', 'CITIZEN6', 'University1', 'Diploma');
        await contract.assignTranslator(ctx, 'DOC105', 'TRANSLATOR6');
        await contract.submitTranslation(ctx, 'DOC105', 'TRANS104', 'French');
        await contract.qaApproveTranslation(ctx, 'DOC105', 'TRANS104', 'QA1');

        await contract.assignTranslator(ctx, 'DOC105', 'TRANSLATOR7');
        await contract.submitTranslation(ctx, 'DOC105', 'TRANS105', 'Arabic');
        await contract.qaApproveTranslation(ctx, 'DOC105', 'TRANS105', 'QA2');

        const history = await contract.getDocumentHistory(ctx, 'DOC105');
        expect(history).to.have.lengthOf(2);
        expect(history.map(t => t.translationID)).to.include.members(['TRANS104', 'TRANS105']);
    });

});
