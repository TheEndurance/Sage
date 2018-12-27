FlowRouter.route('/', {
    action() {
        BlazeLayout.render('app', { main: 'home' });
    }
});
FlowRouter.route('/add', {
    action() {
        BlazeLayout.render('app', { main: 'add' });
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
