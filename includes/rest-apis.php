<?php

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register simple REST API endpoint for awards
 * 
 * @since 1.0.0
 */
function cts_awards_register_api()
{
    register_rest_route('cts-awards/v1', '/awards', array(
        'methods' => 'GET',
        'callback' => 'cts_awards_get_awards',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'cts_awards_register_api');

/**
 * Get all awards
 */
function cts_awards_get_awards($request)
{
    $awards = get_posts(array(
        'post_type' => 'awards',
        'post_status' => 'publish',
        'numberposts' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ));

    $formatted_awards = array();

    foreach ($awards as $award) {
        // Get ACF recipients repeater field
        $recipients = array();
        $formatted_recipients = array();

        // Check if ACF is available
        if (function_exists('get_field')) {
            $recipients = get_field('cts_awd_rcpts', $award->ID);
        }

        if ($recipients) {
            foreach ($recipients as $recipient) {
                $photo_url = null;
                if (!empty($recipient['imagects_awd_rcpt_photo'])) {
                    $photo_url = wp_get_attachment_image_url($recipient['imagects_awd_rcpt_photo'], 'full');
                }

                $formatted_recipients[] = array(
                    'year' => isset($recipient['cts_awd_rcpt_year']) ? $recipient['cts_awd_rcpt_year'] : '',
                    'title' => isset($recipient['cts_awd_rcpt_title']) ? $recipient['cts_awd_rcpt_title'] : '',
                    'organization' => isset($recipient['cts_awd_rcpt_org']) ? $recipient['cts_awd_rcpt_org'] : '',
                    'abstract_title' => isset($recipient['cts_awd_rcpt_abstr_title']) ? $recipient['cts_awd_rcpt_abstr_title'] : '',
                    'photo' => $photo_url,
                );
            }
        }

        $formatted_awards[] = array(
            'id' => $award->ID,
            'title' => $award->post_title,
            'content' => $award->post_content,
            'date' => $award->post_date,
            'permalink' => get_permalink($award->ID),
            'recipients' => $formatted_recipients,
        );
    }

    // Sort awards by title first, then by the latest year in recipients
    usort($formatted_awards, function ($a, $b) {
        // First sort by title
        $title_comparison = strcmp($a['title'], $b['title']);
        if ($title_comparison !== 0) {
            return $title_comparison;
        }

        // If titles are the same, sort by latest year in recipients (descending)
        $latest_year_a = 0;
        $latest_year_b = 0;

        if (!empty($a['recipients'])) {
            foreach ($a['recipients'] as $recipient) {
                if (!empty($recipient['year']) && $recipient['year'] > $latest_year_a) {
                    $latest_year_a = $recipient['year'];
                }
            }
        }

        if (!empty($b['recipients'])) {
            foreach ($b['recipients'] as $recipient) {
                if (!empty($recipient['year']) && $recipient['year'] > $latest_year_b) {
                    $latest_year_b = $recipient['year'];
                }
            }
        }

        // Sort by year descending (newest first)
        return $latest_year_b - $latest_year_a;
    });

    return new WP_REST_Response($formatted_awards, 200);
}
