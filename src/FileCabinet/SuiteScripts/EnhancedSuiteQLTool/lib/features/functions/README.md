/*

Sample command to create function in NetSuite - executed inside the query window

This would create a javascript file in the SuiteScripts/EnhancedSuiteQLTool/lib/features/functions/ directory named parse_full_address.js

Usage Examples:
1. Create the function using CREATE OR REPLACE FUNCTION (execute the statement below)
2. Use the function in queries like: SELECT parse_full_address(billing_address).city FROM customers

*/

CREATE OR REPLACE FUNCTION parse_full_address AS
function parse_full_address(context) {
    var full_address = context.params.full_address || '';
    
    // Initialize output object
    var result = {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
    };

    // Exit early if input is empty
    if (!full_address || typeof full_address !== 'string') {
        return result;
    }

    // Trim the input to remove leading/trailing whitespace
    full_address = full_address.trim();

    // Street: Everything before first comma
    var streetMatch = full_address.match(/^[^,]+/);
    result.street = streetMatch ? streetMatch[0].trim() : '';

    // City: Between first and second comma, or before state if no second comma
    var cityMatch = full_address.match(/,([^,]+),[^,]+,\s*[A-Z]{2}/) || full_address.match(/,([^,]+),\s*[A-Z]{2}/);
    result.city = cityMatch ? cityMatch[1].trim() : '';

    // State: 2-letter code before zip or country
    var stateMatch = full_address.match(/,\s*([A-Z]{2})\s*\d{5}/) || full_address.match(/,\s*([A-Z]{2})\s*,/);
    result.state = stateMatch ? stateMatch[1].trim() : '';

    // Zip: 5-digit or 5+4 format
    var zipMatch = full_address.match(/(\d{5}(?:-\d{4})?)/);
    result.zip = zipMatch ? zipMatch[1].trim() : '';

    // Country: Last component after comma, if present
    var countryMatch = full_address.match(/,([^,]+)$/);
    result.country = countryMatch ? countryMatch[1].trim() : '';

    return result;
}