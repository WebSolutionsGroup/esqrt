/**
 * @fileoverview INSERT Record Operation
 * 
 * Handles INSERT INTO statements for creating new record instances in NetSuite.
 * Supports both standard NetSuite records and custom record types.
 * 
 * Syntax examples:
 * - INSERT INTO customer (companyname, email) VALUES ('Acme Corp', 'contact@acme.com')
 * - INSERT INTO customrecord_employee SET name='John Doe', department='Engineering'
 * - INSERT INTO customlist_departments VALUES ('Engineering', 'Marketing')
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define([
    'N/log',
    'N/error', 
    'N/record'
], function(log, error, record) {
    'use strict';

    /**
     * Execute INSERT operation
     * 
     * @param {Object} parsedStatement - Parsed INSERT statement
     * @returns {Object} Execution result
     */
    function execute(parsedStatement) {
        log.debug({
            title: 'Executing INSERT',
            details: 'Table: ' + parsedStatement.tableName + ', Fields: ' + JSON.stringify(parsedStatement.fields)
        });

        try {
            // Determine record type and operation
            var recordType = determineRecordType(parsedStatement.tableName);
            var result;

            if (recordType.isCustomList) {
                result = insertCustomListValues(parsedStatement, recordType);
            } else {
                result = insertRecord(parsedStatement, recordType);
            }

            log.audit({
                title: 'INSERT Success',
                details: 'Table: ' + parsedStatement.tableName + ', Record ID: ' + result.recordId
            });

            return {
                success: true,
                result: result,
                error: null,
                message: 'Record inserted successfully into ' + parsedStatement.tableName,
                metadata: {
                    operation: 'INSERT',
                    tableName: parsedStatement.tableName,
                    recordType: recordType.type,
                    recordId: result.recordId
                }
            };

        } catch (executionError) {
            log.error({
                title: 'INSERT Error',
                details: 'Table: ' + parsedStatement.tableName + ', Error: ' + executionError.message
            });

            return {
                success: false,
                result: null,
                error: executionError.message,
                message: null,
                metadata: {
                    operation: 'INSERT',
                    tableName: parsedStatement.tableName,
                    errorType: executionError.name || 'EXECUTION_ERROR'
                }
            };
        }
    }

    /**
     * Determine NetSuite record type from table name
     * 
     * @param {string} tableName - Table name from SQL statement
     * @returns {Object} Record type information
     */
    function determineRecordType(tableName) {
        // Custom record types
        if (tableName.startsWith('customrecord_')) {
            return {
                type: tableName,
                isCustomRecord: true,
                isCustomList: false
            };
        }

        // Custom lists
        if (tableName.startsWith('customlist_')) {
            return {
                type: tableName,
                isCustomRecord: false,
                isCustomList: true
            };
        }

        // Standard NetSuite records - map common table names to record types
        var standardRecordMap = {
            'customer': record.Type.CUSTOMER,
            'vendor': record.Type.VENDOR,
            'employee': record.Type.EMPLOYEE,
            'item': record.Type.INVENTORY_ITEM,
            'salesorder': record.Type.SALES_ORDER,
            'purchaseorder': record.Type.PURCHASE_ORDER,
            'invoice': record.Type.INVOICE,
            'bill': record.Type.VENDOR_BILL,
            'contact': record.Type.CONTACT,
            'lead': record.Type.LEAD,
            'opportunity': record.Type.OPPORTUNITY,
            'task': record.Type.TASK,
            'event': record.Type.CALENDAR_EVENT,
            'case': record.Type.SUPPORT_CASE
        };

        var recordType = standardRecordMap[tableName.toLowerCase()];
        if (recordType) {
            return {
                type: recordType,
                isCustomRecord: false,
                isCustomList: false
            };
        }

        // Default to treating as custom record if not found
        return {
            type: 'customrecord_' + tableName,
            isCustomRecord: true,
            isCustomList: false
        };
    }

    /**
     * Insert new record instance
     * 
     * @param {Object} parsedStatement - Parsed INSERT statement
     * @param {Object} recordType - Record type information
     * @returns {Object} Insert result
     */
    function insertRecord(parsedStatement, recordType) {
        log.debug({
            title: 'Creating new record',
            details: 'Type: ' + recordType.type + ', Fields: ' + Object.keys(parsedStatement.fields).length
        });

        // Create new record
        var newRecord = record.create({
            type: recordType.type,
            isDynamic: false
        });

        // Set field values
        for (var fieldId in parsedStatement.fields) {
            var value = parsedStatement.fields[fieldId];
            
            try {
                newRecord.setValue({
                    fieldId: fieldId,
                    value: value
                });
                
                log.debug({
                    title: 'Field set',
                    details: 'Field: ' + fieldId + ', Value: ' + value
                });
            } catch (fieldError) {
                log.error({
                    title: 'Error setting field',
                    details: 'Field: ' + fieldId + ', Value: ' + value + ', Error: ' + fieldError.message
                });
                throw error.create({
                    name: 'FIELD_SET_ERROR',
                    message: 'Error setting field "' + fieldId + '": ' + fieldError.message
                });
            }
        }

        // Save the record
        var recordId = newRecord.save();

        return {
            recordId: recordId,
            recordType: recordType.type,
            fieldsSet: Object.keys(parsedStatement.fields).length
        };
    }

    /**
     * Insert values into custom list
     * 
     * @param {Object} parsedStatement - Parsed INSERT statement
     * @param {Object} recordType - Record type information
     * @returns {Object} Insert result
     */
    function insertCustomListValues(parsedStatement, recordType) {
        log.debug({
            title: 'Adding values to custom list',
            details: 'List: ' + recordType.type + ', Values: ' + JSON.stringify(parsedStatement.fields)
        });

        // Load the custom list
        var customList = record.load({
            type: record.Type.CUSTOM_LIST,
            id: recordType.type
        });

        // Add new values to the list
        var valuesAdded = 0;
        
        // If fields contain list values, add them
        if (parsedStatement.fields.value || parsedStatement.fields.name) {
            var listValue = parsedStatement.fields.value || parsedStatement.fields.name;
            var abbreviation = parsedStatement.fields.abbreviation || '';
            
            customList.insertLine({
                sublistId: 'customvalue',
                line: customList.getLineCount({ sublistId: 'customvalue' })
            });
            
            customList.setSublistValue({
                sublistId: 'customvalue',
                fieldId: 'value',
                line: customList.getLineCount({ sublistId: 'customvalue' }) - 1,
                value: listValue
            });
            
            if (abbreviation) {
                customList.setSublistValue({
                    sublistId: 'customvalue',
                    fieldId: 'abbreviation',
                    line: customList.getLineCount({ sublistId: 'customvalue' }) - 1,
                    value: abbreviation
                });
            }
            
            valuesAdded = 1;
        }

        // Save the list
        var listId = customList.save();

        return {
            recordId: listId,
            recordType: recordType.type,
            valuesAdded: valuesAdded
        };
    }

    // Public API
    return {
        execute: execute
    };
});
