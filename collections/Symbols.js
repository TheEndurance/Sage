import { Mongo } from 'meteor/mongo';

/**
 * Schema
 * "symbol" : "A",
 * "name" : "Agilent Technologies Inc.", 
 * "date" : "2018-12-17", 
 * "isEnabled" : true, 
 * "type" : "cs", 
 * "iexId" : "2" }
 */

export const Symbols = new Mongo.Collection("symbols");
export const LocalSymbols = new Mongo.Collection(null);