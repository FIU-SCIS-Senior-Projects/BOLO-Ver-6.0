/**
 * This class sets the controls for the aboutUs routes
 */

var fs = require('fs');
var md = require('node-markdown').Markdown;

/**
 * This function is to display the MDCACP about page
 */
exports.getAboutMDCACP = function (req, res) {
    res.render('about-MDCACP');
};

/**
 * This function is to display the AboutUsFIU page.
 */
exports.getAboutUsFIU = function (req, res) {
    res.render('about-fiu');
};

/**
 * This function is to display the AboutIBM page.
 */
exports.getAboutUsIBM = function (req, res) {
    res.render('about-ibm');
};

exports.getAboutUs = function (req, res) {
    fs.readFile(__dirname + '/../public/AboutUs.md', function (err, data) {
        if (err) {
            throw err;
        } else {
            console.log('AboutUs.md is being read');
            res.render('about', {md: md, text: data.toString()});
        }
    });
};