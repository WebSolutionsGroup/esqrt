/*

Sample command to create a stored procedure in NetSuite - executed inside the query window

This would create a javascript file in the SuiteScripts/EnhancedSuiteQLTool/lib/features/storedProcedures/ directory named apply_discount.js

Usage Examples:
1. Create the procedure using CREATE OR REPLACE PROCEDURE (execute the statement below)
2. Execute the procedure like: CALL apply_discount(transaction_type='salesorder', threshold_amount=1000, update_records=false)

*/

CREATE OR REPLACE PROCEDURE apply_discount AS
function apply_discount(context) {
    // Import NetSuite modules
    var query = require('N/query');
    var record = require('N/record');
    var log = require('N/log');

    // Extract and validate parameters
    var params = context.params || {};
    var transaction_type = (params.transaction_type || '').toLowerCase().trim();
    var threshold_amount = parseFloat(params.threshold_amount) || 0;
    var update_records = params.update_records === true; // Boolean to control updates
    var valid_types = ['salesorder', 'invoice', 'estimate'];

    // Initialize output
    var output = {
        success: true,
        processed_count: 0,
        total_discount: 0,
        errors: []
    };

    // Validate inputs
    if (!valid_types.includes(transaction_type)) {
        output.success = false;
        output.errors.push('Invalid transaction_type. Must be one of: ' + valid_types.join(', '));
        return output;
    }
    if (isNaN(threshold_amount) || threshold_amount < 0) {
        output.success = false;
        output.errors.push('threshold_amount must be a positive number');
        return output;
    }

    try {
        // Build SuiteQL query
        var suiteQL = `
            SELECT id, tranid, total
            FROM transaction
            WHERE recordtype = ?
            AND total > ?
            AND isinactive = 'F'
        `;
        var results = query.runSuiteQLPaged({
            query: suiteQL,
            params: [transaction_type, threshold_amount],
            pageSize: 100
        }).iterator();

        // Iterate through results
        results.each(function(page) {
            var pageData = page.value.data.asMappedResults();
            pageData.forEach(function(row) {
                try {
                    var tranId = row.id;
                    var tranTotal = parseFloat(row.total);
                    var discount = tranTotal * 0.1; // 10% discount

                    // Update record if requested (e.g., set custom field)
                    if (update_records) {
                        record.submitFields({
                            type: transaction_type,
                            id: tranId,
                            values: {
                                custbody_discount_applied: discount
                            },
                            options: { ignoreMandatoryFields: true }
                        });
                    }

                    // Update output
                    output.processed_count++;
                    output.total_discount += discount;
                } catch (e) {
                    output.errors.push('Error processing transaction ID ' + row.id + ': ' + e.message);
                }
            });
            return true; // Continue to next page
        });
    } catch (e) {
        output.success = false;
        output.errors.push('Query or execution failed: ' + e.message);
    }

    // Log execution for debugging
    log.debug({
        title: 'Apply Discount Procedure',
        details: 'Processed ' + output.processed_count + ' transactions with total discount $' + output.total_discount
    });

    return output;
}