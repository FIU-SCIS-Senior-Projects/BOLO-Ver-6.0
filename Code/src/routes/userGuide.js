/**
 * This class sets the routes for the UserGuide pages
 */

var router = require('express').Router();
var control = require('../controllers/userGuide');

router.get('/', control.getUserGuide);
router.get('/pdf', control.downloadUserGuide);

module.exports = router;

