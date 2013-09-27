var logger  = require('../../lib/logger')()
  , FBPages = require('../api/fbpages')
  , fb      = require('fb-new')
  , models  = require('../../models')
  , FBPage  = models.FBPage

// this handles the update my facebook pages button from the user profile page
exports.update = function(req, res) {
    logger.info('Updating facebook pages for user ', req.user.name)

    fb.api('me/accounts', 'get', { access_token: req.user.facebook.token }, function(results){
        if (!results || results.error) return res.send(500);
        var data = results.data;
        for (var i in data){
            var page = data[i];
            FBPage.add_or_update(page, req.user, function(err){
                if (err) res.send(500);
            });
        }
        
        // var testPage = { name: '[test page]', id: '19292868552' }
        // FBPage.add_or_update(testPage, req.user, function(){});
        
        res.redirect('back');
    });
}

// this handles the clicking of a fbpage from the user profile page
exports.show = function(req, res) {
    // passes the request onto the api call /api/fbpages/:id then puts that data
    // into fbpage = req.apiData
    FBPages.show(req, res, function(){
        res.render('me/fbpage', { title: "Facebook Page", user: req.user, page:'fbpage', fbpage: req.apiData });
    });
}

