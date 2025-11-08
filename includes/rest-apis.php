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
                'type' => ['integer', 'string'],
                'sanitize_callback' => function ($param) {
                    return empty($param) ? null : absint($param);
                },
                'validate_callback' => function ($param, $request, $key) {
                    // Allow empty string/null (no filter) or valid positive integer
                    return empty($param) || (is_numeric($param) && intval($param) > 0);
                }
            ),
            'year' => array(
                'description' => 'Filter awards by recipient year',
                'type' => ['integer', 'string'],
                'sanitize_callback' => function ($param) {
                    return empty($param) || $param === 'all' ? null : absint($param);
                },
                'validate_callback' => function ($param, $request, $key) {
                    // Allow empty, "all", or valid year range
                    return empty($param) || $param === 'all' || (is_numeric($param) && intval($param) >= 1900 && intval($param) <= date('Y') + 10);
                }
            ),
            'category' => array(
                'description' => 'Filter awards by award category slug or ID',
                'type' => 'string',
                'sanitize_callback' => function ($param) {
                    return empty($param) ? null : sanitize_text_field($param);
                },
                'validate_callback' => function ($param, $request, $key) {
                    // Allow empty (no filter) or non-empty category values
                    return empty($param) || !empty(trim($param));
                }
            ),
            'search' => array(
                'description' => 'Search in award titles and recipient fields (first name, last name, organization, title, abstract title)',
                'type' => 'string',
                'sanitize_callback' => function ($param) {
                    return empty($param) ? null : sanitize_text_field($param);
                },
                'validate_callback' => function ($param, $request, $key) {
                    // Allow empty (no search) or non-empty search terms
                    return empty($param) || !empty(trim($param));
                }
            ),
            'page' => array(
                'description' => 'Page number for pagination',
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1,
                'sanitize_callback' => 'absint',
                'validate_callback' => function ($param, $request, $key) {
                    return is_numeric($param) && $param > 0;
                }
            ),
            'per_page' => array(
                'description' => 'Number of posts per page',
                'type' => 'integer',
                'default' => 12,
                'minimum' => 1,
                'maximum' => 100,
                'sanitize_callback' => 'absint',
                'validate_callback' => function ($param, $request, $key) {
                    return is_numeric($param) && $param > 0 && $param <= 100;
                }
            ),
        ),
    ));
}
add_action('rest_api_init', 'cts_awards_register_api');

/**
 * Search awards by title and custom fields
 * 
 * @param string $search_term The search term
 * @param string $category Optional category filter
 * @param int $post_id Optional specific post ID
 * @return array Array of matching post objects
 */
