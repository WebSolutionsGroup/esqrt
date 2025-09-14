/**
 * @fileoverview JavaScript Execution Engine for Synthetic Functions
 * 
 * This module provides secure execution environment for JavaScript functions
 * and stored procedures with NetSuite module access.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define([
    'N/file', 'N/log', 'N/record', 'N/query', 'N/search', 'N/format', 'N/runtime',
    './syntheticFunctions',
    './queryParser',
    './syntheticProcessor',
    '../dml/dmlProcessor'
], function(file, log, record, query, search, format, runtime, syntheticFunctions, queryParser, syntheticProcessor, dmlProcessor) {
    'use strict';

    // Cache for compiled functions
    var compiledFunctionCache = {};
    var CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

    /**
     * Execution context structure
     * @typedef {Object} ExecutionContext
     * @property {Object} params - Function parameters
     * @property {Object} modules - Available NetSuite modules
     * @property {Object} row - Current row data (for functions)
     * @property {string} userId - Current user ID
     * @property {string} roleId - Current role ID
     * @property {Object} environment - Environment information
     */

    /**
     * Execution result structure
     * @typedef {Object} ExecutionResult
     * @property {boolean} success - Whether execution was successful
     * @property {any} result - Function return value
     * @property {string} error - Error message if failed
     * @property {number} executionTime - Execution time in milliseconds
     */

    /**
     * Execute a synthetic function
     * 
     * @param {string} functionName - Name of function to execute
     * @param {Array} parameters - Function parameters
     * @param {Object} rowData - Current row data (optional)
     * @returns {ExecutionResult} Execution result
     */
    function executeFunction(functionName, parameters, rowData) {
        var startTime = Date.now();
        
        try {
            // Get function registry
            var registry = syntheticFunctions.buildFunctionRegistry();
            var functionMeta = registry.functions[functionName];

            // If not found with exact case, try case-insensitive lookup
            if (!functionMeta) {
                var lowerFunctionName = functionName.toLowerCase();
                var functionNames = Object.keys(registry.functions);

                for (var i = 0; i < functionNames.length; i++) {
                    if (functionNames[i].toLowerCase() === lowerFunctionName) {
                        functionMeta = registry.functions[functionNames[i]];
                        break;
                    }
                }
            }

            if (!functionMeta) {
                return {
                    success: false,
                    result: null,
                    error: 'Function not found: ' + functionName,
                    executionTime: Date.now() - startTime
                };
            }

            // Load and compile function
            var compiledFunction = getCompiledFunction(functionMeta);
            if (!compiledFunction) {
                return {
                    success: false,
                    result: null,
                    error: 'Failed to compile function: ' + functionName,
                    executionTime: Date.now() - startTime
                };
            }

            // Create execution context
            var context = createExecutionContext(parameters, functionMeta.parameters, rowData);

            // Execute function
            var result = compiledFunction(context);

            // Debug function result
            log.debug({
                title: 'Function execution result',
                details: 'Function: ' + functionName + ', Result: ' + JSON.stringify(result) + ', Type: ' + typeof result
            });

            return {
                success: true,
                result: result,
                error: null,
                executionTime: Date.now() - startTime
            };

        } catch (error) {
            log.error({
                title: 'Function execution error',
                details: 'Function: ' + functionName + ', Error: ' + error.message
            });
            
            return {
                success: false,
                result: null,
                error: error.message,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Execute a stored procedure
     *
     * @param {string} procedureName - Name of procedure to execute
     * @param {Object} parameters - Named parameters
     * @returns {ExecutionResult} Execution result
     */
    function executeProcedure(procedureName, parameters) {
        var startTime = Date.now();

        try {
            // Get function registry
            var registry = syntheticFunctions.buildFunctionRegistry();
            var procedureMeta = registry.procedures[procedureName];

            // If not found with exact case, try case-insensitive lookup
            if (!procedureMeta) {
                var lowerProcedureName = procedureName.toLowerCase();
                var procedureNames = Object.keys(registry.procedures);

                for (var i = 0; i < procedureNames.length; i++) {
                    if (procedureNames[i].toLowerCase() === lowerProcedureName) {
                        procedureMeta = registry.procedures[procedureNames[i]];
                        break;
                    }
                }
            }

            if (!procedureMeta) {
                return {
                    success: false,
                    result: null,
                    error: 'Procedure not found: ' + procedureName,
                    executionTime: Date.now() - startTime,
                    outputLog: []
                };
            }

            // Load and compile procedure
            var compiledProcedure = getCompiledFunction(procedureMeta);
            if (!compiledProcedure) {
                return {
                    success: false,
                    result: null,
                    error: 'Failed to compile procedure: ' + procedureName,
                    executionTime: Date.now() - startTime,
                    outputLog: []
                };
            }

            // Check if real-time output is requested
            var showOutput = parameters && (parameters.show_output === true || parameters.show_output === 'true');
            var outputLog = [];

            // Create execution context with output capture
            var context = createExecutionContextWithOutput(parameters, procedureMeta.parameters, showOutput, outputLog);

            // Execute procedure
            var result = compiledProcedure(context);

            // Debug procedure result
            log.debug({
                title: 'Procedure execution result',
                details: 'Procedure: ' + procedureName + ', Result: ' + JSON.stringify(result) + ', Type: ' + typeof result + ', Output Lines: ' + outputLog.length
            });

            return {
                success: true,
                result: result,
                error: null,
                executionTime: Date.now() - startTime,
                outputLog: outputLog,
                showOutput: showOutput
            };

        } catch (error) {
            log.error({
                title: 'Procedure execution error',
                details: 'Procedure: ' + procedureName + ', Error: ' + error.message
            });

            return {
                success: false,
                result: null,
                error: error.message,
                executionTime: Date.now() - startTime,
                outputLog: []
            };
        }
    }

    /**
     * Get compiled function from cache or compile it
     * 
     * @param {Object} functionMeta - Function metadata
     * @returns {Function|null} Compiled function or null if failed
     */
    function getCompiledFunction(functionMeta) {
        var cacheKey = functionMeta.fileId + '_' + functionMeta.lastModified.getTime();
        
        // Check cache first
        if (compiledFunctionCache[cacheKey]) {
            var cached = compiledFunctionCache[cacheKey];
            if (Date.now() < cached.expiry) {
                return cached.function;
            }
        }

        try {
            // Load file content
            var fileObj = file.load({ id: functionMeta.fileId });
            var content = fileObj.getContents();
            
            // Compile function
            var compiledFunction = compileFunction(content, functionMeta.name);
            
            // Cache compiled function
            compiledFunctionCache[cacheKey] = {
                function: compiledFunction,
                expiry: Date.now() + CACHE_DURATION
            };
            
            return compiledFunction;

        } catch (error) {
            log.error({
                title: 'Function compilation error',
                details: 'Function: ' + functionMeta.name + ', Error: ' + error.message
            });
            return null;
        }
    }

    /**
     * Compile JavaScript function with NetSuite modules in scope
     * 
     * @param {string} content - JavaScript file content
     * @param {string} functionName - Function name for error reporting
     * @returns {Function} Compiled function
     */
    function compileFunction(content, functionName) {
        try {
            // Create a simpler, more reliable compilation approach
            var functionCode =
                'var require = function(module) {\n' +
                '    switch(module) {\n' +
                '        case "N/record": return modules.record;\n' +
                '        case "N/query": return modules.query;\n' +
                '        case "N/search": return modules.search;\n' +
                '        case "N/log": return modules.log;\n' +
                '        case "N/format": return modules.format;\n' +
                '        case "N/runtime": return modules.runtime;\n' +
                '        case "N/file": return modules.file;\n' +
                '        default: throw new Error("Module not available: " + module);\n' +
                '    }\n' +
                '};\n' +
                'var exports = {};\n' +
                'var module = { exports: exports };\n' +
                'var console = modules.console || { log: function() {}, error: function() {}, info: function() {} };\n' +
                'var dml = modules.dml || {};\n' +
                'var functions = modules.functions || {};\n' +
                'var suiteql = modules.suiteql || {};\n' +
                content + '\n' +
                'return ' + functionName + ';';

            // Compile the function
            var compiledWrapper = new Function('modules', functionCode);

            return function(context) {
                // Provide NetSuite modules and enhanced capabilities to the function
                var modules = {
                    record: record,
                    query: query,
                    search: search,
                    log: log,
                    format: format,
                    runtime: runtime,
                    file: file,
                    console: context.console || { log: function() {}, error: function() {}, info: function() {} },
                    // Enhanced capabilities for stored procedures
                    dml: context.dml || {},
                    functions: context.functions || {},
                    suiteql: context.suiteql || {}
                };

                // Get the actual function
                var actualFunction = compiledWrapper(modules);

                if (typeof actualFunction !== 'function') {
                    throw new Error('Function not found: ' + functionName + ' (type: ' + typeof actualFunction + ')');
                }

                // Execute the function with the provided context
                // Console is now injected directly into the function code
                return actualFunction(context);
            };

        } catch (error) {
            log.error({
                title: 'Function compilation failed',
                details: 'Function: ' + functionName + ', Error: ' + error.message
            });
            throw error;
        }
    }

    /**
     * Create execution context for function/procedure
     * 
     * @param {Array|Object} parameters - Function parameters
     * @param {Array} expectedParams - Expected parameter definitions
     * @param {Object} rowData - Current row data (optional)
     * @returns {ExecutionContext} Execution context
     */
    function createExecutionContext(parameters, expectedParams, rowData) {
        var context = {
            params: {},
            modules: {
                record: record,
                query: query,
                search: search,
                log: log,
                format: format,
                runtime: runtime,
                file: file
            },
            row: rowData || {},
            userId: runtime.getCurrentUser().id,
            roleId: runtime.getCurrentUser().role,
            environment: {
                type: runtime.envType,
                version: runtime.version
            }
        };

        // Map parameters to context
        if (Array.isArray(parameters)) {
            // Positional parameters
            for (var i = 0; i < parameters.length && i < expectedParams.length; i++) {
                var paramValue = parameters[i];

                // Check if parameter is a column reference
                if (typeof paramValue === 'string' && rowData && rowData.hasOwnProperty(paramValue)) {
                    // Resolve column reference to actual value
                    paramValue = rowData[paramValue];
                } else if (typeof paramValue === 'string' && rowData) {
                    // Try case-insensitive column lookup
                    var lowerParamValue = paramValue.toLowerCase();
                    for (var key in rowData) {
                        if (key.toLowerCase() === lowerParamValue) {
                            paramValue = rowData[key];
                            break;
                        }
                    }
                }

                context.params[expectedParams[i].name] = paramValue;
            }
        } else if (typeof parameters === 'object' && parameters !== null) {
            // Named parameters
            context.params = parameters;
        }

        return context;
    }

    /**
     * Create execution context with output capture for stored procedures
     *
     * @param {Array|Object} parameters - Function parameters
     * @param {Array} expectedParams - Expected parameter definitions
     * @param {boolean} showOutput - Whether to capture output
     * @param {Array} outputLog - Array to capture output messages
     * @param {Object} rowData - Current row data (optional)
     * @returns {ExecutionContext} Execution context with output capture
     */
    function createExecutionContextWithOutput(parameters, expectedParams, showOutput, outputLog, rowData) {
        var context = createExecutionContext(parameters, expectedParams, rowData);

        // Add output capture functionality
        if (showOutput && outputLog) {
            // Create a custom console object that captures output
            context.console = {
                log: function() {
                    var message = Array.prototype.slice.call(arguments).map(function(arg) {
                        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                    }).join(' ');
                    outputLog.push({
                        type: 'log',
                        message: message,
                        timestamp: new Date().toISOString()
                    });
                },
                info: function() {
                    var message = Array.prototype.slice.call(arguments).map(function(arg) {
                        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                    }).join(' ');
                    outputLog.push({
                        type: 'info',
                        message: message,
                        timestamp: new Date().toISOString()
                    });
                },
                warn: function() {
                    var message = Array.prototype.slice.call(arguments).map(function(arg) {
                        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                    }).join(' ');
                    outputLog.push({
                        type: 'warn',
                        message: message,
                        timestamp: new Date().toISOString()
                    });
                },
                error: function() {
                    var message = Array.prototype.slice.call(arguments).map(function(arg) {
                        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                    }).join(' ');
                    outputLog.push({
                        type: 'error',
                        message: message,
                        timestamp: new Date().toISOString()
                    });
                }
            };

            // Also provide a direct output function
            context.output = function(message, type) {
                outputLog.push({
                    type: type || 'log',
                    message: String(message),
                    timestamp: new Date().toISOString()
                });
            };
        } else {
            // Provide silent console and output functions
            context.console = {
                log: function() {},
                info: function() {},
                warn: function() {},
                error: function() {}
            };
            context.output = function() {};
        }

        // Add DML execution capabilities to stored procedures
        context.dml = {
            /**
             * Execute INSERT statement within stored procedure
             * @param {string} sql - INSERT SQL statement
             * @returns {Object} Execution result
             */
            insert: function(sql) {
                return executeDMLInProcedure(sql, 'INSERT', outputLog, showOutput);
            },

            /**
             * Execute UPDATE statement within stored procedure
             * @param {string} sql - UPDATE SQL statement
             * @returns {Object} Execution result
             */
            update: function(sql) {
                return executeDMLInProcedure(sql, 'UPDATE', outputLog, showOutput);
            },

            /**
             * Execute DELETE statement within stored procedure
             * @param {string} sql - DELETE SQL statement
             * @returns {Object} Execution result
             */
            delete: function(sql) {
                return executeDMLInProcedure(sql, 'DELETE', outputLog, showOutput);
            }
        };

        // Add synthetic function execution capabilities
        context.functions = {
            /**
             * Execute a synthetic function within stored procedure
             * @param {string} functionName - Name of function to execute
             * @param {Array|Object} parameters - Function parameters
             * @returns {*} Function result
             */
            call: function(functionName, parameters) {
                return executeFunctionInProcedure(functionName, parameters, outputLog, showOutput);
            }
        };

        // Add SuiteQL execution capabilities
        context.suiteql = {
            /**
             * Execute SuiteQL query within stored procedure
             * @param {string} sql - SuiteQL query
             * @param {Array} params - Query parameters (optional)
             * @returns {Object} Query results
             */
            query: function(sql, params) {
                return executeSuiteQLInProcedure(sql, params, outputLog, showOutput);
            }
        };

        return context;
    }

    /**
     * Validate function parameters
     *
     * @param {Array|Object} parameters - Provided parameters
     * @param {Array} expectedParams - Expected parameter definitions
     * @returns {Object} Validation result
     */
    function validateParameters(parameters, expectedParams) {
        var result = {
            valid: true,
            errors: []
        };

        try {
            // Check required parameters
            expectedParams.forEach(function(param) {
                if (param.required) {
                    var hasParam = false;
                    
                    if (Array.isArray(parameters)) {
                        var paramIndex = expectedParams.indexOf(param);
                        hasParam = paramIndex < parameters.length && parameters[paramIndex] != null;
                    } else if (typeof parameters === 'object') {
                        hasParam = parameters.hasOwnProperty(param.name) && parameters[param.name] != null;
                    }
                    
                    if (!hasParam) {
                        result.valid = false;
                        result.errors.push('Required parameter missing: ' + param.name);
                    }
                }
            });

        } catch (error) {
            result.valid = false;
            result.errors.push('Parameter validation error: ' + error.message);
        }

        return result;
    }

    /**
     * Clear function cache
     */
    function clearCache() {
        compiledFunctionCache = {};
        log.debug({
            title: 'Function cache cleared',
            details: 'All compiled functions removed from cache'
        });
    }

    /**
     * Execute multiple functions for a result set
     * Used when processing SELECT queries with function calls
     *
     * @param {Array} functionCalls - Array of function call objects
     * @param {Array} resultSet - Array of row data
     * @returns {Array} Modified result set with function results
     */
    function executeFunctionsForResultSet(functionCalls, resultSet) {
        if (!functionCalls || functionCalls.length === 0) {
            return resultSet;
        }

        try {
            return resultSet.map(function(row) {
                var modifiedRow = Object.assign({}, row);

                functionCalls.forEach(function(funcCall, index) {
                    var result = executeFunction(funcCall.name, funcCall.parameters, row);

                    if (result.success) {
                        // Handle property access (e.g., function().property)
                        var value = result.result;
                        if (funcCall.propertyAccess && typeof value === 'object' && value !== null) {
                            var properties = funcCall.propertyAccess.substring(1).split('.');
                            for (var i = 0; i < properties.length; i++) {
                                if (value && typeof value === 'object') {
                                    value = value[properties[i]];
                                } else {
                                    value = null;
                                    break;
                                }
                            }
                        }

                        // Look for placeholder column to replace
                        var placeholderKey = 'FUNCTION_PLACEHOLDER_' + index;
                        var placeholderFound = false;

                        // Replace placeholder column with actual result
                        for (var key in modifiedRow) {
                            if (modifiedRow[key] === placeholderKey) {
                                modifiedRow[key] = value;
                                placeholderFound = true;
                                break;
                            }
                        }

                        // If no placeholder found, add as new column (fallback)
                        if (!placeholderFound) {
                            var columnName = funcCall.fullMatch.replace(/\s+/g, '_');
                            modifiedRow[columnName] = value;
                        }
                    } else {
                        // Look for placeholder column to replace with error
                        var placeholderKey = 'FUNCTION_PLACEHOLDER_' + index;
                        var placeholderFound = false;

                        for (var key in modifiedRow) {
                            if (modifiedRow[key] === placeholderKey) {
                                modifiedRow[key] = 'ERROR: ' + result.error;
                                placeholderFound = true;
                                break;
                            }
                        }

                        // If no placeholder found, add error as new column (fallback)
                        if (!placeholderFound) {
                            var columnName = funcCall.fullMatch.replace(/\s+/g, '_');
                            modifiedRow[columnName] = 'ERROR: ' + result.error;
                        }
                    }
                });

                return modifiedRow;
            });

        } catch (error) {
            log.error({
                title: 'Error executing functions for result set',
                details: error.message
            });
            return resultSet;
        }
    }

    /**
     * Execute DML statement within stored procedure
     *
     * @param {string} sql - DML SQL statement
     * @param {string} operation - DML operation type (INSERT, UPDATE, DELETE)
     * @param {Array} outputLog - Output log array
     * @param {boolean} showOutput - Whether to show output
     * @returns {Object} DML execution result
     */
    function executeDMLInProcedure(sql, operation, outputLog, showOutput) {
        try {
            if (showOutput && outputLog) {
                outputLog.push({
                    type: 'info',
                    message: 'Executing ' + operation + ' statement: ' + sql,
                    timestamp: new Date().toISOString()
                });
            }

            // Execute DML using the DML processor
            var result = dmlProcessor.processQuery(sql);

            if (showOutput && outputLog) {
                if (result.success) {
                    outputLog.push({
                        type: 'log',
                        message: operation + ' completed successfully: ' + (result.message || 'Operation completed'),
                        timestamp: new Date().toISOString()
                    });
                } else {
                    outputLog.push({
                        type: 'error',
                        message: operation + ' failed: ' + (result.error || 'Unknown error'),
                        timestamp: new Date().toISOString()
                    });
                }
            }

            return {
                success: result.success,
                result: result.result,
                error: result.error,
                message: result.message,
                recordsAffected: result.result ? (result.result.recordsCreated || result.result.recordsUpdated || result.result.recordsDeleted || 0) : 0
            };

        } catch (error) {
            if (showOutput && outputLog) {
                outputLog.push({
                    type: 'error',
                    message: operation + ' execution error: ' + error.message,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                success: false,
                result: null,
                error: error.message,
                message: null,
                recordsAffected: 0
            };
        }
    }

    /**
     * Execute synthetic function within stored procedure
     *
     * @param {string} functionName - Name of function to execute
     * @param {Array|Object} parameters - Function parameters
     * @param {Array} outputLog - Output log array
     * @param {boolean} showOutput - Whether to show output
     * @returns {*} Function result
     */
    function executeFunctionInProcedure(functionName, parameters, outputLog, showOutput) {
        try {
            if (showOutput && outputLog) {
                outputLog.push({
                    type: 'info',
                    message: 'Calling function: ' + functionName + '(' + JSON.stringify(parameters) + ')',
                    timestamp: new Date().toISOString()
                });
            }

            // Execute function using the execution engine
            var result = executeFunction(functionName, parameters);

            if (showOutput && outputLog) {
                if (result.success) {
                    outputLog.push({
                        type: 'log',
                        message: 'Function ' + functionName + ' returned: ' + JSON.stringify(result.result),
                        timestamp: new Date().toISOString()
                    });
                } else {
                    outputLog.push({
                        type: 'error',
                        message: 'Function ' + functionName + ' failed: ' + result.error,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.result;

        } catch (error) {
            if (showOutput && outputLog) {
                outputLog.push({
                    type: 'error',
                    message: 'Function execution error: ' + error.message,
                    timestamp: new Date().toISOString()
                });
            }
            throw error;
        }
    }

    /**
     * Execute SuiteQL query within stored procedure
     * Supports both regular SuiteQL and queries with synthetic functions
     *
     * @param {string} sql - SuiteQL query
     * @param {Array} params - Query parameters
     * @param {Array} outputLog - Output log array
     * @param {boolean} showOutput - Whether to show output
     * @returns {Object} Query results
     */
    function executeSuiteQLInProcedure(sql, params, outputLog, showOutput) {
        try {
            if (showOutput && outputLog) {
                outputLog.push({
                    type: 'info',
                    message: 'Executing SuiteQL: ' + sql + (params ? ' with params: ' + JSON.stringify(params) : ''),
                    timestamp: new Date().toISOString()
                });
            }

            // Check if query contains synthetic functions
            var analysis = queryParser.analyzeQuery(sql);

            var results;
            var recordCount;

            if (analysis.hasSyntheticFunctions) {
                // Process query with synthetic functions
                if (showOutput && outputLog) {
                    outputLog.push({
                        type: 'info',
                        message: 'Query contains ' + analysis.functions.length + ' synthetic function(s), processing...',
                        timestamp: new Date().toISOString()
                    });
                }

                // Remove function calls from query to get base query
                var baseQuery = syntheticProcessor.removeFunctionCallsFromQuery(sql, analysis.functions);

                // Execute base query
                var queryObj = params ?
                    query.runSuiteQL({ query: baseQuery, params: params }) :
                    query.runSuiteQL({ query: baseQuery });

                var baseResults = queryObj.asMappedResults();

                // Execute functions for each row and add results
                results = executeFunctionsForResultSet(analysis.functions, baseResults);
                recordCount = results.length;

                if (showOutput && outputLog) {
                    outputLog.push({
                        type: 'log',
                        message: 'Synthetic functions processed for ' + recordCount + ' record(s)',
                        timestamp: new Date().toISOString()
                    });
                }

            } else {
                // Execute regular SuiteQL query
                var queryObj = params ?
                    query.runSuiteQL({ query: sql, params: params }) :
                    query.runSuiteQL({ query: sql });

                results = queryObj.asMappedResults();
                recordCount = results.length;
            }

            if (showOutput && outputLog) {
                outputLog.push({
                    type: 'log',
                    message: 'SuiteQL returned ' + recordCount + ' record(s)',
                    timestamp: new Date().toISOString()
                });
            }

            return {
                success: true,
                records: results,
                recordCount: recordCount,
                hasSyntheticFunctions: analysis.hasSyntheticFunctions,
                functionsExecuted: analysis.hasSyntheticFunctions ? analysis.functions.length : 0
            };

        } catch (error) {
            if (showOutput && outputLog) {
                outputLog.push({
                    type: 'error',
                    message: 'SuiteQL execution error: ' + error.message,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                success: false,
                records: [],
                recordCount: 0,
                error: error.message,
                hasSyntheticFunctions: false,
                functionsExecuted: 0
            };
        }
    }

    // Public API
    return {
        executeFunction: executeFunction,
        executeProcedure: executeProcedure,
        executeFunctionsForResultSet: executeFunctionsForResultSet,
        validateParameters: validateParameters,
        clearCache: clearCache
    };
});