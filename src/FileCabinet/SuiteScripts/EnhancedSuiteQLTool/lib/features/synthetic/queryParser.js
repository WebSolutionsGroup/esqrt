/**
 * @fileoverview Query Parser for Synthetic Functions and Stored Procedures
 * 
 * This module handles detection and parsing of custom function calls and
 * stored procedure calls within SuiteQL queries.
 * 
 * Detects patterns like:
 * - parse_full_address(billing_address).city
 * - calculate_tax(amount, state)
 * - CALL apply_discount(transaction_type='salesorder', threshold_amount=1000)
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define(['N/log'], function(log) {
    'use strict';

    /**
     * Query analysis result structure
     * @typedef {Object} QueryAnalysis
     * @property {boolean} hasSyntheticFunctions - Whether query contains custom functions
     * @property {boolean} hasStoredProcedures - Whether query contains stored procedure calls
     * @property {Array} functions - Array of detected function calls
     * @property {Array} procedures - Array of detected procedure calls
     * @property {string} queryType - 'SELECT', 'CALL', or 'MIXED'
     * @property {string} originalQuery - Original query text
     */

    /**
     * Function call structure
     * @typedef {Object} FunctionCall
     * @property {string} name - Function name
     * @property {Array} parameters - Array of parameter values
     * @property {string} fullMatch - Full matched text
     * @property {number} startIndex - Start position in query
     * @property {number} endIndex - End position in query
     * @property {string} propertyAccess - Property access chain (e.g., '.city')
     */

    /**
     * Stored procedure call structure
     * @typedef {Object} ProcedureCall
     * @property {string} name - Procedure name
     * @property {Object} parameters - Named parameters object
     * @property {string} fullMatch - Full matched text
     * @property {number} startIndex - Start position in query
     * @property {number} endIndex - End position in query
     */

    /**
     * Analyze query for synthetic functions and stored procedures
     * 
     * @param {string} query - SQL query to analyze
     * @returns {QueryAnalysis} Analysis results
     */
    function analyzeQuery(query) {
        if (!query || typeof query !== 'string') {
            return createEmptyAnalysis(query);
        }

        var trimmedQuery = query.trim();
        var analysis = {
            hasSyntheticFunctions: false,
            hasStoredProcedures: false,
            functions: [],
            procedures: [],
            queryType: determineQueryType(trimmedQuery),
            originalQuery: query
        };

        try {
            // Detect stored procedure calls first (CALL statements)
            if (analysis.queryType === 'CALL' || analysis.queryType === 'MIXED') {
                analysis.procedures = detectStoredProcedureCalls(trimmedQuery);
                analysis.hasStoredProcedures = analysis.procedures.length > 0;
            }

            // Detect function calls in SELECT statements
            if (analysis.queryType === 'SELECT' || analysis.queryType === 'MIXED') {
                analysis.functions = detectFunctionCalls(trimmedQuery);
                analysis.hasSyntheticFunctions = analysis.functions.length > 0;
            }

            log.debug({
                title: 'Query Analysis Complete',
                details: 'Functions: ' + analysis.functions.length + 
                        ', Procedures: ' + analysis.procedures.length +
                        ', Type: ' + analysis.queryType
            });

        } catch (error) {
            log.error({
                title: 'Error analyzing query',
                details: error.message
            });
        }

        return analysis;
    }

    /**
     * Determine the type of query
     * 
     * @param {string} query - SQL query
     * @returns {string} Query type: 'SELECT', 'CALL', or 'MIXED'
     */
    function determineQueryType(query) {
        var upperQuery = query.toUpperCase();
        
        var hasSelect = upperQuery.includes('SELECT');
        var hasCall = upperQuery.match(/\bCALL\s+\w+/);
        
        if (hasSelect && hasCall) {
            return 'MIXED';
        } else if (hasCall) {
            return 'CALL';
        } else if (hasSelect) {
            return 'SELECT';
        } else {
            return 'UNKNOWN';
        }
    }

    /**
     * Detect stored procedure calls in query
     * Pattern: CALL procedure_name(param1=value1, param2=value2)
     * 
     * @param {string} query - SQL query
     * @returns {Array<ProcedureCall>} Array of detected procedure calls
     */
    function detectStoredProcedureCalls(query) {
        var procedures = [];
        
        try {
            // Regex to match CALL statements
            var callPattern = /\bCALL\s+(\w+)\s*\((.*?)\)/gi;
            var match;

            while ((match = callPattern.exec(query)) !== null) {
                var procedureName = match[1];
                var parametersString = match[2];
                var fullMatch = match[0];
                var startIndex = match.index;
                var endIndex = match.index + fullMatch.length;

                // Parse named parameters
                var parameters = parseNamedParameters(parametersString);

                procedures.push({
                    name: procedureName,
                    parameters: parameters,
                    fullMatch: fullMatch,
                    startIndex: startIndex,
                    endIndex: endIndex
                });
            }

        } catch (error) {
            log.error({
                title: 'Error detecting stored procedure calls',
                details: error.message
            });
        }

        return procedures;
    }

    /**
     * Detect function calls in query
     * Pattern: function_name(param1, param2).property
     * 
     * @param {string} query - SQL query
     * @returns {Array<FunctionCall>} Array of detected function calls
     */
    function detectFunctionCalls(query) {
        var functions = [];

        try {
            log.debug({
                title: 'Detecting function calls in query',
                details: 'Query: ' + query
            });

            // Regex to match function calls with optional property access
            // Matches: function_name(params) or function_name(params).property.chain
            var functionPattern = /\b([a-zA-Z_]\w*)\s*\((.*?)\)(\.[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)?/g;
            var match;

            while ((match = functionPattern.exec(query)) !== null) {
                var functionName = match[1];
                var parametersString = match[2];
                var propertyAccess = match[3] || '';
                var fullMatch = match[0];
                var startIndex = match.index;
                var endIndex = match.index + fullMatch.length;

                log.debug({
                    title: 'Found potential function call',
                    details: 'Function: ' + functionName + ', Full match: ' + fullMatch
                });

                // Skip SQL built-in functions
                if (isSQLBuiltinFunction(functionName)) {
                    log.debug({
                        title: 'Skipping built-in function',
                        details: 'Function: ' + functionName
                    });
                    continue;
                }

                // Parse positional parameters
                var parameters = parsePositionalParameters(parametersString);

                var functionCall = {
                    name: functionName,
                    parameters: parameters,
                    fullMatch: fullMatch,
                    startIndex: startIndex,
                    endIndex: endIndex,
                    propertyAccess: propertyAccess
                };

                log.debug({
                    title: 'Adding synthetic function call',
                    details: 'Function: ' + functionName + ', Parameters: ' + JSON.stringify(parameters)
                });

                functions.push(functionCall);
            }

        } catch (error) {
            log.error({
                title: 'Error detecting function calls',
                details: error.message
            });
        }

        return functions;
    }

    /**
     * Parse named parameters from string
     * Format: param1=value1, param2='value2', param3=123
     * 
     * @param {string} parametersString - Parameters string
     * @returns {Object} Parsed parameters object
     */
    function parseNamedParameters(parametersString) {
        var parameters = {};
        
        if (!parametersString || !parametersString.trim()) {
            return parameters;
        }

        try {
            // Split by comma, but respect quoted strings
            var paramPairs = splitParameterString(parametersString);
            
            paramPairs.forEach(function(pair) {
                var equalIndex = pair.indexOf('=');
                if (equalIndex > 0) {
                    var key = pair.substring(0, equalIndex).trim();
                    var value = pair.substring(equalIndex + 1).trim();
                    
                    // Remove quotes and convert types
                    parameters[key] = parseParameterValue(value);
                }
            });

        } catch (error) {
            log.error({
                title: 'Error parsing named parameters',
                details: 'Parameters: ' + parametersString + ', Error: ' + error.message
            });
        }

        return parameters;
    }

    /**
     * Parse positional parameters from string
     * Format: param1, 'param2', 123
     * 
     * @param {string} parametersString - Parameters string
     * @returns {Array} Parsed parameters array
     */
    function parsePositionalParameters(parametersString) {
        var parameters = [];
        
        if (!parametersString || !parametersString.trim()) {
            return parameters;
        }

        try {
            // Split by comma, but respect quoted strings
            var paramValues = splitParameterString(parametersString);
            
            paramValues.forEach(function(value) {
                parameters.push(parseParameterValue(value.trim()));
            });

        } catch (error) {
            log.error({
                title: 'Error parsing positional parameters',
                details: 'Parameters: ' + parametersString + ', Error: ' + error.message
            });
        }

        return parameters;
    }

    /**
     * Split parameter string by comma, respecting quoted strings
     * 
     * @param {string} str - String to split
     * @returns {Array} Array of parameter strings
     */
    function splitParameterString(str) {
        var parts = [];
        var current = '';
        var inQuotes = false;
        var quoteChar = '';
        
        for (var i = 0; i < str.length; i++) {
            var char = str[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
                current += char;
            } else if (char === ',' && !inQuotes) {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        if (current) {
            parts.push(current);
        }
        
        return parts;
    }

    /**
     * Parse parameter value and convert to appropriate type
     * 
     * @param {string} value - Parameter value string
     * @returns {any} Parsed value
     */
    function parseParameterValue(value) {
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        
        // Try to parse as number
        if (/^\d+$/.test(value)) {
            return parseInt(value, 10);
        }
        
        if (/^\d*\.\d+$/.test(value)) {
            return parseFloat(value);
        }
        
        // Try to parse as boolean
        if (value.toLowerCase() === 'true') {
            return true;
        }
        
        if (value.toLowerCase() === 'false') {
            return false;
        }
        
        // Return as string
        return value;
    }

    /**
     * Check if function name is a SQL built-in function
     * 
     * @param {string} functionName - Function name to check
     * @returns {boolean} True if built-in function
     */
    function isSQLBuiltinFunction(functionName) {
        var builtinFunctions = [
            'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UPPER', 'LOWER', 'SUBSTR', 'LENGTH',
            'TRIM', 'LTRIM', 'RTRIM', 'REPLACE', 'CONCAT', 'TO_CHAR', 'TO_DATE', 'TO_NUMBER',
            'CASE', 'COALESCE', 'NULLIF', 'DECODE', 'NVL', 'NVL2', 'GREATEST', 'LEAST',
            'ROUND', 'TRUNC', 'CEIL', 'FLOOR', 'ABS', 'SIGN', 'MOD', 'POWER', 'SQRT',
            'SYSDATE', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'ADD_MONTHS', 'MONTHS_BETWEEN',
            'EXTRACT', 'DATE_PART', 'INSTR', 'LPAD', 'RPAD'
        ];
        
        return builtinFunctions.includes(functionName.toUpperCase());
    }

    /**
     * Create empty analysis result
     * 
     * @param {string} query - Original query
     * @returns {QueryAnalysis} Empty analysis
     */
    function createEmptyAnalysis(query) {
        return {
            hasSyntheticFunctions: false,
            hasStoredProcedures: false,
            functions: [],
            procedures: [],
            queryType: 'UNKNOWN',
            originalQuery: query || ''
        };
    }

    // Public API
    return {
        analyzeQuery: analyzeQuery,
        detectStoredProcedureCalls: detectStoredProcedureCalls,
        detectFunctionCalls: detectFunctionCalls,
        parseNamedParameters: parseNamedParameters,
        parsePositionalParameters: parsePositionalParameters,
        isSQLBuiltinFunction: isSQLBuiltinFunction
    };
});
