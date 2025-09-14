/*

Enhanced SuiteQL Tool - Synthetic Functions Documentation

Synthetic functions allow you to create custom JavaScript-based SQL functions that can be called inline in queries.

SYNTAX:
CREATE OR REPLACE FUNCTION function_name AS
function function_name(context) {
    // function body with access to context.params
    return result;
}

IMPORTANT NOTES:
- The function name after CREATE OR REPLACE FUNCTION must match the JavaScript function name
- Case sensitivity is preserved during creation and lookup is case-insensitive during execution
- The function must accept a single 'context' parameter containing params
- Access parameters via context.params.parameter_name
- Return any JavaScript data type (string, number, object, array, etc.)

USAGE EXAMPLES:
1. Create the function using CREATE OR REPLACE FUNCTION (execute the statement below)
2. Use the function in queries like: SELECT parse_full_address(billing_address).city FROM customers
3. Access object properties: SELECT function_name(param).property FROM table
4. Use with literal values: SELECT function_name('literal_value') FROM dual

*/

/**
 * Parse a full address string into components
 *
 * @param {Object} context - Execution context
 * @param {string} context.params.full_address - Full address string to parse
 * @returns {Object} Address components (street, city, state, zip, country)
 */
function parse_full_address(context) {
    // Import NetSuite modules if needed
    var log = require('N/log');

    // Extract parameter from context
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
        log.debug({
            title: 'parse_full_address',
            details: 'Empty or invalid input: ' + full_address
        });
        return result;
    }

    // Trim the input to remove leading/trailing whitespace
    full_address = full_address.trim();

    try {
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

        log.debug({
            title: 'parse_full_address',
            details: 'Successfully parsed address: ' + JSON.stringify(result)
        });

    } catch (error) {
        log.error({
            title: 'parse_full_address error',
            details: 'Error parsing address: ' + error.message
        });
    }

    return result;
}