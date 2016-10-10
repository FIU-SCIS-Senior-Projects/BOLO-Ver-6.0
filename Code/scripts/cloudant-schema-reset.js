/* jshint node:true */
'use strict';

var path = require('path');
var Promise = require('promise');
var util = require('util');

require('dotenv').config({
  'path': path.resolve(__dirname, '../.env')
});

var cloudant = require('./cloudant-connection.js');

/*
Creating Indexes
*/
var bolo_indexer = function(doc) {

  index("default", doc._id);
  if (typeof(doc.boloToken) !== 'undefined') {
    index("boloToken", doc.boloToken);
  }
  if (typeof(doc.agency) !== 'undefined') {
    index("agency", doc.agency);
  }
  if (typeof(doc.agencyName) !== 'undefined') {
    index("agencyName", doc.agencyName);
  }
  if (typeof(doc.author) !== 'undefined') {
    index("author", doc.author);
  }
  if (typeof(doc.category) !== 'undefined') {
    index("category", doc.category);
  }

  //For General Bolo
  if (typeof(doc.firstName) !== 'undefined') {
    index("firstName", doc.firstName);
  }
  if (typeof(doc.lastName) !== 'undefined') {
    index("lastName", doc.lastName);
  }
  if (typeof(doc.dob) !== 'undefined') {
    index("dob", doc.dob);
  }
  if (typeof(doc.dlNumber) !== 'undefined') {
    index("dlNumber", doc.dlNumber);
  }
  if (typeof(doc.address) !== 'undefined') {
    index("address", doc.address);
  }
  if (typeof(doc.zipCode) !== 'undefined') {
    index("zipCode", doc.zipCode);
  }
  if (typeof(doc.race) !== 'undefined') {
    index("race", doc.race);
  }
  if (typeof(doc.sex) !== 'undefined') {
    index("sex", doc.sex);
  }
  if (typeof(doc.height) !== 'undefined') {
    index("height", doc.height);
  }
  if (typeof(doc.weight) !== 'undefined') {
    index("weight", doc.weight);
  }
  if (typeof(doc.hairColor) !== 'undefined') {
    index("hairColor", doc.hairColor);
  }
  if (typeof(doc.tattoos) !== 'undefined') {
    index("tattoos", doc.tattoos);
  }

  //For Theft - Auto
  if (typeof(doc.vehicleMake) !== 'undefined') {
    index("vehicleMake", doc.vehicleMake);
  }
  if (typeof(doc.vehicleModel) !== 'undefined') {
    index("vehicleModel", doc.vehicleModel);
  }
  if (typeof(doc.vehicleColor) !== 'undefined') {
    index("vehicleColor", doc.vehicleColor);
  }
  if (typeof(doc.vehicleYear) !== 'undefined') {
    index("vehicleYear", doc.vehicleYear);
  }
  if (typeof(doc.vehicleStyle) !== 'undefined') {
    index("vehicleStyle", doc.vehicleStyle);
  }
  if (typeof(doc.vehicleLicenseState) !== 'undefined') {
    index("vehicleLicenseState", doc.vehicleLicenseState);
  }
  if (typeof(doc.vehicleLicensePlate) !== 'undefined') {
    index("vehicleLicensePlate", doc.vehicleLicensePlate);
  }
  if (typeof(doc.vehicleIdNumber) !== 'undefined') {
    index("vehicleIdNumber", doc.vehicleIdNumber);
  }

  //For Theft - Boat
  //Vessel
  if (typeof(doc.boatYear) !== 'undefined') {
    index("boatYear", doc.boatYear);
  }
  if (typeof(doc.boatManufacturer) !== 'undefined') {
    index("boatManufacturer", doc.boatManufacturer);
  }
  if (typeof(doc.boatModel) !== 'undefined') {
    index("boatModel", doc.boatModel);
  }
  if (typeof(doc.boatType) !== 'undefined') {
    index("boatType", doc.boatType);
  }
  if (typeof(doc.boatLength) !== 'undefined') {
    index("boatLength", doc.boatLength);
  }
  if (typeof(doc.boatColor) !== 'undefined') {
    index("boatColor", doc.boatColor);
  }
  if (typeof(doc.boatHullIdNumber) !== 'undefined') {
    index("boatHullIdNumber", doc.boatHullIdNumber);
  }
  if (typeof(doc.boatRegistrationNumberSt) !== 'undefined') {
    index("boatRegistrationNumberSt", doc.boatRegistrationNumberSt);
  }
  if (typeof(doc.boatRegistrationNumberNu) !== 'undefined') {
    index("boatRegistrationNumberNu", doc.boatRegistrationNumberNu);
  }

  //Propulsion
  if (typeof(doc.propulsion) !== 'undefined') {
    index("propulsion", doc.propulsion);
  }
  if (typeof(doc.propulsionType) !== 'undefined') {
    index("propulsionType", doc.propulsionType);
  }
  if (typeof(doc.propulsionMake) !== 'undefined') {
    index("propulsionMake", doc.propulsionMake);
  }

  //Trailer
  if (typeof(doc.trailer) !== 'undefined') {
    index("trailer", doc.trailer);
  }
  if (typeof(doc.trailerManufacturer) !== 'undefined') {
    index("trailerManufacturer", doc.trailerManufacturer);
  }
  if (typeof(doc.trailerVIN) !== 'undefined') {
    index("trailerVIN", doc.trailerVIN);
  }
  if (typeof(doc.trailerTagLicenseState) !== 'undefined') {
    index("trailerTagLicenseState", doc.trailerTagLicenseState);
  }
  if (typeof(doc.trailerTagLicenseNumber) !== 'undefined') {
    index("trailerTagLicenseNumber", doc.trailerTagLicenseNumber);
  }

  //For Data Analysis
  if (typeof(doc.timeReported) !== 'undefined') {
    index("timeReported", doc.timeReported);
  }
  if (typeof(doc.dateReported) !== 'undefined') {
    index("dateReported", doc.dateReported);
  }
  if (typeof(doc.timeRecovered) !== 'undefined') {
    index("timeRecovered", doc.timeRecovered);
  }
  if (typeof(doc.dateRecovered) !== 'undefined') {
    index("dateRecovered", doc.dateRecovered);
  }
  if (typeof(doc.addressRecovered) !== 'undefined') {
    index("addressRecovered", doc.addressRecovered);
  }
  if (typeof(doc.zipCodeRecovered) !== 'undefined') {
    index("zipCodeRecovered", doc.zipCodeRecovered);
  }
  if (typeof(doc.agencyRecovered) !== 'undefined') {
    index("agencyRecovered", doc.agencyRecovered);
  }

  //Others
  if (typeof(doc.additional) !== 'undefined') {
    index("additional", doc.additional);
  }
  if (typeof(doc.summary) !== 'undefined') {
    index("summary", doc.summary);
  }
  if (typeof(doc.Type) !== 'undefined') {
    index("Type", doc.Type);
  }
  if (typeof(doc.record) !== 'undefined') {
    index("record", doc.record);
  }
  if (typeof(doc.isActive) !== 'undefined') {
    index("isActive", doc.isActive);
  }
};


