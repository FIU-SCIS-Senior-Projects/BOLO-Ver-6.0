var Agency = require('../models/agency');
var Bolo = require('../models/bolo');

exports.getAgencyLogo = function (req, res) {
    Agency.findAgencyByID(req.params.id, function (err, agency) {
        if (err) throw err;
        res.set("Content-Type", agency.logo.contentType);
        res.send(agency.logo.data);
    });
};

exports.getAgencyShield = function (req, res) {
    Agency.findAgencyByID(req.params.id, function (err, agency) {
        if (err) throw err;
        res.set("Content-Type", agency.shield.contentType);
        res.send(agency.shield.data);
    });
};

exports.getAgencyWatermark = function (req, res) {
    Agency.findAgencyByID(req.params.id, function (err, agency) {
        if (err) throw err;
        res.set("Content-Type", agency.watermark.contentType);
        res.send(agency.watermark.data);
    });
};

exports.getBoloFeatured = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) throw err;
        res.set("Content-Type", bolo.featured.contentType);
        res.send(bolo.featured.data);
    });
};
exports.getBoloOther1 = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) throw err;
        res.set("Content-Type", bolo.other1.contentType);
        res.send(bolo.other1.data);
    });
};
exports.getBoloOther2 = function (req, res) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) throw err;
        res.set("Content-Type", bolo.other2.contentType);
        res.send(bolo.other2.data);
    });
};