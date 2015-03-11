// Generated on 2014-09-10 using generator-socketio 0.0.3
'use strict';
var moment = require('moment');

var LIVERELOAD_PORT = 35729;
var RUNNING_PORT = 4443; // <- if you change this, you need to change in public/js/app.js and recompile
var RUNNING_CERT_PATH = 'server.crt';
var RUNNING_KEY_PATH = 'server.key';
var RUNNING_ADMIN_NAME = 'admin';
var RUNNING_CLOSED_TASK_DELAY = 1000*10;
var RUNNING_SESSION_SECRET = 'change_me';
var RUNNING_DB_CONNECTION_STRING = 'mongodb://login:password@127.0.0.1:27017/sthack';
var RUNNING_SESSION_KEY = 'sthackSession';
var RUNNING_ADMIN_PATH = '/admin_poney';
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.initConfig({

    cssmin: {
      target: {
        files: {
          'public/css/style.min.css': 'static/css/style.css',
          'public/css/reset.min.css': 'static/css/reset.css'
        }
      }
    },

    //this is currently turned off, since jquery KILLS it
    jshint: {
      options: {
        curly: true,
        eqeqeq: false,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true
        }
      },
      files:{
        src:['static/js/*.js', 'server.js', 'src/**/*.js']
      }
    },

    uglify: {
      options: {
        mangle: false
      },
      my_target: {
        files: {
          'public/js/client.min.js': ['static/js/button.js', 'static/js/console.js', 'static/js/client.js'],
          'public/js/scoreboard.min.js': ['static/js/console.js', 'static/js/scoreboard.js'],
          'public/js/admin.min.js': ['static/js/console.js', 'static/js/admin.js']
        }
      }
    },

    jasmine_node: {
      options: {
        forceExit: true,
        match: '.',
        matchall: false,
        extensions: 'js',
        specNameMatcher: 'spec'
      },
      all: ['spec/']
    },

    // Watch Config
    watch: {
        src:{
          files: ['views/**/*'],
          options: {
            livereload: true
          },
        },
        scripts: {
            files: [
                'static/js/**/*.js',
            ],
            tasks:['uglify']
        },
        css: {
            files: [
                'static/css/**/*.css',
            ],
            tasks:['cssmin']
        },
    },

    // connect: {
    //   options: {
    //     port: RUNNING_PORT,//variable at top of this file
    //     // change this to '0.0.0.0' to access the server from outside
    //     hostname: 'localhost'
    //   },
    //   livereload: {
    //     options: {
    //       middleware: function (connect) {
    //         return [
    //           lrSnippet,
    //           mountFolder(connect, '.')
    //         ];
    //       }
    //     }
    //   }
    // },

    nodemon:{
      dev: {
        options: {
          file: 'server.js',
          //args: ['dev'],
          //nodeArgs: ['--debug'],
          ignoredFiles: ['node_modules/**'],
          //watchedExtensions: ['js'],
          watchedFolders: ['src'],
          //delayTime: 1,
          legacyWatch: true,
          env: {
            PORT                : RUNNING_PORT,
            CERT_PATH           : RUNNING_CERT_PATH,
            KEY_PATH            : RUNNING_KEY_PATH,
            ADMIN_NAME          : RUNNING_ADMIN_NAME,
            CLOSED_TASK_DELAY   : RUNNING_CLOSED_TASK_DELAY,
            SESSION_SECRET      : RUNNING_SESSION_SECRET,
            DB_CONNECTION_STRING: RUNNING_DB_CONNECTION_STRING,
            SESSION_KEY         : RUNNING_SESSION_KEY,
            ADMIN_PATH          : RUNNING_ADMIN_PATH,
            NODE_ENV            : 'development'
          },
          cwd: __dirname
        }
      }
    },

    // run 'watch' and 'nodemon' indefinitely, together
    // 'launch' will just kick it off, and won't stay running
    concurrent: {
        target: {
            tasks: ['nodemon', 'watch', 'wait'],
            options: {
                logConcurrentOutput: true
            }
        }
    },

    wait:{
      options: {
          delay: 1000
      },
      pause:{
        options:{
          before:function(options){
            console.log('pausing %dms before launching page', options.delay);
          },
          after : function() {
              console.log('pause end, heading to page (using default browser)');
          }
        }
      }
    },

    compress: {
      main: {
        options: {
          mode: 'tgz',
          archive: 'dist/sthack-interface-neo.tar.gz'
        },
        files: [
          {src: ['public/**', 'server.js', 'src/**', 'views/**', 'package.json']}
        ]
      }
    },

    secret: grunt.file.readJSON('sshProduction.json'),
    sshexec: {
      extract: {
        command: '<%= secret.extractcmd %>',
        options: {
          host: '<%= secret.host %>',
          username: '<%= secret.username %>',
          password: '<%= secret.password %>'
        }
      },
      restart: {
        command: '<%= secret.restartcmd %>',
        options: {
          host: '<%= secret.host %>',
          username: '<%= secret.username %>',
          password: '<%= secret.password %>'
        }
      },
      start: {
        command: '<%= secret.startcmd %>',
        options: {
          host: '<%= secret.host %>',
          username: '<%= secret.username %>',
          password: '<%= secret.password %>'
        }
      }
    },

    sftp: {
      upload: {
        files: {
          "./": "dist/**"
        },
        options: {
          path: '<%= secret.path %>',
          host: '<%= secret.host %>',
          username: '<%= secret.username %>',
          password: '<%= secret.password %>',
          showProgress: true,
          srcBasePath: "dist/"
        }
      }
    }

  });

  //grunt.registerTask('server', ['build', 'connect:livereload', 'open', 'watch']);

  grunt.registerTask('build', ['cssmin', 'uglify']);

  grunt.registerTask('validate', ['jshint']);

  grunt.registerTask('test', ['jasmine_node'])

  grunt.registerTask('deploy', ['build', 'compress', 'sftp:upload', 'sshexec:extract', 'sshexec:restart']);

  grunt.registerTask('default', ['concurrent']);

};
