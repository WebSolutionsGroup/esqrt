/**
 * @fileoverview CREATE OR REPLACE Statement Handler
 * 
 * This module handles CREATE OR REPLACE FUNCTION and CREATE OR REPLACE PROCEDURE
 * statements that allow users to create JavaScript functions and stored procedures
 * directly from the query window.
 * 
 * Syntax:
 * CREATE OR REPLACE FUNCTION function_name AS
 * function function_name(context) { ... }
 * 
 * CREATE OR REPLACE PROCEDURE procedure_name AS  
 * function procedure_name(context) { ... }
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define(['N/file', 'N/log', 'N/query', './syntheticFunctions'], function(file, log, query, syntheticFunctions) {
    'use strict';

    /**
     * Create statement result structure
     * @typedef {Object} CreateResult
     * @property {boolean} success - Whether creation was successful
     * @property {string} message - Success or error message
     * @property {string} fileName - Created file name
     * @property {string} fileId - Created file ID
     * @property {string} type - 'function' or 'procedure'
     */

    /**
     * Parse and execute CREATE OR REPLACE statements
     * 
     * @param {string} statement - CREATE OR REPLACE statement
     * @returns {CreateResult} Creation result
     */
    function processCreateStatement(statement) {
        try {
            // Detect statement type
            var analysis = analyzeCreateStatement(statement);
            
            if (!analysis.isCreateStatement) {
                return {
                    success: false,
                    message: 'Not a CREATE OR REPLACE statement',
                    fileName: null,
                    fileId: null,
                    type: null
                };
            }

            // Extract function/procedure details
            var details = extractCreateDetails(statement, analysis.type);
            
            if (!details.success) {
                return {
                    success: false,
                    message: details.error,
                    fileName: null,
                    fileId: null,
                    type: analysis.type
                };
            }

            // Create the file
            var result = createFunctionFile(details.name, details.content, analysis.type);
            
            return result;

        } catch (error) {
            log.error({
                title: 'Error processing CREATE statement',
                details: error.message
            });
            
            return {
                success: false,
                message: 'Error processing CREATE statement: ' + error.message,
                fileName: null,
                fileId: null,
                type: null
            };
        }
    }

    /**
     * Analyze statement to determine if it's a CREATE OR REPLACE statement
     * 
     * @param {string} statement - Statement to analyze
     * @returns {Object} Analysis result
     */
    function analyzeCreateStatement(statement) {
        var trimmed = statement.trim().toUpperCase();
        
        var isFunctionCreate = trimmed.match(/^CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(\w+)\s+AS/i);
        var isProcedureCreate = trimmed.match(/^CREATE\s+OR\s+REPLACE\s+PROCEDURE\s+(\w+)\s+AS/i);
        
        return {
            isCreateStatement: !!(isFunctionCreate || isProcedureCreate),
            type: isFunctionCreate ? 'function' : (isProcedureCreate ? 'procedure' : null),
            name: isFunctionCreate ? isFunctionCreate[1] : (isProcedureCreate ? isProcedureCreate[1] : null)
        };
    }

    /**
     * Extract function/procedure name and content from CREATE statement
     * 
     * @param {string} statement - CREATE statement
     * @param {string} type - 'function' or 'procedure'
     * @returns {Object} Extraction result
     */
    function extractCreateDetails(statement, type) {
        try {
            var keyword = type === 'function' ? 'FUNCTION' : 'PROCEDURE';
            var pattern = new RegExp('CREATE\\s+OR\\s+REPLACE\\s+' + keyword + '\\s+(\\w+)\\s+AS\\s+([\\s\\S]+)', 'i');
            var match = statement.match(pattern);
            
            if (!match) {
                return {
                    success: false,
                    error: 'Invalid CREATE OR REPLACE ' + keyword + ' syntax'
                };
            }

            var name = match[1].toLowerCase();
            var content = match[2].trim();
            
            // Validate function name
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                return {
                    success: false,
                    error: 'Invalid ' + type + ' name. Must be a valid JavaScript identifier.'
                };
            }

            // Validate that content starts with function declaration
            var functionPattern = new RegExp('function\\s+' + name + '\\s*\\(', 'i');
            if (!functionPattern.test(content)) {
                return {
                    success: false,
                    error: 'Content must start with function ' + name + '(context) declaration'
                };
            }

            return {
                success: true,
                name: name,
                content: content
            };

        } catch (error) {
            return {
                success: false,
                error: 'Error parsing CREATE statement: ' + error.message
            };
        }
    }

    /**
     * Create function/procedure file in NetSuite file cabinet
     * 
     * @param {string} name - Function/procedure name
     * @param {string} content - JavaScript content
     * @param {string} type - 'function' or 'procedure'
     * @returns {CreateResult} Creation result
     */
    function createFunctionFile(name, content, type) {
        try {
            // Determine target folder
            var folderPath = type === 'function' ?
                'SuiteScripts/EnhancedSuiteQLTool/lib/features/functions' :
                'SuiteScripts/EnhancedSuiteQLTool/lib/features/storedProcedures';
            
            var folderId = findOrCreateFolder(folderPath);

            log.debug({
                title: 'Folder lookup result',
                details: 'Path: ' + folderPath + ', Folder ID: ' + folderId + ', Type: ' + typeof folderId
            });

            if (!folderId) {
                return {
                    success: false,
                    message: 'Could not find or create target folder: ' + folderPath,
                    fileName: null,
                    fileId: null,
                    type: type
                };
            }

            var fileName = name + '.js';
            
            // Check if file already exists
            var existingFileId = findExistingFile(folderId, fileName);
            
            var fileObj;
            if (existingFileId) {
                // Update existing file
                fileObj = file.load({ id: existingFileId });
                fileObj.contents = content;
                var fileId = fileObj.save();
                
                log.audit({
                    title: 'Updated ' + type,
                    details: 'Updated ' + type + ': ' + name + ' (File ID: ' + fileId + ')'
                });

                // Clear registry cache so new/updated function is immediately available
                syntheticFunctions.clearRegistryCache();

                return {
                    success: true,
                    message: 'Successfully updated ' + type + ' "' + name + '"',
                    fileName: fileName,
                    fileId: fileId,
                    type: type
                };
            } else {
                // Create new file
                fileObj = file.create({
                    name: fileName,
                    fileType: file.Type.JAVASCRIPT,
                    contents: content,
                    folder: folderId
                });
                
                var fileId = fileObj.save();
                
                log.audit({
                    title: 'Created ' + type,
                    details: 'Created ' + type + ': ' + name + ' (File ID: ' + fileId + ')'
                });

                // Clear registry cache so new function is immediately available
                syntheticFunctions.clearRegistryCache();

                return {
                    success: true,
                    message: 'Successfully created ' + type + ' "' + name + '"',
                    fileName: fileName,
                    fileId: fileId,
                    type: type
                };
            }

        } catch (error) {
            log.error({
                title: 'Error creating ' + type + ' file',
                details: 'Name: ' + name + ', Error: ' + error.message
            });
            
            return {
                success: false,
                message: 'Error creating ' + type + ' file: ' + error.message,
                fileName: null,
                fileId: null,
                type: type
            };
        }
    }

    /**
     * Find or create folder by path
     * 
     * @param {string} folderPath - Folder path
     * @returns {string|null} Folder ID or null if failed
     */
    function findOrCreateFolder(folderPath) {
        try {
            log.debug({
                title: 'Finding/creating folder',
                details: 'Path: ' + folderPath
            });

            var pathParts = folderPath.split('/');
            var currentFolderId = null;

            // Start from root and traverse/create path
            for (var i = 0; i < pathParts.length; i++) {
                var folderName = pathParts[i];
                if (!folderName) continue;

                log.debug({
                    title: 'Processing folder part',
                    details: 'Folder: ' + folderName + ', Current parent ID: ' + currentFolderId
                });

                // Search for existing folder using SuiteQL (more reliable)
                var sql = currentFolderId ?
                    "SELECT id FROM mediaitemfolder WHERE name = ? AND parent = ?" :
                    "SELECT id FROM mediaitemfolder WHERE name = ? AND parent IS NULL";

                var params = currentFolderId ? [folderName, currentFolderId] : [folderName];

                var results = query.runSuiteQL({
                    query: sql,
                    params: params
                }).asMappedResults();

                if (results.length > 0) {
                    currentFolderId = results[0].id;
                    log.debug({
                        title: 'Found existing folder',
                        details: 'Folder: ' + folderName + ', ID: ' + currentFolderId
                    });
                } else {
                    // Create folder if it doesn't exist
                    log.debug({
                        title: 'Creating new folder',
                        details: 'Folder: ' + folderName + ', Parent ID: ' + currentFolderId
                    });

                    var folderObj = file.create({
                        name: folderName,
                        fileType: file.Type.FOLDER,
                        folder: currentFolderId
                    });
                    currentFolderId = folderObj.save();

                    log.debug({
                        title: 'Created folder',
                        details: 'Folder: ' + folderName + ', New ID: ' + currentFolderId
                    });
                }
            }

            log.debug({
                title: 'Folder creation complete',
                details: 'Final folder ID: ' + currentFolderId
            });

            return currentFolderId;

        } catch (error) {
            log.error({
                title: 'Error finding/creating folder',
                details: 'Path: ' + folderPath + ', Error: ' + error.message + ', Stack: ' + (error.stack || 'No stack trace')
            });
            return null;
        }
    }

    /**
     * Find existing file in folder
     * 
     * @param {string} folderId - Folder ID
     * @param {string} fileName - File name
     * @returns {string|null} File ID or null if not found
     */
    function findExistingFile(folderId, fileName) {
        try {
            var fileQuery = query.create({
                type: query.Type.FILE
            });

            fileQuery.columns = [
                fileQuery.createColumn({ fieldId: 'id' })
            ];

            fileQuery.condition = fileQuery.and([
                fileQuery.createCondition({
                    fieldId: 'folder',
                    operator: query.Operator.IS,
                    values: folderId
                }),
                fileQuery.createCondition({
                    fieldId: 'name',
                    operator: query.Operator.IS,
                    values: fileName
                })
            ]);

            var results = fileQuery.run().asMappedResults();
            return results.length > 0 ? results[0].id : null;

        } catch (error) {
            log.error({
                title: 'Error finding existing file',
                details: 'File: ' + fileName + ', Error: ' + error.message
            });
            return null;
        }
    }

    // Public API
    return {
        processCreateStatement: processCreateStatement,
        analyzeCreateStatement: analyzeCreateStatement
    };
});
