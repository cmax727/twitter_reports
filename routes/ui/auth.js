
var passport = require('passport')
  , User = require("../../models").User

// Authentication middleware
// --------------------------

exports.require = function(req, res, next){
    if (req.isAuthenticated())
        return next();
    else
        res.redirect('/')
}

exports.status = function (req, res, next) {
    req.apiData = {
        logged : req.isAuthenticated()
      , name   : req.user ? req.user.name : ''
    }
    next()
}

// Facebook auth
// --------------
// This is the main authentication point - a user account is always created from a Facebook profile.

exports.facebook = passport.authenticate('facebook', {
    scope: ['manage_pages','email','read_insights', 'read_stream', 'read_friendlists']
})

exports.facebookCallback = passport.authenticate('facebook', {
    successRedirect: '/auth/finish',
    failureRedirect: '/auth/fail'
})

// Redirect after OAuth successful
exports.finish = function(req, res) {
    res.end('<script type="text/javascript">window.opener.SR.signInComplete(); window.close();</script>')
}

// Twitter auth
// -------------
// A user account can own multiple twitter accounts, saved as `TwitterProfile` models.
// They are equivalent to Facebook Pages. Note the use of `authorize` instead of `authenticate`.

exports.twitter = passport.authorize('twitter', {
    failureRedirect: '/auth/fail'
})

exports.twitterCallback = passport.authorize('twitter', {
    failureRedirect: '/auth/fail'
})

exports.twitterFinish = function (req, res) {
    res.redirect('/auth/twitter/done')
}

exports.twitterDone = function (req, res) {
    res.end("<script>window.opener.SR.trigger('twitter_auth_finish'); window.close();</script>")
}

// Sign out
// --------
exports.signOut = function(req, res) {
    req.logout()
    res.redirect('/')
}
