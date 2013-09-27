
SR.Model.Dashboard = Backbone.Model.extend({
    idAttribute: '_id'
  , urlRoot: SR.settings.baseURL + "/dashboard"
    // name
    // description
    // published
    // grid
})

SR.Collection.Dashboards = Backbone.Collection.extend({
    model: SR.Model.Dashboard
  , url: SR.settings.baseURL + '/dashboards'
  , comparator: function(dash) {
        return -new Date(dash.get('lastModified'))
    }
})
