const express = require('express');
const session = require('express-session');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const helmet = require('helmet');

const mongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const config = require('./');
const pkg = require('../package.json');

const env = process.env.NODE_ENV || 'development';


module.exports = function(app, passport) {
    app.use(helmet());

    app.use(
        compression({
            threshold: 512
        })
    );

    app.use(express.static(config.root + '/public'))

    let log;
    log = 'dev';

    if (env !== 'test') app.use(morgan(log));

    app.set('views', config.root + '/app/views');
    app.set('view engine', 'pug');

    app.use(function(req, res, next) {
        res.locals.pkg = pkg;
        res.locals.env = env;
        next();
    });

    app.use(
        bodyParser.urlencoded({
            extended: true
        })
    );
    app.use(bodyParser.json());
    app.use(
        methodOverride(function(req) {
            if (req.body && typeof req.body === 'object' && '_method' in req.body) {
                const method = req.body._method;
                delete req.body._method;
                return method;
            } 
        })
    );

    app.use(cookieParser());
    app.use(
        session({
            secret: pkg.name,
            proxy: true,
            resave: true,
            saveUninitialized: true,
            store: new mongoStore({
                url: config.db,
                collection: 'sessions'
            })
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    app.use(flash());

}