/**
 * Created by Ed on 1/21/2016.
 */
/* jshint node:true */
'use strict';
var path        = require('path');
var Promise     = require('promise');

require('dotenv').config({ 'path': path.resolve( __dirname, '../.env' ) });

var core            = path.resolve( __dirname, '../src/core' );
var dataSubscriberService     = require( path.join( core, 'service/dataSubscriber-service' ) );
var dataSubscriberRepository  = require( path.join( core, 'adapters/persistence/cloudant-dataSubscriber-repository' ) );

/** This is the main module we will be using **/
var dataSubscriberService = new dataSubscriberService( new dataSubscriberRepository() );

/** These are the required fields per core/domain/user.js **/
var dataSubscriberDTO = dataSubscriberService.formatDTO({
    "name": "County",
    "dataSubscriber_id": 123,
    "email": "test@test.com",
    "isActive": true
});


console.log(
    "Attempting to create dataSubscriber with the following document properties: \n",
    JSON.stringify( dataSubscriberDTO, null, 4 )
);

/** Try to register the user **/
dataSubscriberService.createDataSubscriber( dataSubscriberDTO ).then( function (response,error ) {
    if(response)
    {
        console.log("Created data subscriber -- Cloudant Response is: \n", response);
    }

    else
       throw error;


}).catch( function ( error ) {
    console.error( "An error occurred -- Cloudant Response Error: \n", error );
});
