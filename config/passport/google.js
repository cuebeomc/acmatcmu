const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const config = require('../');
const mongoose = require('mongoose');
const User = mongoose.model('User');

console.log(config.google.callbackURL);
module.exports = new GoogleStrategy({
    clientID: '799612153838-k46hmt1v7l477vkaalprjpg910bqjibc.apps.googleusercontent.com',
    clientSecret: 'jSVCNQ99MkNaS1UI0dwYyQh2',
    callbackURL: "https://acmatcmu-dev.herokuapp.com/auth/google/callback",
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
