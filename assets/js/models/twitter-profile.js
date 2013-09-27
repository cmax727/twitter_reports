SR.Model.TwitterProfile = Backbone.Model.extend({
    idAttribute: '_id'
})

SR.Collection.TwitterProfiles = Backbone.Collection.extend({
    model: SR.Model.TwitterProfile
  , url: function(){ return SR.settings.baseURL + '/twprofile' }
})
