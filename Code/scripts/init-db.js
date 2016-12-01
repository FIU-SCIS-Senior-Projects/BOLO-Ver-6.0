var mongoose = require('mongoose');
var config = require('../src/config');

var User = require('../src/web/models/user');
var Agency = require('../src/web/models/agency');

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
nullAgency.save(function (err, agency) {
    if (err) {
        console.log('Null Agency could not save:' + err);
        process.exit(1);
    } else {
        console.log('Null Agency has been registered: ' + agency);
        var nullUser = new User({
            username: 'NULL',
            firstname: 'n/a',
            lastname: 'n/a',
            password: '1234',
            email: 'null@null.com',
            tier: 'OFFICER',
            badge: '0',
            unit: 'n/a',
            rank: 'n/a',
            agency: agency._id
        });
        User.createUser(nullUser, function (err, user) {
            if (err) {
                console.log('null user could not save' + err);
                process.exit(1);
            }
            else {
                console.log('null user has been registered: ' + user);
                var rootUser = new User({
                    username: 'root',
                    firstname: 'n/a',
                    lastname: 'n/a',
                    password: config.rootPasswd,
                    email: 'null@null.com',
                    tier: 'ROOT',
                    badge: '0',
                    unit: 'n/a',
                    rank: 'n/a',
                    agency: agency._id
                });
                User.createUser(rootUser, function (err, user) {
                    if (err) {
                        console.log('root user could not save' + err);
                        process.exit(1);
                    }
                    else {
                        console.log('root user has been registered: ' + user);
                        console.log('The database has been initialized');
                        process.exit(0);
                    }
                })
            }
        })
    }
});