# Lazy Loading Implementation

## Overview
This implementation adds lazy loading functionality to the CTS Awards plugin, showing a maximum of 12 posts on initial page load and loading additional posts as the user scrolls down.

## Features
- **Initial Load**: Shows 12 award cards maximum on page load
- **Lazy Loading**: Automatically loads more content when user scrolls within 300px of the bottom
- **Visual Indicators**: Shows loading states and scroll indicators
- **Performance**: Throttled scroll events to prevent excessive API calls
- **Responsive**: Works across all device sizes

## Technical Details

### REST API Changes
- Added `page` and `per_page` parameters to the REST API endpoint
- Modified response format to include pagination metadata
- Returns card-based data structure for consistent pagination

### JavaScript Changes
- Added global pagination state tracking
- Implemented scroll event listener with throttling
- Added lazy loading logic with automatic content appending
- Enhanced loading states for better UX

### CSS Changes
- Added styles for loading indicators
- Added scroll indicator styling
- Maintained responsive design principles

## API Response Format
```json
{
  "cards": [
    {
      "award": { /* award object */ },
      "year": 2023,
      "recipients": [ /* recipient array */ ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 12,
    "total_cards": 48,
    "total_pages": 4,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

## Usage
No changes required for existing shortcode usage:
```
[cts-awards form="true"]
```

The lazy loading is automatically active and will:
1. Show first 12 cards immediately
2. Load more cards when user scrolls near bottom
3. Display appropriate loading indicators
4. Show "scroll to load more" hint when applicable

## Configuration
The number of posts per page (12) can be modified in the REST API by changing the default value of the `per_page` parameter in `includes/rest-apis.php`.