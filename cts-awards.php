<?php

/**
 * Plugin Name:     CTS Awards
 * Plugin URI:      https://www.dalendesign.com/
 * Description:     CTS Awards custom post type with search and filtering functionality.
 * Author:          Dalen Design
 * Author URI:      https://www.dalendesign.com/
 * Text Domain:     cts-awards
 * Domain Path:     /languages
 * Version:         1.0.0
 *
 * @package         CTSAwards
 */

// Your code starts here.

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Load plugin text domain for translations
 * 
 * @since 1.0.0
 */
function cts_awards_load_textdomain() {
    load_plugin_textdomain(
        'cts-awards',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages/'
    );
}
add_action('plugins_loaded', 'cts_awards_load_textdomain');

/**
 * Check if Advanced Custom Fields is active
 * 
 * @since 1.0.0
 * @return bool
 */
function cts_awards_is_acf_active()
{
    return function_exists('get_field');
}

/**
 * Display admin notice if ACF is not active
 * 
 * @since 1.0.0
 */
function cts_awards_acf_missing_notice()
{
    if (!cts_awards_is_acf_active()) {
        echo '<div class="notice notice-error"><p>';
        printf(
            '<strong>%s:</strong> %s',
            esc_html__('CTS Awards', 'cts-awards'),
            esc_html__('This plugin requires Advanced Custom Fields to be installed and activated.', 'cts-awards')
        );
        echo '</p></div>';
    }
}
add_action('admin_notices', 'cts_awards_acf_missing_notice');

// Include required files
require_once plugin_dir_path(__FILE__) . 'includes/custom-posts.php';
require_once plugin_dir_path(__FILE__) . 'includes/custom-taxonomies.php';
require_once plugin_dir_path(__FILE__) . 'includes/rest-apis.php';
require_once plugin_dir_path(__FILE__) . 'includes/shortcodes.php';
