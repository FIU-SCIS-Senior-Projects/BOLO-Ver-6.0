'use strict';

var jade = require('jade');
var moment = require('moment');
//var tz = require('moment-timezone'); //Do Not Remove
var path = require('path');
var router = require('express').Router();
var util = require('util');
var uuid = require('node-uuid');
var PDFDocument = require('pdfkit');
//var blobStream = require('blob-stream'); // added blobstream dependency
var iframe = require('iframe');
var fs = require('fs');
var crypto = require('crypto');

var Bolo = require('../models/bolo');
var Agency = require('../models/agency');
var Category = require('../models/category');

var config = require('../config');

var emailService = require('../services/email-service');
var pdfService = require('../services/pdf-service');

var BoloAuthorize = require('../lib/authorization.js').BoloAuthorize;

/**
 * Error handling for MongoDB
 */
var getErrorMessage = function (err) {
    var message = [];

    if (err.code) {
        switch (err.code) {
            case 11000:
            case 11001:
                message.push({msg: 'Bolo already exists?'});
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
 * Send email notification of a new bolo.
 * @param bolo
 * @param template
 * @param creatorEmail
 * @returns {Promise}
 */
function sendBoloNotificationEmail(bolo, template, creatorEmail) {
    var data = {};
    var someData = {};
    var sort = 'username';
    var existWatermark = false;

    var doc = new PDFDocument();
    console.log('----->ready to send email' + JSON.stringify(bolo));
    boloService.getAttachment(bolo.id, 'featured').then(function (attDTO) {
        someData.featured = attDTO.data;
        return boloService.getBolo(bolo.id);
    }).then(function (bolo) {
        data.bolo = bolo;
        return agencyService.getAgency(bolo.agency);
    }).then(function (agency) {
        data.agency = agency;
        console.log(agency);
        if (agency.attachments['watermark'] != null) {
            existWatermark = true;
        }
        return agencyService.getAttachment(agency.id, 'logo')
    }).then(function (logo) {
        someData.logo = logo.data;
        return agencyService.getAttachment(data.agency.id, 'shield')
    }).then(function (shield) {
        someData.shield = shield.data;
        if (existWatermark)
            return agencyService.getAttachment(data.agency.id, 'watermark');
        else
            return null;
    }).then(function (watermark) {
        if (existWatermark)
            someData.watermark = watermark.data;
        return userService.getByUsername(bolo.authorUName);
    }).then(function (user) {
        data.user = user;
        if (existWatermark) {
            doc.image(someData.watermark, 0, 0, {
                fit: [800, 800]
            });
        }
        doc.image(someData.featured, 15, 155, {
            fit: [260, 200]
        });
        doc.image(someData.logo, 15, 15, {
            height: 100
        });
        doc.image(someData.shield, 500, 15, {
            height: 100
        });
        pdfService.genDetailsPdf(doc, data);
        doc.end();

    });

    return userService.getUsers(sort)
        .then(function (users) {
            // filters out users and pushes their emails into array
            var subscribers = users.filter(function (user) {
                var flag = false;
                if (user.notifications) {
                    var notificationLength = user.notifications.length;
                    for (var i = 0; i < notificationLength; i++) {
                        if (bolo.agencyName === user.notifications[i]) {
                            flag = true;
                        }
                    }
                }
                return flag;
            }).map(function (user) {
                console.log(user.email);
                return user.email;
            });

            var tmp = config.email.template_path + '/' + template + '.jade';
            var tdata = {
                'bolo': bolo,
                'app_url': config.appURL
            };

            // todo check if this is async
            var html = jade.renderFile(tmp, tdata);
            console.log("SENDING EMAIL SUCCESSFULLY");
            return emailService.send({
                'to': creatorEmail,
                'bcc': subscribers,
                'from': config.email.from,
                'fromName': config.email.fromName,
                'subject': 'BOLO Alert: ' + bolo.category,
                'html': html,
                'files': [{
                    filename: tdata.bolo.id + '.pdf', // required only if file.content is used.
                    contentType: 'application/pdf', // optional
                    content: doc
                }]
            });

        })
        .catch(function (error) {
            console.error(
                'Unknown error occurred while sending notifications to users' +
                'subscribed to agency id %s for BOLO %s\n %s',
                bolo.agency, bolo.id, error.message
            );
        });
}

/**
 *
 * @param bolo a bolo object
 * @param template
 */
function sendBoloToDataSubscriber(bolo, template) {
    var someData = {};

    console.log('in email function');
    boloService.getAttachment(bolo.id, 'featured').then(function (attDTO) {
        someData.featured = attDTO.data;

        return dataSubscriberService.getDataSubscribers('all_active')
            .then(function (dataSubscribers) {
                // filters out Data Subscribers and pushes their emails into array
                var subscribers = dataSubscribers.map(function (dataSubscriber) {
                    console.log(dataSubscriber.email);
                    return dataSubscriber.email;
                });

                var tmp = config.email.template_path + '/' + template + '.jade';
                var tdata = {
                    'bolo': bolo,
                    'app_url': config.appURL
                };

                var html = jade.renderFile(tmp, tdata);
                console.log("SENDING EMAIL TO SUBSCRIBERS SUCCESSFULLY");
                return emailService.send({
                    'to': subscribers,
                    'from': config.email.from,
                    'fromName': config.email.fromName,
                    'subject': 'BOLO Alert: ' + bolo.category,
                    'html': html,
                    'files': [{
                        filename: tdata.bolo.id + '.jpg', // required only if file.content is used.
                        contentType: 'image/jpeg', // optional
                        content: someData.featured
                    }]
                });

            })
            .catch(function (error) {
                console.error(
                    'Unknown error occurred while sending notifications to subscribers' +
                    'subscribed to agency id %s for BOLO %s\n %s',
                    bolo.agency, bolo.id, error.message
                );
            });
    })

}

/**
 * Sends an email to the loggedin user to confirm a created bolo
 *
 * @param email
 * @param firstname
 * @param lastname
 * @param token
 */
function sendBoloConfirmationEmail(email, firstname, lastname, token) {

    emailService.send({
        'to': email,
        'from': config.email.from,
        'fromName': config.email.fromName,
        'subject': 'BOLO Alert: Confirm BOLO ' + firstname + " " + lastname,
        'text': 'Your BOLO was created but not confirmed. \n' +
        'Click on the link below to confirm: \n\n' +
        config.appURL + '/bolo/confirm/' + token + '\n\n'
    })
}

function sendBoloUpdateConfirmationEmail(email, firstname, lastname, token) {

    emailService.send({
        'to': email,
        'from': config.email.from,
        'fromName': config.email.fromName,
        'subject': 'BOLO Alert: Confirm BOLO ' + firstname + " " + lastname,
        'text': 'Your BOLO was updated but not confirmed. \n' +
        'Click on the link below to confirm: \n\n' +
        config.appURL + '/bolo/confirmBoloUpdate/' + token + '\n\n'
    })
}

/**
 * List bolos at the root route
 */
exports.listBolos = function (req, res) {
    var page = req.query.page || 1;
    var limit = req.query.limit || config.const.BOLOS_PER_PAGE;
    var sortBy = req.query.sort || 'lastUpdated';
    var skip = (1 <= page) ? (page - 1) * limit : 0;
    Bolo.findBolosByAgency(req.user.agency, limit, skip, sortBy, function (err, listOfBolos) {
        if (err) throw err;
        Agency.findAllAgencies(function (err, listOfAgencies) {
            if (err) throw err;
            res.render('bolo', {
                bolos: listOfBolos,
                agencies: listOfAgencies,
                paging: {
                    current: page,
                    last: Math.ceil(listOfBolos.length / limit)
                }
            });
        });
    });
};

/**
 * Handle requests to view the details of a bolo
 */
exports.getBoloDetails = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) {
            res.render('404');
        } else {
            console.log(bolo);
            res.render('bolo-details', {bolo: bolo});
        }
    })
};

