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


FlowRouter.route('/settings', {
    action() {
        BlazeLayout.render('app', { main: 'settings' });
    }
});
