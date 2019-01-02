import { Template } from 'meteor/templating';
import io from 'socket.io-client';
import './home.css';
import './home.html';

//collections
import { Portfolios } from '../../../collections/Portfolios.js';
import { Last } from '../../../collections/IEX.js'

//IEX Websocket endpoint
const lastURL = 'https://ws-api.iextrading.com/1.0/last';
const socket = io(lastURL);
//IEX Http endpoints
const ohlcURL = (symbol) => `https://api.iextrading.com/1.0/stock/${symbol}/ohlc`;


/* #region Home parent template */
Template.home.onCreated(function () {
    const tpl = this;
    //subscriptions
    const portfoliosHandle = this.subscribe('get:portfolios');

    //live stock data
    socket.on('connect', () => {
        tpl.autorun(() => {
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

        const exists = Last.findOne({ symbol: symbol });

        if (!exists) {
            const response = await fetch(ohlcURL(symbol));
            const { close } = await response.json();
            update.closePrice = close.price;
        }

        Last.update({ symbol: symbol },
            update,
            { upsert: true });
    });
});

Template.home.onDestroyed(function () {
    socket.disconnect();
});

Template.home.helpers({
    portfolioListData() {
        const instance = Template.instance();
        return {
            portfoliosReady: instance.subscriptionsReady(),
            portfolios() {
                return Portfolios.find({});
            },
            livePrices() {
                return Last.find({});
            }
        }
    }
});
/* #endregion */


/* #region Portfolio List */
Template.portfolioList.onCreated(function () {

});


Template.portfolioList.helpers({

});
/* #endregion */