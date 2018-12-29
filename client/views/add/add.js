import './add.html';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';

//collections
import { Symbols } from '../../../collections/Symbols.js';
import { Portfolios } from '../../../collections/Portfolios.js';


/* #region add */
/**
 * The parent template
 * contains:
 *  - transaction form and portfolio form as children templates
 *  - select portfolio
 */
Template.add.onCreated(function () {
    this.portfolioSelected = new ReactiveVar('');
    this.portfoliosLoaded = new ReactiveVar(false);
    this.subscribe('get:portfolios-name', () => {
        this.portfoliosLoaded.set(true);

        // set the portfolio select list to the last created portfolio if it exists
        const lastPortfolio = Portfolios.findOne({}, { sort: { createdAt: 1 }, limit: 1 });
        if (lastPortfolio != null) {
            this.portfolioSelected.set(lastPortfolio._id.valueOf());
        }
    });
});

Template.add.helpers({
    portfolios() {
        return Portfolios.find({});
    },
    portfoliosLoaded() {
        const portfoliosLoaded = Template.instance().portfoliosLoaded.get();
        return portfoliosLoaded === true ? '' : 'loading'
    },
    isPortfolioSelected() {
        const portfolioSelected = Template.instance().portfolioSelected.get();
        return portfolioSelected === this._id.valueOf() ? 'selected' : '';
    },
    showTransactionForm() {
        const portfolioSelected = Template.instance().portfolioSelected.get();
        return portfolioSelected.length > 0;
    },
    getPortfolio() {
        const portfolioSelected = Template.instance().portfolioSelected.get();
        return portfolioSelected;
    }
});

Template.add.events({
    'change #selectPortfolio'(evt, tpl) {
        const selectedPortfolio = evt.currentTarget.value
        tpl.portfolioSelected.set(selectedPortfolio);
    }
})
/* #endregion */


/* #region transactionForm */
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
    symbolsLoaded() {
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
});
