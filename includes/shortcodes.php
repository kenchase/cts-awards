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
 * @return array Array of award titles
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

    $award_titles = array();
    foreach ($awards as $award) {
        $award_titles[] = $award->post_title;
    }

    return $award_titles;
}

/**
 * CTS Awards Search Form Shortcode
 * 
 * Usage: [cts-awards form="true" year="all" award_name="" post_id=""]
 * 
 * @param array $atts Shortcode attributes
 *   - form: true/false - Show form (true by default)
 *   - year: all by default, or specific year
 *   - award_name: none by default, or specific award name
 *   - post_id: none by default, or specific post ID to filter by
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
            'award_name' => '',
            'post_id' => ''
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

    if (isset($_GET['award_name']) && !empty($_GET['award_name'])) {
        $award_name = sanitize_text_field($_GET['award_name']);
    } else {
        $award_name = sanitize_text_field($atts['award_name']);
    }

    if (isset($_GET['post_id']) && !empty($_GET['post_id'])) {
        $post_id = intval($_GET['post_id']);
    } else {
        $post_id = !empty($atts['post_id']) ? intval($atts['post_id']) : 0;
    }

    // Start building output
    $output = '';

    // Add form if enabled
    if ($show_form) {
        $output .= '<div class="cts-awards-search-form">';
        $output .= '<form id="cts-awards-search" method="get" 
                        data-api-url="' . esc_url(rest_url('cts-awards/v1/awards')) . '"
                        data-current-year="' . esc_attr($year) . '"
                        data-current-award="' . esc_attr($award_name) . '"
                        data-current-post-id="' . esc_attr($post_id) . '">';

        // Post ID input (hidden by default, can be shown if needed)
        if ($post_id > 0) {
            $output .= '<div class="form-group">';
            $output .= '<label for="award-post-id">Specific Award ID:</label>';
            $output .= '<input type="number" id="award-post-id" name="post_id" value="' . esc_attr($post_id) . '" min="1">';
            $output .= '</div>';
        }

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

        // Award Name dropdown
        $output .= '<div class="form-group">';
        $output .= '<label for="award-name">Filter by Award:</label>';
        $output .= '<select id="award-name" name="award_name">';
        $output .= '<option value=""' . selected($award_name, '', false) . '>All Awards</option>';

        // Get available awards
        $available_awards = cts_awards_get_available_awards();
        foreach ($available_awards as $award_title) {
            $output .= '<option value="' . esc_attr($award_title) . '"' . selected($award_name, $award_title, false) . '>' . esc_html($award_title) . '</option>';
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

    // Add awards display based on parameters
    $output .= '<div class="cts-awards-results">';

    // Display current filter information
    $filter_info = array();

    if ($post_id > 0) {
        $filter_info[] = 'Award ID: ' . $post_id;
    }

    if (!empty($award_name)) {
        $filter_info[] = 'Award: ' . esc_html($award_name);
    }

    if ($year !== 'all') {
        $filter_info[] = 'Year: ' . esc_html($year);
    }

    if (!empty($filter_info)) {
        $output .= '<div class="cts-awards-filters-info">';
        $output .= '<p><strong>Filtered by:</strong> ' . implode(' | ', $filter_info) . '</p>';
        $output .= '</div>';
    }

    // Query awards based on parameters
    $query_args = array(
        'post_type' => 'awards',
        'post_status' => 'publish',
        'numberposts' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    );

    // Filter by specific post ID if provided
    if ($post_id > 0) {
        $query_args['include'] = array($post_id);
    }

    // Filter by award name if specified (and no post_id)
    if (!empty($award_name) && $post_id === 0) {
        $query_args['meta_query'] = array(
            array(
                'key' => 'post_title',
                'value' => $award_name,
                'compare' => 'LIKE'
            )
        );
    }

    $awards = get_posts($query_args);

    // Create an array to hold individual award-year combinations
    $award_year_cards = array();

    if ($awards) {
        foreach ($awards as $award) {
            // Get ACF recipients data
            $recipients = array();
            if (function_exists('get_field')) {
                $recipients = get_field('cts_awd_rcpts', $award->ID);
            }

            if ($recipients) {
                // Group recipients by year
                $recipients_by_year = array();
                foreach ($recipients as $recipient) {
                    if (!empty($recipient['cts_awd_rcpt_year'])) {
                        $recipient_year = $recipient['cts_awd_rcpt_year'];

                        // Filter by year if specified
                        if ($year !== 'all' && $recipient_year != $year) {
                            continue;
                        }

                        if (!isset($recipients_by_year[$recipient_year])) {
                            $recipients_by_year[$recipient_year] = array();
                        }
                        $recipients_by_year[$recipient_year][] = $recipient;
                    }
                }

                // Create a separate card for each year
                foreach ($recipients_by_year as $award_year => $year_recipients) {
                    $award_year_cards[] = array(
                        'award' => $award,
                        'year' => $award_year,
                        'recipients' => $year_recipients
                    );
                }
            }
        }

        // Sort cards by year (descending) then by award title
        usort($award_year_cards, function ($a, $b) {
            // First sort by year (descending - newest first)
            $year_comparison = $b['year'] - $a['year'];
            if ($year_comparison !== 0) {
                return $year_comparison;
            }
            // Then sort by award title
            return strcmp($a['award']->post_title, $b['award']->post_title);
        });

        if (!empty($award_year_cards)) {
            $output .= '<div class="cts-awards-grid">';

            foreach ($award_year_cards as $card_data) {
                $award = $card_data['award'];
                $award_year = $card_data['year'];
                $year_recipients = $card_data['recipients'];

                // Start award-year card
                $output .= '<div class="cts-award-card cts-award-year-card">';

                // Award title with year
                $output .= '<h3 class="cts-award-title">' . esc_html($award->post_title) . ' <span class="cts-award-year-badge">(' . esc_html($award_year) . ')</span></h3>';

                // Award content/description
                if (!empty($award->post_content)) {
                    $content = wp_trim_words($award->post_content, 25, '...');
                    $output .= '<div class="cts-award-description">' . wp_kses_post($content) . '</div>';
                }

                // Display recipients for this year
                $output .= '<div class="cts-award-recipients">';

                foreach ($year_recipients as $recipient) {
                    $output .= '<div class="cts-recipient">';

                    // Recipient photo or default icon
                    $output .= '<div class="cts-recipient-photo">';

                    if (!empty($recipient['imagects_awd_rcpt_photo'])) {
                        $photo_url = wp_get_attachment_image_url($recipient['imagects_awd_rcpt_photo'], 'thumbnail');
                        if ($photo_url) {
                            // Build name for alt text
                            $photo_alt = '';
                            if (!empty($recipient['cts_awd_rcpt_fname'])) {
                                $photo_alt .= $recipient['cts_awd_rcpt_fname'];
                            }
                            if (!empty($recipient['cts_awd_rcpt_lname'])) {
                                if (!empty($photo_alt)) {
                                    $photo_alt .= ' ';
                                }
                                $photo_alt .= $recipient['cts_awd_rcpt_lname'];
                            }
                            if (empty($photo_alt)) {
                                $photo_alt = 'Recipient photo';
                            }

                            $output .= '<img src="' . esc_url($photo_url) . '" alt="' . esc_attr($photo_alt) . '">';
                        } else {
                            // Show default dashicon if photo URL is invalid
                            $output .= '<span class="dashicons dashicons-admin-users"></span>';
                        }
                    } else {
                        // Show default dashicon if no photo is set
                        $output .= '<span class="dashicons dashicons-admin-users"></span>';
                    }

                    $output .= '</div>';

                    $output .= '<div class="cts-recipient-details">';

                    // Recipient name (first name + last name)
                    $recipient_name = '';
                    if (!empty($recipient['cts_awd_rcpt_fname'])) {
                        $recipient_name .= $recipient['cts_awd_rcpt_fname'];
                    }
                    if (!empty($recipient['cts_awd_rcpt_lname'])) {
                        if (!empty($recipient_name)) {
                            $recipient_name .= ' ';
                        }
                        $recipient_name .= $recipient['cts_awd_rcpt_lname'];
                    }
                    if (!empty($recipient_name)) {
                        $output .= '<div class="cts-recipient-name"><strong>Recipient:</strong> ' . esc_html($recipient_name) . '</div>';
                    }

                    // Recipient title/position
                    if (!empty($recipient['cts_awd_rcpt_title'])) {
                        $output .= '<div class="cts-recipient-title"><strong>Title:</strong> ' . esc_html($recipient['cts_awd_rcpt_title']) . '</div>';
                    }

                    // Organization
                    if (!empty($recipient['cts_awd_rcpt_org'])) {
                        $output .= '<div class="cts-recipient-org"><strong>Organization:</strong> ' . esc_html($recipient['cts_awd_rcpt_org']) . '</div>';
                    }

                    // Abstract title
                    if (!empty($recipient['cts_awd_rcpt_abstr_title'])) {
                        $output .= '<div class="cts-recipient-abstract"><strong>Abstract:</strong> ' . esc_html($recipient['cts_awd_rcpt_abstr_title']) . '</div>';
                    }

                    $output .= '</div>'; // .cts-recipient-details
                    $output .= '</div>'; // .cts-recipient
                }

                $output .= '</div>'; // .cts-award-recipients
                $output .= '</div>'; // .cts-award-card
            }

            $output .= '</div>'; // .cts-awards-grid
        } else {
            $output .= '<div class="cts-no-awards"><p>No awards found matching your criteria.</p></div>';
        }
    } else {
        $output .= '<div class="cts-no-awards"><p>No awards found matching your criteria.</p></div>';
    }

    $output .= '</div>';

    return $output;
}

// Register the shortcode
add_shortcode('cts-awards', 'cts_awards_shortcode');
