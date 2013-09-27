//= require vendor/jquery
//= require vendor/underscore
//= require vendor/backbone
//= require vendor/d3
//= require vendor/bootstrapManifest
//= require vendor/handlebars
//= require vendor/date
//= require vendor/sanitize
//= require init
//= require util
//= require helpers
//= require chart
//= require_tree ./charts
//= require ./models/dashboard
//= require ./views/dashboard.js
//= require ./views/grid.js
//= require ./views/modules.js

SR.Layout.DashboardView = Backbone.View.extend({
    initialize: function (options) {

        this.model = new SR.Model.Dashboard(SR.DashboardData)

        this.grid = new SR.View.ModuleGridViewer({
            model: this.model
          , width : 2
        })

    },
    render: function () {
        this.grid.render()
        this.$el.append(this.grid.el)
    }
})

SR.View.ModuleGridViewer = SR.View.ModuleGrid.extend({
    viewer: true,
    events: {},
    render: function () {
        this.drawModules(this.el)
    }
})

;(function(){

    // Application router
    // ---------------------
    var AppRouter = Backbone.Router.extend({
        initialize: function (){
            SR.log('Application router initialized')
        },

        routes: {
            'view/:id' : 'dashboardView'
        },

        dashboardView: function(id){
            var view = new SR.Layout.DashboardView({ el: '.grid-rows', id: id })
            view.render()
        }
    })

    // Application start-up
    // --------------------
    SR.view = function(data){
        SR.log('Initializing viewer')
        SR.Router = new AppRouter
        SR.DashboardData = data
        Backbone.history.start({
            pushState: true
          , root: '/dashboard'
        })
    }
    
})()