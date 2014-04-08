/* jshint node: true */

module.exports = function(grunt) {
  "use strict";

  var homepageRepo = "../su-homepage";

  var globalConfig = {
      themes: ['homepage', 'cardinal', 'wilbur', 'bootstrap'] // valid themes
    , repos:  { // repos where theme's files should be deployed
          homepage:  '../su-homepage/assets'
        , cardinal:  '../themes-dw/assets/cardinal'
        , wilbur:    '../themes-dw/assets/wilbur'
        , bootstrap: '../themes-dw/assets/bootstrap'
      }
    , bootstrapJS:  { // Bootstrap js files which should be included with theme
          homepage: [
              'js/transition.js'
            , 'js/carousel.js'
            , 'js/collapse.js'
          ]
        , cardinal:  'js/*\\.js' // all
        , wilbur:    'js/*\\.js' // all
        , bootstrap: 'js/*\\.js' // all
      }
  };
  globalConfig.theme = 'homepage'; // default theme, but may be overridden on command line
  globalConfig.repo  = globalConfig.repos[globalConfig.theme]; // default repo, but may be overridden on command line
  globalConfig.js    = globalConfig.bootstrapJS[globalConfig.theme]; // default js, but may be overridden on command line

  RegExp.quote = require('regexp-quote');
  var btoa = require('btoa');
  // Project configuration.
  grunt.initConfig({
    
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*!\n' +
              ' * Bootstrap v<%= pkg.version %> by @fat and @mdo\n' +
              ' * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
              ' * Licensed under <%= _.pluck(pkg.licenses, "url").join(", ") %>\n' +
              ' *\n' +
              ' * Designed and built with all the love in the world by @mdo and @fat.\n' +
              ' */\n\n',
    jqueryCheck: 'if (typeof jQuery === "undefined") { throw new Error("Bootstrap requires jQuery") }\n\n',

    globalConfig: globalConfig,

    // Task configuration.
    clean: {
      dist: ['dist']
    },

    jshint: {
      options: {
        jshintrc: 'js/.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: ['js/*.js']
      },
      test: {
        src: ['js/tests/unit/*.js']
      }
    },

    concat: {
      options: {
        banner: '<%= banner %><%= jqueryCheck %>',
        stripBanners: false
      },
      theme: { // before bootstrap so bootstrap's default dist-js target works properly (it runs all concat tasks)
        src: ['<%= globalConfig.js %>'],
        dest: 'dist/js/<%= pkg.name %>.js'
      },
      bootstrap: {
        src: [
          'js/transition.js',
          'js/alert.js',
          'js/button.js',
          'js/carousel.js',
          'js/collapse.js',
          'js/dropdown.js',
          'js/modal.js',
          'js/tooltip.js',
          'js/popover.js',
          'js/scrollspy.js',
          'js/tab.js',
          'js/affix.js'
        ],
        dest: 'dist/js/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>',
        report: 'min'
      },
      bootstrap: {
        src: ['<%= concat.bootstrap.dest %>'],
        dest: 'dist/js/<%= pkg.name %>.min.js'
      }
    },

    recess: {
      options: {
        compile: true,
        banner: '<%= banner %>'
      },
      bootstrap: {
        src: ['less/bootstrap.less'],
        dest: 'dist/css/<%= pkg.name %>.css'
      },
      min: {
        options: {
          compress: true
        },
        src: ['less/bootstrap.less'],
        dest: 'dist/css/<%= pkg.name %>.min.css'
      },
      theme: {
        src: ['less/theme.less'],
        dest: 'dist/css/<%= pkg.name %>-theme.css'
      },
      theme_min: {
        options: {
          compress: true
        },
        src: ['less/theme.less'],
        dest: 'dist/css/<%= pkg.name %>-theme.min.css'
      }
    },

    less: {
      dev: {
        options: {
            paths: ['themes/<%= globalConfig.theme %>/less', 'less']
          , dumpLineNumbers: "comments"
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: ['themes/<%= globalConfig.theme %>/less/[!_]*.less', '!themes/<%= globalConfig.theme %>/less/custom.less'],
            dest: 'themes/<%= globalConfig.theme %>/dist/css',
            ext: '.dev.css'
          }
        ]
      },
      stage: {
        options: {
            paths: ['themes/<%= globalConfig.theme %>/less', 'less']
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: 'themes/<%= globalConfig.theme %>/less/[!_]*.less',
            dest: 'themes/<%= globalConfig.theme %>/dist/css',
            ext: '.css'
          }
        ]
      },
      prod: {
        options: {
            paths: ['themes/<%= globalConfig.theme %>/less', 'less']
          , yuicompress: true
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: ['themes/<%= globalConfig.theme %>/less/[!_]*.less', '!themes/<%= globalConfig.theme %>/less/custom.less'],
            dest: 'themes/<%= globalConfig.theme %>/dist/css',
            ext: '.min.css'
          }
        ]
      }
    },

    copy: {
      fonts: {
        expand: true,
        src: ["fonts/*"],
        dest: 'dist/'
      },
      themeBefore: { // copy customized bootstrap files to bootstrap's build directory
        expand: true,
        cwd: 'themes/<%= globalConfig.theme %>/bootstrap/less', // look for src files in this directory
        src: '*',
        dest: 'less'
      },
      themeAfter: { // copy generated bootstrap files to theme's dist directories
        expand: true,
        cwd: 'dist',
        src: ['css/{bootstrap,bootstrap.min}.css','js/*.js','fonts/*'],
        dest: 'themes/<%= globalConfig.theme %>/dist'
      },
      themeDeploy: { // copy theme's dist directories to appropriate repo
        expand: true,
        cwd: 'themes/<%= globalConfig.theme %>/dist', // look for src files in this directory
        src: '*/*',
        dest: '<%= globalConfig.repo %>'
      }
    },

    qunit: {
      options: {
        inject: 'js/tests/unit/phantom.js'
      },
      files: ['js/tests/*.html']
    },

    connect: {
      server: {
        options: {
          port: 3000,
          base: '.'
        }
      }
    },

    jekyll: {
      docs: {}
    },

    validation: {
      options: {
        reset: true,
        relaxerror: [
            "Bad value X-UA-Compatible for attribute http-equiv on element meta.",
            "Element img is missing required attribute src."
        ]
      },
      files: {
        src: ["_gh_pages/**/*.html"]
      }
    },

    watch: {
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'qunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
      recess: {
        files: 'less/*.less',
        tasks: ['recess']
      }
    },

    sed: {
      versionNumber: {
        pattern: (function () {
          var old = grunt.option('oldver')
          return old ? RegExp.quote(old) : old
        })(),
        replacement: grunt.option('newver'),
        recursive: true
      },
      devComments: {
        path: 'themes/<%= globalConfig.theme %>/dist/css',
        pattern: '([Ll]ine \\d+,).*/themes/',
        replacement: '$1 themes/',
        recursive: true
      }
    }
  });


  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('browserstack-runner');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html-validation');
  grunt.loadNpmTasks('grunt-jekyll');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-contrib-less'); // added by UComm
  grunt.loadNpmTasks('grunt-sed');

  // Docs HTML validation task
  grunt.registerTask('validate-html', ['jekyll', 'validation']);

  // Test task.
  var testSubtasks = ['dist-css', 'jshint', 'qunit', 'validate-html'];
  // Only run BrowserStack tests under Travis
  if (process.env.TRAVIS) {
    // Only run BrowserStack tests if this is a mainline commit in twbs/bootstrap, or you have your own BrowserStack key
    if ((process.env.TRAVIS_REPO_SLUG === 'twbs/bootstrap' && process.env.TRAVIS_PULL_REQUEST === 'false') || process.env.TWBS_HAVE_OWN_BROWSERSTACK_KEY) {
      testSubtasks.push('browserstack_runner');
    }
  }
  grunt.registerTask('test', testSubtasks);

  // JS distribution task.
  grunt.registerTask('dist-js', ['concat', 'uglify']);

  // CSS distribution task.
  grunt.registerTask('dist-css', ['recess']);

  // Fonts distribution task.
  grunt.registerTask('dist-fonts', ['copy:fonts']);

  // Full distribution task.
  grunt.registerTask('dist', ['clean', 'dist-css', 'dist-fonts', 'dist-js']);

  // Default task.
  grunt.registerTask('default', ['test', 'dist', 'build-customizer']);

  // Version numbering task.
  // grunt change-version-number --oldver=A.B.C --newver=X.Y.Z
  // This can be overzealous, so its changes should always be manually reviewed!
  grunt.registerTask('change-version-number', ['sed:versionNumber']);

  // task for building customizer
  grunt.registerTask('build-customizer', 'Add scripts/less files to customizer.', function () {
    var fs = require('fs')

    function getFiles(type) {
      var files = {}
      fs.readdirSync(type)
        .filter(function (path) {
          return type == 'fonts' ? true : new RegExp('\\.' + type + '$').test(path)
        })
        .forEach(function (path) {
          var fullPath = type + '/' + path
          return files[path] = (type == 'fonts' ? btoa(fs.readFileSync(fullPath)) : fs.readFileSync(fullPath, 'utf8'))
        })
      return 'var __' + type + ' = ' + JSON.stringify(files) + '\n'
    }

    var files = getFiles('js') + getFiles('less') + getFiles('fonts')
    fs.writeFileSync('docs-assets/js/raw-files.js', files)
  });

  //// UComm tasks

  // Theme tasks
  // typical usage: grunt theme:homepage build deploy

  grunt.registerTask('theme', "Specify theme to be built", function(theme) {
    // grunt.log.writeln('Default theme: ' + globalConfig.theme); //// DEBUG
    // grunt.log.writeln('Default repo:  ' + globalConfig.repo); //// DEBUG
    if (typeof theme == "undefined") {
      grunt.log.writeln("Error: Must specify a theme, e.g. 'grunt theme:homepage' or 'grunt theme:wilbur'");
      return false;
    }
    if (globalConfig.themes.indexOf(theme) < 0) {
      grunt.log.writeln("Error: Must specify a valid theme. Please specify one of");
      grunt.log.writeln(globalConfig.themes);
      return false;
    }
    globalConfig.theme = theme;
    globalConfig.repo  = globalConfig.repos[theme];
    globalConfig.js    = globalConfig.bootstrapJS[theme];
    grunt.log.writeln("Theme set to " + globalConfig.theme);
//    grunt.log.writeln('Working theme: ' + globalConfig.theme); //// DEBUG
//    grunt.log.writeln('Working repo:  ' + globalConfig.repo); //// DEBUG
//    grunt.log.writeln('Working js:    ' + globalConfig.js); //// DEBUG
  });

  // grunt build, grunt build:theme (same as grunt build), grunt build:bootstrap or grunt build:all
  grunt.registerTask('build', 'Build customized bootstrap and css for a theme', function(target) {
    if (typeof target == "undefined") { // if no target specified, just build theme files
      target = 'theme';
    }
    if (target == 'bootstrap' || target == 'all') {
      grunt.log.writeln("Generating bootstrap files for " + globalConfig.theme);
      grunt.task.run([
          'copy:themeBefore' // copy theme's customized Bootstrap files into Bootstrap's build space
        , 'dist-css', 'concat:theme', 'uglify', 'dist-fonts' // build custom Bootstrap
        , 'copy:themeAfter' // copy Bootstrap's dist/ directory into theme's dist/ directory
      ]);
    }
    if (target == 'theme' || target == 'all') {
      grunt.log.writeln("Generating theme files for " + globalConfig.theme);
      grunt.task.run([
          'less:dev', 'less:stage', 'less:prod' // build theme's css
        , 'sed:devComments' // remove user-specific paths from comments in .dev.css
      ]);
    }
  });

  grunt.registerTask('deploy',  ['copy:themeDeploy']);
};
