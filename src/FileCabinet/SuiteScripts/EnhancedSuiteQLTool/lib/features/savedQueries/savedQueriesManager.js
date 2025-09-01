/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Saved Queries Manager
 * 
 * This module handles saved queries functionality including
 * storing, retrieving, and managing saved queries using NetSuite custom records.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([], function() {
    
    /**
     * Generate the saved queries management JavaScript
     * 
     * @returns {string} JavaScript code for saved queries management
     */
    function getSavedQueriesManagementJS() {
        return `
            // Saved queries state
            var savedQueries = [];
            var currentSavedQueryId = null;
            
            function saveCurrentQuery() {
                const query = codeEditor ? codeEditor.getValue() : '';
                if (!query || query.trim() === '') {
                    if (typeof showStatusMessage === 'function') {
                        showStatusMessage('Please enter a query before saving.');
                    } else {
                        alert('Please enter a query before saving.');
                    }
                    return;
                }

                // Use the current tab title if available, otherwise generate a default title
                let title = 'Query';
                if (typeof getCurrentTab === 'function') {
                    const currentTab = getCurrentTab();
                    if (currentTab && currentTab.title) {
                        title = currentTab.title;
                    }
                }

                const queryData = {
                    title: title,
                    content: query.trim(),
                    description: '',
                    tags: '',
                    favorite: false
                };

                // Save to NetSuite custom record
                saveQueryToNetSuite(queryData, true); // Pass true for silent mode

                // Refresh saved queries list
                loadSavedQueries();
            }
            
            function saveQueryToNetSuite(queryData, silent) {

                // Create request payload for server-side function
                const requestPayload = {
                    'function': 'savedQuerySave',
                    title: queryData.title,
                    content: queryData.content,
                    description: queryData.description,
                    tags: queryData.tags,
                    favorite: queryData.favorite
                };

                // Only include category if we have a valid value
                if (queryData.category && queryData.category.trim() !== '') {
                    requestPayload.category = queryData.category;
                }

                // Only include sharing level if we have a valid value
                if (queryData.sharingLevel && queryData.sharingLevel.trim() !== '') {
                    requestPayload.sharingLevel = queryData.sharingLevel;
                }

                // Make POST request to server-side function
                fetch(window.location.href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestPayload)
                }).then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          console.log('Query saved to NetSuite:', data);

                          // Update the current tab's savedQueryId so future saves will be updates
                          if (typeof getCurrentTab === 'function' && data.recordId) {
                              const currentTab = getCurrentTab();
                              if (currentTab) {
                                  currentTab.savedQueryId = data.recordId;
                                  console.log('Updated tab savedQueryId:', {
                                      tabId: currentTab.id,
                                      title: currentTab.title,
                                      savedQueryId: data.recordId
                                  });
                              }
                          }

                          if (!silent) {
                              // Use status message instead of alert for better UX
                              if (typeof showStatusMessage === 'function') {
                                  showStatusMessage('Query saved successfully!');
                              } else {
                                  alert('Query saved successfully!');
                              }
                          }
                          loadSavedQueries(); // Refresh the list
                      } else {
                          throw new Error(data.error || 'Unknown error saving query');
                      }
                  })
                  .catch(error => {
                      console.error('Failed to save to NetSuite:', error);
                      if (!silent) {
                          // Use status message instead of alert for better UX
                          if (typeof showStatusMessage === 'function') {
                              showStatusMessage('Failed to save query: ' + error.message);
                          } else {
                              alert('Failed to save query: ' + error.message);
                          }
                      }
                  });
            }
            

            
            function loadSavedQueries() {
                // Load from NetSuite custom records
                loadSavedQueriesFromNetSuite();
            }
            
            function loadSavedQueriesFromNetSuite() {
                console.log('Loading saved queries from NetSuite...');

                // Create request payload for server-side function
                const requestPayload = {
                    'function': 'savedQueriesList',
                    includeShared: true,
                    limit: 100
                };

                // Make POST request to server-side function
                fetch(window.location.href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestPayload)
                }).then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          savedQueries = data.queries || [];
                          renderSavedQueries();
                      } else {
                          throw new Error(data.error || 'Unknown error loading queries');
                      }
                  })
                  .catch(error => {
                      console.error('Failed to load from NetSuite:', error);
                      if (typeof showStatusMessage === 'function') {
                          showStatusMessage('Failed to load saved queries: ' + error.message);
                      } else {
                          alert('Failed to load saved queries: ' + error.message);
                      }
                      savedQueries = [];
                      renderSavedQueries();
                  });
            }
            

            
            function loadSavedQuery(queryId) {
                const query = savedQueries.find(q => q.id == queryId); // Use == for type coercion
                if (!query) {
                    if (typeof showStatusMessage === 'function') {
                        showStatusMessage('Saved query not found.');
                    } else {
                        alert('Saved query not found.');
                    }
                    return;
                }

                // If using query tabs, load into a new tab
                if (typeof loadQueryIntoTab === 'function') {
                    loadQueryIntoTab(query);
                } else {
                    // Fallback to direct editor loading
                    if (codeEditor) {
                        codeEditor.setValue(query.content);
                    }
                }

                currentSavedQueryId = queryId;
            }
            
            function deleteSavedQuery(queryId) {
                if (!confirm('Are you sure you want to delete this saved query?')) {
                    return;
                }
                
                try {
                    // Try to delete from NetSuite first
                    deleteSavedQueryFromNetSuite(queryId);
                } catch(e) {
                    console.warn('Could not delete from NetSuite, deleting from localStorage:', e);
                    deleteSavedQueryFromLocalStorage(queryId);
                }
            }
            
            function deleteSavedQueryFromNetSuite(queryId) {
                console.log('Deleting saved query from NetSuite:', queryId);

                // Create request payload for server-side function
                const requestPayload = {
                    'function': 'savedQueryDelete',
                    recordId: queryId
                };

                // Make POST request to server-side function
                fetch(window.location.href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestPayload)
                }).then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          loadSavedQueries();
                      } else {
                          throw new Error(data.error || 'Unknown error deleting query');
                      }
                  })
                  .catch(error => {
                      console.warn('Failed to delete from NetSuite:', error);
                      if (typeof showStatusMessage === 'function') {
                          showStatusMessage('Failed to delete query: ' + error.message);
                      } else {
                          alert('Failed to delete query: ' + error.message);
                      }
                      deleteSavedQueryFromLocalStorage(queryId);
                  });
            }
            

            
            function renderSavedQueries() {
                const container = document.getElementById('savedQueriesContainer');
                if (!container) return;
                
                if (savedQueries.length === 0) {
                    container.innerHTML = '<div class="codeoss-empty-state">No saved queries yet. Save your first query!</div>';
                    return;
                }
                
                let html = '';
                savedQueries.forEach(query => {
                    const createdDate = new Date(query.createdDate || query.lastModified).toLocaleDateString();
                    html += \`
                        <div class="codeoss-saved-query-item" data-query-id="\${query.id}">
                            <div class="codeoss-saved-query-header">
                                <h4 class="codeoss-saved-query-title">\${query.title}</h4>
                                <div class="codeoss-saved-query-actions">
                                    <button type="button" class="codeoss-btn-icon" onclick="loadSavedQuery('\${query.id}')" title="Load Query">📂</button>
                                    <button type="button" class="codeoss-btn-icon" onclick="deleteSavedQuery('\${query.id}')" title="Delete Query">🗑️</button>
                                </div>
                            </div>
                            <div class="codeoss-saved-query-meta">
                                <span class="codeoss-saved-query-date">\${createdDate}</span>
                                \${query.tags ? '<span class="codeoss-saved-query-tags">' + query.tags + '</span>' : ''}
                            </div>
                            \${query.description ? '<div class="codeoss-saved-query-description">' + query.description + '</div>' : ''}
                            <div class="codeoss-saved-query-preview">\${query.content.substring(0, 100)}\${query.content.length > 100 ? '...' : ''}</div>
                        </div>
                    \`;
                });
                
                container.innerHTML = html;
            }
        `;
    }
    
    /**
     * Generate the saved queries initialization JavaScript
     * 
     * @returns {string} JavaScript code for initializing saved queries
     */
    function getSavedQueriesInitJS() {
        return `
            function initializeSavedQueries() {
                // Load saved queries on startup
                loadSavedQueries();
                
                // Add keyboard shortcut for saving (Ctrl+S)
                document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.key === 's') {
                        e.preventDefault();
                        saveCurrentQuery();
                    }
                });
            }
        `;
    }
    
    /**
     * Get all saved queries JavaScript functions
     * 
     * @returns {string} Complete JavaScript code for saved queries functionality
     */
    function getAllSavedQueriesJS() {
        return getSavedQueriesManagementJS() + '\n' + getSavedQueriesInitJS();
    }
    
    /**
     * Export the saved queries functions
     */
    return {
        getSavedQueriesManagementJS: getSavedQueriesManagementJS,
        getSavedQueriesInitJS: getSavedQueriesInitJS,
        getAllSavedQueriesJS: getAllSavedQueriesJS
    };
    
});
