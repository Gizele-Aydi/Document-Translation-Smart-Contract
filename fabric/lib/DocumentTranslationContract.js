"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTranslationContract = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
class DocumentTranslationContract extends fabric_contract_api_1.Contract {
    _getTxTimestamp(ctx) {
        const txTimestamp = ctx.stub.getTxTimestamp();
        // Handle both Long and number types for seconds
        let seconds;
        if (typeof txTimestamp.seconds === 'object' && txTimestamp.seconds.low !== undefined) {
            seconds = txTimestamp.seconds.low;
        }
        else {
            seconds = txTimestamp.seconds;
        }
        // Include nanoseconds for precision across peers
        let nanos;
        if (typeof txTimestamp.nanos === 'object' && txTimestamp.nanos.low !== undefined) {
            nanos = txTimestamp.nanos.low;
        }
        else {
            nanos = txTimestamp.nanos;
        }
        // Convert to milliseconds and create ISO string
        const totalMs = seconds * 1000 + Math.floor(nanos / 1000000);
        return new Date(totalMs).toISOString();
    }
    async registerDocument(ctx, documentID, ownerID, issuer, documentType, encryptionMetadata = '{}') {
        // Handle undefined or empty encryptionMetadata
        if (!encryptionMetadata || encryptionMetadata === '') {
            encryptionMetadata = '{}';
        }
        const existingDoc = await ctx.stub.getState(documentID);
        if (existingDoc && existingDoc.length > 0) {
            throw new Error(`Document ${documentID} already exists`);
        }
        const timestamp = this._getTxTimestamp(ctx);
        const document = {
            docType: 'document',
            documentID,
            ownerID,
            issuer,
            documentType,
            status: 'SUBMITTED',
            submissionTimestamp: timestamp,
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
}
exports.DocumentTranslationContract = DocumentTranslationContract;
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DocumentTranslationContract.prototype, "registerDocument", null);
//# sourceMappingURL=DocumentTranslationContract.js.map