/**
 * This class sets the controls for the account routes
 */

var User = require("../models/user.js");

/**
 * Responds with a the account home page.
 */
exports.getAccountDetails = function (req, res, next) {
    User.findUserByID(req.user._id, function (err, user) {
        if (err) next(err);
        else {
            res.render('account', {user: user});
        }
    })
};
