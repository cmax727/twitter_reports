
// Routes initializer
// ==================

// Loads all routes to an object tree.

var require_tree = require('require-tree')
  , logger       = require('../lib/logger')()
  , handlebars   = require('handlebars')

var config = require('../config')
  , UI     = require_tree(__dirname + '/ui')
  , API    = require_tree(__dirname + '/api')

module.exports = function (app) {

    logger.info('Loading routes...')

    // UI routes
    // ==========================

    app.get('/', UI.home)

    // Authentication
    // --------------
    if (config.facebook) {
        app.get('/auth/facebook', UI.auth.facebook)
        app.get('/auth/facebook/callback', UI.auth.facebookCallback)
    }

    if (config.twitter) {
        app.get('/auth/twitter', UI.auth.twitter)
        app.get('/auth/twitter/callback', UI.auth.twitterCallback, UI.auth.twitterFinish)
        app.get('/auth/twitter/done', UI.auth.twitterDone)
    }

    app.get('/auth/finish', UI.auth.finish)
    app.get('/auth/signOut', UI.auth.signOut)

    app.get('/auth/status'
      , UI.auth.status
      , API.json)

    // Dashboard viewer
    // ----------------
    // temporary templating
    app.get('/dashboard/view/:id', API.dashboards.view, function(req, res){
        res.render('dashboard/viewer', {
            dashboard: req.apiData
        })
    })

    // API routes
    // ==========================

    // Data endpoints must be public, for the dashboard viewer
    app.get('/api/facebook/:id/:method'
      , API.fbpages.getData
      , API.json)

    app.get('/api/twitter/:id/:method'
      , API.twitter.getData
      , API.json)

    // Serve compiled templates to the client
    app.get('/templates.js', function(req, res){
        res.header('Content-type', 'text/javascript')
        res.end(handlebars.compiled)
    })

    // Every following route requires authentication
    app.all('*', UI.auth.require)

    app.get('/dashboard*', function(req, res){
        res.render('dashboard/index', {
            user: req.user
        })
    })

    app.get('/api/me'
      , API.me.getBasicProfile
      , API.json)

    app.get('/api/me/data'
      , API.me.getAll
      , API.json)

    app.get('/api/dashboard/:id'
      , API.dashboards.get
      , API.json)

    // Create or update dashboard
    app.post('/api/dashboard'
      , API.dashboards.createOrUpdate
      , API.json)

    app.put('/api/dashboard/:id'
      , API.dashboards.createOrUpdate
      , API.json)

    app.del('/api/dashboard/:id'
      , API.dashboards.delete
      , API.json)

    // Facebook data
    app.get('/api/facebook/pages'
      , API.fbpages.list
      , API.json)

    app.get('/api/facebook/:id'
      , API.fbpages.show
      , API.json)

    app.get('/facebook/update'
      , UI.fbpage.update)

    // Uploads
    app.post('/upload/image'
      , API.dashboards.uploadImage
      , API.json)

}
