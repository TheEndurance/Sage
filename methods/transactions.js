import SimpleSchema from 'simpl-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import { Portfolios } from '../collections/Portfolios.js'


const TransactionsSchema = new SimpleSchema({
    symbol: { type: String, min: 1 },
    price: { type: Number, min: 0.00 },
    purchase_type: { type: String, regEx: /^(buy|watch|sell)$/ },
    date: { type: Date },
    quantity: { type: Number, min: 0.00 },
    exchange: { type: String, optional: true },
});

export const createTransaction = new ValidatedMethod({
    name: 'Transaction.create',
    validate: new SimpleSchema({
        transaction: TransactionsSchema,
        portfolio_id: { type: String, min: 1 }
    }).validator(),
    run({ transaction, portfolio_id }) {
        const portfolio = Portfolios.findOne({ _id: portfolio_id });
        if (portfolio == null) {
            throw new Meteor.Error('Transactions.create.portfolio-not-found', 'The portfolio for this transaction was not found');
        }
        Portfolios.update({ _id: portfolio_id }, { $push: { transactions: transaction } });
    }
});


