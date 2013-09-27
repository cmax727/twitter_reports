var fs         = require('fs')
  , logger     = require('../lib/logger')()
  , path       = require('path')
  , glob       = require('glob')
  , handlebars = require('handlebars')

// Template helpers
function addHelpers (ctx) {

    // connect-assets' globals
    var js  = global.js
      , css = global.css

    ctx.registerHelper('js', function(name){
        return new ctx.SafeString(js.call(null, name))
    })
    ctx.registerHelper('css', function(name){
        return new ctx.SafeString(css.call(null, name))
    })
    ctx.registerHelper('json', function(obj){
        var pretty = process.env.NODE_ENV === 'development' ? 4 : 0
        return new ctx.SafeString(JSON.stringify(obj, null, pretty))
    })
}

// Template loader
// ---------------
// Load template files and pre-compile for sharing with the browser.
function loadTemplates(tpath, options){

    logger.info('Loading templates...')

    var files
      , watchers = {}

    function load () {
        Object.keys(watchers).forEach(function(w){
            watchers[w].close()
        })

        var templates = {}
          , compiled = "(function(){ Handlebars.templates = {}; var template = Handlebars.template;"

        files.forEach(function(file){
            if (options.not && options.not.test(file)) return

            var name   = path.basename(file, path.extname(file))
              , source = fs.readFileSync(file).toString()

            templates[name] = handlebars.compile(source)

            compiled += 'Handlebars.templates["'+name+'"] = template('
            compiled += handlebars.precompile(source)
            compiled += ');'

            if (process.env.NODE_ENV === 'development'){
                watchers[file] = fs.watch(file, load)
            }
        })

        compiled += '})();'

        handlebars.compiled = compiled
        handlebars.templates = templates
    }

    glob(tpath, function(err, res){
        if (err) {
            console.error('Failed to load templates')
            throw err
        }
        files = res
        load()
    })
}

module.exports = {
    addHelpers    : addHelpers
  , loadTemplates : loadTemplates
}
