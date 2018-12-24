import './add.html';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Symbols } from '../../../collections/Symbols.js';


Template.transactionForm.onCreated(function () {
    this.state = new ReactiveDict();
    this.state.setDefault({
        symbolsLoaded: false
    });

    this.subscribe('get:symbols', () => {
        this.state.set('symbolsLoaded', true);
    });

    this.autorun(() => {
        const symbolsReady = this.state.get('symbolsLoaded');
        if (symbolsReady) {
            const symbols = Symbols.find({}).fetch().map(x=>{ return {title: x.symbol}});
            $(".ui.search").search({
                source: symbols
            })
        }
    });
});


Template.transactionForm.onRendered(function () {

});

Template.transactionForm.helpers({
    symbolsLoading() {
        const instance = Template.instance();
        return instance.state.get('symbolsLoaded') === true ? '' : 'loading';
    },
    watchOnly() {
        const instance = Template.instance();
        return instance.state.get('watch') === true ? 'disabled' : '';
    }
});

Template.transactionForm.events({
    // Set the transaction form to watch only mode (currently disables price/quantity input fields)
    'change #transactionType'(evt, tpl) {
        const watchOnly = evt.currentTarget.value === 'watch';
        tpl.state.set('watch', watchOnly);
    }
})