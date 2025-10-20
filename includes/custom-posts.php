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
            'name' => 'Awards',
            'singular_name' => 'Award',
            'add_new' => 'Add Award',
            'add_new_item' => 'Add New Award',
            'edit_item' => 'Edit Award',
            'new_item' => 'New Award',
            'view_item' => 'View Award',
            'view_items' => 'View Awards',
            'search_items' => 'Search Awards',
            'not_found' => 'No Award found',
            'not_found_in_trash' => 'No Award found in Trash',
            'all_items' => 'All Awards',
            'archives' => 'Award Archives',
            'attributes' => 'Award Attributes',
        ),
        'public' => true,
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'show_in_rest' => true,
        'has_archive' => true,
        'menu_position' => 2,
        'menu_icon' => 'dashicons-awards',
        'rewrite' => array('slug' => 'awards'),
        'exclude_from_search' => false,
        'hierarchical' => false,
        'supports' => array('title', 'editor', 'excerpt', 'author'),
    );
    register_post_type('awards', $post_type_args);
}
add_action('init', 'cts_awards_custom_post');
