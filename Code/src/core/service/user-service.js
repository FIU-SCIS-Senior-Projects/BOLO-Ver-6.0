/* jshint node: true */
'use strict';

var _ = require('lodash');
var Promise = require('promise');
var User = require('../domain/user');
var dbUserRepository = require('../adapters/persistence/cloudant-user-repository');
var config = require('../../web/config.js')
var NinetyDays = Date.now() + 90 * 24 * 60 * 60 * 1000
  /** @module core/ports */
module.exports = UserService;

var repository = new dbUserRepository();

/**
 * Creates a new instance of {UserService}.
 *
 * @class
 * @classdesc Provides an API for interacting with application user
 * interfaces.
 *
 * @param {StrageAdapter|UserRepository} - Oobject implementing the User
 * Repository Storage Port Interface.
 */
function UserService(userRepository, agencyService) {
  this.userRepository = userRepository;
  this.agencyService = agencyService;
}

//function UserService2 ( userRepository ) {///////////////////////
//    this.userRepository = userRepository;/////////////////////
//}

/**
 * Authenticate a username and password pair.
 * protracts agaisnt brute force logins to users
 * @param {String} - the username to authenticate
 * @param {String} - the password to authenticate for the supplied username
 *
 * @returns {Promise|User} the User object matching the supplied username and
 * password as well as information with attempts left.
 */
UserService.prototype.authenticate = function(username, password) {
  var context = this;
  var account = {};
  return this.userRepository.getByUsername(username)
    .then(function(user) {

      var authenticated = false;

      if (user === null) {

        account.found = false;
        account.status = true;
        return account;

      } else {
        account.found = true;
        account.email = user.email;
        account.locked = user.accountStatus2;
      }

      // if incorrect login attempts is greater than the max allowed lock the account
      if (user.incorrectLogins + 1 >= config.MAX_INCORRECT_LOGINS) {

        authenticated = false;
        user.accountStatus = false;
        user.incorrectLogins += 1;
        account.status = false;
        account.attemptsLeft = 0;


        account.agency = user.agency;
        account.id = user.id;
        account.username = user.fname + " " + user.lname;
        account.user = null;

      } else {

        // otherwise maintain account active and calculate logins left
        account.status = user.accountStatus;
        account.attemptsLeft = config.MAX_INCORRECT_LOGINS - (user.incorrectLogins + 1);

      }
      // if account locked === true dont allow user to log in
      if(account.locked){
        account.status = false;
      }

      // check username and password
      if (user && user.matchesCurrentPassword(password)) {

        // authorize the user
        authenticated = true;

      } else {

        // user wasnt authenticated and increment the incorrectLogins counter
        authenticated = false;
        user.incorrectLogins += 1;
      }



      // if login was successful and account is active reset incorrect login counter
      if (user.accountStatus && authenticated) {

        user.incorrectLogins = 0;
        account.user = user;
      } else {

        // default returns null as a user if login infor was incorrect
        account.user = null;
      }

      // update the users with # of incorrect logins and account status
      context.userRepository.update(user);



      return account;
    })
    .catch(function(error) {

      throw new Error('Unable to retrieve user data.');
    });
};

/**
 * Deserialize a user id.
 *
 * @param {String} - the User's id to deserialize
 *
 * @returns {Promise|User} the User object matching the supplied id.
 */
UserService.prototype.deserializeId = function(id) {
  return this.userRepository.getById(id);
};

UserService.prototype.getByUsername = function(username) {
  return this.userRepository.getByUsername(username);
};

UserService.prototype.getUser = UserService.prototype.deserializeId;

/**
 * Get a list of defined user roles.
 *
 * @returns {Array} list of defined user roles.
 */
UserService.prototype.getRoleNames = function() {
  return User.roleNames();
};


UserService.prototype.getUsersByAgency = function(agency) {
  return this.userRepository.getUsersByAgency(agency);
};


