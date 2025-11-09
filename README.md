# CTS Awards

**Contributors:** Ken Chase  
**Tags:** awards, custom-post-type, rest-api, search, filter, ajax, acf  
**Requires at least:** 4.5  
**Tested up to:** 6.8.3  
**Requires PHP:** 5.6  
**Stable tag:** 1.0.0  
**License:** GPLv2 or later  
**License URI:** https://www.gnu.org/licenses/gpl-2.0.html

A comprehensive WordPress plugin for managing awards with advanced search, filtering, and API functionality.

## Description

CTS Awards is a feature-rich WordPress plugin designed to manage awards and their recipients. Built with modern web standards, it provides a complete solution for displaying, searching, and managing award information with a user-friendly interface.

### Key Features

-   **Custom Post Type**: Awards with full WordPress integration
-   **Custom Taxonomy**: Award categories for organized classification
-   **Advanced Search & Filtering**: Search by recipient name, organization, year, and category
-   **REST API**: Complete API endpoints for integration with other applications
-   **Responsive Display**: Mobile-friendly award listings with interactive filters
-   **ACF Integration**: Uses Advanced Custom Fields for flexible data management
-   **Internationalization**: Full translation support with included POT file
-   **AJAX-Powered**: Fast, seamless user experience without page reloads

### Requirements

-   WordPress 4.5 or higher
-   PHP 5.6 or higher
-   Advanced Custom Fields plugin (required dependency)

## Development & Build Process

This plugin includes a build process for optimizing assets for production use.

### Requirements

-   Node.js and npm
-   Grunt CLI

### Setup

```bash
npm install
```

### Build Commands

-   `npm run build` - Creates production-ready files in the `dist/` directory
    -   Cleans the dist directory
    -   Copies all necessary PHP, text, and language files
    -   Minifies JavaScript files (reduces size by ~49%)
    -   Minifies CSS files (reduces size by ~18%)
-   `npm run start` - Runs the default development tasks
-   `npm run i18n` - Generates translation files
-   `npm run readme` - Converts readme.txt to README.md

### Asset Loading

The plugin automatically detects the appropriate assets to load based on the environment:

-   **Development Environment**: Loads non-minified `cts-awards.css` and `cts-awards.js` files
-   **Production Environment**: Automatically detects and loads minified `.min.css` and `.min.js` files
-   **Smart Detection**: Uses file existence to determine which assets to load - no configuration required

This ensures optimal performance in production while maintaining a smooth development workflow.

### Production Deployment

The `dist/` folder contains the production-ready version of the plugin with optimized assets. This folder is excluded from version control and should be generated during deployment.

## Installation

1. **Install Advanced Custom Fields**

    - Install and activate the Advanced Custom Fields plugin (required dependency)
    - The plugin will display an admin notice if ACF is not active

2. **Install CTS Awards**

    - Upload the `cts-awards` folder to the `/wp-content/plugins/` directory
    - Activate the plugin through the 'Plugins' menu in WordPress

3. **Setup ACF Fields**

    - Create a field group for the Awards post type
    - Add a repeater field with the name `cts_awd_rcpts` (CTS Award Recipients)
    - Configure recipient sub-fields as needed (first name, last name, organization, year, etc.)

4. **Create Award Categories**

    - Go to Awards > Award Categories in the WordPress admin
    - Create categories to organize your awards

5. **Add Awards**

    - Go to Awards > Add New to create your first award
    - Fill in the award details and add recipients using the ACF repeater field

6. **Display Awards**
    - Use the shortcode `[cts-awards]` to display awards on any page or post
    - Customize the display using shortcode attributes (see Shortcodes section)

## Custom Post Types

### Awards (`awards`)

-   **Purpose**: Store individual awards and their details
-   **Visibility**: Admin-only (not public-facing by default)
-   **Features**: Title, content, excerpt, author support
-   **Menu**: Appears in WordPress admin with awards icon
-   **REST API**: Enabled for API access
-   **Search**: Excluded from default WordPress search

## Custom Taxonomies

### Award Categories (`award_category`)

-   **Purpose**: Categorize awards for better organization
-   **Type**: Hierarchical (like categories)
-   **Visibility**: Admin interface only
-   **REST API**: Enabled for API filtering
-   **Admin**: Shows as column in awards list

## REST API Endpoints

