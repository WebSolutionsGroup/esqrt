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

                // Check for CREATE OR REPLACE statements first (these should not trigger parameter detection)
                const trimmedQuery = query.trim();
                const isCreateStatement = /^CREATE\s+OR\s+REPLACE\s+(FUNCTION|PROCEDURE)/i.test(trimmedQuery);

                if (!isCreateStatement) {
                    // Check for parameters in the query
                    const parameterInfo = detectQueryParameters(trimmedQuery);

                    if (parameterInfo.hasParameters) {
                        // Show parameter modal instead of executing directly
                        window.showParameterModal(trimmedQuery, parameterInfo.parameters);
                        return;
                    }
                }

                // Execute query without parameters (original flow)
                executeQueryDirect(trimmedQuery);
            }

            function executeQueryDirect(query) {
                // Update status
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = 'Executing query...';

                // Hide welcome message and show loading
                document.getElementById('${constants.ELEMENT_IDS.WELCOME_MESSAGE}').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--codeoss-text-secondary);"><div style="margin-bottom: 12px;">⏳ Executing query...</div><div style="font-size: 11px;">Please wait while your query is processed.</div></div>';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'flex';

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

                    // Add failed query to history
                    updateQueryHistory(query.trim(), executionTime, 0, false, error.message || 'Network error', 'table');

                    handleQueryError(error);
                });
            }
        `;
    }

    /**
     * Generate the CREATE statement response handling JavaScript
     *
     * @returns {string} JavaScript code for handling CREATE statement responses
     */
    function getHandleCreateStatementResponseJS() {
        return `
            function handleCreateStatementResponse(data) {
                // Update status
                const elapsedTime = data.elapsedTime || 'N/A';
                const statusText = data.success ?
                    \`\${data.message} (completed in \${elapsedTime}ms)\` :
                    \`Error: \${data.message}\`;

                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = statusText;

                // Hide welcome message and show results
                document.getElementById('${constants.ELEMENT_IDS.WELCOME_MESSAGE}').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'flex';

                // Create success/error message display
                const messageClass = data.success ? 'create-success' : 'create-error';
                const messageIcon = data.success ? '✅' : '❌';

                let resultHTML = \`
                    <div class="create-statement-result \${messageClass}">
                        <div class="create-message">
                            <span class="create-icon">\${messageIcon}</span>
                            <span class="create-text">\${data.message}</span>
                        </div>
                \`;

                if (data.success) {
                    resultHTML += \`
                        <div class="create-details">
                            <div><strong>Type:</strong> \${data.type}</div>
                            <div><strong>File Name:</strong> \${data.fileName}</div>
                            <div><strong>File ID:</strong> \${data.fileId}</div>
                            <div><strong>Execution Time:</strong> \${elapsedTime}ms</div>
                        </div>
                    \`;
                }

                resultHTML += \`</div>\`;

                // Add CSS for CREATE statement results if not already added
                if (!document.getElementById('create-statement-styles')) {
                    const style = document.createElement('style');
                    style.id = 'create-statement-styles';
                    style.textContent = \`
                        .create-statement-result {
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-family: var(--codeoss-font-family);
                        }
                        .create-success {
                            background-color: var(--codeoss-success-bg, #d4edda);
                            border: 1px solid var(--codeoss-success-border, #c3e6cb);
                            color: var(--codeoss-success-text, #155724);
                        }
                        .create-error {
                            background-color: var(--codeoss-error-bg, #f8d7da);
                            border: 1px solid var(--codeoss-error-border, #f5c6cb);
                            color: var(--codeoss-error-text, #721c24);
                        }
                        .create-message {
                            display: flex;
                            align-items: center;
                            font-size: 16px;
                            font-weight: 500;
                            margin-bottom: 12px;
                        }
                        .create-icon {
                            margin-right: 8px;
                            font-size: 18px;
                        }
                        .create-details {
                            font-size: 14px;
                            line-height: 1.5;
                        }
                        .create-details div {
                            margin: 4px 0;
                        }
                        .create-details strong {
                            font-weight: 600;
                        }
                    \`;
                    document.head.appendChild(style);
                }

                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = resultHTML;

                // Update query results header
                document.getElementById('${constants.ELEMENT_IDS.QUERY_RESULTS_HEADER}').textContent =
                    data.success ? \`\${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Created Successfully\` :
                                  \`\${data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : 'Statement'} Creation Failed\`;
            }
        `;
    }

    /**
     * Generate the stored procedure response handling JavaScript
     *
     * @returns {string} JavaScript code for handling stored procedure responses
     */
    function getHandleStoredProcedureResponseJS() {
        return `
            function handleStoredProcedureResponse(data) {
                // Update status
                const elapsedTime = data.elapsedTime || 'N/A';
                const outputLines = data.outputLog ? data.outputLog.length : 0;
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = \`Stored procedure completed: \${outputLines} output lines in \${elapsedTime}ms\`;

                // Update query results header
                document.getElementById('${constants.ELEMENT_IDS.QUERY_RESULTS_HEADER}').textContent = \`Procedure Output (\${outputLines} lines)\`;

                // Generate console-style output with full height like normal query results
                // Use CSS class for proper theme support
                let consoleOutput = '<div class="stored-procedure-console" style="font-family: var(--codeoss-font-family); padding: 15px; border-radius: 4px; height: calc(100vh - 305px); overflow-y: auto; white-space: pre-wrap; line-height: 1.4;">';

                // Add each output line with timestamp and styling
                data.outputLog.forEach(function(logEntry, index) {
                    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
                    let lineColor = 'var(--codeoss-text-primary)'; // Default color
                    let prefix = '';

                    switch(logEntry.type.toUpperCase()) {
                        case 'LOG':
                            lineColor = 'var(--codeoss-accent)'; // Theme-aware blue for info
                            prefix = '[INFO]';
                            break;
                        case 'ERROR':
                            lineColor = 'var(--codeoss-error)'; // Theme-aware red for errors
                            prefix = '[ERROR]';
                            break;
                        case 'RESULT':
                            lineColor = 'var(--codeoss-success)'; // Theme-aware green for results
                            prefix = '[RESULT]';
                            break;
                        default:
                            prefix = '[' + logEntry.type + ']';
                    }

                    consoleOutput += \`<div style="color: \${lineColor}; margin-bottom: 2px;">\`;
                    consoleOutput += \`<span style="color: var(--codeoss-text-secondary); font-size: 0.9em;">[\${timestamp}]</span> \`;
                    consoleOutput += \`<span style="font-weight: bold;">\${prefix}</span> \`;
                    consoleOutput += \`<span>\${logEntry.message}</span>\`;
                    consoleOutput += '</div>';
                });

                consoleOutput += '</div>';

                // Display the console output
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = consoleOutput;

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
     * Generate the DML response handling JavaScript
     *
     * @returns {string} JavaScript code for handling DML responses
     */
    function getHandleDMLResponseJS() {
        return `
            function handleDMLResponse(data) {
                // Calculate record count and get IDs
                let recordCount = 0;
                let recordIds = [];

                if (data.result) {
                    // Get record count from various possible fields
                    recordCount = data.result.valuesAdded ||
                                 data.result.recordsCreated ||
                                 data.result.recordsUpdated ||
                                 data.result.recordsDeleted ||
                                 (data.result.recordIds ? data.result.recordIds.length : 0) ||
                                 (data.result.recordId ? 1 : 0);

                    // Get record IDs
                    if (data.result.recordIds && Array.isArray(data.result.recordIds)) {
                        recordIds = data.result.recordIds;
                    } else if (data.result.recordId) {
                        recordIds = [data.result.recordId];
                    }
                }

                // Check if this is a preview operation
                const isPreview = (data.metadata && (data.metadata.operation === 'DELETE_PREVIEW' || data.metadata.operation === 'UPDATE_PREVIEW' || data.metadata.operation === 'INSERT_PREVIEW' || data.metadata.isPreviewOnly)) ||
                                 (data.message && (data.message.includes('PREVIEW ONLY - NO RECORDS DELETED') || data.message.includes('PREVIEW ONLY - NO RECORDS UPDATED') || data.message.includes('PREVIEW ONLY - NO RECORDS INSERTED')));
                const elapsedTime = data.elapsedTime || 'N/A';
                let dmlType = data.dmlType || 'DML';
                const recordText = recordCount === 1 ? 'record' : 'records';

                // Modify display for preview operations
                if (isPreview) {
                    dmlType = dmlType + ' PREVIEW';
                    const previewRecordCount = (data.metadata && (data.metadata.recordsToDelete || data.metadata.recordsToUpdate || data.metadata.recordsToInsert)) || recordCount;
                    const actionText = dmlType.includes('DELETE') ? 'deleted' : (dmlType.includes('UPDATE') ? 'updated' : 'inserted');
                    const noActionText = dmlType.includes('DELETE') ? 'NO RECORDS DELETED' : (dmlType.includes('UPDATE') ? 'NO RECORDS UPDATED' : 'NO RECORDS INSERTED');
                    document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = \`\${dmlType} completed: \${previewRecordCount} \${recordText} found in \${elapsedTime}ms\`;
                    document.getElementById('${constants.ELEMENT_IDS.QUERY_RESULTS_HEADER}').textContent = \`\${dmlType} - \${noActionText} (\${previewRecordCount} \${recordText} found)\`;
                } else {
                    document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = \`\${dmlType} operation completed: \${recordCount} \${recordText} in \${elapsedTime}ms\`;
                    document.getElementById('${constants.ELEMENT_IDS.QUERY_RESULTS_HEADER}').textContent = \`\${dmlType} Operation Result (\${recordCount} \${recordText})\`;
                }

                // Display success message in results area
                const resultsDiv = document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}');
                if (resultsDiv) {
                    let resultHTML = '';

                    if (isPreview) {
                        // Special styling for preview operations
                        resultHTML = '<div class="alert alert-warning" style="margin: 20px; border-left: 5px solid #ff9800;">';
                        const actionText = dmlType.includes('DELETE') ? 'DELETED' : (dmlType.includes('UPDATE') ? 'UPDATED' : 'INSERTED');
                        const actionVerb = dmlType.includes('DELETE') ? 'deleted' : (dmlType.includes('UPDATE') ? 'updated' : 'inserted');
                        const statementType = dmlType.includes('DELETE') ? 'DELETE' : (dmlType.includes('UPDATE') ? 'UPDATE' : 'INSERT');
                        resultHTML += '<h5><i class="fas fa-eye"></i> 🔍 ' + dmlType + ' - NO RECORDS ' + actionText + '</h5>';

                        // Show preview count prominently
                        const previewRecordCount = (data.metadata && (data.metadata.recordsToDelete || data.metadata.recordsToUpdate || data.metadata.recordsToInsert)) || recordCount;
                        resultHTML += '<div class="mb-3">';
                        resultHTML += '<h6><strong>' + previewRecordCount + ' ' + recordText + ' found that would be ' + actionVerb + '</strong></h6>';
                        resultHTML += '</div>';

                        // Add instruction to actually perform the action
                        resultHTML += '<div class="mb-3" style="background-color: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">';
                        resultHTML += '<strong>💡 To actually ' + actionVerb.toLowerCase() + ' these records:</strong><br>';
                        resultHTML += 'Add <code>COMMIT</code> to the end of your ' + statementType + ' statement';
                        resultHTML += '</div>';
                    } else {
                        resultHTML = '<div class="alert alert-success" style="margin: 20px;">';
                        resultHTML += '<h5><i class="fas fa-check-circle"></i> ' + dmlType + ' Operation Successful</h5>';

                        // Show record count prominently
                        resultHTML += '<div class="mb-3">';
                        resultHTML += '<h6><strong>' + recordCount + ' ' + recordText + ' processed successfully</strong></h6>';
                        resultHTML += '</div>';
                    }

                    // Show record IDs prominently if available
                    if (recordIds.length > 0) {
                        resultHTML += '<div class="mb-3">';
                        resultHTML += '<strong>NetSuite Internal ID' + (recordIds.length > 1 ? 's' : '') + ':</strong><br>';

                        if (recordIds.length <= 10) {
                            // Show all IDs if 10 or fewer
                            resultHTML += '<div class="mt-2">';
                            recordIds.forEach(function(id, index) {
                                resultHTML += '<span class="badge badge-primary mr-2 mb-1" style="font-size: 14px; padding: 8px 12px;">' + id + '</span>';
                            });
                            resultHTML += '</div>';
                        } else {
                            // Show first 10 and indicate there are more
                            resultHTML += '<div class="mt-2">';
                            for (let i = 0; i < 10; i++) {
                                resultHTML += '<span class="badge badge-primary mr-2 mb-1" style="font-size: 14px; padding: 8px 12px;">' + recordIds[i] + '</span>';
                            }
                            resultHTML += '<br><small class="text-muted">... and ' + (recordIds.length - 10) + ' more</small>';
                            resultHTML += '</div>';
                        }
                        resultHTML += '</div>';
                    }

                    // Add additional details if available
                    if (data.result) {
                        resultHTML += '<div class="mt-3"><strong>Additional Details:</strong><ul class="mb-0">';

                        if (data.result.recordType) {
                            resultHTML += '<li>Record Type: <code>' + data.result.recordType + '</code></li>';
                        }
                        if (data.message) {
                            resultHTML += '<li>Message: ' + data.message + '</li>';
                        }
                        if (data.result.errors && data.result.errors.length > 0) {
                            resultHTML += '<li>Warnings: ' + data.result.errors.length + ' non-critical issues</li>';
                        }

                        resultHTML += '</ul></div>';
                    }

                    resultHTML += '</div>';
                    resultsDiv.innerHTML = resultHTML;
                    resultsDiv.style.display = 'flex';
                }

                // Save results to current active tab
                if (typeof saveResultsToCurrentTab === 'function') {
                    saveResultsToCurrentTab();
                }
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

                // Handle CREATE statement responses
                if (data.isCreateStatement) {
                    handleCreateStatementResponse(data);
                    return;
                }

                // Handle stored procedure responses with console-style output
                if (data.outputLog && data.outputLog.length > 0) {
                    handleStoredProcedureResponse(data);
                    return;
                }

                // Handle DML operation responses
                if (data.dml && data.dmlType) {
                    handleDMLResponse(data);
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
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'flex';
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
            // NetSuite Field Metadata for Parameter Type Detection
            function getParameterTypeFromField(tableName, fieldName) {
                if (!tableName || !fieldName) {
                    return { type: 'text', description: 'Enter value', dataType: 'text' };
                }

                var normalizedTable = tableName.toLowerCase();
                var normalizedField = fieldName.toLowerCase();

                // Common NetSuite field mappings
                var fieldMappings = {
                    // Transaction fields
                    'tranid': { type: 'text', description: 'Transaction number/document number', dataType: 'text' },
                    'entityid': { type: 'text', description: 'Entity ID/name', dataType: 'text' },
                    'companyname': { type: 'text', description: 'Company name', dataType: 'text' },
                    'email': { type: 'email', description: 'Email address', dataType: 'email' },
                    'trandate': { type: 'date', description: 'Transaction date', dataType: 'date' },
                    'created': { type: 'datetime-local', description: 'Created date/time', dataType: 'datetime' },
                    'lastmodified': { type: 'datetime-local', description: 'Last modified date/time', dataType: 'datetime' },
                    'datecreated': { type: 'datetime-local', description: 'Date created', dataType: 'datetime' },
                    'lastmodifieddate': { type: 'datetime-local', description: 'Last modified date', dataType: 'datetime' },
                    'total': { type: 'number', description: 'Total amount', dataType: 'number' },
                    'amount': { type: 'number', description: 'Amount', dataType: 'number' },
                    'subtotal': { type: 'number', description: 'Subtotal amount', dataType: 'number' },
                    'taxtotal': { type: 'number', description: 'Tax total', dataType: 'number' },
                    'balance': { type: 'number', description: 'Balance amount', dataType: 'number' },
                    'creditlimit': { type: 'number', description: 'Credit limit', dataType: 'number' },
                    'exchangerate': { type: 'number', description: 'Exchange rate', dataType: 'number' },
                    'isinactive': { type: 'select', description: 'Inactive status (true/false)', dataType: 'boolean' },
                    'approved': { type: 'select', description: 'Approved status (true/false)', dataType: 'boolean' },
                    'voided': { type: 'select', description: 'Voided status (true/false)', dataType: 'boolean' },
                    'taxable': { type: 'select', description: 'Taxable status (true/false)', dataType: 'boolean' },
                    'isperson': { type: 'select', description: 'Is person vs company (true/false)', dataType: 'boolean' },
                    'issalesrep': { type: 'select', description: 'Is sales rep (true/false)', dataType: 'boolean' },
                    'is1099eligible': { type: 'select', description: '1099 eligible (true/false)', dataType: 'boolean' },
                    'availabletopartners': { type: 'select', description: 'Available to partners (true/false)', dataType: 'boolean' },
                    'isonline': { type: 'select', description: 'Is online (true/false)', dataType: 'boolean' },
                    'phone': { type: 'text', description: 'Phone number', dataType: 'text' },
                    'fax': { type: 'text', description: 'Fax number', dataType: 'text' },
                    'url': { type: 'text', description: 'Website URL', dataType: 'text' },
                    'memo': { type: 'text', description: 'Memo/comments', dataType: 'text' },
                    'comments': { type: 'text', description: 'Comments', dataType: 'text' },
                    'description': { type: 'text', description: 'Description', dataType: 'text' },
                    'name': { type: 'text', description: 'Name', dataType: 'text' },
                    'firstname': { type: 'text', description: 'First name', dataType: 'text' },
                    'lastname': { type: 'text', description: 'Last name', dataType: 'text' },
                    'middlename': { type: 'text', description: 'Middle name', dataType: 'text' },
                    'title': { type: 'text', description: 'Title/job title', dataType: 'text' },
                    'jobtitle': { type: 'text', description: 'Job title', dataType: 'text' },
                    'accountnumber': { type: 'text', description: 'Account number', dataType: 'text' },
                    'taxid': { type: 'text', description: 'Tax ID', dataType: 'text' },
                    'taxidnum': { type: 'text', description: 'Tax ID number', dataType: 'text' },
                    'resalenumber': { type: 'text', description: 'Resale number', dataType: 'text' },
                    'hiredate': { type: 'date', description: 'Hire date', dataType: 'date' },
                    'birthdate': { type: 'date', description: 'Birth date', dataType: 'date' },
                    'releasedate': { type: 'date', description: 'Release date', dataType: 'date' },
                    'visaexpdate': { type: 'date', description: 'Visa expiration date', dataType: 'date' },
                    'duedate': { type: 'date', description: 'Due date', dataType: 'date' },
                    'shipdate': { type: 'date', description: 'Ship date', dataType: 'date' },
                    'reversaldate': { type: 'date', description: 'Reversal date', dataType: 'date' },
                    'itemid': { type: 'text', description: 'Item ID/name', dataType: 'text' },
                    'displayname': { type: 'text', description: 'Display name', dataType: 'text' },
                    'baseprice': { type: 'number', description: 'Base price', dataType: 'number' },
                    'cost': { type: 'number', description: 'Cost', dataType: 'number' },
                    'weight': { type: 'number', description: 'Weight', dataType: 'number' },
                    'quantity': { type: 'number', description: 'Quantity', dataType: 'number' },
                    'qty': { type: 'number', description: 'Quantity', dataType: 'number' },
                    'rate': { type: 'number', description: 'Rate', dataType: 'number' },
                    'count': { type: 'number', description: 'Count', dataType: 'number' },
                    'number': { type: 'number', description: 'Number', dataType: 'number' }
                };

                // Check for exact field match
                if (fieldMappings[normalizedField]) {
                    var fieldInfo = fieldMappings[normalizedField];
                    return {
                        type: fieldInfo.type,
                        description: fieldInfo.description,
                        dataType: fieldInfo.dataType
                    };
                }

                // Special handling for ID fields - most are numeric except specific text ID fields
                if (normalizedField === 'id' || normalizedField.endsWith('id')) {
                    // These ID fields are text, not numeric
                    var textIdFields = ['tranid', 'entityid', 'itemid', 'taxid', 'taxidnum', 'accountnumber', 'resalenumber'];
                    if (textIdFields.indexOf(normalizedField) !== -1) {
                        return { type: 'text', description: 'Enter text ID', dataType: 'text' };
                    } else {
                        return { type: 'number', description: 'Enter numeric ID', dataType: 'number' };
                    }
                }

                // Fallback to generic text input
                return { type: 'text', description: 'Enter value', dataType: 'text' };
            }

            function detectQueryParameters(query) {
                if (!query || typeof query !== 'string') {
                    return {
                        hasParameters: false,
                        parameterCount: 0,
                        parameters: []
                    };
                }

                // Skip parameter detection for CREATE OR REPLACE statements
                const trimmedQuery = query.trim();
                if (/^CREATE\\s+OR\\s+REPLACE\\s+(FUNCTION|PROCEDURE)/i.test(trimmedQuery)) {
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
                // Get surrounding text (100 characters before and after for better context)
                const start = Math.max(0, position - 100);
                const end = Math.min(query.length, position + 100);
                const context = query.substring(start, end);

                // Try to extract table and field information from the SQL context
                var tableAndField = extractTableAndFieldFromContext(context, position - start);

                if (tableAndField.tableName && tableAndField.fieldName) {
                    // Use NetSuite field metadata for accurate type detection
                    var parameterType = getParameterTypeFromField(tableAndField.tableName, tableAndField.fieldName);
                    return {
                        type: parameterType.type,
                        description: parameterType.description,
                        dataType: parameterType.dataType,
                        tableName: tableAndField.tableName,
                        fieldName: tableAndField.fieldName
                    };
                }

                // Fallback to pattern-based detection if we can't identify the field
                return getParameterContextFallback(context.toLowerCase());
            }

            function extractTableAndFieldFromContext(context, paramPosition) {
                var result = { tableName: null, fieldName: null };

                try {
                    // Look for patterns like "fieldname = ?" or "table.fieldname = ?"
                    var beforeParam = context.substring(0, paramPosition).trim();

                    // Pattern 1: "fieldname = ?" or "fieldname IN (?)" or "fieldname LIKE ?"
                    var fieldMatch = beforeParam.match(/(\\w+\\.)?(\\w+)\\s*(?:=|IN|LIKE|>|<|>=|<=|!=|<>)\\s*$/i);
                    if (fieldMatch) {
                        result.fieldName = fieldMatch[2];
                        if (fieldMatch[1]) {
                            // Remove the dot from "table."
                            result.tableName = fieldMatch[1].replace('.', '');
                        }
                    }

                    // Pattern 2: Look for FROM clause to identify table if not found in field reference
                    if (!result.tableName) {
                        var fromMatch = context.match(/FROM\\s+(\\w+)/i);
                        if (fromMatch) {
                            result.tableName = fromMatch[1];
                        }
                    }

                    // Pattern 3: Look for JOIN clauses for additional table context
                    if (!result.tableName) {
                        var joinMatch = context.match(/JOIN\\s+(\\w+)/i);
                        if (joinMatch) {
                            result.tableName = joinMatch[1];
                        }
                    }

                } catch (e) {
                    // If parsing fails, return null values
                }

                return result;
            }

            function getParameterContextFallback(context) {
                // Default context
                let type = 'text';
                let description = 'Enter value';

                // Look for date-related keywords
                if (context.includes('date') || context.includes('created') || context.includes('modified') ||
                    context.includes('lastmodified') || context.includes('datecreated')) {
                    type = 'date';
                    description = 'Select date';
                }
                // Look for amount/currency contexts (but not "id" since many text fields contain "id")
                else if (context.includes('amount') || context.includes('total') || context.includes('cost') ||
                         context.includes('price') || context.includes('balance') || context.includes('limit') ||
                         context.includes('count') || context.includes('qty') || context.includes('quantity')) {
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
                         context.includes('isinactive') || context.includes('is_inactive') || context.includes('voided') ||
                         context.includes('approved') || context.includes('taxable')) {
                    type = 'select';
                    description = 'Select true/false';
                }

                return {
                    type: type,
                    description: description,
                    dataType: type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'
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
               getHandleStoredProcedureResponseJS() + '\n' +
               getHandleDMLResponseJS() + '\n' +
               getHandleCreateStatementResponseJS() + '\n' +
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
        getHandleStoredProcedureResponseJS: getHandleStoredProcedureResponseJS,
        getHandleDMLResponseJS: getHandleDMLResponseJS,
        getHandleCreateStatementResponseJS: getHandleCreateStatementResponseJS,
        getHandleQueryErrorJS: getHandleQueryErrorJS,
        getQueryParameterHelpersJS: getQueryParameterHelpersJS,
        getQueryValidationJS: getQueryValidationJS,
        getResponseGenerateJS: getResponseGenerateJS,
        getParameterDetectionJS: getParameterDetectionJS,
        getAllQueryExecutionJS: getAllQueryExecutionJS
    };
    
});
