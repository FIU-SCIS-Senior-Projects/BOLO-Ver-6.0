/**
 * This class sets the routes for the account pages
 */

var router = require('express').Router();
var control = require('../controllers/account');

router.get('/', control.getAccountDetails);

module.exports = router;
