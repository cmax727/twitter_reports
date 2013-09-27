var logger   = require('../../lib/logger')()
  , mongoose = require('mongoose')
  , config   = require('../../config')

var TwitterProfile = mongoose.model('TwitterProfile')

exports.index = function(req, res, next) {
    TwitterProfile.getByUser(req.user, function(err, profiles){
        req.apiData = profiles.toObject()
        next()
    })
}

exports.list = exports.index

exports.show = function(req, res, next) {
    TwitterProfile.findOne({ user: req.user, _id: req.params.id }).exec(function(err, profile){
        req.apiData = profile
        next()
    })
}

// Route data requests to model methods
exports.getData = function (req, res, next) {

    var method = req.params.method
      , id     = req.params.id
      , options = {
            since : req.query.since
          , until : req.query.until
          , limit : req.query.limit
        }

    method = 'get' + method[0].toUpperCase() + method.substr(1)

    TwitterProfile.findById(id).populate('user').exec(function(err, profile){
        if (err) {
            logger.error('Profile not found', { id: id })
            return next()
        }

        if (typeof profile[method] !== 'function'){
            return res.end('Invalid path.')
        }

        auth = {
            consumer_key        : config.twitter.consumerKey
          , consumer_secret     : config.twitter.consumerSecret
          , access_token        : profile.token
          , access_token_secret : profile.tokenSecret
        }

        profile[method](auth, options, function(err, data){
            req.apiData = data
            next()
        })
    })
}