function cts_awards_search_posts_and_fields($search_term, $category = null, $post_id = null)
{
    global $wpdb;

    $search_term = trim($search_term);
    $post_ids = array();

    // Search in post titles first
    $title_query_args = array(
        'post_type' => 'awards',
        'post_status' => 'publish',
        's' => $search_term,
        'fields' => 'ids',
        'numberposts' => -1,
    );

    // Apply category filter if specified
    if ($category) {
        $field = is_numeric($category) ? 'term_id' : 'slug';
        $title_query_args['tax_query'] = array(
            array(
                'taxonomy' => 'award_category',
                'field' => $field,
                'terms' => $category,
            ),
        );
    }

    // Apply post_id filter if specified
    if ($post_id) {
        $title_query_args['p'] = $post_id;
    }

    $title_matches = get_posts($title_query_args);
    $post_ids = array_merge($post_ids, $title_matches);

    // Search in ACF custom fields
    if (function_exists('get_field')) {
        // Get all awards posts to search through their custom fields
        $all_awards_args = array(
            'post_type' => 'awards',
            'post_status' => 'publish',
            'numberposts' => -1,
            'fields' => 'ids',
        );

        // Apply category filter if specified
        if ($category) {
            $field = is_numeric($category) ? 'term_id' : 'slug';
            $all_awards_args['tax_query'] = array(
                array(
                    'taxonomy' => 'award_category',
                    'field' => $field,
                    'terms' => $category,
                ),
            );
        }

        // Apply post_id filter if specified
        if ($post_id) {
            $all_awards_args['p'] = $post_id;
        }

        $all_awards = get_posts($all_awards_args);

        foreach ($all_awards as $award_id) {
            $recipients = get_field('cts_awd_rcpts', $award_id);

            if ($recipients) {
                foreach ($recipients as $recipient) {
                    $searchable_fields = array(
                        isset($recipient['cts_awd_rcpt_fname']) ? $recipient['cts_awd_rcpt_fname'] : '',
                        isset($recipient['cts_awd_rcpt_lname']) ? $recipient['cts_awd_rcpt_lname'] : '',
                        isset($recipient['cts_awd_rcpt_org']) ? $recipient['cts_awd_rcpt_org'] : '',
                        isset($recipient['cts_awd_rcpt_title']) ? $recipient['cts_awd_rcpt_title'] : '',
                        isset($recipient['cts_awd_rcpt_abstr_title']) ? $recipient['cts_awd_rcpt_abstr_title'] : '',
                    );

                    foreach ($searchable_fields as $field_value) {
                        if (!empty($field_value) && stripos($field_value, $search_term) !== false) {
                            if (!in_array($award_id, $post_ids)) {
                                $post_ids[] = $award_id;
                            }
                            break 2; // Break out of both loops once we find a match for this post
                        }
                    }
                }
            }
        }
    }

    // Remove duplicates and get full post objects
    $post_ids = array_unique($post_ids);

    if (empty($post_ids)) {
        return array();
    }

    // Get the full post objects for matching IDs
    $final_query_args = array(
        'post_type' => 'awards',
        'post_status' => 'publish',
        'post__in' => $post_ids,
        'numberposts' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    );

    return get_posts($final_query_args);
}

/**
 * Get all awards with pagination support
 */
