'use strict';

// Smart Contract Exports for Hyperledger Fabric Chaincode
const DocumentTranslationContract = require('./lib/document-translation-sc.js');
const IdentityContract = require('./lib/identity-sc.js');
const AccessControlContract = require('./lib/access-control-sc.js');
const LegalizationContract = require('./lib/legalization-sc.js');
const ApostilleContract = require('./lib/apostille-sc.js');
const PaymentContract = require('./lib/payment-sc.js');
const AuditTrailContract = require('./lib/audit-trail-sc.js');
const AttestationContract = require('./lib/attestation-sc.js');
const ZKPVerificationContract = require('./lib/zkp-verification-sc.js');

module.exports.DocumentTranslationContract = DocumentTranslationContract;
module.exports.IdentityContract = IdentityContract;
module.exports.AccessControlContract = AccessControlContract;
module.exports.LegalizationContract = LegalizationContract;
module.exports.ApostilleContract = ApostilleContract;
module.exports.PaymentContract = PaymentContract;
module.exports.AuditTrailContract = AuditTrailContract;
module.exports.AttestationContract = AttestationContract;
module.exports.ZKPVerificationContract = ZKPVerificationContract;

// Export contracts array for Fabric
module.exports.contracts = [
    DocumentTranslationContract,
    IdentityContract,
    AccessControlContract,
    LegalizationContract,
    ApostilleContract,
    PaymentContract,
    AuditTrailContract,
    AttestationContract,
    ZKPVerificationContract
];
