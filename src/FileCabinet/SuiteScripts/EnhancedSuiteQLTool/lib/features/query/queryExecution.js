/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Query Execution
 * 
 * This module handles query execution functionality including
 * query submission, response handling, and result processing.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the query submit JavaScript
     * 
     * @returns {string} JavaScript code for query submission
     */
    function getQuerySubmitJS() {
        return `
            function querySubmit() {
                let query = '';
                
                // Get query text from CodeMirror or textarea
                if (codeEditor) {
                    const selectedText = codeEditor.getSelection();
                    query = selectedText || codeEditor.getValue();
                } else {
                    const textarea = document.getElementById('${constants.ELEMENT_IDS.QUERY_TEXTAREA}');
                    query = textarea ? textarea.value : '';
                }
                
                if (!query || query.trim() === '') {
                    alert('${constants.ERROR_MESSAGES.QUERY_EMPTY}');
                    return;
                }
                
                // Update status
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = 'Executing query...';
                
                // Hide welcome message and show loading
                document.getElementById('${constants.ELEMENT_IDS.WELCOME_MESSAGE}').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--codeoss-text-secondary);"><div style="margin-bottom: 12px;">⏳ Executing query...</div><div style="font-size: 11px;">Please wait while your query is processed.</div></div>';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'block';
                
                // Prepare request payload
                const requestPayload = {
                    'function': '${constants.REQUEST_FUNCTIONS.QUERY_EXECUTE}',
                    query: query.trim(),
                    rowBegin: getRowBegin(),
                    rowEnd: getRowEnd(),
                    paginationEnabled: isPaginationEnabled(),
                    returnTotals: isReturnTotalsEnabled(),
                    viewsEnabled: isViewsEnabled()
                };
                
                // Track execution start time
                const executionStartTime = Date.now();

                // Execute the query
                fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestPayload)
                })
                .then(response => response.json())
                .then(data => {
                    const executionTime = Date.now() - executionStartTime;
                    queryResponsePayload = data;

                    // Add to query history with execution details
                    if (data.error) {
                        updateQueryHistory(query.trim(), executionTime, 0, false, data.error.message || 'Query failed', 'table');
                    } else {
                        const recordCount = data.records ? data.records.length : 0;
                        updateQueryHistory(query.trim(), executionTime, recordCount, true, null, 'table');
                    }

                    handleQueryResponse(data);
                })
                .catch(error => {
                    const executionTime = Date.now() - executionStartTime;
                    console.error('Query execution error:', error);

                    // Add failed query to history
                    updateQueryHistory(query.trim(), executionTime, 0, false, error.message || 'Network error', 'table');

                    handleQueryError(error);
                });
            }
        `;
    }
    
    /**
     * Generate the query response handling JavaScript
     * 
     * @returns {string} JavaScript code for handling query responses
     */
    function getHandleQueryResponseJS() {
        return `
            function handleQueryResponse(data) {
                if (data.error) {
                    handleQueryError(data.error);
                    return;
                }
                
                if (!data.records) {
                    handleQueryError({ message: 'No records returned from query' });
                    return;
                }
                
                // Update status
                const recordCount = data.records.length;
                const elapsedTime = data.elapsedTime || 'N/A';
                const totalCount = data.totalRecordCount ? \` (Total: \${data.totalRecordCount})\` : '';
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = \`Query completed: \${recordCount} records in \${elapsedTime}ms\${totalCount}\`;
                
                // Update query results header
                document.getElementById('${constants.ELEMENT_IDS.QUERY_RESULTS_HEADER}').textContent = \`Query Results (\${recordCount} records)\`;
                
                // Generate response based on selected format
                const formatRadios = document.querySelectorAll('input[name="resultFormat"]');
                const selectedFormat = Array.from(formatRadios).find(radio => radio.checked);
                
                if (selectedFormat) {
                    switch(selectedFormat.value) {
                        case 'csv':
                            responseGenerateCSV();
                            break;
                        case 'json':
                            responseGenerateJSON();
                            break;
                        case 'table':
                        default:
                            responseGenerateTable();
                            break;
                    }
                } else {
                    responseGenerateTable(); // Default to table
                }
                
                // Show copy button
                document.getElementById('${constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN}').style.display = 'inline-block';
            }
        `;
    }
    
    /**
     * Generate the query error handling JavaScript
     * 
     * @returns {string} JavaScript code for handling query errors
     */
    function getHandleQueryErrorJS() {
        return `
            function handleQueryError(error) {
                console.error('Query error:', error);
                
                let errorMessage = 'An error occurred while executing the query.';
                
                if (error && typeof error === 'object') {
                    if (error.message) {
                        errorMessage = error.message;
                    } else if (error.name) {
                        errorMessage = error.name + (error.details ? ': ' + error.details : '');
                    }
                } else if (typeof error === 'string') {
                    errorMessage = error;
                }
                
                // Display error in results area
                const errorHTML = \`
                    <div style="padding: 20px; background-color: var(--codeoss-panel-bg);">
                        <div style="background-color: var(--codeoss-error); color: white; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
                            <h4 style="margin: 0 0 8px 0; font-size: 14px;">❌ Query Error</h4>
                            <p style="margin: 0; font-size: 12px; line-height: 1.4;">\${errorMessage}</p>
                        </div>
                        <div style="font-size: 11px; color: var(--codeoss-text-secondary);">
                            <p><strong>Troubleshooting Tips:</strong></p>
                            <ul style="margin: 8px 0; padding-left: 16px;">
                                <li>Check your SQL syntax</li>
                                <li>Verify table and field names</li>
                                <li>Ensure you have proper permissions</li>
                                <li>Try a simpler query to test connectivity</li>
                            </ul>
                        </div>
                    </div>
                \`;
                
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = errorHTML;
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = 'Query failed';
                document.getElementById('${constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN}').style.display = 'none';
            }
        `;
    }
    
    /**
     * Generate the query parameter helper functions JavaScript
     * 
     * @returns {string} JavaScript code for query parameter helpers
     */
    function getQueryParameterHelpersJS() {
        return `
            function getRowBegin() {
                const rowBeginElement = document.getElementById('${constants.ELEMENT_IDS.ROW_BEGIN}');
                if (!rowBeginElement) return 1;
                
                const value = parseInt(rowBeginElement.value);
                return isNaN(value) || value < 1 ? 1 : value;
            }
            
            function getRowEnd() {
                const rowEndElement = document.getElementById('${constants.ELEMENT_IDS.ROW_END}');
                if (!rowEndElement) return ${constants.CONFIG.ROWS_RETURNED_DEFAULT};
                
                const value = parseInt(rowEndElement.value);
                return isNaN(value) || value < 1 ? ${constants.CONFIG.ROWS_RETURNED_DEFAULT} : value;
            }
            
            function isPaginationEnabled() {
                const paginationElement = document.getElementById('${constants.ELEMENT_IDS.ENABLE_PAGINATION}');
                return paginationElement ? paginationElement.checked : false;
            }
            
            function isReturnTotalsEnabled() {
                const totalsElement = document.getElementById('${constants.ELEMENT_IDS.RETURN_TOTALS}');
                return totalsElement ? totalsElement.checked : false;
            }
            
            function isViewsEnabled() {
                const viewsElement = document.getElementById('${constants.ELEMENT_IDS.ENABLE_VIEWS}');
                return viewsElement ? viewsElement.checked : false;
            }
            
            function isReturnAllEnabled() {
                const returnAllElement = document.getElementById('${constants.ELEMENT_IDS.RETURN_ALL}');
                return returnAllElement ? returnAllElement.checked : false;
            }
        `;
    }
    
    /**
     * Generate the query validation JavaScript
     * 
     * @returns {string} JavaScript code for query validation
     */
    function getQueryValidationJS() {
        return `
            function validateQuery(query) {
                if (!query || query.trim() === '') {
                    return { valid: false, message: '${constants.ERROR_MESSAGES.QUERY_EMPTY}' };
                }
                
                // Basic SQL injection protection
                const dangerousPatterns = [
                    /;\\s*drop\\s+/i,
                    /;\\s*delete\\s+/i,
                    /;\\s*truncate\\s+/i,
                    /;\\s*alter\\s+/i,
                    /;\\s*create\\s+/i
                ];
                
                for (let pattern of dangerousPatterns) {
                    if (pattern.test(query)) {
                        return { valid: false, message: 'Query contains potentially dangerous operations' };
                    }
                }
                
                // Check for basic SELECT structure
                if (!/^\\s*select\\s+/i.test(query.trim())) {
                    return { valid: false, message: 'Query must start with SELECT statement' };
                }
                
                return { valid: true, message: 'Query is valid' };
            }
            
            function validateQueryParameters() {
                const rowBegin = getRowBegin();
                const rowEnd = getRowEnd();
                
                if (isPaginationEnabled()) {
                    if (rowBegin < 1) {
                        return { valid: false, message: '${constants.ERROR_MESSAGES.INVALID_ROW_BEGIN}' };
                    }
                    
                    if (rowEnd < 1) {
                        return { valid: false, message: '${constants.ERROR_MESSAGES.INVALID_ROW_END}' };
                    }
                    
                    if (rowEnd < rowBegin) {
                        return { valid: false, message: 'End row must be greater than or equal to begin row' };
                    }
                }
                
                return { valid: true, message: 'Parameters are valid' };
            }
        `;
    }
    
    /**
     * Generate the response generation dispatcher JavaScript
     * 
     * @returns {string} JavaScript code for response generation
     */
    function getResponseGenerateJS() {
        return `
            function responseGenerate() {
                if (!queryResponsePayload) {
                    console.warn('No query response payload available');
                    return;
                }
                
                // Get selected format
                const formatRadios = document.querySelectorAll('input[name="resultFormat"]');
                const selectedFormat = Array.from(formatRadios).find(radio => radio.checked);
                
                if (selectedFormat) {
                    switch(selectedFormat.value) {
                        case 'csv':
                            responseGenerateCSV();
                            break;
                        case 'json':
                            responseGenerateJSON();
                            break;
                        case 'table':
                        default:
                            responseGenerateTable();
                            break;
                    }
                } else {
                    responseGenerateTable(); // Default to table
                }
            }
        `;
    }
    
    /**
     * Get all query execution JavaScript functions
     * 
     * @returns {string} Complete JavaScript code for query execution functionality
     */
    function getAllQueryExecutionJS() {
        return getQuerySubmitJS() + '\n' +
               getHandleQueryResponseJS() + '\n' +
               getHandleQueryErrorJS() + '\n' +
               getQueryParameterHelpersJS() + '\n' +
               getQueryValidationJS() + '\n' +
               getResponseGenerateJS();
    }
    
    /**
     * Export the query execution functions
     */
    return {
        getQuerySubmitJS: getQuerySubmitJS,
        getHandleQueryResponseJS: getHandleQueryResponseJS,
        getHandleQueryErrorJS: getHandleQueryErrorJS,
        getQueryParameterHelpersJS: getQueryParameterHelpersJS,
        getQueryValidationJS: getQueryValidationJS,
        getResponseGenerateJS: getResponseGenerateJS,
        getAllQueryExecutionJS: getAllQueryExecutionJS
    };
    
});