// list bolos by agency at the root route
router.get('/agency/:id', function (req, res, next) {

    var agency = req.params.id;
    var page = parseInt(req.query.page) || 1;
    console.log('page: ' + page);
    var limit = config.const.BOLOS_PER_PAGE;
    console.log('limit: ' + limit);
    var skip = (1 <= page) ? (page - 1) * limit : 0;
    var data = {
        'paging': {
            'first': 1,
            'current': page
        }
    };


    Bolo.findBolosByAgency(agency, limit, skip).then(function (results) {
        data.bolos = results.bolos;
        data.agencyRoute = req.params.id;
        console.log('total: ' + results.total);
        data.paging.last = Math.ceil(results.total / limit);
        console.log('paging: ' + data.paging.last);
        agencyService.getAgencies().then(function (agencies) {

            data.agencies = agencies;

            var i;
            for (i = 0; i < agencies.length; i++) {
                if (agencies[i].data.id === req.user.agency) {

                    data.agency = agencies[i];
                    data.userAgency = agencies[i].data;

                }
                if (agencies[i].data.id === agency) {

                    data.filter = agencies[i].data.name;
                }
            }

            res.render('bolo-list-agency', data);
        });
    }).catch(function (error) {
        next(error);
    });

});


/**
 * Grabs the agencies to filter by from a front end ajax call
 */
