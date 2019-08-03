require('dotenv').config();

const fs = require('fs');
const join = require('path').join;
const express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
const config = require('./config');
const models = join(__dirname, 'app/models');

const path = require('path');
// const bodyParser= require('body-parser');
const app = express();
const connection = connect();
const port = process.env.PORT || 3000;

module.exports = {
  app,
  connection
}

fs.readdirSync(models)
  .filter(file => ~file.indexOf('.js'))
  .forEach(file => require(join(models, file)));

require('./config/passport')(passport);
require('./config/express')(app, passport);
require('./config/routes')(app, passport);

connection
  .on('error', console.log)
  .on('disconnected', connect)
  .once('open', listen);

function listen() {
  if (app.get('env') === 'test') return;
  app.listen(port);
  console.log(`App listening on port ${port}`)
}

function connect() {
  var options = { keepAlive: 1, useNewUrlParser: true };
  mongoose.connect(config.db, options);
  return mongoose.connection;
}


// app.use(bodyParser.urlencoded({extended: true}));

//const MongoClient = require('mongodb').MongoClient

// passport.serializeUser(function(user, done) {
//   done(null, user._id);
// });
 
// passport.deserializeUser(function(id, done) {
//   User.findById(id, function(err, user) {
//     done(err, user);
//   });
// });


// var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// passport.use(new GoogleStrategy({
//     clientID: '799612153838-k46hmt1v7l477vkaalprjpg910bqjibc.apps.googleusercontent.com',
//     clientSecret: 'jSVCNQ99MkNaS1UI0dwYyQh2',
//     callbackURL: "http://acmatcmu-dev.herokuapp.com/auth/google/callback"
//   },
//   function(accessToken, refreshToken, profile, done) {
//        User.findOrCreate({ googleId: profile.id }, function (err, user) {
//          return done(err, user);
//        });
//   }
// ));

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
// app.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   function(req, res) {
//     res.redirect('/');
//   });


// app.use('/', express.static(path.join(__dirname, 'public')));


// Not supported for now; release mid-August
// app.get('/login', (req, res) => {
//     res.sendFile(path.join(__dirname, 'login/index.html')); //does not clear the screen and show index !
//     console.log("GET to /login from " + req.hostname)
// });

// mongoose.connect('mongodb://dev:acmdev1@ds151997.mlab.com:51997/heroku_mztvh6zg', (err, database) => {
//     if (err) return console.log(err)
//     db = database.db('heroku_mztvh6zg') // whatever database name is
    
// });

// app.listen(process.env.PORT || port, () => console.log(`App listening on port ${port}!`))

// app.post('/test', (req, res) => {
//     console.log(req.body)
//     res.redirect('/')
//   });


