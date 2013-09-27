
var logger        = require('../lib/logger')()
  , permissions   = require('../lib/permissions')
  , mongoose      = require('mongoose')
  , mongooseTypes = require('mongoose-types')
  , bcrypt        = require('bcrypt')

mongooseTypes.loadTypes(mongoose, "email")

var Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Email    = Schema.Types.Email

var UserSchema = new Schema({
    name         : { type: String }
  , email        : { type: Email }
  , facebook     : { type: {}, default: {} }
  , salt         : { type: String }
  , hash         : { type: String }
  , dashboards   : { type: ObjectId, ref: 'Dashboard' }
  , plan         : { type: String, enum: Object.keys(permissions.plans), default: 'beta' }
  , stripeid     : { type: String }
  , logins       : [{ type: Date, default: Date.now }]
  , isAdmin      : { type: Boolean, default: false }
})

UserSchema.virtual('password')
    .get(function() {
        return this._password;
    })
    .set(function(password) {
        this._password = password;
        var salt = this.salt = bcrypt.genSaltSync(10);
        this.hash = bcrypt.hashSync(password, salt);
    })
;

UserSchema.method('checkPassword', function(password, callback) {
    bcrypt.compare(password, this.hash, callback);
});

UserSchema.static('registerEmail', function(name, email, password, passwordConfirm, callback) {
    if(password != passwordConfirm) return callback('PASSWORD_MISMATCH', false);
    var user = new this({ name: name, email: email, password: password });
    user.save(function(err, user) {
        if(err) callback(err, false);
        callback(null, user);
    });
});

UserSchema.static('authEmail', function(email, password, callback) {
    this.findOne({ email: email }, function(err, user) {
        if(err) return callback(err);
        if(!user) return callback(null, false);

        user.checkPassword(password, function(err, isCorrect) {
            if(err) return callback(err);
            if(!isCorrect) return callback(null, false);
            return callback(null, user);
        });
    });
});

function createUser (profile, callback) {
    // Create new user, save immediately
    this.create({
        name  : profile.displayName
      , email : profile._json.email
    }, function(err, user){
        if (err) return callback(err)
        createStripeUser(user, callback)
    })
}

function createStripeUser (user, callback){
    // Register with Stripe
    stripe.customers.create({
        email       : user.email
      , description : user.name
      , plan        : 'beta'
    }, function(err, customer){
        if (err) return callback(err)
        // logger.info("Customer created", customer)
        user.stripeid = customer.id
        user.save(callback)
    })
}

function updateUser (user, token, profile, callback) {
    user.facebook       = profile
    user.facebook.token = token
    user.markModified('facebook')
    user.logins.push(Date.now())

    user.save(function(err, user) {
        if (err) return callback(err)
        return callback(null, user)
    })
}

UserSchema.static('authFacebook', function(accessToken, refreshToken, profile, callback) {
    var User = this;

    logger.info('Signed in:', profile.name)

    this.findOne({ 'facebook.id': profile.id }).exec(function(err, user) {
        if (err) return callback(err)

        if (!user) {
            // New user
            createUser.call(User, profile, function(err, user){
                if (err) return callback(err)
                updateUser(user, accessToken, profile, callback)
            })
        } else {
            // Registered user login
            updateUser(user, accessToken, profile, callback)
        }
    })
})


// `updateUser` is not used for twitter profiles, since each profile will have
// a different set of tokens
UserSchema.static('authTwitter', function(req, token, tokenSecret, profile, callback) {
    mongoose.model('TwitterProfile').addOrUpdate(req.user, token, tokenSecret, profile, callback)
})

UserSchema.method('permissions', function (permission) {
    return subscriptions[permission](this)
})

module.exports = mongoose.model('User', UserSchema)
