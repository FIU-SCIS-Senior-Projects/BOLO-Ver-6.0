/**
 * This class sets the routes for the authentication pages
 */

var router = require('express').Router();
var control = require('../controllers/auth');

router.get('/login', control.getLogIn);
router.post('/login', control.attemptLogIn);
router.get('/logout', control.LogOut);

module.exports = router;