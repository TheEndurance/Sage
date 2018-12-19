import { Mongo } from 'meteor/mongo';

export const Transactions = new Mongo.Collection("transactions");
export const LocalTransactions = new Mongo.Collection(null);