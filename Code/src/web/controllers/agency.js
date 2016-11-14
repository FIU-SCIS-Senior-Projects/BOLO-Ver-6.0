var Agency = require('../models/agency');

exports.renderAgencies = function (req, res) {
    Agency.findAllActiveAgencies(function (err, listOfAgencies) {
        if (err) throw err;
        res.render('agency', {agencies: listOfAgencies});
    })

};

exports.renderAgencyDetails = function (req, res) {
    res.render('agency');
};