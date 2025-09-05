/**
 * @fileoverview DML Parser for Data Manipulation Language Operations
 * 
 * This module handles detection and parsing of DML statements within queries.
 * 
 * Detects patterns like:
 * - CREATE RECORD record_name (field1 TYPE, field2 TYPE)
 * - CREATE LIST list_name (options...)
 * - Future: UPDATE RECORD, DELETE RECORD, etc.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define(['N/log'], function(log) {
    'use strict';

    /**
     * DML analysis result structure
     * @typedef {Object} DMLAnalysis
     * @property {boolean} isDMLStatement - Whether query contains DML operations
     * @property {string} dmlType - Type of DML operation (CREATE_RECORD, CREATE_LIST, etc.)
     * @property {Object} parsedStatement - Parsed DML statement details
     * @property {string} originalQuery - Original query text
     * @property {string} error - Error message if parsing failed
     */

    /**
     * Analyze query for DML operations
     * 
     * @param {string} query - Query to analyze
     * @returns {DMLAnalysis} Analysis results
     */
    function analyzeDMLQuery(query) {
        if (!query || typeof query !== 'string') {
            return createEmptyAnalysis(query);
        }

        var trimmedQuery = query.trim();
        var analysis = {
            isDMLStatement: false,
            dmlType: null,
            parsedStatement: null,
            originalQuery: query,
            error: null
        };

        try {
            // Check for CREATE RECORD statements
            if (isCreateRecordStatement(trimmedQuery)) {
                analysis.isDMLStatement = true;
                analysis.dmlType = 'CREATE_RECORD';
                analysis.parsedStatement = parseCreateRecordStatement(trimmedQuery);
            }
            // Check for CREATE LIST statements
            else if (isCreateListStatement(trimmedQuery)) {
                analysis.isDMLStatement = true;
                analysis.dmlType = 'CREATE_LIST';
                analysis.parsedStatement = parseCreateListStatement(trimmedQuery);
            }
            // Check for INSERT statements
            else if (isInsertStatement(trimmedQuery)) {
                analysis.isDMLStatement = true;
                analysis.dmlType = 'INSERT';
                analysis.parsedStatement = parseInsertStatement(trimmedQuery);
            }
            // Check for UPDATE statements
            else if (isUpdateStatement(trimmedQuery)) {
                analysis.isDMLStatement = true;
                analysis.dmlType = 'UPDATE';
                analysis.parsedStatement = parseUpdateStatement(trimmedQuery);
            }
            // Check for DELETE statements
            else if (isDeleteStatement(trimmedQuery)) {
                analysis.isDMLStatement = true;
                analysis.dmlType = 'DELETE';
                analysis.parsedStatement = parseDeleteStatement(trimmedQuery);
            }

            log.debug({
                title: 'DML Analysis Complete',
                details: 'Type: ' + analysis.dmlType + ', Is DML: ' + analysis.isDMLStatement
            });

        } catch (error) {
            log.error({
                title: 'DML Analysis Error',
                details: error.message
            });
            
            analysis.error = error.message;
        }

        return analysis;
    }

    /**
     * Check if query is a CREATE RECORD statement
     * 
     * @param {string} query - Query to check
     * @returns {boolean} True if CREATE RECORD statement
     */
    function isCreateRecordStatement(query) {
        return /^\s*CREATE\s+RECORD\s+\w+\s*\(/i.test(query);
    }

    /**
     * Check if query is a CREATE LIST statement
     *
     * @param {string} query - Query to check
     * @returns {boolean} True if CREATE LIST statement
     */
    function isCreateListStatement(query) {
        return /^\s*CREATE\s+LIST\s+\w+\s*\(/i.test(query);
    }

    /**
     * Check if query is an INSERT statement
     *
     * @param {string} query - Query to check
     * @returns {boolean} True if INSERT statement
     */
    function isInsertStatement(query) {
        return /^\s*INSERT\s+INTO\s+/i.test(query);
    }

    /**
     * Check if query is an UPDATE statement
     *
     * @param {string} query - Query to check
     * @returns {boolean} True if UPDATE statement
     */
    function isUpdateStatement(query) {
        return /^\s*UPDATE\s+/i.test(query);
    }

    /**
     * Check if query is a DELETE statement
     *
     * @param {string} query - Query to check
     * @returns {boolean} True if DELETE statement
     */
    function isDeleteStatement(query) {
        return /^\s*DELETE\s+FROM\s+/i.test(query);
    }

    /**
     * Parse CREATE RECORD statement
     * 
     * @param {string} query - CREATE RECORD statement
     * @returns {Object} Parsed statement details
     */
    function parseCreateRecordStatement(query) {
        var recordMatch = query.match(/CREATE\s+RECORD\s+(\w+)\s*\((.*?)\);?/is);
        if (!recordMatch) {
            throw new Error('Invalid CREATE RECORD syntax');
        }

        var recordId = recordMatch[1];
        var fieldsStr = recordMatch[2];

        log.debug({
            title: 'Parsing CREATE RECORD',
            details: 'Record ID: ' + recordId + ', Fields String: ' + fieldsStr
        });

        var parseResult = parseFields(fieldsStr, recordId);

        // Apply prefix to record script ID and display name
        var baseRecordId = parseResult.prefix ? parseResult.prefix + recordId : recordId;
        // NetSuite adds 'customrecord_' automatically, so limit is 40 - 13 = 27 chars for our part
        var truncatedRecordId = truncateScriptId(baseRecordId, 40 - 'customrecord_'.length);
        var fullRecordId = 'customrecord_' + truncatedRecordId;

        // Use the explicitly provided name, or fall back to generated display name
        var displayName = parseResult.recordOptions.name || (parseResult.prefix ? parseResult.prefix + recordId : recordId);

        // Ensure display name is not empty
        if (!displayName || displayName.trim() === '') {
            displayName = recordId || 'Custom Record';
        }

        log.debug({
            title: 'Final parsing results',
            details: 'Record ID: ' + recordId + ', Prefix: "' + parseResult.prefix + '", Display Name: "' + displayName + '", Full Record ID: ' + fullRecordId + ', Options: ' + JSON.stringify(parseResult.recordOptions)
        });

        // Log truncation if it occurred
        if (baseRecordId !== truncatedRecordId) {
            log.debug({
                title: 'Record script ID truncated',
                details: 'Original: ' + baseRecordId + ', Truncated: ' + truncatedRecordId
            });
        }

        return {
            recordId: recordId,
            fullRecordId: fullRecordId,
            fields: parseResult.fields,
            displayName: displayName,
            prefix: parseResult.prefix,
            recordOptions: parseResult.recordOptions
        };
    }

    /**
     * Parse CREATE LIST statement
     * 
     * @param {string} query - CREATE LIST statement
     * @returns {Object} Parsed statement details
     */
    function parseCreateListStatement(query) {
        var listMatch = query.match(/CREATE\s+LIST\s+(\w+)\s*\((.*?)\);?/is);
        if (!listMatch) {
            throw new Error('Invalid CREATE LIST syntax');
        }

        var listId = listMatch[1];
        var optionsStr = listMatch[2];
        var options = parseListOptions(optionsStr);

        return {
            listId: listId,
            fullListId: 'customlist_' + listId,
            options: options,
            displayName: listId
        };
    }

    /**
     * Parse field definitions from CREATE RECORD statement
     * 
     * @param {string} fieldsStr - Field definitions string
     * @returns {Array} Array of field objects
     */
    function parseFields(fieldsStr, recordId, prefix) {
        var fields = [];
        var fieldRegex = /(\w+)\s*(?:=\s*(?:"([^"]+)"|(\w+)|(\d+)|(true|false))|(\w+)(?:\(([^)]+)\))?|"([^"]+)")/g;
        var match;
        var extractedPrefix = prefix || '';
        var recordOptions = {
            name: null,
            description: null,
            owner: null,
            accessType: null,
            allowQuickAdd: null,
            enableSystemNotes: null,
            includeInGlobalSearch: null,
            showInApplicationMenu: null,
            enableOptimisticLocking: null,
            enableOnlineForm: null,
            enableNameTranslation: null,
            allowAttachments: null,
            showNotes: null,
            enableMailMerge: null,
            recordsAreOrdered: null,
            showCreationDate: null,
            showLastModified: null,
            showOwner: null,
            allowInlineEditing: null,
            allowQuickSearch: null,
            allowReports: null,
            allowDuplicates: null,
            // Numbering options
            numberingPrefix: null,
            numberingSuffix: null,
            initialNumber: null,
            allowOverride: null,
            // Icon options
            iconType: null,
            builtInIcon: null,
            customIconFile: null
        };

        while ((match = fieldRegex.exec(fieldsStr)) !== null) {
            var fieldName = match[1];
            var stringValue = match[2];    // For name = "value" syntax
            var wordValue = match[3];      // For name = value syntax
            var numberValue = match[4];    // For name = 123 syntax
            var booleanValue = match[5];   // For name = true/false syntax
            var fieldType = match[6];      // For field_name TYPE syntax
            var listType = match[7];       // For LIST(type) syntax
            var quotedValue = match[8];    // For prefix "value" syntax

            // Handle record configuration options
            var configFields = [
                'name', 'description', 'owner', 'accessType', 'allowQuickAdd', 'enableSystemNotes',
                'includeInGlobalSearch', 'showInApplicationMenu', 'enableOptimisticLocking',
                'enableOnlineForm', 'enableNameTranslation', 'allowAttachments', 'showNotes',
                'enableMailMerge', 'recordsAreOrdered', 'showCreationDate', 'showLastModified',
                'showOwner', 'allowInlineEditing', 'allowQuickSearch', 'allowReports', 'allowDuplicates',
                'numberingPrefix', 'numberingSuffix', 'initialNumber', 'allowOverride',
                'iconType', 'builtInIcon', 'customIconFile'
            ];

            if (configFields.includes(fieldName)) {
                var value = stringValue || wordValue || numberValue || booleanValue;
                if (booleanValue) {
                    value = booleanValue === 'true';
                } else if (numberValue) {
                    value = parseInt(numberValue, 10);
                }
                recordOptions[fieldName] = value;
                continue; // Don't add config options as regular fields
            }

            // Handle prefix field specially (legacy support)
            if (fieldName === 'prefix' && quotedValue) {
                extractedPrefix = quotedValue;
                continue; // Don't add prefix as a regular field
            }

            // Skip if this is not a regular field (no type specified)
            if (!fieldType) {
                continue;
            }

            // Generate script ID with prefix
            var baseFieldId = extractedPrefix ?
                extractedPrefix + recordId + '_' + fieldName :
                recordId + '_' + fieldName;
            // NetSuite adds 'custrecord_' automatically, so limit is 40 - 11 = 29 chars for our part
            var truncatedFieldId = truncateScriptId(baseFieldId, 40 - 'custrecord_'.length);
            var scriptId = 'custrecord_' + truncatedFieldId;

            // Log truncation if it occurred
            if (baseFieldId !== truncatedFieldId) {
                log.debug({
                    title: 'Field script ID truncated',
                    details: 'Original: ' + baseFieldId + ', Truncated: ' + truncatedFieldId
                });
            }

            fields.push({
                name: fieldName,
                type: fieldType,
                listType: listType,
                scriptId: scriptId
            });
        }

        log.debug({
            title: 'Field parsing complete',
            details: 'Extracted prefix: "' + extractedPrefix + '", Record options: ' + JSON.stringify(recordOptions) + ', Fields count: ' + fields.length
        });

        return {
            fields: fields,
            prefix: extractedPrefix,
            recordOptions: recordOptions
        };
    }

    /**
     * Parse options from CREATE LIST statement
     * 
     * @param {string} optionsStr - Options string
     * @returns {Object} Parsed options
     */
    function parseListOptions(optionsStr) {
        var options = {
            description: '',
            optionsorder: 'ORDER_ENTERED',
            matrixoption: false,
            isinactive: false,
            values: []
        };
        
        var lines = optionsStr.split('\n').map(function(line) {
            return line.trim();
        }).filter(function(line) {
            return line.length > 0;
        });
        
        lines.forEach(function(line) {
            if (line.startsWith('description')) {
                var descMatch = line.match(/"([^"]+)"/);
                if (descMatch) {
                    options.description = descMatch[1];
                }
            } else if (line.startsWith('optionsorder')) {
                var orderMatch = line.match(/"([^"]+)"/);
                if (orderMatch) {
                    options.optionsorder = orderMatch[1];
                }
            } else if (line.startsWith('matrixoption')) {
                var matrixMatch = line.match(/(TRUE|FALSE)/i);
                if (matrixMatch) {
                    options.matrixoption = matrixMatch[1].toUpperCase() === 'TRUE';
                }
            } else if (line.startsWith('isinactive')) {
                var inactiveMatch = line.match(/(TRUE|FALSE)/i);
                if (inactiveMatch) {
                    options.isinactive = inactiveMatch[1].toUpperCase() === 'TRUE';
                }
            } else if (line.startsWith('values')) {
                options.values = parseListValues(optionsStr);
            }
        });

        return options;
    }

    /**
     * Parse values array from CREATE LIST statement
     * 
     * @param {string} optionsStr - Options string containing values
     * @returns {Array} Array of value objects
     */
    function parseListValues(optionsStr) {
        var values = [];
        var valueRegex = /value\s+"([^"]+)"[\s\S]*?inactive\s+(TRUE|FALSE)(?:[\s\S]*?translations\s+\[(.*?)\])?/gi;
        var valueMatch;
        
        while ((valueMatch = valueRegex.exec(optionsStr)) !== null) {
            var value = valueMatch[1];
            var inactive = valueMatch[2].toUpperCase() === 'TRUE';
            var translationsStr = valueMatch[3];
            
            var valueObj = {
                value: value,
                inactive: inactive,
                translations: []
            };
            
            if (translationsStr) {
                valueObj.translations = parseTranslations(translationsStr);
            }

            // Look for abbreviation
            var abbrMatch = optionsStr.match(new RegExp('value\\s+"' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[\\s\\S]*?abbreviation\\s+"([^"]+)"'));
            if (abbrMatch) {
                valueObj.abbreviation = abbrMatch[1];
            }

            values.push(valueObj);
        }
        
        return values;
    }

    /**
     * Parse translations from CREATE LIST values
     * 
     * @param {string} translationsStr - Translations string
     * @returns {Array} Array of translation objects
     */
    function parseTranslations(translationsStr) {
        var translations = [];
        var transRegex = /language\s+"(\w+)"\s*,\s*value\s+"([^"]+)"/g;
        var transMatch;
        
        while ((transMatch = transRegex.exec(translationsStr)) !== null) {
            var language = transMatch[1];
            var value = transMatch[2];
            translations.push({
                language: language,
                value: value
            });
        }
        
        return translations;
    }

    /**
     * Create empty analysis result
     * 
     * @param {string} query - Original query
     * @returns {DMLAnalysis} Empty analysis
     */
    function createEmptyAnalysis(query) {
        return {
            isDMLStatement: false,
            dmlType: null,
            parsedStatement: null,
            originalQuery: query || '',
            error: null
        };
    }

    /**
     * Truncate script ID to fit NetSuite's 40-character total limit
     * Only applies truncation when the script ID exceeds the limit
     *
     * @param {string} scriptId - Original script ID (without prefix)
     * @param {number} maxLength - Maximum allowed length for this part
     * @returns {string} Original or truncated script ID
     */
    function truncateScriptId(scriptId, maxLength) {
        // If script ID is within the limit, return it unchanged
        if (scriptId.length <= maxLength) {
            return scriptId;
        }

        // Only apply truncation logic when script ID is too long
        log.debug({
            title: 'Script ID exceeds limit',
            details: 'Original: ' + scriptId + ' (' + scriptId.length + ' chars), Max: ' + maxLength
        });

        // Common abbreviations for field names (only used when truncation is needed)
        var abbreviations = {
            'employee': 'emp',
            'department': 'dept',
            'customer': 'cust',
            'transaction': 'txn',
            'inventory': 'inv',
            'purchase': 'purch',
            'address': 'addr',
            'telephone': 'tel',
            'description': 'desc',
            'quantity': 'qty',
            'amount': 'amt',
            'number': 'num',
            'reference': 'ref',
            'document': 'doc',
            'information': 'info',
            'management': 'mgmt',
            'administration': 'admin',
            'configuration': 'config',
            'application': 'app',
            'development': 'dev',
            'production': 'prod',
            'environment': 'env'
        };

        var result = scriptId;

        // Apply abbreviations only when needed
        for (var word in abbreviations) {
            if (abbreviations.hasOwnProperty(word)) {
                var regex = new RegExp('\\b' + word + '\\b', 'gi');
                result = result.replace(regex, abbreviations[word]);
            }
        }

        // If still too long after abbreviations, truncate intelligently
        if (result.length > maxLength) {
            // Try to preserve prefix and suffix, truncate middle
            var parts = result.split('_');
            if (parts.length > 2) {
                // Keep first part (prefix) and last part (field name), abbreviate middle
                var prefix = parts[0];
                var suffix = parts[parts.length - 1];
                var middle = parts.slice(1, -1).join('');

                var availableLength = maxLength - prefix.length - suffix.length - 2; // 2 for underscores
                if (availableLength > 0 && middle.length > availableLength) {
                    middle = middle.substring(0, availableLength);
                }
                result = prefix + '_' + middle + '_' + suffix;
            }

            // Final truncation if still too long
            if (result.length > maxLength) {
                result = result.substring(0, maxLength);
            }
        }

        log.debug({
            title: 'Script ID truncated',
            details: 'Result: ' + result + ' (' + result.length + ' chars)'
        });

        return result;
    }

    /**
     * Parse INSERT statement
     *
     * @param {string} query - INSERT statement to parse
     * @returns {Object} Parsed INSERT statement
     */
    function parseInsertStatement(query) {
        log.debug({
            title: 'Parsing INSERT statement',
            details: 'Query: ' + query
        });

        // Basic INSERT INTO pattern: INSERT INTO table_name (columns) VALUES (values)
        // Also support: INSERT INTO table_name SET field1=value1, field2=value2
        var insertMatch = query.match(/^\s*INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(.*)/i);
        if (!insertMatch) {
            throw error.create({
                name: 'INVALID_INSERT_SYNTAX',
                message: 'Invalid INSERT statement syntax'
            });
        }

        var tableName = insertMatch[1];
        var remainder = insertMatch[2].trim();

        var result = {
            operation: 'INSERT',
            tableName: tableName,
            recordType: null, // Will be determined based on table name
            fields: {},
            values: []
        };

        // Determine if it's VALUES syntax or SET syntax
        if (/^\s*SET\s+/i.test(remainder)) {
            // SET syntax: INSERT INTO table SET field1=value1, field2=value2
            result = parseInsertSetSyntax(result, remainder);
        } else {
            // VALUES syntax: INSERT INTO table (field1, field2) VALUES (value1, value2)
            result = parseInsertValuesSyntax(result, remainder);
        }

        return result;
    }

    /**
     * Parse UPDATE statement
     *
     * @param {string} query - UPDATE statement to parse
     * @returns {Object} Parsed UPDATE statement
     */
    function parseUpdateStatement(query) {
        log.debug({
            title: 'Parsing UPDATE statement',
            details: 'Query: ' + query
        });

        // UPDATE table_name SET field1=value1, field2=value2 WHERE condition
        var updateMatch = query.match(/^\s*UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+SET\s+(.*)/i);
        if (!updateMatch) {
            throw error.create({
                name: 'INVALID_UPDATE_SYNTAX',
                message: 'Invalid UPDATE statement syntax. Expected: UPDATE table SET field=value WHERE condition'
            });
        }

        var tableName = updateMatch[1];
        var remainder = updateMatch[2].trim();

        // Split SET clause and WHERE clause
        var whereMatch = remainder.match(/^(.*?)\s+WHERE\s+(.*)$/i);
        var setClause, whereClause;

        if (whereMatch) {
            setClause = whereMatch[1].trim();
            whereClause = whereMatch[2].trim();
        } else {
            setClause = remainder;
            whereClause = null;
        }

        return {
            operation: 'UPDATE',
            tableName: tableName,
            recordType: null, // Will be determined based on table name
            setFields: parseSetClause(setClause),
            whereCondition: whereClause ? parseWhereClause(whereClause) : null
        };
    }

    /**
     * Parse DELETE statement
     *
     * @param {string} query - DELETE statement to parse
     * @returns {Object} Parsed DELETE statement
     */
    function parseDeleteStatement(query) {
        log.debug({
            title: 'Parsing DELETE statement',
            details: 'Query: ' + query
        });

        // DELETE FROM table_name WHERE condition
        var deleteMatch = query.match(/^\s*DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(.*)/i);
        if (!deleteMatch) {
            throw error.create({
                name: 'INVALID_DELETE_SYNTAX',
                message: 'Invalid DELETE statement syntax. Expected: DELETE FROM table WHERE condition'
            });
        }

        var tableName = deleteMatch[1];
        var remainder = deleteMatch[2].trim();

        var whereClause = null;
        if (remainder) {
            var whereMatch = remainder.match(/^\s*WHERE\s+(.*)$/i);
            if (whereMatch) {
                whereClause = whereMatch[1].trim();
            } else {
                throw error.create({
                    name: 'INVALID_DELETE_SYNTAX',
                    message: 'DELETE statements must include a WHERE clause for safety'
                });
            }
        } else {
            throw error.create({
                name: 'MISSING_WHERE_CLAUSE',
                message: 'DELETE statements must include a WHERE clause for safety'
            });
        }

        return {
            operation: 'DELETE',
            tableName: tableName,
            recordType: null, // Will be determined based on table name
            whereCondition: parseWhereClause(whereClause)
        };
    }

    /**
     * Parse INSERT SET syntax
     *
     * @param {Object} result - Partial result object
     * @param {string} remainder - Remainder of query after table name
     * @returns {Object} Updated result object
     */
    function parseInsertSetSyntax(result, remainder) {
        // Remove SET keyword
        var setClause = remainder.replace(/^\s*SET\s+/i, '');
        result.fields = parseSetClause(setClause);
        return result;
    }

    /**
     * Parse INSERT VALUES syntax
     *
     * @param {Object} result - Partial result object
     * @param {string} remainder - Remainder of query after table name
     * @returns {Object} Updated result object
     */
    function parseInsertValuesSyntax(result, remainder) {
        // Pattern: (field1, field2) VALUES (value1, value2)
        var valuesMatch = remainder.match(/^\s*\(\s*([^)]+)\s*\)\s+VALUES\s+\(\s*([^)]+)\s*\)/i);
        if (!valuesMatch) {
            throw error.create({
                name: 'INVALID_INSERT_VALUES_SYNTAX',
                message: 'Invalid INSERT VALUES syntax. Expected: (field1, field2) VALUES (value1, value2)'
            });
        }

        var fieldsStr = valuesMatch[1];
        var valuesStr = valuesMatch[2];

        // Parse field names
        var fieldNames = fieldsStr.split(',').map(function(field) {
            return field.trim();
        });

        // Parse values
        var values = parseValuesList(valuesStr);

        if (fieldNames.length !== values.length) {
            throw error.create({
                name: 'FIELD_VALUE_MISMATCH',
                message: 'Number of fields (' + fieldNames.length + ') does not match number of values (' + values.length + ')'
            });
        }

        // Combine fields and values
        for (var i = 0; i < fieldNames.length; i++) {
            result.fields[fieldNames[i]] = values[i];
        }

        return result;
    }

    /**
     * Parse SET clause (field1=value1, field2=value2)
     *
     * @param {string} setClause - SET clause to parse
     * @returns {Object} Object with field-value pairs
     */
    function parseSetClause(setClause) {
        var fields = {};
        var assignments = setClause.split(',');

        for (var i = 0; i < assignments.length; i++) {
            var assignment = assignments[i].trim();
            var equalIndex = assignment.indexOf('=');

            if (equalIndex === -1) {
                throw error.create({
                    name: 'INVALID_SET_SYNTAX',
                    message: 'Invalid SET clause. Expected field=value format: ' + assignment
                });
            }

            var fieldName = assignment.substring(0, equalIndex).trim();
            var value = assignment.substring(equalIndex + 1).trim();

            fields[fieldName] = parseValue(value);
        }

        return fields;
    }

    /**
     * Parse WHERE clause
     *
     * @param {string} whereClause - WHERE clause to parse
     * @returns {Object} Parsed WHERE condition
     */
    function parseWhereClause(whereClause) {
        // Simple implementation for now - can be enhanced later
        // Support basic patterns: field = value, field IN (values), etc.

        // Check for IN clause
        var inMatch = whereClause.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+IN\s+\(\s*([^)]+)\s*\)$/i);
        if (inMatch) {
            return {
                type: 'IN',
                field: inMatch[1],
                values: parseValuesList(inMatch[2])
            };
        }

        // Check for equality
        var equalMatch = whereClause.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
        if (equalMatch) {
            return {
                type: 'EQUALS',
                field: equalMatch[1],
                value: parseValue(equalMatch[2])
            };
        }

        // For now, store as raw condition for complex cases
        return {
            type: 'RAW',
            condition: whereClause
        };
    }

    /**
     * Parse a single value (string, number, boolean, null)
     *
     * @param {string} valueStr - Value string to parse
     * @returns {*} Parsed value
     */
    function parseValue(valueStr) {
        valueStr = valueStr.trim();

        // String literals (quoted)
        if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
            (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
            return valueStr.slice(1, -1);
        }

        // NULL
        if (valueStr.toUpperCase() === 'NULL') {
            return null;
        }

        // Boolean
        if (valueStr.toLowerCase() === 'true') {
            return true;
        }
        if (valueStr.toLowerCase() === 'false') {
            return false;
        }

        // Number
        if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
            return parseFloat(valueStr);
        }

        // Default to string (unquoted)
        return valueStr;
    }

    /**
     * Parse comma-separated values list
     *
     * @param {string} valuesStr - Values string to parse
     * @returns {Array} Array of parsed values
     */
    function parseValuesList(valuesStr) {
        var values = [];
        var parts = valuesStr.split(',');

        for (var i = 0; i < parts.length; i++) {
            values.push(parseValue(parts[i]));
        }

        return values;
    }

    // Public API
    return {
        analyzeDMLQuery: analyzeDMLQuery,
        isCreateRecordStatement: isCreateRecordStatement,
        isCreateListStatement: isCreateListStatement,
        isInsertStatement: isInsertStatement,
        isUpdateStatement: isUpdateStatement,
        isDeleteStatement: isDeleteStatement,
        parseCreateRecordStatement: parseCreateRecordStatement,
        parseCreateListStatement: parseCreateListStatement,
        parseInsertStatement: parseInsertStatement,
        parseUpdateStatement: parseUpdateStatement,
        parseDeleteStatement: parseDeleteStatement,
        parseFields: parseFields,
        parseListOptions: parseListOptions,
        parseListValues: parseListValues,
        parseTranslations: parseTranslations
    };
});
