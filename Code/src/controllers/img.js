var Agency = require('../models/agency');
var Bolo = require('../models/bolo');

exports.getAgencyLogo = function (req, res, next) {
    Agency.findAgencyByID(req.params.id, function (err, agency) {
        if (err) next(err);
        else if (!agency) res.status(404).send("Image not found");
        else {
            res.set("Content-Type", agency.logo.contentType);
            res.send(agency.logo.data);
        }
    });
};

exports.getAgencyShield = function (req, res, next) {
    Agency.findAgencyByID(req.params.id, function (err, agency) {
        if (err) next(err);
        else if (!agency) res.status(404).send("Image not found");
        else {
            res.set("Content-Type", agency.shield.contentType);
            res.send(agency.shield.data);
        }
    });
};

exports.getAgencyWatermark = function (req, res, next) {
    Agency.findAgencyByID(req.params.id, function (err, agency) {
        if (err) next(err);
        else if (!agency) res.status(404).send("Image not found");
        else {
            res.set("Content-Type", agency.watermark.contentType);
            res.send(agency.watermark.data);
        }
    });
};

exports.getBoloFeatured = function (req, res, next) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) next(err);
        else if (!bolo) res.status(404).send("Image not found");
        else {
            res.set("Content-Type", bolo.featured.contentType);
            res.send(bolo.featured.data);
        }
    });
};
exports.getBoloOther1 = function (req, res, next) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) next(err);
        else if (!bolo) res.status(404).send("Image not found");
        else {
            res.set("Content-Type", bolo.other1.contentType);
            res.send(bolo.other1.data);
        }
    });
};
exports.getBoloOther2 = function (req, res, next) {
    Bolo.findBoloByID(req.params.id, function (err, bolo) {
        if (err) next(err);
        else if (!bolo) res.status(404).send("Image not found");
        else {
            res.set("Content-Type", bolo.other2.contentType);
            res.send(bolo.other2.data);
        }
    });
};

