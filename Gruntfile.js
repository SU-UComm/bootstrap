/*!
 * Bootstrap's Gruntfile
 * http://getbootstrap.com
 * Copyright 2013-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

// UComm start
var util = require('util');

var SUConfig = {
  themes: ['homepage', 'cardinal', 'lagunita', 'news-proto', 'news', 'wilbur', 'bootstrap'], // valid themes
  repos:  { // repos where theme's files should be deployed
      'homepage':    '../su-homepage/assets',
      'cardinal':    '../themes-dw/assets/cardinal',
      'lagunita':    '../themes-dw/assets/lagunita',
      'news-proto':  '../news-proto/assets',
      'news':        '../wpe-stanfordnews/wp-content/themes/news',
      'wilbur':      '../themes-dw/assets/wilbur',
      'bootstrap':   '../themes-dw/assets/bootstrap'
    },
  bootstrapJS:  { // Bootstrap js files which should be included with theme
      'homepage': [
          'js/transition.js',
          'js/carousel.js',
          'js/collapse.js'
        ],
      'cardinal':    '<%= concat.bootstrap.src %>', // same as vanilla bootstrap
      'news-proto': [
        'js/transition.js',
        'js/collapse.js'
      ],
      'news': [
        'js/transition.js',
        'js/collapse.js',
        'js/modal.js'
      ],
      'lagunita':    '<%= concat.bootstrap.src %>', // same as vanilla bootstrap
      'wilbur':      '<%= concat.bootstrap.src %>', // same as vanilla bootstrap
      'bootstrap':   '<%= concat.bootstrap.src %>'  // same as vanilla bootstrap
    }
};
SUConfig.theme = 'news'; // default theme, but may be overridden on command line
SUConfig.repo  = SUConfig.repos[SUConfig.theme]; // default repo, but may be overridden on command line
SUConfig.js    = SUConfig.bootstrapJS[SUConfig.theme]; // default js, but may be overridden on command line
// UComm end

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  RegExp.quote = function (string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  var fs = require('fs');
  var path = require('path');
  var npmShrinkwrap = require('npm-shrinkwrap');
  var generateGlyphiconsData = require('./grunt/bs-glyphicons-data-generator.js');
  var BsLessdocParser = require('./grunt/bs-lessdoc-parser.js');
  var getLessVarsData = function () {
    var filePath = path.join(__dirname, 'less/variables.less');
    var fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
    var parser = new BsLessdocParser(fileContent);
    return { sections: parser.parseFile() };
  };
  var generateRawFiles = require('./grunt/bs-raw-files-generator.js');
  var generateCommonJSModule = require('./grunt/bs-commonjs-generator.js');
  var configBridge = grunt.file.readJSON('./grunt/configBridge.json', { encoding: 'utf8' });

  Object.keys(configBridge.paths).forEach(function (key) {
    configBridge.paths[key].forEach(function (val, i, arr) {
      arr[i] = path.join('./docs/assets', val);
    });
  });

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*!\n' +
            ' * Bootstrap v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2011-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
            ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
            ' */\n',
    jqueryCheck: configBridge.config.jqueryCheck.join('\n'),
    jqueryVersionCheck: configBridge.config.jqueryVersionCheck.join('\n'),

    // Task configuration.
    clean: {
      dist: 'dist',
      docs: 'docs/dist'
    },

    jshint: {
      options: {
        jshintrc: 'js/.jshintrc'
      },
      grunt: {
        options: {
          jshintrc: 'grunt/.jshintrc'
        },
        src: ['Gruntfile.js', 'grunt/*.js']
      },
      core: {
        src: 'js/*.js'
      },
      test: {
        options: {
          jshintrc: 'js/tests/unit/.jshintrc'
        },
        src: 'js/tests/unit/*.js'
      },
      assets: {
        src: ['docs/assets/js/src/*.js', 'docs/assets/js/*.js', '!docs/assets/js/*.min.js']
      }
    },

    jscs: {
      options: {
        config: 'js/.jscsrc'
      },
      grunt: {
        src: '<%= jshint.grunt.src %>'
      },
      core: {
        src: '<%= jshint.core.src %>'
      },
      test: {
        src: '<%= jshint.test.src %>'
      },
      assets: {
        options: {
          requireCamelCaseOrUpperCaseIdentifiers: null
        },
        src: '<%= jshint.assets.src %>'
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>\n<%= jqueryCheck %>\n<%= jqueryVersionCheck %>',
        stripBanners: false
      },
      // UComm start
      theme: { // before bootstrap so bootstrap's default dist-js target works properly (it runs all concat tasks)
        src: ['<%= suconfig.js %>'],
        dest: 'dist/js/<%= pkg.name %>.js'
      },
      // UComm end
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
        preserveComments: 'some'
      },
      core: {
        src: '<%= concat.bootstrap.dest %>',
        dest: 'dist/js/<%= pkg.name %>.min.js'
      },
      customize: {
        src: configBridge.paths.customizerJs,
        dest: 'docs/assets/js/customize.min.js'
      },
      docsJs: {
        src: configBridge.paths.docsJs,
        dest: 'docs/assets/js/docs.min.js'
      }
    },

    qunit: {
      options: {
        inject: 'js/tests/unit/phantom.js'
      },
      files: 'js/tests/index.html'
    },

    less: {
      compileCore: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>.css.map'
        },
        src: 'less/bootstrap.less',
        dest: 'dist/css/<%= pkg.name %>.css'
      },
      compileTheme: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>-theme.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>-theme.css.map'
        },
        src: 'less/theme.less',
        dest: 'dist/css/<%= pkg.name %>-theme.css'
      },
      // UComm start
      compileSUdev: {
        options: {
          paths: ['themes/<%= suconfig.theme %>/less', 'less'],
          dumpLineNumbers: 'comments'
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: ['themes/<%= suconfig.theme %>/less/[!_]*.less', '!themes/<%= suconfig.theme %>/less/custom.less'],
            dest: 'themes/<%= suconfig.theme %>/dist/css',
            ext: '.dev.css'
          }
        ]
      },
      compileSU: {
        options: {
          paths: ['themes/<%= suconfig.theme %>/less', 'less']
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: 'themes/<%= suconfig.theme %>/less/[!_]*.less',
            dest: 'themes/<%= suconfig.theme %>/dist/css',
            ext: '.css'
          }
        ]
      }
      // UComm end
    },

    autoprefixer: {
      options: {
        browsers: configBridge.config.autoprefixerBrowsers
      },
      core: {
        options: {
          map: true
        },
        src: 'dist/css/<%= pkg.name %>.css'
      },
      theme: {
        options: {
          map: true
        },
        src: 'dist/css/<%= pkg.name %>-theme.css'
      },
      docs: {
        src: 'docs/assets/css/src/docs.css'
      },
      examples: {
        expand: true,
        cwd: 'docs/examples/',
        src: ['**/*.css'],
        dest: 'docs/examples/'
      }
    },

    csslint: {
      options: {
        csslintrc: 'less/.csslintrc'
      },
      dist: [
        'dist/css/bootstrap.css',
        'dist/css/bootstrap-theme.css'
      ],
      examples: [
        'docs/examples/**/*.css'
      ],
      docs: {
        options: {
          ids: false,
          'overqualified-elements': false
        },
        src: 'docs/assets/css/src/docs.css'
      }
    },

    cssmin: {
      options: {
        compatibility: 'ie8',
        keepSpecialComments: '*',
        advanced: false
      },
      minifyCore: {
        src: 'dist/css/<%= pkg.name %>.css',
        dest: 'dist/css/<%= pkg.name %>.min.css'
      },
      minifyTheme: {
        src: 'dist/css/<%= pkg.name %>-theme.css',
        dest: 'dist/css/<%= pkg.name %>-theme.min.css'
      },
      // UComm start
      minifySUTheme: {
        files: [{
          expand: true,
          cwd: 'themes/<%= suconfig.theme %>/dist/css',
          src: ['*.css', '!*.min.css', '!*.dev.css', '!custom.css'],
          dest: 'themes/<%= suconfig.theme %>/dist/css',
          ext: '.min.css'
        }]
      },
      // UComm end
      docs: {
        src: [
          'docs/assets/css/src/docs.css',
          'docs/assets/css/src/pygments-manni.css'
        ],
        dest: 'docs/assets/css/docs.min.css'
      }
    },

    usebanner: {
      options: {
        position: 'top',
        banner: '<%= banner %>'
      },
      files: {
        src: 'dist/css/*.css'
      }
    },

    csscomb: {
      options: {
        config: 'less/.csscomb.json'
      },
      dist: {
        expand: true,
        cwd: 'dist/css/',
        src: ['*.css', '!*.min.css'],
        dest: 'dist/css/'
      },
      examples: {
        expand: true,
        cwd: 'docs/examples/',
        src: '**/*.css',
        dest: 'docs/examples/'
      },
      docs: {
        src: 'docs/assets/css/src/docs.css',
        dest: 'docs/assets/css/src/docs.css'
      }
    },

    copy: {
      fonts: {
        src: 'fonts/*',
        dest: 'dist/'
      },
      docs: {
        src: 'dist/*/*',
        dest: 'docs/'
      },
      // UComm start
      themeBefore: { // copy customized bootstrap files to bootstrap's build directory
        expand: true,
        cwd: 'themes/<%= suconfig.theme %>/bootstrap/less', // look for src files in this directory
        src: '*',
        dest: 'less'
      },
      themeAfter: { // copy generated bootstrap files to theme's dist directories
        expand: true,
        cwd: 'dist',
        src: ['css/{bootstrap.css,bootstrap.min.css,bootstrap.css.map}','js/*.js','fonts/*'],
        dest: 'themes/<%= suconfig.theme %>/dist'
      },
      themeDeploy: { // copy theme's dist directories to appropriate repo
        expand: true,
        cwd: 'themes/<%= suconfig.theme %>/dist', // look for src files in this directory
        src: '*/*',
        dest: '<%= suconfig.repo %>'
      }
      // UComm end
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
      options: {
        config: '_config.yml'
      },
      docs: {},
      github: {
        options: {
          raw: 'github: true'
        }
      }
    },

    jade: {
      options: {
        pretty: true,
        data: getLessVarsData
      },
      customizerVars: {
        src: 'docs/_jade/customizer-variables.jade',
        dest: 'docs/_includes/customizer-variables.html'
      },
      customizerNav: {
        src: 'docs/_jade/customizer-nav.jade',
        dest: 'docs/_includes/nav/customize.html'
      }
    },

    validation: {
      options: {
        charset: 'utf-8',
        doctype: 'HTML5',
        failHard: true,
        reset: true,
        relaxerror: [
          'Element img is missing required attribute src.',
          'Attribute autocomplete not allowed on element input at this point.',
          'Attribute autocomplete not allowed on element button at this point.',
          'Bad value separator for attribute role on element li.'
        ]
      },
      files: {
        src: '_gh_pages/**/*.html'
      }
    },

    watch: {
      src: {
        files: '<%= jshint.core.src %>',
        tasks: ['jshint:src', 'qunit', 'concat:bootstrap']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
      less: {
        files: 'less/**/*.less',
        tasks: 'less'
      }
    },

    sed: {
      versionNumber: {
        pattern: (function () {
          var old = grunt.option('oldver');
          return old ? RegExp.quote(old) : old;
        })(),
        replacement: grunt.option('newver'),
        recursive: true
      },
      // UComm start
      devComments: {
        path: 'themes/<%= suconfig.theme %>/dist/css',
        pattern: '([Ll]ine \\d+,).*/themes/',
        replacement: '$1 themes/',
        recursive: true
      }
      // UComm end
    },

    'saucelabs-qunit': {
      all: {
        options: {
          build: process.env.TRAVIS_JOB_ID,
          throttled: 10,
          maxRetries: 3,
          maxPollRetries: 4,
          urls: ['http://127.0.0.1:3000/js/tests/index.html'],
          browsers: grunt.file.readYAML('grunt/sauce_browsers.yml')
        }
      }
    },

    exec: {
      npmUpdate: {
        command: 'npm update'
      }
    },

    compress: {
      main: {
        options: {
          archive: 'bootstrap-<%= pkg.version %>-dist.zip',
          mode: 'zip',
          level: 9,
          pretty: true
        },
        files: [
          {
            expand: true,
            cwd: 'dist/',
            src: ['**'],
            dest: 'bootstrap-<%= pkg.version %>-dist'
          }
        ]
      }
    }

  });


  // These plugins provide necessary tasks.
  require('load-grunt-tasks')(grunt, { scope: 'devDependencies' });
  require('time-grunt')(grunt);

  // Docs HTML validation task
  grunt.registerTask('validate-html', ['jekyll:docs', 'validation']);

  var runSubset = function (subset) {
    return !process.env.TWBS_TEST || process.env.TWBS_TEST === subset;
  };
  var isUndefOrNonZero = function (val) {
    return val === undefined || val !== '0';
  };

  // Test task.
  var testSubtasks = [];
  // Skip core tests if running a different subset of the test suite
  if (runSubset('core') &&
      // Skip core tests if this is a Savage build
      process.env.TRAVIS_REPO_SLUG !== 'twbs-savage/bootstrap') {
    testSubtasks = testSubtasks.concat(['dist-css', 'dist-js', 'csslint:dist', 'test-js', 'docs']);
  }
  // Skip HTML validation if running a different subset of the test suite
  if (runSubset('validate-html') &&
      // Skip HTML5 validator on Travis when [skip validator] is in the commit message
      isUndefOrNonZero(process.env.TWBS_DO_VALIDATOR)) {
    testSubtasks.push('validate-html');
  }
  // Only run Sauce Labs tests if there's a Sauce access key
  if (typeof process.env.SAUCE_ACCESS_KEY !== 'undefined' &&
      // Skip Sauce if running a different subset of the test suite
      runSubset('sauce-js-unit') &&
      // Skip Sauce on Travis when [skip sauce] is in the commit message
      isUndefOrNonZero(process.env.TWBS_DO_SAUCE)) {
    testSubtasks.push('connect');
    testSubtasks.push('saucelabs-qunit');
  }
  grunt.registerTask('test', testSubtasks);
  grunt.registerTask('test-js', ['jshint:core', 'jshint:test', 'jshint:grunt', 'jscs:core', 'jscs:test', 'jscs:grunt', 'qunit']);

  // JS distribution task.
  grunt.registerTask('dist-js', ['concat:bootstrap', 'uglify:core', 'commonjs']);

  // CSS distribution task.
  grunt.registerTask('less-compile', ['less:compileCore', 'less:compileTheme']);
  grunt.registerTask('dist-css', ['less-compile', 'autoprefixer:core', 'autoprefixer:theme', 'usebanner', 'csscomb:dist', 'cssmin:minifyCore', 'cssmin:minifyTheme']);

  // Full distribution task.
  grunt.registerTask('dist', ['clean:dist', 'dist-css', 'copy:fonts', 'dist-js']);

  // Default task.
  grunt.registerTask('default', ['clean:dist', 'copy:fonts', 'test']);

  // Version numbering task.
  // grunt change-version-number --oldver=A.B.C --newver=X.Y.Z
  // This can be overzealous, so its changes should always be manually reviewed!
  grunt.registerTask('change-version-number', 'sed:versionNumber'); // UComm - add ::versionNumber

  grunt.registerTask('build-glyphicons-data', function () { generateGlyphiconsData.call(this, grunt); });

  // task for building customizer
  grunt.registerTask('build-customizer', ['build-customizer-html', 'build-raw-files']);
  grunt.registerTask('build-customizer-html', 'jade');
  grunt.registerTask('build-raw-files', 'Add scripts/less files to customizer.', function () {
    var banner = grunt.template.process('<%= banner %>');
    generateRawFiles(grunt, banner);
  });

  grunt.registerTask('commonjs', 'Generate CommonJS entrypoint module in dist dir.', function () {
    var srcFiles = grunt.config.get('concat.bootstrap.src');
    var destFilepath = 'dist/js/npm.js';
    generateCommonJSModule(grunt, srcFiles, destFilepath);
  });

  // Docs task.
  grunt.registerTask('docs-css', ['autoprefixer:docs', 'autoprefixer:examples', 'csscomb:docs', 'csscomb:examples', 'cssmin:docs']);
  grunt.registerTask('lint-docs-css', ['csslint:docs', 'csslint:examples']);
  grunt.registerTask('docs-js', ['uglify:docsJs', 'uglify:customize']);
  grunt.registerTask('lint-docs-js', ['jshint:assets', 'jscs:assets']);
  grunt.registerTask('docs', ['docs-css', 'lint-docs-css', 'docs-js', 'lint-docs-js', 'clean:docs', 'copy:docs', 'build-glyphicons-data', 'build-customizer']);

  grunt.registerTask('prep-release', ['jekyll:github', 'compress']);

  // Task for updating the cached npm packages used by the Travis build (which are controlled by test-infra/npm-shrinkwrap.json).
  // This task should be run and the updated file should be committed whenever Bootstrap's dependencies change.
  grunt.registerTask('update-shrinkwrap', ['exec:npmUpdate', '_update-shrinkwrap']);
  grunt.registerTask('_update-shrinkwrap', function () {
    var done = this.async();
    npmShrinkwrap({ dev: true, dirname: __dirname }, function (err) {
      if (err) {
        grunt.fail.warn(err);
      }
      var dest = 'test-infra/npm-shrinkwrap.json';
      fs.renameSync('npm-shrinkwrap.json', dest);
      grunt.log.writeln('File ' + dest.cyan + ' updated.');
      done();
    });
  });

  // UComm start
  // place a reference to the global SUConfig object in Grunt's configuration,
  // where the template processor can find it
  grunt.config('suconfig', SUConfig);

  // Theme tasks
  // typical usage: grunt theme:homepage build deploy

  grunt.registerTask('theme', 'Specify theme to be built', function (theme) {
    grunt.log.debug('Default theme: ' + SUConfig.theme);
    grunt.log.debug('Default repo:  ' + SUConfig.repo);
    if (typeof theme == 'undefined') {
      grunt.log.writeln('Error: Must specify a theme, e.g. \'grunt theme:cardinal\' or \'grunt theme:homepage\'');
      return false;
    }
    if (SUConfig.themes.indexOf(theme) < 0) {
      grunt.log.writeln('Error: Must specify a valid theme. Please specify one of');
      grunt.log.writeln(SUConfig.themes);
      return false;
    }
    // only need to modify the global object, since Grunt's config contains a reference / pointer
    SUConfig.theme = theme;
    SUConfig.repo  = SUConfig.repos[theme];
    SUConfig.js    = SUConfig.bootstrapJS[theme];
    grunt.log.debug('suconfig: ' + util.inspect(SUConfig));
    grunt.log.debug('Theme: ' + grunt.template.process('<%= suconfig.theme %>'));
    grunt.log.debug('Repo:  ' + grunt.template.process('<%= suconfig.repo %>'));
    grunt.log.debug('JS:    ' + grunt.template.process('<%= suconfig.jz %>'));
    grunt.log.writeln('Theme set to ' + SUConfig.theme);
  });

  // grunt build, grunt build:theme (same as grunt build), grunt build:bootstrap or grunt build:all
  grunt.registerTask('build', 'Build customized bootstrap and css for a theme', function (target) {
    if (typeof target == 'undefined') { // if no target specified, just build theme files
      target = 'theme';
    }
    if (target == 'bootstrap' || target == 'all') {
      grunt.log.writeln('Generating bootstrap files for ' + SUConfig.theme);
      grunt.task.run([
        'copy:themeBefore', // copy theme's customized Bootstrap files into Bootstrap's build space
        'dist-css', 'concat:theme', 'uglify', 'copy:fonts', // build custom Bootstrap
        'copy:themeAfter' // copy Bootstrap's dist/ directory into theme's dist/ directory
      ]);
    }
    if (target == 'theme' || target == 'all') {
      grunt.log.writeln('Generating theme files for ' + SUConfig.theme);
      grunt.task.run([
        'less:compileSU',       // build theme's css
        'cssmin:minifySUTheme', // minify theme's css
        'less:compileSUdev',    // build theme's css with comments showing corresponding lines of .less
        'sed:devComments',      // remove user-specific paths from comments in .dev.css
      ]);
    }
  });

  grunt.registerTask('deploy',  ['copy:themeDeploy']);

  // UComm end
};
