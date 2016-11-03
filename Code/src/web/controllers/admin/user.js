/* jshint node: true */
'use strict';

var fs = require('fs');
var Converter = require('csvtojson').Converter;
var config = require('../../config');
var user = require('../../routes/admin/user');
var crypto = require('crypto');
var request = require("request");
var bcrypt = require('bcrypt-nodejs');
var emailService = require('../../services/email-service');

var User = require('../../models/user');
var Agency = require('../../models/agency');
var Bolo = require('../../models/bolo');

/**
 * Error handling for MongoDB
 */
var getErrorMessage = function (err) {
    var message = [];

    if (err.code) {
        switch (err.code) {
            case 11000:
            case 11001:
                message.push({msg: 'Username / Email already exists'});
                break;
            default:
                message.push({msg: "Something went wrong. Please check form for errors and try again"});
        }
    }
    else {
        for (var errName in err.errors) {
            if (err.errors[errName].message) {
                message.push({msg: err.errors[errName].message});
            }
        }
    }
    return message;
};

/**
 * Responds with new Jade Page to Upload CSV
 */
exports.getCSVForm = function (req, res) {
    res.render('admin-user-multiple');
};

/**
 * Creates multiple users from a csv file
 */
exports.multiUserCreate = function (req, res) {
    var converter = new Converter({});
    var index = 0;

    if (req.files.csvfile) {
        var csv = req.files.csvfile[0];

    }
    else {
        req.flash('error_msg', 'NO CSV SELECTED -- Please Select A CSV File');
        res.redirect('/admin/user/multiple');
    }

    converter.fromFile(csv.path, function (err, result) {
        console.log("JSON CSV" + JSON.stringify(result));
        while (index < result.length) {
            console.log('index: %s, result.length: %s', index, result.length);
            console.log(result[index]);
            var newUser = function (index) {
                Agency.findAgencyByName(result[index].Agency, function (err, userAgency) {

                    if (err) throw err;
                    console.log('******* index: %s, result.length: %s *******', index, result.length);

                    //console.log('******* index - 2: %s, result.length: %s *******', index, result.length);
                    var newUser = new User({
                        username: result[index].Username,
                        firstname: result[index].Firstname,
                        lastname: result[index].Lastname,
                        password: result[index].Password,
                        email: result[index].Email,
                        tier: result[index].Role,
                        badge: result[index].BadgeNumber,
                        unit: result[index].Unit,
                        rank: result[index].Title,
                        agency: userAgency.id
                    });
                    //Save the user
                    User.createUser(newUser, function (err, user) {
                        if (err) {
                            throw err;
                        }
                        //If no errors, user has been saved
                        else {
                            console.log(user);
                            console.log('User has been registered');
                        }
                    });

                });
            };

            newUser(index);
            index = index + 1;
        }
    });
    console.log("I Finished");
    req.flash('success_msg', 'All Users Successfully Uploaded');
    res.redirect('/admin/user/multiple');

};

/**
 * Responds with a form to create a new user.
 */
exports.getCreateForm = function (req, res) {
    Agency.findAllAgencies(function (err, listOfAgencies) {
        if (err) throw err;
        var listOfAgencyNames = [];
        for (const i in listOfAgencies)
            listOfAgencyNames.push(listOfAgencies[i].name);
        res.render('admin-user-create', {
            agencies: listOfAgencyNames
        })
    });
};

/**
 * Process data to create a user, respond with the result.
 */
