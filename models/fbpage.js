
// Facebook Page Model
// ===================

var logger   = require('../lib/logger')()
  , _        = require('underscore')
  , qs       = require('querystring')
  , path     = require('path')
  , URL      = require('url')
  , util     = require('util')
  , moment   = require('moment')
  , FB       = require('fb')
  , mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId

var FBPage = new Schema({
    name      : { type: String }
  , fb_id     : { type: String }
  , fb_data   : { type: {}, default: {} }
  , num_likes : { type: Number, default: 0 }
  , user      : { type: ObjectId, ref: "User" }
})

FBPage.method('display', function(){
    return this.name ? this.name : ""
})

// Likes / Unlikes
// ---------------

// Generate a function to get likes / unlikes per day
function getInsight(metric, api_path){
    return function(options, callback){
        var url = '/' + this.fb_id + '/insights/' + api_path + '/day'

        // default == last 7 days
        var since = +new Date(options.since) || moment().utc().subtract('days', 7).startOf('day').toDate()
          , until = +new Date(options.until) || moment().utc().startOf('day').toDate()

        // make a call the facebook api through our fb package
        FB.api(url, 'get', {
            access_token: options.token
          , since: since / 1000
          , until: until / 1000
          , limit: options.limit || 90
        }, function(res){
            var data = res.data[0] && res.data[0].values
            // no results
            if (!data) return callback([])

            data = data.map(function(day, i){
                var obj = { date: day.end_time.split('T')[0] }
                obj[metric] = day.value
                return obj
            })

            callback(data)
        })
    }
}

// Get number of likes or unlikes per day for this page.
// User is required to get the auth token (see getXPerDay above)
FBPage.method('getLikesPerDay', getInsight('likes', 'page_fan_adds'))
FBPage.method('getUnlikesPerDay', getInsight('unlikes', 'page_fan_removes'))

// Batch requests
// --------------

function mergeValues(data){
    var keys = Object.keys(data)
      , ln = data[keys[0]].length
      , results = []

    // Loop over the first array's length
    for (var i = 0; i < ln; i++) {
        var obj = {}
        // Fill in data for each array
        keys.forEach(function(key){
            var list = data[key]
              , item = list[i]
              , value = item && item.value
            // First date wins
            obj.date || (obj.date = item && item.end_time && item.end_time.split('T')[0])
            obj[key] = (value != null ? value : null)
        })
        results.push(obj)
    }

    return results
}

function getDataValues (item) {
    return (item
        && typeof item.data !== 'undefined'
        && typeof item.data[0] !== 'undefined'
        && typeof item.data[0].values !== 'undefined'
        && item.data[0].values
    )
}

// Send a batch request to the FB API
// - options: `{ token, since, until, id, limit, urls }`
// `urls` can be either an object or array
// Takes a list of arrays and merges them using the `date` field as guide

function batchRequest(batchName, options, callback){

    // default == last 7 days
    var since = +new Date(options.since) || moment().subtract('days', 7).startOf('day').toDate()
      , until = +new Date(options.until) || 0

    var keys = Object.keys(options.urls)
      , basePath = '/' + (options.id || '')
      , batch = []
      , batches = []
      , params = _.extend({
            since: since / 1000
          , until: until / 1000
        }, options.params)

    keys.forEach(function(key){
        var url   = path.join(basePath, options.urls[key])
          , query = _.extend({}, params, URL.parse(url, true).query)

        batch.push({ method: 'get', relative_url: url + '?' + qs.stringify(query) })
    })

    // Overcome FB 50 data points per request limit if necessary
    var batchLimit = 50
    while (batch.length > batchLimit) {
        batches.push(batch.splice(0, batchLimit))
    }
    if (batch.length > 0) batches.push(batch)

    var total   = batches.length
      , results = options.array ? [] : {}
      , raw     = options.array ? [] : {}
      , errors  = []

    logger.info('Requesting data', { method: batchName, id: options.id, batches: total })

    batches.forEach(function(batch){
        FB.api('', 'post', {
            access_token: options.token
          , batch: batch
        }, function(res) {
            logger.info('Response received', { method: batchName, id: options.id, batch: total - batches.length })
            addResults(res)

            if (--batches.length <= 0) {
                if (errors.length) return callback(errors[0])
                logger.info('Batch finished', { method: batchName, id: options.id })
                if (options.merge) {
                    results = mergeValues(results)
                }
                callback(null, results, raw)
            }
        })
    })

    function addResults (res) {
        if (res.error || res.code >= 400) {
            try {
                var error = JSON.parse(res.body)
                error && (error = error.error)
            } catch (e) {} finally {
                logger.error(batchName + ' failed', error || res.error)
            }
            errors.push(new Error(batchName + ' failed'))
            return
        }

        ;(res || []).forEach(function(item, i){
            try {
                item = JSON.parse(item.body)
            } catch (e) {
                item = null
            }

            // Allow Graph API requests with plain object responses
            var values = item && Array.isArray(item.data)
                ? getDataValues(item)
                : item

            if (options.array) {
                raw.push(item)
                results.push(values)
            } else {
                raw[keys[i]] = item
                results[keys[i]] = values
            }
        })
    }
}

