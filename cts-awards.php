<?php

/**
 * Plugin Name:     CTS Awards
 * Plugin URI:      https://www.dalendesign.com/
 * Description:     CTS Awards custom post type with search and filtering functionality.
 * Author:          Dalen Design
 * Author URI:      https://www.dalendesign.com/
 * Text Domain:     cts-awards
 * Domain Path:     /languages
 * Version:         0.1.0
 *
 * @package         CTSAwards
 */

// Your code starts here.

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Include required files
require_once plugin_dir_path(__FILE__) . 'includes/custom-posts.php';
require_once plugin_dir_path(__FILE__) . 'includes/custom-taxonomies.php';
require_once plugin_dir_path(__FILE__) . 'includes/rest-apis.php';
require_once plugin_dir_path(__FILE__) . 'includes/shortcodes.php';
