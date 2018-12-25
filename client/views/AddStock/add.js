import './add.html';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';

//collections
import { LocalSymbols, Symbols } from '../../../collections/Symbols.js';
import { Portfolios, LocalPortfolios } from '../../../collections/Portfolios.js';

// TODO: Solve symbols reloading on every portfolio change by not 
// attaching the subscription to the template instance

// TODO: Figure out a way to set a default portfolio, also handles cases where there are no portfolios (or make every user have a default portfolio)


/**
 * The parent template
 * contains:
 *  - transaction form and portfolio form as children templates
 *  - select portfolio
 */
Template.add.onCreated(function () {
    this.portfolioSelected = new ReactiveVar(false);
    this.subscribe('get:portfolios');
});

Template.add.helpers({
    portfolios() {
        return Portfolios.find({});
    },
    portfolioSelected() {
        const instance = Template.instance();
        return instance.portfolioSelected.get() === true;
    }
});

Template.add.events({
    'change #selectPortfolio'(evt, tpl) {
        if (evt.currentTarget.value.length > 0) {
            tpl.portfolioSelected.set(true);
        } else {
            tpl.portfolioSelected.set(false);
        }
    }
})


/**
 * The transaction form template
 */
Template.transactionForm.onCreated(function () {
    //State
    this.state = new ReactiveDict();
    this.state.setDefault({
        watch: '',
        symbolsLoaded: false
    });

    //Subscriptions
    this.subscribe('get:symbols', () => {
        this.state.set('symbolsLoaded', true);
    });

    //Reactive contexts
    this.autorun(() => {
        const symbolsReady = this.state.get('symbolsLoaded');
        if (symbolsReady) {
            const symbols = Symbols.find({}).fetch();
            $(".ui.search").search({
                source: symbols,
                fields: {
                    title: 'symbol',
                    description: 'name'
                },
                searchFields: ['symbol']
            })
        }
    });
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