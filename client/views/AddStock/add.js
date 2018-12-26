import './add.html';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';

//collections
import { Symbols, LocalSymbols } from '../../../collections/Symbols.js';
import { Portfolios, LocalPortfolios } from '../../../collections/Portfolios.js';


/**
 * The parent template
 * contains:
 *  - transaction form and portfolio form as children templates
 *  - select portfolio
 */
Template.add.onCreated(function () {
    this.portfolio = new ReactiveVar(null);
    this.subscribe('get:portfolios', () => {
        const lastPortfolio = Portfolios.findOne({}, { sort: { createdAt: 1 }, limit: 1 });
        this.portfolio.set(lastPortfolio._id.valueOf());
    });
});

Template.add.helpers({
    portfolios() {
        return Portfolios.find({});
    },
    isPortfolioSelected() {
        const instance = Template.instance();
        return instance.portfolio.get() === this._id.valueOf() ? 'selected' : '';
    },
    showTransactionForm() {
        const instance = Template.instance();
        return instance.portfolio.get() != null;
    },
    getPortfolio() {
        const instance = Template.instance();
        return instance.portfolio.get();
    }
});

Template.add.events({
    'change #selectPortfolio'(evt, tpl) {
        const selectedPortfolio = evt.currentTarget.value;
        tpl.portfolio.set(selectedPortfolio);
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