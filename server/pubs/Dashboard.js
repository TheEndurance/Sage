import { Meteor } from "meteor/meteor";
import { Portfolios } from "../../collections/Portfolios";

// Aggregation for transactions
db.portfolios.aggregate([
    { $match: { $and: [{ name: "TFSA" }, {'transactions.type' : 'watch'}] } },
    {
        $group: { _id: "$name", transactions: { $first: '$transactions' } }
    },
    {
        $project: {
            transactions: {
                $filter: {
                    input: '$transactions',
                    as: 'transactions',
                    cond: {
                        $or: [
                            { $eq: ['$$transactions.type', 'buy'] },
                            { $eq: ['$$transactions.type', 'sell'] }
                        ]
                    }
                }
            },
            _id: 1
        }
    },
]);


Meteor.publish('portfolioSnapshot', function () {
    const quantityBySymbol = {};

    const pipeline = [
        {
            '$match':
                { 'transactions.type': 'buy' }
        },
        {
            $project: {
                transactions: {
                    $filter: {
                        input: '$transactions',
                        as: 'transactions',
                        cond: {
                            $or: [
                                { $eq: ['$$transactions.type', 'buy'] },
                                { $eq: ['$$transactions.type', 'sell'] }
                            ]
                        }
                    }
                },
                _id: 0
            }
        },
        {
            $group: {
                _id: 1
            }
        }
    ]
    Portfolios.rawCollection().aggregate(pipeline).transactions.forEach(function (transaction) {
        const multiplier = transaction.type === 'buy' ? 1 : -1;
        if (quantityBySymbol[transaction.symbol]) {
            quantityBySymbol[transaction.symbol] += (transaction.quantity * multiplier);
        } else {
            quantityBySymbol[transaction.symbol] = transaction.quantity;
        }
    });

    const portfolioTotal =

    //maybe I can get the quantity and symbols of all transactions that are 'buy'
    // and all transactions that are 'sell'
    // then calculate for each symbol, quantity = buy - sell

    //make query to Last stock price collection for only the symbols we are interested in based on the portfolio
});