/* jshint node: true */
'use strict';

var _                   = require('lodash');
var Promise             = require('promise');
var router              = require('express').Router();
var PDFDocument         = require('pdfkit');


var config              = require('../config');
var agencyRepository    = new config.AgencyRepository();
var agencyService       = new config.AgencyService( agencyRepository );
var pdfService          = new config.PDFService();


module.exports = router;
router.get(  '/userGuide'                , getUserGuide );
router.get(  '/userGuide/pdf'            , downloadUserGuide);


/**
 * This function is to display the user guide on each individual teir.
 *
 * @params req
 * @params res
 *@Author John Burke
 */
function getUserGuide(req, res){
    console.log('In the getUserGuide');
    res.render('user-guide');
}


/**
 *This function is used to down load the user's guide as a PDF
 *
 * @params req
 * @params res
 * @Author John Burke
 */
function downloadUserGuide(req, res) {

    console.log('In the downloadUserGuide');
    var doc = new PDFDocument();
    pdfService.genUserGuide(req.user, doc);
    doc.end();
    res.contentType("application/pdf");
    doc.pipe(res);
}
