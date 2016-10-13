var gulp = require('gulp');
var exec = require('gulp-exec');
var confirm = require('gulp-confirm');

/*
Initializes the database with default
agencies and sample users.
To run simply run "gulp initdb"
*/

gulp.task("initdb", function(){

  var options = {
    continueOnError: false,
    pipeStdout: false,
    customTemplatingThing: "initdb"
  };

  var reportOptions = {
    err: true,
    stderr: true,
    stdout: true
  };

  gulp.src('./')
    .pipe(confirm({
      question:   ' This script will destroy the  database and set it' +
        ' up to a default state.\n\n CONTINUE?  [y/n]  ',
      input: '_key:y'
    }))
    .pipe(exec('node cloudant-reset-db.js', options))
    .pipe(exec.reporter(reportOptions))
    .pipe(exec('node create-agency-helper.js', options))
    .pipe(exec.reporter(reportOptions))
    .pipe(exec('node create-user-helper.js', options))
    .pipe(exec.reporter(reportOptions))
    .pipe(exec('node create-jasons.js', options))
    .pipe(exec.reporter(reportOptions))
    .pipe(exec('node create-subscriber-helper.js', options))
    .pipe(exec.reporter(reportOptions))
    .pipe(exec('node create-settings.js', options))
    .pipe(exec.reporter(reportOptions));
});
