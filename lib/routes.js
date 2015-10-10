// ************************* ROUTES ********************************
FlowRouter.route('/', {
  name: 'home',
  triggersEnter: [],
  action: function(params, queryParams) {
    BlazeLayout.render('home')
  },
  triggersExit: []
})
