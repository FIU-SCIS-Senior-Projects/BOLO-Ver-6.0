var User = require('../models/user');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var emailService = require('../services/email-service');
var config = require('../config');

exports.checkPassword = function (req, res)
{
    console.log("THIS IS THE USER checkPassword received: " + req.user);
    var user = req.user;
    //Check If the user's password has expired
    var oneDayInMins =  1440;
    var todaysDate = new Date();
    var aDaySinceUserWasCreated = new Date(user.userDate.getTime() + oneDayInMins*60000);
    console.log("User Password Date: " + user.passwordDate + " -- login.js 185");
    console.log("Current Date is: " + todaysDate + " -- login.js 186");
    console.log("The user has until: " + aDaySinceUserWasCreated + " to create a new password -- login.js 187");

    //If The User's Password Has Expired
    if (todaysDate.getTime() >= user.passwordDate.getTime())
    {
        console.log("***The password is expired -- login.js 187");

        //If The User is actually just a new user they need to create a new password (24 hour period to do so)
        if(aDaySinceUserWasCreated.getTime() >= todaysDate.getTime())
        {
            console.log("This is a new user: " + req.user.username);
            req.flash("success_msg", "Hey, we haven't seen you around before. Welcome To BOLO, please enter a password for your account.");
            res.redirect('/password/renderResetPass');
        }
        //Password Has actually expired
        else
        {
            console.log("This user just has an expired password");

            req.flash("error_msg", "Hey " + req.user.username + " Your Password Has Expired, Please Change Your Password.");
            res.redirect('/password/renderResetPass');
        }
    }
    else
    {
        req.flash("success_msg", 'Welcome ' + req.user.username);
        res.redirect('/bolo');

    }
};

exports.newPassword = function (req, res)
{
    console.log("THIS IS THE USER newPassword received: " + req.user);
    var user = req.user;

    var todaysDate = new Date();
    var nintydaysinMins = 129600;
    var newPasswordDate = new Date(todaysDate.getTime() + nintydaysinMins*60000);

    if (req.body.password)
    {
        console.log("The New Password is: " + req.body.password);
        bcrypt.genSalt(10, function (err, salt)
        {
            if (err) throw (err);
            bcrypt.hash(req.body.password, salt, null, function (err, hash)
            {
                console.log("The new Password salt is: " + hash);
                user.password = hash;
                user.passwordDate = newPasswordDate;
                user.isActive = true;
                user.save(function (err)
                {
                    if (err) {
                        req.flash('error_msg', getErrorMessage(err)[0].msg);
                        res.redirect('/password/renderResetPass');
                    } else {
                        req.flash('success_msg', 'Password Has Been Updated for ' + user.username);
                        res.redirect('/bolo');
                    }
                });
            })
        });
    }

    console.log("The Password Expires on: " + newPasswordDate);
    console.log("THIS IS THE UPDATED USER in newPassword: " + user);


};


exports.renderResetPassword = function (req, res)
{
    res.render('passwordReset', {user: req.user});
};

exports.resetUserPass = function (req, res)
{
    var passwordToken = crypto.randomBytes(20).toString('hex');
    var nintydaysinMins = 129600;
    var todaysDate = new Date();
    var expiredPasswordDate = new Date(todaysDate.getTime() - nintydaysinMins * 60000);

    User.findUserByID(req.params.id, function (err, user)
    {
        if (err) throw err;

        bcrypt.genSalt(10, function (err, salt)
        {
            if (err) throw (err);
            bcrypt.hash(passwordToken, salt, null, function (err, hash)
            {
                console.log("The new Password salt is: " + hash);
                user.password = hash;
                user.passwordDate = expiredPasswordDate;
                user.isActive = true;
                user.save(function (err)
                {
                    if (err) {
                        req.flash('error_msg', getErrorMessage(err)[0].msg);
                        res.redirect('/admin/user');
                    } else {
                        req.flash('success_msg', 'Password Has Been Reset For ' + user.username);
                        res.redirect('/bolo');
                    }
                });
            })
        });
        sendUserPassResetNotification(user.email, user.firstname, user.lastname, passwordToken, user.username);

    });


};
function sendUserPassResetNotification(useremail, firstname, lastname, passwordToken, username)
{
    return emailService.send({
        'to': useremail,
        'from': config.email.from,
        'fromName': config.email.fromName,
        'subject': 'Password Has Been Reset For ' + firstname + ' ' + lastname ,
        'text': 'Your password has been reset by your administrator!  \n' +
        'Please click on the link below to login to our system: \n\n' +
        config.appURL + '\n\n' +
        'If you did not request a password reset please inform your administrator immediately! \n\n' +
        '***The following information is deemed sensitive***: ' + '\n\n' +
        'Your username is: ' + username   + '\n\n' +
        'Your first time password is: ' + passwordToken  + '\n\n' +
        'Please login to the BOLO System and follow the instructions to create a new password for your account '
    });
};