exports.postCreateForm = function (req, res) {

    //Holds previously entered form data
    var prevForm = {
        user1: req.body.username,
        fname1: req.body.fname,
        lname1: req.body.lname,
        email1: req.body.email,
        agency1: req.body.agency,
        badge1: req.body.badge,
        unit1: req.body.sectunit,
        rank1: req.body.ranktitle,
        role1: req.body.role
    };

    //Validation of form
    var errors = [];
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    var valErrors = req.validationErrors();
    for (var x in valErrors)
        errors.push(valErrors[x]);

    //If at least one error was found
    if (errors.length) {
        console.log('Validation has failed');
        //Get every Agency name on the DB
        Agency.findAllAgencies(function (err, listOfAgencies) {
            if (err) throw err;
            else {
                console.log(errors);
                var listOfAgencyNames = [];
                for (const agencyName in listOfAgencies)
                    listOfAgencyNames.push(agencyName.name);
                prevForm.agencies = listOfAgencyNames;
                prevForm.errors = errors;
                res.render('admin-user-create', prevForm);
            }
        })
    }
    // If the form is valid
    else {
        //Create a new user model to save
        Agency.findAgencyByName(req.body.agency, function (err, userAgency) {
            if (err) throw err;
            if (!userAgency) {
                Agency.findAllAgencies(function (err, listOfAgencies) {
                    if (err) throw err;
                    else {
                        console.log(errors);
                        var listOfAgencyNames = [];
                        for (const i in listOfAgencies)
                            listOfAgencyNames.push(listOfAgencies[i].name);
                        prevForm.agencies = listOfAgencyNames;
                        prevForm.errors = ['Could not find that agency...'];
                        res.render('admin-user-create', prevForm);
                    }
                })
            }
            var passwordToken = crypto.randomBytes(20).toString('hex');
            var nintydaysinMins = 129600;
            var todaysDate = new Date();
            var expiredPasswordDate = new Date(todaysDate.getTime() - nintydaysinMins * 60000);
            console.log("THE USERS Pass will EXPIRE ON: " + expiredPasswordDate);
            var newUser = new User({
                username: req.body.username,
                firstname: req.body.fname,
                lastname: req.body.lname,
                password: passwordToken,
                email: req.body.email,
                tier: req.body.role,
                badge: req.body.badge,
                unit: req.body.sectunit,
                rank: req.body.ranktitle,
                agency: userAgency._id,
                isActive: false,
                passwordDate: expiredPasswordDate
            });
            console.log("User: " + newUser.username + "'s Password: " + newUser.password);
            //Save the user
            User.createUser(newUser, function (err, user) {
                if (err) {
                    Agency.findAllAgencies(function (err1, listOfAgencies) {
                        if (err1) throw err1;
                        else {
                            console.log(err);
                            var listOfAgencyNames = [];
                            for (const agencyName in listOfAgencies)
                                listOfAgencyNames.push(agencyName.name);
                            prevForm.agencies = listOfAgencyNames;
                            prevForm.errors = getErrorMessage(err);
                            res.render('admin-user-create', prevForm);
                        }
                    })
                }
                //If no errors, user has been saved
                else {
                    sendNewUserNotification(newUser.email, newUser.firstname, newUser.lastname, passwordToken, newUser.username);
                    console.log(user);
                    console.log('User has been registered');
                    req.flash('success_msg', 'User ' + user.username + ' has been registered!');
                    res.redirect('/admin/user/create');
                }
            });
        });
    }
};


function sendNewUserNotification(useremail, firstname, lastname, passwordToken, username)
{
    return emailService.send({
        'to': useremail,
        'from': config.email.from,
        'fromName': config.email.fromName,
        'subject': 'NEW BOLO Account Has Been Created For ' + firstname + ' ' + lastname ,
        'text': 'Congratulations! An account has been made for you on our system!  \n' +
        'Please click on the link below to login to our system: \n\n' +
        config.appURL + '\n\n' +
        '***The following information is deemed sensitive***: ' + '\n\n' +
        'Your username is: ' + username   + '\n\n' +
        'Your first time password is: ' + passwordToken  + '\n\n' +
        'Please login to the BOLO System and follow the instructions to finish setting up your account '
    });
};
/**
 * Responds with a list of all system users.
 *
 * @todo implement sorting, filtering, and paging
 */
exports.getList = function (req, res) {
    if (req.user.tier === 'ROOT') {
        User.findAllUsers(function (err, listOfUsers) {
            if (err) throw err;
            res.render('admin-user', {
                users: listOfUsers
            })
        });
    } else if (req.user.tier === 'ADMINISTRATOR') {
        User.findUsersByAgencyID(req.user.agency.id, function (err, listOfAgencyUsers) {
            if (err) throw err;
            res.render('admin-user', {
                users: listOfAgencyUsers
            })
        });
    } else {
        res.render('unauthorized');
    }
};

/**
 * Responds with a list of all system users.
 *
 * @todo implement sorting, filtering, and paging
 */