// Batch call to get likes + unlikes per day in a single request
FBPage.method('getLikesUnlikesPerDay', function(options, callback){

    batchRequest('likesUnlikes', {
        token : options.token
      , since : options.since
      , until : options.until
      , id    : this.fb_id
      , limit : options.limit || 30
      , urls  : {
            likes   : '/insights/page_fan_adds/day'
          , unlikes : '/insights/page_fan_removes/day'
        }
      , merge: true
    }, callback)

})

FBPage.method('getOverview', function(options, callback){

    // Get data from 1 day ago, last data point is usually incomplete
    var since = moment().subtract('days', 2).startOf('day').toDate()
      , until = moment().subtract('days', 1).startOf('day').toDate()

    batchRequest('overview', {
        token : options.token
      , since : since
      , until : until
      , id    : this.fb_id
      , urls  : {
            page    : '/?fields=likes'
          , fofs    : '/insights/page_friends_of_fans/day'
          , engaged : '/insights/page_engaged_users/days_28'
        }
      , merge: false
    }, function(err, res){
        if (err || !res) return callback(err, [])

        var page    = res.page
          , engaged = res.engaged && res.engaged[0]
          , fofs    = res.fofs && res.fofs[0]

        var data = {
            likes   : page    && page.likes    || 0
          , engaged : engaged && engaged.value || 0
          , fofs    : fofs    && fofs.value    || 0
        }
        callback(null, data)
    })

})

FBPage.method('getPosts', function(options, callback){

    var url = '/' + this.fb_id + '/posts'
      , apiOptions = {
            access_token: options.token
          , limit: options.limit || 15
        }

    // Only include since && until parameters if they have been set;
    // the `FB.api` call fails if they are `null` or `undefined`
    if (options.since && options.until) {
        // default == last 7 days
        var since = +new Date(options.since) || moment().subtract('days', 7).startOf('day').toDate()
          , until = +new Date(options.until) || moment().startOf('day').toDate()
        apiOptions.since = since / 1000
        apiOptions.until = until / 1000
    }

    var defaultFields = 'id,message,story,link,picture,type,created_time,comments,shares,likes'
    apiOptions.fields = options.fields || defaultFields

    logger.info('Requesting posts data', { method: 'getPosts', id: this.fb_id })

    FB.api(url, 'get', apiOptions, function(res){
        logger.info('Received posts data')
        callback(res.error, res.data || [])
    })
})

FBPage.method('getPostInteractions', function(options, callback){

    this.getPosts(options, function(err, posts){
        if (!Array.isArray(posts)) return callback(null, [])

        var posts = posts.map(function(post){
            post.message = (post.message || post.story || '')
                .replace(/\t/g, " ")
                .replace(/[\n\r]+/g, ' ')

            return {
                id       : post.id
              , date     : post.created_time.split('T')[0]
              , title    : post.message  ? post.message        : ' '
              , likes    : post.likes    ? post.likes.count    : 0
              , shares   : post.shares   ? post.shares.count   : 0
              , comments : post.comments ? post.comments.count : 0
            }
        })

        callback(null, posts)

    })
})

FBPage.method('getTopTenPosts', function(options, callback){

    options.limit = 90

    this.getPosts(options, function(err, posts){
        if (err || !Array.isArray(posts) || posts.length == 0) return callback(err, [])

        var urls = posts.map(function(post){
            return post.id + '/insights/post_storytellers'
        })

        batchRequest('topTenPosts storytellers', {
            token : options.token
          , urls  : urls
          , since : moment().subtract('days', 90).startOf('day').toDate() / 1000
        }, function(err, storytellers){
            var st = storytellers
            Object.keys(st).forEach(function(key){
                storytellers[key] = st[key] && st[key][0] && st[key][0].value || 0
            })
            if (err || !storytellers) return callback(err, [])

            var top = posts.map(function(post, i){
                post.talking = storytellers[i] || 0
                return post
            }).sort(function(a, b){
                if (b.talking > a.talking) return  1
                if (b.talking < a.talking) return -1
                a = a.likes + a.comments * 2
                b = b.likes + b.comments * 2
                return b - a
            }).slice(0, 10)

            var urls = top.reduce(function(urls, post, i){
                urls['p'+i+'_reach']   = post.id + '/insights/post_impressions_unique'
                urls['p'+i+'_engaged'] = post.id + '/insights/post_engaged_users'
                return urls
            }, {})

            batchRequest('topTenPosts reach/engaged', {
                token : options.token
              , urls  : urls
            }, function(err, data){
                if (err || !data) return callback(err, [])

                var results = top.map(function(post, i){
                    var reach   = (data['p'+i+'_reach'  ] || [])[0]
                      , engaged = (data['p'+i+'_engaged'] || [])[0]

                    // Fallback to likes & comments if insights data is empty
                    var likes    = post.likes    && post.likes.count    || 0
                      , comments = post.comments && post.comments.count || 0

                    return {
                        id       : post.id
                      , date     : post.created_time
                      , type     : post.type
                      , message  : post.message || post.story
                      , link     : post.link
                      , reach    : reach && reach.value || 0
                      , talking  : post.talking || comments || 0
                      , engaged  : engaged && engaged.value || (likes + comments) || 0
                      , likes    : likes
                      , comments : comments
                    }
                })

                callback(null, results)
            })
        })
    })
})

