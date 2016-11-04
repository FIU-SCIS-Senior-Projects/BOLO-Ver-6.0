var multiparty          = require('multiparty');
var json2csv            = require('json2csv');
var fs                  = require('fs');
var path                = require('path');
var Agency = require('../../models/agency');
var BOLO = require('../../models/bolo');
var config              = require('../../config');

var all_fields = ['id', 'agency', 'agencyName', 'author', 'category',
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



/**
 * Respond with a form to create a Data Subscriber.
 */
module.exports.getDataAnalysis = function(req, res)
{
    Agency.findAllAgencies(function (err, listOfAgencies) {
        if (err) throw err;
        res.render('admin-data-analysis', {agencies: listOfAgencies});
    });

};

module.exports.downloadCsv = function(req, res)
{

    var agenciesToFilterBy = req.query['agencies'];
    const limit = config.const.BOLOS_PER_QUERY;
    const isArchived = req.query.archived || false;
    console.log("I Made it To the Method");
    console.log("THis is the first agency:" + agenciesToFilterBy[0]);
    Agency.findAgencyByName(agenciesToFilterBy[0], function(err, agency)
    {
        console.log("The entire details of the agency are: " + agency);
        BOLO.findBolosByAgencyID( agency.id, true, isArchived, limit, 'createdOn', function (err, listOfBOLOS)
        {
            console.log("Finding All BOLOS");
            if (err) throw err;
            var csv = json2csv({ data: listOfBOLOS, fields: all_fields});
            console.log("Downloading CSV");
            fs.writeFile('./src/web/public/csv/bolos.csv', csv, function(err) {
                if (err) {console.log(err)}
                res.send("/csv/bolos.csv");
            })
        });
    });


//    boloService.getBolosFromAgencies(agenciesToFilterBy, 2000000, 0).then(function(results)
//   {
//        return json2csv({ data: results.bolos, fields: all_fields})
//    }).then(function(file) {
//        fs.writeFile('./src/web/public/csv/bolos.csv', file, function(err) {
//            if (err) {console.log(err)}
//            res.send("/csv/bolos.csv");
//        })
//    }).catch(function(err) {
//        console.log(err);
//    })
};
