/**
 * Deactivate test categories based on name pattern
 *
 * @param {Object} context - Execution context
 * @param {string} context.params.name - Name pattern to search for in category names
 * @param {boolean} context.params.update_records - Whether to actually update records (default: false for dry run)
 * @param {boolean} context.params.show_output - Whether to display real-time output (default: false)
 * @returns {Object} Processing results
 */
function deactivateTestCategories(context) {
    // Import NetSuite modules
    var query = require('N/query');
    var record = require('N/record');
    var log = require('N/log');

    // Extract and validate parameters
    var params = context.params || {};
    var name = (params.name || '').trim();
    var update_records = params.update_records === true; // Boolean to control updates
    var show_output = params.show_output === true; // Boolean to control output display

    // Use console.log for real-time output (will be captured if show_output=true)
    if (show_output) {
        console.log('Starting category deactivation process...');
        console.log('Name pattern: ' + name);
        console.log('Update Records: ' + (update_records ? 'Yes' : 'No (Dry Run)'));
        console.log('Target List: CUSTOMLIST_SQRT_QUERY_CATEGORIES');
    }

    // Initialize output
    var output = {
        success: true,
        processed_count: 0,
        found_count: 0,
        errors: []
    };

    // Validate inputs
    if (!name || name.length === 0) {
        output.success = false;
        output.errors.push('Name parameter is required and cannot be empty');
        if (show_output) {
            console.error('Validation failed: Name parameter is required');
        }
        return output;
    }

    if (show_output) {
        console.log('Input validation passed');
    }

    try {
        // Build SuiteQL query to find matching categories
        var suiteQL = `
            SELECT id, name, isinactive
            FROM CUSTOMLIST_SQRT_QUERY_CATEGORIES
            WHERE name LIKE '%` + name + `%'
            ORDER BY name
        `;

        if (show_output) {
            console.log('Executing query to find matching categories...');
            console.log('Query: ' + suiteQL);
        }

        // Execute the query using SuiteQL within stored procedure context
        var categories = suiteql.query(suiteQL);

        if (show_output) {
            console.log('Query executed. Success: ' + categories.success);
        }

        if (categories.success && categories.records) {
            output.found_count = categories.records.length;

            if (show_output) {
                console.log('Found ' + output.found_count + ' matching categories');
            }

            // Process each category
            categories.records.forEach(function(category) {
                try {
                    var categoryId = category.id;
                    var categoryName = category.name;
                    var isCurrentlyInactive = category.isinactive;

                    if (show_output) {
                        console.log('Processing category: "' + categoryName + '" (ID: ' + categoryId + ')');
                        console.log('Current status: ' + (isCurrentlyInactive ? 'Inactive' : 'Active'));
                    }

                    // Skip if already inactive
                    if (isCurrentlyInactive) {
                        if (show_output) {
                            console.log('Skipping - already inactive: ' + categoryName);
                        }
                        return; // Continue to next category
                    }

                    // Update category to inactive
                    if (update_records) {
                        var updateResult = dml.update(
                            "UPDATE CUSTOMLIST_SQRT_QUERY_CATEGORIES SET isinactive = true WHERE id = " + categoryId
                        );

                        if (updateResult.success) {
                            output.processed_count++;
                            if (show_output) {
                                console.log('✓ Successfully deactivated: "' + categoryName + '" (ID: ' + categoryId + ')');
                            }
                        } else {
                            var errorMsg = 'Failed to update category "' + categoryName + '": ' + (updateResult.error || 'Unknown error');
                            output.errors.push(errorMsg);
                            if (show_output) {
                                console.error('✗ ' + errorMsg);
                            }
                        }
                    } else {
                        // Dry run mode
                        output.processed_count++;
                        if (show_output) {
                            console.log('✓ Would deactivate: "' + categoryName + '" (ID: ' + categoryId + ') [DRY RUN]');
                        }
                    }

                } catch (e) {
                    var errorMsg = 'Error processing category ID ' + category.id + ': ' + e.message;
                    output.errors.push(errorMsg);
                    if (show_output) {
                        console.error('✗ ' + errorMsg);
                    }
                }
            });

            if (show_output) {
                console.log('Category processing completed');
            }

        } else {
            var errorMsg = 'Query failed or returned no results: ' + (categories.error || 'Unknown error');
            output.errors.push(errorMsg);
            if (show_output) {
                console.error(errorMsg);
            }
        }

    } catch (e) {
        output.success = false;
        var errorMsg = 'Query or execution failed: ' + e.message;
        output.errors.push(errorMsg);
        if (show_output) {
            console.error(errorMsg);
        }
    }

    // Log execution for debugging
    log.debug({
        title: 'Deactivate Test Categories Procedure',
        details: 'Found ' + output.found_count + ' categories, processed ' + output.processed_count + ' with ' + output.errors.length + ' errors'
    });

    // Final output summary
    if (show_output) {
        console.log('=== EXECUTION SUMMARY ===');
        console.log('Categories found: ' + output.found_count);
        console.log('Categories processed: ' + output.processed_count);
        console.log('Errors encountered: ' + output.errors.length);
        console.log('Records updated: ' + (update_records ? 'Yes' : 'No (Dry Run)'));
        console.log('Execution completed successfully: ' + (output.success ? 'Yes' : 'No'));
        if (output.errors.length > 0) {
            console.log('Error details:');
            output.errors.forEach(function(error, index) {
                console.log('  ' + (index + 1) + '. ' + error);
            });
        }
    }

    return output;
}