/**
 * @fileoverview UPDATE Record Operation
 * 
 * Handles UPDATE statements for modifying existing record instances in NetSuite.
 * Supports both standard NetSuite records and custom record types.
 * 
 * Syntax examples:
 * - UPDATE customer SET companyname='New Name' WHERE id=123
 * - UPDATE customrecord_employee SET department='Engineering' WHERE name='John Doe'
 * - UPDATE customlist_departments SET value='Engineering Dept' WHERE value='Engineering'
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define([
    'N/log',
    'N/error',
    'N/record',
    'N/search',
    '../dmlUtils'
], function(log, error, record, search, dmlUtils) {
    'use strict';

    /**
     * Execute UPDATE operation
     * 
     * @param {Object} parsedStatement - Parsed UPDATE statement
     * @returns {Object} Execution result
     */
    function execute(parsedStatement) {
        log.debug({
            title: 'Executing UPDATE',
            details: 'Table: ' + parsedStatement.tableName + ', SET: ' + JSON.stringify(parsedStatement.setFields) + ', WHERE: ' + JSON.stringify(parsedStatement.whereCondition)
        });

        try {
            // Determine record type and operation
            var recordType = dmlUtils.determineRecordType(parsedStatement.tableName);
            var result;

            if (recordType.isCustomList) {
                result = updateCustomListValues(parsedStatement, recordType);
            } else {
                result = updateRecords(parsedStatement, recordType);
            }

            log.audit({
                title: 'UPDATE Success',
                details: 'Table: ' + parsedStatement.tableName + ', Records updated: ' + result.recordsUpdated
            });

            return {
                success: true,
                result: result,
                error: null,
                message: 'Updated ' + result.recordsUpdated + ' record(s) in ' + parsedStatement.tableName,
                metadata: {
                    operation: 'UPDATE',
                    tableName: parsedStatement.tableName,
                    recordType: recordType.type,
                    recordsUpdated: result.recordsUpdated
                }
            };

        } catch (executionError) {
            log.error({
                title: 'UPDATE Error',
                details: 'Table: ' + parsedStatement.tableName + ', Error: ' + executionError.message
            });

            return {
                success: false,
                result: null,
                error: executionError.message,
                message: null,
                metadata: {
                    operation: 'UPDATE',
                    tableName: parsedStatement.tableName,
                    errorType: executionError.name || 'EXECUTION_ERROR'
                }
            };
        }
    }



    /**
     * Update records based on WHERE condition
     * 
     * @param {Object} parsedStatement - Parsed UPDATE statement
     * @param {Object} recordType - Record type information
     * @returns {Object} Update result
     */
    function updateRecords(parsedStatement, recordType) {
        log.debug({
            title: 'Updating records',
            details: 'Type: ' + recordType.type + ', WHERE: ' + JSON.stringify(parsedStatement.whereCondition)
        });

        // Find records matching WHERE condition
        var recordIds = findRecordsToUpdate(parsedStatement, recordType);
        
        if (recordIds.length === 0) {
            return {
                recordsUpdated: 0,
                recordIds: []
            };
        }

        var updatedRecords = [];
        var errors = [];

        // Update each record
        for (var i = 0; i < recordIds.length; i++) {
            try {
                var recordId = recordIds[i];
                updateSingleRecord(recordId, recordType.type, parsedStatement.setFields);
                updatedRecords.push(recordId);
                
                log.debug({
                    title: 'Record updated',
                    details: 'ID: ' + recordId + ', Type: ' + recordType.type
                });
            } catch (updateError) {
                errors.push({
                    recordId: recordIds[i],
                    error: updateError.message
                });
                
                log.error({
                    title: 'Error updating record',
                    details: 'ID: ' + recordIds[i] + ', Error: ' + updateError.message
                });
            }
        }

        if (errors.length > 0 && updatedRecords.length === 0) {
            throw error.create({
                name: 'UPDATE_FAILED',
                message: 'Failed to update any records. First error: ' + errors[0].error
            });
        }

        return {
            recordsUpdated: updatedRecords.length,
            recordIds: updatedRecords,
            errors: errors
        };
    }

    /**
     * Find records that match the WHERE condition
     * 
     * @param {Object} parsedStatement - Parsed UPDATE statement
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findRecordsToUpdate(parsedStatement, recordType) {
        var whereCondition = parsedStatement.whereCondition;
        
        // Handle simple equality condition
        if (whereCondition.type === 'EQUALS') {
            if (whereCondition.field === 'id' || whereCondition.field === 'internalid') {
                // Direct ID lookup
                return [whereCondition.value];
            } else {
                // Search by field value
                return searchRecordsByField(recordType.type, whereCondition.field, whereCondition.value);
            }
        }
        
        // Handle IN condition
        if (whereCondition.type === 'IN') {
            if (whereCondition.field === 'id' || whereCondition.field === 'internalid') {
                // Multiple ID lookup
                return whereCondition.values;
            } else {
                // Search by multiple field values
                return searchRecordsByFieldValues(recordType.type, whereCondition.field, whereCondition.values);
            }
        }
        
        // Handle RAW conditions (fallback from parser)
        if (whereCondition.type === 'RAW') {
            throw error.create({
                name: 'UNSUPPORTED_WHERE_CONDITION',
                message: 'Complex WHERE condition not supported: "' + whereCondition.condition + '". Use simple field=value or field IN (values) conditions.'
            });
        }

        // For other complex conditions, we'd need more sophisticated parsing
        throw error.create({
            name: 'UNSUPPORTED_WHERE_CONDITION',
            message: 'WHERE condition type "' + whereCondition.type + '" is not supported. Use simple field=value or field IN (values) conditions.'
        });
    }

    /**
     * Search for records by a single field value
     * 
     * @param {string} recordType - NetSuite record type
     * @param {string} fieldId - Field to search
     * @param {*} value - Value to search for
     * @returns {Array} Array of record internal IDs
     */
    function searchRecordsByField(recordType, fieldId, value) {
        var searchObj = search.create({
            type: recordType,
            filters: [
                [fieldId, 'is', value]
            ],
            columns: ['internalid']
        });

        var results = [];
        searchObj.run().each(function(result) {
            results.push(result.id);
            return true; // Continue iteration
        });

        return results;
    }

    /**
     * Search for records by multiple field values
     * 
     * @param {string} recordType - NetSuite record type
     * @param {string} fieldId - Field to search
     * @param {Array} values - Values to search for
     * @returns {Array} Array of record internal IDs
     */
    function searchRecordsByFieldValues(recordType, fieldId, values) {
        var searchObj = search.create({
            type: recordType,
            filters: [
                [fieldId, 'anyof', values]
            ],
            columns: ['internalid']
        });

        var results = [];
        searchObj.run().each(function(result) {
            results.push(result.id);
            return true; // Continue iteration
        });

        return results;
    }

    /**
     * Update a single record
     * 
     * @param {string} recordId - Record internal ID
     * @param {string} recordType - NetSuite record type
     * @param {Object} setFields - Fields to update
     */
    function updateSingleRecord(recordId, recordType, setFields) {
        // Use submitFields for efficiency when possible
        var fieldIds = Object.keys(setFields);
        var values = {};

        for (var i = 0; i < fieldIds.length; i++) {
            var fieldId = fieldIds[i];

            // Validate field before attempting to set it
            if (!dmlUtils.validateField(recordType, fieldId)) {
                log.warn({
                    title: 'Invalid field detected',
                    details: 'Field: ' + fieldId + ', Record Type: ' + recordType
                });
                // Continue anyway - NetSuite will provide the definitive validation
            }

            values[fieldId] = setFields[fieldId];
        }

        record.submitFields({
            type: recordType,
            id: recordId,
            values: values
        });
    }

    /**
     * Update custom list values
     * 
     * @param {Object} parsedStatement - Parsed UPDATE statement
     * @param {Object} recordType - Record type information
     * @returns {Object} Update result
     */
    function updateCustomListValues(parsedStatement, recordType) {
        // Custom list updates would require loading the list and updating specific values
        // This is more complex and would need additional implementation
        throw error.create({
            name: 'UNSUPPORTED_OPERATION',
            message: 'UPDATE operations on custom lists are not yet implemented'
        });
    }

    // Public API
    return {
        execute: execute
    };
});
