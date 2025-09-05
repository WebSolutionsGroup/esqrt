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
        var fields = parseFields(fieldsStr);

        return {
            recordId: recordId,
            fullRecordId: 'customrecord_' + recordId.replace(/^_/, ''),
            fields: fields,
            displayName: recordId.replace(/^_sqrt_/, '')
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
            fullListId: 'customlist_' + listId.replace(/^_/, ''),
            options: options,
            displayName: listId.replace(/^_sqrt_/, '')
        };
    }

    /**
     * Parse field definitions from CREATE RECORD statement
     * 
     * @param {string} fieldsStr - Field definitions string
     * @returns {Array} Array of field objects
     */
    function parseFields(fieldsStr) {
        var fields = [];
        var fieldRegex = /(\w+)\s+(\w+)(?:\(([^)]+)\))?/g;
        var match;
        
        while ((match = fieldRegex.exec(fieldsStr)) !== null) {
            var fieldName = match[1];
            var fieldType = match[2];
            var listType = match[3];
            
            fields.push({
                name: fieldName,
                type: fieldType,
                listType: listType,
                scriptId: 'custrecord_' + fieldName
            });
        }
        
        return fields;
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

    // Public API
    return {
        analyzeDMLQuery: analyzeDMLQuery,
        isCreateRecordStatement: isCreateRecordStatement,
        isCreateListStatement: isCreateListStatement,
        parseCreateRecordStatement: parseCreateRecordStatement,
        parseCreateListStatement: parseCreateListStatement,
        parseFields: parseFields,
        parseListOptions: parseListOptions,
        parseListValues: parseListValues,
        parseTranslations: parseTranslations
    };
});
