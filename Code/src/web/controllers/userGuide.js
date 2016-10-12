var fs = require('fs');
var md = require("node-markdown").Markdown;

var PDFDocument = require('pdfkit');
var pdfService = require('../services/pdf-service');

/**
 * Displays the user guide on each individual teir.
 */
exports.getUserGuide = function (req, res) {
    fs.readFile('./public/UserGuide.md', function (err, data) {
        if (err) throw err;
        res.render('user-guide', {md: md, text: data.toString()});
    });
};

/**
 * Downloads the user's guide as a PDF
 */
exports.downloadUserGuide = function (req, res) {

    console.log('Downloading User Guide');
    var doc = new PDFDocument();
    pdfService.genUserGuide(req.user, doc);
    doc.end();
    res.contentType("application/pdf");
    doc.pipe(res);
};