import './add.html';
import { Template } from 'meteor/templating';
import { Symbols } from '../../../collections/Symbols.js';

Template.transactionForm.onRendered(function () {
    $("#symbolSelect").dropdown();
});

Template.transactionForm.helpers({
    symbols() {
        return Symbols.find({});
    }
});