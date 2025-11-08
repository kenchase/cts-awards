<?php

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register custom taxonomy for award categories
 *
 * @since 1.0.0
 */
function cts_awards_custom_taxonomy()
{
    $taxonomy_args = array(
        'labels' => array(
            'name' => __('Award Categories', 'cts-awards'),
            'singular_name' => __('Award Category', 'cts-awards'),
            'search_items' => __('Search Award Categories', 'cts-awards'),
            'all_items' => __('All Award Categories', 'cts-awards'),
            'parent_item' => __('Parent Award Category', 'cts-awards'),
            'parent_item_colon' => __('Parent Award Category:', 'cts-awards'),
            'edit_item' => __('Edit Award Category', 'cts-awards'),
            'update_item' => __('Update Award Category', 'cts-awards'),
            'add_new_item' => __('Add New Award Category', 'cts-awards'),
            'new_item_name' => __('New Award Category Name', 'cts-awards'),
            'menu_name' => __('Award Categories', 'cts-awards'),
        ),
        'hierarchical' => true,
        'public' => false,
        'publicly_queryable' => false,
        'show_ui' => true,
        'show_admin_column' => true,
        'show_in_nav_menus' => false,
        'show_in_rest' => true,
        'query_var' => false,
        'rewrite' => false,
    );
    register_taxonomy('award_category', array('awards'), $taxonomy_args);
}
add_action('init', 'cts_awards_custom_taxonomy');
