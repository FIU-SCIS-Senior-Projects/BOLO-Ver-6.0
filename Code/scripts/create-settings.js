/**
 * Created by Ed on 1/21/2016.
 */
/* jshint node:true */
'use strict';
var path        = require('path');
var Promise     = require('promise');

require('dotenv').config({ 'path': path.resolve( __dirname, '../.env' ) });

var core            = path.resolve( __dirname, '../src/core' );
var SystemSettingsService     = require( path.join( core, 'service/systemSettings-service' ) );
var systemSettingsRepository  = require( path.join( core, 'adapters/persistence/cloudant-systemSettings-repository' ) );

/** This is the main module we will be using **/
var systemSettingsService = new SystemSettingsService( new systemSettingsRepository() );

/** These are the required fields per core/domain/user.js **/
var systemSettingsDTO = systemSettingsService.formatDTO({
    "name": "systemSettings",
    "loginAttempts": "3",
    "sessionMinutes": "10"
});


console.log(
    "Attempting to create systemSettings with the following document properties: \n",
    JSON.stringify( systemSettingsDTO, null, 4 )
);

/** Try to register the user **/
systemSettingsService.createsystemSettings( systemSettingsDTO ).then( function (response,error ) {
    if(response)
    {
        console.log("Created settings -- Cloudant Response is: \n", response);
    }

    else
       throw error;


}).catch( function ( error ) {
    console.error( "An error occurred -- Cloudant Response Error: \n", error );
});
