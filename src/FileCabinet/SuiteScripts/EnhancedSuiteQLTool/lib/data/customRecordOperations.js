/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Custom Record Operations
 * 
 * This module handles server-side operations for saved queries and query history
 * using NetSuite custom records.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../core/constants',
    '../core/modules',
    '../netsuite/savedQueriesRecord',
    '../netsuite/queryHistoryRecord'
], function(constants, nsModules, savedQueriesRecord, queryHistoryRecord) {
    
    /**
     * Save a query to NetSuite custom record
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function savedQuerySave(context, requestPayload) {
        var responsePayload;

        try {
            nsModules.logger.debug('Saving query to custom record', requestPayload);

            // Validate required fields
            if (!requestPayload.title || !requestPayload.content) {
                throw new Error('Title and content are required for saving queries.');
            }

            // Create the saved query record
            var queryData = {
                title: requestPayload.title,
                content: requestPayload.content,
                description: requestPayload.description || '',
                tags: requestPayload.tags || '',
                category: requestPayload.category || '',
                favorite: requestPayload.favorite || false
            };

            // Only include sharing level if provided
            if (requestPayload.sharingLevel) {
                queryData.sharingLevel = requestPayload.sharingLevel;
            }

            var recordId = savedQueriesRecord.createSavedQuery(queryData);

            responsePayload = {
                success: true,
                recordId: recordId,
                message: 'Query saved successfully'
            };

        } catch(e) {
            nsModules.logger.error('Error saving query', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }

        context.response.write(JSON.stringify(responsePayload, null, 2));
    }
    
    /**
     * Load a saved query from NetSuite custom record
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function savedQueryLoad(context, requestPayload) {
        var responsePayload;
        
        try {
            nsModules.logger.debug('Loading saved query', requestPayload);
            
            if (!requestPayload.recordId) {
                throw new Error('Record ID is required for loading queries.');
            }
            
            var queryData = savedQueriesRecord.loadSavedQuery(requestPayload.recordId);
            
            responsePayload = {
                success: true,
                queryData: queryData
            };
            
        } catch(e) {
            nsModules.logger.error('Error loading query', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 2));
    }
    
    /**
     * Update an existing saved query in NetSuite custom record
     *
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function savedQueryUpdate(context, requestPayload) {
        var responsePayload;

        try {
            nsModules.logger.debug('Updating saved query', requestPayload);

            // Validate required fields
            if (!requestPayload.recordId) {
                throw new Error('Record ID is required for updating queries.');
            }
            if (!requestPayload.title || !requestPayload.content) {
                throw new Error('Title and content are required for updating queries.');
            }

            // Update the saved query record
            var queryData = {
                title: requestPayload.title,
                content: requestPayload.content,
                description: requestPayload.description || '',
                tags: requestPayload.tags || '',
                category: requestPayload.category || '',
                favorite: requestPayload.favorite || false
            };

            // Only include sharing level if provided
            if (requestPayload.sharingLevel) {
                queryData.sharingLevel = requestPayload.sharingLevel;
            }

            savedQueriesRecord.updateSavedQuery(requestPayload.recordId, queryData);

            responsePayload = {
                success: true,
                recordId: requestPayload.recordId,
                message: 'Query updated successfully'
            };

        } catch(e) {
            nsModules.logger.error('Error updating query', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }

        context.response.write(JSON.stringify(responsePayload, null, 2));
    }

    /**
     * Delete a saved query from NetSuite custom record
     *
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function savedQueryDelete(context, requestPayload) {
        var responsePayload;
        
        try {
            nsModules.logger.debug('Deleting saved query', requestPayload);
            
            if (!requestPayload.recordId) {
                throw new Error('Record ID is required for deleting queries.');
            }
            
            savedQueriesRecord.deleteSavedQuery(requestPayload.recordId);
            
            responsePayload = {
                success: true,
                message: 'Query deleted successfully'
            };
            
        } catch(e) {
            nsModules.logger.error('Error deleting query', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 2));
    }
    
    /**
     * List saved queries from NetSuite custom records
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function savedQueriesList(context, requestPayload) {
        var responsePayload;
        
        try {
            nsModules.logger.debug('Loading saved queries list', requestPayload);
            
            var currentUser = nsModules.runtime.getCurrentUser();
            var searchOptions = {
                createdBy: currentUser.id,
                includeShared: requestPayload.includeShared || false,
                category: requestPayload.category || null,
                tags: requestPayload.tags || null,
                limit: requestPayload.limit || 50
            };
            
            var queries = savedQueriesRecord.searchSavedQueries(searchOptions);
            
            responsePayload = {
                success: true,
                queries: queries
            };
            
        } catch(e) {
            nsModules.logger.error('Error loading saved queries list', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 2));
    }
    
    /**
     * Save query execution to history
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function queryHistorySave(context, requestPayload) {
        var responsePayload;
        
        try {
            nsModules.logger.debug('Saving query to history', requestPayload);
            
            if (!requestPayload.queryContent) {
                throw new Error('Query content is required for saving to history.');
            }
            
            var recordId = queryHistoryRecord.addQueryToHistory({
                queryContent: requestPayload.queryContent,
                executionTime: requestPayload.executionTime || null,
                recordCount: requestPayload.recordCount || null,
                success: requestPayload.success !== false,
                errorMessage: requestPayload.errorMessage || null,
                resultFormat: requestPayload.resultFormat || 'table',
                sessionId: requestPayload.sessionId || null
            });
            
            responsePayload = {
                success: true,
                recordId: recordId,
                message: 'Query saved to history'
            };
            
        } catch(e) {
            nsModules.logger.error('Error saving query to history', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 2));
    }
    
    /**
     * Get query history list
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function queryHistoryList(context, requestPayload) {
        var responsePayload;
        
        try {
            nsModules.logger.debug('Loading query history list', requestPayload);
            
            var currentUser = nsModules.runtime.getCurrentUser();
            var searchOptions = {
                userId: currentUser.id,
                limit: requestPayload.limit || 50,
                successOnly: requestPayload.successOnly || false,
                uniqueOnly: requestPayload.uniqueOnly || false
            };
            
            var historyFunction = requestPayload.uniqueOnly ? 
                queryHistoryRecord.getUniqueQueryHistory : 
                queryHistoryRecord.getQueryHistory;
                
            var history = historyFunction(searchOptions);
            
            responsePayload = {
                success: true,
                history: history
            };
            
        } catch(e) {
            nsModules.logger.error('Error loading query history', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 2));
    }

    /**
     * Delete a single query history record
     *
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function queryHistoryDelete(context, requestPayload) {
        var responsePayload;

        try {
            nsModules.logger.debug('Deleting query history record', requestPayload);

            if (!requestPayload.recordId) {
                throw new Error('Record ID is required for deleting history.');
            }

            queryHistoryRecord.deleteHistoryRecord(requestPayload.recordId);

            responsePayload = {
                success: true,
                message: 'History record deleted successfully'
            };

        } catch(e) {
            nsModules.logger.error('Error deleting history record', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }

        context.response.write(JSON.stringify(responsePayload, null, 2));
    }

    /**
     * Clear query history for current user
     *
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The request payload
     * @returns {void} - Writes JSON response
     */
    function queryHistoryClear(context, requestPayload) {
        var responsePayload;

        try {
            nsModules.logger.debug('Clearing query history', requestPayload);

            var deletedCount = queryHistoryRecord.clearUserHistory();

            responsePayload = {
                success: true,
                deletedCount: deletedCount,
                message: 'Query history cleared successfully'
            };

        } catch(e) {
            nsModules.logger.error('Error clearing query history', e.toString());
            responsePayload = {
                success: false,
                error: e.message || e.toString()
            };
        }

        context.response.write(JSON.stringify(responsePayload, null, 2));
    }



    /**
     * Export the custom record operation functions
     */
    return {
        savedQuerySave: savedQuerySave,
        savedQueryUpdate: savedQueryUpdate,
        savedQueryLoad: savedQueryLoad,
        savedQueryDelete: savedQueryDelete,
        savedQueriesList: savedQueriesList,
        queryHistorySave: queryHistorySave,
        queryHistoryList: queryHistoryList,
        queryHistoryDelete: queryHistoryDelete,
        queryHistoryClear: queryHistoryClear
    };
    
});
