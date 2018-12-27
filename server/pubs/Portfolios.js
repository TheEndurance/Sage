import { Meteor } from 'meteor/meteor';
import { Portfolios } from '../../collections/Portfolios.js';


Meteor.publish('get:portfolios-name', function () {
    return Portfolios.find({}, {fields: {name: 1, createdAt: 1}});
});

Meteor.publish('get:portfolios', function(){
    return Portfolios.find({});
});

