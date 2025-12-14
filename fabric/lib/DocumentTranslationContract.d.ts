import { Context, Contract } from 'fabric-contract-api';
export interface Document {
    docType: string;
    documentID: string;
    ownerID: string;
    issuer: string;
    documentType: string;
    status: string;
    submissionTimestamp: string;
    translations: any[];
    encryptionMetadata: any;
    legalizationID: string | null;
    apostilleID: string | null;
    finalizedAt: string | null;
}
export declare class DocumentTranslationContract extends Contract {
    private _getTxTimestamp;
    registerDocument(ctx: Context, documentID: string, ownerID: string, issuer: string, documentType: string, encryptionMetadata?: string): Promise<Document>;
}
//# sourceMappingURL=DocumentTranslationContract.d.ts.map