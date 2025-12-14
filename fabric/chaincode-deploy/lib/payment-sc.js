'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Payment Smart Contract
 * Handles PSP references, fee verification, and workflow unlocking
 * No payment → no next step
 */
class PaymentContract extends Contract {
    _getTxTimestamp(ctx) {
        const txTimestamp = ctx.stub.getTxTimestamp();
        let seconds;
        if (txTimestamp.seconds) {
            if (typeof txTimestamp.seconds.toInt === 'function') {
                seconds = txTimestamp.seconds.toInt();
            } else if (typeof txTimestamp.seconds === 'number') {
                seconds = txTimestamp.seconds;
            } else if (txTimestamp.seconds.low !== undefined) {
                seconds = txTimestamp.seconds.low;
            } else {
                seconds = parseInt(txTimestamp.seconds);
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
    async initLedger(ctx) {
        console.info('Payment Contract Ledger Initialized');
    }

    // -------------------- Payment Recording --------------------

    /**
     * Record a new payment
     * @param {string} paymentID - Unique payment ID (hashed)
     * @param {string} payerID - Citizen/Business ID
     * @param {string} serviceType - TRANSLATION, APOSTILLE, LEGALIZATION, NOTARIZATION
     * @param {number} amount - Payment amount
     * @param {string} currency - Currency code (TND, EUR, USD)
     * @param {string} paymentMethod - Credit card, bank transfer, etc.
     * @param {string} pspReference - Payment Service Provider reference
     * @param {string} linkedDocumentID - Document this payment is for
     */
    async recordPayment(ctx, paymentID, payerID, serviceType, amount, currency, paymentMethod, pspReference, linkedDocumentID) {
        const existingPayment = await ctx.stub.getState(paymentID);
        if (existingPayment && existingPayment.length > 0) {
            throw new Error(`Payment ${paymentID} already exists`);
        }

        const validServices = ['TRANSLATION', 'APOSTILLE', 'LEGALIZATION', 'NOTARIZATION'];
        if (!validServices.includes(serviceType)) {
            throw new Error(`Invalid service type: ${serviceType}. Must be one of: ${validServices.join(', ')}`);
        }

        const payment = {
            docType: 'payment',
            paymentID,
            payerID,
            serviceType,
            amount: parseFloat(amount),
            currency,
            paymentMethod,
            pspReference,
            linkedDocumentID,
            timestamp: this._getTxTimestamp(ctx),
            verificationStatus: 'PENDING'
        };

        await ctx.stub.putState(paymentID, Buffer.from(JSON.stringify(payment)));

        // Create composite keys for lookups
        const docKey = ctx.stub.createCompositeKey('document~payment', [linkedDocumentID, paymentID]);
        await ctx.stub.putState(docKey, Buffer.from('\u0000'));

        const payerKey = ctx.stub.createCompositeKey('payer~payment', [payerID, paymentID]);
        await ctx.stub.putState(payerKey, Buffer.from('\u0000'));

        return payment;
    }

    /**
     * Get payment by ID
     */
    async getPayment(ctx, paymentID) {
        const paymentBytes = await ctx.stub.getState(paymentID);
        if (!paymentBytes || paymentBytes.length === 0) {
            throw new Error(`Payment ${paymentID} does not exist`);
        }
        return JSON.parse(paymentBytes.toString());
    }

    /**
     * Verify payment (PSP callback)
     */
    async verifyPayment(ctx, paymentID, pspReference, verifiedBy) {
        const payment = await this.getPayment(ctx, paymentID);

        if (payment.pspReference !== pspReference) {
            throw new Error('PSP reference mismatch');
        }

        if (payment.verificationStatus === 'VERIFIED') {
            throw new Error('Payment is already verified');
        }

        payment.verificationStatus = 'VERIFIED';
        payment.verifiedAt = this._getTxTimestamp(ctx);
        payment.verifiedBy = verifiedBy;

        await ctx.stub.putState(paymentID, Buffer.from(JSON.stringify(payment)));
        return payment;
    }

    /**
     * Mark payment as failed
     */
    async failPayment(ctx, paymentID, reason) {
        const payment = await this.getPayment(ctx, paymentID);

        payment.verificationStatus = 'FAILED';
        payment.failureReason = reason;
        payment.failedAt = this._getTxTimestamp(ctx);
        
        await ctx.stub.putState(paymentID, Buffer.from(JSON.stringify(payment)));
        return payment;
    }

    /**
     * Refund a payment
     */
    async refundPayment(ctx, paymentID, reason, refundedBy) {
        const payment = await this.getPayment(ctx, paymentID);

        if (payment.verificationStatus !== 'VERIFIED') {
            throw new Error('Can only refund verified payments');
        }

        payment.verificationStatus = 'REFUNDED';
        payment.refundReason = reason;
        payment.refundedBy = refundedBy;
        payment.refundedAt = this._getTxTimestamp(ctx);

        await ctx.stub.putState(paymentID, Buffer.from(JSON.stringify(payment)));
        return payment;
    }

    // -------------------- Payment Checks --------------------

    /**
     * Check if payment exists and is verified for a document/service
     * @returns {object} - { isPaid: boolean, payment: object|null }
     */
    async checkPaymentRequired(ctx, documentID, serviceType) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('document~payment', [documentID]);

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const paymentID = compositeKey.attributes[1];
            
            try {
                const payment = await this.getPayment(ctx, paymentID);
                
                if (payment.serviceType === serviceType && payment.verificationStatus === 'VERIFIED') {
                    return { isPaid: true, payment };
                }
            } catch (e) {
                continue;
            }
        }

        return { isPaid: false, payment: null, message: `No verified payment found for ${serviceType}` };
    }

    /**
     * Get all payments for a document
     */
    async getPaymentsByDocument(ctx, documentID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('document~payment', [documentID]);
        const payments = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const paymentID = compositeKey.attributes[1];
            const payment = await this.getPayment(ctx, paymentID);
            payments.push(payment);
        }

        return payments;
    }

    /**
     * Get all payments by payer
     */
    async getPaymentsByPayer(ctx, payerID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('payer~payment', [payerID]);
        const payments = [];

        for await (const result of iterator) {
            const compositeKey = ctx.stub.splitCompositeKey(result.key);
            const paymentID = compositeKey.attributes[1];
            const payment = await this.getPayment(ctx, paymentID);
            payments.push(payment);
        }

        return payments;
    }

    /**
     * Get payment history
     */
    async getPaymentHistory(ctx, paymentID) {
        const iterator = await ctx.stub.getHistoryForKey(paymentID);
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
     * Get total amount paid for a document
     */
    async getTotalPaidForDocument(ctx, documentID) {
        const payments = await this.getPaymentsByDocument(ctx, documentID);
        const verified = payments.filter(p => p.verificationStatus === 'VERIFIED');
        
        const totals = {};
        for (const payment of verified) {
            if (!totals[payment.currency]) {
                totals[payment.currency] = 0;
            }
            totals[payment.currency] += payment.amount;
        }

        return { payments: verified, totals };
    }
}

module.exports = PaymentContract;