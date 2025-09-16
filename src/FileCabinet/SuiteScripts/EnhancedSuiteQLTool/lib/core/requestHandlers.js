/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Request Handlers
 * 
 * This module handles HTTP request routing for both GET and POST
 * requests, directing them to the appropriate handler functions.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    './constants',
    './modules',
    '../data/queryEngine',
    '../data/fileOperations',
    '../data/documentGeneration',
    '../data/customRecordOperations'
], function(constants, nsModules, queryEngine, fileOps, docGen, customRecordOps) {
    
    /**
     * Handle GET requests
     * 
     * @param {Object} context - The request context
     * @param {Function} htmlGenerateTool - Function to generate the main tool HTML

     * @returns {void}
     */
    function handleGetRequest(context, htmlGenerateTool) {
        if (context.request.parameters.hasOwnProperty('function')) {
            

            
            if (context.request.parameters['function'] == constants.REQUEST_FUNCTIONS.DOCUMENT_GENERATE) {
                docGen.documentGenerate(context);
            }
            
        } else {
            // Generate the main tool interface
            var form = nsModules.widgetUtils.createForm({ 
                title: 'ENHANCED SUITEQL QUERY TOOL', 
                hideNavBar: false 
            });
            
            var htmlField = form.addField({
                id: 'custpage_field_html',
                type: nsModules.widgetUtils.getFieldTypes().INLINEHTML,
                label: 'HTML'
            });
            
            htmlField.defaultValue = htmlGenerateTool();
            
            context.response.writePage(form);
        }
    }
    
    /**
     * Handle POST requests
     * 
     * @param {Object} context - The request context
     * @returns {void}
     */
    function handlePostRequest(context) {
        var requestPayload;
        try {
            requestPayload = JSON.parse(context.request.body);
        } catch (e) {
            log.error('JSON Parse Error', {
                error: e.message,
                body: context.request.body,
                bodyType: typeof context.request.body,
                bodyLength: context.request.body ? context.request.body.length : 'null'
            });
            context.response.setHeader('Content-Type', 'application/json');
            context.response.write(JSON.stringify({
                error: {
                    name: 'JSONParseError',
                    message: 'Invalid JSON in request body: ' + e.message,
                    receivedBody: context.request.body ? context.request.body.substring(0, 100) : 'null'
                }
            }));
            return;
        }

        context.response.setHeader('Content-Type', 'application/json');
        
        switch (requestPayload['function']) {
            
            case constants.REQUEST_FUNCTIONS.DOCUMENT_SUBMIT:
                return docGen.documentSubmit(context, requestPayload);
                
            case constants.REQUEST_FUNCTIONS.QUERY_EXECUTE:
                return queryEngine.queryExecute(context, requestPayload);
                
            case constants.REQUEST_FUNCTIONS.SQL_FILE_EXISTS:
                return fileOps.sqlFileExists(context, requestPayload);
                
            case constants.REQUEST_FUNCTIONS.SQL_FILE_LOAD:
                return fileOps.sqlFileLoad(context, requestPayload);
                
            case constants.REQUEST_FUNCTIONS.SQL_FILE_SAVE:
                return fileOps.sqlFileSave(context, requestPayload);
                
            case constants.REQUEST_FUNCTIONS.LOCAL_LIBRARY_FILES_GET:
                return fileOps.localLibraryFilesGet(context);
                
            case constants.REQUEST_FUNCTIONS.WORKBOOK_LOAD:
                return fileOps.workbookLoad(context, requestPayload);
                
            case constants.REQUEST_FUNCTIONS.WORKBOOKS_GET:
                return fileOps.workbooksGet(context);

            case constants.REQUEST_FUNCTIONS.SAVED_QUERY_SAVE:
                return customRecordOps.savedQuerySave(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.SAVED_QUERY_UPDATE:
                return customRecordOps.savedQueryUpdate(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.SAVED_QUERY_LOAD:
                return customRecordOps.savedQueryLoad(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.SAVED_QUERY_DELETE:
                return customRecordOps.savedQueryDelete(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.SAVED_QUERIES_LIST:
                return customRecordOps.savedQueriesList(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.QUERY_HISTORY_SAVE:
                return customRecordOps.queryHistorySave(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.QUERY_HISTORY_LIST:
                return customRecordOps.queryHistoryList(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.QUERY_HISTORY_DELETE:
                return customRecordOps.queryHistoryDelete(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.QUERY_HISTORY_CLEAR:
                return customRecordOps.queryHistoryClear(context, requestPayload);

            case constants.REQUEST_FUNCTIONS.QUERY_HISTORY_TEST:
                return customRecordOps.queryHistoryTest(context, requestPayload);

            default:
                nsModules.logger.error('Payload - Unsupported Function', requestPayload['function']);
                context.response.write(JSON.stringify({
                    error: 'Unsupported function: ' + requestPayload['function']
                }, null, 2));
        }
    }
    
    /**
     * Validate request payload
     * 
     * @param {Object} requestPayload - The request payload to validate
     * @returns {Object} - Validation result
     */
    function validateRequestPayload(requestPayload) {
        if (!requestPayload) {
            return {
                isValid: false,
                message: 'Request payload is empty'
            };
        }
        
        if (!requestPayload['function']) {
            return {
                isValid: false,
                message: 'Request function is missing'
            };
        }
        
        // Validate specific function requirements
        switch (requestPayload['function']) {
            case constants.REQUEST_FUNCTIONS.QUERY_EXECUTE:
                if (!requestPayload.query) {
                    return {
                        isValid: false,
                        message: 'Query is required for query execution'
                    };
                }
                break;
                
            case constants.REQUEST_FUNCTIONS.SQL_FILE_LOAD:
                if (!requestPayload.fileID) {
                    return {
                        isValid: false,
                        message: 'File ID is required for file loading'
                    };
                }
                break;
                
            case constants.REQUEST_FUNCTIONS.SQL_FILE_SAVE:
                if (!requestPayload.filename || !requestPayload.contents) {
                    return {
                        isValid: false,
                        message: 'Filename and contents are required for file saving'
                    };
                }
                break;
                
            case constants.REQUEST_FUNCTIONS.WORKBOOK_LOAD:
                if (!requestPayload.scriptID) {
                    return {
                        isValid: false,
                        message: 'Script ID is required for workbook loading'
                    };
                }
                break;
        }
        
        return {
            isValid: true,
            message: 'Request payload is valid'
        };
    }
    
    /**
     * Log request information for debugging
     * 
     * @param {Object} context - The request context
     * @param {string} method - The HTTP method (GET/POST)
     * @returns {void}
     */
    function logRequest(context, method) {
        var logData = {
            method: method,
            parameters: context.request.parameters,
            headers: context.request.headers
        };
        
        if (method === 'POST' && context.request.body) {
            try {
                var payload = JSON.parse(context.request.body);
                logData.function = payload['function'];
                logData.payloadSize = context.request.body.length;
            } catch(e) {
                logData.bodyParseError = e.message;
            }
        }
        
        nsModules.logger.debug('Request Info', logData);
    }
    
    /**
     * Handle request errors
     * 
     * @param {Object} context - The request context
     * @param {Error} error - The error object
     * @returns {void}
     */
    function handleRequestError(context, error) {
        nsModules.logger.error('Request Handler Error', error);
        
        var errorResponse = {
            error: {
                name: error.name || 'UnknownError',
                message: error.message || 'An unknown error occurred',
                stack: error.stack
            }
        };
        
        context.response.setHeader('Content-Type', 'application/json');
        context.response.write(JSON.stringify(errorResponse, null, 5));
    }
    
    /**
     * Set security headers
     * 
     * @param {Object} context - The request context
     * @returns {void}
     */
    function setSecurityHeaders(context) {
        // Add basic security headers
        context.response.setHeader('X-Content-Type-Options', 'nosniff');
        context.response.setHeader('X-Frame-Options', 'SAMEORIGIN');
        context.response.setHeader('X-XSS-Protection', '1; mode=block');
    }
    
    /**
     * Main request handler that routes to GET or POST handlers
     * 
     * @param {Object} context - The request context
     * @param {Function} htmlGenerateTool - Function to generate the main tool HTML

     * @returns {void}
     */
    function handleRequest(context, htmlGenerateTool) {
        try {
            // Set security headers
            setSecurityHeaders(context);
            
            // Log request for debugging
            logRequest(context, context.request.method);
            
            if (context.request.method == 'POST') {
                handlePostRequest(context);
            } else {
                handleGetRequest(context, htmlGenerateTool);
            }
            
        } catch(error) {
            handleRequestError(context, error);
        }
    }
    
    /**
     * Export the request handler functions
     */
    return {
        handleRequest: handleRequest,
        handleGetRequest: handleGetRequest,
        handlePostRequest: handlePostRequest,
        validateRequestPayload: validateRequestPayload,
        logRequest: logRequest,
        handleRequestError: handleRequestError,
        setSecurityHeaders: setSecurityHeaders
    };
    
});