/**
 * Register a new user in the system.
 *
 * @param {Object} - new user information in the expected DTO format
 * @returns {Promise|User} promises a user object for the new user or rejects
 * with an error if the user could not be saved.
 */
UserService.prototype.registerUser = function(userDTO) {
  var context = this;

  return context.agencyService.getAgency(userDTO.agency).then(function(response) {
    userDTO.agencyName = response.name;
    userDTO.notifications = [response.name];

    // initial password lifetime = 90 days from creation day
    userDTO.passwordLifetime = NinetyDays;

    var newuser = new User(userDTO);
    if (userDTO.tier && typeof userDTO.tier === 'string') {
      newuser.tier = User[newuser.tier] || newuser.tier;
    }

    if (!newuser.isValid()) {
      throw new Error('User registration invalid');
    }

    var usernameCheck = context.userRepository.getByUsername(newuser.username);
    var emailCheck = context.userRepository.getByEmail(newuser.email);
    return Promise.all([usernameCheck, emailCheck]).then(function(users) {
      if (users[0]) {
        throw new Error(
          'Username is already registered: \'' + users[0].username + '\''
        );
      } else if (users[1]) {
        throw new Error(
          'Email is already registered: ' + users[1].email + '\''
        );
      }
      newuser.hashPassword();
      return context.userRepository.insert(newuser);
    });
  });
};

/**
 * Get all user objects.
 *
 * @returns {Promise|User|Array} Promises an Array of User objects.
 */
UserService.prototype.getUsers = function(sortBy) {
  return this.userRepository.getAll(sortBy);
};

// connection between this and payload function
UserService.prototype.getAgencySubscribers = function(agencyID) {
  return this.userRepository.getByAgencySubscription(agencyID);
};

/**
 * Reset a user's password.
 *
 * @param {String} - the user id
 * @param {String} - the password to change to
 * @returns {User} an updated user object
 */
UserService.prototype.resetPassword = function(id, password) {
  var context = this;
  return context.userRepository.getById(id).then(function(user) {

      if (user.matchesCurrentPassword(password)) {
        throw new Error("Password matches previous password.");
      }

      // activate users account
      user.accountStatus = true;
      user.incorrectLogins = 0;

      // set password lifetime info
      user.passwordLifetime = NinetyDays;
      user.resetPasswordToken = '';
      user.resetPasswordExpires = null;
      user.password = password;
      user.hashPassword();
      return context.userRepository.update(user);
    }, function(error) {
      var message = 'Unable to get current user data: ' + error.message;
      throw new Error(message);
    })
    .catch(function(error) {
      var message = 'Error saving password to repository: ' + error.message;
      throw new Error(message);
    });
};

/**
 * Update user data.
 *
 * @param {String} - the id of the user to update
 * @param {Object} - object with the data to update, null values indicate no
 * change
 * @returns {Promise|User} the updated user object
 */
UserService.prototype.updateUser = function(id, userDTO) {
  var context = this;

  return context.agencyService.getAgency(userDTO.agency).then(function(response) {

    return context.userRepository.getById(id).then(function(user) {
        function blacklisted(key) {
          var list = ['password', 'tier', 'notifications'];
          return (-1 !== list.indexOf(key));
        }

        if (typeof userDTO.tier === 'string' && undefined !== User[userDTO.tier]) {
          user.tier = User[userDTO.tier];
        }

        if (userDTO.agency && userDTO.agency !== user.agency) {
          user.notifications.push(userDTO.agency);
          user.agencyName = response.name;
        }

        Object.keys(user.data).forEach(function(key) {
          if (userDTO[key] && !blacklisted(key)) {
            user[key] = userDTO[key];
          }
        });

        return context.userRepository.update(user);
      }, function(error) {
        throw new Error(
          'Unable to get user id ' + id + ': ' + error.message
        );
      })
      .catch(function(error) {
        throw new Error(
          'Error saving user data changes to repository: ' + error.message
        );
      });
  });
};

