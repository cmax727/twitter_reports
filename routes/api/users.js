var models = require('../../models')
  , Users  = models.User

exports.show = function(req, res) {
    if (req.user && req.user.isAdmin) {
        Users.find(req.params.id, function(err, user){
            res.send(user)
        })
    } else {
        res.send(404)
    }
}
