/* jshint node: true */
'use strict';

var _                   = require('lodash');
var multiparty          = require('multiparty');
var Promise             = require('promise');

var config              = require('../../config');
var dataSubscriberRepository    = new config.dataSubscriberRepository();
var dataSubscriberService       = new config.dataSubscriberService( dataSubscriberRepository );

var formUtil            = require('../../lib/form-util');

var GFERR               = config.const.GFERR;
var GFMSG               = config.const.GFMSG;

var parseFormData       = formUtil.parseFormData;
var cleanTemporaryFiles = formUtil.cleanTempFiles;

function isImage ( fileDTO ) {
    return /image/.test( fileDTO.content_type );
}




/**
 * Validating whther or not the fields in the form have been left empty.
 * If one of the fields has been left empty, validateFields will return false.
 */
function validateFields (fields){
  var fieldValidator = true;

  if(fields.name == ""){
    fieldValidator = false;
  }
  if(fields.emailAddress == ""){
    fieldValidator = false;
  }

  return fieldValidator;
}


/**
 * Respond with a list
 */
module.exports.getList = function ( req, res ) {
    dataSubscriberService.getDataSubscribers('by_dataSubscriber')
    .then(function (dataSubscribers) {
        console.log(dataSubscribers);
        res.render('dataSubscriber-list-admin', {
            dataSubscribers: dataSubscribers
        });
    });
};

module.exports.activationDataSubscriber = function(req, res){

    var dataSubscriber = req.body.dataSubscriber;

        if (dataSubscriber.data.isActive === 'true') {
            dataSubscriber.data.isActive = true;

        }
        else
            dataSubscriber.data.isActive = false;
        dataSubscriber.data.isActive = !(dataSubscriber.data.isActive);
        console.log(dataSubscriber.data.isActive);
        dataSubscriberService.updateDataSubscriber(dataSubscriber, []).then(function (pData) {
            if (dataSubscriber.data.isActive === true) {
                req.flash(GFMSG, 'Subscriber Activation successful.');
            }
            else {
                req.flash(GFMSG, 'Subscriber Deactivation successful.');
            }
            res.send({redirect: '/admin/dataSubscriber'});

        }).catch(function (error) {
            req.flash(GFERR, "Error in subscriber deactivation:" + error);
            res.send({redirect: '/admin/dataSubscriber'});
        })

};
/**
 * Respond with a form to create a Data Subscriber.
 */
module.exports.getCreateForm = function (req, res) {
    res.render('subscriber-create-form');//pending
};


/**
 * Process a form to create a data subscriber.
 */
module.exports.postCreateForm = function ( req, res, next ) {
    parseFormData( req ).then( function ( formDTO ) {
      console.log('got dto');
        var dataSubscriberDTO = dataSubscriberService.formatDTO( formDTO.fields );
        var formFields = validateFields(formDTO.fields);

        if(formFields == false){
          req.flash(GFERR, 'No field can be left empty. This information is required');
          res.redirect('back');
          throw new FormError();
        }

        var result = dataSubscriberService.createDataSubscriber( dataSubscriberDTO);
        return Promise.all( [ result, formDTO ] );
    })
    .then(function (pData,error) {
        if(error)
        throw error;

        else {
            if (pData[1].files.length) cleanTemporaryFiles(pData[1].files);
            req.flash(GFMSG, 'Subscriber registration successful.');
            res.redirect('/admin/dataSubscriber');
        }
    }).catch( function ( error ) {
        req.flash(GFERR, 'Subscriber Creation unsuccessful ' + error);
        res.redirect('back');
        throw new FormError();
    });
};


/**
 * Respond with a form to edit data subscriber details
 */
module.exports.getEditForm = function ( req, res, next ) {
    dataSubscriberService.getDataSubscriber( req.params.id ).then( function ( dataSubscriber ) {
        res.render( 'subscriber-edit-form', { dataSubscriber: dataSubscriber } );//pending
    }).catch( function ( error ) {
        next( error );
    });
};


/**
 * Process a form to edit/update data subscriber details.
 */
module.exports.postEditForm = function ( req, res, next ) {
    parseFormData( req ).then( function ( formDTO ) {
        var dataSubscriberDTO = dataSubscriberService.formatDTO( formDTO.fields );
        var formFields = validateFields(formDTO.fields);

        if(formFields == false){
          req.flash(GFERR, 'No field can be left empty. This information is required');
          res.redirect('back');
          throw new FormError();
        }

        var result = dataSubscriberService.updateDataSubscriber( dataSubscriberDTO);
        return Promise.all([ result, formDTO ]);
    }).then( function ( pData ) {
        if ( pData[1].files.length ) cleanTemporaryFiles( pData[1].files );
        req.flash( GFMSG, 'Subscriber details update successful.' );
        res.redirect( '/admin/dataSubscriber' );
    }).catch( function ( error ) {
        req.flash(GFERR, 'Subscriber update unsuccessful ' + error);
        res.redirect('back');
        next( error );
    });
};
