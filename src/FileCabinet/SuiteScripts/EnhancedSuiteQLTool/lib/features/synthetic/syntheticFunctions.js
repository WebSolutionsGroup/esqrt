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

define(['N/query', 'N/file', 'N/log'], function(query, file, log) {
    'use strict';

    // Cache for compiled functions to improve performance
    var functionCache = {};
    var procedureCache = {};
    var registryCache = null;
    var registryCacheExpiry = null;
    var CACHE_DURATION = 10 * 1000; // 10 seconds for debugging

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
            log.debug({
                title: 'buildFunctionRegistry called',
                details: 'Cache exists: ' + (registryCache ? 'Yes' : 'No') + ', Cache expired: ' + (registryCacheExpiry && Date.now() >= registryCacheExpiry ? 'Yes' : 'No')
            });

            // Check cache first
            if (registryCache && registryCacheExpiry && Date.now() < registryCacheExpiry) {
                log.debug({
                    title: 'Returning cached registry',
                    details: 'Functions: ' + Object.keys(registryCache.functions).length + ', Procedures: ' + Object.keys(registryCache.procedures).length
                });
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

            log.debug({
                title: 'Functions folder lookup',
                details: 'Path: ' + functionsPath + ', Found: ' + (functionsFolder ? 'Yes (ID: ' + functionsFolder.id + ')' : 'No')
            });

            if (functionsFolder) {
                var functionFiles = scanDirectoryForJSFiles(functionsFolder.id);

                log.debug({
                    title: 'Function files found',
                    details: 'Count: ' + functionFiles.length + ', Files: ' + JSON.stringify(functionFiles.map(function(f) { return f.name; }))
                });

                functionFiles.forEach(function(fileInfo) {
                    log.debug({
                        title: 'Processing function file',
                        details: 'File: ' + fileInfo.name + ', ID: ' + fileInfo.id
                    });

                    var metadata = extractFunctionMetadata(fileInfo, 'function');

                    log.debug({
                        title: 'Function metadata extracted',
                        details: 'File: ' + fileInfo.name + ', Metadata: ' + (metadata ? JSON.stringify(metadata) : 'null')
                    });

                    if (metadata) {
                        registry.functions[metadata.name] = metadata;
                    }
                });
            }

            // Scan stored procedures directory
            var proceduresPath = 'SuiteScripts/EnhancedSuiteQLTool/lib/features/storedProcedures';

            log.debug({
                title: 'Procedures folder lookup',
                details: 'Path: ' + proceduresPath
            });

            try {
                var proceduresFolder = findFolderByPath(proceduresPath);

                log.debug({
                    title: 'Procedures folder result',
                    details: 'Found: ' + (proceduresFolder ? 'Yes (ID: ' + proceduresFolder.id + ')' : 'No')
                });

                if (proceduresFolder) {
                    var procedureFiles = scanDirectoryForJSFiles(proceduresFolder.id);

                    log.debug({
                        title: 'Procedure files found',
                        details: 'Count: ' + procedureFiles.length + ', Files: ' + JSON.stringify(procedureFiles.map(function(f) { return f.name; }))
                    });

                    procedureFiles.forEach(function(fileInfo) {
                        log.debug({
                            title: 'Processing procedure file',
                            details: 'File: ' + fileInfo.name + ', ID: ' + fileInfo.id
                        });

                        var metadata = extractFunctionMetadata(fileInfo, 'procedure');

                        log.debug({
                            title: 'Procedure metadata extracted',
                            details: 'File: ' + fileInfo.name + ', Metadata: ' + (metadata ? JSON.stringify(metadata) : 'null')
                        });

                        if (metadata) {
                            registry.procedures[metadata.name] = metadata;
                        }
                    });
                }
            } catch (e) {
                log.error({
                    title: 'Error scanning procedures folder',
                    details: 'Path: ' + proceduresPath + ', Error: ' + e.message
                });
                // Continue without procedures - don't let this break the whole registry
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
            // Use SuiteQL to find folder by path - need to traverse the path
            var pathParts = folderPath.split('/');
            var currentFolderId = null;

            // Start from root and traverse path
            for (var i = 0; i < pathParts.length; i++) {
                var folderName = pathParts[i];
                if (!folderName) continue;

                var sql = currentFolderId ?
                    "SELECT id FROM mediaitemfolder WHERE name = ? AND parent = ?" :
                    "SELECT id FROM mediaitemfolder WHERE name = ? AND parent IS NULL";

                var params = currentFolderId ? [folderName, currentFolderId] : [folderName];

                var results = query.runSuiteQL({
                    query: sql,
                    params: params
                }).asMappedResults();

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
            // Use SuiteQL to find JavaScript files in the folder
            var sql = "SELECT id, name, folder, lastModifiedDate FROM file WHERE folder = ? AND name LIKE '%.js'";
            var results = query.runSuiteQL({
                query: sql,
                params: [folderId]
            }).asMappedResults();

            return results;

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
                lastModified: new Date(fileInfo.lastModifiedDate),
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

    /**
     * Clear registry cache to force rebuild on next access
     */
    function clearRegistryCache() {
        registryCache = null;
        registryCacheExpiry = null;
        log.debug({
            title: 'Function registry cache cleared',
            details: 'Registry will be rebuilt on next access'
        });
    }

    // Public API
    return {
        buildFunctionRegistry: buildFunctionRegistry,
        findFolderByPath: findFolderByPath,
        scanDirectoryForJSFiles: scanDirectoryForJSFiles,
        extractFunctionMetadata: extractFunctionMetadata,
        clearRegistryCache: clearRegistryCache
    };
});
