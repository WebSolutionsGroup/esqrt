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

                // Check for parameters in the query
                const parameterInfo = detectQueryParameters(query.trim());

                if (parameterInfo.hasParameters) {
                    // Show parameter modal instead of executing directly
                    window.showParameterModal(query.trim(), parameterInfo.parameters);
                    return;
                }

                // Execute query without parameters (original flow)
                executeQueryDirect(query.trim());
            }

            function executeQueryDirect(query) {
                // Update status
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = 'Executing query...';

                // Hide welcome message and show loading
                document.getElementById('${constants.ELEMENT_IDS.WELCOME_MESSAGE}').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--codeoss-text-secondary);"><div style="margin-bottom: 12px;">⏳ Executing query...</div><div style="font-size: 11px;">Please wait while your query is processed.</div></div>';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'block';

                // Prepare request payload
                const requestPayload = {
                    'function': '${constants.REQUEST_FUNCTIONS.QUERY_EXECUTE}',
                    query: query,
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

                // Save results to current active tab
                if (typeof saveResultsToCurrentTab === 'function') {
                    saveResultsToCurrentTab();
                }
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
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'block';
                document.getElementById('${constants.ELEMENT_IDS.WELCOME_MESSAGE}').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = 'Query failed';
                document.getElementById('${constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN}').style.display = 'none';

                // Save error state to current active tab
                if (typeof saveResultsToCurrentTab === 'function') {
                    saveResultsToCurrentTab();
                }
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
     * Generate parameter detection JavaScript functions
     *
     * @returns {string} JavaScript code for parameter detection
     */
    function getParameterDetectionJS() {
        return `
            function detectQueryParameters(query) {
                if (!query || typeof query !== 'string') {
                    return {
                        hasParameters: false,
                        parameterCount: 0,
                        parameters: []
                    };
                }

                // Find all ? placeholders that are not inside quoted strings
                const parameters = [];
                let parameterIndex = 0;
                let inSingleQuote = false;
                let inDoubleQuote = false;
                let escaped = false;

                for (let i = 0; i < query.length; i++) {
                    const char = query[i];

                    // Handle escape sequences
                    if (escaped) {
                        escaped = false;
                        continue;
                    }

                    if (char === '\\\\') {
                        escaped = true;
                        continue;
                    }

                    // Handle quotes
                    if (char === "'" && !inDoubleQuote) {
                        inSingleQuote = !inSingleQuote;
                        continue;
                    }

                    if (char === '"' && !inSingleQuote) {
                        inDoubleQuote = !inDoubleQuote;
                        continue;
                    }

                    // If we're inside quotes, skip parameter detection
                    if (inSingleQuote || inDoubleQuote) {
                        continue;
                    }

                    // Detect parameter placeholder
                    if (char === '?') {
                        parameterIndex++;

                        // Try to infer parameter context from surrounding SQL
                        const context = getParameterContextFromQuery(query, i);

                        parameters.push({
                            index: parameterIndex,
                            position: i,
                            name: \`Parameter \${parameterIndex}\`,
                            type: context.type,
                            context: context.description,
                            required: true,
                            value: null
                        });
                    }
                }

                return {
                    hasParameters: parameters.length > 0,
                    parameterCount: parameters.length,
                    parameters: parameters
                };
            }

            function getParameterContextFromQuery(query, position) {
                // Get surrounding text (50 characters before and after)
                const start = Math.max(0, position - 50);
                const end = Math.min(query.length, position + 50);
                const context = query.substring(start, end).toLowerCase();

                // Default context
                let type = 'text';
                let description = 'Enter value';

                // Look for date-related keywords
                if (context.includes('date') || context.includes('created') || context.includes('modified') ||
                    context.includes('lastmodified') || context.includes('datecreated')) {
                    type = 'date';
                    description = 'Select date';
                }
                // Look for numeric contexts
                else if (context.includes('id') || context.includes('amount') || context.includes('count') ||
                         context.includes('number') || context.includes('qty') || context.includes('quantity')) {
                    type = 'number';
                    description = 'Enter numeric value';
                }
                // Look for email contexts
                else if (context.includes('email')) {
                    type = 'email';
                    description = 'Enter email address';
                }
                // Look for boolean contexts
                else if (context.includes('active') || context.includes('enabled') || context.includes('disabled') ||
                         context.includes('isinactive') || context.includes('is_inactive')) {
                    type = 'select';
                    description = 'Select true/false';
                }

                return {
                    type: type,
                    description: description
                };
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
               getResponseGenerateJS() + '\n' +
               getParameterDetectionJS();
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
        getParameterDetectionJS: getParameterDetectionJS,
        getAllQueryExecutionJS: getAllQueryExecutionJS
    };
    
});
