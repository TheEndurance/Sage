import SimpleSchema from 'simpl-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import { Portfolios } from '../collections/Portfolios.js'

const requiredBasedOnWatch = function () {
    let shouldBeRequired = this.siblingField('type').value !== 'watch';
    if (shouldBeRequired) {
        if (this.value == null) {
            return SimpleSchema.ErrorTypes.REQUIRED;
        }
    }
}

const TransactionsSchema = new SimpleSchema({
    symbol: { type: String, min: 1 },
    type: { type: String, regEx: /^(buy|watch|sell)$/ },
    price: {
        type: Number,
        optional: true,
        min: 0.00,
        custom: requiredBasedOnWatch
    },
    quantity: {
        type: Number,
        optional: true,
        min: 0.00,
        custom: requiredBasedOnWatch
    },
    date: { type: Date },
    exchange: { type: String, optional: true },
    notes: { type: String, optional: true }
});

export const createTransaction = new ValidatedMethod({
    name: 'Transaction.create',
    validate: new SimpleSchema({
        transaction: TransactionsSchema,
        portfolio_id: { type: String, min: 1 }
    }).validator({ clean: true }),
    run({ transaction, portfolio_id }) {
        const portfolio = Portfolios.findOne({ _id: portfolio_id });
        if (portfolio == null) {
            throw new Meteor.Error('Transactions.create.portfolio-not-found', 'The portfolio for this transaction was not found');
        }
        Portfolios.update({ _id: portfolio_id }, { $push: { transactions: transaction } });
    }
});


