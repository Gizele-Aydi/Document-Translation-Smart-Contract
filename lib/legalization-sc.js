'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Legalization Smart Contract
 * Orchestrates sequential legalization steps: MoJ → MoFA → Embassy/Consulate
 * Enforces ordering and prevents skipping steps
 */
class LegalizationContract extends Contract {

    async initLedger(ctx) {
        console.info('Legalization Contract Ledger Initialized');
    }

    // -------------------- Legalization Workflow --------------------

    /**
     * Initiate legalization process for a document
     * @param {Context} ctx - Transaction context
     * @param {string} legalizationID - Unique legalization workflow ID
     * @param {string} documentID - Document to be legalized
     * @param {string} requestorID - Who requested the legalization
     */
    async initiateLegalization(ctx, legalizationID, documentID, requestorID) {
        const existingLeg = await ctx.stub.getState(legalizationID);
        if (existingLeg && existingLeg.length > 0) {
            throw new Error(`Legalization ${legalizationID} already exists`);
        }

        const legalization = {
            docType: 'legalization',
            legalizationID,
            documentID,
            requestorID,
            currentStep: 0,
            status: 'INITIATED',
            initiatedAt: new Date().toISOString(),
            steps: [],
            completedAt: null
        };

        await ctx.stub.putState(legalizationID, Buffer.from(JSON.stringify(legalization)));

        // Create composite key for document lookup
        const docKey = ctx.stub.createCompositeKey('document~legalization', [documentID, legalizationID]);
        await ctx.stub.putState(docKey, Buffer.from('\u0000'));

        return legalization;
    }

    /**
     * Get legalization record
     */
    async getLegalization(ctx, legalizationID) {
        const legBytes = await ctx.stub.getState(legalizationID);
        if (!legBytes || legBytes.length === 0) {
            throw new Error(`Legalization ${legalizationID} does not exist`);
        }
        return JSON.parse(legBytes.toString());
    }

    /**
     * Validate a legalization step (MoJ, MoFA, or Embassy)
     * @param {string} stepType - MOJ, MOFA, or EMBASSY
     */
    async validateStep(ctx, legalizationID, recordID, officerID, institutionName, stepType) {
        const legalization = await this.getLegalization(ctx, legalizationID);
        
        const stepOrder = { 'MOJ': 1, 'MOFA': 2, 'EMBASSY': 3 };
        const requiredStep = stepOrder[stepType];

        if (!requiredStep) {
            throw new Error(`Invalid step type: ${stepType}. Must be MOJ, MOFA, or EMBASSY`);
        }

        // Enforce sequential order
        const expectedStep = legalization.currentStep + 1;
        if (requiredStep !== expectedStep) {
            if (requiredStep < expectedStep) {
                throw new Error(`Step ${stepType} has already been completed`);
            } else {
                const previousStepName = Object.keys(stepOrder).find(k => stepOrder[k] === expectedStep - 1) || 'Initiation';
                throw new Error(`Cannot perform ${stepType} step. Previous step (${previousStepName}) must be completed first`);
            }
        }

        const stepRecord = {
            recordID,
            stepType,
            stepOrder: requiredStep,
            institutionName,
            officerID,
            result: 'VALIDATED',
            timestamp: new Date().toISOString()
        };

        legalization.steps.push(stepRecord);
        legalization.currentStep = requiredStep;
        legalization.status = `${stepType}_VALIDATED`;

        // Check if workflow is complete
        if (requiredStep === 3) {
            legalization.status = 'COMPLETED';
            legalization.completedAt = new Date().toISOString();
        }

        await ctx.stub.putState(legalizationID, Buffer.from(JSON.stringify(legalization)));
        return { legalization, stepRecord };
    }

