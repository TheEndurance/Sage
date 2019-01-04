import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import io from 'socket.io-client';
import './home.css';
import './home.html';

const DAY_AS_MILLISECONDS = 24 * 60 * 60 * 1000;
let SOCKET;

//collections
import { Portfolios } from '../../../collections/Portfolios.js';
import { LivePrices, PortfolioSnapshot } from '../../../collections/IEX.js'

//IEX endpoints
const lastURL = 'https://ws-api.iextrading.com/1.0/last';
const ohlcURL = (symbol) => `https://api.iextrading.com/1.0/stock/${symbol}/ohlc`;


/* #region Home parent template */
Template.home.onCreated(function () {
    this.selectedPortfolio = new ReactiveVar(null);
    //IEX Websocket endpoint
    const socket = SOCKET = io(lastURL);

    const template = this;
    //subscriptions
    const portfoliosHandle = this.subscribe('get:portfolios');

    //live stock data
    socket.on('connect', () => {
        template.autorun(() => {
            if (portfoliosHandle.ready()) {
                const portfolios = Portfolios.find({}).fetch();
                const symbols = {};
                portfolios.forEach((portfolio) => {
                    PortfolioSnapshot.update({ name: portfolio.name }, { name: portfolio.name, createdAt: portfolio.createdAt, symbols: [] }, { upsert: true });
                    if (!portfolio.transactions || portfolio.transactions.length === 0) return;
                    portfolio.transactions.forEach((transaction) => {
                        const multiplier = transaction.type === 'buy' ? 1 : -1;
                        const incrementQuantity = transaction.quantity * multiplier;

                        const symbol = PortfolioSnapshot.findOne({ name: portfolio.name, 'symbols.symbol': transaction.symbol }, { reactive: false });
                        if (symbol) {
                            PortfolioSnapshot.update(
                                { name: portfolio.name, 'symbols.symbol': transaction.symbol },
                                {
                                    '$inc':
                                        { 'symbols.$.quantity': incrementQuantity }
                                });
                        } else {
                            PortfolioSnapshot.update(
                                { name: portfolio.name },
                                {
                                    '$addToSet':
                                        { symbols: { symbol: transaction.symbol, quantity: incrementQuantity } }
                                });
                        }
                        symbols[transaction.symbol] = true;
                    });
                });
                const symbolsString = Object.keys(symbols).reduce((accum, current, index) => {
                    return index === 0 ? current : accum + ',' + current;
                }, '');

                socket.emit('subscribe', symbolsString);
            }
        });
    });

    //Live IEX data that updates the local collections or inserts if there is none
    socket.on('message', async (message) => {
        const { symbol, price } = JSON.parse(message);

        const livePrice = LivePrices.findOne({ symbol: symbol }) || { symbol: symbol };

        //if the price close time is more than 24 hours then we need to refetch new market data
        if (!livePrice.closeTime || new Date().valueOf() - new Date(livePrice.closeTime) >= DAY_AS_MILLISECONDS) {
            const response = await fetch(ohlcURL(symbol));
            const { close } = await response.json();
            livePrice.closePrice = close.price;
            livePrice.closeTime = close.time;
        }
        livePrice.price = price;
        LivePrices.update({ symbol: symbol }, livePrice, { upsert: true });
    });
});

Template.home.onDestroyed(function () {
    SOCKET.disconnect();
});

Template.home.helpers({
    dataContext() {
        const instance = Template.instance();
        return {
            subsReady: instance.subscriptionsReady(),
            PortfolioSnapshot: PortfolioSnapshot,
            LivePrices: LivePrices,
        }
    },
    portfolioListUIContext() {
        const instance = Template.instance();
        return {
            selectedPortfolio: instance.selectedPortfolio
        }
    },
    symbolTableUIContext() {
        const instance = Template.instance();
        return {
            selectedPortfolio: instance.selectedPortfolio.get()
        }
    }
});

/* #endregion */


/* #region Portfolio List */
Template.portfolioList.onCreated(function () {
    const { uiContext: { selectedPortfolio }, dataContext: { PortfolioSnapshot } } = Template.currentData();

    this.autorun(() => {
        const portfolio = PortfolioSnapshot.findOne({}, { sort: { createdAt: 1 }, limit: 1 });
        if (portfolio && portfolio.name) {
            selectedPortfolio.set(portfolio.name);
        }
    })
});


Template.portfolioList.helpers({
    isSelected(name) {
        const { uiContext: { selectedPortfolio } } = Template.currentData();
        return selectedPortfolio.get() === name ? 'selected' : '';
    },
    portfoliosExist() {
        const { dataContext: { PortfolioSnapshot } } = Template.currentData();
        return PortfolioSnapshot.find({}).count() > 0;
    },
    portfolios() {
        const { dataContext: { PortfolioSnapshot, LivePrices } } = Template.currentData();
        const portfolioList = PortfolioSnapshot.find({}).fetch().map((portfolio) => {
            let total = 0.00;
            let closeTotal = 0.00;
            if (portfolio.symbols && portfolio.symbols.length > 0) {
                portfolio.symbols.forEach((symbol) => {
                    const livePrice = LivePrices.findOne({ symbol: symbol.symbol });
                    let addToTotal = 0.00;
                    let addToCloseTotal = 0.00;

                    if (livePrice && livePrice.price && livePrice.closePrice && symbol.quantity > 0) {
                        addToTotal = symbol.quantity * livePrice.price;
                        addToCloseTotal = symbol.quantity * livePrice.closePrice;
                    }

                    total += addToTotal;
                    closeTotal += addToCloseTotal;
                });
            }
            const percentageDifference = closeTotal !== 0 ? (((total - closeTotal) / closeTotal) * 100) : 0.00;
            return {
                name: portfolio.name,
                total: total.toFixed(2),
                percentageDifference: percentageDifference.toFixed(2),
                displayColor: percentageDifference >= 0 ? 'green' : 'red'
            }
        });
        return portfolioList;
    }
});

Template.portfolioList.events({
    'click .ui.link.card'(evt, tpl) {
        const { uiContext: { selectedPortfolio } } = Template.currentData();
        selectedPortfolio.set(evt.currentTarget.dataset.name);
    }
})
/* #endregion */

/* #region symbolTable */

Template.symbolTable.helpers({
    symbols() {
        const { uiContext: { selectedPortfolio }, dataContext: { LivePrices, PortfolioSnapshot } } = Template.currentData();
        if (selectedPortfolio == null) return;

        const portfolio = PortfolioSnapshot.findOne({ name: selectedPortfolio });
        if (!portfolio.symbols || portfolio.symbols.length === 0) return;

        const symbols = portfolio.symbols.map((symbol) => {
            const livePrice = LivePrices.findOne({ symbol: symbol.symbol });
            if (!livePrice) return;

            const total = symbol.quantity * livePrice.price;
            const closeTotal = symbol.quantity * livePrice.closePrice;
            const percentageDifference = closeTotal !== 0 ? (((total - closeTotal) / closeTotal) * 100) : 0.00;
            return {
                symbol: symbol.symbol,
                price: livePrice.price,
                quantity: symbol.quantity,
                percentageDifference: percentageDifference.toFixed(2),
                holdings: total.toFixed(2),
                displayColor: percentageDifference >= 0 ? 'green' : 'red'
            }
        });

        return symbols;
    }
});
/* #endregion */