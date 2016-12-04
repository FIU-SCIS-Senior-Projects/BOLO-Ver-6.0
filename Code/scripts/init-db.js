var mongoose = require('mongoose');
var config = require('../src/config');

var User = require('../src/models/user');
var Agency = require('../src/models/agency');

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
    email: 'null@null.com',
    tier: 'ROOT',
    badge: '0',
    unit: 'N/A',
    rank: 'N/A',
    agency: agency._id
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
            }
            else {
                console.log('root user has been registered: ' + user);
                console.log('The database has been initialized');
                process.exit(0);
            }
        })
    }
});