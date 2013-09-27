
// Facebook Page Model
// ===================

var logger   = require('../lib/logger')()
  , _        = require('underscore')
  , Twit     = require('twit')
  , mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId

var TwitterProfile = new Schema({
    name        : String
  , screen_name : String
  , id          : Number
  , token       : String
  , tokenSecret : String
  , user        : { type: ObjectId, ref: "User" }
})

// Static methods
// --------------
// All DB queries required by the app should be encapsulated in a
// static method here.

// Batch call to get likes + unlikes per day in a single request
TwitterProfile.method('getOverview', function(auth, options, callback){

    new Twit(auth).get('users/show', { screen_name: this.screen_name, entities: false }, function(err, user){
        if (err) return callback(err, [])
        var data = _(user).pick('followers_count', 'friends_count', 'listed_count')
        callback(null, data)
    })

})

// Batch call to get last 10 retweeted tweets
TwitterProfile.method('getTopTenRetweets', function(auth, options, callback){
    new Twit(auth).get('statuses/retweets_of_me', { count: 10 }, function(err, tweets){
        if (err) return callback(err, [])
        var data = tweets.map(function(tweet){
            return {
                id                  : tweet.id
                , created_at        : tweet.created_at//.split('T')[0]
                , retweet_count     : tweet.retweet_count
            }
        })
        callback(null, data)
    })
})



// Get all pages that belong to `user`
TwitterProfile.static('getByUser', function(user, callback){
    this.find({ user: user }).exec(callback)
})

TwitterProfile.static('addOrUpdate', function(user, token, tokenSecret, data, callback){
    var TwitterProfile = this

    this.findOne({ id: data.id }).exec(function(err, profile){
        if (err) return callback (err)

        if (!profile) profile = new TwitterProfile

        console.log('token', token)
        console.log('secret', tokenSecret)

        _.extend(profile, {
            name        : data.displayName
          , screen_name : data.username
          , id          : data.id
          , token       : token
          , tokenSecret : tokenSecret
          , user        : user
          , raw         : data._json
        })

        profile.save(callback)
    })
})

module.exports = mongoose.model('TwitterProfile', TwitterProfile)
