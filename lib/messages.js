var moment   = require('moment')
  , _        = require('underscore')
  , fs       = require('fs')
  , hb       = require('handlebars')
  , mongoose = require('mongoose')
  , mailer   = require('./sendmail')

var templates = {
    html: hb.compile(fs.readFileSync(__dirname + '/../templates/email-html.handlebars').toString())
  , text: hb.compile(fs.readFileSync(__dirname + '/../templates/email-text.handlebars').toString())
}

var Dashboard = require('../models/dashboard')

// Message delivery for dashboards
// -------------------------------

function getAll (cb) {
    var today      = moment.utc().startOf('day')
      , weekDay    = today.format('ddd').toLowerCase()
      , weekStart  = moment.utc().day(1).startOf('day')
      , monthStart = moment.utc().startOf('month')

    var queries = [
        { frequency: 'everyday'  , lastSent: { $lt: +today      } }
      , { frequency: weekDay     , lastSent: { $lt: +weekStart  } }
    ]

    // Are we at the beginning of the month?
    if (+today == +monthStart) {
        queries.push({ frequency: 'everymonth', lastSent: { $lt: +monthStart } })
    }

    // Get all pending messages
    Dashboard.find({ $or: queries }, function(err, results){
        console.info('%s dashboards found', results.length)
        if (err) return console.error('Fail.')
        cb(results)
    })
}

function sendMessage (dashboard, cb) {
    var data = {
        name : dashboard.title
      , url  : 'http://switch-reports-dev.herokuapp.com/dashboard/view/' + dashboard._id
    }

    var recipients = (dashboard.recipients || [])
        .map(function(email){
            return email.trim().replace(/[,;]/g, '') // ignore separators
        }).filter(function(email){
            return email.indexOf('@') > 0
        })

    if (recipients.length < 1) {
        console.log('No recipients for ' + dashboard._id + ' - ' + dashboard.title)
        cb(null)
        return
    }

    mailer.send({
        to      : recipients.join(',')
      , subject : 'Updated stats for ' + dashboard.title + ' from SwitchReports'
      , text    : templates.text(data)
      , html    : templates.html(data)
    }, function(err, sent){
        if (err || !sent) {
            console.error('Sending ' + dashboard._id + ' failed')
            cb(err)
            return
        }
        console.log('Message sent for ' + dashboard._id + ' - ' + dashboard.title, sent)
        // TODO work out failure scenarios
        // http://docs.mongodb.org/manual/tutorial/perform-two-phase-commits/
        dashboard.lastSent = Date.now()
        dashboard.save(cb)
    })
}

var startTime = Date.now()

function goodbye (msg) {
    return function () {
        console.log(msg + ' (' + (Date.now()-startTime) / 1000 + 's)')
        mongoose.disconnect()
        mailer.close()
        setTimeout(process.exit, 3000) // give a couple seconds for any hanging tasks
    }
}

function sendAll () {
    getAll(function(results){
        if (results.length < 1) {
            goodbye('No messages sent.')()
            return
        }

        var done = _.after(results.length, goodbye('Completed'))

        results.forEach(function(dashboard){
            sendMessage(dashboard, done)
        })
    })
}

function inspect (show) {
    getAll(function(results){
        if (show) console.log(results)
        goodbye('No messages sent.')()
    })
}

module.exports = {
    inspect : inspect
  , send    : sendAll
}
