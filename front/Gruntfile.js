'use strict';

module.exports = function (grunt) {

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    cssmin: {
      target: {
        files: {
          'public/css/style.min.css': 'static/css/style.css',
          'public/css/reset.min.css': 'static/css/reset.css'
        }
      }
    },

    uglify: {
      options: {
        mangle: false
      },
      my_target: {
        files: {
          'public/js/client.min.js': ['static/js/button.js', 'static/js/console.js', 'static/js/client.js'],
          'public/js/rules.min.js': ['static/js/button.js', 'static/js/rules.js'],
          'public/js/scoreboard.min.js': ['static/js/console.js', 'static/js/scoreboard.js'],
          'public/js/admin.min.js': ['static/js/console.js', 'static/js/admin.js']
        }
      }
    },
  });

  grunt.registerTask('build', ['cssmin', 'uglify']);
};
