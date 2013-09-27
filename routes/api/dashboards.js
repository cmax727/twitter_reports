var fs   = require('fs')
  , util = require('util')
  , path = require('path')

var models    = require('../../models')
  , Dashboard = models.Dashboard
  , FBPage    = models.FBPage
  , Module    = models.Module

exports.index = function(req, res, next){
    Dashboard.find({ user: req.user }).exec(function(err, boards){
        if (err) console.log(err)
        boards = boards.map(function(board){
            return {
                _id       : board._id
              , title     : board.title
              , isDraft   : board.isDraft
              , fb_source : board.fb_source
              , tw_source : board.tw_source
            }
        })
        // TODO send only necessary data for FBpages
        FBPage.find({ user: req.user }).exec(function(err, pages){
            if (err) console.log(err)
            req.apiData = {
                dashboards : boards
              , pages      : pages
            }
            next()
        })
    })
}

exports.get = function(req, res, next){
    Dashboard.findOne({_id: req.params.id, user: req.user }).exec(function(err, board){
        if (err){
            console.log(err)
            req.apiData = {}
        } else {
            req.apiData = board
        }
        next()
    })
}

exports.view = function(req, res, next){
    Dashboard.findOne({ _id: req.params.id /*, isDraft: false*/ }).exec(function(err, board){
        if (err || !board){
            console.log(err || 'Dashboard '+req.params.id+' not found')
            req.apiData = {}
        } else {
            req.apiData = {
                _id         : board._id
              , title       : board.title
              , description : board.description
              , rows        : board.rows
              , fb_source   : board.fb_source
              , tw_source   : board.tw_source
            }
        }
        next()
    })
}

exports.uploadImage = function (req, res, next) {

    var file = req.files && req.files.image && req.files.image.file
      , uid  = req.body && req.body.image && req.body.image.uid

    var extension = path.extname(file.path)
      , directory = path.normalize(__dirname + '../../../public/uploads')
      , filename  = uid + extension

    var newPath = path.join(directory, filename)

    if (global.s3client) {
        // Upload to S3
        fs.createReadStream(file.path).pipe(s3client.upload({
            container: 'switch-reports'
          , remote: 'images/' + filename
        }, function(err, status, res){
            req.apiData = { path: 'https://switch-reports.s3.amazonaws.com/images/' + filename }
            next()
        }))
    } else {
        // Local save
        fs.rename(file.path, newPath, function(err){
            req.apiData = { path: '/uploads/' + filename }
            next()
        })
    }

}

exports.createOrUpdate = function(req, res, next){
    Dashboard.findOne({ _id: req.body._id, user: req.user }).exec(function(err, board){
        if (err) return console.log(err)

        if(!board) board = new Dashboard()

        ;[
            'title'
          , 'description'
          , 'fb_source'
          , 'tw_source'
          , 'rows'
          , 'isDraft'
          , 'lastModified'
          , 'frequency'
          , 'recipients'
        ].forEach(function(key){
            board[key] = req.body[key]
        })

        board.rows && board.rows.forEach(function(row){
            row && row.forEach(function(module){
                if (module && module.text) {
                    module.text = require('validator').sanitize(module.text).xss()
                }
            })
        })

        board.user = req.user

        board.save(function(err, board){
            if(err) return console.log(err)
            req.apiData = board
            next()
        })
    })
}

exports.delete = function(req, res, next){
    Dashboard.findById(req.params.id).exec(function(err, board){
        if (err) {
            console.log(err)
            next(err)
        }
        if (board) {
          board.remove()
          req.apiData = {}
        }
        next()
    });
}
