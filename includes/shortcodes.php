<?php

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enqueue CTS Awards assets
 */
function cts_awards_enqueue_assets()
{
    // Enqueue dashicons for frontend use
    if (!wp_style_is('dashicons', 'enqueued')) {
        wp_enqueue_style('dashicons');
    }

    // Only enqueue if not already enqueued
    if (!wp_style_is('cts-awards-style', 'enqueued')) {
        wp_enqueue_style(
            'cts-awards-style',
            plugin_dir_url(dirname(__FILE__)) . 'assets/css/cts-awards.css',
            array('dashicons'),
            '1.0.0'
        );
    }

    if (!wp_script_is('cts-awards-script', 'enqueued')) {
        wp_enqueue_script(
            'cts-awards-script',
            plugin_dir_url(dirname(__FILE__)) . 'assets/js/cts-awards.js',
            array('jquery'),
            '1.0.0',
            true
        );
    }
}

/**
 * Get available years from awards
 * 
 * @return array Array of years
 */
function cts_awards_get_available_years()
{
    $years = array();

    $awards = get_posts(array(
        'post_type' => 'awards',
        'post_status' => 'publish',
        'numberposts' => -1,
    ));

    foreach ($awards as $award) {
        if (function_exists('get_field')) {
            $recipients = get_field('cts_awd_rcpts', $award->ID);
            if ($recipients) {
                foreach ($recipients as $recipient) {
                    if (!empty($recipient['cts_awd_rcpt_year'])) {
                        $years[] = $recipient['cts_awd_rcpt_year'];
                    }
                }
            }
        }
    }

    $years = array_unique($years);
    rsort($years); // Sort years in descending order

    return $years;
}

/**
 * Get available award names
 * 
 * @return array Array of awards with ID and title
 */
function cts_awards_get_available_awards()
{
    $awards = get_posts(array(
        'post_type' => 'awards',
        'post_status' => 'publish',
        'numberposts' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ));

    $award_data = array();
    foreach ($awards as $award) {
        $award_data[] = array(
            'id' => $award->ID,
            'title' => $award->post_title
        );
    }

    return $award_data;
}

/**
 * Get available award categories
 * 
 * @return array Array of categories with ID, name, and slug
 */
function cts_awards_get_available_categories()
{
    $terms = get_terms(array(
        'taxonomy' => 'award_category',
        'hide_empty' => true,
        'orderby' => 'name',
        'order' => 'ASC',
    ));

    $category_data = array();
    if (!is_wp_error($terms) && !empty($terms)) {
        foreach ($terms as $term) {
            $category_data[] = array(
                'id' => $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug
            );
        }
    }

    return $category_data;
}

/**
 * CTS Awards Search Form Shortcode
 * 
 * Usage: [cts-awards form="true" year="all" post_id="" category=""]
 * 
 * @param array $atts Shortcode attributes
 *   - form: true/false - Show form (true by default)
 *   - year: all by default, or specific year
 *   - post_id: none by default, or specific post ID to filter by
 *   - category: none by default, or specific category slug/ID to filter by
 */
