# Filter by Award Functionality Fix

## Issue

The "Filter by Award" dropdown functionality was not working properly after implementing lazy loading. Users could select a specific award from the dropdown, but the filtering was not being applied correctly.

## Root Cause

The REST API parameter validation for `post_id` was too restrictive. When users selected "All Awards" (which sends an empty string), the validation callback `is_numeric($param) && $param > 0` was rejecting the request because empty strings are not numeric.

## Solution

Updated all REST API parameter validation to properly handle empty values:

### 1. Fixed `post_id` Parameter

-   **Before**: Required numeric values > 0, rejected empty strings
-   **After**: Accepts empty strings (no filter) OR valid positive integers
-   **Impact**: "All Awards" option now works correctly

### 2. Improved Parameter Type Handling

-   Updated all parameters to accept both `integer` and `string` types
-   Added custom sanitization callbacks that properly convert empty values to `null`
-   Enhanced validation callbacks to explicitly allow empty values

### 3. Enhanced Debugging

-   Added console logging for API requests and responses
-   Added parameter logging to help troubleshoot future issues

## Technical Details

### API Parameter Changes

```php
// Before
'post_id' => array(
    'type' => 'integer',
    'sanitize_callback' => 'absint',
    'validate_callback' => function ($param, $request, $key) {
        return is_numeric($param) && $param > 0;
    }
)

// After
'post_id' => array(
    'type' => ['integer', 'string'],
    'sanitize_callback' => function($param) {
        return empty($param) ? null : absint($param);
    },
    'validate_callback' => function ($param, $request, $key) {
        return empty($param) || (is_numeric($param) && intval($param) > 0);
    }
)
```

## Testing

To test the fix:

1. Load a page with the awards shortcode: `[cts-awards]`
2. Try selecting "All Awards" from the dropdown - should show all results
3. Try selecting a specific award - should filter to only that award's recipients
4. Check browser console for API request/response logging

## Files Modified

-   `includes/rest-apis.php` - Fixed parameter validation
-   `assets/js/cts-awards.js` - Added debugging logs
