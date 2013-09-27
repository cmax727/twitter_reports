SR.Model.FacebookPage = Backbone.Model.extend({
    idAttribute: '_id'
})

SR.Collection.FacebookPages = Backbone.Collection.extend({
    model: SR.Model.FacebookPage
  , url: function(){ return SR.settings.baseURL + '/fbpage' }
})
