/**
 * @fileoverview DELETE Record Operation
 *
 * Handles DELETE FROM statements for removing existing record instances in NetSuite.
 * Supports both standard NetSuite records and custom record types.
 *
 * Syntax examples:
 * - DELETE FROM customer WHERE id=123
 * - DELETE FROM customrecord_employee WHERE department='Engineering'
 * - DELETE FROM customlist_departments WHERE value='Engineering'
 *
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 *
 * =============================================================================
 * WHERE CLAUSE SUPPORT STATUS & ROADMAP
 * =============================================================================
 *
 * CURRENT WHERE CLAUSE SUPPORT:
 * ✅ Simple Comparisons: WHERE id = 5, WHERE name = 'value'
 * ✅ Numeric Comparisons: WHERE id > 5, WHERE amount >= 100, WHERE count < 10
 * ✅ Date Comparisons: WHERE date > '2024-01-01', WHERE hiredate <= '2023-12-31'
 * ✅ BETWEEN Ranges: WHERE id BETWEEN 1 AND 10, WHERE date BETWEEN '2024-01-01' AND '2024-12-31'
 * ✅ Static IN Clauses: WHERE name IN ('val1', 'val2', 'val3')
 * ✅ NULL Checks: WHERE field IS NULL, WHERE field IS NOT NULL
 * ✅ Auto Date Formatting: Converts YYYY-MM-DD to MM/DD/YYYY for NetSuite compatibility
 *
 * FUTURE ROADMAP - ADVANCED WHERE CLAUSE FEATURES:
 *
 * 🚧 Phase 1: Subquery Support (HIGH PRIORITY)
 * - WHERE field IN (SELECT column FROM table WHERE condition)
 * - WHERE field = (SELECT MAX(value) FROM table WHERE condition)
 * - Requirements: Subquery parser, SELECT execution engine integration, result mapping
 * - Implementation: Parse nested SELECT, execute subquery, use results in main WHERE
 * - Complexity: HIGH - Requires mini SQL execution engine
 *
 * 🚧 Phase 2: Complex Logic Operators (MEDIUM PRIORITY)
 * - WHERE (field1 = 'A' OR field2 = 'B') AND field3 > 10
 * - WHERE NOT (field1 = 'A' AND field2 = 'B')
 * - Requirements: Boolean logic parser, operator precedence handling, filter expression builder
 * - Implementation: Parse parentheses, AND/OR operators, build NetSuite filter expressions
 * - Complexity: MEDIUM - Requires expression tree parsing
 *
 * 🚧 Phase 3: SQL Functions (MEDIUM PRIORITY)
 * - WHERE UPPER(name) = 'VALUE', WHERE LOWER(field) LIKE 'pattern'
 * - WHERE DATE(created) = '2024-01-01', WHERE YEAR(date_field) = 2024
 * - Requirements: Function parser, NetSuite formula field integration
 * - Implementation: Parse function calls, map to NetSuite formula syntax
 * - Complexity: MEDIUM - Requires function-to-formula mapping
 *
 * 🚧 Phase 4: Advanced Subqueries (LOW PRIORITY)
 * - WHERE EXISTS (SELECT 1 FROM table WHERE condition)
 * - WHERE NOT EXISTS (SELECT 1 FROM table WHERE condition)
 * - Requirements: EXISTS/NOT EXISTS operators, correlated subquery support
 * - Implementation: Execute existence checks, handle correlated references
 * - Complexity: HIGH - Requires advanced query correlation
 *
 * 🚧 Phase 5: Performance Optimizations (ONGOING)
 * - Subquery result caching, query plan optimization, batch processing
 * - Smart field indexing, search filter optimization
 * - Requirements: Caching layer, performance monitoring, optimization algorithms
 * - Implementation: Cache frequently used subqueries, optimize search patterns
 * - Complexity: MEDIUM - Requires performance analysis and caching strategy
 *
 * =============================================================================
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
     * Execute DELETE operation
     *
     * @param {Object} parsedStatement - Parsed DELETE statement
     * @returns {Object} Execution result
     */
    function execute(parsedStatement) {
        log.debug({
            title: 'Executing DELETE',
            details: 'Table: ' + parsedStatement.tableName + ', WHERE: ' + JSON.stringify(parsedStatement.whereCondition)
        });

        try {
            // Determine record type and operation
            var recordType = dmlUtils.determineRecordType(parsedStatement.tableName);
            var result;
            if (recordType.isCustomList) {
                result = deleteCustomListValues(parsedStatement, recordType);
            } else {
                result = deleteRecords(parsedStatement, recordType);
            }

            // Handle preview vs actual delete results
            if (result.isPreview) {
                log.audit({
                    title: 'DELETE PREVIEW - NO RECORDS DELETED',
                    details: 'Table: ' + parsedStatement.tableName + ', Records that would be deleted: ' + (result.previewRecords ? result.previewRecords.length : result.recordIds.length)
                });
                return {
                    success: true,
                    result: result,
                    error: null,
                    message: '🔍 PREVIEW ONLY - NO RECORDS DELETED. Would delete ' + (result.previewRecords ? result.previewRecords.length : result.recordIds.length) + ' record(s) from ' + parsedStatement.tableName + '. Add COMMIT to actually delete.',
                    metadata: {
                        operation: 'DELETE_PREVIEW',
                        tableName: parsedStatement.tableName,
                        recordType: recordType.type,
                        recordsToDelete: result.previewRecords ? result.previewRecords.length : result.recordIds.length,
                        previewRecords: result.previewRecords || result.recordIds,
                        isPreviewOnly: true,
                        instructionToDelete: 'Add COMMIT to the end of your DELETE statement to actually delete these records'
                    }
                };
            } else {
                log.audit({
                    title: 'DELETE Success',
                    details: 'Table: ' + parsedStatement.tableName + ', Records deleted: ' + result.recordsDeleted
                });
                return {
                    success: true,
                    result: result,
                    error: null,
                    message: 'Deleted ' + result.recordsDeleted + ' record(s) from ' + parsedStatement.tableName,
                    metadata: {
                        operation: 'DELETE',
                        tableName: parsedStatement.tableName,
                        recordType: recordType.type,
                        recordsDeleted: result.recordsDeleted
                    }
                };
            }
        } catch (executionError) {
            log.error({
                title: 'DELETE Error',
                details: 'Table: ' + parsedStatement.tableName + ', Error: ' + executionError.message
            });
            return {
                success: false,
                result: null,
                error: executionError.message,
                message: null,
                metadata: {
                    operation: 'DELETE',
                    tableName: parsedStatement.tableName,
                    errorType: executionError.name || 'EXECUTION_ERROR'
                }
            };
        }
    }

    /**
     * Delete records based on WHERE condition
     *
     * @param {Object} parsedStatement - Parsed DELETE statement
     * @param {Object} recordType - Record type information
     * @returns {Object} Delete result
     */
    function deleteRecords(parsedStatement, recordType) {
        log.debug({
            title: 'Deleting records',
            details: 'Type: ' + recordType.type + ', WHERE: ' + JSON.stringify(parsedStatement.whereCondition)
        });

        // Find records matching WHERE condition
        var recordIds = findRecordsToDelete(parsedStatement, recordType);

        if (recordIds.length === 0) {
            return {
                recordsDeleted: 0,
                recordIds: [],
                message: 'No records found matching the WHERE condition'
            };
        }

        // Handle PREVIEW mode - show what would be deleted without actually deleting
        if (parsedStatement.isPreview) {
            log.audit({
                title: 'DELETE PREVIEW - NO RECORDS DELETED',
                details: 'Count: ' + recordIds.length + ', IDs: ' + JSON.stringify(recordIds)
            });
            return {
                recordsDeleted: 0,
                recordIds: recordIds,
                isPreview: true,
                message: '🔍 PREVIEW ONLY - NO RECORDS DELETED. Found ' + recordIds.length + ' record(s) that would be deleted. Add COMMIT to actually delete these records.'
            };
        }

        var deletedRecords = [];
        var errors = [];

        // Delete each record
        for (var i = 0; i < recordIds.length; i++) {
            try {
                var recordId = recordIds[i];
                deleteSingleRecord(recordId, recordType.type);
                deletedRecords.push(recordId);

                log.debug({
                    title: 'Record deleted',
                    details: 'ID: ' + recordId + ', Type: ' + recordType.type
                });
            } catch (deleteError) {
                errors.push({
                    recordId: recordIds[i],
                    error: deleteError.message
                });

                log.error({
                    title: 'Error deleting record',
                    details: 'ID: ' + recordIds[i] + ', Error: ' + deleteError.message
                });
            }
        }

        if (errors.length > 0 && deletedRecords.length === 0) {
            throw error.create({
                name: 'DELETE_FAILED',
                message: 'Failed to delete any records. First error: ' + errors[0].error
            });
        }

        return {
            recordsDeleted: deletedRecords.length,
            recordIds: deletedRecords,
            errors: errors
        };
    }

    /**
     * Find records that match the WHERE condition
     *
     * @param {Object} parsedStatement - Parsed DELETE statement
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findRecordsToDelete(parsedStatement, recordType) {
        var whereCondition = parsedStatement.whereCondition;
        if (!whereCondition) {
            throw error.create({
                name: 'MISSING_WHERE_CONDITION',
                message: 'DELETE statements must include a WHERE condition for safety'
            });
        }

        // Handle compound conditions (AND/OR)
        if (whereCondition.type === 'COMPOUND') {
            return findRecordsWithCompoundCondition(whereCondition, recordType);
        }

        // Handle simple conditions
        if (recordType.isCustomList) {
            // For custom lists, use the custom list search logic
            return findCustomListRecordsWithSimpleCondition(whereCondition, recordType);
        } else {
            // For regular records, use the standard logic
            return findRecordsWithSimpleCondition(whereCondition, recordType);
        }
    }

    /**
     * Find records with compound WHERE condition (AND/OR)
     *
     * @param {Object} compoundCondition - Compound WHERE condition
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findRecordsWithCompoundCondition(compoundCondition, recordType) {
        var operator = compoundCondition.operator; // 'AND' or 'OR'
        var conditions = compoundCondition.conditions;
        log.debug({
            title: 'Processing compound WHERE condition',
            details: 'Operator: ' + operator + ', Conditions: ' + conditions.length
        });

        // For AND conditions, try to combine filters into a single search first
        // This avoids the 4000+ record limit issue when individual conditions return large result sets
        if (operator === 'AND' && !recordType.isCustomList) {
            try {
                return findRecordsWithCombinedAndConditions(conditions, recordType);
            } catch (e) {
                log.warn({
                    title: 'Combined AND search failed, falling back to intersection method',
                    details: 'Error: ' + e.message
                });
                // Fall back to the original intersection method
            }
        }

        if (operator === 'AND') {
            // For AND: find intersection of all condition results
            var resultSets = conditions.map(function(condition) {
                // Use the appropriate function based on record type
                if (recordType.isCustomList) {
                    return findCustomListRecordsWithSimpleCondition(condition, recordType);
                } else {
                    return findRecordsWithSimpleCondition(condition, recordType);
                }
            });

            // Find intersection of all result sets
            var intersection = resultSets[0] || [];
            for (var i = 1; i < resultSets.length; i++) {
                intersection = intersection.filter(function(id) {
                    return resultSets[i].indexOf(id) !== -1;
                });
            }

            log.debug({
                title: 'AND condition results',
                details: 'Found ' + intersection.length + ' records in intersection'
            });
            return intersection;
        } else if (operator === 'OR') {
            // For OR: find union of all condition results
            var allResults = [];
            var seenIds = {};
            conditions.forEach(function(condition) {
                // Use the appropriate function based on record type
                var results;
                if (recordType.isCustomList) {
                    results = findCustomListRecordsWithSimpleCondition(condition, recordType);
                } else {
                    results = findRecordsWithSimpleCondition(condition, recordType);
                }
                results.forEach(function(id) {
                    if (!seenIds[id]) {
                        seenIds[id] = true;
                        allResults.push(id);
                    }
                });
            });

            log.debug({
                title: 'OR condition results',
                details: 'Found ' + allResults.length + ' unique records in union'
            });
            return allResults;
        }

        throw error.create({
            name: 'UNSUPPORTED_COMPOUND_OPERATOR',
            message: 'Unsupported compound operator: ' + operator
        });
    }

    /**
     * Find records with combined AND conditions using a single search
     * This avoids the 4000+ record limit by combining filters instead of intersecting result sets
     *
     * @param {Array} conditions - Array of simple conditions
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findRecordsWithCombinedAndConditions(conditions, recordType) {
        log.debug({
            title: 'Attempting combined AND search',
            details: 'Conditions: ' + conditions.length + ', Record Type: ' + recordType.type
        });

        var searchFilters = [];

        // Convert each condition to a search filter
        for (var i = 0; i < conditions.length; i++) {
            var condition = conditions[i];
            var filter = convertConditionToFilter(condition, recordType);
            if (filter) {
                searchFilters.push(filter);
            }
        }

        if (searchFilters.length === 0) {
            throw error.create({
                name: 'NO_VALID_FILTERS',
                message: 'No valid search filters could be created from the conditions'
            });
        }

        log.debug({
            title: 'Combined search filters created',
            details: 'Filter count: ' + searchFilters.length
        });

        // Execute combined search
        var searchObj = search.create({
            type: recordType.type,
            filters: searchFilters, // NetSuite automatically ANDs multiple filters
            columns: ['internalid']
        });

        var results = [];
        var pageSize = 1000;
        var start = 0;

        // Use paged search to handle large result sets
        do {
            var pagedResults = searchObj.run().getRange({
                start: start,
                end: start + pageSize
            });
            for (var j = 0; j < pagedResults.length; j++) {
                results.push(pagedResults[j].id);
            }
            start += pageSize;
        } while (pagedResults.length === pageSize);

        log.debug({
            title: 'Combined AND search completed',
            details: 'Found ' + results.length + ' records matching all conditions'
        });

        return results;
    }

    /**
     * Convert a simple condition to a NetSuite search filter
     *
     * @param {Object} condition - Simple WHERE condition
     * @param {Object} recordType - Record type information
     * @returns {Object|null} NetSuite search filter or null if not supported
     */
    function convertConditionToFilter(condition, recordType) {
        try {
            switch (condition.type) {
                case 'EQUALS':
                case 'COMPARISON':
                    if (condition.field === 'id' || condition.field === 'internalid') {
                        return null; // Skip ID conditions for combined search
                    }
                    var operator = condition.operator || '=';
                    var operatorMapping = {
                        '=': search.Operator.IS,
                        '>': search.Operator.GREATERTHAN,
                        '>=': search.Operator.GREATERTHANOREQUALTO,
                        '<': search.Operator.LESSTHAN,
                        '<=': search.Operator.LESSTHANOREQUALTO,
                        '!=': search.Operator.ISNOT,
                        '<>': search.Operator.ISNOT
                    };
                    var searchOperator = operatorMapping[operator];
                    if (!searchOperator) {
                        return null;
                    }
                    var value = condition.value;
                    // Handle date fields
                    if (isDateField(condition.field)) {
                        value = formatDateForNetSuite(value);
                        if (operator === '=') {
                            searchOperator = search.Operator.ON;
                        } else if (operator === '>') {
                            searchOperator = search.Operator.AFTER;
                        } else if (operator === '<') {
                            searchOperator = search.Operator.BEFORE;
                        } else if (operator === '>=') {
                            searchOperator = search.Operator.ONORAFTER;
                        } else if (operator === '<=') {
                            searchOperator = search.Operator.ONORBEFORE;
                        }
                    }
                    return search.createFilter({
                        name: condition.field,
                        operator: searchOperator,
                        values: [value]
                    });
                case 'IS_NULL':
                    return search.createFilter({
                        name: condition.field,
                        operator: search.Operator.ISEMPTY
                    });
                case 'IS_NOT_NULL':
                    return search.createFilter({
                        name: condition.field,
                        operator: search.Operator.ISNOTEMPTY
                    });
                case 'RAW':
                    // Handle simple RAW conditions like LIKE
                    if (condition.condition.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]$/i)) {
                        var likeMatch = condition.condition.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]$/i);
                        var fieldName = likeMatch[1];
                        var pattern = likeMatch[2];
                        var searchOperator;
                        var searchValue;
                        if (pattern.endsWith('%') && !pattern.startsWith('%')) {
                            searchOperator = search.Operator.STARTSWITH;
                            searchValue = pattern.slice(0, -1);
                        } else if (pattern.startsWith('%') && !pattern.endsWith('%')) {
                            searchOperator = search.Operator.ENDSWITH;
                            searchValue = pattern.slice(1);
                        } else if (pattern.startsWith('%') && pattern.endsWith('%')) {
                            searchOperator = search.Operator.CONTAINS;
                            searchValue = pattern.slice(1, -1);
                        } else {
                            searchOperator = search.Operator.IS;
                            searchValue = pattern;
                        }
                        return search.createFilter({
                            name: fieldName,
                            operator: searchOperator,
                            values: [searchValue]
                        });
                    }
                    return null; // Unsupported RAW condition
                default:
                    return null; // Unsupported condition type
            }
        } catch (e) {
            log.warn({
                title: 'Error converting condition to filter',
                details: 'Condition: ' + JSON.stringify(condition) + ', Error: ' + e.message
            });
            return null;
        }
    }

    /**
     * Find records with simple WHERE condition
     *
     * @param {Object} condition - Simple WHERE condition
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findRecordsWithSimpleCondition(condition, recordType) {
        // Handle different condition types
        switch (condition.type) {
            case 'EQUALS':
            case 'COMPARISON':
                if (condition.field === 'id' || condition.field === 'internalid') {
                    return [condition.value];
                } else {
                    return searchRecordsByField(recordType.type, condition.field, condition.value, condition.operator || '=');
                }
            case 'IN':
                if (condition.field === 'id' || condition.field === 'internalid') {
                    return condition.values;
                } else {
                    return searchRecordsByFieldValues(recordType.type, condition.field, condition.values);
                }
            case 'BETWEEN':
                return searchRecordsByRange(recordType.type, condition.field, condition.value1, condition.value2);
            case 'IS_NULL':
                return searchRecordsByNull(recordType.type, condition.field, true);
            case 'IS_NOT_NULL':
                return searchRecordsByNull(recordType.type, condition.field, false);
            case 'RAW':
                // Handle RAW conditions using the existing comprehensive parsing
                return findRecordsWithRawCondition(condition.condition, recordType);
            default:
                throw error.create({
                    name: 'UNSUPPORTED_CONDITION_TYPE',
                    message: 'Unsupported WHERE condition type: ' + condition.type
                });
        }
    }

    /**
     * Convert various boolean representations to boolean
     *
     * @param {*} value - Value to convert
     * @returns {boolean} true or false
     */
    function convertToBoolean(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            var lowerValue = value.toLowerCase();
            if (lowerValue === 'true' || lowerValue === 't' || lowerValue === '1') {
                return true;
            }
            if (lowerValue === 'false' || lowerValue === 'f' || lowerValue === '0') {
                return false;
            }
        }
        if (typeof value === 'number') {
            return !!value;
        }
        // Default to false for unknown values
        return false;
    }

    /**
     * Search for records by a single field value
     *
     * @param {string} recordType - NetSuite record type
     * @param {string} fieldId - Field to search
     * @param {*} value - Value to search for
     * @param {string} operator - Comparison operator (=, >, >=, <, <=)
     * @returns {Array} Array of record internal IDs
     */
    function searchRecordsByField(recordType, fieldId, value, operator) {
        operator = operator || '=';
        // Map SQL operators to NetSuite search operators
        var operatorMapping = {
            '=': search.Operator.IS,
            '>': search.Operator.GREATERTHAN,
            '>=': search.Operator.GREATERTHANOREQUALTO,
            '<': search.Operator.LESSTHAN,
            '<=': search.Operator.LESSTHANOREQUALTO,
            '!=': search.Operator.ISNOT,
            '<>': search.Operator.ISNOT
        };
        var searchOperator = operatorMapping[operator] || search.Operator.IS;

        // Special handling for isinactive field - convert value to boolean
        if (fieldId === 'isinactive') {
            value = convertToBoolean(value);
        }

        // Special handling for date fields
        if (isDateField(fieldId)) {
            // Convert date string to proper format for NetSuite search
            value = formatDateForNetSuite(value);
            // Adjust operators for date fields
            if (operator === '=') {
                searchOperator = search.Operator.ON;
            } else if (operator === '>') {
                searchOperator = search.Operator.AFTER;
            } else if (operator === '<') {
                searchOperator = search.Operator.BEFORE;
            } else if (operator === '>=') {
                searchOperator = search.Operator.ONORAFTER;
            } else if (operator === '<=') {
                searchOperator = search.Operator.ONORBEFORE;
            }
        }

        // Special handling for text-based ID fields - use string operators for better compatibility
        var filterToUse;
        if (isTextIdField(fieldId) && operator === '=') {
            filterToUse = [fieldId, 'is', value];
        } else {
            filterToUse = [fieldId, searchOperator, value];
        }

        var searchObj = search.create({
            type: recordType,
            filters: [filterToUse],
            columns: ['internalid']
        });

        var results = [];
        var pageSize = 1000; // NetSuite's recommended page size
        var start = 0;

        // Use paged search to handle large result sets
        do {
            var pagedResults = searchObj.run().getRange({
                start: start,
                end: start + pageSize
            });
            for (var i = 0; i < pagedResults.length; i++) {
                results.push(pagedResults[i].id);
            }
            start += pageSize;
            // Continue if we got a full page (might be more results)
        } while (pagedResults.length === pageSize);

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
        var pageSize = 1000;
        var start = 0;

        do {
            var pagedResults = searchObj.run().getRange({
                start: start,
                end: start + pageSize
            });
            for (var i = 0; i < pagedResults.length; i++) {
                results.push(pagedResults[i].id);
            }
            start += pageSize;
        } while (pagedResults.length === pageSize);

        return results;
    }

    /**
     * Search records by range (BETWEEN)
     *
     * @param {string} recordType - NetSuite record type
     * @param {string} fieldId - Field to search
     * @param {*} value1 - Start value
     * @param {*} value2 - End value
     * @returns {Array} Array of record internal IDs
     */
    function searchRecordsByRange(recordType, fieldId, value1, value2) {
        // Handle date ranges
        if (isDateField(fieldId)) {
            value1 = formatDateForNetSuite(value1);
            value2 = formatDateForNetSuite(value2);
        }

        var searchObj = search.create({
            type: recordType,
            filters: [
                [fieldId, 'between', [value1, value2]]
            ],
            columns: ['internalid']
        });

        var results = [];
        var pageSize = 1000;
        var start = 0;

        do {
            var pagedResults = searchObj.run().getRange({
                start: start,
                end: start + pageSize
            });
            for (var i = 0; i < pagedResults.length; i++) {
                results.push(pagedResults[i].id);
            }
            start += pageSize;
        } while (pagedResults.length === pageSize);

        return results;
    }

    /**
     * Search records by NULL/NOT NULL
     *
     * @param {string} recordType - NetSuite record type
     * @param {string} fieldId - Field to search
     * @param {boolean} isNull - True for IS NULL, false for IS NOT NULL
     * @returns {Array} Array of record internal IDs
     */
    function searchRecordsByNull(recordType, fieldId, isNull) {
        log.debug({
            title: 'searchRecordsByNull',
            details: 'Record Type: ' + recordType + ', Field: ' + fieldId + ', Is Null: ' + isNull
        });

        try {
            // Use search.createFilter for more explicit filter creation
            var filter;
            if (isNull) {
                filter = search.createFilter({
                    name: fieldId,
                    operator: search.Operator.ISEMPTY
                });
            } else {
                filter = search.createFilter({
                    name: fieldId,
                    operator: search.Operator.ISNOTEMPTY
                });
            }

            var searchObj = search.create({
                type: recordType,
                filters: [filter],
                columns: ['internalid']
            });

            var results = [];
            var pageSize = 1000; // NetSuite's recommended page size
            var start = 0;

            // Use paged search to handle large result sets
            do {
                var pagedResults = searchObj.run().getRange({
                    start: start,
                    end: start + pageSize
                });
                for (var i = 0; i < pagedResults.length; i++) {
                    results.push(pagedResults[i].id);
                }
                start += pageSize;
                log.debug({
                    title: 'searchRecordsByNull pagination',
                    details: 'Processed ' + results.length + ' records so far, last batch: ' + pagedResults.length
                });
                // Continue if we got a full page (might be more results)
            } while (pagedResults.length === pageSize);

            log.debug({
                title: 'searchRecordsByNull completed',
                details: 'Found ' + results.length + ' records for field ' + fieldId + ' (isNull: ' + isNull + ')'
            });

            return results;
        } catch (e) {
            log.error({
                title: 'Error in searchRecordsByNull',
                details: 'Record Type: ' + recordType + ', Field: ' + fieldId + ', Error: ' + e.message
            });
            throw error.create({
                name: 'NULL_SEARCH_ERROR',
                message: 'Error searching for null/empty values in field ' + fieldId + ': ' + e.message
            });
        }
    }

    /**
     * Find custom list records that match a simple condition
     *
     * @param {Object} condition - Simple WHERE condition
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findCustomListRecordsWithSimpleCondition(condition, recordType) {
        log.debug({
            title: 'Finding custom list records with simple condition',
            details: 'Condition: ' + JSON.stringify(condition) + ', Record Type: ' + recordType.type
        });

        // Handle RAW conditions (like LIKE) separately
        if (condition.type === 'RAW') {
            log.debug({
                title: 'Handling RAW condition for custom list',
                details: 'RAW condition: ' + condition.condition
            });
            return findCustomListRecordsWithRawCondition(condition.condition, recordType);
        }

        log.debug({
            title: 'Building simple filter for custom list condition',
            details: 'Condition type: ' + condition.type + ', Field: ' + condition.field + ', Value: ' + condition.value
        });

        var searchFilters = [];
        var simpleFilter = buildCustomListSimpleFilter(condition);
        if (simpleFilter) {
            // Handle both array-based filters (for text-based ID fields) and object filters
            searchFilters.push(simpleFilter);
        } else {
            throw error.create({
                name: 'UNSUPPORTED_CONDITION',
                message: 'Unsupported condition type: ' + condition.type
            });
        }

        // Create search object
        var searchObj = search.create({
            type: recordType.type,
            filters: searchFilters,
            columns: ['internalid', 'name', 'externalid']
        });

        var searchResults = [];
        var pageSize = 1000;
        var start = 0;

        do {
            var pagedResults = searchObj.run().getRange({
                start: start,
                end: start + pageSize
            });
            for (var i = 0; i < pagedResults.length; i++) {
                searchResults.push({
                    id: pagedResults[i].getValue('internalid'),
                    name: pagedResults[i].getValue('name'),
                    externalid: pagedResults[i].getValue('externalid')
                });
            }
            start += pageSize;
        } while (pagedResults.length === pageSize);

        return searchResults.map(function(record) { return record.id; });
    }

    /**
     * Build a simple filter for custom list searches
     *
     * @param {Object} condition - WHERE condition
     * @returns {Object} NetSuite search filter
     */
    function buildCustomListSimpleFilter(condition) {
        log.debug({
            title: 'buildCustomListSimpleFilter called',
            details: 'Full condition object: ' + JSON.stringify(condition)
        });

        // Safety check for undefined field
        if (!condition.field || typeof condition.field !== 'string') {
            log.error({
                title: 'Invalid condition field in buildCustomListSimpleFilter',
                details: 'Condition: ' + JSON.stringify(condition) + ', Field type: ' + typeof condition.field
            });
            throw error.create({
                name: 'INVALID_CONDITION_FIELD',
                message: 'Condition field is undefined or not a string: ' + JSON.stringify(condition)
            });
        }

        // Note: Custom list values have limited searchable fields
        var fieldMapping = {
            'id': 'internalid',
            'ID': 'internalid',
            'Id': 'internalid',
            'internalid': 'internalid',
            'internalId': 'internalid',
            'internalID': 'internalid',
            'internal_id': 'internalid',
            'recordid': 'internalid',
            'recordId': 'internalid',
            'recordID': 'internalid',
            'name': 'name', // Display name/value
            'value': 'name', // Display name/value
            'scriptid': 'scriptid', // Script ID field
            'isinactive': 'isinactive',
            'created': 'created', // Created date field
            'lastmodified': 'lastmodified' // Last modified date field
        };
        var searchField = fieldMapping[condition.field.toLowerCase()] || condition.field;

        switch (condition.type) {
            case 'COMPARISON':
            case 'EQUALS':
                var value = condition.value;
                // Convert boolean values for isinactive field
                if (searchField === 'isinactive') {
                    value = convertToBoolean(value);
                }
                // Handle date fields with proper operator and format
                if (isDateField(searchField) && isDateString(value)) {
                    // Convert to MM/DD/YYYY format for NetSuite
                    value = formatDateForNetSuite(value);
                    log.debug({
                        title: 'Date field detected in custom list filter',
                        details: 'Field: ' + searchField + ', Formatted Value: ' + value
                    });
                    return search.createFilter({
                        name: searchField,
                        operator: search.Operator.ON, // Use 'on' operator for date fields
                        values: value
                    });
                }
                // Handle text-based ID fields with string operators for better compatibility
                if (isTextIdField(searchField)) {
                    log.debug({
                        title: 'Text-based ID field detected in custom list filter',
                        details: 'Field: ' + searchField + ', Using string operator for value: ' + value
                    });
                    // Return array format for string-based filter
                    return [searchField, 'is', value];
                }
                return search.createFilter({
                    name: searchField,
                    operator: search.Operator.IS,
                    values: value
                });
            case 'IS_NULL':
                return search.createFilter({
                    name: searchField,
                    operator: search.Operator.ISEMPTY
                });
            case 'IS_NOT_NULL':
                return search.createFilter({
                    name: searchField,
                    operator: search.Operator.ISNOTEMPTY
                });
            case 'IN':
                return search.createFilter({
                    name: searchField,
                    operator: search.Operator.ANYOF,
                    values: condition.values
                });
            case 'BETWEEN':
                // For BETWEEN, we need to create a range filter
                var value1 = condition.value1;
                var value2 = condition.value2;
                if (isDateField(searchField)) {
                    value1 = formatDateForNetSuite(value1);
                    value2 = formatDateForNetSuite(value2);
                }
                return search.createFilter({
                    name: searchField,
                    operator: search.Operator.BETWEEN,
                    values: [value1, value2]
                });
            default:
                log.warn({
                    title: 'Unsupported condition type for custom list',
                    details: 'Type: ' + condition.type
                });
                return null;
        }
    }

    /**
     * Find records with RAW condition (using existing comprehensive parsing)
     *
     * @param {string} rawCondition - Raw WHERE condition
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findRecordsWithRawCondition(rawCondition, recordType) {
        // This will use the existing RAW condition parsing logic
        // that was already implemented in the deleteCustomListValues function
        // For custom lists, delegate to the custom list search logic
        if (recordType.isCustomList) {
            return findCustomListRecordsWithRawCondition(rawCondition, recordType);
        } else {
            // For regular records, implement RAW condition support
            return findRegularRecordsWithRawCondition(rawCondition, recordType);
        }
    }

    /**
     * Find regular records with RAW condition (LIKE, etc.)
     *
     * @param {string} rawCondition - Raw WHERE condition
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findRegularRecordsWithRawCondition(rawCondition, recordType) {
        log.debug({
            title: 'Processing RAW condition for regular record',
            details: 'Condition: ' + rawCondition + ', Record Type: ' + recordType.type
        });

        var searchFilters = [];
        var searchResults = [];

        // Parse LIKE conditions: field LIKE 'pattern%'
        if (rawCondition.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]$/i)) {
            var likeMatch = rawCondition.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]$/i);
            var fieldName = likeMatch[1];
            var pattern = likeMatch[2];
            log.debug({
                title: 'Parsing LIKE condition',
                details: 'Field: ' + fieldName + ', Pattern: ' + pattern
            });

            // Convert SQL LIKE pattern to NetSuite search
            var searchOperator;
            var searchValue;
            if (pattern.endsWith('%') && !pattern.startsWith('%')) {
                searchOperator = search.Operator.STARTSWITH;
                searchValue = pattern.slice(0, -1);
            } else if (pattern.startsWith('%') && !pattern.endsWith('%')) {
                searchOperator = search.Operator.ENDSWITH;
                searchValue = pattern.slice(1);
            } else if (pattern.startsWith('%') && pattern.endsWith('%')) {
                searchOperator = search.Operator.CONTAINS;
                searchValue = pattern.slice(1, -1);
            } else {
                searchOperator = search.Operator.IS;
                searchValue = pattern;
            }
            searchFilters.push([fieldName, searchOperator, searchValue]);
        } else {
            throw error.create({
                name: 'UNSUPPORTED_RAW_CONDITION',
                message: 'Unsupported RAW WHERE condition for regular records: ' + rawCondition + '. Currently supported: field LIKE \'pattern%\', field LIKE \'%pattern\', field LIKE \'%pattern%\''
            });
        }

        // Execute the search
        try {
            var searchObj = search.create({
                type: recordType.type,
                filters: searchFilters,
                columns: [
                    search.createColumn({ name: 'internalid' })
                ]
            });

            var pageSize = 1000;
            var start = 0;

            do {
                var pagedResults = searchObj.run().getRange({
                    start: start,
                    end: start + pageSize
                });
                for (var i = 0; i < pagedResults.length; i++) {
                    searchResults.push(pagedResults[i].getValue('internalid'));
                }
                start += pageSize;
            } while (pagedResults.length === pageSize);

            log.debug({
                title: 'RAW condition search completed',
                details: 'Found ' + searchResults.length + ' records matching condition: ' + rawCondition
            });
        } catch (e) {
            log.error({
                title: 'Error executing RAW condition search',
                details: 'Condition: ' + rawCondition + ', Error: ' + e.message
            });
            throw error.create({
                name: 'RAW_CONDITION_SEARCH_ERROR',
                message: 'Error searching with RAW condition: ' + rawCondition + '. Error: ' + e.message
            });
        }

        return searchResults;
    }

    /**
     * Find custom list records with RAW condition
     *
     * @param {string} rawCondition - Raw WHERE condition
     * @param {Object} recordType - Record type information
     * @returns {Array} Array of record internal IDs
     */
    function findCustomListRecordsWithRawCondition(rawCondition, recordType) {
        // Use the existing comprehensive RAW parsing logic from deleteCustomListValues
        // This is a simplified version that just returns the IDs
        var searchResults = [];
        var searchFilters = [];
        var hasValidWhereCondition = false;

        // Parse different types of RAW WHERE conditions
        // (This uses the same logic as in deleteCustomListValues)
        // Parse numeric/date comparisons: field > value, field >= value, field < value, field <= value
        var comparisonMatch = rawCondition.match(/(\w+)\s*(>=|<=|>|<|=)\s*(.+)/i);
        if (comparisonMatch) {
            var fieldName = comparisonMatch[1];
            var operator = comparisonMatch[2];
            var value = comparisonMatch[3].trim();
            // Remove quotes if present
            if ((value.startsWith("'") && value.endsWith("'")) ||
                (value.startsWith('"') && value.endsWith('"'))) {
                value = value.slice(1, -1);
            }

            // Map field names for custom list values
            var fieldMapping = {
                'id': 'internalid',
                'ID': 'internalid',
                'Id': 'internalid',
                'internalid': 'internalid',
                'internalId': 'internalid',
                'internalID': 'internalid',
                'internal_id': 'internalid',
                'recordid': 'internalid',
                'recordId': 'internalid',
                'recordID': 'internalid',
                'name': 'name',
                'value': 'name',
                'externalid': 'externalid'
            };
            var searchField = fieldMapping[fieldName.toLowerCase()] || fieldName;

            // Handle date formatting for NetSuite
            if (isDateField(searchField) && isDateString(value)) {
                value = formatDateForNetSuite(value);
            }

            // Map operators to NetSuite search operators
            var operatorMapping = {
                '=': search.Operator.IS,
                '>': search.Operator.GREATERTHAN,
                '>=': search.Operator.GREATERTHANOREQUALTO,
                '<': search.Operator.LESSTHAN,
                '<=': search.Operator.LESSTHANOREQUALTO,
                '!=': search.Operator.ISNOT,
                '<>': search.Operator.ISNOT
            };
            var searchOperator = operatorMapping[operator] || search.Operator.IS;

            // Convert to number if it's an internalid field
            var searchValue = value;
            if (searchField === 'internalid' && !isNaN(value)) {
                searchValue = parseInt(value, 10);
                searchOperator = search.Operator.EQUALTO;
            } else if (searchField === 'isinactive') {
                searchValue = convertToBoolean(value);
            }

            // Adjust for date fields
            if (isDateField(searchField)) {
                if (operator === '=') {
                    searchOperator = search.Operator.ON;
                } else if (operator === '>') {
                    searchOperator = search.Operator.AFTER;
                } else if (operator === '<') {
                    searchOperator = search.Operator.BEFORE;
                } else if (operator === '>=') {
                    searchOperator = search.Operator.ONORAFTER;
                } else if (operator === '<=') {
                    searchOperator = search.Operator.ONORBEFORE;
                }
            }

            // Special handling for text-based ID fields that require string operators
            if (isTextIdField(searchField) && operator === '=') {
                // Use string-based filter syntax for better compatibility
                searchFilters.push([searchField, 'is', searchValue]);
            } else {
                searchFilters.push(search.createFilter({
                    name: searchField,
                    operator: searchOperator,
                    values: searchValue
                }));
            }
            hasValidWhereCondition = true;
        } else if (rawCondition.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]$/i)) {
            var likeMatch = rawCondition.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]$/i);
            var fieldName = likeMatch[1];
            var pattern = likeMatch[2];
            log.debug({
                title: 'Parsed LIKE condition for custom list search',
                details: 'Field: ' + fieldName + ', Pattern: ' + pattern
            });

            // Map field names for custom list values
            var fieldMapping = {
                'id': 'internalid',
                'ID': 'internalid',
                'Id': 'internalid',
                'internalid': 'internalid',
                'internalId': 'internalid',
                'internalID': 'internalid',
                'internal_id': 'internalid',
                'recordid': 'internalid',
                'recordId': 'internalid',
                'recordID': 'internalid',
                'name': 'name', // Display name/value
                'value': 'name', // Display name/value
                'scriptid': 'scriptid' // Script ID field
                // Note: externalid is not a searchable field for custom list values
            };
            var searchField = fieldMapping[fieldName.toLowerCase()] || fieldName;

            // Convert SQL LIKE pattern to NetSuite search
            var searchOperator;
            var searchValue;
            if (pattern.endsWith('%') && !pattern.startsWith('%')) {
                searchOperator = search.Operator.STARTSWITH;
                searchValue = pattern.slice(0, -1);
            } else if (pattern.startsWith('%') && !pattern.endsWith('%')) {
                searchOperator = search.Operator.ENDSWITH;
                searchValue = pattern.slice(1);
            } else if (pattern.startsWith('%') && pattern.endsWith('%')) {
                searchOperator = search.Operator.CONTAINS;
                searchValue = pattern.slice(1, -1);
            } else {
                searchOperator = search.Operator.IS;
                searchValue = pattern;
            }

            searchFilters.push(search.createFilter({
                name: searchField,
                operator: searchOperator,
                values: [searchValue]
            }));
            hasValidWhereCondition = true;
        }

        if (!hasValidWhereCondition) {
            throw error.create({
                name: 'UNSUPPORTED_RAW_CONDITION',
                message: 'Unsupported RAW WHERE condition: ' + rawCondition + '. Supported: field = value, field > value, field >= value, field < value, field <= value, field LIKE \'pattern%\''
            });
        }

        // Execute the search
        try {
            var searchObj = search.create({
                type: recordType.type,
                filters: searchFilters,
                columns: [
                    search.createColumn({ name: 'internalid' })
                ]
            });

            var pageSize = 1000;
            var start = 0;

            do {
                var pagedResults = searchObj.run().getRange({
                    start: start,
                    end: start + pageSize
                });
                for (var i = 0; i < pagedResults.length; i++) {
                    searchResults.push(pagedResults[i].getValue('internalid'));
                }
                start += pageSize;
            } while (pagedResults.length === pageSize);
        } catch (searchError) {
            throw error.create({
                name: 'SEARCH_FAILED',
                message: 'Failed to search for custom list values: ' + searchError.message
            });
        }

        return searchResults;
    }

    /**
     * Delete a single record
     *
     * @param {string} recordId - Record internal ID
     * @param {string} recordType - NetSuite record type
     */
    function deleteSingleRecord(recordId, recordType) {
        record.delete({
            type: recordType,
            id: recordId
        });
    }

    /**
     * Helper function to detect if a field is likely a date field
     */
    function isDateField(fieldName) {
        var dateFieldPatterns = [
            'date', 'created', 'modified', 'updated', 'start', 'end',
            'expire', 'due', 'birth', 'hire', 'tran', 'last'
        ];
        var lowerFieldName = fieldName.toLowerCase();
        return dateFieldPatterns.some(function(pattern) {
            return lowerFieldName.indexOf(pattern) !== -1;
        });
    }

    /**
     * Helper function to detect if a field is a text-based ID field that requires string operators
     * These fields look like ID fields but are actually text fields in NetSuite
     */
    function isTextIdField(fieldName) {
        var textIdFields = [
            'tranid',           // Transaction ID (text field)
            'documentnumber',   // Document number (text field)
            'entityid',         // Entity ID (text field)
            'name',             // Name fields (text)
            'externalid',       // External ID (text field)
            'custrecord_',      // Custom record fields (often text)
            'custbody_',        // Custom body fields (often text)
            'custcol_'          // Custom column fields (often text)
        ];
        var lowerFieldName = fieldName.toLowerCase();
        return textIdFields.some(function(pattern) {
            return lowerFieldName === pattern || lowerFieldName.indexOf(pattern) === 0;
        });
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
     * Helper function to format date for NetSuite search
     * NetSuite typically expects MM/DD/YYYY format for date searches
     */
    function formatDateForNetSuite(dateString) {
        try {
            var date;
            // Handle different input formats
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                // YYYY-MM-DD format
                var parts = dateString.split('-');
                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                // Already in MM/DD/YYYY format (assuming US format)
                return dateString;
            } else {
                // Try to parse as-is
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) {
                // If parsing failed, return original string
                return dateString;
            }

            // Format as MM/DD/YYYY for NetSuite
            var month = (date.getMonth() + 1).toString().padStart(2, '0');
            var day = date.getDate().toString().padStart(2, '0');
            var year = date.getFullYear();
            return month + '/' + day + '/' + year;
        } catch (e) {
            log.debug({
                title: 'Date formatting error',
                details: 'Could not format date: ' + dateString + ', Error: ' + e.message
            });
            return dateString; // Return original if formatting fails
        }
    }

    /**
     * Delete custom list values
     *
     * @param {Object} parsedStatement - Parsed DELETE statement
     * @param {Object} recordType - Record type information
     * @returns {Object} Delete result
     */
    function deleteCustomListValues(parsedStatement, recordType) {
        log.debug({
            title: 'Deleting custom list values',
            details: 'List: ' + recordType.type + ', WHERE: ' + JSON.stringify(parsedStatement.whereCondition)
        });

        // Find existing custom list value records based on WHERE condition
        var searchFilters = [];
        // Build search filters from WHERE condition
        if (parsedStatement.whereCondition) {
            if (parsedStatement.whereCondition.type === 'RAW') {
                // Handle RAW WHERE conditions (like IN clauses)
                var rawCondition = parsedStatement.whereCondition.condition;
                log.debug({
                    title: 'Parsing RAW WHERE condition',
                    details: 'Condition: ' + rawCondition
                });

                // Parse different types of RAW WHERE conditions
                // Parse numeric/date comparisons: field > value, field >= value, field < value, field <= value
                var comparisonMatch = rawCondition.match(/(\w+)\s*(>=|<=|>|<|=)\s*(.+)/i);
                if (comparisonMatch) {
                    var fieldName = comparisonMatch[1];
                    var operator = comparisonMatch[2];
                    var value = comparisonMatch[3].trim();
                    // Remove quotes if present
                    if ((value.startsWith("'") && value.endsWith("'")) ||
                        (value.startsWith('"') && value.endsWith('"'))) {
                        value = value.slice(1, -1);
                    }

                    // Map field names for custom list values
                    var fieldMapping = {
                        'id': 'internalid',
                        'ID': 'internalid',
                        'Id': 'internalid',
                        'internalid': 'internalid',
                        'internalId': 'internalid',
                        'internalID': 'internalid',
                        'internal_id': 'internalid',
                        'recordid': 'internalid',
                        'recordId': 'internalid',
                        'recordID': 'internalid',
                        'name': 'name', // Display name/value
                        'value': 'name', // Display name/value
                        'scriptid': 'scriptid', // Script ID field
                        'isinactive': 'isinactive',
                        'created': 'created', // Created date field
                        'lastmodified': 'lastmodified' // Last modified date field
                    };
                    var searchField = fieldMapping[fieldName.toLowerCase()] || fieldName;

                    // Handle date formatting for NetSuite
                    if (isDateField(searchField) && isDateString(value)) {
                        value = formatDateForNetSuite(value);
                        log.debug({
                            title: 'Date field detected - formatted for NetSuite',
                            details: 'Field: ' + searchField + ', Formatted Value: ' + value
                        });
                    }

                    log.debug({
                        title: 'Parsed comparison condition',
                        details: 'Field: ' + fieldName + ', Operator: ' + operator + ', Value: ' + value
                    });

                    // Map operators to NetSuite search operators
                    var operatorMapping = {
                        '=': search.Operator.IS,
                        '>': search.Operator.GREATERTHAN,
                        '>=': search.Operator.GREATERTHANOREQUALTO,
                        '<': search.Operator.LESSTHAN,
                        '<=': search.Operator.LESSTHANOREQUALTO,
                        '!=': search.Operator.ISNOT,
                        '<>': search.Operator.ISNOT
                    };
                    var searchOperator = operatorMapping[operator] || search.Operator.IS;

                    // Convert boolean values for isinactive field
                    var searchValue = value;
                    if (searchField === 'isinactive') {
                        searchValue = convertToBoolean(value);
                    }

                    // For date fields with equality operator, use 'on' instead of 'is'
                    if (isDateField(searchField)) {
                        if (operator === '=') {
                            searchOperator = search.Operator.ON;
                        } else if (operator === '>') {
                            searchOperator = search.Operator.AFTER;
                        } else if (operator === '<') {
                            searchOperator = search.Operator.BEFORE;
                        } else if (operator === '>=') {
                            searchOperator = search.Operator.ONORAFTER;
                        } else if (operator === '<=') {
                            searchOperator = search.Operator.ONORBEFORE;
                        }
                        log.debug({
                            title: 'Using date operator for custom list',
                            details: 'Field: ' + searchField + ', Operator: ' + searchOperator + ', Value: ' + searchValue
                        });
                    }

                    // Special handling for text-based ID fields that require string operators
                    if (isTextIdField(searchField) && operator === '=') {
                        // Use string-based filter syntax for better compatibility
                        searchFilters.push([searchField, 'is', searchValue]);
                    } else {
                        searchFilters.push(search.createFilter({
                            name: searchField,
                            operator: searchOperator,
                            values: searchValue
                        }));
                    }
                } else if (rawCondition.match(/(\w+)\s+IN\s*\(\s*([^)]+)\s*\)/i)) {
                    var inMatch = rawCondition.match(/(\w+)\s+IN\s*\(\s*([^)]+)\s*\)/i);
                    var fieldName = inMatch[1];
                    var inContent = inMatch[2].trim();
                    // Check if this is a subquery (starts with SELECT)
                    if (inContent.toUpperCase().startsWith('SELECT')) {
                        throw error.create({
                            name: 'SUBQUERY_NOT_SUPPORTED',
                            message: 'Subqueries are not yet supported. Found: ' + rawCondition +
                                   '. Use static values like: WHERE field IN (\'value1\', \'value2\')'
                        });
                    }
                    // Handle static IN clause (existing logic)
                    var valuesStr = inMatch[2];
                    // Parse the values inside the IN clause
                    var values = [];
                    var valueMatches = valuesStr.match(/'([^']*)'/g);
                    if (valueMatches) {
                        for (var i = 0; i < valueMatches.length; i++) {
                            // Remove quotes from each value
                            values.push(valueMatches[i].replace(/'/g, ''));
                        }
                    }
                    log.debug({
                        title: 'Parsed IN clause',
                        details: 'Field: ' + fieldName + ', Values: ' + JSON.stringify(values)
                    });

                    // Map field names for custom list values
                    var fieldMapping = {
                        'id': 'internalid',
                        'ID': 'internalid',
                        'Id': 'internalid',
                        'internalid': 'internalid',
                        'internalId': 'internalid',
                        'internalID': 'internalid',
                        'internal_id': 'internalid',
                        'recordid': 'internalid',
                        'recordId': 'internalid',
                        'recordID': 'internalid',
                        'name': 'name',
                        'value': 'name',
                        'externalid': 'externalid'
                    };
                    var searchField = fieldMapping[fieldName.toLowerCase()] || fieldName;

                    // For text fields like 'name', ANYOF doesn't work according to NetSuite documentation
                    // We need to create multiple searches and combine results, or use filter expressions
                    if (values.length === 1) {
                        searchFilters.push(search.createFilter({
                            name: searchField,
                            operator: search.Operator.IS,
                            values: values[0]
                        }));
                    } else {
                        // For multiple values with text fields, we'll run separate searches
                        // and combine the results (since filter expressions are complex)
                        log.debug({
                            title: 'Multiple values for text field - will run separate searches',
                            details: 'Field: ' + searchField + ', Values: ' + JSON.stringify(values)
                        });
                        // Store the values for later processing
                        searchFilters = { // Override to indicate special handling
                            multipleTextValues: {
                                field: searchField,
                                values: values
                            }
                        };
                    }
                } else if (rawCondition.match(/(\w+)\s+BETWEEN\s+(.+)\s+AND\s+(.+)/i)) {
                    var betweenMatch = rawCondition.match(/(\w+)\s+BETWEEN\s+(.+)\s+AND\s+(.+)/i);
                    var fieldName = betweenMatch[1];
                    var value1 = betweenMatch[2].trim();
                    var value2 = betweenMatch[3].trim();
                    // Remove quotes if present and handle date formatting
                    [value1, value2] = [value1, value2].map(function(val) {
                        var cleanVal = val;
                        if ((val.startsWith("'") && val.endsWith("'")) ||
                            (val.startsWith('"') && val.endsWith('"'))) {
                            cleanVal = val.slice(1, -1);
                        }
                        // Handle date formatting for NetSuite
                        var searchField = fieldMapping[fieldName.toLowerCase()] || fieldName;
                        if (isDateField(searchField) && isDateString(cleanVal)) {
                            cleanVal = formatDateForNetSuite(cleanVal);
                            log.debug({
                                title: 'BETWEEN date field detected - formatted for NetSuite',
                                details: 'Field: ' + searchField + ', Original: ' + val + ', Formatted: ' + cleanVal
                            });
                        }
                        return cleanVal;
                    });
                    log.debug({
                        title: 'Parsed BETWEEN condition',
                        details: 'Field: ' + fieldName + ', Value1: ' + value1 + ', Value2: ' + value2
                    });

                    // Map field names for custom list values
                    var fieldMapping = {
                        'id': 'internalid',
                        'ID': 'internalid',
                        'Id': 'internalid',
                        'internalid': 'internalid',
                        'internalId': 'internalid',
                        'internalID': 'internalid',
                        'internal_id': 'internalid',
                        'recordid': 'internalid',
                        'recordId': 'internalid',
                        'recordID': 'internalid',
                        'name': 'name',
                        'value': 'name',
                        'externalid': 'externalid'
                    };
                    var searchField = fieldMapping[fieldName.toLowerCase()] || fieldName;

                    searchFilters.push(search.createFilter({
                        name: searchField,
                        operator: search.Operator.BETWEEN,
                        values: [value1, value2]
                    }));
                } else {
                    var nullMatch = rawCondition.match(/(\w+)\s+IS\s+(NOT\s+)?NULL/i);
                    if (nullMatch) {
                        var fieldName = nullMatch[1];
                        var isNotNull = !!nullMatch[2]; // true if "NOT NULL", false if just "NULL"
                        log.debug({
                            title: 'Parsed NULL condition',
                            details: 'Field: ' + fieldName + ', Is NOT NULL: ' + isNotNull
                        });

                        // Map field names for custom list values
                        var fieldMapping = {
                            'id': 'internalid',
                            'ID': 'internalid',
                            'Id': 'internalid',
                            'internalid': 'internalid',
                            'internalId': 'internalid',
                            'internalID': 'internalid',
                            'internal_id': 'internalid',
                            'recordid': 'internalid',
                            'recordId': 'internalid',
                            'recordID': 'internalid',
                            'name': 'name', // Display name/value
                            'value': 'name', // Display name/value
                            'scriptid': 'scriptid', // Script ID field
                            'isinactive': 'isinactive',
                            'created': 'created', // Created date field
                            'lastmodified': 'lastmodified', // Last modified date field
                            'externalid': 'externalid'
                        };
                        var searchField = fieldMapping[fieldName.toLowerCase()] || fieldName;

                        // Special handling for custom list external ID fields
                        // NetSuite's ISNOTEMPTY/ISEMPTY don't work correctly with empty strings
                        // For IS NULL and IS NOT NULL, we need to filter manually
                        if (searchField === 'externalid' && recordType.type.startsWith('customlist')) {
                            if (isNotNull) {
                                log.debug({
                                    title: 'Using special handling for custom list externalid IS NOT NULL',
                                    details: 'Will search all records and filter out empty/null strings manually'
                                });
                                // Don't add any search filter - we'll filter manually after getting results
                                searchFilters = { // Override to indicate special handling
                                    customListExternalIdNotNull: true
                                };
                            } else {
                                log.debug({
                                    title: 'Using special handling for custom list externalid IS NULL',
                                    details: 'Will search all records and filter out non-empty strings manually'
                                });
                                // Don't add any search filter - we'll filter manually after getting results
                                searchFilters = { // Override to indicate special handling
                                    customListExternalIdNull: true
                                };
                            }
                        } else {
                            var nullOperator = isNotNull ? search.Operator.ISNOTEMPTY : search.Operator.ISEMPTY;
                            log.debug({
                                title: 'Creating NULL filter',
                                details: 'Field: ' + searchField + ', Operator: ' + nullOperator + ', Original Field: ' + fieldName
                            });
                            searchFilters.push(search.createFilter({
                                name: searchField,
                                operator: nullOperator
                            }));
                        }
                    } else if (rawCondition.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]$/i)) {
                        var likeMatch = rawCondition.match(/(\w+)\s+LIKE\s+['"]([^'"]+)['"]$/i);
                        var fieldName = likeMatch[1];
                        var pattern = likeMatch[2];
                        log.debug({
                            title: 'Parsed LIKE condition for custom list',
                            details: 'Field: ' + fieldName + ', Pattern: ' + pattern
                        });

                        // Map field names for custom list values
                        var fieldMapping = {
                            'id': 'internalid',
                            'ID': 'internalid',
                            'Id': 'internalid',
                            'internalid': 'internalid',
                            'internalId': 'internalid',
                            'internalID': 'internalid',
                            'internal_id': 'internalid',
                            'recordid': 'internalid',
                            'recordId': 'internalid',
                            'recordID': 'internalid',
                            'name': 'name', // Display name/value
                            'value': 'name', // Display name/value
                            'scriptid': 'scriptid' // Script ID field
                            // Note: externalid is not a searchable field for custom list values
                        };
                        var searchField = fieldMapping[fieldName.toLowerCase()] || fieldName;

                        // Convert SQL LIKE pattern to NetSuite search
                        var searchOperator;
                        var searchValue;
                        if (pattern.endsWith('%') && !pattern.startsWith('%')) {
                            searchOperator = search.Operator.STARTSWITH;
                            searchValue = pattern.slice(0, -1);
                        } else if (pattern.startsWith('%') && !pattern.endsWith('%')) {
                            searchOperator = search.Operator.ENDSWITH;
                            searchValue = pattern.slice(1);
                        } else if (pattern.startsWith('%') && pattern.endsWith('%')) {
                            searchOperator = search.Operator.CONTAINS;
                            searchValue = pattern.slice(1, -1);
                        } else {
                            searchOperator = search.Operator.IS;
                            searchValue = pattern;
                        }
                        log.debug({
                            title: 'LIKE condition converted for custom list',
                            details: 'Search Field: ' + searchField + ', Operator: ' + searchOperator + ', Value: ' + searchValue
                        });
                        searchFilters.push(search.createFilter({
                            name: searchField,
                            operator: searchOperator,
                            values: [searchValue]
                        }));
                    } else {
                        throw error.create({
                            name: 'UNSUPPORTED_WHERE_CLAUSE',
                            message: 'Unsupported RAW WHERE condition: ' + rawCondition + '. Supported: field = value, field > value, field >= value, field < value, field <= value, field BETWEEN val1 AND val2, field IN (...), field IS NULL, field IS NOT NULL, field LIKE \'pattern%\''
                        });
                    }
                }
            } else if (parsedStatement.whereCondition.type === 'COMPOUND') {
                // Handle COMPOUND WHERE conditions (AND/OR) using the existing compound logic
                log.debug({
                    title: 'Handling COMPOUND WHERE condition in deleteCustomListValues',
                    details: 'Using findRecordsWithCompoundCondition for compound logic'
                });
                // Use the existing compound condition logic to get matching record IDs
                var matchingRecordIds = findRecordsWithCompoundCondition(parsedStatement.whereCondition, recordType);
                log.debug({
                    title: 'COMPOUND condition results for custom list delete',
                    details: 'Found ' + matchingRecordIds.length + ' matching records'
                });
                // Convert to search results format and set a flag to skip normal search
                var searchResults = matchingRecordIds.map(function(id) {
                    return { id: id, name: '', externalid: '' }; // Minimal data needed for delete
                });
                // Set flag to skip the normal search execution below
                var skipNormalSearch = true;
            } else {
                // Handle simple structured WHERE conditions
                var simpleFilter = buildCustomListSimpleFilter(parsedStatement.whereCondition);
                if (simpleFilter) {
                    // Handle both array-based filters (for text-based ID fields) and object filters
                    searchFilters.push(simpleFilter);
                } else {
                    throw error.create({
                        name: 'UNSUPPORTED_CONDITION',
                        message: 'Unsupported WHERE condition type: ' + parsedStatement.whereCondition.type
                    });
                }
            }
        } else {
            throw error.create({
                name: 'MISSING_WHERE_CLAUSE',
                message: 'WHERE clause is required for DELETE operations on custom lists'
            });
        }

        // Search for existing custom list value records
        var searchResults = [];
        // Skip normal search if we already have results from compound condition handling
        if (skipNormalSearch) {
            log.debug({
                title: 'Skipping normal search - using compound condition results',
                details: 'Already have ' + searchResults.length + ' records from compound condition logic'
            });
        } else {
            try {
                // Check if we need to handle multiple text values with separate searches
                if (searchFilters.multipleTextValues) {
                    var multipleValues = searchFilters.multipleTextValues;
                    log.debug({
                        title: 'Running multiple searches for text field IN clause',
                        details: 'Field: ' + multipleValues.field + ', Values: ' + JSON.stringify(multipleValues.values)
                    });
                    // Run a separate search for each value and combine results
                    for (var i = 0; i < multipleValues.values.length; i++) {
                        var value = multipleValues.values[i];
                        var singleSearchFilters = [search.createFilter({
                            name: multipleValues.field,
                            operator: search.Operator.IS,
                            values: value
                        })];
                        var searchObj = search.create({
                            type: recordType.type,
                            filters: singleSearchFilters,
                            columns: [
                                'internalid',
                                'name',
                                'externalid'
                            ]
                        });
                        var pageSize = 1000;
                        var start = 0;

                        do {
                            var pagedResults = searchObj.run().getRange({
                                start: start,
                                end: start + pageSize
                            });
                            for (var j = 0; j < pagedResults.length; j++) {
                                var recordId = pagedResults[j].getValue('internalid');
                                var resultData = {
                                    id: recordId,
                                    name: pagedResults[j].getValue('name'),
                                    externalid: pagedResults[j].getValue('externalid')
                                };
                                log.debug({
                                    title: 'Multiple search result found',
                                    details: 'ID: ' + resultData.id + ', Name: ' + resultData.name + ', ExternalID: ' + resultData.externalid
                                });
                                if (!searchResults.some(function(existing) { return existing.id === recordId; })) {
                                    searchResults.push(resultData);
                                }
                            }
                            start += pageSize;
                        } while (pagedResults.length === pageSize);
                    }
                } else if (searchFilters.customListExternalIdNotNull || searchFilters.customListExternalIdNull) {
                    // For externalid NULL checks, search all records and filter manually
                    var searchObj = search.create({
                        type: recordType.type,
                        columns: [
                            'internalid',
                            'name',
                            'externalid'
                        ]
                    });
                    var pageSize = 1000;
                    var start = 0;

                    do {
                        var pagedResults = searchObj.run().getRange({
                            start: start,
                            end: start + pageSize
                        });
                        for (var j = 0; j < pagedResults.length; j++) {
                            var resultData = {
                                id: pagedResults[j].getValue('internalid'),
                                name: pagedResults[j].getValue('name'),
                                externalid: pagedResults[j].getValue('externalid')
                            };
                            var externalIdValue = resultData.externalid ? resultData.externalid.trim() : '';
                            if (searchFilters.customListExternalIdNotNull && externalIdValue !== '') {
                                searchResults.push(resultData);
                            } else if (searchFilters.customListExternalIdNull && externalIdValue === '') {
                                searchResults.push(resultData);
                            }
                        }
                        start += pageSize;
                    } while (pagedResults.length === pageSize);
                } else {
                    // Standard single search
                    var actualFilters = Array.isArray(searchFilters) ? searchFilters : [];
                    log.debug({
                        title: 'Creating single search for custom list values',
                        details: 'Type: ' + recordType.type + ', Filters: ' + JSON.stringify(actualFilters)
                    });
                    var searchObj = search.create({
                        type: recordType.type,
                        filters: actualFilters,
                        columns: [
                            'internalid',
                            'name',
                            'externalid'
                        ]
                    });
                    var pageSize = 1000;
                    var start = 0;

                    do {
                        var pagedResults = searchObj.run().getRange({
                            start: start,
                            end: start + pageSize
                        });
                        for (var j = 0; j < pagedResults.length; j++) {
                            var resultData = {
                                id: pagedResults[j].getValue('internalid'),
                                name: pagedResults[j].getValue('name'),
                                externalid: pagedResults[j].getValue('externalid')
                            };
                            log.debug({
                                title: 'Search result found',
                                details: 'ID: ' + resultData.id + ', Name: ' + resultData.name + ', ExternalID: ' + resultData.externalid
                            });
                            searchResults.push(resultData);
                        }
                        start += pageSize;
                    } while (pagedResults.length === pageSize);
                }
            } catch (searchError) {
                log.error({
                    title: 'Search operation failed',
                    details: 'Error: ' + searchError.message + ', Type: ' + recordType.type + ', Filters: ' + JSON.stringify(searchFilters)
                });
                throw error.create({
                    name: 'SEARCH_FAILED',
                    message: 'Failed to search for custom list values: ' + searchError.message
                });
            }
        }

        if (searchResults.length === 0) {
            throw error.create({
                name: 'NO_RECORDS_FOUND',
                message: 'No custom list values found matching WHERE condition: ' + JSON.stringify(parsedStatement.whereCondition)
            });
        }

        log.debug({
            title: 'Found custom list values to delete',
            details: 'Count: ' + searchResults.length + ', Records: ' + JSON.stringify(searchResults)
        });

        // Handle PREVIEW mode - show what would be deleted without actually deleting
        if (parsedStatement.isPreview) {
            log.audit({
                title: 'DELETE PREVIEW - NO RECORDS DELETED',
                details: 'Count: ' + searchResults.length + ', Records: ' + JSON.stringify(searchResults)
            });
            return {
                recordsDeleted: 0,
                recordIds: searchResults.map(function(record) { return record.id; }),
                previewRecords: searchResults,
                isPreview: true,
                message: '🔍 PREVIEW ONLY - NO RECORDS DELETED. Found ' + searchResults.length + ' record(s) that would be deleted. Add COMMIT to actually delete these records.'
            };
        }

        // Delete each found record
        var deletedRecords = [];
        var errors = [];
        for (var i = 0; i < searchResults.length; i++) {
            try {
                var recordId = searchResults[i].id;
                deleteSingleRecord(recordId, recordType.type);
                deletedRecords.push(recordId);

                log.debug({
                    title: 'Custom list value deleted',
                    details: 'ID: ' + recordId
                });
            } catch (deleteError) {
                log.error({
                    title: 'Error deleting custom list value',
                    details: 'ID: ' + searchResults[i].id + ', Error: ' + deleteError.message
                });
                errors.push({
                    recordId: searchResults[i].id,
                    error: deleteError.message
                });
            }
        }

        if (errors.length > 0 && deletedRecords.length === 0) {
            // All deletes failed
            throw error.create({
                name: 'DELETE_FAILED',
                message: 'Failed to delete custom list values: ' + JSON.stringify(errors)
            });
        }

        return {
            recordsDeleted: deletedRecords.length,
            recordIds: deletedRecords,
            recordType: recordType.type,
            errors: errors.length > 0 ? errors : null
        };
    }

    // Public API
    return {
        execute: execute
    };
});