/* jshint node: true */
'use strict';

var _ = require('lodash');
var Entity = require('./entity');


/** @module core/domain */
module.exports = dataSubscriber;


var schema = {
    'name': {
        'required'  : true,
        'type'      : 'string'
    },
    'email': {
        'required'  : true,
        'type'      : 'string'
    },
    'isActive': {
        'required'  : true,
        'type'      : 'boolean'
    },
    'dataSubscriber_id':{
        'required'  : true,
        'type'      : 'string'
    }

};

var required = Object.keys( schema ).filter( function ( key ) {
    return schema[key].required;
});

/**
 * Create a new data subscriber object.
 *
 * @class
 * @classdesc Entity object representing a data subscriber.
 *
 * @param {Object} data - Object containing data subscriber Data properties
 */
function dataSubscriber(data) {
    var dataSubscriberTemplate = {
        'id'            : '',
        'name'          : '',
        'email'       : '',
        'dataSubscriber_id'     : '',
        'isActive'      : true,
    };

    this.data = _.extend({}, dataSubscriberTemplate, data);
    Entity.setDataAccessors( this.data, this );
}

dataSubscriber.prototype.same = function ( other ) {
    return 0 === this.diff( other ).length;
};

/**
 * Checks if the dataSubscriber is valid
 *
 * @returns {bool} true if passes validation, false otherwise
 */
 dataSubscriber.prototype.isValid = function () {
    var data = this.data;
    var namecheck = typeof data.name;
    var emailcheck = typeof data.email;
    var isactivecheck = typeof data.isActive;
    var idcheck = typeof data.dataSubscriber_id;

    return schema.name.type === namecheck &&
      schema.email.type === emailcheck &&
      schema.isActive.type === isactivecheck &&
      schema.dataSubscriber_id.type === idcheck;
 };

/**
 * Returns an array of keys differing from the source user object.
 *
 * @param {dataSubscriber} - the other dataSubscriber to compare to
 */
dataSubscriber.prototype.diff = function ( other ) {
    var source = this;
    return Object.getOwnPropertyNames( source.data )
        .filter( function ( key ) {
            return ! _.isEqual( other.data[key], source.data[key] );
        });
};