exports.getSortedList = function (req, res) {
    req.flash('error_msg', 'Page is not yet ready');
    res.redirect('/admin');
};

/**
 * Responds with account information for a specified user.
 */
exports.getDetails = function (req, res) {
    console.log(req.params.id);
    User.findUserByID(req.params.id, function (err, user) {
        if (err) throw err;
        console.log(user);
        res.render('admin-user-details', {user: user});
    });
};

/**
 * Responds with a form to reset a user's password
 */
exports.getPasswordReset = function (req, res) {
    res.redirect('/password/resetPass');
};

/**
 * Process a request to reset a user's password.
 */
exports.postPasswordReset = function (req, res) {

};

/**
 * Responds with a form for editing a user's details.
 */
exports.getEditDetails = function (req, res) {
    User.findUserByID(req.params.id, function (err, user) {
        if (err) throw err;
        res.render('admin-user-edit', {user: user});
    });
};

/**
 * Process a request to update a user's details.
 */
exports.postEditDetails = function (req, res) {
    User.findUserByID(req.params.id, function (err, user) {
        if (err) throw err;
        if (
            (req.user.tier === 'ROOT') ||
            (req.user.tier === 'ADMINISTRATOR' && req.user.agency === user.agency && user.tier !== 'ADMINISTRATOR')
        ) {

            //Update the user
            if (req.body.username) user.username = req.body.username;
            if (req.body.fname) user.firstname = req.body.fname;
            if (req.body.lname) user.lastname = req.body.lname;
            if (req.body.email)   user.email = req.body.email;
            if (req.body.role)   user.tier = req.body.role;
            if (req.body.badge)   user.badge = req.body.badge;
            if (req.body.sectunit)   user.unit = req.body.sectunit;
            if (req.body.ranktitle)   user.rank = req.body.ranktitle;

            user.save(function (err) {
                if (err) {
                    console.log('User could not be updated');
                    console.log(getErrorMessage(err)[0].msg);
                    req.flash('error_msg', getErrorMessage(err)[0].msg);
                    res.redirect('/admin/user/edit/' + req.params.id);
                } else {
                    console.log('User has been Updated');

                    req.flash('success_msg', 'User has been Updated!');
                    res.redirect('/admin/user/edit/' + req.params.id);
                }
            });
        } else {
            req.flash('error_msg', 'You are not authorized to edit this user');
            res.redirect('/admin/user')
        }
    })
};

/**
 * Renders the delete user page
 */
exports.getDeleteUser = function (req, res) {
    User.findUserByID(req.params.id, function (err, user) {
        if (err) throw err;
        res.render('admin-user-delete', {user: user});
    })
};

/**
 * Attempts to delete user with the given id
 */
exports.postDeleteUser = function (req, res) {
    User.findUserByID(req.params.id, function (err, user) {
        if (err) throw err;
        if (req.user.tier === 'ROOT' ||
            (req.user.tier === 'ADMINISTRATOR' && req.user.agency._id === user.agency._id)) {
            User.comparePassword(req.body.password, req.user.password, function (err, result) {
                if (err) throw err;
                if (result) {
                    console.log(result);
                    //TODO should we remove all BOLOs associated with the agency?
                    User.removeUserByID(req.params.id, function (err, result) {
                        if (err) throw err;
                        console.log(result);
                        req.flash('success_msg', 'User has been deleted');
                        res.redirect('/admin/user');
                    })
                } else {
                    req.flash('error_msg', 'Password was not correct');
                    res.redirect('/admin/user/delete/' + req.params.id);
                }
            })
        } else {
            req.flash('error_msg', 'You are not authorized to delete this user');
            res.redirect('/admin/user');
        }
    })
};

/**
 * Activate or deactivate Users
 */
exports.activationUser = function (req, res) {
    User.findUserByID(req.params.id, function (err, user) {
        if (err) throw err;
        user.isActive = !user.isActive;
        user.save(function (err) {
            if (err) throw err;
            var msg = user.isActive ? 'activated' : 'deactivated';
            req.flash('success_msg', 'User *' + user.username + '* is now ' + msg);
            res.redirect('/admin/user/edit/' + req.params.id);
        });
    })
};
