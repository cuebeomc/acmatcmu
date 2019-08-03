'use strict';

/**
 * Module dependencies.
 */

const login = require('../app/controllers/login');
const path = require('path');
const config = require('./');
/**
 * Expose
 */

module.exports = function (app, passport) {
  app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, '../app/views/schemas/welcome.json'));
    // console.log("GET to /welcome from " + req.hostname)
  });

  app.get('/aboutus', (req, res) => {
    res.sendFile(path.join(__dirname, '../app/views/schemas/aboutus.json'))
    // console.log("GET to /aboutus from " + req.hostname)
  });

  app.get('/events', (req, res) => {
      res.sendFile(path.join(__dirname, '../app/views/schemas/events.json'))
      // console.log("GET to /events from " + req.hostname)
  });

  app.get('/sponsors', (req, res) => {
      res.sendFile(path.join(__dirname, '../app/views/schemas/sponsors.json'))
      // console.log("GET to /sponsors from " + req.hostname)
  });


  app.get('/login', login.index);

  app.get('/auth/google', (req, res, next) => {
    if (!req.user) {
      passport.authenticate('google', { scope: config.google.scope, successRedirect: '/aboutus' })(req,res,next);
    } else {
      next();
    }
  });

  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
  });

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).render('404', {
      url: req.originalUrl,
      error: 'Not found'
    });
  });
};
