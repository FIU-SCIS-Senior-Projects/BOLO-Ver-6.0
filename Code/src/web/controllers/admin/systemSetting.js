var multiparty = require('multiparty');
var Promise = require('promise');

var config = require('../../config');

/**
 * Respond with a form to create a Data Subscriber.
 *
 *@params req
 *@params res
 */

function validateFields(fields) {
    var fieldValidator = true;
    if (fields.loginAttempts == "") {
        fieldValidator = false;
    }
    if (fields.sessionMinutes == "") {
        fieldValidator = false;
    }

    return fieldValidator;
}


exports.getSystemSetting = function (req, res, next) {
    config.setSystemSettings().then(function () {
        return systemSettingsService.getsystemSettings()
    }).then(function (systemSettings) {
        console.log(JSON.stringify(systemSettings.rows[0].doc));
        res.render('system-setting', {systemSettings: systemSettings.rows[0].doc});//pending
    }).catch(function (error) {
        next(error);
    });
};


exports.postSystemSetting = function (req, res) {
    parseFormData(req).then(function (formDTO) {
            var systemSettingsDTO = systemSettingsService.formatDTO(formDTO.fields);
            var formFields = validateFields(formDTO.fields);
            if (formFields == false) {
                req.flash(GFERR, 'No field can be left empty. This information is required');
                res.redirect('back');
                throw new FormError();
            }
            var result = systemSettingsService.updatesystemSettings(systemSettingsDTO);
            return Promise.all([result, formDTO]);
        })
        .then(function (pData, error) {
            if (error)
                throw error;

            else {
                if (pData[1].files.length) cleanTemporaryFiles(pData[1].files);
                req.flash(GFMSG, 'Settings registration successful.');
                res.redirect('/admin/systemSetting');
            }
        }).catch(function (error) {
        console.log(error);
        req.flash(GFERR, 'Settings Creation unsuccessful ' + error);
        res.redirect('back');
        throw new FormError();
    });
};
