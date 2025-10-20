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
    // Only enqueue if not already enqueued
    if (!wp_style_is('cts-awards-style', 'enqueued')) {
        wp_enqueue_style(
            'cts-awards-style',
            plugin_dir_url(dirname(__FILE__)) . 'assets/css/cts-awards.css',
            array(),
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
 * CTS Awards Search Form Shortcode
 * 
 * Usage: [cts-awards form="true" year="all" award_name=""]
 * 
 * @param array $atts Shortcode attributes
 *   - form: true/false - Show form (true by default)
 *   - year: all by default, or specific year
 *   - award_name: none by default, or specific award name
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
            'award_name' => ''
        ),
        $atts,
        'cts-awards'
    );

    // Convert form parameter to boolean
    $show_form = filter_var($atts['form'], FILTER_VALIDATE_BOOLEAN);

    // Sanitize year parameter
    $year = sanitize_text_field($atts['year']);

    // Sanitize award_name parameter
    $award_name = sanitize_text_field($atts['award_name']);

    // Start building output
    $output = '';

    // Add form if enabled
    if ($show_form) {
        $output .= '<div class="cts-awards-search-form">';
        $output .= '<form id="cts-awards-search" method="get" 
                        data-api-url="' . esc_url(rest_url('cts-awards/v1/awards')) . '"
                        data-current-year="' . esc_attr($year) . '"
                        data-current-award="' . esc_attr($award_name) . '">';

        // Year dropdown
        $output .= '<div class="form-group">';
        $output .= '<label for="award-year">Filter by Year:</label>';
        $output .= '<select id="award-year" name="year">';
        $output .= '<option value="all"' . selected($year, 'all', false) . '>All Years</option>';
        $output .= '<option value="loading">Loading years...</option>';
        $output .= '</select>';
        $output .= '</div>';

        // Award Name dropdown
        $output .= '<div class="form-group">';
        $output .= '<label for="award-name">Filter by Award:</label>';
        $output .= '<select id="award-name" name="award_name">';
        $output .= '<option value=""' . selected($award_name, '', false) . '>All Awards</option>';
        $output .= '<option value="loading">Loading awards...</option>';
        $output .= '</select>';
        $output .= '</div>';

        // Submit button
        $output .= '<div class="form-group">';
        $output .= '<button type="submit" class="btn btn-primary">Search Awards</button>';
        $output .= '</div>';

        $output .= '</form>';
        $output .= '</div>';
    }

    // Add awards display based on parameters
    $output .= '<div class="cts-awards-results">';

    if (!empty($award_name)) {
        $output .= '<p>Showing awards for: ' . esc_html($award_name) . '</p>';
    }

    if ($year !== 'all') {
        $output .= '<p>Filtering by year: ' . esc_html($year) . '</p>';
    }

    // Query awards based on parameters
    $query_args = array(
        'post_type' => 'awards',
        'post_status' => 'publish',
        'numberposts' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    );

    // Filter by award name if specified
    if (!empty($award_name)) {
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
        usort($award_year_cards, function($a, $b) {
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
                    
                    // Recipient photo
                    if (!empty($recipient['imagects_awd_rcpt_photo'])) {
                        $photo_url = wp_get_attachment_image_url($recipient['imagects_awd_rcpt_photo'], 'thumbnail');
                        if ($photo_url) {
                            $output .= '<div class="cts-recipient-photo">';
                            $output .= '<img src="' . esc_url($photo_url) . '" alt="' . esc_attr($recipient['cts_awd_rcpt_title'] ?? 'Recipient photo') . '">';
                            $output .= '</div>';
                        }
                    }
                    
                    $output .= '<div class="cts-recipient-details">';
                    
                    // Recipient title/name
                    if (!empty($recipient['cts_awd_rcpt_title'])) {
                        $output .= '<div class="cts-recipient-title"><strong>Recipient:</strong> ' . esc_html($recipient['cts_awd_rcpt_title']) . '</div>';
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
