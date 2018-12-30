import './transaction.html';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';

//collections
import { Symbols } from '../../../collections/Symbols';
import { Portfolios } from '../../../collections/Portfolios';

//methods
import { createTransaction } from '../../../methods/transactions.js';

//utils
import { getDatetimeLocal } from '../../../lib/helpers/datetime.js';

/* #region Transaction */
/**
 * The parent template
 * contains:
 *  - transaction form and portfolio form as children templates
 *  - select portfolio
 */
Template.transaction.onCreated(function () {
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

Template.transaction.helpers({
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

Template.transaction.events({
    'change #selectPortfolio'(evt, tpl) {
        const selectedPortfolio = evt.currentTarget.value
        tpl.portfolioSelected.set(selectedPortfolio);
    }
})
/* #endregion */


/* #region Transaction Form */

/**
 * The transaction form template
 */
Template.transactionForm.onCreated(function () {
    //State
    this.state = new ReactiveDict();
    this.state.setDefault({
        errors: {},
        success: false,
        watch: false,
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
    },
    isError(field) {
        const errors = Template.instance().state.get('errors');
        return (errors[field] && errors[field].length > 0) ? 'error' : '';
    },
    errors(field) {
        const errors = Template.instance().state.get('errors');
        return errors[field] != null ? errors[field] : [];
    },
    formState() {
        const { errors, success } = Template.instance().state.all();
        let state = '';
        if (success === true) {
            state = 'success';
        } else if (Object.keys(errors).length > 0) {
            state = 'error'
        }
        return state;
    },
    dateNow(){
        return getDatetimeLocal();
    }
});

Template.transactionForm.events({
    // Set the transaction form to watch only mode (currently disables price/quantity input fields)
    'change #type'(evt, tpl) {
        const watchOnly = evt.currentTarget.value === 'watch';
        tpl.state.set({
            watch: watchOnly
        });
    },
    'submit #transactionForm'(evt, tpl) {
        evt.preventDefault();
        const transaction = {
            symbol: evt.target.symbol.value,
            type: evt.target.type.value,
            date: new Date(evt.target.date.value),
            price: parseFloat(evt.target.price.value) || undefined,
            quantity: parseFloat(evt.target.quantity.value) || undefined,
            notes: evt.target.notes.value
        }
        const { portfolio } = tpl.data;
        createTransaction.call({
            transaction: transaction,
            portfolio_id: portfolio
        }, (err, res) => {
            if (err) {
                if (err.details) {
                    const errors = {
                        'transaction.symbol': [],
                        'transaction.type': [],
                        'transaction.price': [],
                        'transaction.quantity': [],
                        'transaction.date': [],
                        'transaction.notes': []
                    }
                    err.details.forEach((fieldError) => {
                        errors[fieldError.name].push(fieldError.message);
                    });
                    tpl.state.set({
                        success: false,
                        errors: errors
                    });
                } else if (err.reason) {
                    tpl.state.set({
                        success: false,
                        errors: { custom: [err.reason] }
                    })
                }
            } else {
                tpl.state.set({
                    success: true,
                    errors: {}
                });
            }
        });
    }
});

/* #endregion */