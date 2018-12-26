import { Mongo } from 'meteor/mongo';

/**
 * Portfolios Schema
 * "user" : "user id",
 * "name" : "string", (required)
 * "description": "string",
 * "createdAt" : Date,
 * "transactions": [Array of Transactions]
 *  
    * Transactions Schema
    * "symbol": "A",
    * "price": 33.33,'
    * "purchase_type" : "buy" || "sell" || "watch"
    * "date" : Date,
    * "quantity" : 22.34,
    * "exchange" : ""
*/


export const Portfolios = new Mongo.Collection("portfolios");
export const LocalPortfolios = new Mongo.Collection(null);