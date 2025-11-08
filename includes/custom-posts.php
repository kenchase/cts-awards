<?php

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register custom post type for awards
 * 
 * @since 1.0.0
 */
function cts_awards_custom_post()
{
    $post_type_args = array(
        'labels' => array(
            'name' => __('Awards', 'cts-awards'),
            'singular_name' => __('Award', 'cts-awards'),
            'add_new' => __('Add Award', 'cts-awards'),
            'add_new_item' => __('Add New Award', 'cts-awards'),
            'edit_item' => __('Edit Award', 'cts-awards'),
            'new_item' => __('New Award', 'cts-awards'),
            'view_item' => __('View Award', 'cts-awards'),
            'view_items' => __('View Awards', 'cts-awards'),
            'search_items' => __('Search Awards', 'cts-awards'),
            'not_found' => __('No Award found', 'cts-awards'),
            'not_found_in_trash' => __('No Award found in Trash', 'cts-awards'),
            'all_items' => __('All Awards', 'cts-awards'),
            'archives' => __('Award Archives', 'cts-awards'),
            'attributes' => __('Award Attributes', 'cts-awards'),
        ),
        'public' => false,
        'publicly_queryable' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'show_in_rest' => true,
        'has_archive' => false,
        'menu_position' => 2,
        'menu_icon' => 'dashicons-awards',
        'rewrite' => false,
        'exclude_from_search' => true,
        'hierarchical' => false,
        'supports' => array('title', 'editor', 'excerpt', 'author'),
    );
    register_post_type('awards', $post_type_args);
}
add_action('init', 'cts_awards_custom_post');
