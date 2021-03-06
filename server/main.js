import { Meteor } from 'meteor/meteor';
import { Symbols } from '../collections/Symbols.js';
import request from 'request-promise-native';

//pubs
import './pubs/Symbols.js';
import './pubs/Portfolios.js';

//methods
import '../methods/portfolios.js';
import '../methods/transactions.js'

Meteor.startup(async () => {
  if (Symbols.find({}).count() === 0) {
    const options = {
      uri: "https://api.iextrading.com/1.0/ref-data/symbols",
      json: true
    }
    const symbols = await request(options);
    for (let symbol of symbols) {
      Symbols.insert(symbol);
    }
  }
  // code to run on server at startup
});
