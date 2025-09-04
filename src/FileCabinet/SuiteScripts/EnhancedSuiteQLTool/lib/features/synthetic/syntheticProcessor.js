/**
 * @fileoverview Synthetic SQL Processor
 * 
 * Main processor that coordinates query analysis, function execution,
 * and result integration for synthetic functions and stored procedures.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define([
    'N/log', 'N/query',
    './queryParser',
    './executionEngine',
    './syntheticFunctions',
    './createStatements'
], function(log, query, queryParser, executionEngine, syntheticFunctions, createStatements) {
    'use strict';

    /**
     * Process result structure
     * @typedef {Object} ProcessResult
     * @property {boolean} success - Whether processing was successful
     * @property {Array|Object} result - Query results or procedure output
     * @property {string} error - Error message if failed
     * @property {number} executionTime - Total execution time
     * @property {boolean} wasSynthetic - Whether synthetic processing was used
     * @property {Object} analysis - Query analysis details
     */

    /**
     * Process a query that may contain synthetic functions or stored procedures
     * 
     * @param {string} sqlQuery - SQL query to process
     * @param {Array} queryParams - Query parameters (optional)
     * @returns {ProcessResult} Processing result
     */
    function processQuery(sqlQuery, queryParams) {
        var startTime = Date.now();

        try {
            log.debug({
                title: 'Synthetic Processor Called',
                details: 'Query: ' + sqlQuery.substring(0, 100) + '...'
            });

            // Check for CREATE OR REPLACE statements first
            var createAnalysis = createStatements.analyzeCreateStatement(sqlQuery);
            if (createAnalysis.isCreateStatement) {
                return processCreateStatement(sqlQuery, startTime);
            }

            // Analyze query for synthetic elements
            var analysis = queryParser.analyzeQuery(sqlQuery);

            log.debug({
                title: 'Processing synthetic query',
                details: 'Type: ' + analysis.queryType +
                        ', Functions: ' + analysis.functions.length +
                        ', Procedures: ' + analysis.procedures.length +
                        ', Has Synthetic Functions: ' + analysis.hasSyntheticFunctions +
                        ', Functions Found: ' + JSON.stringify(analysis.functions)
            });

            // Route to appropriate processor
            if (analysis.queryType === 'CALL') {
                return processStoredProcedureCall(analysis, startTime);
            } else if (analysis.hasSyntheticFunctions) {
                return processFunctionQuery(analysis, queryParams, startTime);
            } else {
                // No synthetic elements, return indication to use normal processing
                return {
                    success: true,
                    result: null,
                    error: null,
                    executionTime: Date.now() - startTime,
                    wasSynthetic: false,
                    analysis: analysis
                };
            }

        } catch (error) {
            log.error({
                title: 'Error processing synthetic query',
                details: 'Error: ' + error.message + ', Stack: ' + (error.stack || 'No stack trace')
            });

            return {
                success: false,
                result: null,
                error: 'Synthetic processing error: ' + error.message + ' (Stack: ' + (error.stack || 'No stack trace') + ')',
                executionTime: Date.now() - startTime,
                wasSynthetic: true,
                analysis: null
            };
        }
    }

    /**
     * Process CREATE OR REPLACE statement
     *
     * @param {string} sqlQuery - CREATE statement
     * @param {number} startTime - Processing start time
     * @returns {ProcessResult} Processing result
     */
    function processCreateStatement(sqlQuery, startTime) {
        try {
            var result = createStatements.processCreateStatement(sqlQuery);

            if (result.success) {
                // Clear function cache to pick up new/updated function
                if (typeof executionEngine.clearCache === 'function') {
                    executionEngine.clearCache();
                }

                // Clear registry cache to pick up new function
                if (typeof syntheticFunctions.clearRegistryCache === 'function') {
                    syntheticFunctions.clearRegistryCache();
                }
            }

            return {
                success: result.success,
                result: {
                    message: result.message,
                    fileName: result.fileName,
                    fileId: result.fileId,
                    type: result.type
                },
                error: result.success ? null : result.message,
                executionTime: Date.now() - startTime,
                wasSynthetic: true,
                analysis: { queryType: 'CREATE', isCreateStatement: true }
            };

        } catch (error) {
            log.error({
                title: 'Error processing CREATE statement',
                details: error.message
            });

            return {
                success: false,
                result: null,
                error: error.message,
                executionTime: Date.now() - startTime,
                wasSynthetic: true,
                analysis: { queryType: 'CREATE', isCreateStatement: true }
            };
        }
    }

    /**
     * Process stored procedure call
     *
     * @param {Object} analysis - Query analysis
     * @param {number} startTime - Processing start time
     * @returns {ProcessResult} Processing result
     */
    function processStoredProcedureCall(analysis, startTime) {
        try {
            if (analysis.procedures.length === 0) {
                throw new Error('No stored procedures found in CALL statement');
            }

            // For now, handle single procedure call
            var procedureCall = analysis.procedures[0];

            // Execute the stored procedure
            var result = executionEngine.executeProcedure(
                procedureCall.name,
                procedureCall.parameters
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            // Format result for stored procedure with output handling
            var formattedResult = formatStoredProcedureResult(result);

            log.debug({
                title: 'Formatted procedure result',
                details: 'Formatted result: ' + JSON.stringify(formattedResult) + ', Type: ' + typeof formattedResult + ', Length: ' + (Array.isArray(formattedResult) ? formattedResult.length : 'N/A')
            });

            return {
                success: true,
                result: formattedResult,
                error: null,
                executionTime: Date.now() - startTime,
                wasSynthetic: true,
                analysis: analysis,
                outputLog: result.outputLog || [],
                showOutput: result.showOutput || false
            };

        } catch (error) {
            log.error({
                title: 'Error processing stored procedure',
                details: error.message
            });

            return {
                success: false,
                result: null,
                error: error.message,
                executionTime: Date.now() - startTime,
                wasSynthetic: true,
                analysis: analysis,
                outputLog: [],
                showOutput: false
            };
        }
    }

    /**
     * Process SELECT query with synthetic functions
     * 
     * @param {Object} analysis - Query analysis
     * @param {Array} queryParams - Query parameters
     * @param {number} startTime - Processing start time
     * @returns {ProcessResult} Processing result
     */
    function processFunctionQuery(analysis, queryParams, startTime) {
        try {
            // Remove function calls from query to get base query
            var baseQuery = removeFunctionCallsFromQuery(analysis.originalQuery, analysis.functions);
            
            log.debug({
                title: 'Executing base query',
                details: 'Original: ' + analysis.originalQuery.substring(0, 100) + '...\n' +
                        'Base: ' + baseQuery.substring(0, 100) + '...'
            });

            // Execute base query
            var queryResult = query.runSuiteQL({
                query: baseQuery,
                params: queryParams || []
            });
            
            var resultSet = queryResult.asMappedResults();
            
            // Execute functions for each row and add results
            var enhancedResultSet = executionEngine.executeFunctionsForResultSet(
                analysis.functions,
                resultSet
            );

            return {
                success: true,
                result: enhancedResultSet,
                error: null,
                executionTime: Date.now() - startTime,
                wasSynthetic: true,
                analysis: analysis
            };

        } catch (error) {
            log.error({
                title: 'Error processing function query',
                details: error.message
            });
            
            return {
                success: false,
                result: null,
                error: error.message,
                executionTime: Date.now() - startTime,
                wasSynthetic: true,
                analysis: analysis
            };
        }
    }

    /**
     * Format stored procedure result for display
     *
     * @param {Object} result - Execution result from stored procedure
     * @returns {Array|Object} Formatted result for display
     */
    function formatStoredProcedureResult(result) {
        // If the result has output log and should show output, format it for display
        if (result.showOutput && result.outputLog && result.outputLog.length > 0) {
            // Create a combined result that includes both the procedure result and output
            var formattedResult = [];

            // Add output log entries as rows
            result.outputLog.forEach(function(logEntry, index) {
                formattedResult.push({
                    sequence: index + 1,
                    type: logEntry.type.toUpperCase(),
                    message: logEntry.message,
                    timestamp: logEntry.timestamp
                });
            });

            // Add the actual procedure result as a final summary row
            if (result.result && typeof result.result === 'object') {
                formattedResult.push({
                    sequence: result.outputLog.length + 1,
                    type: 'RESULT',
                    message: JSON.stringify(result.result, null, 2),
                    timestamp: new Date().toISOString()
                });
            }

            return formattedResult;
        } else {
            // No output requested or no output generated, return the result as-is
            // But format it as a single-row result for consistent display
            if (result.result && typeof result.result === 'object') {
                // If it's already an array, return it
                if (Array.isArray(result.result)) {
                    return result.result;
                }

                // If it's an object, wrap it in an array for table display
                return [result.result];
            } else {
                // Simple value, wrap in an object for display
                return [{
                    result: result.result,
                    message: 'Stored procedure executed successfully'
                }];
            }
        }
    }

    /**
     * Remove function calls from query to create base query
     * 
     * @param {string} originalQuery - Original query with function calls
     * @param {Array} functionCalls - Array of detected function calls
     * @returns {string} Base query without function calls
     */
    function removeFunctionCallsFromQuery(originalQuery, functionCalls) {
        var modifiedQuery = originalQuery;

        // Sort function calls by position (reverse order to maintain positions)
        var sortedCalls = functionCalls.slice().sort(function(a, b) {
            return b.startIndex - a.startIndex;
        });

        // Replace each function call with a placeholder or remove it
        sortedCalls.forEach(function(funcCall, index) {
            var before = modifiedQuery.substring(0, funcCall.startIndex);
            var after = modifiedQuery.substring(funcCall.endIndex);

            // For SELECT clause, replace with a placeholder column
            if (isInSelectClause(originalQuery, funcCall.startIndex)) {
                // Check if there's an AS clause after the function call
                var asMatch = after.match(/^\s+as\s+(\w+)/i);
                var placeholder;

                if (asMatch) {
                    // Use the existing alias name and remove the AS clause from after
                    placeholder = "'FUNCTION_PLACEHOLDER_" + index + "' AS " + asMatch[1];
                    after = after.substring(asMatch[0].length);
                } else {
                    // No existing alias, create one
                    placeholder = "'FUNCTION_PLACEHOLDER_" + index + "' AS " + funcCall.name + "_result";
                }

                modifiedQuery = before + placeholder + after;
            } else {
                // For WHERE clause or other contexts, might need different handling
                // For now, just remove the function call
                modifiedQuery = before + "1=1" + after;
            }
        });

        return modifiedQuery;
    }

    /**
     * Check if position is within SELECT clause
     * 
     * @param {string} query - SQL query
     * @param {number} position - Position to check
     * @returns {boolean} True if position is in SELECT clause
     */
    function isInSelectClause(query, position) {
        var beforePosition = query.substring(0, position).toUpperCase();
        var selectIndex = beforePosition.lastIndexOf('SELECT');
        var fromIndex = beforePosition.lastIndexOf('FROM');
        
        // If SELECT is after FROM, we're in a subquery SELECT
        // If no FROM found, we're definitely in SELECT
        // If SELECT is after FROM, we're in SELECT clause
        return selectIndex > fromIndex;
    }

    /**
     * Get available functions and procedures
     * 
     * @returns {Object} Registry of available functions and procedures
     */
    function getAvailableFunctions() {
        try {
            return syntheticFunctions.buildFunctionRegistry();
        } catch (error) {
            log.error({
                title: 'Error getting available functions',
                details: error.message
            });
            return { functions: {}, procedures: {}, lastUpdated: Date.now() };
        }
    }

    /**
     * Validate query for synthetic elements
     * 
     * @param {string} sqlQuery - SQL query to validate
     * @returns {Object} Validation result
     */
    function validateQuery(sqlQuery) {
        try {
            var analysis = queryParser.analyzeQuery(sqlQuery);
            var registry = syntheticFunctions.buildFunctionRegistry();
            var validation = {
                valid: true,
                errors: [],
                warnings: [],
                analysis: analysis
            };

            // Check if all referenced functions exist
            analysis.functions.forEach(function(funcCall) {
                if (!registry.functions[funcCall.name]) {
                    validation.valid = false;
                    validation.errors.push('Function not found: ' + funcCall.name);
                }
            });

            // Check if all referenced procedures exist
            analysis.procedures.forEach(function(procCall) {
                if (!registry.procedures[procCall.name]) {
                    validation.valid = false;
                    validation.errors.push('Procedure not found: ' + procCall.name);
                }
            });

            return validation;

        } catch (error) {
            return {
                valid: false,
                errors: ['Query validation error: ' + error.message],
                warnings: [],
                analysis: null
            };
        }
    }

    // Public API
    return {
        processQuery: processQuery,
        getAvailableFunctions: getAvailableFunctions,
        validateQuery: validateQuery
    };
});