    /**
     * Reject a legalization step
     */
    async rejectStep(ctx, legalizationID, recordID, officerID, institutionName, stepType, reason) {
        const legalization = await this.getLegalization(ctx, legalizationID);
        
        const stepOrder = { 'MOJ': 1, 'MOFA': 2, 'EMBASSY': 3 };
        const requiredStep = stepOrder[stepType];

        if (!requiredStep) {
            throw new Error(`Invalid step type: ${stepType}`);
        }

        const expectedStep = legalization.currentStep + 1;
        if (requiredStep !== expectedStep) {
            throw new Error(`Cannot reject step ${stepType} at this time`);
        }

        const stepRecord = {
            recordID,
            stepType,
            stepOrder: requiredStep,
            institutionName,
            officerID,
            result: 'REJECTED',
            rejectionReason: reason,
            timestamp: new Date().toISOString()
        };

        legalization.steps.push(stepRecord);
        legalization.status = 'REJECTED';
        legalization.rejectedAt = new Date().toISOString();
        legalization.rejectionStep = stepType;

        await ctx.stub.putState(legalizationID, Buffer.from(JSON.stringify(legalization)));
        return { legalization, stepRecord };
    }

    /**
     * Get current legalization status for a document
     */
    async getLegalizationStatus(ctx, documentID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('document~legalization', [documentID]);
        const legalizations = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const legalizationID = compositeKey.attributes[1];
            const legalization = await this.getLegalization(ctx, legalizationID);
            legalizations.push(legalization);
        }

        if (legalizations.length === 0) {
            return { status: 'NOT_STARTED', message: 'No legalization process found for this document' };
        }

        // Return the most recent active legalization
        const activeLeg = legalizations.find(l => l.status !== 'REJECTED') || legalizations[legalizations.length - 1];
        
        return {
            status: activeLeg.status,
            currentStep: activeLeg.currentStep,
            legalizationID: activeLeg.legalizationID,
            steps: activeLeg.steps,
            allLegalizations: legalizations
        };
    }

    /**
     * Get full legalization chain - all steps for audit purposes
     */
    async getFullLegalizationChain(ctx, documentID) {
        const status = await this.getLegalizationStatus(ctx, documentID);
        
        if (status.status === 'NOT_STARTED') {
            return { chain: [], message: 'No legalization records found' };
        }

        const chain = status.allLegalizations.flatMap(leg => 
            leg.steps.map(step => ({
                ...step,
                legalizationID: leg.legalizationID,
                documentID: leg.documentID
            }))
        );

        return { 
            chain: chain.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
            currentStatus: status.status,
            currentStep: status.currentStep
        };
    }

    /**
     * Restart legalization after rejection (creates new workflow)
     */
    async restartLegalization(ctx, newLegalizationID, documentID, requestorID, previousLegalizationID) {
        const previousLeg = await this.getLegalization(ctx, previousLegalizationID);
        
        if (previousLeg.status !== 'REJECTED') {
            throw new Error('Can only restart a rejected legalization process');
        }

        const legalization = await this.initiateLegalization(ctx, newLegalizationID, documentID, requestorID);
        legalization.previousLegalizationID = previousLegalizationID;
        legalization.restartedFrom = previousLeg.rejectionStep;

        await ctx.stub.putState(newLegalizationID, Buffer.from(JSON.stringify(legalization)));
        return legalization;
    }

    /**
     * Get legalization history
     */
    async getLegalizationHistory(ctx, legalizationID) {
        const iterator = await ctx.stub.getHistoryForKey(legalizationID);
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
     * Get all pending legalizations for a specific step type (for officer queues)
     */
    async getPendingByStepType(ctx, stepType) {
        const stepOrder = { 'MOJ': 1, 'MOFA': 2, 'EMBASSY': 3 };
        const targetStep = stepOrder[stepType];

        if (!targetStep) {
            throw new Error(`Invalid step type: ${stepType}`);
        }

        // Query all legalizations - in production use rich queries with CouchDB
        const iterator = await ctx.stub.getStateByRange('', '');
        const pending = [];

        for await (const result of iterator) {
            try {
                const value = JSON.parse(result.value.toString());
                if (value.docType === 'legalization' && 
                    value.status !== 'COMPLETED' && 
                    value.status !== 'REJECTED' &&
                    value.currentStep === targetStep - 1) {
                    pending.push(value);
                }
            } catch (e) {
                continue;
            }
        }

        return pending;
    }
}

module.exports = LegalizationContract;
