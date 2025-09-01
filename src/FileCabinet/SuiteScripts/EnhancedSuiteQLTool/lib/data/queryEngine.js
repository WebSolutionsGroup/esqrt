/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Query Engine
 * 
 * This module contains the core SuiteQL query execution logic.
 * This is the heart of the application and must preserve all
 * existing functionality including virtual views, pagination,
 * and error handling.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../core/constants',
    '../core/modules',
    '../netsuite/queryHistoryRecord'
], function(constants, nsModules, queryHistoryRecord) {
    
    /**
     * Execute a SuiteQL query with all the enhanced features
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The query request payload
     * @returns {void} - Writes response to context
     */
    function queryExecute(context, requestPayload) {
        try {
            var responsePayload;
            var moreRecords = true;
            var records = new Array();
            var totalRecordCount = 0;
            var queryParams = new Array();
            var paginatedRowBegin = requestPayload.rowBegin;
            var paginatedRowEnd = requestPayload.rowEnd;
            var nestedSQL = requestPayload.query + "\n";
            
            // Handle virtual views if enabled
            if ((requestPayload.viewsEnabled) && (constants.CONFIG.QUERY_FOLDER_ID !== null)) {
                nestedSQL = processVirtualViews(nestedSQL, constants.CONFIG.QUERY_FOLDER_ID);
            }
            
            let beginTime = new Date().getTime();
            
            // Execute query with or without pagination
            if (requestPayload.paginationEnabled) {
                records = executePaginatedQuery(nestedSQL, queryParams, paginatedRowBegin, paginatedRowEnd);
            } else {
                nsModules.logger.debug('nestedSQL', nestedSQL);
                records = nsModules.queryUtils.runSuiteQL({ 
                    query: nestedSQL, 
                    params: queryParams 
                }).asMappedResults();
                nsModules.logger.debug('records', records);
            }
            
            let elapsedTime = (new Date().getTime() - beginTime);
            responsePayload = { 'records': records, 'elapsedTime': elapsedTime };
            
            // Add total count if requested
            if (requestPayload.returnTotals && records.length > 0) {
                var countSQL = 'SELECT COUNT(*) AS TotalRecordCount FROM ( ' + nestedSQL + ' )';
                var countResults = nsModules.queryUtils.runSuiteQL({
                    query: countSQL,
                    params: queryParams
                }).asMappedResults();
                responsePayload.totalRecordCount = countResults[0].totalrecordcount;
            }

            // Persist query execution to history (success)
            try {
                var historyData = {
                    queryContent: nestedSQL,
                    executionTime: elapsedTime,
                    recordCount: records ? records.length : 0,
                    success: true,
                    resultFormat: 'table',
                    sessionId: null
                };
                nsModules.logger.debug('Attempting to save query history', historyData);
                var historyRecordId = queryHistoryRecord.addQueryToHistory(historyData);
                nsModules.logger.debug('Query history saved successfully', { recordId: historyRecordId });
            } catch(historyErr) {
                nsModules.logger.error('Query History Save (success) failed', {
                    error: historyErr.toString(),
                    message: historyErr.message,
                    name: historyErr.name,
                    historyData: historyData
                });
            }

        } catch(e) {
            nsModules.logger.error('queryExecute Error', e);
            // Persist failed execution to history
            try {
                var failElapsed = (new Date().getTime() - (beginTime || new Date().getTime()));
                var failHistoryData = {
                    queryContent: nestedSQL || (requestPayload && requestPayload.query) || '',
                    executionTime: failElapsed,
                    recordCount: 0,
                    success: false,
                    errorMessage: e && (e.message || e.toString()),
                    resultFormat: 'table'
                };
                nsModules.logger.debug('Attempting to save failed query history', failHistoryData);
                var failHistoryRecordId = queryHistoryRecord.addQueryToHistory(failHistoryData);
                nsModules.logger.debug('Failed query history saved successfully', { recordId: failHistoryRecordId });
            } catch(historyErr2) {
                nsModules.logger.error('Query History Save (failure) failed', {
                    error: historyErr2.toString(),
                    message: historyErr2.message,
                    name: historyErr2.name,
                    historyData: failHistoryData
                });
            }
            responsePayload = { 'error': e };
        }

        context.response.write(JSON.stringify(responsePayload, null, 5));
    }
    
    /**
     * Process virtual views in the SQL query
     * 
     * @param {string} sql - The SQL query
     * @param {string} queryFolderID - The folder ID containing view files
     * @returns {string} - The processed SQL with views resolved
     */
    function processVirtualViews(sql, queryFolderID) {
        var pattern = /(?:^|\s)\#(\w+)\b/ig;
        var views = sql.match(pattern);
        
        if ((views !== null) && (views.length > 0)) {
            for (let i = 0; i < views.length; i++) {
                var view = views[i].replace(/\s+/g, '');
                var viewFileName = view.substring(1, view.length) + '.sql';
                
                // Find the view file
                var viewSQL = 'SELECT ID FROM File WHERE ( Folder = ? ) AND ( Name = ? )';
                var queryResults = nsModules.queryUtils.runSuiteQL({ 
                    query: viewSQL, 
                    params: [queryFolderID, viewFileName] 
                });
                var files = queryResults.asMappedResults();
                
                if (files.length == 1) {
                    var fileObj = nsModules.fileUtils.load(files[0].id);
                    sql = sql.replace(view, '( ' + fileObj.getContents() + ' ) AS ' + view.substring(1, view.length));
                } else {
                    throw {
                        'name': 'UnresolvedViewException',
                        'message': constants.ERROR_MESSAGES.UNRESOLVED_VIEW + ' ' + viewFileName
                    };
                }
            }
        }
        
        return sql;
    }
    
    /**
     * Execute a paginated query
     * 
     * @param {string} sql - The SQL query
     * @param {Array} queryParams - Query parameters
     * @param {number} rowBegin - Starting row number
     * @param {number} rowEnd - Ending row number
     * @returns {Array} - Array of query results
     */
    function executePaginatedQuery(sql, queryParams, rowBegin, rowEnd) {
        var records = new Array();
        var moreRecords = true;
        var paginatedRowBegin = rowBegin;
        var paginatedRowEnd = rowEnd;
        
        do {
            var paginatedSQL = 'SELECT * FROM ( SELECT ROWNUM AS ROWNUMBER, * FROM ( ' + sql + ' ) ) WHERE ( ROWNUMBER BETWEEN ' + paginatedRowBegin + ' AND ' + paginatedRowEnd + ')';
            
            var queryResults = nsModules.queryUtils.runSuiteQL({ 
                query: paginatedSQL, 
                params: queryParams 
            }).asMappedResults();
            
            records = records.concat(queryResults);
            
            if (queryResults.length < 5000) { 
                moreRecords = false; 
            }
            
            paginatedRowBegin = paginatedRowBegin + 5000;
            
        } while (moreRecords);
        
        return records;
    }
    
    /**
     * Validate query input
     * 
     * @param {string} query - The SQL query to validate
     * @returns {Object} - Validation result with isValid and message
     */
    function validateQuery(query) {
        if (!query || query.trim() === '') {
            return {
                isValid: false,
                message: constants.ERROR_MESSAGES.QUERY_EMPTY
            };
        }
        
        // Basic SQL injection protection (can be enhanced)
        var dangerousPatterns = [
            /;\s*drop\s+/i,
            /;\s*delete\s+/i,
            /;\s*truncate\s+/i,
            /;\s*alter\s+/i,
            /;\s*create\s+/i
        ];
        
        for (var i = 0; i < dangerousPatterns.length; i++) {
            if (dangerousPatterns[i].test(query)) {
                return {
                    isValid: false,
                    message: 'Query contains potentially dangerous operations'
                };
            }
        }
        
        return {
            isValid: true,
            message: 'Query is valid'
        };
    }
    
    /**
     * Format query results for different output types
     * 
     * @param {Array} records - The query results
     * @param {string} format - The desired format (table, csv, json)
     * @returns {Object} - Formatted results
     */
    function formatResults(records, format) {
        switch (format) {
            case 'csv':
                return formatAsCSV(records);
            case 'json':
                return formatAsJSON(records);
            case 'table':
            default:
                return formatAsTable(records);
        }
    }
    
    /**
     * Format results as CSV
     * 
     * @param {Array} records - The query results
     * @returns {string} - CSV formatted string
     */
    function formatAsCSV(records) {
        if (!records || records.length === 0) {
            return '';
        }
        
        var csv = '';
        var headers = Object.keys(records[0]);
        csv += headers.join(',') + '\n';
        
        for (var i = 0; i < records.length; i++) {
            var row = [];
            for (var j = 0; j < headers.length; j++) {
                var value = records[i][headers[j]];
                if (value === null || value === undefined) {
                    value = '';
                }
                // Escape quotes and wrap in quotes if contains comma
                value = String(value).replace(/"/g, '""');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = '"' + value + '"';
                }
                row.push(value);
            }
            csv += row.join(',') + '\n';
        }
        
        return csv;
    }
    
    /**
     * Format results as JSON
     * 
     * @param {Array} records - The query results
     * @returns {string} - JSON formatted string
     */
    function formatAsJSON(records) {
        return JSON.stringify(records, null, 2);
    }
    
    /**
     * Format results as HTML table
     * 
     * @param {Array} records - The query results
     * @returns {string} - HTML table string
     */
    function formatAsTable(records) {
        if (!records || records.length === 0) {
            return '<p>No records found.</p>';
        }
        
        var html = '<table class="' + constants.CSS_CLASSES.CODEOSS_TABLE + '">';
        var headers = Object.keys(records[0]);
        
        // Add headers
        html += '<thead><tr>';
        for (var i = 0; i < headers.length; i++) {
            html += '<th>' + headers[i] + '</th>';
        }
        html += '</tr></thead>';
        
        // Add data rows
        html += '<tbody>';
        for (var i = 0; i < records.length; i++) {
            html += '<tr>';
            for (var j = 0; j < headers.length; j++) {
                var value = records[i][headers[j]];
                if (value === null || value === undefined) {
                    value = '';
                }
                html += '<td>' + String(value) + '</td>';
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        
        return html;
    }
    
    /**
     * Export the query engine functions
     */
    return {
        queryExecute: queryExecute,
        processVirtualViews: processVirtualViews,
        executePaginatedQuery: executePaginatedQuery,
        validateQuery: validateQuery,
        formatResults: formatResults,
        formatAsCSV: formatAsCSV,
        formatAsJSON: formatAsJSON,
        formatAsTable: formatAsTable
    };
    
});
