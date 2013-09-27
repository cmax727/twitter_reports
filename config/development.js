exports.loggerFormat = 'dev';
exports.useErrorHandler = true;
exports.enableEmailLogin = true;

exports.mongodb = 'mongodb://localhost/switch_reports';
exports.sessionSecret = '1lov3towrit3reportingAPP$';

exports.twitter = {
  consumerKey: 'FqixxSQPIWoe3WXmpVTGQ',
  consumerSecret: 'sFw1bsNMy2ViHMEFc4cKnSQ0Li97sJZ2iFddHVs4M',
  callbackURL: 'http://127.0.0.1:3000/auth/twitter/callback'
};

exports.facebook = {
  clientID: '124478907708534',
  clientSecret: '61b167d550b150bb0e614261c611b9de',
  callbackURL: 'http://127.0.0.1:3000/auth/facebook/callback'
};

exports.stripe = {
    key: 'sk_test_tHG07Y2Irl9yRkDJMbChy2It'
}