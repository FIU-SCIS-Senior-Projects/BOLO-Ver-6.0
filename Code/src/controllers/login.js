'use strict';

var fs = require('fs');
var crypto = require('crypto');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var Agency = require('../models/agency');
var password = require('../controllers/resetPassword');
var config = require('../config');
var md = require('node-markdown').Markdown;

var emailService = require('../services/email-service');

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findUserByID(id, function (err, user) {
        done(err, user);
    });
});

/**
 * Lets the user know that their password will expire soon after signing in
 * Todo: Implement next iteration
 *
 * @param user The users information
 * @param timeLeft Amount of time left till expiration
 */
function sendExpirationReminder(user, timeLeft) {
    var daysLeft;
    //
    if (timeLeft / 86400000 < 1) {
        daysLeft = "1 day";
    } else {
        daysLeft = Math.floor(timeLeft / 86400000).toString() + ' days';
    }
    emailService.send({
        'to': user.email,
        'from': config.email.from,
        'fromName': config.email.fromName,
        'subject': 'BOLO Alert: Password Expiration',
        'text': 'Your password will expire in less than ' + daysLeft + '\n' +
        'To change your password, please login, go to Account, then click \'Change Password\'\n'
    })
}


/**
 * Render login page if not logged in
 */
exports.getLogIn = function (req, res) {
    if (req.isAuthenticated()) {
        req.flash('error_msg', 'Already logged in as *' + req.user.username + '*');
        res.redirect('/bolo');
    }
    else {
        fs.readFile(__dirname + '/../public/Login.md', function (err, data) {
            if (err) {
                console.log('Login.md could not be read...\n' + err.stack);
                res.render('login', {md: md, text: 'Welcome'});
            } else {
                console.log('Login.md is being read');
                res.render('login', {md: md, text: data.toString()});
            }
        });
    }
};

/**
 * The Local Strategy for logging in to BOLO
 */
passport.use(new LocalStrategy(function (username, password, done) {
    User.findUserByUsername(username, function (err, user) {
        if (err) {
            return done(err);
        }
        //If no user was found
        if (!user) {
            console.log('Username was not found');
            return done(null, false, {
                message: 'Username *' + username + '* was not found on the database'
            });
        }

        //if the agency is not active
        if (!user.agency.isActive) {
            return done(null, false, {
                message: 'Your Agency *' + user.agency.name +
                '* is Deactivated. Contact your Root Administrator for more information.'
            })
        }
        //if the user is not active
        //if (!user.isActive) {
        //    return done(null, false, {message: 'This user is currently deactivated'})
        //}
        User.comparePassword(password, user.password, function (err1, isValid) {
            if (err1) {
                console.log('comparePassword Error: ' + err1);
                return done(null, false, {
                    message: 'Password Error! ' +
                    'Contact your Administrator if this messages persists'
                });
            }
            if (!isValid) {
                console.log('Password is incorrect');
                return done(null, false, {message: 'Password is incorrect'});
            }
            //If all checks pass, authorize user for the current session
            console.log("Test");
            return done(null, user);
        });
    })
}));

/**
 * Process Username and Password for Login.
 */
exports.attemptLogIn = (passport.authenticate(
    'local', {
        successRedirect: '/password',
        failureRedirect: '/login',
        failureFlash: true
    }
));

/**
 * Destroy any sessions belonging to the requesting client.
 */
exports.LogOut = function (req, res) {
    req.logout();
    req.flash('success_msg', 'You are Logged Out');
    res.redirect('/login');
};

exports.renderForgotPasswordPage = function (req, res) {
    res.render('passwordForgotten');
};