/* jshint node: true, mocha: true, expr: true */
'use strict';

var _ = require('lodash');
var Entity = require('./entity');

var schema = {
    author: {
        required: true,
        type: 'string'
    },
    agency: {
        required: true,
        type: 'string'
    },
    createdOn: {
        required: true,
        type: 'string'
    },
    updatedOn: {
        required: true,
        type: 'string'
    }
};

var required = Object.keys(schema).filter(function (key) {
    return schema[key].required;
});


/** @module core/domain */
module.exports = Bolo;


/**
 * Create a new Bolo object.
 *
 * @class
 * @classdesc Entity object representing a BOLO.
 *
 * @param {Object} data - Object containing Bolo Data properties
 */
function Bolo( data ) {
    var defaults = {
        id              : null,
        createdOn       : null,
        lastUpdatedOn   : null,
        lastUpdatedBy   : {},
        agency          : null,
        agencyName      : '',
        author          : '',
        //For generalbolo
        category        : '',
        firstName       : '',
        lastName        : '',
        dob             : '',
        dlNumber        : '',
        race            : '',
        sex             : '',
        height          : '',
        weight          : '',
        hairColor       : '',
        tattoos         : '',
        address         : '',
        zipCode         : '',
        additional      : '',
        summary         : '',
        attachments     : {},
        video_url       : '',
        //Other
        isActive        : true,
        status          : '',
        record          : '',
        images          : {},
        //For theft-auto
        vehicleMake         : '',
        vehicleModel        : '',
        vehicleColor        : '',
        vehicleYear         : '',
        vehicleStyle        : '',
        vehicleLicenseState : '',
        vehicleLicensePlate : '',
        vehicleIdNumber     : '',
        //For theft-boat
         //Vessel
        boatYear                : '',
        boatManufacturer        : '',
        boatModel               : '',
        boatType                : '',
        boatLength              : '',
        boatColor               : '',
        boatHullIdNumber        : '',
        boatRegistrationNumberSt: '',
        boatRegistrationNumberNu: '',
          //Propulsion
        propulsion              : '',
        propulsionType          : '',
        propulsionMake          : '',
          //Trailer
        trailer                 : '',
        trailerManufacturer     : '',
        trailerVIN              : '',
        trailerTagLicenseState  : '',
        trailerTagLicenseNumber  : '',
        // For Data Analysis
        timeReported            : '',
        dateReported            : '',
        timeRecovered           : '',
        dateRecovered           : '',
        addressRecovered        : '',
        zipCodeRecovered        : '',
        agencyRecovered         : '',
        //others
        boloToken       : null,
        confirmed       : false,
        originalBolo    :null,
        pendingUpdate   :false,
        pendingUpdateBy :null,
        imagesToDelete  :{},
        imagesToAdd     :{}
    };

    this.data = _.defaults( {}, data, defaults );
    Entity.setDataAccessors( this.data, this );
}

/**
 * Checks if the bolo is valid
 *
 * @returns {bool} true if passes validation, false otherwise
 *
 * @todo Naive validation implementation, refactor using a robust validation
 * library like Joi. It might be useful to implement validation with a Bolo
 * Template object
 */
Bolo.prototype.isValid = function () {
    var data = this.data;

    var result = required.filter( function ( key ) {
        return ( data[key] && typeof data[key] === schema[key].type );
    });

    return ( result.length === required.length );
};

/**
 * Check if the supplied bolo object has the same data attribute values as the
 * source bolo object's own enumerable data attribute values.
 *
 * @param {Bolo} - the other bolo object to compare to
 */
Bolo.prototype.same = function ( other ) {
    return 0 === this.diff( other ).length;
};

/**
 * Returns an array of keys differing from the source user object.
 *
 * @param {Bolo} - the other bolo to compare to
 */
Bolo.prototype.diff = function ( other ) {
    var source = this;

    return Object.getOwnPropertyNames( source.data )
        .filter( function ( key ) {
            return ! _.isEqual( other.data[key], source.data[key] );
        });
};
