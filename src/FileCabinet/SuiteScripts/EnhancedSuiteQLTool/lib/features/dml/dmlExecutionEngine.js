/**
 * @fileoverview DML Execution Engine
 * 
 * This module handles the execution of DML operations by delegating to
 * specific operation modules and providing common execution infrastructure.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define([
    'N/log', 'N/error',
    './operations/createRecord',
    './operations/createList',
    './operations/insertRecord',
    './operations/updateRecord',
    './operations/deleteRecord'
], function(log, error, createRecord, createList, insertRecord, updateRecord, deleteRecord) {
    'use strict';

    /**
     * DML execution result structure
     * @typedef {Object} DMLExecutionResult
     * @property {boolean} success - Whether execution was successful
     * @property {any} result - Operation result data
     * @property {string} error - Error message if failed
     * @property {number} executionTime - Execution time in milliseconds
     * @property {string} message - Success message
     * @property {Object} metadata - Additional metadata about the operation
     */

    /**
     * Execute a DML operation
     * 
     * @param {string} dmlType - Type of DML operation
     * @param {Object} parsedStatement - Parsed DML statement
     * @returns {DMLExecutionResult} Execution result
     */
    function executeDMLOperation(dmlType, parsedStatement) {
        var startTime = Date.now();
        
        log.debug({
            title: 'Executing DML Operation',
            details: 'Type: ' + dmlType + ', Statement: ' + JSON.stringify(parsedStatement)
        });

        try {
            var result;
            
            switch (dmlType) {
                case 'CREATE_RECORD':
                    result = createRecord.execute(parsedStatement);
                    break;

                case 'CREATE_LIST':
                    result = createList.execute(parsedStatement);
                    break;

                case 'INSERT':
                    result = insertRecord.execute(parsedStatement);
                    break;

                case 'UPDATE':
                    result = updateRecord.execute(parsedStatement);
                    break;

                case 'DELETE':
                    result = deleteRecord.execute(parsedStatement);
                    break;

                default:
                    throw error.create({
                        name: 'UNSUPPORTED_DML_OPERATION',
                        message: 'Unsupported DML operation: ' + dmlType
                    });
            }

            // Ensure result has proper structure
            if (!result || typeof result !== 'object') {
                throw error.create({
                    name: 'INVALID_OPERATION_RESULT',
                    message: 'DML operation returned invalid result'
                });
            }

            // Add execution metadata
            result.executionTime = Date.now() - startTime;
            result.dmlType = dmlType;

            log.debug({
                title: 'DML Operation Completed',
                details: 'Type: ' + dmlType + ', Success: ' + result.success + ', Time: ' + result.executionTime + 'ms'
            });

            return result;

        } catch (executionError) {
            log.error({
                title: 'DML Execution Error',
                details: 'Type: ' + dmlType + ', Error: ' + executionError.message
            });
            
            return {
                success: false,
                result: null,
                error: executionError.message,
                executionTime: Date.now() - startTime,
                message: null,
                metadata: {
                    dmlType: dmlType,
                    errorType: executionError.name || 'EXECUTION_ERROR'
                }
            };
        }
    }

    /**
     * Validate DML operation parameters
     * 
     * @param {string} dmlType - Type of DML operation
     * @param {Object} parsedStatement - Parsed DML statement
     * @returns {Object} Validation result
     */
    function validateDMLOperation(dmlType, parsedStatement) {
        var validation = {
            isValid: true,
            errors: []
        };

        // Common validations
        if (!dmlType || typeof dmlType !== 'string') {
            validation.isValid = false;
            validation.errors.push('DML type is required and must be a string');
        }

        if (!parsedStatement || typeof parsedStatement !== 'object') {
            validation.isValid = false;
            validation.errors.push('Parsed statement is required and must be an object');
        }

        // Type-specific validations
        if (validation.isValid) {
            switch (dmlType) {
                case 'CREATE_RECORD':
                    var recordValidation = validateCreateRecordStatement(parsedStatement);
                    if (!recordValidation.isValid) {
                        validation.isValid = false;
                        validation.errors = validation.errors.concat(recordValidation.errors);
                    }
                    break;
                    
                case 'CREATE_LIST':
                    var listValidation = validateCreateListStatement(parsedStatement);
                    if (!listValidation.isValid) {
                        validation.isValid = false;
                        validation.errors = validation.errors.concat(listValidation.errors);
                    }
                    break;

                case 'INSERT':
                    var insertValidation = validateInsertStatement(parsedStatement);
                    if (!insertValidation.isValid) {
                        validation.isValid = false;
                        validation.errors = validation.errors.concat(insertValidation.errors);
                    }
                    break;

                case 'UPDATE':
                    var updateValidation = validateUpdateStatement(parsedStatement);
                    if (!updateValidation.isValid) {
                        validation.isValid = false;
                        validation.errors = validation.errors.concat(updateValidation.errors);
                    }
                    break;

                case 'DELETE':
                    var deleteValidation = validateDeleteStatement(parsedStatement);
                    if (!deleteValidation.isValid) {
                        validation.isValid = false;
                        validation.errors = validation.errors.concat(deleteValidation.errors);
                    }
                    break;

                default:
                    validation.isValid = false;
                    validation.errors.push('Unsupported DML operation: ' + dmlType);
            }
        }

        return validation;
    }

    /**
     * Validate CREATE RECORD statement
     * 
     * @param {Object} parsedStatement - Parsed CREATE RECORD statement
     * @returns {Object} Validation result
     */
    function validateCreateRecordStatement(parsedStatement) {
        var validation = {
            isValid: true,
            errors: []
        };

        if (!parsedStatement.recordId) {
            validation.isValid = false;
            validation.errors.push('Record ID is required');
        }

        if (!parsedStatement.fields || !Array.isArray(parsedStatement.fields)) {
            validation.isValid = false;
            validation.errors.push('Fields array is required');
        } else if (parsedStatement.fields.length === 0) {
            validation.isValid = false;
            validation.errors.push('At least one field is required');
        }

        return validation;
    }

    /**
     * Validate CREATE LIST statement
     * 
     * @param {Object} parsedStatement - Parsed CREATE LIST statement
     * @returns {Object} Validation result
     */
    function validateCreateListStatement(parsedStatement) {
        var validation = {
            isValid: true,
            errors: []
        };

        if (!parsedStatement.listId) {
            validation.isValid = false;
            validation.errors.push('List ID is required');
        }

        if (!parsedStatement.options || typeof parsedStatement.options !== 'object') {
            validation.isValid = false;
            validation.errors.push('Options object is required');
        }

        return validation;
    }

    /**
     * Validate INSERT statement
     *
     * @param {Object} parsedStatement - Parsed INSERT statement
     * @returns {Object} Validation result
     */
    function validateInsertStatement(parsedStatement) {
        var validation = {
            isValid: true,
            errors: []
        };

        if (!parsedStatement.tableName) {
            validation.isValid = false;
            validation.errors.push('Table name is required');
        }

        if (!parsedStatement.fields || typeof parsedStatement.fields !== 'object') {
            validation.isValid = false;
            validation.errors.push('Fields object is required');
        }

        return validation;
    }

    /**
     * Validate UPDATE statement
     *
     * @param {Object} parsedStatement - Parsed UPDATE statement
     * @returns {Object} Validation result
     */
    function validateUpdateStatement(parsedStatement) {
        var validation = {
            isValid: true,
            errors: []
        };

        if (!parsedStatement.tableName) {
            validation.isValid = false;
            validation.errors.push('Table name is required');
        }

        if (!parsedStatement.setFields || typeof parsedStatement.setFields !== 'object') {
            validation.isValid = false;
            validation.errors.push('SET fields are required');
        }

        if (!parsedStatement.whereCondition) {
            validation.isValid = false;
            validation.errors.push('WHERE condition is required for UPDATE statements');
        }

        return validation;
    }

    /**
     * Validate DELETE statement
     *
     * @param {Object} parsedStatement - Parsed DELETE statement
     * @returns {Object} Validation result
     */
    function validateDeleteStatement(parsedStatement) {
        var validation = {
            isValid: true,
            errors: []
        };

        if (!parsedStatement.tableName) {
            validation.isValid = false;
            validation.errors.push('Table name is required');
        }

        if (!parsedStatement.whereCondition) {
            validation.isValid = false;
            validation.errors.push('WHERE condition is required for DELETE statements');
        }

        return validation;
    }

    /**
     * Get supported DML operations
     *
     * @returns {Array} Array of supported operation types
     */
    function getSupportedOperations() {
        return ['CREATE_RECORD', 'CREATE_LIST', 'INSERT', 'UPDATE', 'DELETE'];
    }

    /**
     * Check if DML operation is supported
     * 
     * @param {string} dmlType - DML operation type
     * @returns {boolean} True if supported
     */
    function isOperationSupported(dmlType) {
        return getSupportedOperations().indexOf(dmlType) !== -1;
    }

    // Public API
    return {
        executeDMLOperation: executeDMLOperation,
        validateDMLOperation: validateDMLOperation,
        validateCreateRecordStatement: validateCreateRecordStatement,
        validateCreateListStatement: validateCreateListStatement,
        getSupportedOperations: getSupportedOperations,
        isOperationSupported: isOperationSupported
    };
});
