FlowRouter.route('/', {
    action() {
        BlazeLayout.render('app', { main: 'home' });
    }
});
FlowRouter.route('/transaction', {
    action() {
        BlazeLayout.render('app', { main: 'transaction' });
    }
});
FlowRouter.route('/portfolio', {
    action() {
        BlazeLayout.render('app', { main: 'portfolioForm' });
    }
});

FlowRouter.route('/settings', {
    action() {
        BlazeLayout.render('app', { main: 'settings' });
    }
});
