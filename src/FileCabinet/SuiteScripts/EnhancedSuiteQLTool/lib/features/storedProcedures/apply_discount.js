/**
 * Apply discount to transactions based on criteria
 *
 * @param {Object} context - Execution context
 * @param {string} context.params.transaction_type - Type of transaction (salesorder, invoice, etc.)
 * @param {number} context.params.threshold_amount - Minimum amount for discount
 * @param {boolean} context.params.update_records - Whether to actually update records
 * @param {boolean} context.params.show_output - Whether to display real-time output (default: false)
 * @returns {Object} Processing results
 */
function apply_discount(context) {
    // Import NetSuite modules
    var query = require('N/query');
    var record = require('N/record');
    var log = require('N/log');

    // Extract and validate parameters
    var params = context.params || {};
    var transaction_type = (params.transaction_type || '').trim();
    var threshold_amount = parseFloat(params.threshold_amount) || 0;
    var update_records = params.update_records === true; // Boolean to control updates
    var show_output = params.show_output === true; // Boolean to control output display
    var valid_types = ['SalesOrd', 'CustInvc', 'Estimate']; // Use proper case to match input

    // Map transaction types to NetSuite record types for record.submitFields()
    var recordTypeMap = {
        'SalesOrd': record.Type.SALES_ORDER,
        'CustInvc': record.Type.INVOICE,
        'Estimate': record.Type.ESTIMATE
    };

    // Use console.log for real-time output (will be captured if show_output=true)
    if (show_output) {
        console.log('Starting discount application process...');
        console.log('Transaction Type: ' + transaction_type);
        console.log('Threshold Amount: $' + threshold_amount);
        console.log('Update Records: ' + (update_records ? 'Yes' : 'No (Dry Run)'));
        if (update_records) {
            console.log('Custom Field: custbody_discount_applied');
            console.log('Record Type Mapping: ' + transaction_type + ' -> ' + (recordTypeMap[transaction_type] || 'UNKNOWN'));
        }
    }

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
        if (show_output) {
            console.error('Validation failed: Invalid transaction type');
        }
        return output;
    }
    if (isNaN(threshold_amount) || threshold_amount < 0) {
        output.success = false;
        output.errors.push('threshold_amount must be a positive number');
        if (show_output) {
            console.error('Validation failed: Invalid threshold amount');
        }
        return output;
    }

    if (show_output) {
        console.log('Input validation passed');
    }

    try {
        // Build SuiteQL query - use string interpolation to avoid parameter binding issues
        var suiteQL = `
            SELECT id, tranid, foreignTotal
            FROM transaction
            WHERE type = '` + transaction_type + `'
            AND foreignTotal > ` + threshold_amount + `
            AND tranid = 'SO347'
        `;

        if (show_output) {
            console.log('Executing query to find transactions...');
            console.log('DEBUG - Final query: ' + suiteQL);
        }

        var results = query.runSuiteQLPaged({
            query: suiteQL,
            pageSize: 100
        }).iterator();

        // Iterate through results
        results.each(function(page) {
            var pageData = page.value.data.asMappedResults();

            if (show_output && pageData.length > 0) {
                console.log('Processing page with ' + pageData.length + ' transactions...');
            }

            pageData.forEach(function(row) {
                try {
                    var tranId = row.id;
                    var tranIdDisplay = row.tranid;

                    // Handle currency data type - NetSuite returns lowercase field names
                    var tranTotal = 0;
                    var foreignTotalValue = row.foreigntotal; // Note: lowercase!

                    if (foreignTotalValue !== null && foreignTotalValue !== undefined) {
                        if (typeof foreignTotalValue === 'number') {
                            tranTotal = foreignTotalValue;
                        } else if (typeof foreignTotalValue === 'string') {
                            // Remove currency symbols and parse
                            tranTotal = parseFloat(foreignTotalValue.replace(/[$,]/g, ''));
                        } else if (typeof foreignTotalValue === 'object' && foreignTotalValue.value) {
                            // NetSuite currency object format
                            tranTotal = parseFloat(foreignTotalValue.value);
                        }
                    }

                    if (show_output) {
                        console.log('DEBUG - foreigntotal value: ' + foreignTotalValue + ' -> parsed: ' + tranTotal);
                    }

                    // Check if we got a valid number
                    if (isNaN(tranTotal) || tranTotal <= 0) {
                        if (show_output) {
                            console.log('Skipping transaction ' + tranIdDisplay + ' - invalid amount: ' + JSON.stringify(foreignTotalValue));
                        }
                        return; // Skip this transaction
                    }

                    var discount = tranTotal * 0.1; // 10% discount

                    if (show_output) {
                        console.log('Processing Transaction ' + tranIdDisplay + ' (ID: ' + tranId + '), Amount: $' + tranTotal.toFixed(2) + ', Discount: $' + discount.toFixed(2));
                    }

                    // Update record if requested (e.g., set custom field)
                    if (update_records) {
                        try {
                            // Get the correct NetSuite record type
                            var nsRecordType = recordTypeMap[transaction_type];
                            if (!nsRecordType) {
                                throw new Error('Unsupported transaction type for record update: ' + transaction_type);
                            }

                            record.submitFields({
                                type: nsRecordType,
                                id: tranId,
                                values: {
                                    custbody_discount_applied: discount
                                },
                                options: {
                                    ignoreMandatoryFields: true,
                                    disableTriggers: false // Allow workflows/triggers to run
                                }
                            });

                            if (show_output) {
                                console.log('Updated record for Transaction ' + tranIdDisplay + ' (ID: ' + tranId + ') with discount: $' + discount.toFixed(2));
                            }
                        } catch (updateError) {
                            var errorMsg = 'Failed to update Transaction ' + tranIdDisplay + ': ' + updateError.message;
                            output.errors.push(errorMsg);
                            if (show_output) {
                                console.error(errorMsg);
                            }
                        }
                    }

                    // Update output
                    output.processed_count++;
                    output.total_discount += discount;
                } catch (e) {
                    var errorMsg = 'Error processing transaction ID ' + row.id + ': ' + e.message;
                    output.errors.push(errorMsg);
                    if (show_output) {
                        console.error(errorMsg);
                    }
                }
            });
            return true; // Continue to next page
        });

        if (show_output) {
            console.log('Query processing completed');
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
        title: 'Apply Discount Procedure',
        details: 'Processed ' + output.processed_count + ' transactions with total discount $' + output.total_discount
    });

    // Final output summary
    if (show_output) {
        console.log('=== EXECUTION SUMMARY ===');
        console.log('Transactions processed: ' + output.processed_count);
        console.log('Total discount amount: $' + output.total_discount.toFixed(2));
        console.log('Errors encountered: ' + output.errors.length);
        console.log('Records updated: ' + (update_records ? 'Yes' : 'No (Dry Run)'));
        console.log('Execution completed successfully: ' + (output.success ? 'Yes' : 'No'));
    }

    return output;
}
