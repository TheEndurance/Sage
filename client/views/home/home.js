import { Template } from 'meteor/templating';
import io from 'socket.io-client';
import './home.css';
import './home.html';

const DAY_AS_MILLISECONDS = 24 * 60 * 60 * 1000;
let SOCKET;

//collections
import { Portfolios } from '../../../collections/Portfolios.js';
import { Last } from '../../../collections/IEX.js'

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
                    if (!portfolio.transactions || portfolio.transactions.length === 0) return;
                    portfolio.transactions.forEach((transaction) => {
                        if (symbols[transaction.symbol]) return;
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
        let update = { symbol: symbol, price: price };
        const last = Last.findOne({ symbol: symbol });

        //If there is no local data for a stock OR if the price close time is more than 24 hours then
        //we need to refetch new market data
        if (!last || new Date().valueOf() - new Date(last.closeTime) >= DAY_AS_MILLISECONDS) {
            const response = await fetch(ohlcURL(symbol));
            const { close } = await response.json();
            update.closePrice = close.price;
            update.closeTime = close.time;
        }

        Last.update({ symbol: symbol },
            update,
            { upsert: true });
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
            portfolios: Portfolios,
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
        //TODO: OPTIMIZE
        //I can make more optimizations here, since livePrices is reactive and expected to update very frequently
        //it might be better to extract the calculations of the transactions sums to inside of the mongo collection itself
        //that way we won't need to iterate over the transactions every time live prices updates, only if portfolios update..
        /**
         * Last Collection
         * {
         *  symbol : "AAPL",
         *  quantity : calculated from Portfolios,
         *  price : 194.73 (updates from IEX API)
         *  total : calculated reactively by price * quantity
         * }
         */
        const { dataContext: { portfolios, livePrices } } = Template.currentData();
        const portfolioList = portfolios.find({}).fetch().map((portfolio) => {
            let total = 0.00;
            if (portfolio.transactions && portfolio.transactions.length > 0) {
                total = portfolio.transactions.reduce((sum, transaction) => {
                    const livePrice = livePrices.findOne({ symbol: transaction.symbol });
                    let addToSum = 0.00;

                    if (livePrice && livePrice.price && transaction.quantity > 0) {
                        const multiplier = transaction.type === 'buy' ? 1 : -1;
                        addToSum = (transaction.quantity * livePrice.price * multiplier);
                    }

                    return sum + addToSum;
                }, 0.00);
            }
            return {
                name: portfolio.name,
                total: total.toFixed(2)
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