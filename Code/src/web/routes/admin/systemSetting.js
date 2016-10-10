/* jshint node: true */
'use strict';

var _                   = require('lodash');
var multiparty          = require('multiparty');
var Promise             = require('promise');

var config              = require('../../config');
var formUtil            = require('../../lib/form-util');
var parseFormData       = formUtil.parseFormData;
var systemSettingsRepository    = new config.systemSettingsRepository();
var systemSettingsService       = new config.systemSettingsService( systemSettingsRepository );
var GFERR               = config.const.GFERR;
var GFMSG               = config.const.GFMSG;

/**
 * Respond with a form to create a Data Subscriber.
 *
 *@params req
 *@params res
 *@Author John Burke
 */

 function validateFields (fields){
   var fieldValidator = true;
   if(fields.loginAttempts == ""){
     fieldValidator = false;
   }
   if(fields.sessionMinutes == ""){
     fieldValidator = false;
   }

   return fieldValidator;
 }


module.exports.getSystemSetting = function (req, res, next) {
  config.setSystemSettings().then(function(){
  return systemSettingsService.getsystemSettings()
}).then(function(systemSettings){
    console.log(JSON.stringify(systemSettings.rows[0].doc));
      res.render('system-setting',{systemSettings: systemSettings.rows[0].doc});//pending
  }).catch( function ( error ) {
      next( error );
  });
};


module.exports.postSystemSetting = function (req, res) {
    parseFormData(req).then(function(formDTO){
      var systemSettingsDTO = systemSettingsService.formatDTO( formDTO.fields );
      var formFields = validateFields(formDTO.fields);
      if(formFields == false){
        req.flash(GFERR, 'No field can be left empty. This information is required');
        res.redirect('back');
        throw new FormError();
      }
      var result = systemSettingsService.updatesystemSettings( systemSettingsDTO);
      return Promise.all( [ result, formDTO ] );
  })
  .then(function (pData,error) {
      if(error)
      throw error;

      else {
          if (pData[1].files.length) cleanTemporaryFiles(pData[1].files);
          req.flash(GFMSG, 'Settings registration successful.');
          res.redirect('/admin/systemSetting');
      }     
  }).catch( function ( error ) {
    console.log(error);
      req.flash(GFERR, 'Settings Creation unsuccessful ' + error);
      res.redirect('back');
      throw new FormError();
  });
};
