/**
 * @fileoverview Synthetic Functions and Stored Procedures System
 * 
 * This module provides functionality to create and execute custom JavaScript-based
 * functions and stored procedures that can be called from SuiteQL queries.
 * 
 * Functions can be called inline in SELECT statements:
 *   SELECT parse_full_address(address).city FROM customers
 * 
 * Stored procedures can be executed standalone:
 *   CALL apply_discount(transaction_type='salesorder', threshold_amount=1000)
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define(['N/query', 'N/file', 'N/log', '../core/constants'], function(query, file, log, constants) {
    'use strict';

    // Cache for compiled functions to improve performance
    var functionCache = {};
    var procedureCache = {};
    var registryCache = null;
    var registryCacheExpiry = null;
    var CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Function registry structure
     * @typedef {Object} FunctionRegistry
     * @property {Object} functions - Map of function name to metadata
     * @property {Object} procedures - Map of procedure name to metadata
     * @property {number} lastUpdated - Timestamp of last registry update
     */

    /**
     * Function metadata structure
     * @typedef {Object} FunctionMetadata
     * @property {string} name - Function name
     * @property {string} fileId - NetSuite file ID
     * @property {string} filePath - File path in cabinet
     * @property {Array} parameters - Expected parameters
     * @property {string} returnType - Expected return type
     * @property {string} description - Function description
     * @property {Date} lastModified - File last modified date
     */

    /**
     * Build registry of available functions and stored procedures
     * Scans the functions and storedProcedures directories in file cabinet
     * 
     * @returns {FunctionRegistry} Registry of available functions and procedures
     */
    function buildFunctionRegistry() {
        try {
            // Check cache first
            if (registryCache && registryCacheExpiry && Date.now() < registryCacheExpiry) {
                return registryCache;
            }

            var registry = {
                functions: {},
                procedures: {},
                lastUpdated: Date.now()
            };

            // Scan functions directory
            var functionsPath = 'SuiteScripts/EnhancedSuiteQLTool/lib/features/functions';
            var functionsFolder = findFolderByPath(functionsPath);
            if (functionsFolder) {
                var functionFiles = scanDirectoryForJSFiles(functionsFolder.id);
                functionFiles.forEach(function(fileInfo) {
                    var metadata = extractFunctionMetadata(fileInfo, 'function');
                    if (metadata) {
                        registry.functions[metadata.name] = metadata;
                    }
                });
            }

            // Scan stored procedures directory
            var proceduresPath = 'SuiteScripts/EnhancedSuiteQLTool/lib/features/storedProcedures';
            var proceduresFolder = findFolderByPath(proceduresPath);
            if (proceduresFolder) {
                var procedureFiles = scanDirectoryForJSFiles(proceduresFolder.id);
                procedureFiles.forEach(function(fileInfo) {
                    var metadata = extractFunctionMetadata(fileInfo, 'procedure');
                    if (metadata) {
                        registry.procedures[metadata.name] = metadata;
                    }
                });
            }

            // Cache the registry
            registryCache = registry;
            registryCacheExpiry = Date.now() + CACHE_DURATION;

            log.debug({
                title: 'Function Registry Built',
                details: 'Functions: ' + Object.keys(registry.functions).length + 
                        ', Procedures: ' + Object.keys(registry.procedures).length
            });

            return registry;

        } catch (error) {
            log.error({
                title: 'Error building function registry',
                details: error.message
            });
            return { functions: {}, procedures: {}, lastUpdated: Date.now() };
        }
    }

    /**
     * Find folder by path in file cabinet
     * 
     * @param {string} folderPath - Path to folder
     * @returns {Object|null} Folder object or null if not found
     */
    function findFolderByPath(folderPath) {
        try {
            var pathParts = folderPath.split('/');
            var currentFolderId = null;

            // Start from root and traverse path
            for (var i = 0; i < pathParts.length; i++) {
                var folderName = pathParts[i];
                if (!folderName) continue;

                var folderQuery = query.create({
                    type: query.Type.FOLDER
                });
                
                folderQuery.columns = [
                    folderQuery.createColumn({ fieldId: 'id' }),
                    folderQuery.createColumn({ fieldId: 'name' })
                ];

                folderQuery.condition = folderQuery.createCondition({
                    fieldId: 'name',
                    operator: query.Operator.IS,
                    values: folderName
                });

                if (currentFolderId) {
                    folderQuery.condition = folderQuery.and([
                        folderQuery.condition,
                        folderQuery.createCondition({
                            fieldId: 'parent',
                            operator: query.Operator.IS,
                            values: currentFolderId
                        })
                    ]);
                }

                var results = folderQuery.run().asMappedResults();
                if (results.length === 0) {
                    return null;
                }

                currentFolderId = results[0].id;
            }

            return { id: currentFolderId };

        } catch (error) {
            log.error({
                title: 'Error finding folder',
                details: 'Path: ' + folderPath + ', Error: ' + error.message
            });
            return null;
        }
    }

    /**
     * Scan directory for JavaScript files
     * 
     * @param {string} folderId - Folder ID to scan
     * @returns {Array} Array of file information objects
     */
    function scanDirectoryForJSFiles(folderId) {
        try {
            var fileQuery = query.create({
                type: query.Type.FILE
            });

            fileQuery.columns = [
                fileQuery.createColumn({ fieldId: 'id' }),
                fileQuery.createColumn({ fieldId: 'name' }),
                fileQuery.createColumn({ fieldId: 'folder' }),
                fileQuery.createColumn({ fieldId: 'modified' })
            ];

            fileQuery.condition = fileQuery.and([
                fileQuery.createCondition({
                    fieldId: 'folder',
                    operator: query.Operator.IS,
                    values: folderId
                }),
                fileQuery.createCondition({
                    fieldId: 'name',
                    operator: query.Operator.ENDSWITH,
                    values: '.js'
                })
            ]);

            return fileQuery.run().asMappedResults();

        } catch (error) {
            log.error({
                title: 'Error scanning directory',
                details: 'Folder ID: ' + folderId + ', Error: ' + error.message
            });
            return [];
        }
    }

    /**
     * Extract function metadata from file
     * 
     * @param {Object} fileInfo - File information from query
     * @param {string} type - 'function' or 'procedure'
     * @returns {FunctionMetadata|null} Function metadata or null if invalid
     */
    function extractFunctionMetadata(fileInfo, type) {
        try {
            var fileName = fileInfo.name;
            var functionName = fileName.replace('.js', '');

            // Load file content to extract metadata
            var fileObj = file.load({ id: fileInfo.id });
            var content = fileObj.getContents();

            // Extract parameters and description from function signature
            var metadata = {
                name: functionName,
                fileId: fileInfo.id,
                filePath: fileInfo.folder + '/' + fileName,
                parameters: extractParametersFromContent(content),
                returnType: type === 'function' ? 'any' : 'object',
                description: extractDescriptionFromContent(content),
                lastModified: new Date(fileInfo.modified),
                type: type
            };

            return metadata;

        } catch (error) {
            log.error({
                title: 'Error extracting function metadata',
                details: 'File: ' + fileInfo.name + ', Error: ' + error.message
            });
            return null;
        }
    }

    /**
     * Extract parameter information from function content
     * 
     * @param {string} content - JavaScript file content
     * @returns {Array} Array of parameter information
     */
    function extractParametersFromContent(content) {
        try {
            // Look for function signature pattern
            var functionMatch = content.match(/function\s+\w+\s*\(\s*context\s*\)/);
            if (!functionMatch) {
                return [];
            }

            // Look for parameter usage in context.params
            var paramMatches = content.match(/context\.params\.(\w+)/g) || [];
            var parameters = [];
            var seen = {};

            paramMatches.forEach(function(match) {
                var paramName = match.replace('context.params.', '');
                if (!seen[paramName]) {
                    parameters.push({
                        name: paramName,
                        type: 'any',
                        required: true
                    });
                    seen[paramName] = true;
                }
            });

            return parameters;

        } catch (error) {
            log.error({
                title: 'Error extracting parameters',
                details: error.message
            });
            return [];
        }
    }

    /**
     * Extract description from function content
     * 
     * @param {string} content - JavaScript file content
     * @returns {string} Function description
     */
    function extractDescriptionFromContent(content) {
        try {
            // Look for comment block at top of function
            var commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
            if (commentMatch) {
                return commentMatch[1]
                    .replace(/\s*\*\s?/g, ' ')
                    .trim()
                    .substring(0, 200);
            }

            // Look for single line comment
            var lineCommentMatch = content.match(/\/\/\s*(.+)/);
            if (lineCommentMatch) {
                return lineCommentMatch[1].trim();
            }

            return 'No description available';

        } catch (error) {
            return 'Error reading description';
        }
    }

    // Public API
    return {
        buildFunctionRegistry: buildFunctionRegistry,
        findFolderByPath: findFolderByPath,
        scanDirectoryForJSFiles: scanDirectoryForJSFiles,
        extractFunctionMetadata: extractFunctionMetadata
    };
});
