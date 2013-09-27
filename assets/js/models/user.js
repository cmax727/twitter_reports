SR.Model.User = Backbone.Model.extend({
    initialize: function(){

    },
    url: function(){
        return SR.settings.baseURL + '/me'
    }
})
