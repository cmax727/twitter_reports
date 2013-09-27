var nodemailer = require("nodemailer")

var transport = nodemailer.createTransport("SMTP", {
    service: 'SendGrid'
  , auth: {
        user: process.env.SENDGRID_USERNAME
      , pass: process.env.SENDGRID_PASSWORD
    }
})

exports.send = function (message, cb) {
    transport.sendMail({
        from     : message.from || "SwitchReports <app@switchreports.com>"
      , bcc      : message.to
      , subject  : message.subject
      , text     : message.text
      , html     : message.html
    }, cb)
}

exports.close = function () {
    transport.close()
}