var agency_indexer = function(doc) {

  index("default", doc._id);
  if (typeof(doc.name) !== 'undefined') {
    index("name", doc.name);
  }
  if (typeof(doc.address) !== 'undefined') {
    index("address", doc.address);
  }
  if (typeof(doc.city) !== 'undefined') {
    index("city", doc.city);
  }
  if (typeof(doc.state) !== 'undefined') {
    index("state", doc.state);
  }
  if (typeof(doc.zip) !== 'undefined') {
    index("zip", doc.zip);
  }
  if (typeof(doc.phone) !== 'undefined') {
    index("phone", doc.phone);
  }
  if (typeof(doc.isActive) !== 'undefined') {
    index("isActive", doc.isActive);
  }
  if (typeof(doc.Type) !== 'undefined') {
    index("Type", doc.Type);
  }
};

var user_indexer = function(doc) {

  index("default", doc._id);
  if (typeof(doc.username) !== 'undefined') {
    index("username", doc.username);
  }
  if (typeof(doc.email) !== 'undefined') {
    index("email", doc.email);
  }
  if (typeof(doc.fname) !== 'undefined') {
    index("fname", doc.fname);
  }
  if (typeof(doc.lname) !== 'undefined') {
    index("lname", doc.lname);
  }
  if (typeof(doc.tier) !== 'undefined') {
    index("tier", doc.tier);
  }
  if (typeof(doc.agency) !== 'undefined') {
    index("agency", doc.agency);
  }
  if (typeof(doc.agencyName) !== 'undefined') {
    index("agencyName", doc.agencyName);
  }
  if (typeof(doc.badge) !== 'undefined') {
    index("badge", doc.badge);
  }
  if (typeof(doc.sectunit) !== 'undefined') {
    index("sectunit", doc.sectunit);
  }
  if (typeof(doc.ranktitle) !== 'undefined') {
    index("ranktitle", doc.ranktitle);
  }
  if (typeof(doc.Type) !== 'undefined') {
    index("Type", doc.Type);
  }
};
var dataSubscriber_indexer = function (doc) {

    index("default", doc._id);
    if (typeof(doc.name) !== 'undefined') {
        index("name", doc.name );
    }
    if (typeof(doc.email) !== 'undefined') {
        index("email", doc.email );
    }
    if (typeof(doc.isActive) !== 'undefined') {
        index("isActive", doc.isActive );
    }
    if (typeof(doc.Type) !== 'undefined') {
        index("Type", doc.Type);
    }
};

