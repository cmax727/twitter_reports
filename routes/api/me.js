var models    = require('../../models')
  , _         = require('underscore')
  , Dashboard = models.Dashboard
  , FBPage    = models.FBPage
  , TwProfile = models.TwitterProfile
  , Module    = models.Module

exports.getBasicProfile = function (req, res, next) {
    var user = req.user

    var data = {
        _id  : user._id
      , name : user.name
      , services : {
            facebook: {
                username : user.facebook.username
              , token    : user.facebook.token
            }
          , twitter: {
              profiles: []
            }
        }
    }

    var done = _.after(2, function(){
        req.apiData = data
        next()
    })

    FBPage.find({ user: user }).exec(function(err, pages){
        data.services.facebook.pages = pages.map(function(page){
            return {
                _id      : page._id
              , fb_id    : page.fb_id
              , name     : page.name
              , likes    : page.num_likes
              , url      : page.fb_data.link
              , icon_url : page.fb_data.icon_url
              , logo_url : page.fb_data.logo_url
            }
        })
        done()
    })

    TwProfile.find({ user: user }).exec(function(err, profiles){
        data.services.twitter.profiles = profiles.map(function(profile){
            return _(profile).pick('_id', 'name', 'screen_name')
        })
        done()
    })
}

exports.getAll = function(req, res, next){

    var data = {}

    var done = _.after(3, function(){
        req.apiData = data
        next()
    })

    // Get Dashboards
    Dashboard.find({ user: req.user }).exec(function(err, boards){
        data.boards = boards.map(function(board){
            return {
                _id          : board._id
              , title        : board.title
              , isDraft      : board.isDraft
              , lastModified : board.lastModified
            }
        })
        done()
    })

    // Get Facebook pages
    FBPage.find({ user: req.user }).exec(function(err, pages){
        data.fbpages = pages.map(function(page){
            return {
                _id      : page._id
              , fb_id    : page.fb_id
              , name     : page.name
              , likes    : page.num_likes
              , url      : page.fb_data.link
              , icon_url : page.fb_data.icon_url
              , logo_url : page.fb_data.logo_url
            }
        })
        done()
    })

    // Get Twitter profiles
    TwProfile.find({ user: req.user }).exec(function(err, profiles){
        data.twprofiles = profiles.map(function(profile){
            return _(profile).pick('_id', 'name', 'screen_name')
        })
        done()
    })
}

exports.getPages = function (req, res, next) {
    FBPage.getByUser(req.user, function(err, data){
        req.apiData = data
        next()
    })
}

exports.show = function (req, res) {
    res.json(req.user)
}
