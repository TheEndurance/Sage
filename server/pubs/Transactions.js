// Aggregation for transactions
// db.portfolios.aggregate([
//     {
//         '$match':
//             { 'transactions.type': 'watch' }
//     },
//     {
//         $project: {
//             transactions: {
//                 $filter: {
//                     input: '$transactions',
//                     as: 'transactions',
//                     cond: {
//                         $eq: ['$$transactions.type', 'watch']
//                     }
//                 }
//             },
//             _id: 0
//         }
//     }]);