/**
 * Remove a list of notifications from the specified user (by id)
 *
 * @param {String} - the id of the user to remove notifications from
 * @param {String|Array} - array of agency ids to remove from the user
 * @returns {Promise|User} an updated user object
 */
UserService.prototype.removeNotifications = function(id, agencylist) {
  var context = this;

  return context.userRepository.getById(id).then(function(user) {
      user.notifications = _.difference(user.notifications, agencylist);
      return context.userRepository.update(user);
    })
    .catch(function(error) {
      throw new Error(
        'Error registering new notifications: ', +error.message
      );
    });
};

/**
 * Add a list of notifications to the specified user (by id)
 *
 * @param {String} - the id of the user to add notifications to
 * @param {String|Array} - array of agency ids to add to the user
 * @returns {Promise|User} an updated user object
 */
UserService.prototype.addNotifications = function(id, agencylist) {
  var context = this;

  return context.userRepository.getById(id).then(function(user) {
      user.notifications = _.union(user.notifications, agencylist);
      return context.userRepository.update(user);
    })
    .catch(function(error) {
      throw new Error(
        'Error registering new notifications: ', +error.message
      );
    });
};

/**
 * Remove a user from the system.
 *
 * @param {String} - the id of the user to remove
 * @returns {Object} - a response from the persistence layer
 *
 * @todo find out the policy for removing users, does removing a user affect
 * BOLOs attached to the user? Should a user really be deleted or maybe just
 * disabled?
 */
UserService.prototype.removeUser = function(id) {
  return this.userRepository.remove(id);
};

/**
 * Attempt to create a formatted object suitable for use with UserService
 * methods.
 *
 * @param {Object} - the input data object
 * @return {Object} DTO object containing keys identified as suitable from the
 * input object.
 */
UserService.formatDTO = function(dto) {
  var userDTO = new User().data;

  Object.keys(userDTO).forEach(function(key) {
    userDTO[key] = dto[key] || null;
  });

  return userDTO;
};

/**
 * A convenience wrapper to the static UserService.formatDTO method.
 * @see {@link UserService.formatDTO}
 */
UserService.prototype.formatDTO = function(dto) {
  return UserService.formatDTO(dto);
};

UserService.prototype.getByEmail = function(email) {
  return this.userRepository.getByEmail(email.toLowerCase());
};

UserService.prototype.getByToken = function(email) {
  return this.userRepository.getByToken(email);
};

/**
 * Create a new User in the system used by activate deactivate user
 *
 * @param {object} userActivateData - User to update
 */

UserService.prototype.updateActivateUser = function ( userActivateData) {
    var context = this;
    var updated = new User( userActivateData);
    var validatename = 0;

    if ( ! updated.isValid2() ) {
        throw new Error( "Invalid user data" );
    }

     return context.userRepository.getUsersByAgency().then(function (users){

                users.forEach(function(currentUser) {
                    if(currentUser.data.username === updated.username ){
                        validatename++;
                        if(currentUser.data.id === updated.id){
                            validatename--;
                        }
                    }
                });

                if(validatename<1){

                    return context.userRepository.getById( updated.data.id )
                    .then( function ( original ) {
                        // If you do not put this field the role is missing
                        updated.data.tier = original.data.tier;

                        original.diff( updated ).forEach( function ( key ) {
                            original.data[key] = updated.data[key];
                        });


                        return context.userRepository.update( original);
                    })
                    .then( function ( updated ) {
                        return updated;
                    })
                    .catch( function ( error ) {
                        return Promise.reject( new Error("User does not exist.!!!") );
                    });
                }
                else{
                    return Promise.reject(new Error("User already registered!!!"));
                }
        });
};

/**
 * Return user by id
 *
 * @param id - user id
 */
UserService.prototype.getById = function ( id ) {
    var context = this;
    return context.userRepository.getById( id );
};
