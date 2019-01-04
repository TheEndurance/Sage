import { Template } from 'meteor/templating';
import io from 'socket.io-client';
import './home.css';
import './home.html';

const DAY_AS_MILLISECONDS = 24 * 60 * 60 * 1000;
let SOCKET;

//collections
import { Portfolios } from '../../../collections/Portfolios.js';
import { Last, PortfolioSnapshot } from '../../../collections/IEX.js'

//IEX endpoints
const lastURL = 'https://ws-api.iextrading.com/1.0/last';
const ohlcURL = (symbol) => `https://api.iextrading.com/1.0/stock/${symbol}/ohlc`;


/* #region Home parent template */
Template.home.onCreated(function () {
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
                    PortfolioSnapshot.insert({ name: portfolio.name, symbols: [] });
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

        const last = Last.findOne({ symbol: symbol }) || { symbol: symbol };

        //if the price close time is more than 24 hours then we need to refetch new market data
        if (!last.closeTime || new Date().valueOf() - new Date(last.closeTime) >= DAY_AS_MILLISECONDS) {
            const response = await fetch(ohlcURL(symbol));
            const { close } = await response.json();
            last.closePrice = close.price;
            last.closeTime = close.time;
        }
        last.price = price;
        Last.update({ symbol: symbol }, last, { upsert: true });
    });
});

Template.home.onDestroyed(function () {
    SOCKET.disconnect();
});

Template.home.helpers({
    portfolioListData() {
        const instance = Template.instance();
        return {
            subsReady: instance.subscriptionsReady(),
            portfolios: PortfolioSnapshot,
            livePrices: Last
        }
    }
});
/* #endregion */


/* #region Portfolio List */
Template.portfolioList.onCreated(function () {
});


Template.portfolioList.helpers({
    portfoliosExist() {
        return Portfolios.find({}).count() > 0;
    },
    portfolios() {
        const { dataContext: { portfolios, livePrices } } = Template.currentData();
        const portfolioList = portfolios.find({}).fetch().map((portfolio) => {
            let total = 0.00;
            let closeTotal = 0.00;
            if (portfolio.symbols && portfolio.symbols.length > 0) {
                portfolio.symbols.forEach((symbol) => {
                    const livePrice = livePrices.findOne({ symbol: symbol.symbol });
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
    },
    isLoaded() {
        const { dataContext: { subsReady } } = Template.currentData();
        return subsReady;
    }
});
/* #endregion */