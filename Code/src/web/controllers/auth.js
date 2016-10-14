'use strict';

var router = require('express').Router();
var crypto = require('crypto');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var Agency = require('../models/agency');

var passwordUtil = require('./../lib/password-util');
var config = require('../config');
var users = require('../routes/admin/user');

var emailService = require('../services/email-service');


passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findUserByID(id, function (err, user) {
        done(err, user);
    });
});

var sendExpirationReminder = function (user, timeLeft) {

    // create token to send to user
    crypto.randomBytes(20, function (err, buf) {

        var token = buf.toString('hex');

        user.resetPasswordToken = token;
        // token expires in 1 day
        user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;
        userService.updateUser(user.id, user).then(function (user) {


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
                'text': 'Your password will expire in less than ' + daysLeft + '. Change it to avoid a password reset. \n' +
                'To change your password, follow this link: \n\n' +
                config.appURL + '/expiredpassword/' + token + '\n\n'
            })

        })


    });
};
var sendPasswordExpiredEmail = function (user) {
    console.log("SENT EMAIL");
    // create token to send to user
    crypto.randomBytes(20, function (err, buf) {

        var token = buf.toString('hex');

        user.resetPasswordToken = token;
        // Token will expire in 24 hours
        user.resetPasswordExpires = Date.now() + 24 * 60 * 60;
        userService.updateUser(user.id, user).then(function (user) {


        }).then(function () {
            emailService.send({
                'to': user.email,
                'from': config.email.from,
                'fromName': config.email.fromName,
                'subject': 'BOLO Alert: Password Expiration',
                'text': 'Your password has expired. \n' +
                'To change your password, follow this link: \n\n' +
                config.appURL + '/expiredpassword/' + token + '\n\n'
            })
        })

    });
};
var sendAccountLockedEmail = function (account) {


    crypto.randomBytes(20, function (err, buf) {

        var token = buf.toString('hex');

        userService.getByEmail(account.email).then(function (user) {

            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000;
            userService.updateUser(user.id, user);
            console.log("Sending account locked email to %s", account.email);
            emailService.send({
                'to': account.email,
                'from': config.email.from,
                'fromName': config.email.fromName,
                'subject': 'BOLO Alert: Account Locked',
                'text': 'Your account has been locked. \n' +
                'To change your password and activate your account, follow this link: \n\n' +
                config.appURL + '/changepassword/' + token + '\n\n'
            })

        })
    });
};
var sendAccountLockedEmailToAdmins = function (account) {


    userService.getUsersByAgency(account.agency).then(function (users) {
        var admins = [];
        //get the admin user emails
        for (var i in users) {

            // check if user is tier 3 / admin and the user himself is not one of those admins
            if (users[i].data.tier === 3 && users[i].data.email !== account.email) {
                admins.push(users[i].data.email);
            }
        }

        console.log("Admins were obtained");

        if (admins.length > 0) {
            console.log("sending email to the following admins " + admins);

            emailService.send({
                'to': admins,
                'from': config.email.from,
                'fromName': config.email.fromName,
                'subject': 'BOLO Alert: User Account Warning',
                'text': 'The account of ' + account.username + ' has been locked after attempting ' +
                config.MAX_INCORRECT_LOGINS + ' incorrect login attempts.'

            }).catch(function (error) {

                console.log(error)
            })
        }

    })
};

/**
 * Render login page if not logged in
 */
exports.getLogIn = function (req, res) {
    if (req.user) {
        req.flash('error_msg', 'Already logged in as *' + req.user.userName + '*');
        res.redirect('/bolo');
    }
    else {
        res.render('login');
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
        //If the user's password has expired
        if (user.passwordDate - Date.now >= 600) {
            //sendExpirationReminder(account.user, timeLeft);
            return done(null, false, {message: 'Your Password has expired'});
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
                return done(null, false, {message: err1});
            }
            if (!isValid) {
                console.log('Password is incorrect');
                return done(null, false, {message: 'Password is incorrect'});
            }
            //If all checks pass, authorize user for the current session
            return done(null, user);
        });
    })
}));

/**
 * Process Username and Password for Login.
 */
