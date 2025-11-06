<?php

/**
 * Register custom taxonomy for award categories
 *
 * @since 1.0.0
 */
function cts_awards_custom_taxonomy()
{
    $taxonomy_args = array(
        'labels' => array(
            'name' => 'Award Categories',
            'singular_name' => 'Award Category',
            'search_items' => 'Search Award Categories',
            'all_items' => 'All Award Categories',
            'parent_item' => 'Parent Award Category',
            'parent_item_colon' => 'Parent Award Category:',
            'edit_item' => 'Edit Award Category',
            'update_item' => 'Update Award Category',
            'add_new_item' => 'Add New Award Category',
            'new_item_name' => 'New Award Category Name',
            'menu_name' => 'Award Categories',
        ),
        'hierarchical' => true,
        'public' => true,
        'show_ui' => true,
        'show_admin_column' => true,
        'show_in_nav_menus' => true,
        'show_in_rest' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'award-category'),
    );
    register_taxonomy('award_category', array('awards'), $taxonomy_args);
}
add_action('init', 'cts_awards_custom_taxonomy');
