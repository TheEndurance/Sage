import { Meteor } from 'meteor/meteor';
import { Portfolios } from '../../collections/Portfolios.js';


Meteor.publish('get:portfolios', function () {
    return Portfolios.find({});
});