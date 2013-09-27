
// Basic layout
// ============
SR.Layout.Base = Backbone.Layout.extend({
    events: {
        'click a': 'navigate'
    },
    navigate: function(e){
        
        // Handle all relative links in the application
        var href     = e.target.getAttribute('href')
          , target   = e.target.getAttribute('target')
          , rel      = e.target.getAttribute('rel')
          , protocol = this.protocol + "//"

        if (!href || href === '#' || rel === "absolute") return

        if (href.slice(protocol.length) !== protocol && !target && rel !== 'external') {
            e.preventDefault()
            if (href.indexOf(Backbone.history.root) == 0) {
                href = href.slice(Backbone.history.root.length)
            }
            Backbone.history.navigate(href, true)
        } else if (rel === 'external') {
            e.preventDefault()
            window.open(href)
        }
    },
    render: function () {
        this.$('.navbar-user').dropdown()
    }
})