/* jshint node: true */
'use strict';

var bodyParser = require('body-parser');
var csrf = require('csurf');
var passport = require('passport');
var router = require('express').Router();
var crypto = require('crypto');
var LocalStrategy = require('passport-local').Strategy;
var _csrf = csrf({
  'cookie': true
});
var _bodyparser = bodyParser.urlencoded({
  'extended': true
});

var passwordUtil = require('./password-util');
var formUtil = require('./form-util');
var config = require('../config');
var users = require('../routes/admin/users');

var userRepository = new config.UserRepository();
var agencyService = new config.AgencyService(new config.AgencyRepository());
var userService = new config.UserService(userRepository, agencyService);
var emailService = new config.EmailService();

var parseFormData = formUtil.parseFormData;
var FormError = formUtil.FormError;
var FERR = config.const.GFERR;
var FMSG = config.const.GFMSG;
var fivedays = 5 * 24 * 60 * 60 * 1000;


passport.use(new LocalStrategy(
  function(username, password, done) {
    userService.authenticate(username, password)
      .then(function(account) {
        console.log(account)

        // check the status of the account
        if (account.status) {


          // if account returned is not empty
          if (account.user && account.found) {

            /*If user password is expired, deny login, send password reset email*/
            if (account.user.passwordLifetime <= Date.now()) {

              // send email for password change
              sendPasswordExpiredEmail(account.user)

              // deny logon
              return done(null, false, {
                'message': 'Your password has expired. ' +
                  'An email was sent to reset your password'
                  // send email
              });
            } else if (account.user.passwordLifetime - fivedays <= Date.now()) { /*If account expires is less than five days send a reminder email*/

              // time left until expiration
              var timeLeft = account.passwordLifetime - Date.now();

              // send email notification to change password
              sendExpirationReminder(account.user, timeLeft);
              // continue with authentication
            }



            // check if agency is active
            agencyService.getAgency(account.user.data.agency).then(function(agency) {
              if (agency.data.isActive === true) {
                return done(null, account);
              } else {
                return done(null, false, {
                  'message': 'Agency has been Deactivated.Contact ' +
                    'your Root Administrator for more information..'
                });
              }
            })



          } else if (account.found === false) {

            return done(null, false, {

              'message': 'Unknown username'
            })
          } else {
            return done(null, false, {
              'message': 'Invalid login credentials. You have ' + account.attemptsLeft + ' attempts left before your account is locked'
            });
          }
        } else {

          /* Check wether account has been suspended or the user has just locked himself out of the system */
          if (account.locked) {

            return done(null, false, {
              'message': 'You account has been suspended. Please contact your agency administrator'
            });

          } else {

            // send email to user and admins
            sendAccountLockedEmail(account);
            sendAccountLockedEmailToAdmins(account);

            return done(null, false, {
              'message': 'You account has been locked. You have been sent an email to reset your password'
            });

          }
        }



      });
  }
));

passport.serializeUser(function(account, done) {
  done(null, account.user.id);
});

passport.deserializeUser(function(id, done) {
  userService.deserializeId(id)
    .then(function(account) {
      if (account) done(null, account);
    });
});

