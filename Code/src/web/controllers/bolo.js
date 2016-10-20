'use strict';

var jade = require('jade');
var moment = require('moment');
//var tz = require('moment-timezone'); //Do Not Remove
var path = require('path');
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
 * List active bolos based on query
 */
exports.listBolos = function (req, res) {
    console.log(req.query);
    var limit = config.const.BOLOS_PER_QUERY;
    var filter = req.query.filter || 'allBolos';
    var isArchived = req.query.archived || false;
    switch (filter) {
        case 'allBolos':
            Bolo.findAllBolos(true, isArchived, limit, 'createdOn', function (err, listOfBolos) {
                if (err) throw err;
                console.log('allBolos Bolos: num = ' + listOfBolos.length);
                res.render('partials/bolo-thumbnails', {bolos: listOfBolos});
            });
            break;
        case 'myAgency':
            Bolo.findBolosByAgency(req.user.agency, true, isArchived, limit, 'createdOn', function (err, listOfBolos) {
                if (err) throw err;
                console.log('myAgency Bolos: num = ' + listOfBolos.length);
                res.render('partials/bolo-thumbnails', {bolos: listOfBolos});
            });
            break;
        case 'myBolos':
            Bolo.findBolosByAuthor(req.user.id, true, isArchived, limit, 'createdOn', function (err, listOfBolos) {
                if (err) throw err;
                console.log('myBolos Bolos: num = ' + listOfBolos.length);
                res.render('partials/bolo-thumbnails', {bolos: listOfBolos});
            });
            break;
        default:
            Bolo.findAllBolos(true, isArchived, limit, 'createdOn', function (err, listOfBolos) {
                if (err) throw err;
                console.log('allBolos Bolos: num = ' + listOfBolos.length);
                res.render('partials/bolo-thumbnails', {bolos: listOfBolos});
            });
            break;
    }
};

exports.renderBoloPage = function (req, res) {
    res.render('bolo');
};

/**
 * Handle requests to view the details of a bolo
 */
exports.getBoloDetails = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) {
            res.render('404');
        } else {
            console.log("Generate BOLO DETAILS" + bolo);
            res.render('bolo-details', {bolo: bolo});
        }
    })
};

/**
 * Renders the Bolo as a PDF
 */
