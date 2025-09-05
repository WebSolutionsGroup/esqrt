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
            // Generate manual creation instructions
            var instructions = createCustomRecordType(parsedStatement);

            // Log the requirement for manual creation
            log.audit({
                title: 'CREATE RECORD - Manual Creation Required',
                details: 'Generated instructions for: ' + parsedStatement.fullRecordId + ' with ' + parsedStatement.fields.length + ' fields'
            });

            return {
                success: false,
                result: instructions,
                error: 'Manual creation required - NetSuite does not support creating custom record types via SuiteScript',
                message: 'Custom record types must be created manually in NetSuite. See the detailed instructions in the result.',
                metadata: {
                    operation: 'CREATE_RECORD',
                    recordId: parsedStatement.recordId,
                    fullRecordId: parsedStatement.fullRecordId,
                    displayName: parsedStatement.displayName,
                    requiresManualCreation: true
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
            title: 'createCustomRecordType input',
            details: 'Parsed statement: ' + JSON.stringify(parsedStatement)
        });

        // Ensure we have a valid display name
        var displayName = parsedStatement.displayName || parsedStatement.recordId || 'Custom Record';

        log.debug({
            title: 'Creating custom record type',
            details: 'Script ID: ' + parsedStatement.fullRecordId + ', Name: ' + displayName + ', Original Display Name: ' + parsedStatement.displayName + ', Record ID: ' + parsedStatement.recordId
        });



        // IMPORTANT: NetSuite does not allow creating custom record types via SuiteScript
        // Instead, we'll return detailed instructions for manual creation

        var recordScriptId = parsedStatement.fullRecordId.replace(/^customrecord_/, '');

        var instructions = {
            operation: 'MANUAL_CREATION_REQUIRED',
            recordType: 'Custom Record Type',
            scriptId: recordScriptId,
            displayName: trimmedDisplayName,
            steps: [
                '1. Go to Customization > Lists, Records, & Fields > Record Types > New',
                '2. Set Record Name: "' + trimmedDisplayName + '"',
                '3. Set ID: "' + recordScriptId + '"',
                '4. Configure the following options:'
            ],
            configuration: {},
            fields: []
        };

        // Add configuration options if provided
        if (parsedStatement.recordOptions) {
            if (parsedStatement.recordOptions.description) {
                instructions.configuration.description = parsedStatement.recordOptions.description;
                instructions.steps.push('   - Description: "' + parsedStatement.recordOptions.description + '"');
            }
            if (parsedStatement.recordOptions.owner) {
                instructions.configuration.owner = parsedStatement.recordOptions.owner;
                instructions.steps.push('   - Owner: Employee ID ' + parsedStatement.recordOptions.owner);
            }
            if (parsedStatement.recordOptions.allowAttachments !== null) {
                instructions.configuration.allowAttachments = parsedStatement.recordOptions.allowAttachments;
                instructions.steps.push('   - Allow Attachments: ' + parsedStatement.recordOptions.allowAttachments);
            }
            if (parsedStatement.recordOptions.enableSystemNotes !== null) {
                instructions.configuration.enableSystemNotes = parsedStatement.recordOptions.enableSystemNotes;
                instructions.steps.push('   - Enable System Notes: ' + parsedStatement.recordOptions.enableSystemNotes);
            }
            if (parsedStatement.recordOptions.includeInGlobalSearch !== null) {
                instructions.configuration.includeInGlobalSearch = parsedStatement.recordOptions.includeInGlobalSearch;
                instructions.steps.push('   - Include in Global Search: ' + parsedStatement.recordOptions.includeInGlobalSearch);
            }
        }

        instructions.steps.push('5. Save the record type');
        instructions.steps.push('6. Add the following fields:');

        // Add field creation instructions
        parsedStatement.fields.forEach(function(field, index) {
            var fieldScriptId = field.scriptId.replace(/^custrecord_/, '');
            instructions.fields.push({
                name: field.name,
                type: field.type,
                scriptId: fieldScriptId,
                listType: field.listType
            });
            instructions.steps.push('   Field ' + (index + 1) + ': "' + field.name + '" (Type: ' + field.type + ', ID: "' + fieldScriptId + '")');
        });

        log.audit({
            title: 'CREATE RECORD - Manual Creation Required',
            details: 'Generated instructions for creating custom record type: ' + parsedStatement.fullRecordId
        });

        return instructions;
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
        log.debug({
            title: 'Creating custom field',
            details: 'Field: ' + field.name + ', Type: ' + field.type + ', Script ID: ' + field.scriptId
        });

        var fieldType = FIELD_TYPE_MAP[field.type.toUpperCase()];
        if (!fieldType) {
            throw error.create({
                name: 'INVALID_FIELD_TYPE',
                message: 'Unsupported field type: ' + field.type
            });
        }



        var customField = record.create({
            type: 'customfield',
            isDynamic: true
        });

        // NetSuite automatically adds 'custrecord_' prefix, so only pass the suffix
        var fieldScriptId = field.scriptId.replace(/^custrecord_/, '');

        customField.setValue({
            fieldId: 'scriptid',
            value: fieldScriptId
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
            log.debug({
                title: 'Setting list source type',
                details: 'Field: ' + field.name + ', List Type: ' + field.listType
            });

            // Standard NetSuite lists that don't need prefixes
            var standardLists = [
                'department', 'location', 'subsidiary', 'class', 'currency', 'employee',
                'customer', 'vendor', 'partner', 'item', 'entity', 'account', 'job',
                'campaign', 'promotion', 'contact', 'lead', 'prospect', 'salesrep',
                'territory', 'taxcode', 'taxitem', 'paymentmethod', 'terms', 'pricelevel',
                'unitstype', 'billingschedule', 'revrecschedule', 'itemgroup', 'kititem',
                'assemblyitem', 'inventoryitem', 'noninventoryitem', 'serviceitem',
                'otherchargeitem', 'discountitem', 'paymentitem', 'subtotalitem',
                'markupitem', 'downloaditem', 'giftcertificateitem'
            ];

            var listType = field.listType;

            // Check if it's a standard list or already has a proper prefix
            if (!standardLists.includes(listType.toLowerCase()) &&
                !listType.startsWith('customlist_') &&
                !listType.startsWith('customrecord_')) {
                // Only add customlist_ prefix if it's not a standard list and doesn't have a prefix
                listType = 'customlist_' + listType;
                log.debug({
                    title: 'Added custom list prefix',
                    details: 'Original: ' + field.listType + ', Corrected: ' + listType
                });
            }

            customField.setValue({
                fieldId: 'sourcetype',
                value: listType
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