var systemSettings_indexer = function (doc) {

    index("default", doc._id);
    if (typeof(doc.name) !== 'undefined') {
        index("name", doc.name );
    }
    if (typeof(doc.loginAttempts) !== 'undefined') {
        index("loginAttempts", doc.loginAttempts );
    }
    if (typeof(doc.sessionMinutes) !== 'undefined') {
        index("sessionMinutes", doc.sessionMinutes );
    }
    if (typeof(doc.Type) !== 'undefined') {
        index("Type", doc.Type);
    }
};

var BOLO_DB = 'bolo';

var BOLO_DESIGN_DOC = {
  "views": {
    "by_author": {
      "map": "function ( doc ) { if ( 'bolo' === doc.Type && doc.confirmed === true ) emit( doc.authorUName, null ); }"
    },
    "by_agency":{
      "map": "function(doc) {if ('bolo' === doc.Type && doc.confirmed === true) emit(doc.agencyName, null);}"
    },
    "by_token": {
      "map": "function ( doc ) { if ( 'bolo' === doc.Type ) emit( doc.boloToken, null ); }"
    },
    "all_active": {
      "map": "function (doc) { if ( 'bolo' === doc.Type && true === doc.isActive && doc.confirmed === true ) {emit( doc.lastUpdatedOn,1);} }"
    },
    "all_archive": {
      "map": "function (doc) { if ( 'bolo' === doc.Type && false === doc.isActive ){ emit( doc.lastUpdatedOn,1 ); }}"
    },
    "all": {
      "map": "function (doc) { if ( 'bolo' === doc.Type && doc.confirmed === true) {emit( doc.createdOn, 1 ); }}"
    },
    "revs": {
      "map": "function (doc) { if ( 'bolo' === doc.Type ) {emit( null, doc._rev ); }}"
    }
  },
  indexes: {
    bolos: {
      analyzer: {
        name: 'standard'
      },
      index: bolo_indexer
    }
  }
};

var USERS_DESIGN_DOC = {
  "views": {
    "by_username": {
      "map": "function ( doc ) { if ( 'user' === doc.Type ) emit( doc.username, null ); }"
    },
    "by_lname": {
      "map": "function ( doc ) { if ( 'user' === doc.Type ) emit( doc.lname, null ); }"
    },
    "by_agency": {
      "map": "function ( doc ) { if ( 'user' === doc.Type ) emit( doc.agency, null ); }"
    },
    "by_tier": {
      "map": "function ( doc ) { if ( 'user' === doc.Type ) emit( doc.tier, null ); }"
    },
    "all": {
      "map": "function ( doc ) { if ( 'user' === doc.Type ) emit( doc._id, 1 ); }"
    },
    "revs": {
      "map": "function (doc) { if ( 'user' === doc.Type ) emit( null, doc._rev ); }"
    },
    "notifications": {
      "map": "function (doc) { if ( 'user' === doc.Type ) { for ( var i = 0; i < doc.notifications.length; i++ ) { emit( doc.notifications[i], doc.email ); } } }"
    },
    "by_email": {
      "map": "function ( doc ) { if ( 'user' === doc.Type ) emit( doc.email.toLowerCase(), null ); }"
    },
    "by_token": {
      "map": "function ( doc ) { if ( 'user' === doc.Type ) emit( doc.resetPasswordToken, null ); }"
    },
    "by_token2": {
      "map": "function ( doc ) { if ( 'user' === doc.Type ) emit( doc.resetPasswordToken, null ); }"
    }
  },

  indexes: {
    users: {
      analyzer: {
        name: 'standard'
      },
      index: user_indexer
    }
  }
};

var AGENCY_DESIGN_DOC = {
  "views": {
    "by_agency": {
      "map": "function ( doc ) { if ( 'agency' === doc.Type ) emit( doc.name, null ); }"
    },
    "all_active": {
      "map": "function ( doc ) { if ( 'agency' === doc.Type && true === doc.isActive) emit( doc.name, null ); }"
    },
    "revs": {
      "map": "function ( doc ) { if ( 'agency' === doc.Type ) emit( null, doc._rev ); }"
    },
    "revs2": {
      "map": "function ( doc ) { if ( 'agency' === doc.Type ) emit( null, doc._rev ); }"
    }
  },

  indexes: {
    agencies: {
      analyzer: {
        name: 'standard'
      },
      index: agency_indexer
    }
  }
};

