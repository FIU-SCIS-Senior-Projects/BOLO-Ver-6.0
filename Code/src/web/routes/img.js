/**
 * This class sets the routes for the imgages for agencies
 */

var router = require('express').Router();
var control = require('../controllers/img');

router.get('/agency/logo/:id', control.getAgencyLogo);
router.get('/agency/shield/:id', control.getAgencyShield);
router.get('/agency/watermark/:id', control.getAgencyWatermark);
router.get('/bolo/featured/:id', control.getBoloFeatured);
router.get('/bolo/other1/:id', control.getBoloOther1);
router.get('/bolo/other2/:id', control.getBoloOther2);

module.exports = router;