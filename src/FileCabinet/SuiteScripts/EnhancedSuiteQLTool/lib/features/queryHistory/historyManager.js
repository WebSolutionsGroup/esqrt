/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Query History Manager
 * 
 * This module handles query history functionality including
 * storing, retrieving, and managing the query history list.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the query history update JavaScript
     * 
     * @returns {string} JavaScript code for updating query history
     */
    function getUpdateQueryHistoryJS() {
        return `
            function updateQueryHistory(query, executionTime, recordCount, success, errorMessage, resultFormat) {
                if (!query || query.trim() === '') return;

                // Update local history for immediate UI feedback
                queryHistory = queryHistory.filter(item => item.query !== query);

                // Add to beginning of array
                queryHistory.unshift({
                    query: query,
                    timestamp: new Date().toISOString(),
                    preview: query.substring(0, ` + constants.CONFIG.UI.QUERY_HISTORY.PREVIEW_LENGTH + `) + (query.length > ` + constants.CONFIG.UI.QUERY_HISTORY.PREVIEW_LENGTH + ` ? '...' : ''),
                    executionTime: executionTime,
                    recordCount: recordCount,
                    success: success,
                    errorMessage: errorMessage
                });

                // Keep only the last ` + constants.CONFIG.UI.QUERY_HISTORY.MAX_ITEMS + ` items
                if (queryHistory.length > ` + constants.CONFIG.UI.QUERY_HISTORY.MAX_ITEMS + `) {
                    queryHistory = queryHistory.slice(0, ` + constants.CONFIG.UI.QUERY_HISTORY.MAX_ITEMS + `);
                }

                // Update the UI immediately for better UX
                renderQueryHistory();

                // Note: Query history is automatically saved server-side during query execution
                // No need to save again from client-side to avoid duplicates
            }

            function getSessionId() {
                let sessionId = sessionStorage.getItem('suiteql-session-id');
                if (!sessionId) {
                    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    sessionStorage.setItem('suiteql-session-id', sessionId);
                }
                return sessionId;
            }

            function saveQueryToHistory(historyData) {

                // Create request payload for server-side function
                const requestPayload = {
                    'function': 'queryHistorySave',
                    queryContent: historyData.queryContent,
                    executionTime: historyData.executionTime,
                    recordCount: historyData.recordCount,
                    success: historyData.success,
                    errorMessage: historyData.errorMessage,
                    resultFormat: historyData.resultFormat,
                    sessionId: historyData.sessionId
                };

                // Make POST request to server-side function
                fetch(window.location.href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestPayload)
                }).then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          console.log('History saved to NetSuite:', data);
                      } else {
                          console.warn('Failed to save to NetSuite history:', data.error);
                      }
                  })
                  .catch(error => {
                      console.warn('Failed to save to NetSuite history:', error);
                  });
            }
        `;
    }
    
    /**
     * Generate the query history rendering JavaScript
     * 
     * @returns {string} JavaScript code for rendering query history
     */
    function getRenderQueryHistoryJS() {
        return `
            function renderQueryHistory() {
                const historyList = document.getElementById('` + constants.ELEMENT_IDS.QUERY_HISTORY_LIST + `');
                if (!historyList) return;
                
                if (queryHistory.length === 0) {
                    historyList.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary); font-size: 11px;">No query history</div>';
                    return;
                }
                
                let html = '';
                queryHistory.forEach((item, index) => {
                    const date = new Date(item.timestamp);
                    const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    html += \`
                        <div class="` + constants.CSS_CLASSES.QUERY_HISTORY_ITEM + `" style="position: relative; padding-right: 30px;">
                            <div onclick="loadFromHistory(\${index})" title="\${item.query}" style="cursor: pointer;">
                                <div style="font-size: 10px; color: var(--codeoss-text-secondary); margin-bottom: 2px;">\${timeStr}</div>
                                <div style="font-size: 11px; line-height: 1.3;">\${item.preview}</div>
                            </div>
                            \${item.id ? \`<button type="button" class="codeoss-btn-icon" onclick="deleteHistoryRecord('\${item.id}', \${index})" title="Delete History" style="position: absolute; top: 2px; right: 2px; font-size: 10px; padding: 2px 4px;">🗑️</button>\` : ''}
                        </div>
                    \`;
                });
                
                historyList.innerHTML = html;
            }
        `;
    }
    
    /**
     * Generate the load from history JavaScript
     * 
     * @returns {string} JavaScript code for loading queries from history
     */
    function getLoadFromHistoryJS() {
        return `
            function loadFromHistory(index) {
                if (index < 0 || index >= queryHistory.length) return;
                
                const historyItem = queryHistory[index];
                if (codeEditor) {
                    codeEditor.setValue(historyItem.query);
                    codeEditor.focus();
                } else {
                    document.getElementById('` + constants.ELEMENT_IDS.QUERY_TEXTAREA + `').value = historyItem.query;
                }
                
                // Update file info
                activeSQLFile = {
                    name: 'From History',
                    description: 'Loaded from query history',
                    originalContent: historyItem.query
                };
                fileInfoRefresh();
            }
        `;
    }
    
    /**
     * Generate the initialize query history JavaScript
     * 
     * @returns {string} JavaScript code for initializing query history
     */
    function getInitializeQueryHistoryJS() {
        return `
            function initializeQueryHistory() {
                // Load from NetSuite custom records only
                loadQueryHistoryFromNetSuite().catch(function(error) {
                    console.error('Failed to load query history from NetSuite custom records:', error);
                    // Initialize empty history if NetSuite load fails
                    queryHistory = [];
                    renderQueryHistory();
                });
            }

            function loadQueryHistoryFromNetSuite() {
                // console.log('Loading query history from NetSuite...');

                // Create request payload for server-side function
                const requestPayload = {
                    'function': 'queryHistoryList',
                    limit: 50,
                    uniqueOnly: false
                };

                // Make POST request to server-side function
                return fetch(window.location.href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestPayload)
                }).then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          // Convert NetSuite history format to UI format
                          queryHistory = (data.history || []).map(item => ({
                              id: item.id,
                              query: item.queryContent || item.query,
                              timestamp: item.executedDate || item.timestamp,
                              preview: (item.queryContent || item.query || '').substring(0, ` + constants.CONFIG.UI.QUERY_HISTORY.PREVIEW_LENGTH + `) +
                                      ((item.queryContent || item.query || '').length > ` + constants.CONFIG.UI.QUERY_HISTORY.PREVIEW_LENGTH + ` ? '...' : ''),
                              executionTime: item.executionTime,
                              recordCount: item.recordCount,
                              success: item.success,
                              errorMessage: item.errorMessage
                          }));
                          renderQueryHistory();
                          return data;
                      } else {
                          throw new Error(data.error || 'Failed to load query history from NetSuite');
                      }
                  });
            }
        `;
    }
    
    /**
     * Generate the delete history record JavaScript
     *
     * @returns {string} JavaScript code for deleting individual history records
     */
    function getDeleteHistoryRecordJS() {
        return `
            function deleteHistoryRecord(recordId, index) {
                if (!confirm('Are you sure you want to delete this query from history?')) {
                    return;
                }

                // Remove from local array immediately for UI feedback
                if (index >= 0 && index < queryHistory.length) {
                    queryHistory.splice(index, 1);
                    renderQueryHistory();
                }

                // Delete from NetSuite custom record
                const requestPayload = {
                    'function': 'queryHistoryDelete',
                    recordId: recordId
                };

                fetch(window.location.href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestPayload)
                }).then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          console.log('History record deleted from NetSuite:', recordId);
                      } else {
                          console.warn('Failed to delete from NetSuite history:', data.error);
                          alert('Failed to delete from NetSuite history: ' + data.error);
                          // Reload history from NetSuite to restore UI state
                          loadQueryHistoryFromNetSuite();
                      }
                  })
                  .catch(error => {
                      console.warn('Failed to delete from NetSuite history:', error);
                      alert('Failed to delete from NetSuite history due to network error.');
                      // Reload history from NetSuite to restore UI state
                      loadQueryHistoryFromNetSuite();
                  });
            }
        `;
    }

    /**
     * Generate the clear query history JavaScript
     *
     * @returns {string} JavaScript code for clearing query history
     */
    function getClearQueryHistoryJS() {
        return `
            function clearQueryHistory() {
                if (confirm('Are you sure you want to clear all query history? This will permanently delete all your query history from NetSuite.')) {
                    // Clear local history immediately for UI feedback
                    queryHistory = [];
                    renderQueryHistory();

                    // Clear NetSuite custom records
                    const requestPayload = {
                        'function': 'queryHistoryClear'
                    };

                    fetch(window.location.href, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestPayload)
                    }).then(response => response.json())
                      .then(data => {
                          if (data.success) {
                              console.log('Query history cleared from NetSuite:', data.deletedCount, 'records deleted');
                          } else {
                              console.warn('Failed to clear NetSuite history:', data.error);
                              alert('Failed to clear NetSuite history: ' + data.error);
                              // Reload history from NetSuite to restore UI state
                              loadQueryHistoryFromNetSuite();
                          }
                      })
                      .catch(error => {
                          console.warn('Failed to clear NetSuite history:', error);
                          alert('Failed to clear NetSuite history due to network error.');
                          // Reload history from NetSuite to restore UI state
                          loadQueryHistoryFromNetSuite();
                      });
                }
            }
        `;
    }

    /**
     * Generate the export query history JavaScript
     * 
     * @returns {string} JavaScript code for exporting query history
     */
    function getExportQueryHistoryJS() {
        return `
            function exportQueryHistory() {
                if (queryHistory.length === 0) {
                    alert('No query history to export.');
                    return;
                }
                
                const exportData = {
                    exportDate: new Date().toISOString(),
                    tool: 'Enhanced SuiteQL Query Tool',
                    version: '` + constants.CONFIG.VERSION + `',
                    queries: queryHistory
                };
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = 'suiteql-query-history-' + new Date().toISOString().split('T')[0] + '.json';
                link.click();
            }
        `;
    }
    
    /**
     * Generate the import query history JavaScript
     * 
     * @returns {string} JavaScript code for importing query history
     */
    function getImportQueryHistoryJS() {
        return `
            function importQueryHistory() {
                alert('Import functionality is not available when using NetSuite custom records for query history. Query history is automatically synchronized with your NetSuite account.');
            }
        `;
    }
    
    /**
     * Get all query history JavaScript functions
     *
     * @returns {string} Complete JavaScript code for query history functionality
     */
    function getAllQueryHistoryJS() {
        return getUpdateQueryHistoryJS() + '\n' +
               getRenderQueryHistoryJS() + '\n' +
               getLoadFromHistoryJS() + '\n' +
               getInitializeQueryHistoryJS() + '\n' +
               getDeleteHistoryRecordJS() + '\n' +
               getClearQueryHistoryJS() + '\n' +
               getExportQueryHistoryJS() + '\n' +
               getImportQueryHistoryJS();
    }
    
    /**
     * Export the query history functions
     */
    return {
        getUpdateQueryHistoryJS: getUpdateQueryHistoryJS,
        getRenderQueryHistoryJS: getRenderQueryHistoryJS,
        getLoadFromHistoryJS: getLoadFromHistoryJS,
        getInitializeQueryHistoryJS: getInitializeQueryHistoryJS,
        getDeleteHistoryRecordJS: getDeleteHistoryRecordJS,
        getClearQueryHistoryJS: getClearQueryHistoryJS,
        getExportQueryHistoryJS: getExportQueryHistoryJS,
        getImportQueryHistoryJS: getImportQueryHistoryJS,
        getAllQueryHistoryJS: getAllQueryHistoryJS
    };
    
});
