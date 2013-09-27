exports.facebook = {
  clientID: process.env.FB_ID,
  clientSecret: process.env.FB_SEC,
  callbackURL: process.env.FB_CALLBACK
};

exports.twitter = {
  consumerKey: process.env.TW_KEY,
  consumerSecret: process.env.TW_SECRET,
  callbackURL: process.env.TW_CALLBACK
};

exports.mongodb = process.env.MONGODB;
exports.sessionSecret = process.env.SSEC;

exports.nodefly = '3247e6ad50a43cc62117fd4b37a4ccb2';

exports.s3 = {
    keyId: "AKIAJNL3QHPY6MSMMOLQ"
  , secret: "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"
};

exports.stripe = {
    key: 'sk_test_tHG07Y2Irl9yRkDJMbChy2It'
}