var agenciesToFilterBy;
router.post('/agencies/', function (req, res) {

    agenciesToFilterBy = req.body['agencies'];
    console.log("Posted and got " + agenciesToFilterBy);
    res.send({
        redirect: '/bolo/agencies'
    });

});

router.get('/agencies/', function (req, res, next) {

    if (typeof agenciesToFilterBy === 'undefined') {
        res.redirect('/bolo');
    }
    //var author = req.user.username;
    var page = parseInt(req.query.page) || 1;
    console.log('page: ' + page);
    var limit = config.const.BOLOS_PER_PAGE;
    console.log('limit: ' + limit);
    var skip = (1 <= page) ? (page - 1) * limit : 0;
    var data = {
        'paging': {
            'first': 1,
            'current': page
        }
    };

    // parse the agenciesToFilterBy array and create a string of agencies
    var filter = "";
    for (var i = 0; i < agenciesToFilterBy.length; i++) {
        filter += agenciesToFilterBy[i];
        if (i + 1 < agenciesToFilterBy.length) {
            filter += ", ";
        }
    }
    data.filter = filter;
    data.pageRoute = '/bolo/agencies';

    boloService.getBolosFromAgencies(agenciesToFilterBy, limit, skip).then(function (results) {
        data.bolos = results.bolos;

        agencyService.getAgencies().then(function (agencies) {
            data.agencies = agencies;
            var i;
            for (i = 0; i < agencies.length; i++) {
                if (req.user.agency === agencies[i].data.id) {
                    data.userAgency = agencies[i].data;
                }
            }
            data.paging.last = Math.ceil((Math.ceil(results.total / limit) * results.bolos.length) / limit);
            res.render('bolo-list', data);

        });
    }).catch(function (error) {
        next(error);
    });

});

/**
 * List archived bolos
 */
exports.getArchivedBolos = function (req, res) {

    var page = parseInt(req.query.page) || 1;
    var limit = config.const.BOLOS_PER_PAGE;
    var skip = (1 <= page) ? (page - 1) * limit : 0;

    var data = {
        'paging': {
            'first': 1,
            'current': page
        }
    };

    boloService.getArchiveBolos(limit, skip).then(function (results) {
        data.bolos = results.bolos;
        data.paging.last = Math.ceil(results.total / limit);
        res.render('bolo-archive', data);
    }).catch(function (error) {
        next(error);
    });
};