function cts_awards_get_awards($request)
{
    // Get parameters from request
    $post_id = $request->get_param('post_id');
    $year = $request->get_param('year');
    $category = $request->get_param('category');
    $search = $request->get_param('search');
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 12;

    // If search is specified, handle search logic
    if ($search) {
        $awards = cts_awards_search_posts_and_fields($search, $category, $post_id);
        // Store the search term to use later for recipient filtering
        $search_term_for_filtering = $search;
    } else {
        $search_term_for_filtering = null;
        // Build standard query args for non-search requests
        $query_args = array(
            'post_type' => 'awards',
            'post_status' => 'publish',
            'numberposts' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
        );

        // If category is specified, add taxonomy query
        if ($category) {
            // Check if category is numeric (term ID) or text (slug)
            $field = is_numeric($category) ? 'term_id' : 'slug';

            $query_args['tax_query'] = array(
                array(
                    'taxonomy' => 'award_category',
                    'field' => $field,
                    'terms' => $category,
                ),
            );
        }

        // If post_id is specified, filter by specific post
        if ($post_id) {
            $query_args['p'] = $post_id;
            $query_args['numberposts'] = 1;
        }

        $awards = get_posts($query_args);
    }

    $formatted_awards = array();

    foreach ($awards as $award) {
        // Get ACF recipients repeater field
        $recipients = array();
        $formatted_recipients = array();

        // Check if ACF is available
        if (function_exists('get_field')) {
            $recipients = get_field('cts_awd_rcpts', $award->ID);
        }

        // Check if award title matches search term (if search is active)
        $award_title_matches = false;
        if ($search_term_for_filtering) {
            $award_title_matches = stripos($award->post_title, $search_term_for_filtering) !== false;
        }

        if ($recipients) {
            foreach ($recipients as $recipient) {
                // If year parameter is specified, filter recipients by year
                if ($year && isset($recipient['cts_awd_rcpt_year']) && intval($recipient['cts_awd_rcpt_year']) != intval($year)) {
                    continue;
                }

                // Handle search filtering based on award title match
                if ($search_term_for_filtering && !$award_title_matches) {
                    // Award title doesn't match, so check recipient fields
                    $searchable_fields = array(
                        isset($recipient['cts_awd_rcpt_fname']) ? $recipient['cts_awd_rcpt_fname'] : '',
                        isset($recipient['cts_awd_rcpt_lname']) ? $recipient['cts_awd_rcpt_lname'] : '',
                        isset($recipient['cts_awd_rcpt_org']) ? $recipient['cts_awd_rcpt_org'] : '',
                        isset($recipient['cts_awd_rcpt_title']) ? $recipient['cts_awd_rcpt_title'] : '',
                        isset($recipient['cts_awd_rcpt_abstr_title']) ? $recipient['cts_awd_rcpt_abstr_title'] : '',
                    );

                    $recipient_matches = false;
                    foreach ($searchable_fields as $field_value) {
                        if (!empty($field_value) && stripos($field_value, $search_term_for_filtering) !== false) {
                            $recipient_matches = true;
                            break;
                        }
                    }

                    // If this recipient doesn't match the search term, skip it
                    if (!$recipient_matches) {
                        continue;
                    }
                }
                // If award title matches, include all recipients (no additional filtering)

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

        // If search filtering is applied and no recipients remain after filtering
        if ($search_term_for_filtering && empty($formatted_recipients)) {
            // Only skip this award if the title doesn't match either
            if (!$award_title_matches) {
                continue;
            }
            // If title matches but no recipients remain (due to year/other filters), 
            // still show the award with empty recipients
        }

        // Get award categories
        $categories = get_the_terms($award->ID, 'award_category');
        $formatted_categories = array();

        if ($categories && !is_wp_error($categories)) {
            foreach ($categories as $category) {
                $formatted_categories[] = array(
                    'id' => $category->term_id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                );
            }
        }

        $formatted_awards[] = array(
            'id' => $award->ID,
            'title' => $award->post_title,
            'content' => $award->post_content,
            'date' => $award->post_date,
            'permalink' => get_permalink($award->ID),
            'categories' => $formatted_categories,
            'recipients' => $formatted_recipients,
        );
    }

    // Since awards can have multiple recipient years, we need to create year-based cards for pagination
    $award_year_cards = array();

    foreach ($formatted_awards as $award) {
        if (!empty($award['recipients'])) {
            // Group recipients by year
            $recipients_by_year = array();

            foreach ($award['recipients'] as $recipient) {
                $recipient_year = !empty($recipient['year']) ? $recipient['year'] : 0;
                if (!isset($recipients_by_year[$recipient_year])) {
                    $recipients_by_year[$recipient_year] = array();
                }
                $recipients_by_year[$recipient_year][] = $recipient;
            }

            // Create cards for each year
            foreach ($recipients_by_year as $award_year => $year_recipients) {
                $award_year_cards[] = array(
                    'award' => $award,
                    'year' => $award_year,
                    'recipients' => $year_recipients,
                    'sort_key' => $award_year . '_' . $award['title'] // For consistent sorting
                );
            }
        } else {
            // Award with no recipients
            $award_year_cards[] = array(
                'award' => $award,
                'year' => 0,
                'recipients' => array(),
                'sort_key' => '0_' . $award['title']
            );
        }
    }

    // Sort cards by year (descending) then by award title
    usort($award_year_cards, function ($a, $b) {
        $year_comparison = $b['year'] - $a['year'];
        if ($year_comparison !== 0) return $year_comparison;
        return strcmp($a['award']['title'], $b['award']['title']);
    });

    // Calculate pagination
    $total_cards = count($award_year_cards);
    $total_pages = ceil($total_cards / $per_page);
    $offset = ($page - 1) * $per_page;
    $paginated_cards = array_slice($award_year_cards, $offset, $per_page);

    // Prepare response with pagination metadata
    $response_data = array(
        'cards' => $paginated_cards,
        'pagination' => array(
            'current_page' => $page,
            'per_page' => $per_page,
            'total_cards' => $total_cards,
            'total_pages' => $total_pages,
            'has_next_page' => $page < $total_pages,
            'has_prev_page' => $page > 1
        )
    );

    return new WP_REST_Response($response_data, 200);
}
