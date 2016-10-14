/**
 * The main application. This is the js file to run to start the web server
 * @type {_|exports|module.exports}
 * @private
 */
var http = require('http');
var path = require('path');

var express = require('express');

var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var passport = require('passport');
var session = require('express-session');

var flash = require('connect-flash');
var validator = require('express-validator');
var errorHandler = require('errorhandler');
var logger = require('morgan');
var methodOverride = require('method-override');

var mongoose = require('mongoose');
var config = require('./config');

var mainRoutes = require('./routes/index');
var adminRoutes = require('./routes/admin');

/**
 * Start the database
 */
mongoose.connect(config.db);
mongoose.Promise = require('bluebird');
var db = mongoose.connection;
console.log('MongoDB Connection\nHost:' + db.host + '\nPort:' + db.port);

/**
 * Express Init and Config
 * https://www.youtube.com/watch?v=W-8XeQ-D1RI
 */
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname, '/public/favicon.ico')));

/**
 * BodyParser Middleware
 */
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); //Extended is set to true to parse images

/**
 * Validator
 */
app.use(validator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isDomain: function (value) {
            var reg = new RegExp("@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\" +
                "[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0" +
                "-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\[\\x01-\\x09\\x0b\\" +
                "x0c\\x0e-\\x7f])+)\\])");

            return reg.test(value);
        }
    }
}));

/**
 * Doesn't tell the world that we are using express
 */
app.disable('x-powered-by');

var inDevelopmentMode = ( 'development' == app.get('env') );

/**
 * Automatic Logger and errorHandler middleware
 */
if (inDevelopmentMode) {
    app.use(logger('dev'));
    app.use(errorHandler());
}

/**
 * Set Static Folder for pictures and scripts for the frontend
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use(methodOverride());

/**
 * Express Session
 */
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true,
    cookie: {
        maxAge: config.max_age
        //TODO Uncomment the below option before going to production.
        //HTTPS is required for this option or the cookie will not be set per the documentation.
        //secure: true
    },
    rolling: true
}));

/**
 * Passport
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * Use Flash and set Global Variables
 */
app.use(flash());
app.use(function (req, res, next) {
    if (req.user) {
        res.locals.userLoggedIn = true;
        res.locals.userID = req.user._id;
        res.locals.userName = req.user.username;
        res.locals.userTier = req.user.tier;
        res.locals.userAgency = req.user.agency;
    }
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    //locals set by passport
    res.locals.passport_success = req.flash('success');
    res.locals.passport_error = req.flash('error');

    console.log('locals.username = ' + res.locals.username);
    console.log('locals.error_msg = ' + res.locals.error_msg);
    console.log('locals.success_msg = ' + res.locals.success_msg);
    next();
});

/**
 *  Application Locals
 */
app.locals.config_bootstrap = config.bootstrap;

/**
 * https://www.youtube.com/watch?v=W-8XeQ-D1RI
 */
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', "http://" + req.headers.host);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('X-Frame-Options', 'sameorigin');
    next();
});

/**
 * To be uncommented when going into production
 * This ensures that the site is always using https
 */
/*
 app.use(function (req, res, next) {
 var schema = (req.headers['x-forwarded-proto'] || '').toLowerCase();
 if (schema === 'https') {
 next();
 } else {
 res.redirect('https://' + req.headers.host + req.url);
 }
 });
 */

//Main Routes
/**
 * Anyone can access these routes without logging in
 */
app.get('/', function (req, res) {
    res.redirect('/bolo');
});
app.use('/', mainRoutes.auth);
app.use('/aboutUs', mainRoutes.aboutUs);
app.use('/img', mainRoutes.img);


/**
 * If user is logged in, then keep going
 */
app.use(function (req, res, next) {
    if (req.user) {
        next();
    } else {
        req.session.login_redirect = req.originalUrl;
        res.redirect('/login');
    }
});
app.use('/bolo', mainRoutes.bolo);
app.use('/account', mainRoutes.account);
app.use('/userGuide', mainRoutes.userGuide);

/**
 * Only Admins and root users can use these routes
 */
app.use(function (req, res, next) {
    if (req.user.tier === 'ROOT' || req.user.tier === 'ADMINISTRATOR') {
        next();
    } else {
        res.render('unauthorized');
    }
});
app.get('/admin', function (req, res) {
    res.render('admin');
});
app.use('/admin/category', adminRoutes.category);
app.use('/admin/dataAnalysis', adminRoutes.dataAnalysis);
app.use('/admin/edit', adminRoutes.edit);
app.use('/admin/systemSetting', adminRoutes.systemSetting);
app.use('/admin/user', adminRoutes.user);
app.use('/admin/agency', adminRoutes.agency);

/**
 * 404 Page
 * if the app went though all routes and could not find a page
 */
app.use(function (req, res) {
    console.error('404 encountered at %s, request ip = %s', req, req.ip);
    res.status(404).render('404');
});

/**
 * Error Handling
 * if inDevelopmentMode, navagate to the error page.
 * if not, go back to the previous page and display the error message
 */
if (inDevelopmentMode) {
    app.use(function (err, req, res, next) {
        console.error('Error occurred at %s\n%s', req.originalUrl, err.stack);
        res.render('error', {message: err.message, error: err});
    });
} else {
    app.use(function (err, req, res, next) {
        console.error('Error occurred at %s >>> %s', req.originalUrl, err.message);
        req.flash(error_msg, 'Internal server error occurred, please try again');
        res.redirect('back');
    });
}

/**
 * Server Start
 */
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});