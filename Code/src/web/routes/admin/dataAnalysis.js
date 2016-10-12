/**
 * This class sets the routes for the admin/dataAnalysis pages
 */

var router = require('express').Router();
var control = require('../../controllers/admin/dataAnalysis.js');

router.get('/admin/dataAnalysis', control.getDataAnalysis);
router.get('/admin/dataAnalysis/bolotoCsv', control.downloadCsv);

module.exports = router;