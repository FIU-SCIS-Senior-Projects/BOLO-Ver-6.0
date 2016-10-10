/* jshint node: true */
'use strict';



var _                   = require('lodash');
var Promise             = require('promise');
var router              = require('express').Router();


var config              = require('../config');
var agencyRepository    = new config.AgencyRepository();
var agencyService       = new config.AgencyService( agencyRepository );


module.exports = router;
router.get(  '/aboutUs/MDCACP',    getAboutMDCACP );
router.get(  '/aboutUs/FIU',     getAboutUsFIU );
router.get(  '/aboutUs/IBM',     getAboutUsIBM );


/**
 * This function is to display the user guide on each individual teir.
 *
 * @params req
 * @params res
 */
function getAboutMDCACP(req, res){
    console.log('In the getAboutUsBOLO');
    res.render('about-MDCACP');
}
/**
 * This function is to display the user guide on each individual teir.
 *
 * @params req
 * @params res
 */
function getAboutUsFIU(req, res){
    console.log('In the getAboutUsFIU');
    res.render('about-fiu');
}
/**
 * This function is to display the user guide on each individual teir.
 *
 * @params req
 * @params res
 */
function getAboutUsIBM(req, res){
    console.log('In the getAboutUsIBM');
    res.render('about-ibm');
}
