/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - File Operations
 * 
 * This module handles all file cabinet operations including
 * loading, saving, and checking existence of SQL files.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../core/constants',
    '../core/modules'
], function(constants, nsModules) {
    
    /**
     * Get list of SQL files from the local library
     * 
     * @param {Object} context - The request context
     * @returns {void} - Writes response to context
     */
    function localLibraryFilesGet(context) {
        var responsePayload;
        
        try {
            var sql = `
                SELECT
                    ID,
                    Name,
                    Description
                FROM
                    File
                WHERE 
                    ( Folder = ? )
                ORDER BY 
                    Name
            `;
            
            var queryResults = nsModules.queryUtils.runSuiteQL({ 
                query: sql, 
                params: [constants.CONFIG.QUERY_FOLDER_ID] 
            });
            
            var records = queryResults.asMappedResults();
            
            if (records.length > 0) {
                responsePayload = { 'records': records };
            } else {
                responsePayload = { 'error': constants.ERROR_MESSAGES.NO_SQL_FILES };
            }
            
        } catch(e) {
            nsModules.logger.error('localLibraryFilesGet Error', e);
            responsePayload = { 'error': e };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 5));
    }
    
    /**
     * Check if a SQL file exists
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload containing filename
     * @returns {void} - Writes response to context
     */
    function sqlFileExists(context, requestPayload) {
        var responsePayload;
        
        try {
            var sql = `
                SELECT
                    ID
                FROM
                    File
                WHERE 
                    ( Folder = ? ) AND ( Name = ? )
            `;
            
            var queryResults = nsModules.queryUtils.runSuiteQL({ 
                query: sql, 
                params: [constants.CONFIG.QUERY_FOLDER_ID, requestPayload.filename] 
            });
            
            var records = queryResults.asMappedResults();
            
            if (records.length > 0) {
                responsePayload = { 'exists': true };
            } else {
                responsePayload = { 'exists': false };
            }
            
        } catch(e) {
            nsModules.logger.error('sqlFileExists Error', e);
            responsePayload = { 'error': e };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 5));
    }
    
    /**
     * Load a SQL file from the file cabinet
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload containing fileID
     * @returns {void} - Writes response to context
     */
    function sqlFileLoad(context, requestPayload) {
        var responsePayload;
        
        try {
            var fileObj = nsModules.fileUtils.load(requestPayload.fileID);
            
            responsePayload = {
                file: fileObj,
                sql: fileObj.getContents()
            };
            
        } catch(e) {
            nsModules.logger.error('sqlFileLoad Error', e);
            responsePayload = { 'error': e };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 5));
    }
    
    /**
     * Save a SQL file to the file cabinet
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload containing file details
     * @returns {void} - Writes response to context
     */
    function sqlFileSave(context, requestPayload) {
        var responsePayload;
        
        try {
            var fileObj = nsModules.fileUtils.create({
                name: requestPayload.filename,
                contents: requestPayload.contents,
                description: requestPayload.description,
                fileType: nsModules.fileUtils.getTypes().PLAINTEXT,
                folder: constants.CONFIG.QUERY_FOLDER_ID,
                isOnline: false
            });
            
            var fileID = fileObj.save();
            
            responsePayload = {
                fileID: fileID
            };
            
        } catch(e) {
            nsModules.logger.error('sqlFileSave Error', e);
            responsePayload = { 'error': e };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 5));
    }
    
    /**
     * Load a workbook query
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload containing scriptID
     * @returns {void} - Writes response to context
     */
    function workbookLoad(context, requestPayload) {
        var responsePayload;
        
        try {
            var loadedQuery = nsModules.queryUtils.load({ id: requestPayload.scriptID });
            
            responsePayload = {
                sql: loadedQuery.toSuiteQL().query
            };
            
        } catch(e) {
            nsModules.logger.error('workbookLoad Error', e);
            responsePayload = { 'error': e };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 5));
    }
    
    /**
     * Get list of available workbooks
     * 
     * @param {Object} context - The request context
     * @returns {void} - Writes response to context
     */
    function workbooksGet(context) {
        var responsePayload;
        
        try {
            var sql = `
                SELECT
                    ScriptID,
                    Name,
                    Description,
                    BUILTIN.DF( Owner ) AS Owner
                FROM
                    UsrSavedSearch
                ORDER BY
                    Name
            `;
            
            var queryResults = nsModules.queryUtils.runSuiteQL({ 
                query: sql, 
                params: [] 
            });
            
            var records = queryResults.asMappedResults();
            
            if (records.length > 0) {
                responsePayload = { 'records': records };
            } else {
                responsePayload = { 'error': constants.ERROR_MESSAGES.NO_WORKBOOKS };
            }
            
        } catch(e) {
            nsModules.logger.error('workbooksGet Error', e);
            responsePayload = { 'error': e };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 5));
    }
    
    /**
     * Validate file name
     * 
     * @param {string} filename - The filename to validate
     * @returns {Object} - Validation result
     */
    function validateFileName(filename) {
        if (!filename || filename.trim() === '') {
            return {
                isValid: false,
                message: 'Filename cannot be empty'
            };
        }
        
        // Check for invalid characters
        var invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(filename)) {
            return {
                isValid: false,
                message: 'Filename contains invalid characters'
            };
        }
        
        // Check length
        if (filename.length > 100) {
            return {
                isValid: false,
                message: 'Filename is too long (max 100 characters)'
            };
        }
        
        return {
            isValid: true,
            message: 'Filename is valid'
        };
    }
    
    /**
     * Get file extension
     * 
     * @param {string} filename - The filename
     * @returns {string} - The file extension
     */
    function getFileExtension(filename) {
        if (!filename) return '';
        var lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
    }
    
    /**
     * Ensure SQL file extension
     * 
     * @param {string} filename - The filename
     * @returns {string} - The filename with .sql extension
     */
    function ensureSqlExtension(filename) {
        if (!filename) return '';
        var extension = getFileExtension(filename);
        if (extension !== 'sql') {
            return filename + '.sql';
        }
        return filename;
    }
    
    /**
     * Export the file operations functions
     */
    return {
        localLibraryFilesGet: localLibraryFilesGet,
        sqlFileExists: sqlFileExists,
        sqlFileLoad: sqlFileLoad,
        sqlFileSave: sqlFileSave,
        workbookLoad: workbookLoad,
        workbooksGet: workbooksGet,
        validateFileName: validateFileName,
        getFileExtension: getFileExtension,
        ensureSqlExtension: ensureSqlExtension
    };
    
});