FBPage.method('getReachPerDay', function(options, callback){

    batchRequest('reachPerday', {
        token : options.token
      , since : options.since
      , until : options.until
      , id    : this.fb_id
      , urls  : {
            paid    : '/insights/page_impressions_paid_unique'
          , organic : '/insights/page_impressions_organic_unique'
          , viral   : '/insights/page_impressions_viral_unique'
        }
      , merge: true
    }, callback)

})

FBPage.method('getEngagedDemographics', function(options, callback){

    // default == last 7 days
    var since = +new Date(options.since) || moment().subtract('days', 7).startOf('day').toDate()
      , until = +new Date(options.until) || moment().startOf('day').toDate()

    FB.api('/'+this.fb_id+'/insights/page_storytellers_by_age_gender/week', 'get', {
        access_token: options.token
      , since: since / 1000
      , until: until / 1000
    }, function(res){

        var data = res.data[0] && res.data[0].values
          , sum = {}

        // sum period values for each gender/age group
        data.forEach(function(period, i){
            var groups = period.value
            Object.keys(groups).forEach(function(group){
                sum[group] || (sum[group] = 0)
                sum[group] += +groups[group]
            })
        })

        // convert object to array of values
        data = []
        Object.keys(sum).forEach(function(group){
            var parts = group.split('.')
            data.push({
                gender    : parts[0]
              , range     : parts[1]
              , frequency : sum[group]
            })
        })

        callback(null, data)
    })

})

FBPage.method('getTopFiveFans', function(options, callback){

    this.getPosts(options, function(err, posts){
        if (!Array.isArray(posts)) return callback(null, [])

        var names = {}

        // aggregate user activity count
        var fans = posts.reduce(function(fans, post, i){
            var likes = post.likes && post.likes.data || []
              , comments = post.comments && post.comments.data || []

            likes.forEach(function(item){
                var id = item.id
                names[id] || (names[id] = item.name)
                fans[id] || (fans[id] = { likes: 0, comments: 0 })
                fans[id].likes += 1
            })

            comments.forEach(function(item){
                var id = item.from.id
                names[id] || (names[id] = item.from.name)
                fans[id] || (fans[id] = { likes: 0, comments: 0 })
                fans[id].comments += 1
            })

            return fans
        }, {})

        // convert back to array, sort by count
        fans = Object.keys(fans).map(function(id, i){
            fans[id].name = names[id]
            fans[id].id = id
            return fans[id]
        }).sort(function(a,b){
            return (b.likes + b.comments) - (a.likes + a.comments)
        }).slice(0,10) // leave room for invalid profiles (non-person users)

        var urls = fans.map(function(user){
            return user.id
        })

        // get user data
        batchRequest('fan user data', {
            token  : options.token
          , urls   : urls
          , params : { fields: 'id,name,username,gender,locale,picture' }
          , array  : true
        }, function(err, r, data){
            data = data.filter(function(item, i){
                item.picture  = item.picture && item.picture.data.url
                item.likes    = fans[i].likes
                item.comments = fans[i].comments
                // filter out invalid profiles
                return !item.error
            }).slice(0,5)
            callback(err, data)
        })

    })
})

// Static methods
// --------------
// All DB queries required by the app should be encapsulated in a
// static method here.

// Get all pages that belong to `user`
FBPage.static('getByUser', function(user, callback){
    this.find({ user: user }).exec(function(err, pages){
        callback(err, pages)
    })
})

// Add or update a page
function do_update (fbpage, user){
    FB.api(fbpage.fb_id+'', 'get', { access_token: user.facebook.token }, function(res){
        if (res) {
            fbpage.fb_data = res;
            if (res.likes) {
                fbpage.num_likes = res.likes;
            }
            fbpage.save();
        }
    });
}
FBPage.static('add_or_update', function(page, user, callback){
    var me = this;
    this.findOne({ fb_id: page.id, name: page.name, user: user }).exec(function(err, fbpage){
        if (err) callback(err)
        if (!fbpage) {
            fbpage = new me({ name: page.name, fb_id: page.id, user: user });
        }
        fbpage.save();
        do_update(fbpage, user);
        callback();
    });
});

module.exports = mongoose.model('FBPage', FBPage)
