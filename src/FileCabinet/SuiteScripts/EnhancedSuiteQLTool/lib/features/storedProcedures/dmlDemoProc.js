/**
 * @fileoverview Demo Stored Procedure with DML and Function Capabilities
 * 
 * This stored procedure demonstrates the enhanced capabilities available
 * within stored procedures including DML operations, function calls,
 * and SuiteQL execution.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.2.0
 */

/**
 * Demo procedure that showcases DML and function capabilities
 * 
 * @param {Object} context - Execution context
 * @returns {Object} Procedure result
 */
function dmlDemoProc(context) {
    var result = {
        success: true,
        operations: [],
        summary: {}
    };

    try {
        console.log('Starting DML Demo Procedure');
        console.log('Parameters received:', JSON.stringify(context.params));

        // Example 1: Execute SuiteQL query to get data
        console.log('\n=== Step 1: Querying existing data ===');
        var queryResult = suiteql.query(
            "SELECT id, entityid, companyname FROM customer WHERE isinactive = 'F' LIMIT 5"
        );
        
        if (queryResult.success) {
            console.log('Found ' + queryResult.recordCount + ' active customers');
            result.operations.push({
                step: 1,
                operation: 'SuiteQL Query',
                success: true,
                recordCount: queryResult.recordCount
            });
        }

        // Example 2: Execute SELECT with synthetic functions
        console.log('\n=== Step 2: SELECT with synthetic functions ===');
        try {
            // This demonstrates SELECT statements with function calls
            var selectWithFunctions = suiteql.query(
                "SELECT id, entityid, test_upper(entityid) AS upper_entityid FROM customer WHERE isinactive = 'F' LIMIT 3"
            );

            if (selectWithFunctions.success) {
                console.log('SELECT with functions returned ' + selectWithFunctions.recordCount + ' records');
                if (selectWithFunctions.hasSyntheticFunctions) {
                    console.log('Synthetic functions executed: ' + selectWithFunctions.functionsExecuted);
                }

                // Log first record as example
                if (selectWithFunctions.records.length > 0) {
                    console.log('Sample record:', JSON.stringify(selectWithFunctions.records[0]));
                }

                result.operations.push({
                    step: 2,
                    operation: 'SELECT with Functions',
                    success: true,
                    recordCount: selectWithFunctions.recordCount,
                    hasSyntheticFunctions: selectWithFunctions.hasSyntheticFunctions,
                    functionsExecuted: selectWithFunctions.functionsExecuted
                });
            }
        } catch (e) {
            console.log('SELECT with functions failed (expected if function not found):', e.message);
            result.operations.push({
                step: 2,
                operation: 'SELECT with Functions',
                success: false,
                error: e.message
            });
        }

        // Example 3: Call a synthetic function directly (if available)
        console.log('\n=== Step 3: Direct function call ===');
        try {
            // This would call a custom function if it exists
            var functionResult = functions.call('test_upper', ['hello world']);
            console.log('Function result:', functionResult);
            result.operations.push({
                step: 3,
                operation: 'Direct Function Call',
                success: true,
                result: functionResult
            });
        } catch (e) {
            console.log('Function call failed (expected if function not found):', e.message);
            result.operations.push({
                step: 3,
                operation: 'Direct Function Call',
                success: false,
                error: e.message
            });
        }

        // Example 4: DML Operations (in preview mode for safety)
        console.log('\n=== Step 4: DML Operations ===');
        
        // INSERT operation (preview mode)
        var insertResult = dml.insert(
            "INSERT INTO customlist_demo_list (name, description) VALUES ('Demo Item', 'Created by stored procedure')"
        );
        console.log('INSERT result:', JSON.stringify(insertResult));
        result.operations.push({
            step: 4,
            operation: 'INSERT',
            success: insertResult.success,
            recordsAffected: insertResult.recordsAffected,
            message: insertResult.message
        });

        // UPDATE operation (preview mode)
        var updateResult = dml.update(
            "UPDATE customer SET comments = 'Updated by stored procedure' WHERE id = 123"
        );
        console.log('UPDATE result:', JSON.stringify(updateResult));
        result.operations.push({
            step: 5,
            operation: 'UPDATE',
            success: updateResult.success,
            recordsAffected: updateResult.recordsAffected,
            message: updateResult.message
        });

        // DELETE operation (preview mode)
        var deleteResult = dml.delete(
            "DELETE FROM customlist_demo_list WHERE name = 'Demo Item'"
        );
        console.log('DELETE result:', JSON.stringify(deleteResult));
        result.operations.push({
            step: 6,
            operation: 'DELETE',
            success: deleteResult.success,
            recordsAffected: deleteResult.recordsAffected,
            message: deleteResult.message
        });

        // Example 5: Complex business logic combining multiple operations
        console.log('\n=== Step 5: Complex Business Logic ===');
        
        var customersToProcess = context.params.customerIds || [];
        var processedCount = 0;
        
        for (var i = 0; i < customersToProcess.length; i++) {
            var customerId = customersToProcess[i];
            
            // Query customer details
            var customerQuery = suiteql.query(
                "SELECT id, entityid, companyname FROM customer WHERE id = ?",
                [customerId]
            );
            
            if (customerQuery.success && customerQuery.records.length > 0) {
                var customer = customerQuery.records[0];
                console.log('Processing customer:', customer.entityid);
                
                // Update customer with processed flag (preview mode)
                var updateCustomer = dml.update(
                    "UPDATE customer SET comments = 'Processed by procedure on " + new Date().toISOString() + "' WHERE id = " + customerId
                );
                
                if (updateCustomer.success) {
                    processedCount++;
                }
            }
        }
        
        console.log('Processed ' + processedCount + ' customers');
        result.operations.push({
            step: 7,
            operation: 'Batch Processing',
            success: true,
            recordsProcessed: processedCount
        });

        // Summary
        result.summary = {
            totalOperations: result.operations.length,
            successfulOperations: result.operations.filter(function(op) { return op.success; }).length,
            failedOperations: result.operations.filter(function(op) { return !op.success; }).length,
            executionTime: new Date().toISOString()
        };

        console.log('\n=== Procedure Complete ===');
        console.log('Summary:', JSON.stringify(result.summary));

        return result;

    } catch (error) {
        console.error('Procedure execution error:', error.message);
        result.success = false;
        result.error = error.message;
        return result;
    }
}
