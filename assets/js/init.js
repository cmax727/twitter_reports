;(function(){

    // Main application object
    // =======================
    // SR be used as a global event bus.

    var SR = _.extend({}, Backbone.Events, {

        Layout     : {}, // Holds Layout constructors
        View       : {}, // holds View constructors
        Model      : {}, // holds Model constructors
        Collection : {}, // holds Collection constructors

        Modules : {}, // Holds active Module (View) instances
        Charts  : {}, // Holds Chart instances, created at load time

        // Default application settings.
        settings: {
            baseURL: '/api'
        },

        // Logging utility, silent unless `SR.debug == true`.
        log: function () {
            if (!SR.debug) return
            args = Array.prototype.slice.call(arguments, 0)
            method = /^(info|error|warn)$/.test(args[0])
                ? args.shift()
                : 'log'
            console[method].apply(console, arguments)
        },

        // Set debug state on init. Use
        //    localStorage.debug = true || false
        // to persistently enable/disable debugging.
        debug: window.localStorage && localStorage.debug === 'true'

    })

    // Export app to global context
    this.SR = SR

}).call(this)
