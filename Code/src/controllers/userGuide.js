/**
 * This class sets the controls for the User Guide routes
 */

var fs = require('fs');
var md = require("node-markdown").Markdown;

/**
 * Displays the user guide for each individual teir.
 */
exports.getUserGuide = function (req, res, next) {
    fs.readFile(__dirname + '/../public/UserGuide.md', function (err, data) {
        if (err) next(err);
        else {
            res.render('user-guide', {md: md, text: data.toString()});
        }
    });
};