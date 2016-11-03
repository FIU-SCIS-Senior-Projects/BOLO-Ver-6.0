/**
 * This class sets the routes for the reset password pages
 */

var router = require('express').Router();
var control = require('../controllers/resetPassword');

router.get('/', control.checkPassword);
router.post('/newPass', control.newPassword);
router.get('/resetPass', control.resetPassword);


module.exports = router;