var sendExpirationReminder = function(user, timeLeft) {

  // create token to send to user
  crypto.randomBytes(20, function(err, buf) {

    var token = buf.toString('hex');

    user.resetPasswordToken = token;
    // token expires in 1 day
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;
    userService.updateUser(user.id, user).then(function(user) {


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
}
var sendPasswordExpiredEmail = function(user) {
  console.log("SENT EMAIL")
  // create token to send to user
  crypto.randomBytes(20, function(err, buf) {

    var token = buf.toString('hex');

    user.resetPasswordToken = token;
    // Token will expire in 24 hours
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60;
    userService.updateUser(user.id, user).then(function(user) {


    }).then(function(){
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
}

var sendAccountLockedEmail = function(account) {


  crypto.randomBytes(20, function(err, buf) {

    var token = buf.toString('hex');

    userService.getByEmail(account.email).then(function(user) {

      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000;
      userService.updateUser(user.id, user);
      console.log("Sending account locked email to %s", account.email)
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
}

var sendAccountLockedEmailToAdmins = function(account) {


  userService.getUsersByAgency(account.agency).then(function(users) {
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

      }).catch(function(error) {

        console.log(error)
      })
    }

  })
}

/*
 * GET /login
 *
 * Respond with the login page
 */
router.get('/login',
  _csrf,
  function(req, res, next) {
    if (req.isAuthenticated()) {
      req.session.message = "Already logged in.";
      res.redirect('/');
    }
    next();
  },
  function(req, res) {
    res.render('login', {
      'loginToken': req.csrfToken(),
      'error': req.flash('error'),
      'messages': req.flash('messages')
    });
  });


/*
 * POST /login
 *
 * Process Username and Password for Login.
 */
router.post('/login',
  _bodyparser, _csrf,
  passport.authenticate('local', {
    'failureRedirect': '/login',
    'failureFlash': true
  }),
  function(req, res) {
    var login_redirect = null;
    if (req.session.login_redirect) {
      console.log(req.session.login_redirect);
      login_redirect = req.session.login_redirect;
      req.session.login_redirect = null;
    }

    console.log("Session:" + login_redirect);
    if (login_redirect !== null && login_redirect.indexOf('.') == -1) {
      res.redirect(config.appURL + login_redirect);
    } else
      res.redirect('/bolo' || '/');
  }
);


/*
 * GET /logout
 *
 * Destory any sessions belonging to the requesting client.
 */
router.get('/logout', function(req, res) {

  req.session.destroy(function(err) {
    res.redirect('/login');
  });
});

router.get('/forgotPassword',
  function(req, res) {
    res.render('forgot-password');
  });

router.post('/forgotPassword',
  function(req, res) {

    var email = req.body.email;
    crypto.randomBytes(20, function(err, buf) {

      if (err) {
        console.log("Error generating UUID.");
        req.flash(FERR, 'Error: Please try again. Contact administrator if error persists.');
        return res.redirect('back');
      }

      userService.getByEmail(email).then(function(user) {
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
        }).then(function(json) {
          req.flash('messages', 'Reset information successfully sent to %s.', email);
          res.redirect('login');
        });

      });

    });

  });

router.get('/changepassword/:token',
  function(req, res) {
    userService.getByToken(req.params.token).then(function(user) {
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

router.post('/changepassword/:userID',
  function(req, res) {
    var userID = req.params.userID;
    parseFormData(req).then(function(formDTO) {
        var validationErrors = passwordUtil.validatePassword(
          formDTO.fields.password, formDTO.fields.confirm
        );

        if (validationErrors) {
          req.flash('form-errors', validationErrors);
          throw new FormError();
        }

        return userService.resetPassword(userID, formDTO.fields.password);
      }, function(error) {
        console.error('Error at /users/:id/reset-password >>> ', error.message);
        req.flash(FERR, 'Error processing form, please try again.');
        res.redirect('back');
      })
      .then(function() {
        req.flash(FMSG, 'Password reset successful.');
        res.redirect('/login');
      })
      .catch(function(error) {
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
      .catch(function(error) {
        res.redirect('back');
      });
  });

router.get('/expiredpassword/:token',
  function(req, res) {
    userService.getByToken(req.params.token).then(function(user) {
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

router.post('/expiredpasswrd/:userID',
  function(req, res) {
    var userID = req.params.userID;
    parseFormData(req).then(function(formDTO) {
        var validationErrors = passwordUtil.validatePassword(
          formDTO.fields.password, formDTO.fields.confirm
        );

        if (validationErrors) {
          req.flash('form-errors', validationErrors);
          throw new FormError();
        }

        return userService.resetPassword(userID, formDTO.fields.password);
      }, function(error) {
        console.error('Error at /users/:id/reset-password >>> ', error.message);
        req.flash(FERR, 'Error processing form, please try again.');
        res.redirect('back');
      })
      .then(function() {
        req.flash(FMSG, 'Password reset successful.');
        res.redirect('/login');
      })
      .catch(function(error) {
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
      .catch(function(error) {
        res.redirect('back');
      });
  });

module.exports.passport = passport;
module.exports.router = router;
