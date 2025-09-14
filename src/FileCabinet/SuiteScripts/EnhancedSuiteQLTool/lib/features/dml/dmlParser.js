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

define(['N/log', 'N/error'], function(log, error) {
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
        // Updated regex to be more flexible with table names and capture everything after
        var insertMatch = query.match(/^\s*INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(.*)$/is);

        log.debug({
            title: 'parseInsertStatement regex test',
            details: 'Query: "' + query + '", Match: ' + (insertMatch ? 'YES' : 'NO') +
                    (insertMatch ? ', Table: "' + insertMatch[1] + '", Remainder: "' + insertMatch[2] + '"' : '')
        });
        if (!insertMatch) {
            throw error.create({
                name: 'INVALID_INSERT_SYNTAX',
                message: 'Invalid INSERT statement syntax'
            });
        }

        var tableName = insertMatch[1];
        var remainder = insertMatch[2].trim();

        // Check for COMMIT or PREVIEW keywords (similar to UPDATE/DELETE logic)
        // Use multiline flag to handle newlines in VALUES statements
        var isPreview = true; // Default to preview mode for safety
        var commitMatch = remainder.match(/^(.*?)\s+COMMIT\s*;?\s*$/is);
        var previewMatch = remainder.match(/^(.*?)\s+PREVIEW\s*;?\s*$/is);

        if (commitMatch) {
            isPreview = false; // COMMIT means actually insert
            remainder = commitMatch[1].trim();

            log.debug({
                title: 'INSERT COMMIT mode detected',
                details: 'Will actually insert records (COMMIT specified)'
            });
        } else if (previewMatch) {
            isPreview = true; // Explicit PREVIEW
            remainder = previewMatch[1].trim();

            log.debug({
                title: 'INSERT PREVIEW mode detected (explicit)',
                details: 'Will show records that would be inserted without actually inserting them'
            });
        } else {
            // No keyword specified - default to PREVIEW for safety
            log.debug({
                title: 'INSERT PREVIEW mode (default)',
                details: 'No COMMIT specified - defaulting to PREVIEW mode for safety. Add COMMIT to actually insert records.'
            });
        }

        var result = {
            operation: 'INSERT',
            tableName: tableName,
            recordType: null, // Will be determined based on table name
            fields: {},
            values: [],
            isPreview: isPreview
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
        // Use $ anchor and s flag to capture everything including newlines
        var updateMatch = query.match(/^\s*UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+SET\s+(.*)$/is);
        if (!updateMatch) {
            throw error.create({
                name: 'INVALID_UPDATE_SYNTAX',
                message: 'Invalid UPDATE statement syntax. Expected: UPDATE table SET field=value WHERE condition'
            });
        }

        var tableName = updateMatch[1];
        var remainder = updateMatch[2].trim();

        // Check for COMMIT or PREVIEW keywords (similar to DELETE logic)
        var isPreview = true; // Default to preview mode for safety
        var commitMatch = remainder.match(/^(.*?)\s+COMMIT\s*;?\s*$/is);
        var previewMatch = remainder.match(/^(.*?)\s+PREVIEW\s*;?\s*$/is);

        if (commitMatch) {
            isPreview = false; // COMMIT means actually update
            remainder = commitMatch[1].trim();

            log.debug({
                title: 'UPDATE COMMIT mode detected',
                details: 'Will actually update records (COMMIT specified)'
            });
        } else if (previewMatch) {
            isPreview = true; // Explicit PREVIEW
            remainder = previewMatch[1].trim();

            log.debug({
                title: 'UPDATE PREVIEW mode detected (explicit)',
                details: 'Will show records that would be updated without actually updating them'
            });
        } else {
            // No keyword specified - default to PREVIEW for safety
            log.debug({
                title: 'UPDATE PREVIEW mode (default)',
                details: 'No COMMIT specified - defaulting to PREVIEW mode for safety. Add COMMIT to actually update records.'
            });
        }

        // Split SET clause and WHERE clause
        // Use a more specific approach to find WHERE clause
        var whereIndex = remainder.search(/\s+WHERE\s+/i);
        var setClause, whereClause;

        if (whereIndex !== -1) {
            setClause = remainder.substring(0, whereIndex).trim();
            whereClause = remainder.substring(whereIndex + remainder.match(/\s+WHERE\s+/i)[0].length).trim();

            // Remove trailing semicolon from WHERE clause if present
            if (whereClause.endsWith(';')) {
                whereClause = whereClause.slice(0, -1).trim();
            }
        } else {
            setClause = remainder;
            whereClause = null;

            // Remove trailing semicolon from SET clause if present (when no WHERE clause)
            if (setClause.endsWith(';')) {
                setClause = setClause.slice(0, -1).trim();
            }
        }

        log.debug({
            title: 'UPDATE clause extraction',
            details: 'Remainder: "' + remainder + '", SET: "' + setClause + '", WHERE: "' + whereClause + '"'
        });

        return {
            operation: 'UPDATE',
            tableName: tableName,
            recordType: null, // Will be determined based on table name
            setFields: parseSetClause(setClause),
            whereCondition: whereClause ? parseWhereClause(whereClause) : null,
            isPreview: isPreview
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

        // Check for COMMIT or PREVIEW keywords at the end
        var isPreview = true; // Default to PREVIEW mode for safety
        var commitMatch = remainder.match(/^(.*?)\s+COMMIT\s*;?\s*$/is);
        var previewMatch = remainder.match(/^(.*?)\s+PREVIEW\s*;?\s*$/is);

        if (commitMatch) {
            isPreview = false; // COMMIT means actually delete
            remainder = commitMatch[1].trim();

            log.debug({
                title: 'DELETE COMMIT mode detected',
                details: 'Will actually delete records (COMMIT specified)'
            });
        } else if (previewMatch) {
            isPreview = true; // Explicit PREVIEW
            remainder = previewMatch[1].trim();

            log.debug({
                title: 'DELETE PREVIEW mode detected (explicit)',
                details: 'Will show records that would be deleted without actually deleting them'
            });
        } else {
            // No keyword specified - default to PREVIEW for safety
            log.debug({
                title: 'DELETE PREVIEW mode (default)',
                details: 'No COMMIT specified - defaulting to PREVIEW mode for safety. Add COMMIT to actually delete records.'
            });
        }

        var whereClause = null;
        if (remainder) {
            var whereMatch = remainder.match(/^\s*WHERE\s+(.*)$/i);
            if (whereMatch) {
                whereClause = whereMatch[1].trim();

                // Remove trailing semicolon if present
                if (whereClause.endsWith(';')) {
                    whereClause = whereClause.slice(0, -1).trim();
                }
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
            whereCondition: parseWhereClause(whereClause),
            isPreview: isPreview
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
        log.debug({
            title: 'parseInsertValuesSyntax debug',
            details: 'Remainder: "' + remainder + '"'
        });

        // Enhanced pattern to support multiple VALUES with multi-line support
        // Pattern: (field1, field2) VALUES (val1, val2), (val3, val4)
        // Now supports newlines between VALUES and the actual values
        var valuesMatch = remainder.match(/^\s*\(\s*([^)]+)\s*\)\s+VALUES\s*[\r\n]*\s*(.+)/is);

        log.debug({
            title: 'parseInsertValuesSyntax regex test',
            details: 'Pattern: /^\\s*\\(\\s*([^)]+)\\s*\\)\\s+VALUES\\s+(.+)/i, Match: ' + (valuesMatch ? 'YES' : 'NO') +
                    (valuesMatch ? ', Fields: "' + valuesMatch[1] + '", Values: "' + valuesMatch[2] + '"' : '')
        });

        if (!valuesMatch) {
            throw error.create({
                name: 'INVALID_INSERT_VALUES_SYNTAX',
                message: 'Invalid INSERT VALUES syntax. Expected: (field1, field2) VALUES (value1, value2) or (field1) VALUES (value1), (value2), (value3). Got: "' + remainder + '"'
            });
        }

        var fieldsStr = valuesMatch[1];
        var valuesSection = valuesMatch[2].trim();

        // Remove COMMIT/PREVIEW keywords from the values section if present
        // This handles cases like: VALUES ('val1'), ('val2') COMMIT;
        var commitInValuesMatch = valuesSection.match(/^(.*?)\s+COMMIT\s*;?\s*$/i);
        var previewInValuesMatch = valuesSection.match(/^(.*?)\s+PREVIEW\s*;?\s*$/i);

        if (commitInValuesMatch) {
            valuesSection = commitInValuesMatch[1].trim();
            log.debug({
                title: 'COMMIT keyword found in VALUES section',
                details: 'Cleaned values section: "' + valuesSection + '"'
            });
        } else if (previewInValuesMatch) {
            valuesSection = previewInValuesMatch[1].trim();
            log.debug({
                title: 'PREVIEW keyword found in VALUES section',
                details: 'Cleaned values section: "' + valuesSection + '"'
            });
        }

        // Remove trailing semicolon if present
        if (valuesSection.endsWith(';')) {
            valuesSection = valuesSection.slice(0, -1).trim();
        }

        // Parse field names
        var fieldNames = fieldsStr.split(',').map(function(field) {
            return field.trim();
        });

        // Parse multiple VALUES tuples: (val1, val2), (val3, val4), etc.
        var valuesTuples = parseMultipleValuesTuples(valuesSection);

        // Validate each tuple has the correct number of values
        for (var i = 0; i < valuesTuples.length; i++) {
            if (fieldNames.length !== valuesTuples[i].length) {
                throw error.create({
                    name: 'FIELD_VALUE_MISMATCH',
                    message: 'Number of fields (' + fieldNames.length + ') does not match number of values (' + valuesTuples[i].length + ') in VALUES tuple ' + (i + 1)
                });
            }
        }

        // If single tuple, use fields format for backward compatibility
        if (valuesTuples.length === 1) {
            for (var j = 0; j < fieldNames.length; j++) {
                result.fields[fieldNames[j]] = valuesTuples[0][j];
            }
        } else {
            // Multiple tuples - store as array for batch processing
            result.multipleValues = [];
            for (var k = 0; k < valuesTuples.length; k++) {
                var valueObj = {};
                for (var l = 0; l < fieldNames.length; l++) {
                    valueObj[fieldNames[l]] = valuesTuples[k][l];
                }
                result.multipleValues.push(valueObj);
            }
        }

        return result;
    }

    /**
     * Parse multiple VALUES tuples: (val1, val2), (val3, val4), etc.
     *
     * @param {string} valuesSection - VALUES section to parse
     * @returns {Array} Array of value arrays
     */
    function parseMultipleValuesTuples(valuesSection) {
        var tuples = [];
        var currentPos = 0;

        while (currentPos < valuesSection.length) {
            // Skip whitespace and commas
            while (currentPos < valuesSection.length && /[\s,]/.test(valuesSection[currentPos])) {
                currentPos++;
            }

            if (currentPos >= valuesSection.length) break;

            // Expect opening parenthesis
            if (valuesSection[currentPos] !== '(') {
                throw error.create({
                    name: 'INVALID_VALUES_SYNTAX',
                    message: 'Expected opening parenthesis in VALUES clause at position ' + currentPos
                });
            }

            // Find matching closing parenthesis (quote-aware)
            var parenCount = 1;
            var tupleStart = currentPos + 1;
            var inQuotes = false;
            var quoteChar = '';
            currentPos++;

            while (currentPos < valuesSection.length && parenCount > 0) {
                var char = valuesSection[currentPos];

                if (!inQuotes && (char === '"' || char === "'")) {
                    // Starting a quoted string
                    inQuotes = true;
                    quoteChar = char;
                } else if (inQuotes && char === quoteChar) {
                    // Check for escaped quote (doubled quotes)
                    if (currentPos + 1 < valuesSection.length && valuesSection[currentPos + 1] === quoteChar) {
                        // Escaped quote - skip both characters
                        currentPos++;
                    } else {
                        // End of quoted string
                        inQuotes = false;
                        quoteChar = '';
                    }
                } else if (!inQuotes) {
                    // Only count parentheses when not inside quotes
                    if (char === '(') {
                        parenCount++;
                    } else if (char === ')') {
                        parenCount--;
                    }
                }
                currentPos++;
            }

            if (parenCount > 0) {
                throw error.create({
                    name: 'INVALID_VALUES_SYNTAX',
                    message: 'Unmatched parenthesis in VALUES clause'
                });
            }

            // Extract and parse the tuple content
            var tupleContent = valuesSection.substring(tupleStart, currentPos - 1);
            var values = parseValuesList(tupleContent);
            tuples.push(values);
        }

        return tuples;
    }

    /**
     * Parse SET clause (field1=value1, field2=value2)
     *
     * @param {string} setClause - SET clause to parse
     * @returns {Object} Object with field-value pairs
     */
    function parseSetClause(setClause) {
        log.debug({
            title: 'parseSetClause debug',
            details: 'SET clause: "' + setClause + '"'
        });

        var fields = {};
        var assignments = setClause.split(',');

        log.debug({
            title: 'parseSetClause assignments',
            details: 'Assignments: ' + JSON.stringify(assignments)
        });

        for (var i = 0; i < assignments.length; i++) {
            var assignment = assignments[i].trim();

            // Skip empty assignments (can happen with trailing commas)
            if (!assignment) {
                continue;
            }

            log.debug({
                title: 'parseSetClause assignment ' + i,
                details: 'Assignment: "' + assignment + '"'
            });

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
     * Parse WHERE clause - supports compound conditions with AND/OR
     *
     * @param {string} whereClause - WHERE clause to parse
     * @returns {Object} Parsed WHERE condition tree
     */
    function parseWhereClause(whereClause) {
        if (!whereClause || !whereClause.trim()) {
            return null;
        }

        var trimmed = whereClause.trim();

        // Try to parse as compound condition first
        var compoundCondition = parseCompoundCondition(trimmed);
        if (compoundCondition) {
            return compoundCondition;
        }

        // Fall back to simple condition parsing
        return parseSimpleCondition(trimmed);
    }

    /**
     * Parse compound WHERE conditions with AND/OR operators
     *
     * @param {string} whereClause - WHERE clause to parse
     * @returns {Object|null} Parsed compound condition or null if not compound
     */
    function parseCompoundCondition(whereClause) {
        // First, check if this contains AND/OR operators outside of parentheses and quotes
        var tokens = tokenizeWhereClause(whereClause);
        var hasAndOr = tokens.some(function(token) {
            return token.type === 'OPERATOR' && (token.value === 'AND' || token.value === 'OR');
        });

        if (!hasAndOr) {
            return null; // Not a compound condition
        }

        // Build condition tree from tokens
        return buildConditionTree(tokens);
    }

    /**
     * Parse simple (single) WHERE condition
     *
     * @param {string} condition - Single condition to parse
     * @returns {Object} Parsed simple condition
     */
    function parseSimpleCondition(condition) {
        var trimmed = condition.trim();

        // Remove outer parentheses if present
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            var inner = trimmed.slice(1, -1).trim();
            // Make sure these are actually outer parentheses, not part of a function call
            if (isBalancedParentheses(inner)) {
                return parseSimpleCondition(inner);
            }
        }

        // Check for BETWEEN clause
        var betweenMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+BETWEEN\s+(.+)\s+AND\s+(.+)$/i);
        if (betweenMatch) {
            return {
                type: 'BETWEEN',
                field: betweenMatch[1],
                value1: parseValue(betweenMatch[2].trim()),
                value2: parseValue(betweenMatch[3].trim())
            };
        }

        // Check for IN clause
        var inMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+IN\s+\(\s*([^)]+)\s*\)$/i);
        if (inMatch) {
            return {
                type: 'IN',
                field: inMatch[1],
                values: parseValuesList(inMatch[2])
            };
        }

        // Check for IS NULL / IS NOT NULL
        var nullMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+IS\s+(NOT\s+)?NULL$/i);
        if (nullMatch) {
            return {
                type: nullMatch[2] ? 'IS_NOT_NULL' : 'IS_NULL',
                field: nullMatch[1]
            };
        }

        // Check for comparison operators (>=, <=, >, <, =, !=, <>)
        var comparisonMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(>=|<=|>|<|=|!=|<>)\s*(.+)$/i);
        if (comparisonMatch) {
            return {
                type: 'COMPARISON',
                field: comparisonMatch[1],
                operator: comparisonMatch[2],
                value: parseValue(comparisonMatch[3].trim())
            };
        }

        // If no pattern matches, store as raw condition
        return {
            type: 'RAW',
            condition: trimmed
        };
    }

    /**
     * Tokenize WHERE clause into logical components
     *
     * @param {string} whereClause - WHERE clause to tokenize
     * @returns {Array} Array of tokens
     */
    function tokenizeWhereClause(whereClause) {
        var tokens = [];
        var current = '';
        var inQuotes = false;
        var quoteChar = '';
        var parenDepth = 0;
        var i = 0;

        while (i < whereClause.length) {
            var char = whereClause[i];
            var nextChars = whereClause.substring(i, i + 4).toUpperCase();

            // Handle quotes
            if (!inQuotes && (char === "'" || char === '"')) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (inQuotes && char === quoteChar) {
                // Check for escaped quotes
                if (i + 1 < whereClause.length && whereClause[i + 1] === quoteChar) {
                    current += char + char;
                    i += 2;
                    continue;
                } else {
                    inQuotes = false;
                    quoteChar = '';
                    current += char;
                }
            } else if (inQuotes) {
                current += char;
            } else if (char === '(') {
                parenDepth++;
                current += char;
            } else if (char === ')') {
                parenDepth--;
                current += char;
            } else if (parenDepth === 0 && (nextChars.startsWith('AND ') || nextChars.startsWith('OR '))) {
                // Found AND/OR at top level
                if (current.trim()) {
                    tokens.push({type: 'CONDITION', value: current.trim()});
                    current = '';
                }

                var operator = nextChars.startsWith('AND ') ? 'AND' : 'OR';
                tokens.push({type: 'OPERATOR', value: operator});
                i += operator.length;
                continue;
            } else {
                current += char;
            }

            i++;
        }

        // Add final token
        if (current.trim()) {
            tokens.push({type: 'CONDITION', value: current.trim()});
        }

        return tokens;
    }

    /**
     * Build condition tree from tokens
     *
     * @param {Array} tokens - Array of tokens
     * @returns {Object} Condition tree
     */
    function buildConditionTree(tokens) {
        if (tokens.length === 1) {
            return parseSimpleCondition(tokens[0].value);
        }

        // Handle operator precedence: AND has higher precedence than OR
        // First, group by OR operators (lowest precedence)
        var orGroups = [];
        var currentGroup = [];

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === 'OPERATOR' && token.value === 'OR') {
                if (currentGroup.length > 0) {
                    orGroups.push(currentGroup);
                    currentGroup = [];
                }
            } else if (token.type === 'CONDITION' || (token.type === 'OPERATOR' && token.value === 'AND')) {
                currentGroup.push(token);
            }
        }

        if (currentGroup.length > 0) {
            orGroups.push(currentGroup);
        }

        if (orGroups.length === 1) {
            // No OR operators, just handle AND operators
            return buildAndConditionTree(orGroups[0]);
        } else {
            // Multiple OR groups
            var orConditions = orGroups.map(function(group) {
                return buildAndConditionTree(group);
            });

            return {
                type: 'COMPOUND',
                operator: 'OR',
                conditions: orConditions
            };
        }
    }

    /**
     * Build AND condition tree from tokens
     *
     * @param {Array} tokens - Array of tokens (should only contain conditions and AND operators)
     * @returns {Object} AND condition tree
     */
    function buildAndConditionTree(tokens) {
        var conditions = [];

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type === 'CONDITION') {
                conditions.push(parseSimpleCondition(token.value));
            }
            // Skip AND operators
        }

        if (conditions.length === 1) {
            return conditions[0];
        } else {
            return {
                type: 'COMPOUND',
                operator: 'AND',
                conditions: conditions
            };
        }
    }

    /**
     * Check if parentheses are balanced in a string
     *
     * @param {string} str - String to check
     * @returns {boolean} True if balanced
     */
    function isBalancedParentheses(str) {
        var depth = 0;
        var inQuotes = false;
        var quoteChar = '';

        for (var i = 0; i < str.length; i++) {
            var char = str[i];

            if (!inQuotes && (char === "'" || char === '"')) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            } else if (!inQuotes) {
                if (char === '(') {
                    depth++;
                } else if (char === ')') {
                    depth--;
                    if (depth < 0) {
                        return false;
                    }
                }
            }
        }

        return depth === 0;
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
        var currentValue = '';
        var inQuotes = false;
        var quoteChar = '';

        for (var i = 0; i < valuesStr.length; i++) {
            var char = valuesStr[i];

            if (!inQuotes && (char === '"' || char === "'")) {
                // Starting a quoted string
                inQuotes = true;
                quoteChar = char;
                currentValue += char;
            } else if (inQuotes && char === quoteChar) {
                // Check for escaped quote (doubled quotes)
                if (i + 1 < valuesStr.length && valuesStr[i + 1] === quoteChar) {
                    // Escaped quote - add both characters and skip next
                    currentValue += char + char;
                    i++; // Skip the next quote
                } else {
                    // End of quoted string
                    inQuotes = false;
                    quoteChar = '';
                    currentValue += char;
                }
            } else if (!inQuotes && char === ',') {
                // Found a comma outside of quotes - end current value
                values.push(parseValue(currentValue));
                currentValue = '';
            } else {
                // Regular character
                currentValue += char;
            }
        }

        // Add the last value
        if (currentValue.trim()) {
            values.push(parseValue(currentValue));
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
