exports.facebook = {
  clientID: process.env.FB_ID,
  clientSecret: process.env.FB_SEC,
  callbackURL: process.env.FB_CALLBACK
};
exports.mongodb = process.env.MONGODB;
exports.sessionSecret = process.env.SSEC;