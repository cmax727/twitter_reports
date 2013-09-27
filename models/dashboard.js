// Dashboard Model
// ===============

var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId

var DashboardSchema = new Schema({
    title        : String
  , description  : String
  , user         : { type: ObjectId, ref: "User" }
  , fb_source    : { type: ObjectId, ref: "FBPage" }
  , tw_source    : { type: ObjectId, ref: "TwitterProfile" }
  , rows         : []
  , isDraft      : { type: Boolean, default: false }
  , lastModified : { type: Date, default: Date.now }
  , lastSent     : { type: Date, default: 0 }
  , frequency    : { type: String, enum: ['everyday', 'everymonth', 'mon', 'tue', 'wed', 'thu', 'fri']}
  , recipients   : [String]
})

module.exports = mongoose.model('Dashboard', DashboardSchema)
