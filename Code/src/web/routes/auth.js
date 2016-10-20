/**
 * This class sets the routes for the authentication / conformation pages
 */

var router = require('express').Router();
var control = require('../controllers/auth');
var boloControl = require('../controllers/bolo');

router.get('/login', control.getLogIn);
router.post('/login', control.attemptLogIn);
router.get('/logout', control.LogOut);
router.get('/forgotPassword', control.renderForgotPasswordPage);
router.get('/bolo/confirm/:token', boloControl.loggedOutConfirmBolo);

module.exports = router;