var logger   = require('../../lib/logger')()
  , mongoose = require('mongoose')
  , FBPage   = mongoose.model('FBPage')

exports.index = function(req, res, next) {
    FBPage.find({ user: req.user }).exec(function(err, pages){
        req.apiData = pages.map(function(page){
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
        next()
    })
}

exports.list = exports.index

exports.show = function(req, res, next) {
    FBPage.findOne({ user:req.user, _id: req.params.id }).exec(function(err, page){
        req.apiData = page;
        next();
    });
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

    FBPage.findById(id).populate('user').exec(function(err, page){
        if (err) {
            logger.error('Page not found', { fb_id: id })
            return next()
        }

        if (typeof page[method] !== 'function'){
            return res.end('Invalid path.')
        }

        options.token = page.user.facebook.token

        page[method](options, function(err, data){
            req.apiData = data
            next()
        })
    })
}
