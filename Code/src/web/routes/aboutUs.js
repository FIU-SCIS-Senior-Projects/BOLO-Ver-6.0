/**
 * This class sets the routes for the aboutUs pages
 */

var router = require('express').Router();
var control = require('../controllers/aboutUs');

router.get('/MDCACP', control.getAboutMDCACP);
router.get('/FIU', control.getAboutUsFIU);
router.get('/IBM', control.getAboutUsIBM);
router.get('/', control.getAboutUs);

module.exports = router;