exports.attemptLogIn = (passport.authenticate(
    'local', {
        successRedirect: '/bolo',
        failureRedirect: '/login',
        successFlash: 'Welcome ',
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

router.get('/forgotPassword', function (req, res) {
    res.render('forgot-password');
});

router.post('/forgotPassword', function (req, res) {

    var email = req.body.email;
    crypto.randomBytes(20, function (err, buf) {

        if (err) {
            console.log("Error generating UUID.");
            req.flash(FERR, 'Error: Please try again. Contact administrator if error persists.');
            return res.redirect('back');
        }

        userService.getByEmail(email).then(function (user) {
            if (!user) {
                req.flash(FERR, 'Error: Unregistered email address.');
                return res.redirect('back');
            }
            if (user.accountStatus2 === true) {
                req.flash(FERR, 'Your account has been suspended. Please contact your agency administrator');
                return res.redirect('back');
            }

            var token = buf.toString('hex');
            console.log(token);
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000;
            userService.updateUser(user.id, user);

            emailService.send({
                'to': email,
                'from': config.email.from,
                'fromName': config.email.fromName,
                'subject': 'BOLO Alert: Reset password requested',
                'text': 'A password reset has been requested for the account registered to this email.\n' +
                'To change your password, follow this link: \n\n' +
                config.appURL + '/changepassword/' + token + '\n\n' +
                'If you did not request to change your password, please contact a system administrator and immediately change your password.'
            }).then(function (json) {
                req.flash('messages', 'Reset information successfully sent to %s.', email);
                res.redirect('login');
            });

        });

    });

});

router.get('/changepassword/:token', function (req, res) {
    userService.getByToken(req.params.token).then(function (user) {
        if (!user || (user.resetPasswordExpires < Date.now())) {
            req.flash(FERR, 'Error: Reset Token is invalid or may have expired.');
            return res.redirect('/forgotPassword');
        }
        res.render('change-password', {
            userID: user.id,
            'form_errors': req.flash('form-errors')
        });
    });

});

router.post('/changepassword/:userID', function (req, res) {
    var userID = req.params.userID;
    parseFormData(req).then(function (formDTO) {
        var validationErrors = passwordUtil.validatePassword(
            formDTO.fields.password, formDTO.fields.confirm
        );

        if (validationErrors) {
            req.flash('form-errors', validationErrors);
            throw new FormError();
        }

        return userService.resetPassword(userID, formDTO.fields.password);
    }, function (error) {
        console.error('Error at /users/:id/reset-password >>> ', error.message);
        req.flash(FERR, 'Error processing form, please try again.');
        res.redirect('back');
    })
        .then(function () {
            req.flash(FMSG, 'Password reset successful.');
            res.redirect('/login');
        })
        .catch(function (error) {
            var patt = new RegExp("matches previous");
            var res = patt.test(error.message);

            if (res) {
                req.flash(FERR, 'New password must not match previous.');
                res.redirect('back');
            }

            if ('FormError' !== error.name) throw error;

            console.error('Error at /users/:id/reset-password >>> ', error.message);
            req.flash(FERR, 'Error occurred, please try again.');
            res.redirect('back');
        })
        .catch(function (error) {
            res.redirect('back');
        });
});

router.get('/expiredpassword/:token', function (req, res) {
    userService.getByToken(req.params.token).then(function (user) {
        if (!user || (user.resetPasswordExpires < Date.now())) {
            req.flash(FERR, 'Error: Reset Token is invalid or may have expired.');
            return res.redirect('/forgotPassword');
        }
        res.render('change-password', {
            userID: user.id,
            "url": "/expiredpassword",
            'form_errors': req.flash('form-errors')
        });
    });

});

router.post('/expiredpasswrd/:userID', function (req, res) {
    var userID = req.params.userID;
    parseFormData(req).then(function (formDTO) {
        var validationErrors = passwordUtil.validatePassword(
            formDTO.fields.password, formDTO.fields.confirm
        );

        if (validationErrors) {
            req.flash('form-errors', validationErrors);
            throw new FormError();
        }

        return userService.resetPassword(userID, formDTO.fields.password);
    }, function (error) {
        console.error('Error at /users/:id/reset-password >>> ', error.message);
        req.flash(FERR, 'Error processing form, please try again.');
        res.redirect('back');
    })
        .then(function () {
            req.flash(FMSG, 'Password reset successful.');
            res.redirect('/login');
        })
        .catch(function (error) {
            var patt = new RegExp("matches previous");
            var res = patt.test(error.message);

            if (res) {
                req.flash(FERR, 'New password must not match previous.');
                res.redirect('back');
            }

            if ('FormError' !== error.name) throw error;

            console.error('Error at /users/:id/reset-password >>> ', error.message);
            req.flash(FERR, 'Error occurred, please try again.');
            res.redirect('back');
        })
        .catch(function (error) {
            res.redirect('back');
        });
});
