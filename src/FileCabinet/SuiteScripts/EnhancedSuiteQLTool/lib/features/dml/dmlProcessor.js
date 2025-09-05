/**
 * @fileoverview DML Processor
 * 
 * This module serves as the main entry point for DML operations,
 * orchestrating parsing, validation, and execution of DML statements.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define([
    'N/log',
    './dmlParser',
    './dmlExecutionEngine',
    '../../queryHistory/historyManager'
], function(log, dmlParser, dmlExecutionEngine, queryHistory) {
    'use strict';

    /**
     * DML process result structure
     * @typedef {Object} DMLProcessResult
     * @property {boolean} success - Whether processing was successful
     * @property {Object} result - DML operation result
     * @property {string} error - Error message if failed
     * @property {number} executionTime - Total execution time
     * @property {boolean} wasDML - Whether DML processing was used
     * @property {Object} analysis - DML analysis details
     * @property {string} message - Success/error message
     */

    /**
     * Process a query for DML operations
     * 
     * @param {string} query - Query to process
     * @returns {DMLProcessResult} Processing result
     */
    function processQuery(query) {
        var startTime = Date.now();
        
        log.debug({
            title: 'DML Processor Called',
            details: 'Query: ' + (query ? query.substring(0, 100) + '...' : 'null')
        });

        try {
            // Analyze query for DML operations
            var analysis = dmlParser.analyzeDMLQuery(query);

            log.debug({
                title: 'DML Analysis Complete',
                details: 'Is DML: ' + analysis.isDMLStatement + 
                        ', Type: ' + analysis.dmlType + 
                        ', Error: ' + analysis.error
            });

            // If not a DML statement, return indication to use normal processing
            if (!analysis.isDMLStatement) {
                return {
                    success: true,
                    result: null,
                    error: null,
                    executionTime: Date.now() - startTime,
                    wasDML: false,
                    analysis: analysis,
                    message: null
                };
            }

            // If analysis had errors, return error result
            if (analysis.error) {
                return createErrorResult(analysis.error, startTime, analysis);
            }

            // Validate the DML operation
            var validation = dmlExecutionEngine.validateDMLOperation(
                analysis.dmlType, 
                analysis.parsedStatement
            );

            if (!validation.isValid) {
                var validationError = 'DML validation failed: ' + validation.errors.join(', ');
                return createErrorResult(validationError, startTime, analysis);
            }

            // Execute the DML operation
            var executionResult = dmlExecutionEngine.executeDMLOperation(
                analysis.dmlType,
                analysis.parsedStatement
            );

            // Log query to history
            logQueryToHistory(query, executionResult, startTime);

            // Return final result
            return {
                success: executionResult.success,
                result: executionResult.result,
                error: executionResult.error,
                executionTime: Date.now() - startTime,
                wasDML: true,
                analysis: analysis,
                message: executionResult.message
            };

        } catch (processingError) {
            log.error({
                title: 'DML Processing Error',
                details: processingError.message
            });

            return createErrorResult(processingError.message, startTime, null);
        }
    }

    /**
     * Create error result object
     * 
     * @param {string} errorMessage - Error message
     * @param {number} startTime - Processing start time
     * @param {Object} analysis - DML analysis (optional)
     * @returns {DMLProcessResult} Error result
     */
    function createErrorResult(errorMessage, startTime, analysis) {
        return {
            success: false,
            result: null,
            error: errorMessage,
            executionTime: Date.now() - startTime,
            wasDML: true,
            analysis: analysis,
            message: null
        };
    }

    /**
     * Log query execution to history
     * 
     * @param {string} query - Original query
     * @param {Object} executionResult - Execution result
     * @param {number} startTime - Processing start time
     */
    function logQueryToHistory(query, executionResult, startTime) {
        try {
            var historyEntry = {
                query: query,
                status: executionResult.success ? 'SUCCESS' : 'ERROR',
                executionTime: new Date(),
                elapsedTime: Date.now() - startTime
            };

            if (executionResult.success) {
                historyEntry.result = executionResult.message || 'DML operation completed successfully';
                historyEntry.recordCount = 1; // DML operations typically affect one entity
            } else {
                historyEntry.errorMessage = executionResult.error;
                historyEntry.recordCount = 0;
            }

            queryHistory.logQuery(historyEntry);

        } catch (historyError) {
            log.error({
                title: 'Error logging DML query to history',
                details: historyError.message
            });
            // Don't fail the main operation due to history logging issues
        }
    }

    /**
     * Check if query contains DML operations
     * 
     * @param {string} query - Query to check
     * @returns {boolean} True if query contains DML operations
     */
    function isDMLQuery(query) {
        if (!query || typeof query !== 'string') {
            return false;
        }

        var trimmedQuery = query.trim().toUpperCase();
        
        // Check for supported DML patterns
        return trimmedQuery.startsWith('CREATE RECORD') || 
               trimmedQuery.startsWith('CREATE LIST');
    }

    /**
     * Get supported DML operations
     * 
     * @returns {Array} Array of supported DML operation types
     */
    function getSupportedDMLOperations() {
        return dmlExecutionEngine.getSupportedOperations();
    }

    /**
     * Get DML operation examples
     * 
     * @returns {Object} Object containing example DML statements
     */
    function getDMLExamples() {
        return {
            CREATE_RECORD: [
                'CREATE RECORD my_custom_record (\n' +
                '    name FREEFORMTEXT,\n' +
                '    email EMAILADDRESS,\n' +
                '    amount CURRENCY,\n' +
                '    active CHECKBOX\n' +
                ');',
                
                'CREATE RECORD employee_data (\n' +
                '    employee_name FREEFORMTEXT,\n' +
                '    hire_date DATE,\n' +
                '    department LIST(customlist_departments),\n' +
                '    salary CURRENCY\n' +
                ');'
            ],
            
            CREATE_LIST: [
                'CREATE LIST priority_levels (\n' +
                '    description "Priority levels for tasks"\n' +
                '    optionsorder "ORDER_ENTERED"\n' +
                '    matrixoption FALSE\n' +
                '    isinactive FALSE\n' +
                '    values [\n' +
                '        value "High" abbreviation "H" inactive FALSE,\n' +
                '        value "Medium" abbreviation "M" inactive FALSE,\n' +
                '        value "Low" abbreviation "L" inactive FALSE\n' +
                '    ]\n' +
                ');',
                
                'CREATE LIST status_codes (\n' +
                '    description "Status codes with translations"\n' +
                '    values [\n' +
                '        value "Active" inactive FALSE translations [\n' +
                '            language "es_ES", value "Activo",\n' +
                '            language "fr_FR", value "Actif"\n' +
                '        ],\n' +
                '        value "Inactive" inactive FALSE\n' +
                '    ]\n' +
                ');'
            ]
        };
    }

    /**
     * Validate DML query syntax
     * 
     * @param {string} query - Query to validate
     * @returns {Object} Validation result
     */
    function validateDMLQuery(query) {
        try {
            var analysis = dmlParser.analyzeDMLQuery(query);
            
            if (!analysis.isDMLStatement) {
                return {
                    isValid: false,
                    errors: ['Query is not a valid DML statement']
                };
            }

            if (analysis.error) {
                return {
                    isValid: false,
                    errors: [analysis.error]
                };
            }

            var validation = dmlExecutionEngine.validateDMLOperation(
                analysis.dmlType,
                analysis.parsedStatement
            );

            return validation;

        } catch (validationError) {
            return {
                isValid: false,
                errors: [validationError.message]
            };
        }
    }

    // Public API
    return {
        processQuery: processQuery,
        isDMLQuery: isDMLQuery,
        getSupportedDMLOperations: getSupportedDMLOperations,
        getDMLExamples: getDMLExamples,
        validateDMLQuery: validateDMLQuery
    };
});
