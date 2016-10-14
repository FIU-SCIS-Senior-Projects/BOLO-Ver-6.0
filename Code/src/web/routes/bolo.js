/**
 * This class sets the routes for the bolo pages
 */

var router = require('express').Router();
var control = require('../controllers/bolo');

var multer = require('multer');
var upload = multer({dest: './uploads/'});
var boloImages = upload.fields([{name: 'featured', maxCount: 1},
    {name: 'other1', maxCount: 1}, {name: 'other2', maxCount: 1}]);

router.get('/', control.listBolos);
router.get('/create', control.getCreateBolo);
router.post('/create', boloImages, control.postCreateBolo);
router.get('/search', control.getBoloSearch);
router.get('/archive', control.listArchivedBolos);
router.post('/purge', control.purgeArchivedBolos);
router.get('/:id', control.getBoloDetails);
router.get('/pdf/:id', control.renderBoloAsPDF);
router.post('/archive/:id', control.archiveBolo);
router.post('/unarchive/:id', control.unArchiveBolo);
router.get('/confirm/:token', control.confirmBolo);
router.get('/edit/:id', control.getEditBolo);
router.post('/edit/:id', control.postEditBolo);
router.post('/delete/:id', control.deleteBolo);

module.exports = router;