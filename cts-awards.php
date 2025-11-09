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

// Define plugin constants
if (!defined('CTS_AWARDS_VERSION')) {
    define('CTS_AWARDS_VERSION', '1.0.0');
}

if (!defined('CTS_AWARDS_PLUGIN_DIR')) {
    define('CTS_AWARDS_PLUGIN_DIR', plugin_dir_path(__FILE__));
}

if (!defined('CTS_AWARDS_PLUGIN_URL')) {
    define('CTS_AWARDS_PLUGIN_URL', plugin_dir_url(__FILE__));
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
    // Only show to users who can install plugins
    if (!current_user_can('install_plugins')) {
        return;
    }
    
    if (!cts_awards_is_acf_active()) {
        $message = sprintf(
            '<strong>%s:</strong> %s',
            esc_html__('CTS Awards', 'cts-awards'),
            esc_html__('This plugin requires Advanced Custom Fields to be installed and activated.', 'cts-awards')
        );
        
        printf('<div class="notice notice-error"><p>%s</p></div>', $message);
    }
}
add_action('admin_notices', 'cts_awards_acf_missing_notice');

/**
 * Plugin activation hook
 * 
 * @since 1.0.0
 */
function cts_awards_activation_hook()
{
    // Check if ACF is active on activation
    if (!cts_awards_is_acf_active()) {
        wp_die(
            esc_html__('CTS Awards requires Advanced Custom Fields to be installed and activated.', 'cts-awards'),
            esc_html__('Plugin Activation Error', 'cts-awards'),
            array('back_link' => true)
        );
    }
    
    // Flush rewrite rules to ensure custom post types work
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'cts_awards_activation_hook');

/**
 * Plugin deactivation hook
 * 
 * @since 1.0.0
 */
function cts_awards_deactivation_hook()
{
    // Flush rewrite rules on deactivation
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'cts_awards_deactivation_hook');

// Include required files
require_once plugin_dir_path(__FILE__) . 'includes/custom-posts.php';
require_once plugin_dir_path(__FILE__) . 'includes/custom-taxonomies.php';
require_once plugin_dir_path(__FILE__) . 'includes/rest-apis.php';
require_once plugin_dir_path(__FILE__) . 'includes/shortcodes.php';
