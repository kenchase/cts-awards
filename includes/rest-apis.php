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
        'args' => array(
            'post_id' => array(
                'description' => 'Filter awards by specific post ID',
                'type' => 'integer',
                'sanitize_callback' => 'absint',
                'validate_callback' => function ($param, $request, $key) {
                    return is_numeric($param) && $param > 0;
                }
            ),
            'year' => array(
                'description' => 'Filter awards by recipient year',
                'type' => 'integer',
                'sanitize_callback' => 'absint',
                'validate_callback' => function ($param, $request, $key) {
                    return is_numeric($param) && $param >= 1900 && $param <= date('Y') + 10;
                }
            ),
        ),
    ));
}
add_action('rest_api_init', 'cts_awards_register_api');

/**
 * Get all awards
 */
function cts_awards_get_awards($request)
{
    // Get parameters from request
    $post_id = $request->get_param('post_id');
    $year = $request->get_param('year');

    // Build query args
    $query_args = array(
        'post_type' => 'awards',
        'post_status' => 'publish',
        'numberposts' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    );

    // If post_id is specified, filter by specific post
    if ($post_id) {
        $query_args['p'] = $post_id;
        $query_args['numberposts'] = 1;
    }

    $awards = get_posts($query_args);

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
                // If year parameter is specified, filter recipients by year
                if ($year && isset($recipient['cts_awd_rcpt_year']) && intval($recipient['cts_awd_rcpt_year']) != intval($year)) {
                    continue;
                }

                $photo_url = null;
                if (!empty($recipient['imagects_awd_rcpt_photo'])) {
                    $photo_url = wp_get_attachment_image_url($recipient['imagects_awd_rcpt_photo'], 'full');
                }

                $formatted_recipients[] = array(
                    'year' => isset($recipient['cts_awd_rcpt_year']) ? $recipient['cts_awd_rcpt_year'] : '',
                    'fname' => isset($recipient['cts_awd_rcpt_fname']) ? $recipient['cts_awd_rcpt_fname'] : '',
                    'lname' => isset($recipient['cts_awd_rcpt_lname']) ? $recipient['cts_awd_rcpt_lname'] : '',
                    'title' => isset($recipient['cts_awd_rcpt_title']) ? $recipient['cts_awd_rcpt_title'] : '',
                    'organization' => isset($recipient['cts_awd_rcpt_org']) ? $recipient['cts_awd_rcpt_org'] : '',
                    'abstract_title' => isset($recipient['cts_awd_rcpt_abstr_title']) ? $recipient['cts_awd_rcpt_abstr_title'] : '',
                    'photo' => $photo_url,
                );
            }
        }

        // If year filtering is applied and no recipients match, skip this award
        if ($year && empty($formatted_recipients)) {
            continue;
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
