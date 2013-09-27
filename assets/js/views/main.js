
// User home layout
// ----------------

SR.Layout.UserHome = Backbone.Layout.extend({
    initialize: function (options) {
        this.addViews({
            list: new SR.View.DashboardList
        })

        // Manually load user data since it's a join of collections
        this.listenTo(SR, 'updateUserData', function(){
            // TODO: Loading duplicate data here. The FacebookPages and TwitterProfiles
            // collections should be used globally, currently the dashboard builder uses
            // the `user.services` object, so we need to bring that in sync too.
            SR.user.fetch()
            $.getJSON(SR.settings.baseURL + '/me/data', _.bind(function(data){
                SR.log('Loaded user data', data)
                this.views.list.update(data)
                this.render()
            }, this))
        })

        SR.trigger('updateUserData')
    }
})

// Views
// ----------------

SR.View.DashboardList = Backbone.View.extend({
    template: 'list',
    initialize: function () {
        this.dashboards      = new SR.Collection.Dashboards
        this.facebookPages   = new SR.Collection.FacebookPages
        this.twitterProfiles = new SR.Collection.TwitterProfiles

        this.listenTo(SR, 'twitter_auth_finish', function(){
            SR.trigger('updateUserData')
        })

    },
    update: function (data) {
        this.dashboards.add(data.boards)
        this.facebookPages.add(data.fbpages)
        this.twitterProfiles.add(data.twprofiles)
    },
    render: function () {
        this.loading = false
        this.renderTemplate({
            dashboards      : this.dashboards.toJSON()
          , facebookPages   : this.facebookPages.toJSON()
          , twitterProfiles : this.twitterProfiles.toJSON()
        })
    }
})