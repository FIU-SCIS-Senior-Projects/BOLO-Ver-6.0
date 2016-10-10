These scripts are here to facilitate the initialization of the database. To
initialize the database automatically make sure you are in the scripts folder
and run the command "gulp initdb". This will create your db with sample Agencies
and Users.

To run the scripts individually run "node filename"


Descriptions:

cloudant-schema-reset.js - Updates the database with any views that you update
in this file. NOTE* This is the one that you want to use to update views instead
of cloudant-reset-db.js as that one will wipe all your data.

cloudant-reset-db.js - Deletes existing database and creates design documents
and its views.

create-agency-helper.js - Creates sample Agencies

create-jasons.js - Creates sample Jason users

create-user-helper.js - Creates sample users

create-subscriber-helper.js - Creates initial data subscribers to receive JSON feed

create-settings.js  - Creates initial System Settings for Session timeout and login attempts.
