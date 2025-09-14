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
    'N/record',
    '../dmlUtils'
], function(log, error, record, dmlUtils) {
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
            var recordType = dmlUtils.determineRecordType(parsedStatement.tableName);
            var result;

            if (recordType.isCustomList) {
                result = insertCustomListValues(parsedStatement, recordType);
            } else {
                result = insertRecord(parsedStatement, recordType);
            }

            // Handle preview vs actual insert results
            if (result.isPreview) {
                // Calculate the actual number of records that would be inserted
                var recordsToInsert = 1; // Default for single record
                if (result.previewData && Array.isArray(result.previewData)) {
                    recordsToInsert = result.previewData.length;
                } else if (parsedStatement.multipleValues) {
                    recordsToInsert = parsedStatement.multipleValues.length;
                }

                log.audit({
                    title: 'INSERT PREVIEW - NO RECORDS INSERTED',
                    details: 'Table: ' + parsedStatement.tableName + ', Records that would be inserted: ' + recordsToInsert
                });

                return {
                    success: true,
                    result: result,
                    error: null,
                    message: '🔍 PREVIEW ONLY - NO RECORDS INSERTED. Would insert ' + recordsToInsert + ' record' + (recordsToInsert === 1 ? '' : 's') + ' into ' + parsedStatement.tableName + '. Add COMMIT to actually insert.',
                    metadata: {
                        operation: 'INSERT_PREVIEW',
                        tableName: parsedStatement.tableName,
                        recordType: recordType.type,
                        recordsToInsert: recordsToInsert,
                        previewData: result.previewData || parsedStatement.fields,
                        isPreviewOnly: true,
                        instructionToInsert: 'Add COMMIT to the end of your INSERT statement to actually insert these records'
                    }
                };
            } else {
                // Handle different result structures for custom lists vs regular records
                var recordId = result.recordId || (result.recordIds && result.recordIds[0]) || 'undefined';
                var recordCount = result.valuesAdded || result.recordsCreated || 1;
                var recordIds = result.recordIds || [recordId];

                log.audit({
                    title: 'INSERT Success',
                    details: 'Table: ' + parsedStatement.tableName + ', Record ID: ' + recordId + ', Records Created: ' + recordCount
                });

                // Create appropriate success message
                var message;
                if (recordCount === 1) {
                    message = 'Record inserted successfully into ' + parsedStatement.tableName + '. Record ID: ' + recordId;
                } else {
                    message = recordCount + ' records inserted successfully into ' + parsedStatement.tableName + '. Record IDs: ' + recordIds.join(', ');
                }

                return {
                    success: true,
                    result: result,
                    error: null,
                    message: message,
                    metadata: {
                        operation: 'INSERT',
                        tableName: parsedStatement.tableName,
                        recordType: recordType.type,
                        recordId: recordId,
                        recordIds: recordIds,
                        recordCount: recordCount
                    }
                };
            }

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

        // Determine if we have single or multiple values
        var valuesToProcess = [];

        if (parsedStatement.multipleValues) {
            // Multiple VALUES syntax: INSERT INTO table (col1, col2) VALUES (val1, val2), (val3, val4)
            valuesToProcess = parsedStatement.multipleValues;
        } else if (parsedStatement.fields) {
            // Single SET syntax: INSERT INTO table SET col1=val1, col2=val2
            valuesToProcess = [parsedStatement.fields];
        } else {
            throw error.create({
                name: 'NO_VALUES_PROVIDED',
                message: 'No values provided for INSERT operation'
            });
        }

        // Handle PREVIEW mode - show what would be inserted without actually inserting
        if (parsedStatement.isPreview) {
            log.audit({
                title: 'INSERT PREVIEW - NO RECORDS INSERTED',
                details: 'Type: ' + recordType.type + ', Records that would be inserted: ' + valuesToProcess.length
            });

            return {
                recordsCreated: 0,
                isPreview: true,
                previewData: valuesToProcess,
                message: '🔍 PREVIEW ONLY - NO RECORDS INSERTED. Would insert ' + valuesToProcess.length + ' record(s). Add COMMIT to actually insert these records.'
            };
        }

        // Process each record
        var createdRecords = [];
        var totalFieldsSet = 0;

        for (var i = 0; i < valuesToProcess.length; i++) {
            var fieldsToSet = valuesToProcess[i];

            log.debug({
                title: 'Creating record ' + (i + 1) + ' of ' + valuesToProcess.length,
                details: 'Fields: ' + JSON.stringify(fieldsToSet)
            });

            // Create new record
            var newRecord = record.create({
                type: recordType.type,
                isDynamic: false
            });

            // Set field values for this record
            for (var fieldId in fieldsToSet) {
                var value = fieldsToSet[fieldId];

                // Validate field before attempting to set it
                if (!dmlUtils.validateField(recordType.type, fieldId)) {
                    log.warn({
                        title: 'Invalid field detected',
                        details: 'Field: ' + fieldId + ', Record Type: ' + recordType.type
                    });
                    // Continue anyway - NetSuite will provide the definitive validation
                }

                // Format date fields for NetSuite record.setValue()
                if (isDateField(fieldId) && isDateString(value)) {
                    var originalValue = value;
                    value = formatDateForRecordSetValue(value);
                    log.audit({
                        title: 'Date field formatted for INSERT',
                        details: 'Field: ' + fieldId + ', Original: ' + originalValue + ', Formatted: ' + value + ', Type: ' + typeof value
                    });
                }

                try {
                    newRecord.setValue({
                        fieldId: fieldId,
                        value: value
                    });

                    log.debug({
                        title: 'Field set',
                        details: 'Record ' + (i + 1) + ', Field: ' + fieldId + ', Value: ' + value
                    });
                } catch (fieldError) {
                    log.error({
                        title: 'Error setting field',
                        details: 'Record ' + (i + 1) + ', Field: ' + fieldId + ', Value: ' + value + ' (type: ' + typeof value + '), Error: ' + fieldError.message + ', Error Code: ' + (fieldError.name || 'N/A')
                    });

                    // If it's a date field error, try alternative formats
                    if (isDateField(fieldId) && fieldError.message && fieldError.message.toLowerCase().includes('date')) {
                        log.audit({
                            title: 'Attempting alternative date format',
                            details: 'Field: ' + fieldId + ', Original value: ' + fieldsToSet[fieldId]
                        });

                        try {
                            // Try with string format M/D/YYYY
                            var dateObj = formatDateForRecordSetValue(fieldsToSet[fieldId]);
                            var dateString = (dateObj.getMonth() + 1) + '/' + dateObj.getDate() + '/' + dateObj.getFullYear();

                            newRecord.setValue({
                                fieldId: fieldId,
                                value: dateString
                            });

                            log.audit({
                                title: 'Alternative date format succeeded',
                                details: 'Field: ' + fieldId + ', Used string format: ' + dateString
                            });

                            continue; // Skip the error throwing
                        } catch (altError) {
                            log.error({
                                title: 'Alternative date format also failed',
                                details: 'Field: ' + fieldId + ', Alt Error: ' + altError.message
                            });
                        }
                    }

                    throw error.create({
                        name: 'FIELD_SET_ERROR',
                        message: 'Error setting field "' + fieldId + '" on record ' + (i + 1) + ': ' + fieldError.message
                    });
                }
            }

            // Save the record
            var recordId = newRecord.save();
            createdRecords.push(recordId);
            totalFieldsSet += Object.keys(fieldsToSet).length;

            log.debug({
                title: 'Record created successfully',
                details: 'Record ' + (i + 1) + ' ID: ' + recordId
            });
        }

        return {
            recordId: createdRecords.length === 1 ? createdRecords[0] : createdRecords,
            recordIds: createdRecords,
            recordType: recordType.type,
            recordsCreated: createdRecords.length,
            fieldsSet: totalFieldsSet
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
            title: 'Adding value(s) to custom list',
            details: 'List: ' + recordType.type + ', Multiple: ' + !!parsedStatement.multipleValues
        });

        // Determine if we have single or multiple values
        var valuesToProcess = [];

        if (parsedStatement.multipleValues) {
            // Multiple VALUES syntax: INSERT INTO list (name) VALUES ('val1'), ('val2'), ('val3')
            valuesToProcess = parsedStatement.multipleValues;
        } else if (parsedStatement.fields) {
            // Single SET syntax: INSERT INTO list SET name='value'
            valuesToProcess = [parsedStatement.fields];
        } else {
            throw error.create({
                name: 'NO_VALUES_PROVIDED',
                message: 'No values provided for INSERT operation'
            });
        }

        // Handle PREVIEW mode - show what would be inserted without actually inserting
        if (parsedStatement.isPreview) {
            log.audit({
                title: 'INSERT PREVIEW - NO RECORDS INSERTED',
                details: 'List: ' + recordType.type + ', Values: ' + JSON.stringify(valuesToProcess)
            });

            return {
                valuesAdded: 0,
                isPreview: true,
                previewData: valuesToProcess,
                message: '🔍 PREVIEW ONLY - NO RECORDS INSERTED. Would insert ' + valuesToProcess.length + ' value(s). Add COMMIT to actually insert these values.'
            };
        }

        var createdRecords = [];
        var errors = [];

        // Process each value (following the pattern from your sample code)
        for (var i = 0; i < valuesToProcess.length; i++) {
            try {
                var valueData = valuesToProcess[i];

                // Create a new custom list value record for each value
                var customListValue = record.create({
                    type: recordType.type,  // Use the custom list script ID as the record type
                    isDynamic: true
                });

                // Set field values for this list value
                for (var fieldId in valueData) {
                    var value = valueData[fieldId];

                    try {
                        // Map common field names to NetSuite list value fields
                        var netsuiteFieldId = mapListValueField(fieldId);

                        // Format date fields for NetSuite record.setValue() - requires M/D/YYYY format
                        if (isDateField(netsuiteFieldId) && isDateString(value)) {
                            value = formatDateForRecordSetValue(value);
                            log.debug({
                                title: 'Date field formatted for custom list INSERT',
                                details: 'Field: ' + netsuiteFieldId + ', Formatted Value: ' + value
                            });
                        }

                        customListValue.setValue({
                            fieldId: netsuiteFieldId,
                            value: value
                        });

                        log.debug({
                            title: 'List value field set',
                            details: 'Value ' + (i + 1) + ', Field: ' + fieldId + ' -> ' + netsuiteFieldId + ', Value: ' + value
                        });
                    } catch (fieldError) {
                        throw error.create({
                            name: 'FIELD_SET_ERROR',
                            message: 'Error setting field "' + fieldId + '": ' + fieldError.message
                        });
                    }
                }

                // Save the new list value
                var listValueId = customListValue.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                createdRecords.push(listValueId);

                log.debug({
                    title: 'Custom list value created',
                    details: 'Value ' + (i + 1) + ' created with ID: ' + listValueId
                });

            } catch (valueError) {
                errors.push({
                    valueIndex: i + 1,
                    valueData: valuesToProcess[i],
                    error: valueError.message
                });

                log.error({
                    title: 'Error creating list value',
                    details: 'Value ' + (i + 1) + ': ' + valueError.message
                });
            }
        }

        // Check if any values were successfully created
        if (createdRecords.length === 0) {
            throw error.create({
                name: 'INSERT_FAILED',
                message: 'Failed to create any list values. First error: ' + (errors[0] ? errors[0].error : 'Unknown error')
            });
        }

        return {
            recordIds: createdRecords,
            recordType: recordType.type,
            valuesAdded: createdRecords.length,
            errors: errors.length > 0 ? errors : null
        };
    }

    /**
     * Map SQL field names to NetSuite custom list value field IDs
     *
     * @param {string} sqlFieldId - SQL field name
     * @returns {string} NetSuite field ID
     */
    function mapListValueField(sqlFieldId) {
        var fieldMap = {
            'name': 'name',
            'value': 'name',  // 'value' maps to 'name' field in list values
            'abbreviation': 'abbreviation',
            'description': 'description',
            'isinactive': 'isinactive',
            'inactive': 'isinactive',
            'externalid': 'externalid'
        };

        return fieldMap[sqlFieldId.toLowerCase()] || sqlFieldId;
    }



    /**
     * Helper function to detect if a field is a date field
     */
    function isDateField(fieldName) {
        var dateFields = [
            'trandate', 'duedate', 'closedate', 'startdate', 'enddate',
            'expectedclosedate', 'projectedenddate', 'actualenddate',
            'created', 'lastmodified', 'datecreated', 'lastmodifieddate',
            'birthdate', 'hiredate', 'releasedate', 'terminationdate'
        ];
        var lowerFieldName = fieldName.toLowerCase();
        return dateFields.indexOf(lowerFieldName) !== -1 ||
               lowerFieldName.includes('date') ||
               lowerFieldName.includes('time');
    }

    /**
     * Helper function to detect if a string looks like a date
     */
    function isDateString(value) {
        // Check for common date formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, etc.
        var datePatterns = [
            /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
            /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or D/M/YYYY
            /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-M-D
            /^\d{2}-\d{2}-\d{4}$/ // MM-DD-YYYY or DD-MM-YYYY
        ];
        return datePatterns.some(function(pattern) {
            return pattern.test(value);
        });
    }

    /**
     * Helper function to format date for NetSuite record.setValue()
     * NetSuite record.setValue() can accept Date objects or properly formatted strings
     */
    function formatDateForRecordSetValue(dateString) {
        try {
            var date;

            log.debug({
                title: 'formatDateForRecordSetValue input',
                details: 'Input: ' + dateString + ', Type: ' + typeof dateString
            });

            // Handle different input formats
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                // YYYY-MM-DD format
                var parts = dateString.split('-');
                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
                // M/D/YYYY or MM/DD/YYYY format
                var parts = dateString.split('/');
                date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            } else {
                // Try to parse as-is
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) {
                log.error({
                    title: 'Invalid date parsed',
                    details: 'Could not parse date: ' + dateString
                });
                return dateString;
            }

            // Try returning a Date object first - NetSuite often prefers this
            log.debug({
                title: 'formatDateForRecordSetValue output',
                details: 'Returning Date object: ' + date.toString()
            });

            return date;

        } catch (e) {
            log.error({
                title: 'Date formatting error',
                details: 'Could not format date: ' + dateString + ', Error: ' + e.message
            });
            return dateString; // Return original if formatting fails
        }
    }

    // Public API
    return {
        execute: execute
    };
});
