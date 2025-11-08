module.exports = function( grunt ) {

	'use strict';

	// Project configuration
	grunt.initConfig( {

		pkg: grunt.file.readJSON( 'package.json' ),

		clean: {
			dist: ['dist/']
		},
		
		copy: {
			dist: {
				files: [
					{
						expand: true,
						src: [
							'**/*.php',
							'**/*.txt',
							'**/*.md',
							'languages/**/*',
							'assets/images/**/*',
							'!node_modules/**',
							'!dist/**',
							'!.git/**'
						],
						dest: 'dist/'
					}
				]
			}
		},
		
		uglify: {
			dist: {
				files: [{
					expand: true,
					src: ['assets/js/**/*.js', '!assets/js/**/*.min.js'],
					dest: 'dist/',
					ext: '.min.js'
				}]
			}
		},
		
		cssmin: {
			dist: {
				files: [{
					expand: true,
					src: ['assets/css/**/*.css', '!assets/css/**/*.min.css'],
					dest: 'dist/',
					ext: '.min.css'
				}]
			}
		},

		addtextdomain: {
			options: {
				textdomain: 'cts-awards',
			},
			update_all_domains: {
				options: {
					updateDomains: true
				},
				src: [ '*.php', '**/*.php', '!\.git/**/*', '!bin/**/*', '!node_modules/**/*', '!tests/**/*' ]
			}
		},

		wp_readme_to_markdown: {
			your_target: {
				files: {
					'README.md': 'readme.txt'
				}
			},
		},

		makepot: {
			target: {
				options: {
					domainPath: '/languages',
					exclude: [ '\.git/*', 'bin/*', 'node_modules/*', 'tests/*' ],
					mainFile: 'cts-awards.php',
					potFilename: 'cts-awards.pot',
					potHeaders: {
						poedit: true,
						'x-poedit-keywordslist': true
					},
					type: 'wp-plugin',
					updateTimestamp: true
				}
			}
		},
	} );

	grunt.loadNpmTasks( 'grunt-wp-i18n' );
	grunt.loadNpmTasks( 'grunt-wp-readme-to-markdown' );
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask( 'default', [ 'i18n','readme' ] );
	grunt.registerTask( 'i18n', ['addtextdomain', 'makepot'] );
	grunt.registerTask( 'readme', ['wp_readme_to_markdown'] );
	grunt.registerTask('build', ['clean:dist', 'copy:dist', 'uglify:dist', 'cssmin:dist']);

	grunt.util.linefeed = '\n';

};
