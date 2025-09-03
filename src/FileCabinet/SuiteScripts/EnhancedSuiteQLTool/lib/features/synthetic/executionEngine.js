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
    './syntheticFunctions'
], function(file, log, record, query, search, format, runtime, syntheticFunctions) {
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
            
            if (!procedureMeta) {
                return {
                    success: false,
                    result: null,
                    error: 'Procedure not found: ' + procedureName,
                    executionTime: Date.now() - startTime
                };
            }

            // Load and compile procedure
            var compiledProcedure = getCompiledFunction(procedureMeta);
            if (!compiledProcedure) {
                return {
                    success: false,
                    result: null,
                    error: 'Failed to compile procedure: ' + procedureName,
                    executionTime: Date.now() - startTime
                };
            }

            // Create execution context
            var context = createExecutionContext(parameters, procedureMeta.parameters);
            
            // Execute procedure
            var result = compiledProcedure(context);
            
            return {
                success: true,
                result: result,
                error: null,
                executionTime: Date.now() - startTime
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
                executionTime: Date.now() - startTime
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
            // Create a safe execution environment
            var functionCode = '(function() {\n' +
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
                content + '\n' +
                'return ' + functionName + ';\n' +
                '})()';

            // Compile the function
            var compiledWrapper = new Function('modules', functionCode);
            
            return function(context) {
                // Provide NetSuite modules to the function
                var modules = {
                    record: record,
                    query: query,
                    search: search,
                    log: log,
                    format: format,
                    runtime: runtime,
                    file: file
                };
                
                // Get the actual function
                var actualFunction = compiledWrapper(modules);
                
                // Execute with context
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
                context.params[expectedParams[i].name] = parameters[i];
            }
        } else if (typeof parameters === 'object' && parameters !== null) {
            // Named parameters
            context.params = parameters;
        }

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

                functionCalls.forEach(function(funcCall) {
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

                        // Add result to row with function call as column name
                        var columnName = funcCall.fullMatch.replace(/\s+/g, '_');
                        modifiedRow[columnName] = value;
                    } else {
                        // Add error indicator
                        var columnName = funcCall.fullMatch.replace(/\s+/g, '_');
                        modifiedRow[columnName] = 'ERROR: ' + result.error;
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

    // Public API
    return {
        executeFunction: executeFunction,
        executeProcedure: executeProcedure,
        executeFunctionsForResultSet: executeFunctionsForResultSet,
        validateParameters: validateParameters,
        clearCache: clearCache
    };
});
