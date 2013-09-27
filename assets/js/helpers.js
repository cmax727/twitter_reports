// Third-party settings
// ====================

// Set underscore to use {{mustache-style}} template delimiters
_.templateSettings = {
    interpolate : /\{\{(.+?)\}\}/g
}

// Layout manager
//   .addChild('sidebar', SR.View.Sidebar)
//   .childViews.sidebar.$('blah')
Backbone.Layout = Backbone.View.extend({
    // default to loading state, reverted on render()
    loading: true,

    addViews: function (views) {
        if (!this.views) this.views = {}

        _.each(views, function(view, name){
            if (typeof view.model === 'undefined'){
                view.model = this.model
            }
            this.views[name] = view
        }, this)
        return this
    },

    renderViews: function (data) {
        _.invoke(this.views, 'render', data)
        return this
    },

    appendViews: function (target) {
        _.each(this.views, function(view){
            this.$el.append(view.el)
        }, this)
        return this
    },

    destroyViews: function () {
        _.each(this.views, function(view){
            view.model = null
            view.remove()
        })
        return this
    },

    render: function () {
        this.loading = false
        this.renderViews().appendViews()
        this.trigger('render')
    },

    remove: function () {
        this.destroyViews()
        Backbone.View.prototype.remove.call(this)
    }
})

// Method to render a Handlebars template within a View
//   render: function () {
//      this.renderTemplate('template_name')
//   }
Backbone.View.prototype.renderTemplate = function (data) {
    var template = Handlebars.templates[this.template || this.options.template]
    if (!template) SR.log('error', "Template not found", this)
    this.$el.html(template(data))
    return this
}

Handlebars.registerHelper('date-from', function(date, block){
    return moment(date).fromNow().toString()
})

// SR.request
// -----------------------------------------

// Helper for communication between objects using the global event bus. Example:
//
//     SR.request('bacon', function(data){
//         // use data
//     })
//
// Provider objects should listen to request-* events:
//
//     SR.provide('bacon', this, function(){
//        return this.dataSomething
//     })

SR.request = function (id, callback, context) {
    (context || SR).once(id, callback)
    SR.trigger('request-' + id, context)
}

SR.provide = function (id, ctx, getData) {
    ctx.listenTo(SR, 'request-' + id, function(context){
        (context || SR).trigger(id, getData.call(ctx))
    })
}

// Drag & Drop data plugin
// -----------------------

// Enables sending native objects across drag & drop events.

SR.DragData = (function() {
    var uid = 0

    function set (e, data){
        var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer
          , uid = SR.DragData.uid++
        dataTransfer.setData('text', uid)
        SR.DragData[uid] = data
    }

    function get (e) {
        var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer
          , uid = dataTransfer.getData('text')
          , data = SR.DragData[uid]

        delete SR.DragData[uid]
        return data
    }

    return {
        set: set,
        get: get
    }
})()

// Etch config
// -----------

if (window.etch) etch.config.buttonClasses = {
    'default': ['save'],
    'all': ['bold', 'italic', 'underline', 'unordered-list', 'ordered-list', 'link', 'clear-formatting', 'save'],
    'title': ['bold', 'italic', 'underline', 'save'],
    'text': ['bold', 'italic', 'underline', 'link', 'clear-formatting']
};