import { Context, Contract, Transaction } from 'fabric-contract-api';

// --- Interface Definitions for Clarity ---

export interface TranslationRecord {
    translationID: string;
    translatorID: string;
    targetLanguage: string;
    timestamp: string; // Deterministic date string (YYYY-MM-DD)
    qaSignature: string;
    verificationStatus: 'PENDING_QA' | 'QA_PASSED' | 'QA_APPROVED' | 'REJECTED';
    qaApprovedAt?: string; // Deterministic date string
    rejectionReason?: string;
    rejectedAt?: string; // Deterministic date string
}

export interface ApprovalRecord {
    officerID: string;
    timestamp: string; // Deterministic date string (YYYY-MM-DD)
    reason?: string;
}

export interface Document {
    docType: 'document';
    documentID: string;
    ownerID: string;
    issuer: string;
    documentType: string;
    status: string; // e.g., 'SUBMITTED', 'IN_TRANSLATION', 'QA_COMPLETED', 'FINALIZED'
    submissionTimestamp: string; // Deterministic date string (YYYY-MM-DD)
    translations: TranslationRecord[];
    encryptionMetadata: any;
    legalizationID: string | null;
    apostilleID: string | null;
    finalizedAt: string | null; // Deterministic date string (YYYY-MM-DD)
    translatorID?: string;
    assignedAt?: string; // Deterministic date string (YYYY-MM-DD)
    mojApproval?: ApprovalRecord;
    mojRejection?: ApprovalRecord;
    statusUpdatedAt?: string; // Deterministic date string (YYYY-MM-DD)
    encryptionUpdatedAt?: string; // Deterministic date string (YYYY-MM-DD)
}

/**
 * Document Translation Smart Contract
 * Manages the lifecycle of a document translation process on the ledger.
 */
export class DocumentTranslationContract extends Contract {