function cts_awards_shortcode($atts)
{
    // Enqueue assets when shortcode is used
    cts_awards_enqueue_assets();

    // Set default attributes
    $atts = shortcode_atts(
        array(
            'form' => 'true',
            'year' => 'all',
            'post_id' => '',
            'category' => ''
        ),
        $atts,
        'cts-awards'
    );

    // Convert form parameter to boolean
    $show_form = filter_var($atts['form'], FILTER_VALIDATE_BOOLEAN);

    // Check for URL parameters and override attributes if present
    if (isset($_GET['year']) && !empty($_GET['year'])) {
        $year = sanitize_text_field($_GET['year']);
    } else {
        $year = sanitize_text_field($atts['year']);
    }

    if (isset($_GET['post_id']) && !empty($_GET['post_id'])) {
        $post_id = intval($_GET['post_id']);
    } else {
        $post_id = !empty($atts['post_id']) ? intval($atts['post_id']) : 0;
    }

    if (isset($_GET['category']) && !empty($_GET['category'])) {
        $category = sanitize_text_field($_GET['category']);
    } else {
        $category = sanitize_text_field($atts['category']);
    }

    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $search = sanitize_text_field($_GET['search']);
    } else {
        $search = '';
    }

    // Start building output
    $output = '';

    // Add form if enabled
    if ($show_form) {
        $output .= '<div class="cts-awards-search-form">';
        $output .= '<form id="cts-awards-search" method="get" 
                        data-api-url="' . esc_url(rest_url('cts-awards/v1/awards')) . '"
                        data-current-year="' . esc_attr($year) . '"
                        data-current-post-id="' . esc_attr($post_id) . '"
                        data-current-category="' . esc_attr($category) . '"
                        data-current-search="' . esc_attr($search) . '">';

        // Search input field
        $output .= '<div class="form-group">';
        $output .= '<label for="award-search">Search Awards:</label>';
        $output .= '<input type="text" id="award-search" name="search" 
                        value="' . esc_attr($search) . '" 
                        placeholder="Search by name, organization, title, or keywords..." 
                        class="form-control" />';
        $output .= '<small class="form-text">Search across award titles and recipient information</small>';
        $output .= '</div>';

        // Award dropdown
        $output .= '<div class="form-group">';
        $output .= '<label for="award-select">Filter by Award:</label>';
        $output .= '<select id="award-select" name="post_id">';
        $output .= '<option value=""' . selected($post_id, '', false) . '>All Awards</option>';

        // Get available awards
        $available_awards = cts_awards_get_available_awards();
        foreach ($available_awards as $award) {
            $output .= '<option value="' . esc_attr($award['id']) . '"' . selected($post_id, $award['id'], false) . '>' . esc_html($award['title']) . '</option>';
        }

        $output .= '</select>';
        $output .= '</div>';

        // Year dropdown
        $output .= '<div class="form-group">';
        $output .= '<label for="award-year">Filter by Year:</label>';
        $output .= '<select id="award-year" name="year">';
        $output .= '<option value="all"' . selected($year, 'all', false) . '>All Years</option>';

        // Get available years from awards
        $available_years = cts_awards_get_available_years();
        foreach ($available_years as $available_year) {
            $output .= '<option value="' . esc_attr($available_year) . '"' . selected($year, $available_year, false) . '>' . esc_html($available_year) . '</option>';
        }

        $output .= '</select>';
        $output .= '</div>';

        // Category dropdown
        $output .= '<div class="form-group">';
        $output .= '<label for="award-category">Filter by Category:</label>';
        $output .= '<select id="award-category" name="category">';
        $output .= '<option value=""' . selected($category, '', false) . '>All Categories</option>';

        // Get available categories
        $available_categories = cts_awards_get_available_categories();
        foreach ($available_categories as $cat) {
            $output .= '<option value="' . esc_attr($cat['slug']) . '"' . selected($category, $cat['slug'], false) . '>' . esc_html($cat['name']) . '</option>';
        }

        $output .= '</select>';
        $output .= '</div>';

        // Submit button
        $output .= '<div class="form-group">';
        $output .= '<button type="submit" class="btn btn-primary">Search Awards</button>';
        $output .= '<button type="button" class="btn btn-secondary" id="reset-filters">Reset Filters</button>';
        $output .= '</div>';

        $output .= '</form>';
        $output .= '</div>';
    }

    // Add awards display container - JavaScript will populate this via REST API
    $output .= '<div class="cts-awards-results">';
    $output .= '<div class="cts-loading"><p>Loading awards...</p></div>';
    $output .= '</div>';

    return $output;
}

// Register the shortcode
add_shortcode('cts-awards', 'cts_awards_shortcode');