exports.renderBoloAsPDF = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) {
            res.render('404');
        }
        else {
            //req.flash('error_msg', 'Not yet Implemented');
            //res.redirect('/bolo');
            //Variable and Object Declaration
            var doc = new PDFDocument();

            /*
             ===================================================
             *            GET AGENCY DEPENDENT ITEMS           *
             ===================================================
             */
            Agency.findAgencyByID(bolo.agency.id, function (err, agency) {
                if (err) throw err;


                /*
                 ===================================================
                 *         Begin Building The PDF Document         *
                 ===================================================
                 */

                //--------------GRAPHICS PORTION-----------------------

                //Write Agency Graphics if they exist to the PDF
                if (agency.watermark.data != undefined) {
                    doc.image(agency.watermark.path, 0, 0, {
                        fit: [800, 800]
                    });
                }

                if (agency.logo.data != undefined) {
                    doc.image(agency.logo.data, 15, 15, {
                        height: 100
                    });
                }
                if (agency.shield.data != undefined) {
                    doc.image(agency.shield.data, 490, 15, {
                        height: 100
                    });
                }

                //Write BOLO Images based on how many images exist, to the PDF

                //Only Featured is present
                if ((bolo.other1.data == undefined) && (bolo.other2.data == undefined)) {
                    doc.image(bolo.featured.data, 228, 135, {
                        width: 170, height: 110, align: 'center'
                    }).moveDown(5);
                }
                // Only Featured and Other1 are present
                if ((bolo.other1.data != undefined) && (bolo.other2.data == undefined)) {
                    doc.image(bolo.featured.data, 330, 135, {
                        width: 170, height: 110, align: 'center'
                    }).moveDown(5);

                    doc.image(bolo.other1.data, 130, 135, {
                        width: 170, height: 110, align: 'left'
                    }).moveDown(5);
                }
                // Only Featured and Other2 are present
                if ((bolo.other2.data != undefined) && (bolo.other1.data == undefined)) {
                    doc.image(bolo.featured.data, 130, 135, {
                        width: 170, height: 110, align: 'center'
                    }).moveDown(5);

                    doc.image(bolo.other2.data, 330, 135, {
                        width: 170, height: 110, align: 'left'
                    }).moveDown(5);
                }
                // All Images are present
                if ((bolo.other1.data != undefined) && (bolo.other2.data != undefined)) {
                    doc.image(bolo.featured.data, 228, 135, {
                        width: 170, height: 110, align: 'center'
                    }).moveDown(5);

                    doc.image(bolo.other1.data, 40, 135, {
                        width: 170, height: 110, align: 'left'
                    }).moveDown(5);

                    doc.image(bolo.other2.data, 415, 135, {
                        width: 170, height: 110, align: 'right'
                    }).moveDown(5);
                }

                //--------------TEXT PORTION-----------------------

                //Write headers and Police Department Information to the PDF Document
                doc.fontSize(10);
                doc.font('Times-Roman');
                doc.fillColor('red');
                doc.text("UNCLASSIFIED// FOR OFFICIAL USE ONLY// LAW ENFORCEMENT SENSITIVE", 85, 15, {align: 'center'})
                    .moveDown(0.25);
                doc.fillColor('black');
                doc.text(agency.name + " Police Department", {align: 'center'})
                    .moveDown(0.25);
                doc.text(agency.address, {align: 'center'})
                    .moveDown(0.25);
                doc.text(agency.city + ", " + agency.state + ", " + agency.zipcode, {align: 'center'})
                    .moveDown(0.25);
                doc.text(agency.phone, {align: 'center'})
                    .moveDown(0.25);
                doc.fontSize(20);
                doc.fillColor('red');

                //Write Category and BOLO status to the PDF Document
                doc.fontSize(23);
                if (bolo.status !== "Active" && bolo.status !== "Updated") {
                    doc.fillColor('red');
                    doc.text(bolo.category.name + " -- " + bolo.status, 85, 100, {align: 'center'})//original 100, 140
                        .moveDown(7);
                }
                doc.fontSize(12);
                doc.fillColor('black');
                doc.fontSize(11);
                doc.font('Times-Roman')
                    .text("Bolo ID: ", 200)
                    .moveUp()
                    .text(bolo.id, 400)
                    .moveDown();

                //Write all of the fields and details to the PDF Document
                for (var i = 0; i < bolo.fields.length; i++) {
                    console.log("I am trying to print the text!");
                    doc.fillColor('black');
                    doc.fontSize(12);
                    doc.font('Times-Roman')
                        .text(bolo.category.fields[i] + ": ", 200)
                        .moveUp()
                        .text(bolo.fields[1], 400)
                        .moveDown();

                }

                //Write Additional Details
                doc.font('Times-Roman')
                    .text(" ", 200)
                    .moveDown();

                doc.font('Times-Bold')
                    .text("Created: " + bolo.createdOn, 200)
                    .moveDown();


                /*
                 //For Data Analysis Recovered
                 if(data.bolo['dateRecovered'] !== ""){
                 doc.font('Times-Roman')
                 .text("Date Recovered: " + data.bolo['dateRecovered'], 200)
                 .moveDown(0.25);
                 }
                 if(data.bolo['timeRecovered'] !== ""){
                 doc.font('Times-Roman')
                 .text("Time Recovered: " + data.bolo['timeRecovered'], 200)
                 .moveDown(0.25);
                 }
                 if(data.bolo['addressRecovered'] !== ""){
                 doc.font('Times-Roman')
                 .text("Address Recovered: " + data.bolo['addressRecovered'], 200)
                 .moveDown(0.25);
                 }
                 if(data.bolo['zipCodeRecovered'] !== ""){
                 doc.font('Times-Roman')
                 .text("Zip Code Recovered: " + data.bolo['zipCodeRecovered'], 200)
                 .moveDown(0.25);
                 }
                 if(data.bolo['agencyRecovered'] !== ""){
                 doc.font('Times-Roman')
                 .text("Agency Recovered: " + data.bolo['agencyRecovered'], 200)
                 .moveDown();
                 }
                 */

                // Display Additional Information only if there is a value in it
                if (bolo.info !== "") {
                    doc.font('Times-Bold')
                        .text("Additional: ", 200)
                        .moveDown(0.25);
                    doc.font('Times-Roman')
                        .text(bolo.info, {width: 281})
                        .moveDown();
                }

                // Display a Summary only if there is a value in it
                if (bolo.summary !== "") {
                    doc.font('Times-Bold')
                        .text("Summary: ", 200)
                        .moveDown(0.25);
                    doc.font('Times-Roman')
                        .text(bolo.summary, {width: 281})
                        .moveDown();
                }

                doc.font('Times-Bold')
                    .text("This BOLO was created by: " + bolo.author.unit + " " + bolo.author.rank + " " + bolo.author.firstname + " " + bolo.author.lastname)
                    .moveDown(0.25);
                doc.font('Times-Bold')
                    .text("Please contact the agency should clarification be required.", {width: 281});

                //End Document and send it to the front end via res
                doc.end();
                res.contentType("application/pdf");
                doc.pipe(res);

            });

        }
    })
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
                        status: 'ACTIVE',
                        fields: req.body.field
                    });
                    newBolo.fields = req.body.field;
                    console.log("THESE ARE THE NEW BOLO FIELDS: " + req.body.field);
                    console.log("THESE ARE THE CATEGORY FIELDS: " + category.fields);
                    console.log("THIS IS THE CATEGORY: " + category);

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
                    Agency.findAgencyByID(req.user.agency.id, function (err, agency)
                    {
                        console.log("NEW BOLO: " + newBolo);
                        if(req.body.option === "preview")
                        {
                            res.render('bolo-preview', {bolo: newBolo, category: category, agency: agency});
                        }
                        else
                        {
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
                        }
                    })


                })
            }
        }
    })
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
        } else if (boloToConfirm.isConfirmed === true) {
            req.flash('success_msg', 'That Bolo was already confirmed');
            res.redirect('/bolo');
        } else {
            boloToConfirm.isConfirmed = true;
            boloToConfirm.save(function (err) {
                if (err) throw err;
                req.flash('success_msg', 'Bolo has been confirmed');
                res.redirect('/bolo');
            });
        }
    });
};

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
 * List archived bolos
 */