router.post('/archive/purge', function (req, res) {

    var pass = req.body.password;
    var username = req.user.data.username;
    var range = req.body.range;
    var authorized = false;

    //2nd level of auth
    userService.authenticate(username, pass)
        .then(function (account) {
            var min_mins = 0;
            if (account) {
                //third level of auth
                var tier = req.user.roleName();

                if (tier === 'ROOT') {
                    authorized = true;
                    if (range == 1) {
                        min_mins = 1051200;
                    } else if (range == 2) {

                        min_mins = 0;
                    }

                    var now = moment().format(config.const.DATE_FORMAT);
                    var then = "";
                    boloService.getArchiveBolosForPurge().then(function (bolos) {

                        var promises = [];
                        for (var i = 0; i < bolos.bolos.length; i++) {
                            var curr = bolos.bolos[i];
                            then = curr.lastUpdatedOn;

                            var ms = moment(now, config.const.DATE_FORMAT).diff(moment(then, config.const.DATE_FORMAT));
                            var d = moment.duration(ms);
                            var minutes = parseInt(d.asMinutes());

                            if (minutes > min_mins) {
                                promises.push(boloService.removeBolo(curr.id));
                            }
                        }

                        Promise.all(promises).then(function (responses) {
                            if (responses.length >= 1) {
                                req.flash(GFMSG, 'Successfully purged ' + responses.length + ' BOLOs.');
                            } else {
                                req.flash(GFMSG, 'No BOLOs meet purge criteria.');
                            }
                            res.send({
                                redirect: '/bolo/archive'
                            });
                        });

                    });

                }
            }
            if (authorized === false) {
                req.flash(GFERR,
                    'You do not have permissions to purge BOLOs. Please ' +
                    'contact your agency\'s administrator ' +
                    'for access.');
                res.send({
                    redirect: '/bolo/archive'
                });
            }
        }).catch(function () {
        req.flash(GFERR, "error in purge process, please try again");
        res.send({
            redirect: '/bolo/archive'
        });
    });
});

router.get('/search/results', function (req, res) {


    console.log(req.query.bookmark);
    var query_string = req.query.valid;
    console.log(query_string);
    var data = {
        bookmark: req.query.bookmark || {},
        more: true,
        query: query_string
    };
    // Do something with variable
    var limit = config.const.BOLOS_PER_PAGE;

    boloService.searchBolos(limit, query_string, data.bookmark).then(function (results) {
        data.paging = results.total > limit;

        if (results.returned < limit) {
            console.log('theres no more!!');
            data.more = false; //indicate that another page exists
        }

        data.previous_bookmark = data.bookmark || {};
        data.bookmark = results.bookmark;
        console.log("current: " + data.bookmark);
        console.log("previous: " + data.previous_bookmark);

        data.bolos = results.bolos;
        res.render('bolo-search-results', data);
    }).catch(function (error) {
        next(error);
    });
});

exports.getBoloSearch = function (req, res) {
    req.flash('error_msg', 'Not Yet Implemented');
    res.redirect('/bolo');
};

/**
 * Renders the bolo create form
 */
exports.getCreateBolo = function (req, res) {
    Category.findAllCategories(function (err, listOfCategories) {
        if (err) {
            req.flash('error_msg', 'Could not load the Categories on the database');
            res.redirect('/bolo');
        } else {
            console.log(listOfCategories);
            res.render('bolo-create', {categories: listOfCategories});
        }
    })
};

/**
 * Creates a BOLO
 */
