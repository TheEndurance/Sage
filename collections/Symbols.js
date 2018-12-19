import { Mongo } from 'meteor/mongo';

export const Symbols = new Mongo.Collection("symbols");
export const LocalSymbols = new Mongo.Collection(null);