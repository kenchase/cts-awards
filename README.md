# CTS Awards Plugin

A WordPress plugin for managing and displaying awards with search and filtering functionality.

## Description

The CTS Awards plugin provides a comprehensive system for managing awards and their recipients. It features a custom post type for awards, taxonomies for categorization, and a powerful search interface with REST API integration.

## Features

-   ✅ Custom post type for awards management
-   🏷️ Award categories taxonomy
-   🔍 Advanced search and filtering
-   📱 Responsive design with lazy loading
-   🚀 REST API integration
-   👥 Multiple recipients per award
-   📅 Year-based filtering
-   🖼️ Photo support for recipients

## Requirements

-   WordPress 5.0 or higher
-   PHP 7.4 or higher
-   **Advanced Custom Fields (ACF) Pro** - Required for recipient data management

## Installation

1. Upload the plugin files to `/wp-content/plugins/cts-awards/`
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Ensure Advanced Custom Fields Pro is installed and activated
4. Configure ACF fields for award recipients (see ACF Configuration section)

## Usage

### Basic Shortcode

Display awards with search form:

```
[cts-awards]
```

### Shortcode Parameters

| Parameter  | Default | Description               |
| ---------- | ------- | ------------------------- |
| `form`     | `true`  | Show/hide search form     |
| `year`     | `all`   | Filter by specific year   |
| `post_id`  | `""`    | Show specific award by ID |
| `category` | `""`    | Filter by category slug   |

### Examples

```html
<!-- Display all awards with search form -->
[cts-awards]

<!-- Display awards without search form -->
[cts-awards form="false"]

<!-- Display awards from 2023 only -->
[cts-awards year="2023"]

<!-- Display specific award -->
[cts-awards post_id="123"]

<!-- Display awards from specific category -->
[cts-awards category="excellence-award"]

<!-- Combined filters -->
[cts-awards year="2023" category="excellence-award" form="true"]
```

### URL Parameters

The plugin supports URL parameters for bookmarkable searches:

-   `?year=2023` - Filter by year
-   `?category=excellence-award` - Filter by category
-   `?search=john+doe` - Search term
-   `?post_id=123` - Specific award

## ACF Configuration

The plugin requires the following ACF field setup:

### Field Group: Award Recipients

-   **Field Name:** `cts_awd_rcpts`
-   **Field Type:** Repeater
-   **Sub-fields:**
    -   `cts_awd_rcpt_year` (Number) - Recipient year
    -   `cts_awd_rcpt_fname` (Text) - First name
    -   `cts_awd_rcpt_lname` (Text) - Last name
    -   `cts_awd_rcpt_title` (Text) - Job title
    -   `cts_awd_rcpt_org` (Text) - Organization
    -   `cts_awd_rcpt_abstr_title` (Text) - Abstract title
    -   `imagects_awd_rcpt_photo` (Image) - Recipient photo

**Location Rules:** Post Type equals Awards

## REST API

### Endpoint

```
GET /wp-json/cts-awards/v1/awards
```

### Parameters

| Parameter  | Type    | Description                            |
| ---------- | ------- | -------------------------------------- |
| `search`   | string  | Search in titles and recipient fields  |
| `year`     | integer | Filter by recipient year               |
| `category` | string  | Category slug or ID                    |
| `post_id`  | integer | Specific award ID                      |
| `page`     | integer | Page number (default: 1)               |
| `per_page` | integer | Items per page (default: 12, max: 100) |

### Example Response

```json
{
	"cards": [
		{
			"award": {
				"id": 123,
				"title": "Excellence Award",
				"content": "Award description...",
				"categories": [
					{
						"id": 1,
						"name": "Excellence",
						"slug": "excellence"
					}
				]
			},
			"year": 2023,
			"recipients": [
				{
					"year": "2023",
					"fname": "John",
					"lname": "Doe",
					"title": "Director",
					"organization": "Example Corp",
					"abstract_title": "Innovation in Technology",
					"photo": "https://example.com/photo.jpg"
				}
			]
		}
	],
	"pagination": {
		"current_page": 1,
		"per_page": 12,
		"total_cards": 25,
		"total_pages": 3,
		"has_next_page": true,
		"has_prev_page": false
	}
}
```

## File Structure

```
cts-awards/
├── cts-awards.php          # Main plugin file
├── README.md               # This file
├── assets/
│   ├── css/
│   │   └── cts-awards.css  # Plugin styles
│   └── js/
│       └── cts-awards.js   # Frontend JavaScript
└── includes/
    ├── custom-posts.php    # Awards post type
    ├── custom-taxonomies.php # Award categories
    ├── rest-apis.php       # REST API endpoints
    └── shortcodes.php      # Shortcode implementation
```

## Development

### CSS Custom Properties

The plugin uses CSS custom properties for easy theming:

```css
:root {
	--text-slate-900: #0f172a;
	--bg-white: #ffffff;
	--bg-blue-600: #0073aa;
	/* ... more variables */
}
```

### JavaScript Events

The plugin fires custom events for integration:

```javascript
// Listen for search completion
document.addEventListener("ctsAwardsSearchComplete", function (event) {
	console.log("Search completed:", event.detail);
});
```

## Troubleshooting

### Common Issues

**"ACF plugin is required" notice**

-   Install and activate Advanced Custom Fields Pro
-   Ensure ACF fields are properly configured

**Awards not displaying**

-   Check that awards are published
-   Verify ACF field names match the configuration
-   Check browser console for JavaScript errors

**Search not working**

-   Ensure REST API is accessible: `/wp-json/cts-awards/v1/awards`
-   Check for JavaScript errors in browser console
-   Verify permalink structure is not set to "Plain"

### Debug Mode

Add to wp-config.php for debugging:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Check logs in `/wp-content/debug.log`

## Hooks and Filters

### Available Hooks

```php
// Modify award query arguments
add_filter('cts_awards_query_args', function($args) {
    // Modify $args
    return $args;
});

// Customize REST API response
add_filter('cts_awards_api_response', function($response) {
    // Modify $response
    return $response;
});
```

## Support

For support and bug reports:

1. Check the troubleshooting section
2. Enable WordPress debug mode
3. Check browser console for errors
4. Contact the development team with detailed error information

## Changelog

### 1.0.0

-   Initial release
-   Award custom post type
-   Search and filtering functionality
-   REST API integration
-   Responsive design with lazy loading

---

**Author:** Dalen Design  
**Version:** 1.0.0  
**License:** GPL v2 or later