exports.postCreateBolo = function (req, res) {
    console.log(req.body);
    console.log(req.files);

    Category.findAllCategories(function (err, listOfCategories) {
        if (err) {
            req.flash('error_msg', 'Could not find categories');
            res.redirect('/bolo/create');
        } else {
            //Holds previously entered form data
            var prevForm = {
                vid1: req.body.videoURL,
                info1: req.body.info,
                summary1: req.body.summary,
                categories: listOfCategories
            };


            //Validation of form
            var errors = [];
            req.checkBody('category', 'Please select a category').notEmpty();
            var valErrors = req.validationErrors();
            for (var x in valErrors)
                errors.push(valErrors[x]);
            // If there are errors
            if (errors.length) {
                console.log(errors);

                //Remove uploads
                if (req.files['featured']) fs.unlinkSync(req.files['featured'][0].path);
                if (req.files['other1']) fs.unlinkSync(req.files['other1'][0].path);
                if (req.files['other2']) fs.unlinkSync(req.files['other2'][0].path);

                //Render back page
                prevForm.errors = errors;
                res.render('bolo-create', prevForm);
            }
            //If no errors were found
            else {
                Category.findCategoryByName(req.body.category, function (err, category) {
                    if (err) throw err;
                    var token = crypto.randomBytes(20).toString('hex');
                    var newBolo = new Bolo({
                        author: req.user.id,
                        agency: req.user.agency.id,
                        category: category.id,
                        videoURL: req.body.videoURL,
                        info: req.body.info,
                        summary: req.body.summary,
                        conformationToken: token,
                        status: 'ACTIVE'
                    });
                    newBolo.fields = req.body.field;
                    if (req.files['featured']) {
                        newBolo.featured = {
                            data: fs.readFileSync(req.files['featured'][0].path),
                            contentType: req.files['featured'][0].mimeType
                        };
                    }
                    if (req.files['other1']) {
                        newBolo.other1 = {
                            data: fs.readFileSync(req.files['other1'][0].path),
                            contentType: req.files['other1'][0].mimeType
                        };
                    }
                    if (req.files['other2']) {
                        newBolo.other2 = {
                            data: fs.readFileSync(req.files['other2'][0].path),
                            contentType: req.files['other2'][0].mimeType
                        };
                    }
                    newBolo.save(function (err) {
                        if (err) {
                            prevForm.errors = getErrorMessage(err);
                            res.render('bolo-create', prevForm);
                        } else {
                            console.log('Sending email using Sendgrid');
                            sendBoloConfirmationEmail(req.user.email, req.user.firstname, req.user.lastname, token);
                            req.flash('success_msg', 'BOLO successfully created, Please check your email in order to confirm it.');
                            res.redirect('/bolo');
                        }
                    });
                })
            }
        }
    })
};

/**
 * Update bolo status through thumbnail select menu
 */
router.post('/update/:id', function (req, res, next) {

});

/**
 * Render the bolo edit form
 */
exports.getEditBolo = function (req, res) {
    req.flash('error_msg', 'Not yet Implemented');
    res.redirect('/bolo');
};

/**
 * Process edits on a specific bolo
 */
exports.postEditBolo = function (req, res) {
    //var token = crypto.random(20);
    req.flash('error_msg', 'Not yet Implemented');
    res.redirect('/bolo');
};

/**
 * Confirms an emailed Bolo
 */
exports.confirmBolo = function (req, res) {
    Bolo.findBoloByToken(req.params.token, function (err, boloToConfirm) {
        if (err) throw err;
        else if (!boloToConfirm) {
            req.flash('error_msg', 'Bolo to confirm was not found on the database');
            res.redirect('/bolo');
        } else {
            boloToConfirm.isConfirmed = true;
            boloToConfirm.save(function (err) {
                if (err) throw err;
                req.flash('success_msg', 'Bolo has been confirmed');
                res.redirect('/bolo');
            })
        }
    });
};

/**
 * Handle requests to inactivate a specific bolo
 */
exports.archiveBolo = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) throw err;
        req.flash('error_msg', 'Not yet Implemented');
        res.redirect('/bolo');
    });
};

/**
 * Process a request to restore a bolo from the archive.
 */
router.get('/restore/:id', function (req, res, next) {
    var data = {};

    getAllBoloData(req.params.id).then(function (_data) {
        _.extend(data, _data);
        var auth = new BoloAuthorize(data.bolo, data.author, req.user);
        if (auth.authorizedToArchive()) {
            boloService.activate(data.bolo.id, true);
        }
    }).then(function (response) {
        req.flash(GFMSG, 'Successfully restored BOLO.');
        setTimeout(function () {
            res.redirect('/bolo/archive')
        }, 3000);
    }).catch(function (error) {
        if (!/unauthorized/i.test(error.message)) throw error;

        req.flash(GFERR,
            'You do not have permissions to restore this BOLO. Please ' +
            'contact your agency\'s supervisor or administrator ' +
            'for access.'
        );
        res.redirect('back');
    }).catch(function (error) {
        next(error);
    });
});


