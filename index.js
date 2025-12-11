'use strict';

const DocumentTranslationContract = require('./lib/document-translation-sc.js');
const { ChaincodeStub, Shim } = require('fabric-shim');
const { Contract, Context } = require('fabric-contract-api');

module.exports.DocumentTranslationContract = DocumentTranslationContract;
