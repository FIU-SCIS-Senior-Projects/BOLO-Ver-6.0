/**
 * This class sets the routes for the aboutUs pages
 */

var router = require('express').Router();
var control = require('../controllers/aboutUs');

router.get('/', control.getAboutUs);

module.exports = router;
