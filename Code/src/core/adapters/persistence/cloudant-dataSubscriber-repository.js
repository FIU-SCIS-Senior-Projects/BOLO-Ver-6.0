/* jshint node: true */
'use strict';

var _ = require('lodash');
var fs = require('fs');
var Promise = require('promise');
var uuid = require('node-uuid');
var path = require('path');

var db = require('../../lib/cloudant-promise').db.use('bolo');
var DataSubscriber = require('../../domain/dataSubscriber.js');

var DOCTYPE = 'dataSubscriber';


module.exports = CloudantDataSubscriberRepository;


/**
 * Transform the data subscriber doc to a suitable format for the data subscriber entity object.
 *
 * @param {Object} - the doc to transform to an agency
 * @returns {Data Subscriber} - a data subscriber in the generic data subscriber entity format
 * @private
 */
function dataSubscriberFromCloudant(dataSubscriber_doc) {
    var dataSubscriber = new DataSubscriber(dataSubscriber_doc);
    dataSubscriber.data.id = dataSubscriber.data._id;
    delete dataSubscriber.data._id;
    delete dataSubscriber.data._rev;
    delete dataSubscriber.data.Type;


    return dataSubscriber;
}

/**
 * Transform the data subscriber to a format suitable for cloudant.
 *
 * @param {datasubscriber} - the data subscriber to transform
 * @returns {Object} - an object suitable for Cloudant
 * @private
 */
function dataSubscriberToCloudant(dataSubscriber) {
    var doc = _.assign({}, dataSubscriber.data);

    doc.Type = DOCTYPE;

    if ( doc.id ) {
        doc._id = doc.id;
        delete doc.id;
    }


    return doc;
}


function createDataSubscriberID() {
    var id = uuid.v4().replace(/-/g, '');
    return id;
}

/**
 * Transform attachment DTOs to the Cloudant attachment DTO fomat
 *
 * @param {Object} - an attachment DTO
 * @returns {Promise|Object} - Promise resolving to the transformed DTO
 * @private
 */



/**
 * Create a new CloudantDataSubscriberRepository object.
 *
 */
function CloudantDataSubscriberRepository() {
    // constructor stub
}

/**
 * Insert a data subscriber document in the Cloudant Database
 *
 * @param {Object} - data subscriber to store
 * @param {Object} - attachments of the data subscriber
 */
CloudantDataSubscriberRepository.prototype.insert = function (dataSubscriber) {
    var context = this;
    var newdoc = dataSubscriberToCloudant(dataSubscriber);
    newdoc._id = createDataSubscriberID();
    return  db.insert(newdoc, newdoc._id)
        .then(function (response) {
            if (!response.ok){console.log(response.ok); throw new Error(response.reason);}
            return context.getDataSubscriber(response.id);
        })
        .catch(function (error) {
          console.log(error.reason);
            throw new Error(
                'Unable to create new document: ' + error.reason
                );
        });
};

/**
 * Updates a data subscriber
 *
 * @param {Agency} - the data subscriber to update
 * @param {Attachments} - the attachments belonging to that data subscriber
 */
CloudantDataSubscriberRepository.prototype.update = function ( dataSubscriber ) {
    var dataSubscriberToUpdate = dataSubscriberToCloudant( dataSubscriber );


    var currentDataSubscriberRev = db.get( dataSubscriber.data.id );

    return Promise.all([ currentDataSubscriberRev ])
        .then( function ( data ) {
            var doc = data[0]

            dataSubscriberToUpdate._rev = doc._rev;



            return db.insert( dataSubscriberToUpdate );

        })
        .then( function ( response ) {
            if ( !response.ok ) throw new Error( 'Unable to update Subscriber' );
            return Promise.resolve( dataSubscriberFromCloudant( dataSubscriberToUpdate ) );
        })
        .catch( function ( error ) {
            return Promise.reject( error );
        });
};

/**
 * Retrieve an data subscriber document from the Cloudant Database
 *
 * @param {int} - data subscriber id
 */


CloudantDataSubscriberRepository.prototype.getDataSubscriber = function (id) {
    return db.get(id)
        .then(function (dataSubscriber_doc) {
            return dataSubscriberFromCloudant(dataSubscriber_doc);
        })
        .catch( function ( error ) {
            return Promise.reject( new Error("Subscriber does not exist.") );
        });
};

/**
 * Retrieve a collection of data subscribers from the cloudant database
 */
CloudantDataSubscriberRepository.prototype.getDataSubscribers = function ( view,ids ) {
    var opts = { 'include_docs': true };

    if ( _.isArray( ids ) ) {
        view = 'all_active';
        opts.keys = ids;
    }
    console.log('in get data Subscribers repository');
    return db.view( 'dataSubscriber', view, opts ).then( function ( result ) {
        var dataSubscribers = result.rows.map( function ( row ) {
            return dataSubscriberFromCloudant( row.doc );
        });
        return dataSubscribers;
    });
};


CloudantDataSubscriberRepository.prototype.searchDataSubscribers = function (query_string) {

    var query_obj =
    {
        q : query_string,
        include_docs: true
    };

    return db.search( 'DataSubscriber', 'DataSubscribers', query_obj).then( function (result ) {

            console.log('Showing %d out of a total %d data subscribers found', result.rows.length, result.total_rows);
            for (var i = 0; i < result.rows.length; i++) {
                console.log('Document id: %s', result.rows[i].id);
            }
        var dataSubscribers = _.map( result.rows, function ( row ) {

            return dataSubscriberFromCloudant( row.doc );
        });
        return { 'dataSubscribers': dataSubscribers, total: result.total_rows };
        });
};


CloudantDataSubscriberRepository.prototype.findDataSubscriberById = function (id) {

   var selector = {selector:{dataSubscriber_id:id}};
   var result = 0;

   return db.find(selector).then( function (id_result ) {

       console.log('Found %d documents with subscriber id: ' + id, id_result.docs.length);
       for (var i = 0; i < id_result.docs.length; i++) {
           console.log('  Doc id: %s', id_result.docs[i]._id);
       }
       return id_result.docs.length;
   });

};

CloudantDataSubscriberRepository.prototype.delete = function ( id ) {
    // **UNDOCUMENTED BEHAVIOR**
    // cloudant/nano library destroys the database if a null/undefined argument
    // is passed into the `docname` argument for `db.destroy( docname,
    // callback)`. It seems that passing null to the object provided by
    // `db.use( dbname )` creates the equivalent database API requests, i.e.
    // create/read/delete database.
    if ( !id ) throw new Error( 'id cannot be null or undefined' );

    return db.get( id ).then( function ( doc ) {
        return db.destroy( doc._id, doc._rev );
    })
    .catch( function ( error ) {
        return new Error(
            'Failed to delete Data Subscriber: ' + error.error + ' / ' + error.reason
        );
    });
};
