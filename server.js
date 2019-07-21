const express = require('express')
const path = require('path')
const bodyParser= require('body-parser')
const app = express()
const port = 3000

app.use(bodyParser.urlencoded({extended: true}))

const MongoClient = require('mongodb').MongoClient
var db

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: '799612153838-k46hmt1v7l477vkaalprjpg910bqjibc.apps.googleusercontent.com',
    clientSecret: 'jSVCNQ99MkNaS1UI0dwYyQh2',
    callbackURL: "http://acmatcmu-dev.herokuapp.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
       User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return done(err, user);
       });
  }
));

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });


app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/welcome.json'));
    console.log("GET to /welcome from " + req.hostname)
});

app.get('/aboutus', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/aboutus.json'))
    console.log("GET to /aboutus from " + req.hostname)
});

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/events.json'))
    console.log("GET to /events from " + req.hostname)
});

app.get('/sponsors', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/sponsors.json'))
    console.log("GET to /sponsors from " + req.hostname)
});

// Not supported for now; release mid-August
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login/index.html')); //does not clear the screen and show index !
    console.log("GET to /login from " + req.hostname)
});

MongoClient.connect('mongodb://dev:acmdev1@ds151997.mlab.com:51997/heroku_mztvh6zg', (err, database) => {
    if (err) return console.log(err)
    db = database.db('heroku_mztvh6zg') // whatever database name is
    app.listen(process.env.PORT || port, () => console.log(`App listening on port ${port}!`))
});

app.post('/test', (req, res) => {
    console.log(req.body)
    res.redirect('/')
  });


