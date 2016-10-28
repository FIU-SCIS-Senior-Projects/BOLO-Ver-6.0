var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');

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
            res.redirect('/password/resetPass');
        }
        //Password Has actually expired
        else
        {
            console.log("This user just has an expired password");
            req.flash("error_msg", "Hey " + req.user.username + " Your Password Has Expired, Please Change Your Password.");
            res.redirect('/password/resetPass');
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
                        res.redirect('/password/resetPass');
                    } else {
                        req.flash('success_msg', 'Password Has Been Updated');
                        res.redirect('/bolo');
                    }
                });
            })
        });
    }

    console.log("The Password Expires on: " + newPasswordDate);
    console.log("THIS IS THE UPDATED USER in newPassword: " + user);


};

exports.resetPassword = function (req, res)
{

    res.render('passwordReset');
};