var multiparty          = require('multiparty');
var json2csv            = require('json2csv');
var fs                  = require('fs');
var path                = require('path');

var all_fields          = ['id', 'agency', 'agencyName', 'author', 'category',
    'firstName', 'lastName', 'dob', 'dlNumber', 'address', 'zipCode',
    'race', 'sex', 'height', 'weight', 'hairColor', 'tattoos',
    'vehicleMake', 'vehicleModel', 'vehicleColor', 'vehicleYear',
    'vehicleStyle', 'vehicleLicenseState', 'vehicleLicensePlate',
    'vehicleIdNumber', 'boatYear', 'boatManufacturer', 'boatModel',
    'boatType', 'boatLength', 'boatColor', 'boatHullIdNumber',
    'boatRegistrationNumberSt', 'boatRegistrationNumberNu',
    'propulsion', 'propulsionType', 'propulsionMake', 'trailer',
    'trailerManufacturer', 'trailerVIN', 'trailerTagLicenseState',
    'trailerTagLicenseNumber', 'timeReported', 'dateReported',
    'timeRecovered', 'dateRecovered', 'addressRecovered',
    'zipCodeRecovered', 'agencyRecovered', 'additional',
    'summary', 'Type', 'record', 'isActive'];


var config              = require('../../config');
/**
 * Respond with a form to create a Data Subscriber.
 */
module.exports.getDataAnalysis = function(req, res) {
    req.flash('error_msg','Not Yet Implemented');
    res.redirect('/admin');
};

module.exports.downloadCsv = function(req, res) {

    var agenciesToFilterBy = req.query['agencies'];
    boloService.getBolosFromAgencies(agenciesToFilterBy, 2000000, 0).then(function(results) {
        return json2csv({ data: results.bolos, fields: all_fields})
    }).then(function(file) {
        fs.writeFile('./src/web/public/csv/bolos.csv', file, function(err) {
            if (err) {console.log(err)}
            res.send("/csv/bolos.csv");
        })
    }).catch(function(err) {
        console.log(err);
    })
};