/**
 * Process a request delete a bolo with the provided id
 */
router.get('/delete/:id', function (req, res, next) {

    getAllBoloData(req.params.id).then(function (data) {
        var auth = new BoloAuthorize(data.bolo, data.author, req.user);
        if (auth.authorizedToDelete()) {
            return boloService.removeBolo(req.params.id);
        }
    }).then(function (response) {
        req.flash(GFMSG, 'Successfully deleted BOLO.');
        res.redirect('back');
    }).catch(function (error) {
        if (!/unauthorized/i.test(error.message)) throw error;

        req.flash(GFERR,
            'You do not have permissions to delete this BOLO. Please ' +
            'contact your agency\'s supervisor or administrator ' +
            'for access.'
        );
        res.redirect('back');
    }).catch(function (error) {
        next(error);
    });
});


router.get('/details/pdf/:id' + '.pdf', function (req, res, next) {
    console.log("I'm In the function");

    var data = {};
    var someData = {};

    var doc = new PDFDocument();
    var existWatermark = false;
    boloService.getAttachment(req.params.id, 'featured').then(function (attDTO) {
        console.log("I'm In the middle of the function 1");
        someData.featured = attDTO.data;
        return boloService.getBolo(req.params.id);
    }).then(function (id) {
        console.log("I'm In the middle of the function 2");
        data.bolo = id;
        return agencyService.getAgency(id.agency);
    }).then(function (agency) {
        console.log("I'm In the middle of the function 3");
        data.agency = agency;
        if (agency.attachments['watermark'] != null) {
            existWatermark = true;
        }
        if (existWatermark)
            return agencyService.getAttachment(agency.id, 'watermark');
        else
            return null;
    })/*.then(function (watermark) {
     console.log("I'm In the middle of the function 4");
     if (existWatermark)
     someData.watermark = watermark.data;
     return agencyService.getAttachment(data.agency.id, 'logo')
     }).then(function (logo) {
     console.log("I'm In the middle of the function 5");
     someData.logo = logo.data;
     return agencyService.getAttachment(data.agency.id, 'shield')
     }).then(function (shield) {
     console.log("I'm In the middle of the function 6");
     someData.shield = shield.data;
     return userService.getByUsername(data.bolo.authorUName);
     })*/.then(function (user) {
        console.log("I'm In the middle of the function 7");
        data.user = userService.getByUsername(data.bolo.authorUName);
        console.log("Checking Attributes of USER: " + data.user);
        console.log("User.rank: " + data.user.sectunit);
        console.log("User.name: " + data.user.fname);
        console.log("Author.name: " + data.bolo.authorFName);
        var logo = agencyService.getAttachment(data.agency.id, 'logo');
        console.log("LOGO: ", +logo);
        someData.shield = '/Users/libsys/BOLO6/Code/src/web/public/img/pinecrest-police-logo.png';
        someData.logo = '/Users/libsys/BOLO6/Code/src/web/public/img/logo.jpg';

        if (existWatermark) {
            doc.image(someData.watermark, 0, 0, {
                fit: [800, 800]
            });
        }
        pdfService.genDetailsPdf(doc, data);

        doc.image(someData.featured, 15, 155, {
            fit: [260, 200]
        });
        doc.image(someData.logo, 15, 15, {
            height: 100
        });
        //console.log(someData.shield.content_type);
        doc.image(someData.shield, 500, 15, {
            height: 100
        });
        doc.end();

        res.contentType("application/pdf");
        doc.pipe(res);

    }).catch(function (error) {
        next(error);
    });
    console.log("I'm at the end of the function");
});

router.get('/details/record/:id', function (req, res, next) {
    var data = {
        'form_errors': req.flash('form-errors')
    };
    boloService.getBolo(req.params.id).then(function (bolo) {
        data.record = bolo.record;
        res.render('bolo-record-tracking', data);

    }).catch(function (error) {
        next(error);
    });
});