
var permissions = {
    plans: {
        beta  : require('./plans/beta.json')
      , basic : require('./plans/basic.json')
      , pro   : require('./plans/pro.json')
    }
}

// Permission methods
// ------------------

// These are extended onto the `User` schema as dynamic methods, .e.g `user.canCreateDashboard()`

permissions.maxDashboards = function (user) {
    return plans[user.plan].maxDashboards
}

permissions.canCreateDashboard = function (user) {
    var max = permissions.maxDashboards(user)
    return user.dashboards.length < max
}

module.exports = permissions