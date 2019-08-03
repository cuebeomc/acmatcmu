
/**
 * Expose
 */

module.exports = {
  db: 'mongodb://dev:acmdev1@ds151997.mlab.com:51997/heroku_mztvh6zg',
  google: {
    clientID: 'APP_ID',
    clientSecret: 'SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.google.com/m8/feeds',
    ]
  }
};
