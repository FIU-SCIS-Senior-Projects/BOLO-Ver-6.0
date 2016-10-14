/**
 * This class sets the controls for the account routes
 */

// Provides "utility" functions that are potentially helpful to a developer
var util = require('util');

var validate = require('validate.js');

var config = require('../config.js');
var emailService = require('../services/email-service');

var passwordUtil = require('../lib/password-util');

var User = require("../models/user.js");
var Agency = require('../models/agency');

/**
 * Responds with a the account home page.
 */
exports.getAccountDetails = function (req, res) {
    User.findUserByID(req.user._id, function (err, user) {
        if (err) throw err;
        res.render('account', {user: user});
    })
};

/**
 * Responds with the change password form page.
 */
exports.getChangePassword = function (req, res) {
    res.render('account-password');
};

/**
 * Process form data from the change password form page.
 */
exports.postChangePassword = function (req, res) {
    req.flash('error_msg', 'Not Yet Implemented');
    res.redirect('/account/password');
};

/**
 * Send an email when a user's password has been changed successfully.
 */
function sendPasswordChangedEmail(user) {
    /** @todo look into a way to incorporate email templates configurable by
     * the system administrator **/
    var message = util.format(
        'Hello %s,\n\n' +
        'This is just a friendly notification to let you know that ' +
        'your accout password has just been changed. Please contact your ' +
        'agency administrator if you did not authorize this.\n\n' +
        '-- BOLO Flier Creator Team',
        user.fname
    );
    emailService.send({
        'to': user.email,
        'from': config.email.from,
        'fromName': config.email.fromName,
        'subject': 'BOLO Flier Creator - Account Update',
        'text': message
    });
}

/**
 * Respond with a form to manage notifications.
 */
exports.getUserNotifications = function (req, res) {
    req.flash('error_msg', 'Not Yet Implemented');
    res.redirect('/account');
};

/**
 * Repond with a list of available agencies to subscribe to.
 */
exports.getAvailableAgencyNotifications = function (req, res) {
    var data = {'account_nav': 'account-notification'};

    agencyService.getAgencies().then(function (agencies) {
        data.agencies = agencies;
        res.render('account-notifications-add', data);
    })
        .catch(function (error) {
            console.error('Error at %s >>> %s function getAvailableAgencyNotifications in the account.js', req.originalUrl, error.message);
            req.flash(GFERR, 'Unknown error occurred, please try again.');
            res.redirect('back');
        });
};

/**
 * Process form data to unsubscribe the user from the requested agency
 * notifications.
 */
exports.postUnsubscribeNotifications = function (req, res) {
    var selected = [];
    parseFormData(req).then(function (formDTO) {
        selected = formDTO.fields['agencies[]'] || [];

        if (!selected.length) {
            return null;
        }
        console.log(req.user.id);
        return agencyService.getAgency(req.user.agency)
    }).then(function (agency) {
        if (selected.indexOf(agency.name) > -1 && agency.preventUnsubscription === true) {
            req.flash(GFERR, 'You cannot unsubscribe from your own agency');
            selected = [];
            res.redirect('back');
        }
        return userService.removeNotifications(req.user.id, selected);
    })
        .then(function (user) {
            if (!user) {
                req.flash(GFERR, 'Subscriptions update error occured.');
            } else {
                req.flash(GFMSG, 'Subscriptions successfully updated.');
            }
            res.redirect('back');
        })
        .catch(function (error) {
            console.error('Error at %s >>> %s function postUnsubscribeNotifications in the account.js', req.originalUrl, error.message);
            req.flash(GFERR, 'Unknown error occurred, please try again.');
            res.redirect('back');
        });
};

exports.getUnsubscribeNotificationsFromEmail = function (req, res) {

    var selected = [req.params.agencyId];
    return agencyService.getAgency(req.user.agency).then(function (agency) {
        if (selected.indexOf(agency.name) > -1 && agency.preventUnsubscription === true) {
            req.flash(GFERR, 'You cannot unsubscribe from your own agency');
            selected = [];
            res.redirect('/account/notifications');
        }
        return userService.removeNotifications(req.user.id, selected)
    })
        .then(function (user) {
            if (!user) {
                req.flash(GFERR, 'Subscriptions update error occured.');
            } else {
                req.flash(GFMSG, 'Subscriptions successfully updated.');
            }
            res.redirect('/account/notifications');
        })
        .catch(function (error) {
            console.error('Error at ', req.originalUrl, ' >>> ', error.message);
            req.flash(GFERR, 'Unknown error occurred, please try again.');
            res.redirect('back');
        });
};

/**
 * Process form data to subscribe the user to the requested agency
 * notifications
 */
exports.postSubscribeNotifications = function (req, res) {
    parseFormData(req).then(function (formDTO) {
        var selected = formDTO.fields['agencies[]'] || [];

        if (!selected.length) {
            return req.user;
        }

        return userService.addNotifications(
            req.user.id, formDTO.fields['agencies[]']
        );
    })
        .then(function (user) {
            if (!user) {
                req.flash(GFERR, 'Subscriptions update error occured.');
            } else {
                req.flash(GFMSG, 'Subscriptions successfully updated.');
            }
            res.redirect('/account/notifications');
        })
        .catch(function (error) {
            console.error('Error at %s >>> %s function postSubscribeNotifications in the account.js', req.originalUrl, error.message);
            req.flash(GFERR, 'Unknown error occurred, please try again.');
            res.redirect('back');
        });
};
