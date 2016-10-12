/**
 * This class sets the routes for the account pages
 */

var router = require('express').Router();
var control = require('../controllers/account');

router.get('/', control.getAccountDetails);
router.get('/password', control.getChangePassword);
router.post('/password', control.postChangePassword);
router.get('/notifications', control.getUserNotifications);
router.post('/notifications/unsubscribe', control.postUnsubscribeNotifications);
router.get('/notifications/unsubscribe/:agencyId', control.getUnsubscribeNotificationsFromEmail);
router.get('/notifications/subscribe', control.getAvailableAgencyNotifications);
router.post('/notifications/subscribe', control.postSubscribeNotifications);

module.exports = router;
