/**
 * This class sets the routes for the admin/edit pages
 */

var router = require('express').Router();
var control = require('../../controllers/admin/edit');

router.get('/aboutUs', control.getAboutUsForm);
router.post('/aboutUs', control.saveAboutUs);
router.get('/login', control.getLoginPageForm);
router.post('/login', control.saveLoginPage);
router.get('/userGuide', control.getUserGuideForm);
router.post('/userGuide', control.saveUserGuide);

module.exports = router;