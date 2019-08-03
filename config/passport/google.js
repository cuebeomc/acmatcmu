const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const config = require('../');
const mongoose = require('mongoose');
const User = mongoose.model('User');

console.log(config.google.callbackURL);
module.exports = new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL,
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({
      name: profile.displayName,
      email: profile.emails.filter((email) => email.type === 'account')[0].value,
      googleId: profile.id
    }, function (err, user) {
      return done(err, user);
    });
  }
);
