/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Query Tabs
 * 
 * This module handles the query tabs functionality including
 * tab creation, switching, closing, and content management.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the query tabs HTML structure
     * 
     * @returns {string} HTML string for the query tabs bar
     */
    function getQueryTabsHTML() {
        return `
            <!-- Query Tabs Bar -->
            <div class="codeoss-tabs-container">
                <div class="codeoss-tabs-bar" id="queryTabsBar">
                    <!-- Tabs and add button will be dynamically added here -->
                </div>
                <div class="codeoss-tabs-actions">
                    <button type="button" class="codeoss-tab-action-btn" onclick="closeAllQueryTabs()" title="Close All Tabs">✕</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate the query tabs management JavaScript
     * 
     * @returns {string} JavaScript code for query tabs management
     */
    function getQueryTabsManagementJS() {
        return `
            // Query tabs state management
            var queryTabs = [];
            var activeTabId = null;
            var tabCounter = 1;
            
            // Tab data structure
            function createTab(id, title, content) {
                return {
                    id: id || 'tab_' + Date.now(),
                    title: title || 'Untitled',
                    content: content || '',
                    isDirty: false,
                    isActive: false,
                    // Results storage for this tab
                    results: {
                        hasResults: false,
                        resultsHTML: '',
                        welcomeVisible: true,
                        statusText: 'Ready',
                        queryResultsHeader: 'Query Results',
                        responsePayload: null,
                        copyButtonVisible: false,
                        csvButtonsVisible: false
                    }
                };
            }
            
            function addNewQueryTab(title, content) {
                const tabId = 'tab_' + Date.now();

                // If no tabs exist, reset counter to 1
                if (queryTabs.length === 0) {
                    tabCounter = 1;
                }

                const tabTitle = title || 'Untitled ' + tabCounter++;
                const tabContent = content || '';

                const newTab = createTab(tabId, tabTitle, tabContent);
                queryTabs.push(newTab);

                renderQueryTabs();
                switchToTab(tabId);
                updateToolbarTabName();

                return tabId;
            }
            
            function closeQueryTab(tabId) {
                const tabIndex = queryTabs.findIndex(tab => tab.id === tabId);
                if (tabIndex === -1) return;
                
                const tab = queryTabs[tabIndex];
                
                // Check if tab has unsaved changes
                if (tab.isDirty) {
                    if (!confirm('This tab has unsaved changes. Are you sure you want to close it?')) {
                        return;
                    }
                }
                
                // Remove tab
                queryTabs.splice(tabIndex, 1);
                
                // If this was the active tab, switch to another
                if (activeTabId === tabId) {
                    if (queryTabs.length > 0) {
                        // Switch to the previous tab or the first one
                        const newActiveIndex = Math.max(0, tabIndex - 1);
                        switchToTab(queryTabs[newActiveIndex].id);
                    } else {
                        // No tabs left, create a new one
                        addNewQueryTab();
                    }
                }
                
                renderQueryTabs();
                saveTabsToStorage();
            }
            
            function closeAllQueryTabs() {
                const dirtyTabs = queryTabs.filter(tab => tab.isDirty);
                if (dirtyTabs.length > 0) {
                    if (!confirm('Some tabs have unsaved changes. Are you sure you want to close all tabs?')) {
                        return;
                    }
                }
                
                queryTabs = [];
                activeTabId = null;
                tabCounter = 1; // Reset counter when all tabs are closed
                addNewQueryTab();
            }
            
            function switchToTab(tabId, skipSaveCurrentTab = false) {
                // Save current tab content and results before switching (unless we're initializing)
                if (!skipSaveCurrentTab && activeTabId && codeEditor && typeof codeEditor.getValue === 'function') {
                    const currentTab = queryTabs.find(tab => tab.id === activeTabId);
                    if (currentTab && !currentTab.isTableDetails) {
                        currentTab.content = codeEditor.getValue();

                        // Ensure current tab has results structure and save current results state
                        ensureTabHasResults(currentTab);
                        saveCurrentTabResults(currentTab);
                    }
                }

                // Update active tab
                queryTabs.forEach(tab => {
                    tab.isActive = tab.id === tabId;
                });

                activeTabId = tabId;

                // Load tab content based on tab type
                const activeTab = queryTabs.find(tab => tab.id === tabId);
                if (activeTab) {
                    if (activeTab.isTableDetails && activeTab.isHtmlContent) {
                        // Hide all query-related UI elements
                        const editorContainer = document.querySelector('.codeoss-editor-container');
                        const resultsContainer = document.querySelector('.codeoss-results-container');
                        const resizer = document.getElementById('editorResizer');

                        if (editorContainer) {
                            editorContainer.style.display = 'none';
                        }
                        if (resultsContainer) {
                            resultsContainer.style.display = 'none';
                        }
                        if (resizer) {
                            resizer.style.display = 'none';
                        }

                        // Create or get the table details container that takes full space
                        let tableDetailsContainer = document.getElementById('table-details-container');
                        if (!tableDetailsContainer) {
                            tableDetailsContainer = document.createElement('div');
                            tableDetailsContainer.id = 'table-details-container';
                            tableDetailsContainer.style.cssText = 'flex: 1; height: 100%; overflow: auto; background: var(--codeoss-bg);';

                            // Insert into the editor area (parent of editor container)
                            const editorArea = document.querySelector('.codeoss-editor-area');
                            if (editorArea) {
                                editorArea.appendChild(tableDetailsContainer);
                            }
                        }

                        tableDetailsContainer.innerHTML = activeTab.content;
                        tableDetailsContainer.style.display = 'block';
                    } else {
                        // Show normal query UI for regular SQL tabs
                        const editorContainer = document.querySelector('.codeoss-editor-container');
                        const resultsContainer = document.querySelector('.codeoss-results-container');
                        const resizer = document.getElementById('editorResizer');
                        const tableDetailsContainer = document.getElementById('table-details-container');

                        if (editorContainer) {
                            editorContainer.style.display = 'flex';
                        }
                        if (resultsContainer) {
                            resultsContainer.style.display = 'flex';
                        }
                        if (resizer) {
                            resizer.style.display = 'block';
                        }
                        if (tableDetailsContainer) {
                            tableDetailsContainer.style.display = 'none';
                        }

                        if (codeEditor && typeof codeEditor.setValue === 'function') {
                            codeEditor.setValue(activeTab.content);

                            // Ensure the editor is refreshed and focused
                            setTimeout(function() {
                                if (codeEditor && typeof codeEditor.refresh === 'function') {
                                    codeEditor.refresh();
                                }
                            }, 50);
                        } else {
                            // Fallback to textarea if CodeMirror isn't ready
                            const textarea = document.getElementById('` + constants.ELEMENT_IDS.QUERY_TEXTAREA + `');
                            if (textarea) {
                                textarea.value = activeTab.content;
                            }

                            // If CodeMirror isn't ready, try again after a short delay
                            setTimeout(function() {
                                if (codeEditor && typeof codeEditor.setValue === 'function') {
                                    codeEditor.setValue(activeTab.content);
                                    if (typeof codeEditor.refresh === 'function') {
                                        codeEditor.refresh();
                                    }
                                }
                            }, 100);
                        }

                        // Ensure active tab has results structure and restore results for this tab
                        ensureTabHasResults(activeTab);
                        restoreTabResults(activeTab);
                    }
                }

                // Update the toolbar tab name display
                updateToolbarTabName();

                renderQueryTabs();
                saveTabsToStorage();
            }
            
            function renameTab(tabId, newTitle) {
                const tab = queryTabs.find(tab => tab.id === tabId);
                if (tab) {
                    tab.title = newTitle;
                    renderQueryTabs();
                    updateToolbarTabName();
                    saveTabsToStorage();
                }
            }
            
            function markTabDirty(tabId, isDirty) {
                const tab = queryTabs.find(tab => tab.id === tabId);
                if (tab) {
                    tab.isDirty = isDirty;
                    renderQueryTabs();
                }
            }

            // Results management functions for tabs
            function ensureTabHasResults(tab) {
                if (!tab) return;
                if (!tab.results) {
                    tab.results = {
                        hasResults: false,
                        resultsHTML: '',
                        welcomeVisible: true,
                        statusText: 'Ready',
                        queryResultsHeader: 'Query Results',
                        responsePayload: null,
                        copyButtonVisible: false,
                        csvButtonsVisible: false
                    };
                }
            }

            function saveCurrentTabResults(tab) {
                if (!tab) {
                    console.warn('saveCurrentTabResults: No tab provided');
                    return;
                }

                // Ensure tab has results structure
                ensureTabHasResults(tab);

                try {
                    // Save current results state
                    const resultsDiv = document.getElementById('` + constants.ELEMENT_IDS.RESULTS_DIV + `');
                    const welcomeMessage = document.getElementById('` + constants.ELEMENT_IDS.WELCOME_MESSAGE + `');
                    const statusText = document.getElementById('` + constants.ELEMENT_IDS.STATUS_TEXT + `');
                    const queryResultsHeader = document.getElementById('` + constants.ELEMENT_IDS.QUERY_RESULTS_HEADER + `');
                    const copyButton = document.getElementById('` + constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN + `');
                    const downloadCSVBtn = document.getElementById('downloadCSVBtn');
                    const copyCSVBtn = document.getElementById('copyCSVBtn');

                    if (resultsDiv && welcomeMessage && statusText && queryResultsHeader) {
                        tab.results.hasResults = resultsDiv.style.display !== 'none';
                        tab.results.resultsHTML = resultsDiv.innerHTML;
                        tab.results.welcomeVisible = welcomeMessage.style.display !== 'none';
                        tab.results.statusText = statusText.textContent;
                        tab.results.queryResultsHeader = queryResultsHeader.textContent;
                        tab.results.responsePayload = window.queryResponsePayload || null;
                        tab.results.copyButtonVisible = copyButton ? copyButton.style.display !== 'none' : false;
                        tab.results.csvButtonsVisible = downloadCSVBtn ? downloadCSVBtn.style.display !== 'none' : false;
                    }
                } catch (error) {
                    console.error('Error saving tab results:', error);
                }
            }

            function restoreTabResults(tab) {
                if (!tab) {
                    console.warn('restoreTabResults: No tab provided');
                    return;
                }

                // Ensure tab has results structure
                ensureTabHasResults(tab);

                try {
                    // Restore results state for this tab
                    const resultsDiv = document.getElementById('` + constants.ELEMENT_IDS.RESULTS_DIV + `');
                    const welcomeMessage = document.getElementById('` + constants.ELEMENT_IDS.WELCOME_MESSAGE + `');
                    const statusText = document.getElementById('` + constants.ELEMENT_IDS.STATUS_TEXT + `');
                    const queryResultsHeader = document.getElementById('` + constants.ELEMENT_IDS.QUERY_RESULTS_HEADER + `');
                    const copyButton = document.getElementById('` + constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN + `');
                    const downloadCSVBtn = document.getElementById('downloadCSVBtn');
                    const copyCSVBtn = document.getElementById('copyCSVBtn');

                    if (resultsDiv && welcomeMessage && statusText && queryResultsHeader) {
                        // Restore results content
                        resultsDiv.innerHTML = tab.results.resultsHTML || '';
                        resultsDiv.style.display = tab.results.hasResults ? 'flex' : 'none';
                        welcomeMessage.style.display = tab.results.welcomeVisible ? 'block' : 'none';
                        statusText.textContent = tab.results.statusText || 'Ready';
                        queryResultsHeader.textContent = tab.results.queryResultsHeader || 'Query Results';

                        // Restore global query response payload
                        window.queryResponsePayload = tab.results.responsePayload;

                        // Restore button states
                        if (copyButton) {
                            copyButton.style.display = tab.results.copyButtonVisible ? 'inline-block' : 'none';
                        }
                        if (downloadCSVBtn) {
                            downloadCSVBtn.style.display = tab.results.csvButtonsVisible ? 'none' : 'none'; // CSV buttons are typically hidden for table format
                        }
                        if (copyCSVBtn) {
                            copyCSVBtn.style.display = tab.results.csvButtonsVisible ? 'none' : 'none';
                        }
                    }
                } catch (error) {
                    console.error('Error restoring tab results:', error);
                }
            }
            
            function getCurrentTab() {
                return queryTabs.find(tab => tab.id === activeTabId);
            }
            
            function getAllTabs() {
                return queryTabs;
            }

            function updateToolbarTabName() {
                const currentTab = getCurrentTab();
                const tabNameElement = document.getElementById('currentTabName');
                if (tabNameElement && currentTab) {
                    tabNameElement.textContent = currentTab.title;
                    tabNameElement.title = 'Double-click to edit: ' + currentTab.title;
                }
            }

            function startInlineTabEdit() {
                const currentTab = getCurrentTab();
                if (!currentTab) return;

                const tabNameElement = document.getElementById('currentTabName');
                if (!tabNameElement) return;

                // Create input element
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentTab.title;
                input.style.cssText = \`
                    font-size: 12px;
                    color: var(--codeoss-text-primary);
                    background-color: var(--codeoss-editor-bg);
                    border: 1px solid var(--codeoss-accent);
                    border-radius: 3px;
                    padding: 4px 8px;
                    min-width: 120px;
                    outline: none;
                \`;

                // Replace the span with input
                tabNameElement.style.display = 'none';
                tabNameElement.parentNode.insertBefore(input, tabNameElement);

                // Focus and select all text
                input.focus();
                input.select();

                // Handle save on Enter or blur
                function saveEdit() {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== currentTab.title) {
                        renameTab(currentTab.id, newTitle);

                        // Auto-save to saved queries (seamless save)
                        autoSaveTabQuery(currentTab.id);
                    }

                    // Remove input and show span
                    input.remove();
                    tabNameElement.style.display = '';
                    updateToolbarTabName();
                }

                // Handle cancel on Escape
                function cancelEdit() {
                    input.remove();
                    tabNameElement.style.display = '';
                }

                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEdit();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEdit();
                    }
                });
            }

            function startInlineTabEditOnTab(tabId, event) {
                // Prevent the tab switch from happening
                event.stopPropagation();

                const tab = queryTabs.find(t => t.id === tabId);
                if (!tab) return;

                const tabElement = event.target;
                if (!tabElement) return;

                // Create input element
                const input = document.createElement('input');
                input.type = 'text';
                input.value = tab.title;
                input.style.cssText = \`
                    font-size: 12px;
                    color: var(--codeoss-text-primary);
                    background-color: var(--codeoss-editor-bg);
                    border: 1px solid var(--codeoss-accent);
                    border-radius: 3px;
                    padding: 4px 8px;
                    width: 100%;
                    outline: none;
                    box-sizing: border-box;
                \`;

                // Store original content
                const originalContent = tabElement.innerHTML;

                // Replace the span content with input
                tabElement.innerHTML = '';
                tabElement.appendChild(input);

                // Focus and select all text
                input.focus();
                input.select();

                // Handle save on Enter or blur
                function saveEdit() {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== tab.title) {
                        renameTab(tabId, newTitle);

                        // Auto-save to saved queries (seamless save)
                        autoSaveTabQuery(tabId);
                    }

                    // Restore original functionality
                    renderQueryTabs();
                }

                // Handle cancel on Escape
                function cancelEdit() {
                    tabElement.innerHTML = originalContent;
                }

                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEdit();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEdit();
                    }
                });
            }
        `;
    }
    
    /**
     * Generate the query tabs rendering JavaScript
     * 
     * @returns {string} JavaScript code for rendering query tabs
     */
    function getQueryTabsRenderingJS() {
        return `
            function renderQueryTabs() {
                const tabsBar = document.getElementById('queryTabsBar');
                if (!tabsBar) return;

                tabsBar.innerHTML = '';

                // Render all tabs
                queryTabs.forEach(tab => {
                    const tabElement = document.createElement('div');
                    tabElement.className = 'codeoss-tab' + (tab.isActive ? ' active' : '');
                    tabElement.setAttribute('data-tab-id', tab.id);

                    const tabTitle = tab.title + (tab.isDirty ? ' •' : '');

                    tabElement.innerHTML = \`
                        <span class="codeoss-tab-title" onclick="switchToTab('\${tab.id}')" ondblclick="startInlineTabEditOnTab('\${tab.id}', event)" title="Double-click to edit: \${tab.title}">\${tabTitle}</span>
                        <button class="codeoss-tab-close" onclick="closeQueryTab('\${tab.id}')" title="Close tab">×</button>
                    \`;

                    tabsBar.appendChild(tabElement);
                });

                // Add the "+" button right after the tabs
                const addTabButton = document.createElement('button');
                addTabButton.type = 'button';
                addTabButton.className = 'codeoss-add-tab-btn';
                addTabButton.onclick = function() { addNewQueryTab(); };
                addTabButton.title = 'New Query Tab';
                addTabButton.innerHTML = '+';
                tabsBar.appendChild(addTabButton);

                // Update tab bar visibility
                const tabsContainer = document.querySelector('.codeoss-tabs-container');
                if (tabsContainer) {
                    tabsContainer.style.display = queryTabs.length > 0 ? 'flex' : 'none';
                }
            }
        `;
    }
    
    /**
     * Generate the query tabs initialization JavaScript
     * 
     * @returns {string} JavaScript code for initializing query tabs
     */
    function getQueryTabsInitializationJS() {
        return `
            function initializeQueryTabs() {
                // Check if CodeMirror is ready
                if (!codeEditor) {
                    setTimeout(initializeQueryTabs, 100);
                    return;
                }

                // Load tabs from storage
                loadTabsFromStorage();

                // If no tabs exist, create a blank tab
                if (queryTabs.length === 0) {
                    addNewQueryTab('Untitled', '');
                }

                // Render tabs
                renderQueryTabs();

                // Switch to the active tab to load its content into the editor
                if (activeTabId) {
                    switchToTab(activeTabId, true); // Skip saving current tab during initialization
                } else if (queryTabs.length > 0) {
                    // If no active tab is set, switch to the first tab
                    switchToTab(queryTabs[0].id, true); // Skip saving current tab during initialization
                }

                // Update toolbar tab name
                updateToolbarTabName();

                // Set up editor change listener AFTER initial loading to prevent overwriting saved content
                setTimeout(function() {
                    if (codeEditor && typeof codeEditor.on === 'function') {
                        let saveTimeout;
                        codeEditor.on('change', function() {
                            if (activeTabId) {
                                markTabDirty(activeTabId, true);

                                // Debounced save to localStorage (save after 1 second of no changes)
                                clearTimeout(saveTimeout);
                                saveTimeout = setTimeout(function() {
                                    saveTabsToStorage();
                                }, 1000);
                            }
                        });
                    }
                }, 100); // Small delay to ensure tab loading is complete
            }
        `;
    }
    
    /**
     * Generate the query tabs storage JavaScript
     *
     * @returns {string} JavaScript code for query tabs storage
     */
    function getQueryTabsStorageJS() {
        return `
            function saveTabsToStorage() {
                try {
                    // Save current editor content to active tab before saving to storage
                    if (activeTabId && codeEditor && typeof codeEditor.getValue === 'function') {
                        const currentTab = queryTabs.find(tab => tab.id === activeTabId);
                        if (currentTab && !currentTab.isTableDetails) {
                            currentTab.content = codeEditor.getValue();
                        }
                    }

                    const tabsData = {
                        tabs: queryTabs,
                        activeTabId: activeTabId,
                        tabCounter: tabCounter
                    };
                    localStorage.setItem('suiteql-query-tabs', JSON.stringify(tabsData));
                } catch(e) {
                    console.warn('Could not save tabs to localStorage:', e);
                }
            }

            // Removed refreshSavedQueryTabsContent() function
            // Simplified logic:
            // - New tabs start blank
            // - Loading saved queries creates new tabs with content
            // - Content changes update localStorage via editor listener
            // - Never overwrite localStorage content from NetSuite

            function loadTabsFromStorage() {
                try {
                    const saved = localStorage.getItem('suiteql-query-tabs');
                    if (saved) {
                        const tabsData = JSON.parse(saved);
                        queryTabs = tabsData.tabs || [];
                        activeTabId = tabsData.activeTabId || null;
                        tabCounter = tabsData.tabCounter || 1;

                        // Ensure all loaded tabs have results structure
                        queryTabs.forEach(tab => {
                            ensureTabHasResults(tab);
                        });

                        // Set the active tab based on saved activeTabId
                        if (activeTabId) {
                            queryTabs.forEach(tab => {
                                tab.isActive = (tab.id === activeTabId);
                            });
                        }

                        // Ensure at least one tab is marked as active
                        if (queryTabs.length > 0 && !queryTabs.some(tab => tab.isActive)) {
                            queryTabs[0].isActive = true;
                            activeTabId = queryTabs[0].id;
                        }
                    }
                } catch(e) {
                    console.warn('Could not load tabs from localStorage:', e);
                    queryTabs = [];
                    activeTabId = null;
                }
            }

            function clearTabsStorage() {
                try {
                    localStorage.removeItem('suiteql-query-tabs');
                } catch(e) {
                    console.warn('Could not clear tabs storage:', e);
                }
            }

            // Global function to reset tabs (for debugging)
            window.resetQueryTabs = function() {
                clearTabsStorage();
                queryTabs = [];
                activeTabId = null;
                tabCounter = 1;
                addNewQueryTab('Untitled', '');
            };

            function saveTabAsQuery(tabId, title, description, tags, isPublic) {
                const tab = queryTabs.find(tab => tab.id === tabId);
                if (!tab) {
                    alert('Tab not found');
                    return;
                }

                // This will be implemented to call the NetSuite saved queries record
                const queryData = {
                    title: title || tab.title,
                    content: tab.content,
                    description: description || '',
                    tags: tags || '',
                    isPublic: isPublic || false
                };

                // TODO: Implement NetSuite record creation
                alert('Query saved successfully! (NetSuite record integration pending)');
            }

            function loadQueryIntoTab(queryData) {
                const tabId = addNewQueryTab(queryData.title, queryData.content);

                // Mark tab as saved (not dirty)
                const tab = queryTabs.find(tab => tab.id === tabId);
                if (tab) {
                    tab.isDirty = false;
                    tab.savedQueryId = queryData.id; // Reference to NetSuite record
                }

                renderQueryTabs();
                updateToolbarTabName();
                return tabId;
            }

            function saveQueryToNetSuiteSilent(queryData, existingRecordId, callback) {

                if (existingRecordId) {
                    // Update existing query using the savedQueryUpdate function
                    const requestPayload = {
                        'function': 'savedQueryUpdate',
                        recordId: existingRecordId,
                        title: queryData.title,
                        content: queryData.content,
                        description: queryData.description || '',
                        tags: queryData.tags || '',
                        favorite: queryData.favorite || false
                    };

                    // Only include category if we have a valid value
                    if (queryData.category && queryData.category.trim() !== '') {
                        requestPayload.category = queryData.category;
                    }

                    // Only include sharing level if we have a valid value
                    if (queryData.sharingLevel && queryData.sharingLevel.trim() !== '') {
                        requestPayload.sharingLevel = queryData.sharingLevel;
                    }

                    fetch(window.location.href, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestPayload)
                    }).then(response => response.json())
                      .then(data => {
                          if (data.success) {
                              callback(true, data.recordId, null);

                              // Refresh saved queries list
                              if (typeof loadSavedQueries === 'function') {
                                  loadSavedQueries();
                              }
                          } else {
                              throw new Error(data.error || 'Unknown error updating query');
                          }
                      })
                      .catch(error => {
                          console.error('Failed to update query:', error);
                          callback(false, null, error.message);
                      });
                } else {
                    // Create new query using the savedQuerySave function directly
                    const requestPayload = {
                        'function': 'savedQuerySave',
                        title: queryData.title,
                        content: queryData.content,
                        description: queryData.description || '',
                        tags: queryData.tags || '',
                        favorite: queryData.favorite || false
                    };



                    // Only include category if we have a valid value
                    if (queryData.category && queryData.category.trim() !== '') {
                        requestPayload.category = queryData.category;
                    }

                    // Only include sharing level if we have a valid value
                    if (queryData.sharingLevel && queryData.sharingLevel.trim() !== '') {
                        requestPayload.sharingLevel = queryData.sharingLevel;
                    }

                    fetch(window.location.href, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestPayload)
                    }).then(response => response.json())
                      .then(data => {
                          if (data.success) {
                              callback(true, data.recordId, null);

                              // Refresh saved queries list
                              if (typeof loadSavedQueries === 'function') {
                                  loadSavedQueries();
                              }
                          } else {
                              throw new Error(data.error || 'Unknown error saving query');
                          }
                      })
                      .catch(error => {
                          console.error('Failed to save query:', error);
                          callback(false, null, error.message);
                      });
                }
            }

            function saveCurrentTabAsQuery() {
                const currentTab = getCurrentTab();
                if (!currentTab) {
                    showStatusMessage('No active tab to save.');
                    return;
                }

                // Get current content from the editor
                let currentContent = '';
                if (codeEditor && typeof codeEditor.getValue === 'function') {
                    currentContent = codeEditor.getValue();
                } else {
                    // Fallback to textarea if CodeMirror isn't available
                    const textarea = document.getElementById('` + constants.ELEMENT_IDS.QUERY_TEXTAREA + `');
                    currentContent = textarea ? textarea.value : currentTab.content;
                }

                // Validate that we have content to save
                if (!currentContent || currentContent.trim() === '') {
                    showStatusMessage('Please enter a query before saving.');
                    return;
                }



                // Ensure we have a valid title
                const queryTitle = currentTab.title && currentTab.title.trim() !== '' ? currentTab.title.trim() : 'Untitled Query';

                // Check if this tab was loaded from a saved query (has savedQueryId)
                if (currentTab.savedQueryId) {
                    // This is an existing saved query - update it silently
                    const queryData = {
                        title: queryTitle,
                        content: currentContent,
                        description: '', // We don't have description stored in tab, use empty
                        tags: '', // We don't have tags stored in tab, use empty
                        favorite: false
                    };



                    // Use the silent save function for seamless updates
                    saveQueryToNetSuiteSilent(queryData, currentTab.savedQueryId, function(success, recordId, error) {
                        if (success) {
                            // Mark tab as saved (not dirty)
                            currentTab.isDirty = false;
                            renderQueryTabs();
                            updateToolbarTabName();

                            // Show status message in blue bar
                            showStatusMessage('Query "' + currentTab.title + '" updated successfully');


                        } else {
                            console.error('Failed to update query:', error);
                            showStatusMessage('Failed to update query "' + currentTab.title + '"');
                        }
                    });
                } else {
                    // This is a new query - save seamlessly using the current tab title

                    const queryData = {
                        title: queryTitle,
                        content: currentContent,
                        description: '',
                        tags: '',
                        favorite: false
                    };

                    // Use the silent save function for new queries too, so we get the record ID back
                    saveQueryToNetSuiteSilent(queryData, null, function(success, recordId, error) {
                        if (success) {
                            // Mark tab as saved
                            currentTab.isDirty = false;
                            if (recordId) {
                                currentTab.savedQueryId = recordId; // Set the record ID for future updates
                            }
                            renderQueryTabs();
                            updateToolbarTabName();

                            // Show status message in blue bar
                            showStatusMessage('Query "' + currentTab.title + '" saved successfully');
                        } else {
                            console.error('Failed to save new query:', error);
                            showStatusMessage('Failed to save query "' + currentTab.title + '"');
                        }
                    });
                }
            }

            function autoSaveTabQuery(tabId) {
                const tab = queryTabs.find(t => t.id === tabId);
                if (!tab) return;

                // Get current content from editor if this is the active tab
                let content = tab.content;
                if (tabId === activeTabId && codeEditor && typeof codeEditor.getValue === 'function') {
                    content = codeEditor.getValue();
                    tab.content = content; // Update tab content
                }

                const queryData = {
                    title: tab.title,
                    content: content,
                    description: '',
                    tags: '',
                    favorite: false
                };



                // Use the tab's savedQueryId if it exists (for updates)
                saveQueryToNetSuiteSilent(queryData, tab.savedQueryId, function(success, recordId, error) {
                    if (success) {
                        // Mark tab as saved (not dirty)
                        tab.isDirty = false;
                        if (recordId) {
                            tab.savedQueryId = recordId;
                        }
                        renderQueryTabs();
                        updateToolbarTabName();

                        // Show status message
                        const action = tab.savedQueryId ? 'updated' : 'saved';
                        showStatusMessage('Query "' + tab.title + '" ' + action + ' successfully');
                    } else {
                        console.error('Failed to save query:', error);
                        showStatusMessage('Failed to save query "' + tab.title + '"');
                    }
                });
            }



            function showStatusMessage(message) {
                const statusElement = document.getElementById('statusText');
                if (statusElement) {
                    const originalText = statusElement.textContent;
                    statusElement.textContent = message;

                    // Reset to "Ready" after 3 seconds
                    setTimeout(function() {
                        statusElement.textContent = originalText || 'Ready';
                    }, 3000);
                }
            }



            // Function to save results to current active tab after query execution
            function saveResultsToCurrentTab() {
                const currentTab = queryTabs.find(tab => tab.id === activeTabId);
                if (currentTab) {
                    ensureTabHasResults(currentTab);
                    saveCurrentTabResults(currentTab);
                    saveTabsToStorage();
                }
            }

            // Expose functions globally
            window.addNewQueryTab = addNewQueryTab;
            window.switchToTab = switchToTab;
            window.closeQueryTab = closeQueryTab;
            window.loadQueryIntoTab = loadQueryIntoTab;
            window.startInlineTabEdit = startInlineTabEdit;
            window.saveCurrentTabAsQuery = saveCurrentTabAsQuery;
            window.saveResultsToCurrentTab = saveResultsToCurrentTab;
        `;
    }

    /**
     * Get all query tabs JavaScript functions
     *
     * @returns {string} Complete JavaScript code for query tabs functionality
     */
    function getAllQueryTabsJS() {
        return getQueryTabsManagementJS() + '\n' +
               getQueryTabsRenderingJS() + '\n' +
               getQueryTabsInitializationJS() + '\n' +
               getQueryTabsStorageJS();
    }
    
    /**
     * Export the query tabs functions
     */
    return {
        getQueryTabsHTML: getQueryTabsHTML,
        getQueryTabsManagementJS: getQueryTabsManagementJS,
        getQueryTabsRenderingJS: getQueryTabsRenderingJS,
        getQueryTabsInitializationJS: getQueryTabsInitializationJS,
        getAllQueryTabsJS: getAllQueryTabsJS
    };
    
});
