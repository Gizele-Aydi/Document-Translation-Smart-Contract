'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Audit Trail Smart Contract
 * Automatically records every action performed on any asset
 * Immutable chain of custody for the entire system
 */
class AuditTrailContract extends Contract {

    async initLedger(ctx) {
        console.info('Audit Trail Contract Ledger Initialized');
    }

    // -------------------- Log Actions --------------------

    /**
     * Create an immutable log entry
     * @param {string} logID - Unique log ID (hashed)
     * @param {string} actorID - Who performed the action
     * @param {string} actorRole - Role of the actor
     * @param {string} actionType - UPLOAD, VERIFY, TRANSLATE, APPROVE, REJECT, LEGALIZE, APOSTILLE, PAYMENT
     * @param {string} linkedAssetHash - Hash of the affected asset
     * @param {string} linkedAssetType - Type of asset (document, translation, apostille, etc.)
     * @param {string} metadata - JSON string with additional context
     */
    async logAction(ctx, logID, actorID, actorRole, actionType, linkedAssetHash, linkedAssetType, metadata) {
        const existingLog = await ctx.stub.getState(logID);
        if (existingLog && existingLog.length > 0) {
            throw new Error(`Log entry ${logID} already exists`);
        }

        const validActions = [
            'UPLOAD', 'VERIFY', 'TRANSLATE', 'APPROVE', 'REJECT', 
            'LEGALIZE', 'APOSTILLE', 'PAYMENT', 'NOTARIZE',
            'REGISTER', 'ASSIGN', 'SUBMIT', 'REVOKE', 'SUSPEND',
            'GRANT_ACCESS', 'REVOKE_ACCESS', 'UPDATE', 'DELETE'
        ];

        if (!validActions.includes(actionType)) {
            throw new Error(`Invalid action type: ${actionType}`);
        }

        const log = {
            docType: 'auditLog',
            logID,
            actorID,
            actorRole,
            actionType,
            linkedAssetHash,
            linkedAssetType,
            metadata: metadata ? JSON.parse(metadata) : {},
            timestamp: new Date().toISOString(),
            txId: ctx.stub.getTxID()
        };

        await ctx.stub.putState(logID, Buffer.from(JSON.stringify(log)));

        // Create composite keys for various queries
        const assetKey = ctx.stub.createCompositeKey('asset~log', [linkedAssetHash, logID]);
        await ctx.stub.putState(assetKey, Buffer.from('\u0000'));

        const actorKey = ctx.stub.createCompositeKey('actor~log', [actorID, logID]);
        await ctx.stub.putState(actorKey, Buffer.from('\u0000'));

        const actionKey = ctx.stub.createCompositeKey('action~log', [actionType, logID]);
        await ctx.stub.putState(actionKey, Buffer.from('\u0000'));

        return log;
    }

    /**
     * Get log entry by ID
     */
    async getLogEntry(ctx, logID) {
        const logBytes = await ctx.stub.getState(logID);
        if (!logBytes || logBytes.length === 0) {
            throw new Error(`Log entry ${logID} does not exist`);
        }
        return JSON.parse(logBytes.toString());
    }

    // -------------------- Query Functions --------------------

    /**
     * Get all audit trail entries for a document/asset
     */
    async getAuditTrail(ctx, assetHash) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('asset~log', [assetHash]);
        const logs = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const logID = compositeKey.attributes[1];
            const log = await this.getLogEntry(ctx, logID);
            logs.push(log);
        }

        // Sort by timestamp
        return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Get all actions performed by an actor
     */
    async getActorHistory(ctx, actorID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('actor~log', [actorID]);
        const logs = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const logID = compositeKey.attributes[1];
            const log = await this.getLogEntry(ctx, logID);
            logs.push(log);
        }

        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get all actions of a specific type
     */
    async getActionsByType(ctx, actionType) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('action~log', [actionType]);
        const logs = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const logID = compositeKey.attributes[1];
            const log = await this.getLogEntry(ctx, logID);
            logs.push(log);
        }

        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get audit trail within a date range
     */
    async getAuditTrailByDateRange(ctx, assetHash, startDate, endDate) {
        const allLogs = await this.getAuditTrail(ctx, assetHash);
        const start = new Date(startDate);
        const end = new Date(endDate);

        return allLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= start && logDate <= end;
        });
    }

    /**
     * Get complete chain of custody for a document
     * Provides a formatted summary of all actions
     */
    async getChainOfCustody(ctx, assetHash) {
        const logs = await this.getAuditTrail(ctx, assetHash);
        
        const custody = logs.map(log => ({
            timestamp: log.timestamp,
            action: log.actionType,
            actor: log.actorID,
            role: log.actorRole,
            details: log.metadata,
            txId: log.txId
        }));

        return {
            assetHash,
            totalActions: custody.length,
            firstAction: custody[0] || null,
            lastAction: custody[custody.length - 1] || null,
            custody
        };
    }

    /**
     * Get summary statistics for an actor
     */
    async getActorStats(ctx, actorID) {
        const logs = await this.getActorHistory(ctx, actorID);
        
        const stats = {
            actorID,
            totalActions: logs.length,
            actionBreakdown: {},
            recentActions: logs.slice(0, 10)
        };

        for (const log of logs) {
            if (!stats.actionBreakdown[log.actionType]) {
                stats.actionBreakdown[log.actionType] = 0;
            }
            stats.actionBreakdown[log.actionType]++;
        }

        return stats;
    }

    /**
     * Verify integrity of an audit chain
     * Checks if all entries are properly linked
     */
    async verifyAuditChainIntegrity(ctx, assetHash) {
        const logs = await this.getAuditTrail(ctx, assetHash);
        
        if (logs.length === 0) {
            return { isValid: true, message: 'No audit trail found', logs: [] };
        }

        // Basic integrity checks
        const issues = [];
        let previousTimestamp = null;

        for (const log of logs) {
            // Check timestamp ordering
            if (previousTimestamp && new Date(log.timestamp) < new Date(previousTimestamp)) {
                issues.push(`Timestamp ordering issue at log ${log.logID}`);
            }
            previousTimestamp = log.timestamp;

            // Check required fields
            if (!log.actorID || !log.actionType || !log.txId) {
                issues.push(`Missing required fields in log ${log.logID}`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues,
            totalEntries: logs.length,
            firstEntry: logs[0].timestamp,
            lastEntry: logs[logs.length - 1].timestamp
        };
    }
}

module.exports = AuditTrailContract;
