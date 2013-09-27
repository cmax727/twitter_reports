//= require vendor/jquery
//= require vendor/underscore
//= require vendor/backbone
//= require vendor/d3
//= require vendor/bootstrapManifest
//= require vendor/handlebars
//= require vendor/date
//= require vendor/daterangepicker
//= require vendor/moment
//= require vendor/etch
//= require vendor/sanitize
//= require vendor/jquery.form
//= require init
//= require util
//= require helpers
//= require chart
//= require_tree ./charts
//= require_tree ./models
//= require_tree ./views

;(function(){

    // Application router
    // ---------------------
    var AppRouter = Backbone.Router.extend({
        initialize: function (){
            SR.log('Application router initialized')
        },

        routes: {
            'edit/:id'     : 'dashboardEdit'
          , 'new'          : 'dashboardEdit'
          , 'auth/signout' : 'signOut'
          , '*path'        : 'home' // catch all
        },

        home: function(){
            var view = new SR.Layout.UserHome
            SR.Controller.show(view)
            $('#main-nav .all').addClass('active').siblings().removeClass('active')
            this.navigate('/all')
        },

        dashboardEdit: function (id) {
            var view = new SR.Layout.DashboardEdit({ id: id })
            $('#main-nav .new').addClass('active').siblings().removeClass('active')
            SR.Controller.show(view)
        },

        signOut: function () {
            window.location = '/auth/signout'
        }
    })

    // Log all route changes.
    Backbone.history.on('route', function(route, name){
        SR.log('Route', name, 'loaded')
    })

    // Application controller
    // ----------------------
    // Handles layout views' lifecycle.
    var AppController = Backbone.View.extend({
        show: function (view) {
            var closing = this.view
            this.view = view
            // Layouts that need to fetch data before render should set
            // this.loading = true while waiting for a fetch, then render themselves
            SR.log('Loading layout:', view)
            if (!this.view.loading) {
                this.view.render()
            }
            this.$el.append(this.view.el)
            closing && closing.remove()
        }
    })

    // Application start-up
    // --------------------
    SR.init = function(userData){

        var user = SR.user = new SR.Model.User
        user.fetch({ success: start })

        function start(){
            SR.log('User data loaded', user.toJSON())

            SR.Router     = new AppRouter
            SR.Controller = new AppController({ el: '#main' })

            // Render base layout
            var base = new SR.Layout.Base({ el: document.body }).render()

            Backbone.history.start({
                pushState: true
              , root: '/dashboard'
            })
        }
    }
    
})()