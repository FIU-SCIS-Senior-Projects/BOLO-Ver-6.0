/**
 * This class sets the routes for the admin/users pages
 */

var router = require('express').Router();
var control = require('../../controllers/admin/systemSetting.js');

router.get('/admin/systemSetting', control.getSystemSetting);
router.post('/admin/systemSetting', control.postSystemSetting);

module.exports = router;