exports.renderArchivedBolos = function (req, res) {
    var page = req.query.page || 1;
    var limit = config.const.BOLOS_PER_PAGE;
    var sortBy = req.query.sort || 'lastUpdated';
    Bolo.findBolosByAgency(req.user.agency, true, true, limit, sortBy, function (err, listOfBolos) {
        if (err) throw err;
        Agency.findAllAgencies(function (err, listOfAgencies) {
            if (err) throw err;
            res.render('bolo-archive', {
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
 * Handle requests to inactivate a specific bolo
 */
exports.archiveBolo = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) throw err;
        bolo.isArchived = true;
        var shortID = bolo.id.substring(0, 8) + '...';
        bolo.save(function (err) {
            if (err) throw err;
            req.flash('error_msg', 'Bolo ' + shortID + ' has been archived');
            res.redirect('/bolo');
        });
    });
};

/**
 * Handle requests to activate a specific bolo
 */
exports.unArchiveBolo = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) throw err;
        bolo.isArchived = false;
        var shortID = bolo.id.substring(0, 8) + '...';
        bolo.save(function (err) {
            if (err) throw err;
            req.flash('success_msg', 'Bolo ' + shortID + ' has been restored');
            res.redirect('/bolo/archive');
        });
    });
};

/**
 * Deletes a specific bolo
 */
exports.deleteBolo = function (req, res) {
    var shortID = req.params.id.substring(0, 8) + '...';
    //Check if the current user is authorized to delete the bolo
    if (req.user.tier === 'ROOT' ||
        (req.user.tier === 'ADMINISTRATOR' && req.user.agency.id === bolo.agency.id)) {
        Bolo.deleteBolo(req.params.id, function (err, bolo) {
            if (err) throw err;
            req.flash('success_msg', 'BOLO ' + shortID + ' has been deleted');
            res.redirect('/bolo/archive');
        });
    } else {
        req.flash('error_msg', 'You are not authorized to delete BOLO ' + shortID);
        res.redirect('/bolo/archive');
    }
};

/**
 * Deletes all archived bolos
 */
exports.purgeArchivedBolos = function (req, res) {
    //Check if the current user is authorized to delete all archived bolos
    if (req.user.tier === 'ROOT') {
        Bolo.deleteAllArchivedBolos(function (err, result) {
            if (err) throw err;
            console.log(result);
            req.flash('success_msg', 'All archived BOLOs have been deleted. Removed ' + result.n + ' BOLOs');
            res.redirect('/bolo/archive');
        });
    } else {
        req.flash('error_msg', 'You are not authorized to purge all BOLOs');
        res.redirect('/bolo/archive');
    }
};

/**
 * Searches though all bolos where the user has access
 */
exports.getBoloSearch = function (req, res) {
    req.flash('error_msg', 'Not Yet Implemented');
    res.redirect('/bolo');
};