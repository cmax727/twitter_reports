var config = require('../config')
  , models = require('../models')

var User = models.User
  , LocalStrategy = require('passport-local').Strategy

module.exports = function (passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id)
    })

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user)
        })
    })

    // Local auth (email + password)
    // ------------------------------
    if (config.enableEmailLogin) {
        passport.use(new LocalStrategy({ usernameField: 'email' }, User.authEmail.bind(User)))
    }

    // Twitter OAuth
    // --------------
    if (config.twitter) {
        var TwitterStrategy = require('passport-twitter').Strategy
        config.twitter.passReqToCallback = true
        passport.use(new TwitterStrategy(config.twitter, User.authTwitter.bind(User)))
    }

    // Facebook OAuth
    // ---------------
    if (config.facebook) {
        var FacebookStrategy = require('passport-facebook').Strategy
        passport.use(new FacebookStrategy(config.facebook, User.authFacebook.bind(User)))
    }

}

