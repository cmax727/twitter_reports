
/**
 * Module dependencies.
 */

var config        = require('./config')
  , domain        = require('domain')
  , express       = require('express')
  , http          = require('http')
  , fs            = require('fs')
  , path          = require('path')
  , glob          = require('glob')
  , handlebars    = require('handlebars')
  , hbs           = require('hbs')
  , mongoose      = require('mongoose')
  , passport      = require('passport')

var models        = require('./models')
  , User          = models.User
  , MongoStore    = require('connect-mongo')(express)
  , sessionStore  = new MongoStore({ url: config.mongodb })

// Remote logging
// ---------------
if (config.nodefly) {
  require('nodefly').profile(
      config.nodefly,
      ['Switch Reports', 'Heroku']
  )
}

// File storage
// -------------
if (config.s3) {
    global.s3client = require('pkgcloud').storage.createClient({
        provider: 'amazon'
      , key: config.s3.secret
      , keyId: config.s3.keyId
    })
}

// Database
// ---------
mongoose.connect(config.mongodb)

// Authentication
// ---------------
require('./lib/authentication.js')(passport)

// Payments
// ---------
if (config.stripe) {
    global.stripe = require('stripe')(config.stripe.key)
}

// Express app
// ------------
var app    = express()
  , server = http.createServer(app)

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'hbs');
    app.locals.pretty = true;

    app.use(require('connect-assets')())
    app.use(express.favicon())
    app.use(express.logger(config.loggerFormat))
    app.use(express.bodyParser({ keepExtensions: true }))
    app.use(express.methodOverride())
    app.use(express.cookieParser(config.sessionSecret))
    app.use(express.session({ store: sessionStore }))
    app.use(passport.initialize())
    app.use(passport.session())
    app.use(express.static(__dirname + '/public'))
    app.use(app.router)
})

app.configure('development', function(){
    app.use(express.errorHandler())
})

// Load view templates.
var views = require('./lib/views')
views.addHelpers(hbs)
views.loadTemplates('./views/dashboard/*.hbs', {
    not: /index/
})

// Load application routes.
require('./routes')(app)

// Start up the server.
server.listen(app.get('port'), function(){
    console.log("Server listening on port " + app.get('port'))
})