    // Helper function to get deterministic date string (YYYY-MM-DD)
    private _getTxTimestamp(ctx: Context): string {
        const txTimestamp = ctx.stub.getTxTimestamp();
        let seconds: number;
        if (txTimestamp.seconds) {
            if (typeof (txTimestamp.seconds as any).toInt === 'function') {
                seconds = (txTimestamp.seconds as any).toInt();
            } else if (typeof txTimestamp.seconds === 'number') {
                seconds = txTimestamp.seconds;
            } else if ((txTimestamp.seconds as any).low !== undefined) {
                seconds = (txTimestamp.seconds as any).low;
            } else {
                seconds = parseInt(txTimestamp.seconds as any);
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

    @Transaction()
    public async initLedger(ctx: Context): Promise<void> {
        console.info('Ledger initialized');
    }

    // -------------------- Document Functions --------------------

    @Transaction()
    public async registerDocument(
        ctx: Context,
        documentID: string,
        ownerID: string,
        issuer: string,
        documentType: string,
        encryptionMetadata: string = '{}'
    ): Promise<Document> {
        // Handle undefined or empty encryptionMetadata
        if (!encryptionMetadata || encryptionMetadata === '') {
            encryptionMetadata = '{}';
        }
        
        const existingDoc = await ctx.stub.getState(documentID);
        if (existingDoc && existingDoc.length > 0) {
            throw new Error(`Document ${documentID} already exists`);
        }

        const timestamp = this._getTxTimestamp(ctx);

        const document: Document = {
            docType: 'document',
            documentID,
            ownerID,
            issuer,
            documentType,
            status: 'SUBMITTED',
            submissionTimestamp: timestamp, // FIXED: Use deterministic timestamp
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

    @Transaction(false)
    public async getDocument(ctx: Context, documentID: string): Promise<Document> {
        const documentBytes = await ctx.stub.getState(documentID);
        if (!documentBytes || documentBytes.length === 0) {
            throw new Error(`Document ${documentID} does not exist`);
        }
        return JSON.parse(documentBytes.toString()) as Document;
    }
    
    // ... (omitting getDocumentsByOwner for brevity, no timestamp issues)

    // -------------------- Translation Functions --------------------

    @Transaction()
    public async assignTranslator(ctx: Context, documentID: string, translatorID: string): Promise<Document> {
        const document = await this.getDocument(ctx, documentID);
        
        if (document.status !== 'SUBMITTED' && document.status !== 'REQUIRES_RESUBMISSION') {
            throw new Error('Document must be in SUBMITTED or REQUIRES_RESUBMISSION status to assign translator');
        }
        
        document.translatorID = translatorID;
        document.status = 'IN_TRANSLATION';
        document.assignedAt = this._getTxTimestamp(ctx); // FIXED: Use deterministic timestamp
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    @Transaction()
    public async submitTranslation(
        ctx: Context,
        documentID: string,
        translationID: string,
        targetLanguage: string,
        qaSignature: string = ''
    ): Promise<TranslationRecord> {
        
        const document = await this.getDocument(ctx, documentID);
        if (document.status !== 'IN_TRANSLATION') {
            throw new Error('Document must be in IN_TRANSLATION status to submit translation');
        }
        
        const translationRecord: TranslationRecord = {
            translationID,
            translatorID: document.translatorID!,
            targetLanguage,
            timestamp: this._getTxTimestamp(ctx), // FIXED: Use deterministic timestamp
            qaSignature,
            verificationStatus: qaSignature ? 'QA_PASSED' : 'PENDING_QA'
        };
        document.translations.push(translationRecord);
        document.status = 'TRANSLATED';
        
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return translationRecord;
    }

    // -------------------- QA Functions --------------------

    @Transaction()
    public async qaApproveTranslation(
        ctx: Context,
        documentID: string,
        translationID: string,
        qaOfficerID: string
    ): Promise<TranslationRecord> {
        const document = await this.getDocument(ctx, documentID);
        const translation = document.translations.find(t => t.translationID === translationID);
        if (!translation) throw new Error(`Translation ${translationID} not found`);
        
        translation.qaSignature = qaOfficerID;
        translation.verificationStatus = 'QA_APPROVED';
        translation.qaApprovedAt = this._getTxTimestamp(ctx); // FIXED: Use deterministic timestamp
        
        document.status = 'QA_COMPLETED';
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return translation;
    }

    @Transaction()
    public async rejectTranslation(
        ctx: Context,
        documentID: string,
        translationID: string,
        reason: string
    ): Promise<TranslationRecord> {
        const document = await this.getDocument(ctx, documentID);
        const translation = document.translations.find(t => t.translationID === translationID);
        if (!translation) throw new Error(`Translation ${translationID} not found`);
        
        translation.verificationStatus = 'REJECTED';
        translation.rejectionReason = reason;
        translation.rejectedAt = this._getTxTimestamp(ctx); // FIXED: Use deterministic timestamp
        
        document.status = 'REQUIRES_RESUBMISSION';
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return translation;
    }

    // -------------------- MoJ Approval Functions --------------------

    @Transaction()
    public async mojApproveTranslation(ctx: Context, documentID: string, mojOfficerID: string): Promise<Document> {
        const document = await this.getDocument(ctx, documentID);
        
        if (document.status !== 'QA_COMPLETED') {
            throw new Error('Document must be in QA_COMPLETED status for MoJ approval');
        }

        document.status = 'MOJ_APPROVED';
        document.mojApproval = {
            officerID: mojOfficerID,
            timestamp: this._getTxTimestamp(ctx) // FIXED: Use deterministic timestamp
        };

        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    @Transaction()
    public async mojRejectTranslation(
        ctx: Context,
        documentID: string,
        mojOfficerID: string,
        reason: string
    ): Promise<Document> {
        const document = await this.getDocument(ctx, documentID);
        
        if (document.status !== 'QA_COMPLETED') {
            throw new Error('Document must be in QA_COMPLETED status for MoJ rejection');
        }

        document.status = 'MOJ_REJECTED';
        document.mojRejection = {
            officerID: mojOfficerID,
            reason,
            timestamp: this._getTxTimestamp(ctx) // FIXED: Use deterministic timestamp
        };

        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    // -------------------- Status Updates & Finalization --------------------
    
    // ... (omitting linkLegalization and linkApostille as they don't involve timestamps)

    @Transaction()
    public async updateStatus(ctx: Context, documentID: string, newStatus: string): Promise<Document> {
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
        document.statusUpdatedAt = this._getTxTimestamp(ctx); // FIXED: Use deterministic timestamp
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    @Transaction()
    public async finalizeDocument(ctx: Context, documentID: string): Promise<Document> {
        const document = await this.getDocument(ctx, documentID);
        
        if (document.status !== 'APOSTILLED' && document.status !== 'LEGALIZED') {
            throw new Error('Document must be APOSTILLED or LEGALIZED to finalize');
        }

        document.status = 'FINALIZED';
        document.finalizedAt = this._getTxTimestamp(ctx); // FIXED: Use deterministic timestamp

        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    // -------------------- Encryption Metadata --------------------

    @Transaction()
    public async updateEncryptionMetadata(
        ctx: Context, 
        documentID: string, 
        encryptionMetadata: string
    ): Promise<Document> {
        const document = await this.getDocument(ctx, documentID);
        document.encryptionMetadata = JSON.parse(encryptionMetadata);
        document.encryptionUpdatedAt = this._getTxTimestamp(ctx); // FIXED: Use deterministic timestamp
        await ctx.stub.putState(documentID, Buffer.from(JSON.stringify(document)));
        return document;
    }

    // ... (omitting Query Functions for brevity, no timestamp issues)
}