The plugin provides a comprehensive REST API for external integrations:

### GET `/wp-json/cts-awards/v1/awards`

Retrieve awards with advanced filtering options.

**Parameters:**

-   `post_id` (integer): Get specific award by ID
-   `year` (string): Filter by recipient year
-   `category` (string): Filter by category slug or ID
-   `search` (string): Search in titles and recipient fields
-   `page` (integer): Page number for pagination (default: 1)
-   `per_page` (integer): Results per page (default: 12, max: 100)

**Example Requests:**

```
/wp-json/cts-awards/v1/awards
/wp-json/cts-awards/v1/awards?year=2023
/wp-json/cts-awards/v1/awards?category=excellence
/wp-json/cts-awards/v1/awards?search=john&page=2
```

**Response Format:**

```json
{
  "awards": [...],
  "pagination": {
    "total_awards": 50,
    "total_pages": 5,
    "current_page": 1,
    "per_page": 12
  }
}
```

## Shortcodes

### `[cts-awards]` - Main Awards Display

Display searchable, filterable awards with AJAX functionality and pagination.

**Basic Usage:**

```
[cts-awards]
```

**With Parameters:**

```
[cts-awards form="true" year="2023" category="excellence" search="john" page="1" per_page="24"]
```

**Complete Example with All Parameters:**

```
[cts-awards form="true" year="2024" post_id="123" category="innovation" search="university" page="2" per_page="12"]
```

**Available Attributes:**

-   `form` (true/false): Show the search and filter form (default: true)
-   `year` (string): Filter by specific recipient year, or "all" for all years (default: "all")
-   `post_id` (integer): Display specific award by post ID (default: empty - shows all)
-   `category` (string): Filter by award category slug or ID (default: empty - all categories)
-   `search` (string): Pre-populate search field with search term (default: empty)
-   `page` (integer): Initial page number for pagination (default: 1)
-   `per_page` (integer): Number of awards per page, 1-100 (default: 12)

**Features:**

-   **Live Search**: Real-time search across award titles and recipient information
-   **Advanced Filters**: Filter by year, category, and award name
-   **Pagination**: Navigate through results with customizable results per page
-   **Flexible Display**: Control initial filters, search terms, and pagination via shortcode attributes
-   **Responsive Design**: Mobile-friendly interface
-   **AJAX Loading**: Fast, seamless user experience

## Frequently Asked Questions

### Does this plugin require Advanced Custom Fields?

Yes, Advanced Custom Fields (ACF) is a required dependency. The plugin will display an admin notice and may not function properly without ACF installed and activated.

### How do I customize the awards display?

The plugin includes CSS classes that can be overridden using theme/page builder CSS.

### Can I use this plugin with page builders?

Yes, you can use the `[cts-awards]` shortcode in any page builder that supports WordPress shortcodes.

### Is the plugin translation-ready?

Yes, the plugin includes a POT file for translations and uses WordPress internationalization functions throughout.

## Changelog

### 1.0.0

-   Initial release
-   Custom post type for awards management
-   Custom taxonomy for award categories
-   REST API endpoints with advanced filtering
-   AJAX-powered shortcode with search and filtering
-   Advanced Custom Fields integration
-   Responsive design and mobile support
-   Internationalization support
-   Build process for optimized assets

## Upgrade Notice

### 1.0.0

Initial release of CTS Awards plugin. Provides comprehensive awards management with search, filtering, and API functionality.

## Technical Details

### File Structure

```
cts-awards/
├── cts-awards.php          # Main plugin file
├── assets/
│   ├── css/cts-awards.css  # Plugin styles
│   └── js/cts-awards.js    # AJAX functionality
├── includes/
│   ├── custom-posts.php    # Award post type registration
│   ├── custom-taxonomies.php # Award category taxonomy
│   ├── rest-apis.php       # REST API endpoints
│   └── shortcodes.php      # Shortcode implementation
└── languages/
    └── cts-awards.pot      # Translation template
```

### Hooks & Filters

The plugin provides several hooks for customization:

-   `cts_awards_before_display` - Before awards display
-   `cts_awards_after_display` - After awards display
-   Custom CSS classes for styling individual elements

### Browser Support

-   Modern browsers (Chrome, Firefox, Safari, Edge)
-   Internet Explorer 11+
-   Mobile browsers (iOS Safari, Chrome Mobile)
