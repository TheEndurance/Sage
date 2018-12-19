import './add.html';
import { Template } from 'meteor/templating';
import { Symbols } from '../../../collections/Symbols.js';


Template.add.helpers({
    symbols(){
        return Symbols.find({});
    }
});