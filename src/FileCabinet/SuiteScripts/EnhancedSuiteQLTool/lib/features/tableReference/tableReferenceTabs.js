/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Table Reference Tabs Module
 * 
 * This module handles the specialized tab system for table reference
 * with Overview, Fields, Joins, and Preview subtabs.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([], function() {
    
    /**
     * Generate JavaScript for Table Reference tabs functionality
     * 
     * @returns {string} JavaScript code for table reference tabs
     */
    function getTableReferenceTabsJS() {
        return `
            // Table reference tabs are now integrated with the main query tab system
            
            /**
             * Open a new table reference tab
             */
            function openTableReferenceTab(tableId, tableName) {
                // Update table selection highlighting
                updateTableSelection(tableId);

                // Check if tab already exists in the main query tabs
                const existingQueryTab = queryTabs.find(tab => tab.isTableDetails && tab.tableId === tableId);
                if (existingQueryTab) {
                    switchToTab(existingQueryTab.id);
                    return;
                }

                // Create new table reference tab in the main query tab system
                const tabId = 'table_ref_' + Date.now();

                // Create a special query tab for table reference
                const newTab = createTab(tabId, tableName, '');
                newTab.isTableDetails = true;  // Use isTableDetails to integrate with existing tab system
                newTab.isHtmlContent = true;   // Required for the switchToTab logic
                newTab.isTableReference = true;  // Keep this for our own identification
                newTab.tableId = tableId;
                newTab.tableName = tableName;
                newTab.activeSubTab = 'overview';
                newTab.tableData = null;
                newTab.loading = false;
                newTab.selectedFields = []; // Initialize with no fields selected



                // Add to main query tabs
                queryTabs.push(newTab);

                // Render tabs and switch to the new one
                renderQueryTabs();
                switchToTab(tabId);

                // Load table data
                loadTableReferenceData(tabId);
            }

            /**
             * Update table selection highlighting in the Table Explorer
             */
            function updateTableSelection(selectedTableId) {
                // Remove previous selection
                const previousSelected = document.querySelectorAll('.table-explorer-item.selected');
                previousSelected.forEach(item => {
                    item.classList.remove('selected');
                });

                // Find and highlight the selected table
                const tableItems = document.querySelectorAll('.table-explorer-item');
                tableItems.forEach(item => {
                    const onclick = item.getAttribute('onclick');
                    if (onclick && onclick.includes("'" + selectedTableId + "'")) {
                        item.classList.add('selected');
                    }
                });
            }
            

            

            
            /**
             * Load table reference data
             */
            function loadTableReferenceData(tabId) {
                const tab = queryTabs.find(t => t.id === tabId && t.isTableReference);
                if (!tab || tab.loading) return;

                tab.loading = true;

                // Show loading state
                renderTableReferenceContent(tab);

                // Use the table reference data module to fetch details
                if (window.fetchTableDetail) {
                    window.fetchTableDetail(tab.tableId)
                        .then(data => {
                            tab.tableData = data;
                            tab.loading = false;
                            renderTableReferenceContent(tab);

                            // Ensure sub-tab content is rendered after data is loaded
                            if (tab.isActive) {
                                setTimeout(() => {
                                    renderTableReferenceSubTab(tab);
                                }, 20);
                            }
                        })
                        .catch(error => {
                            console.error('Error loading table data:', error);
                            tab.loading = false;
                            renderTableReferenceError(tab, error);
                        });
                }
            }
            
            /**
             * Render table reference content
             */
            function renderTableReferenceContent(tab) {
                if (tab.loading) {
                    tab.content = \`
                        <div class="table-reference-loading" style="padding: 40px; text-align: center; color: var(--codeoss-text-secondary);">
                            <div style="font-size: 16px; margin-bottom: 10px;">Loading table information...</div>
                            <div style="font-size: 14px;">\${tab.tableName} (\${tab.tableId})</div>
                        </div>
                    \`;
                    return;
                }

                if (!tab.tableData) {
                    renderTableReferenceError(tab, new Error('No data available'));
                    return;
                }

                // Generate the table reference interface HTML and store it in tab.content
                tab.content = \`
                    <div class="table-reference-container" style="height: 100%; display: flex; flex-direction: column;">
                        <!-- Table Reference Header -->
                        <div class="table-reference-header" style="padding: 16px; border-bottom: 1px solid var(--codeoss-border); background: var(--codeoss-background-secondary);">
                            <h2 style="margin: 0; color: var(--codeoss-text-primary); font-size: 18px; font-weight: 600;">
                                \${tab.tableData.label || tab.tableName}
                            </h2>
                            <div style="color: var(--codeoss-text-secondary); font-size: 14px; margin-top: 4px;">
                                \${tab.tableId}
                            </div>
                        </div>

                        <!-- Table Reference Sub-tabs -->
                        <div class="table-reference-subtabs" style="display: flex; border-bottom: 1px solid var(--codeoss-border); background: var(--codeoss-background-primary);">
                            <button type="button" class="table-reference-subtab \${tab.activeSubTab === 'overview' ? 'active' : ''}"
                                    data-tab-id="\${tab.id}" data-subtab="overview"
                                    style="padding: 12px 20px; border: none; background: none; color: var(--codeoss-text-primary); cursor: pointer; border-bottom: 2px solid transparent;">
                                OVERVIEW
                            </button>
                            <button type="button" class="table-reference-subtab \${tab.activeSubTab === 'fields' ? 'active' : ''}"
                                    data-tab-id="\${tab.id}" data-subtab="fields"
                                    style="padding: 12px 20px; border: none; background: none; color: var(--codeoss-text-primary); cursor: pointer; border-bottom: 2px solid transparent;">
                                FIELDS
                            </button>
                            <button type="button" class="table-reference-subtab \${tab.activeSubTab === 'joins' ? 'active' : ''}"
                                    data-tab-id="\${tab.id}" data-subtab="joins"
                                    style="padding: 12px 20px; border: none; background: none; color: var(--codeoss-text-primary); cursor: pointer; border-bottom: 2px solid transparent;">
                                JOINS
                            </button>
                            <button type="button" class="table-reference-subtab \${tab.activeSubTab === 'preview' ? 'active' : ''}"
                                    data-tab-id="\${tab.id}" data-subtab="preview"
                                    style="padding: 12px 20px; border: none; background: none; color: var(--codeoss-text-primary); cursor: pointer; border-bottom: 2px solid transparent;">
                                PREVIEW
                            </button>
                        </div>

                        <!-- Table Reference Content -->
                        <div class="table-reference-content" style="flex: 1; overflow: auto; padding: 16px;">
                            <div id="tableReferenceSubTabContent_\${tab.id}">
                                <!-- Sub-tab content will be rendered here -->
                            </div>
                        </div>
                    </div>
                \`;

                // Add CSS for active sub-tab (only once)
                if (!document.getElementById('table-reference-styles')) {
                    const style = document.createElement('style');
                    style.id = 'table-reference-styles';
                    style.textContent = \`
                        .table-reference-subtab.active {
                            border-bottom-color: var(--codeoss-accent) !important;
                            color: var(--codeoss-accent) !important;
                            font-weight: 600;
                        }
                        .table-reference-subtab:hover {
                            background: var(--codeoss-background-hover);
                        }
                    \`;
                    document.head.appendChild(style);
                }

                // If this tab is currently active, update the display
                if (tab.isActive) {
                    const tableDetailsContainer = document.getElementById('table-details-container');
                    if (tableDetailsContainer) {
                        tableDetailsContainer.innerHTML = tab.content;
                        tableDetailsContainer.style.display = 'block';

                        // Hide normal query interface
                        const editorContainer = document.querySelector('.codeoss-editor-container');
                        const resultsContainer = document.querySelector('.codeoss-results-container');
                        const resizer = document.getElementById('editorResizer');

                        if (editorContainer) editorContainer.style.display = 'none';
                        if (resultsContainer) resultsContainer.style.display = 'none';
                        if (resizer) resizer.style.display = 'none';

                        // Render the active sub-tab content with a slight delay to ensure DOM is ready
                        setTimeout(() => {
                            renderTableReferenceSubTab(tab);

                            // Add event listeners for sub-tab buttons
                            const subTabButtons = document.querySelectorAll('.table-reference-subtab[data-tab-id="' + tab.id + '"]');
                            subTabButtons.forEach(button => {
                                button.addEventListener('click', function(event) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    const tabId = this.getAttribute('data-tab-id');
                                    const subTabName = this.getAttribute('data-subtab');
                                    switchTableReferenceSubTab(tabId, subTabName);
                                });
                            });
                        }, 10);
                    }
                }
            }
            
            /**
             * Switch table reference sub-tab
             */
            function switchTableReferenceSubTab(tabId, subTabName) {
                const tab = queryTabs.find(t => t.id === tabId && t.isTableReference);
                if (!tab) return;

                tab.activeSubTab = subTabName;

                // Update the sub-tab buttons to show the active state
                const subTabButtons = document.querySelectorAll('.table-reference-subtab');
                subTabButtons.forEach(button => {
                    button.classList.remove('active');
                    if (button.textContent.trim() === subTabName.toUpperCase()) {
                        button.classList.add('active');
                    }
                });

                // Render just the sub-tab content without regenerating the entire interface
                renderTableReferenceSubTab(tab);
            }
            
            /**
             * Render table reference sub-tab content
             */
            function renderTableReferenceSubTab(tab) {
                const contentElement = document.getElementById('tableReferenceSubTabContent_' + tab.id);
                if (!contentElement) {
                    console.warn('Sub-tab content element not found for tab:', tab.id);
                    return;
                }
                if (!tab.tableData) {
                    console.warn('No table data available for tab:', tab.id);
                    return;
                }

                console.log('Rendering sub-tab:', tab.activeSubTab, 'for tab:', tab.id);

                switch (tab.activeSubTab) {
                    case 'overview':
                        renderOverviewTab(contentElement, tab.tableData);
                        break;
                    case 'fields':
                        renderFieldsTab(contentElement, tab.tableData);
                        break;
                    case 'joins':
                        renderJoinsTab(contentElement, tab.tableData);
                        break;
                    case 'preview':
                        renderPreviewTab(contentElement, tab);
                        break;
                }
            }
            
            /**
             * Render table reference error
             */
            function renderTableReferenceError(tab, error) {
                console.error('Table reference error:', error);

                tab.content = \`
                    <div class="table-reference-error" style="padding: 40px; text-align: center; color: var(--codeoss-text-error);">
                        <div style="font-size: 16px; margin-bottom: 10px;">Error loading table information</div>
                        <div style="font-size: 14px; color: var(--codeoss-text-secondary);">\${tab.tableName} (\${tab.tableId})</div>
                        <div style="font-size: 12px; color: var(--codeoss-text-tertiary); margin-top: 10px;">\${error.message || 'Unknown error'}</div>
                        <button onclick="loadTableReferenceData('\${tab.id}')"
                                style="padding: 8px 16px; background: var(--codeoss-button-bg); color: var(--codeoss-button-text); border: 1px solid var(--codeoss-border); border-radius: 3px; cursor: pointer; margin-top: 20px;">
                            Retry
                        </button>
                    </div>
                \`;

                // If this tab is currently active, update the display
                if (tab.isActive) {
                    const tableDetailsContainer = document.getElementById('table-details-container');
                    if (tableDetailsContainer) {
                        tableDetailsContainer.innerHTML = tab.content;
                        tableDetailsContainer.style.display = 'block';

                        // Hide normal query interface
                        const editorContainer = document.querySelector('.codeoss-editor-container');
                        const resultsContainer = document.querySelector('.codeoss-results-container');
                        const resizer = document.getElementById('editorResizer');

                        if (editorContainer) editorContainer.style.display = 'none';
                        if (resultsContainer) resultsContainer.style.display = 'none';
                        if (resizer) resizer.style.display = 'none';
                    }
                }
            }
            
            /**
             * Clear table reference content
             */
            function clearTableReferenceContent() {
                const editorArea = document.querySelector('.codeoss-editor-area');
                if (editorArea) {
                    // Restore the original editor/results layout
                    // This would need to be implemented based on the original layout
                }
            }
            
            // Make functions available globally
            window.openTableReferenceTab = openTableReferenceTab;
            window.renderTableReferenceContent = renderTableReferenceContent;
            window.renderTableReferenceSubTab = renderTableReferenceSubTab;
            window.switchTableReferenceSubTab = switchTableReferenceSubTab;
            window.updateTableSelection = updateTableSelection;
        `;
    }
    
    /**
     * Export the table reference tabs functions
     */
    return {
        getTableReferenceTabsJS: getTableReferenceTabsJS
    };
    
});
