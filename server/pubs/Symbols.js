import { Meteor } from 'meteor/meteor';
import { Symbols } from '../../collections/Symbols.js';


Meteor.publish('get:symbols', function () {
    return Symbols.find({});
});