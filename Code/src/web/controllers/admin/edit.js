/**
 * This class sets the controls for the aboutUs routes
 */
var fs = require('fs');

/**
 * Gets the about us editor
 */
exports.getAboutUsForm = function (req, res) {
    fs.readFile('./public/AboutUs.md', function (err, data) {
        if (err) {
            console.log(err);
            res.render('admin-edit-aboutUs',
                {errors: [{msg: 'Error! AboutUs.md could not be read'}]});
        } else {
            console.log('AboutUs is being read');
            res.render('admin-edit-aboutUs', {markdown: data.toString()});
        }
    })
};

exports.saveAboutUs = function (req, res) {
    var newMarkdown = req.body.in;
    console.log('Writing to system: ' + newMarkdown);
    fs.writeFile('./public/AboutUs.md', newMarkdown, function (err) {
        if (err) {
            console.log(err);
            req.flash('The file did not save...', err);
            res.render('admin-edit-aboutUs', {markdown: newMarkdown});
        } else {
            console.log('AboutUs has been over-written');
            req.flash('success_msg', 'Changes are saved');
            res.redirect('/admin/edit/aboutUs');
        }
    })
};

exports.getLoginPageForm = function (req, res) {
    req.flash('error_msg', 'Page is not yet ready');
    res.redirect('/admin');
};

exports.saveLoginPage = function (req, res) {
    req.flash('error_msg', 'Page is not yet ready');
    res.redirect('/admin');
};

exports.getUserGuideForm = function (req, res) {
    fs.readFile('./public/UserGuide.md', function (err, data) {
        if (err) {
            console.log(err);
            res.render('admin-edit-userGuide',
                {errors: [{msg: 'Error! UserGuide.md could not be read'}]});
        } else {
            res.render('admin-edit-userGuide', {userGuide: data.toString()});
        }
    })
};

exports.saveUserGuide = function (req, res) {
    var newMarkdown = req.body.in;
    console.log('Writing to system: ' + newMarkdown);
    fs.writeFile('./public/UserGuide.md', newMarkdown, function (err) {
        if (err) {
            console.log(err);
            req.flash('error_msg', err);
            res.render('admin-edit-userGuide', {markdown: newMarkdown, errors: req.flash('error_msg')});
        } else {
            console.log('UserGuide has been over-written');
            req.flash('success_msg', 'Changes are saved');
            res.redirect('/admin/edit/userGuide');
        }
    })
};