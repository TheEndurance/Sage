import { Mongo } from 'meteor/mongo';

export const Portfolios = new Mongo.Collection("portfolios");
export const LocalPortfolios = new Mongo.Collection(null);