var mongoose = require('mongoose');
var config = require('../src/config');

var User = require('../src/models/user');
var Agency = require('../src/models/agency');
var Category = require('../src/models/category');

mongoose.connect(config.db);
mongoose.Promise = require('bluebird');

var nullAgency = new Agency({
    name: 'NULL',
    emailDomain: 'null@null.com',
    address: 'n/a',
    city: 'n/a',
    state: 'n/a',
    zipcode: '00000',
    phone: '0000000000',
    rank: 'n/a',
});

var rootUser = new User({
    username: 'root',
    firstname: 'N/A',
    lastname: 'N/A',
    password: config.rootPasswd,
    passwordDate: new Date(8640000000000000), // Latest possible date
    email: 'null@null.com',
    tier: 'ROOT',
    badge: '0',
    unit: 'N/A',
    rank: 'N/A'
});

//Categories

var autoCategory = new Category({
    name: 'Auto Theft',
    fields: ['Year', 'Make', 'Model', 'Style', 'Color',
        'VIN Number', 'License Plate State', 'License Plate Number']
});

var boatCategory = new Category({
    name: 'Boat Theft',
    fields: ['Year', 'Manufacturer', 'Model', 'Type', 'Length - Feet',
        'Color', 'Hull Identification Number', 'Registration State', 'Registration Number',
        'Propulsion Type', 'Propulsion Make', 'Trailer Manufacturer',
        'VIN Number', 'License Plate State', 'License Plate Number']
});

var generalCategory = new Category({
    name: 'General',
    fields: ['Category (Arson, Missing Person, ...)', 'First Name', 'Last Name',
        'Date of Birth (DD/MM/YYYY)', 'Drivers License Number', 'Address', 'Zip Code',
        'Race', 'Sex', 'Height', 'Weight', 'Hair Color', 'Tattoos']
});

nullAgency.save(function (err, agency) {
    if (err) {
        console.log('Null Agency could not be saved:' + err);
        process.exit(1);
    } else {
        console.log('Null Agency has been registered: ' + agency);
        rootUser.agency = agency._id;
        User.createUser(rootUser, function (err, user) {
            if (err) {
                console.log('root user could not be saved: ' + err);
                process.exit(2);
            } else {
                console.log('root user has been registered: ' + user);
                autoCategory.save(function (err) {
                    if (err) {
                        console.log('Error saving categories: ' + err);
                        process.exit(3);
                    } else {
                        boatCategory.save(function (err) {
                            if (err) {
                                console.log('Error saving categories: ' + err);
                                process.exit(3);
                            } else {
                                generalCategory.save(function (err) {
                                    if (err) {
                                        console.log('Error saving categories: ' + err);
                                        process.exit(3);
                                    } else {
                                        console.log('3 Categories have been registered: ' + user);
                                        console.log('The database has been initialized');
                                        process.exit(0);
                                    }
                                })
                            }
                        })
                    }
                });
            }
        })
    }
});