var DATASUBSCRIBER_DESIGN_DOC = {
    "views": {
      "all": {
          "map": "function ( doc ) { if ( 'dataSubscriber' === doc.Type ) emit( doc._id, 1 ); }"
      },
        "by_dataSubscriber": {
            "map": "function ( doc ) { if ( 'dataSubscriber' === doc.Type) emit( doc.name, null ); }"
        },
        "all_active": {
            "map": "function ( doc ) { if ( 'dataSubscriber' === doc.Type && true === doc.isActive) emit( doc.name, null ); }"
        },
        "revs": {
            "map": "function ( doc ) { if ( 'dataSubscriber' === doc.Type ) emit( null, doc._rev ); }"
        }
    },

    indexes: {
        dataSubscribers: {
            analyzer: {name: 'standard'},
            index: dataSubscriber_indexer
        }
    }
};

var SYSTEMSETTINGS_DESIGN_DOC = {
    "views": {
      "by_systemSettings": {
        "map": "function ( doc ) { if ( 'systemSettings' === doc.Type ) emit( doc.name, null ); }"
      },
      "all": {
          "map": "function ( doc ) { if ( 'systemSettings' === doc.Type ) emit( doc._id, 1 ); }"
      },
      "all_active": {
            "map": "function ( doc ) { if ( 'systemSettings' === doc.Type ) emit( doc.name, null ); }"
        },
      "revs": {
            "map": "function ( doc ) { if ( 'systemSettings' === doc.Type ) emit( null, doc._rev ); }"
        }
    },

    indexes: {
        systemSettings: {
            analyzer: {name: 'standard'},
            index: systemSettings_indexer
        }
    }
};



function updateDesign(dbname, designname, doc){
    return new Promise(function(resolve, reject) {
    var db = cloudant.db.use(dbname);
    var oldDoc=db.get('_design/'+designname, function(err, docFromCloudant){
    if(err)
      console.log(err);

    docFromCloudant['views']=doc['views'];//insert new information into old design document
    docFromCloudant['indexes']=doc['indexes'];
     db.insert(docFromCloudant, docFromCloudant.id, function(err, body) {
        if (err) { console.log(err);reject(err)};
        resolve(body);
        })
      });
    });
};

function createDoc(dbname, doc) {
  return new Promise(function(resolve, reject) {
    var db = cloudant.db.use(dbname);
    db.insert(doc, function(err, body) {});
  });
}

function createIndex(dbname) {
  return new Promise(function(resolve, reject) {

    var agency_id = {
      name: 'agency_id_indexer',
      type: 'json',
      index: {
        fields: ['agency_id']
      }
    };
	var dataSubscriber_id = {name:'dataSubscriber_id_indexer', type:'json', index:{fields:['dataSubscriber_id']}};

    var db = cloudant.db.use(dbname);

    db.index(agency_id, function(err, body) {
      if (err) reject(err);
      resolve(body);
    });
	db.index(dataSubscriber_id, function (err, body) {
            if (err) reject(err);
            resolve(body);
        });
  });
}
//used when adding new Design documents to the DB
function createDesign(dbname, designname, doc) {
  return new Promise(function(resolve, reject) {
    var db = cloudant.db.use(dbname);
    db.insert(doc, '_design/' + designname, function(err, body) {
      if (err) reject(err);
      resolve(body);
    });
  });
}

function updateDB() {
      var ad = updateDesign(BOLO_DB, 'agency', AGENCY_DESIGN_DOC);
      var bd = updateDesign(BOLO_DB, 'bolo', BOLO_DESIGN_DOC);
      var ud = updateDesign(BOLO_DB, 'users', USERS_DESIGN_DOC);
	    var dd=updateDesign(BOLO_DB, 'dataSubscriber', DATASUBSCRIBER_DESIGN_DOC)
      var ss=createDesign(BOLO_DB, 'systemSettings', SYSTEMSETTINGS_DESIGN_DOC)

      return Promise.all([ad,bd,ud,dd,ss])
    .then(function(responses) {
      console.log('> Design documents created. ');

      return createIndex(BOLO_DB);

    })
    .then(function(response) {
      console.log('agency id index created with response: ' + response.result);

    })

  .catch(function(error) {
    console.error('Error: ', error.message);
  });
}

function authorizeReset() {
  process.stdout.write(
    ' This script will update the "' + BOLO_DB + '" database and set it' +
    ' up to a new state.\n\n CONTINUE?  [y/n]  '
  );

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function(text) {
    if (text.match(/^y(es)?\s+$/i)) {
      updateDB().then(process.exit);
    } else {
      console.log('> Cancelled.');
      process.exit();
    }
  });
}

/** Start the script **/
authorizeReset();
