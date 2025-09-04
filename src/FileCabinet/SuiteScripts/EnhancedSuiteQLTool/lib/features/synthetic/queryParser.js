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

                log.debug({
                    title: 'After procedure detection',
                    details: 'Procedures assigned: ' + analysis.procedures.length + ', Has procedures: ' + analysis.hasStoredProcedures + ', Query type: ' + analysis.queryType
                });
            }

            // Detect function calls in SELECT statements
            if (analysis.queryType === 'SELECT' || analysis.queryType === 'MIXED') {
                analysis.functions = detectFunctionCalls(trimmedQuery);
                analysis.hasSyntheticFunctions = analysis.functions.length > 0;
            }

            log.debug({
                title: 'Before final analysis log',
                details: 'Functions array: ' + JSON.stringify(analysis.functions) + ', Procedures array: ' + JSON.stringify(analysis.procedures)
            });

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
            log.debug({
                title: 'Detecting stored procedure calls',
                details: 'Query: ' + query.substring(0, 100) + (query.length > 100 ? '...' : '')
            });

            // Debug: Test different regex patterns
            log.debug({
                title: 'Regex debugging',
                details: 'Query length: ' + query.length + ', First 200 chars: ' + query.substring(0, 200)
            });

            // Test if CALL exists at all
            var hasCall = /\bCALL\b/i.test(query);
            log.debug({
                title: 'CALL keyword test',
                details: 'Has CALL: ' + hasCall
            });

            // Test simpler pattern first
            var simplePattern = /CALL\s+(\w+)/gi;
            var simpleMatch = simplePattern.exec(query);
            log.debug({
                title: 'Simple pattern test',
                details: 'Simple match: ' + (simpleMatch ? simpleMatch[0] + ' -> ' + simpleMatch[1] : 'null')
            });

            // Regex to match CALL statements - use [\s\S] to match across lines
            var callPattern = /\bCALL\s+(\w+)\s*\(([\s\S]*?)\)/gi;
            callPattern.lastIndex = 0; // Reset regex position
            var match;

            while ((match = callPattern.exec(query)) !== null) {
                var procedureName = match[1];
                var parametersString = match[2];
                var fullMatch = match[0];
                var startIndex = match.index;
                var endIndex = match.index + fullMatch.length;

                log.debug({
                    title: 'Found CALL statement match',
                    details: 'Procedure: ' + procedureName + ', Parameters: ' + parametersString + ', Full match: ' + fullMatch
                });

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

            log.debug({
                title: 'Stored procedure detection complete',
                details: 'Found ' + procedures.length + ' procedures: ' + procedures.map(function(p) { return p.name; }).join(', ')
            });

            log.debug({
                title: 'About to return procedures',
                details: 'Returning ' + procedures.length + ' procedures: ' + JSON.stringify(procedures)
            });

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

                // Skip if this appears to be part of a subquery context
                if (isInSubqueryContext(query, startIndex)) {
                    log.debug({
                        title: 'Skipping potential function in subquery context',
                        details: 'Function: ' + functionName + ' at position ' + startIndex
                    });
                    continue;
                }

                // Skip if this looks like a SQL keyword in a complex expression
                if (isSQLKeywordInContext(query, functionName, startIndex)) {
                    log.debug({
                        title: 'Skipping SQL keyword in context',
                        details: 'Keyword: ' + functionName
                    });
                    continue;
                }

                // Skip if this is a SELECT statement (correlated subquery protection)
                if (functionName.toUpperCase() === 'SELECT') {
                    log.debug({
                        title: 'Skipping SELECT statement (not a function)',
                        details: 'SELECT at position ' + startIndex
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
            // Aggregate functions (comprehensive list)
            'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'STDDEV', 'VARIANCE', 'MEDIAN',
            'LISTAGG', 'STRING_AGG', 'GROUP_CONCAT', 'COLLECT',

            // String functions
            'UPPER', 'LOWER', 'SUBSTR', 'SUBSTRING', 'LENGTH', 'LEN', 'TRIM', 'LTRIM', 'RTRIM',
            'REPLACE', 'CONCAT', 'INSTR', 'LPAD', 'RPAD', 'LEFT', 'RIGHT', 'REVERSE',
            'CHARINDEX', 'PATINDEX', 'STUFF', 'TRANSLATE',

            // Date functions
            'TO_CHAR', 'TO_DATE', 'TO_NUMBER', 'SYSDATE', 'CURRENT_DATE', 'CURRENT_TIMESTAMP',
            'ADD_MONTHS', 'MONTHS_BETWEEN', 'EXTRACT', 'DATE_PART', 'DATEADD', 'DATEDIFF',
            'DATEPART', 'DATENAME', 'GETDATE', 'NOW', 'CURDATE', 'CURTIME',

            // Conditional functions
            'CASE', 'COALESCE', 'NULLIF', 'DECODE', 'NVL', 'NVL2', 'GREATEST', 'LEAST',
            'IIF', 'CHOOSE', 'ISNULL', 'IFNULL',

            // Math functions
            'ROUND', 'TRUNC', 'TRUNCATE', 'CEIL', 'CEILING', 'FLOOR', 'ABS', 'SIGN', 'MOD',
            'POWER', 'SQRT', 'EXP', 'LOG', 'LOG10', 'SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN',
            'ATAN2', 'DEGREES', 'RADIANS', 'PI', 'RAND', 'RANDOM',

            // SQL operators and keywords that use parentheses (CRITICAL FIX)
            'IN', 'EXISTS', 'NOT', 'CAST', 'CONVERT', 'TRY_CAST', 'TRY_CONVERT',
            'ISNULL', 'IFNULL', 'BETWEEN', 'LIKE', 'ESCAPE',

            // SQL statement keywords (to prevent SELECT(...) from being treated as function)
            'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'UNION', 'INTERSECT', 'EXCEPT',

            // Window functions
            'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
            'NTH_VALUE', 'PERCENT_RANK', 'CUME_DIST', 'PERCENTILE_CONT', 'PERCENTILE_DISC',

            // Analytical functions
            'OVER', 'PARTITION', 'WITHIN', 'RESPECT', 'IGNORE', 'NULLS',

            // NetSuite specific functions
            'BUILTIN', 'FORMULATEXT', 'FORMULANUMERIC', 'FORMULADATE', 'FORMULACURRENCY',
            'HIERARCHYLEVEL', 'HIERARCHYOF'
        ];

        return builtinFunctions.includes(functionName.toUpperCase());
    }

    /**
     * Check if a potential function call is within a subquery context
     *
     * @param {string} query - Full query string
     * @param {number} position - Position of the potential function call
     * @returns {boolean} True if within subquery context
     */
    function isInSubqueryContext(query, position) {
        // Look backwards from position to find context
        var beforeText = query.substring(0, position).toUpperCase();
        var afterText = query.substring(position).toUpperCase();

        // Count parentheses to determine nesting level
        var openParens = (beforeText.match(/\(/g) || []).length;
        var closeParens = (beforeText.match(/\)/g) || []).length;
        var nestingLevel = openParens - closeParens;

        // If we're nested inside parentheses, check if it's a subquery context
        if (nestingLevel > 0) {
            // Look for subquery indicators before this position
            var subqueryPatterns = [
                /\bEXISTS\s*\(\s*SELECT\b/i,
                /\bIN\s*\(\s*SELECT\b/i,
                /\bNOT\s+IN\s*\(\s*SELECT\b/i,
                /\bNOT\s+EXISTS\s*\(\s*SELECT\b/i,
                /\b(?:=|<>|!=|<|>|<=|>=)\s*\(\s*SELECT\b/i,
                // Correlated subqueries in SELECT clause
                /\bSELECT\s+.*,\s*\(\s*SELECT\b/i,
                /\bSELECT\s+\(\s*SELECT\b/i,
                // Subqueries in FROM clause
                /\bFROM\s*\(\s*SELECT\b/i,
                // Subqueries in JOIN conditions
                /\bJOIN\s*\(\s*SELECT\b/i,
                /\bLEFT\s+JOIN\s*\(\s*SELECT\b/i,
                /\bRIGHT\s+JOIN\s*\(\s*SELECT\b/i,
                /\bINNER\s+JOIN\s*\(\s*SELECT\b/i,
                /\bOUTER\s+JOIN\s*\(\s*SELECT\b/i
            ];

            for (var i = 0; i < subqueryPatterns.length; i++) {
                if (subqueryPatterns[i].test(beforeText)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if a function name is actually a SQL keyword in a specific context
     *
     * @param {string} query - Full query string
     * @param {string} functionName - Function name to check
     * @param {number} position - Position in query
     * @returns {boolean} True if it's a SQL keyword in context
     */
    function isSQLKeywordInContext(query, functionName, position) {
        var upperFunctionName = functionName.toUpperCase();
        var beforeText = query.substring(0, position).toUpperCase();
        var afterText = query.substring(position).toUpperCase();

        // Check for specific SQL keyword patterns that might be missed
        var keywordPatterns = [
            // Pattern: WHERE field IN (...)
            { keyword: 'IN', pattern: /\bWHERE\s+\w+\s*$/ },
            // Pattern: AND field IN (...)
            { keyword: 'IN', pattern: /\bAND\s+\w+\s*$/ },
            // Pattern: OR field IN (...)
            { keyword: 'IN', pattern: /\bOR\s+\w+\s*$/ },
            // Pattern: WHERE EXISTS (...)
            { keyword: 'EXISTS', pattern: /\bWHERE\s*$/ },
            // Pattern: AND EXISTS (...)
            { keyword: 'EXISTS', pattern: /\bAND\s*$/ },
            // Pattern: OR EXISTS (...)
            { keyword: 'EXISTS', pattern: /\bOR\s*$/ },
            // Pattern: SELECT field, (SELECT ...) - correlated subquery
            { keyword: 'SELECT', pattern: /\bSELECT\s+.*,\s*\(\s*$/ },
            { keyword: 'SELECT', pattern: /\bSELECT\s+\(\s*$/ },
            // Pattern: FROM (SELECT ...) - derived table
            { keyword: 'SELECT', pattern: /\bFROM\s*\(\s*$/ },
            // Pattern: JOIN (SELECT ...) - subquery in JOIN
            { keyword: 'SELECT', pattern: /\bJOIN\s*\(\s*$/ },
            { keyword: 'SELECT', pattern: /\bLEFT\s+JOIN\s*\(\s*$/ },
            { keyword: 'SELECT', pattern: /\bRIGHT\s+JOIN\s*\(\s*$/ },
            { keyword: 'SELECT', pattern: /\bINNER\s+JOIN\s*\(\s*$/ }
        ];

        for (var i = 0; i < keywordPatterns.length; i++) {
            var pattern = keywordPatterns[i];
            if (pattern.keyword === upperFunctionName && pattern.pattern.test(beforeText)) {
                return true;
            }
        }

        return false;
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
        isSQLBuiltinFunction: isSQLBuiltinFunction,
        isInSubqueryContext: isInSubqueryContext,
        isSQLKeywordInContext: isSQLKeywordInContext
    };
});
