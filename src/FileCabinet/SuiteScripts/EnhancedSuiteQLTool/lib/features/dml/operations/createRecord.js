/**
 * @fileoverview CREATE RECORD DML Operation
 * 
 * This module handles the execution of CREATE RECORD statements,
 * creating custom record types and their associated fields in NetSuite.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define(['N/record', 'N/error', 'N/log'], function(record, error, log) {
    'use strict';

    // Map SQL-like field types to NetSuite field types
    var FIELD_TYPE_MAP = {
        CHECKBOX: 'CHECKBOX',
        CURRENCY: 'CURRENCY',
        DATE: 'DATE',
        DATETIME: 'DATETIMETZ',
        DECIMAL: 'FLOAT',
        DOCUMENT: 'DOCUMENT',
        EMAILADDRESS: 'EMAIL',
        ENTITY: 'SELECT',
        FREEFORMTEXT: 'TEXT',
        HELP: 'HELP',
        HYPERLINK: 'URL',
        IMAGE: 'IMAGE',
        INLINEHTML: 'INLINEHTML',
        INTEGER: 'INTEGER',
        LIST: 'LIST',
        LONGTEXT: 'LONGTEXT',
        MULTISELECT: 'MULTISELECT',
        PASSWORD: 'PASSWORD',
        PERCENT: 'PERCENT',
        PHONENUMBER: 'PHONE',
        RICHTEXT: 'RICHTEXT',
        TEXTAREA: 'TEXTAREA',
        TIMEOFDAY: 'TIMEOFDAY'
    };

    /**
     * Execute CREATE RECORD operation
     * 
     * @param {Object} parsedStatement - Parsed CREATE RECORD statement
     * @returns {Object} Execution result
     */
    function execute(parsedStatement) {
        log.debug({
            title: 'Executing CREATE RECORD',
            details: 'Record ID: ' + parsedStatement.recordId + ', Fields: ' + parsedStatement.fields.length
        });

        try {
            // Create the custom record type
            var recordTypeId = createCustomRecordType(parsedStatement);
            
            // Create the custom fields
            var fieldResults = createCustomFields(parsedStatement, recordTypeId);
            
            // Log success
            log.audit({
                title: 'CREATE RECORD Success',
                details: 'Created record type: ' + parsedStatement.fullRecordId + ' with ' + fieldResults.length + ' fields'
            });

            return {
                success: true,
                result: {
                    recordTypeId: recordTypeId,
                    recordId: parsedStatement.fullRecordId,
                    fieldsCreated: fieldResults.length,
                    fields: fieldResults
                },
                error: null,
                message: 'Custom record ' + parsedStatement.fullRecordId + ' created successfully with ' + fieldResults.length + ' fields',
                metadata: {
                    operation: 'CREATE_RECORD',
                    recordId: parsedStatement.recordId,
                    fullRecordId: parsedStatement.fullRecordId,
                    displayName: parsedStatement.displayName
                }
            };

        } catch (executionError) {
            log.error({
                title: 'CREATE RECORD Error',
                details: 'Record ID: ' + parsedStatement.recordId + ', Error: ' + executionError.message
            });

            return {
                success: false,
                result: null,
                error: executionError.message,
                message: null,
                metadata: {
                    operation: 'CREATE_RECORD',
                    recordId: parsedStatement.recordId,
                    errorType: executionError.name || 'EXECUTION_ERROR'
                }
            };
        }
    }

    /**
     * Create custom record type
     * 
     * @param {Object} parsedStatement - Parsed CREATE RECORD statement
     * @returns {string} Record type internal ID
     */
    function createCustomRecordType(parsedStatement) {
        log.debug({
            title: 'Creating custom record type',
            details: 'Script ID: ' + parsedStatement.fullRecordId + ', Name: ' + parsedStatement.displayName
        });

        var customRecord = record.create({
            type: record.Type.CUSTOM_RECORD_TYPE
        });

        customRecord.setValue({
            fieldId: 'scriptid',
            value: parsedStatement.fullRecordId
        });

        customRecord.setValue({
            fieldId: 'name',
            value: parsedStatement.displayName
        });

        // Set additional default properties
        customRecord.setValue({
            fieldId: 'allowattachments',
            value: true
        });

        customRecord.setValue({
            fieldId: 'allowinlineediting',
            value: true
        });

        customRecord.setValue({
            fieldId: 'allowquicksearch',
            value: true
        });

        var recordTypeId = customRecord.save();

        log.debug({
            title: 'Custom record type created',
            details: 'Internal ID: ' + recordTypeId + ', Script ID: ' + parsedStatement.fullRecordId
        });

        return recordTypeId;
    }

    /**
     * Create custom fields for the record type
     * 
     * @param {Object} parsedStatement - Parsed CREATE RECORD statement
     * @param {string} recordTypeId - Record type internal ID
     * @returns {Array} Array of created field results
     */
    function createCustomFields(parsedStatement, recordTypeId) {
        var fieldResults = [];

        parsedStatement.fields.forEach(function(field, index) {
            try {
                var fieldId = createCustomField(field, parsedStatement.recordId, recordTypeId);
                fieldResults.push({
                    name: field.name,
                    type: field.type,
                    scriptId: field.scriptId,
                    internalId: fieldId,
                    success: true
                });

                log.debug({
                    title: 'Field created successfully',
                    details: 'Field: ' + field.name + ', ID: ' + fieldId
                });

            } catch (fieldError) {
                log.error({
                    title: 'Field creation error',
                    details: 'Field: ' + field.name + ', Error: ' + fieldError.message
                });

                fieldResults.push({
                    name: field.name,
                    type: field.type,
                    scriptId: field.scriptId,
                    internalId: null,
                    success: false,
                    error: fieldError.message
                });
            }
        });

        return fieldResults;
    }

    /**
     * Create a single custom field
     * 
     * @param {Object} field - Field definition
     * @param {string} recordId - Record ID for script ID generation
     * @param {string} recordTypeId - Record type internal ID
     * @returns {string} Field internal ID
     */
    function createCustomField(field, recordId, recordTypeId) {
        var fieldType = FIELD_TYPE_MAP[field.type.toUpperCase()];
        if (!fieldType) {
            throw error.create({
                name: 'INVALID_FIELD_TYPE',
                message: 'Unsupported field type: ' + field.type
            });
        }

        var customField = record.create({
            type: record.Type.CUSTOM_FIELD,
            isDynamic: true
        });

        // Generate script ID
        var scriptId = 'custrecord_' + recordId + '_' + field.name;
        
        customField.setValue({
            fieldId: 'scriptid',
            value: scriptId
        });

        customField.setValue({
            fieldId: 'label',
            value: field.name
        });

        customField.setValue({
            fieldId: 'type',
            value: fieldType
        });

        // Set list type if applicable
        if (field.type.toUpperCase() === 'LIST' && field.listType) {
            customField.setValue({
                fieldId: 'sourcetype',
                value: field.listType
            });
        }

        customField.setValue({
            fieldId: 'recordtype',
            value: recordTypeId
        });

        // Set additional field properties
        customField.setValue({
            fieldId: 'displaytype',
            value: 'NORMAL'
        });

        return customField.save();
    }

    /**
     * Get supported field types
     * 
     * @returns {Array} Array of supported field type names
     */
    function getSupportedFieldTypes() {
        return Object.keys(FIELD_TYPE_MAP);
    }

    /**
     * Check if field type is supported
     * 
     * @param {string} fieldType - Field type to check
     * @returns {boolean} True if supported
     */
    function isFieldTypeSupported(fieldType) {
        return FIELD_TYPE_MAP.hasOwnProperty(fieldType.toUpperCase());
    }

    // Public API
    return {
        execute: execute,
        createCustomRecordType: createCustomRecordType,
        createCustomFields: createCustomFields,
        createCustomField: createCustomField,
        getSupportedFieldTypes: getSupportedFieldTypes,
        isFieldTypeSupported: isFieldTypeSupported,
        FIELD_TYPE_MAP: FIELD_TYPE_MAP
    };
});
