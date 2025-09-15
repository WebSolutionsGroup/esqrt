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
                const existingQueryTab = queryTabs.find(tab => tab.isTableReference && tab.tableId === tableId);
                if (existingQueryTab) {
                    switchToTab(existingQueryTab.id);
                    return;
                }

                // Create new table reference tab in the main query tab system
                const tabId = 'table_ref_' + Date.now();

                // Create a special query tab for table reference
                const newTab = createTab(tabId, tableName, '');
                newTab.isTableReference = true;
                newTab.tableId = tableId;
                newTab.tableName = tableName;
                newTab.activeSubTab = 'overview';
                newTab.tableData = null;
                newTab.loading = false;

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

                // Use the table reference data module to fetch details
                if (window.fetchTableDetail) {
                    window.fetchTableDetail(tab.tableId)
                        .then(data => {
                            tab.tableData = data;
                            tab.loading = false;
                            if (tab.isActive) {
                                renderTableReferenceContent(tab);
                            }
                        })
                        .catch(error => {
                            console.error('Error loading table data:', error);
                            tab.loading = false;
                            if (tab.isActive) {
                                renderTableReferenceError(tab, error);
                            }
                        });
                }
            }
            
            /**
             * Render table reference content
             */
            function renderTableReferenceContent(tab) {
                // Get the main content area (we'll replace the editor/results area)
                const editorArea = document.querySelector('.codeoss-editor-area');
                if (!editorArea) return;
                
                if (tab.loading) {
                    editorArea.innerHTML = \`
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
                
                // Render the table reference interface
                editorArea.innerHTML = \`
                    <div class="table-reference-container" style="height: 100%; display: flex; flex-direction: column;">
                        <!-- Table Reference Header -->
                        <div class="table-reference-header" style="padding: 16px; border-bottom: 1px solid var(--codeoss-border); background: var(--codeoss-bg-secondary);">
                            <h2 style="margin: 0; color: var(--codeoss-text-primary); font-size: 18px; font-weight: 600;">
                                \${tab.tableData.label || tab.tableName}
                            </h2>
                            <div style="color: var(--codeoss-text-secondary); font-size: 14px; margin-top: 4px;">
                                \${tab.tableId}
                            </div>
                        </div>
                        
                        <!-- Table Reference Sub-tabs -->
                        <div class="table-reference-subtabs" style="display: flex; border-bottom: 1px solid var(--codeoss-border); background: var(--codeoss-bg-primary);">
                            <button class="table-reference-subtab \${tab.activeSubTab === 'overview' ? 'active' : ''}" 
                                    onclick="switchTableReferenceSubTab('\${tab.id}', 'overview')"
                                    style="padding: 12px 20px; border: none; background: none; color: var(--codeoss-text-primary); cursor: pointer; border-bottom: 2px solid transparent;">
                                OVERVIEW
                            </button>
                            <button class="table-reference-subtab \${tab.activeSubTab === 'fields' ? 'active' : ''}" 
                                    onclick="switchTableReferenceSubTab('\${tab.id}', 'fields')"
                                    style="padding: 12px 20px; border: none; background: none; color: var(--codeoss-text-primary); cursor: pointer; border-bottom: 2px solid transparent;">
                                FIELDS
                            </button>
                            <button class="table-reference-subtab \${tab.activeSubTab === 'joins' ? 'active' : ''}" 
                                    onclick="switchTableReferenceSubTab('\${tab.id}', 'joins')"
                                    style="padding: 12px 20px; border: none; background: none; color: var(--codeoss-text-primary); cursor: pointer; border-bottom: 2px solid transparent;">
                                JOINS
                            </button>
                            <button class="table-reference-subtab \${tab.activeSubTab === 'preview' ? 'active' : ''}" 
                                    onclick="switchTableReferenceSubTab('\${tab.id}', 'preview')"
                                    style="padding: 12px 20px; border: none; background: none; color: var(--codeoss-text-primary); cursor: pointer; border-bottom: 2px solid transparent;">
                                PREVIEW
                            </button>
                        </div>
                        
                        <!-- Table Reference Content -->
                        <div class="table-reference-content" style="flex: 1; overflow: auto; padding: 16px;">
                            <div id="tableReferenceSubTabContent">
                                <!-- Sub-tab content will be rendered here -->
                            </div>
                        </div>
                    </div>
                \`;
                
                // Add CSS for active sub-tab
                const style = document.createElement('style');
                style.textContent = \`
                    .table-reference-subtab.active {
                        border-bottom-color: var(--codeoss-accent) !important;
                        color: var(--codeoss-accent) !important;
                        font-weight: 600;
                    }
                    .table-reference-subtab:hover {
                        background: var(--codeoss-hover-bg);
                    }
                \`;
                document.head.appendChild(style);
                
                // Render the active sub-tab content
                renderTableReferenceSubTab(tab);
            }
            
            /**
             * Switch table reference sub-tab
             */
            function switchTableReferenceSubTab(tabId, subTabName) {
                const tab = queryTabs.find(t => t.id === tabId && t.isTableReference);
                if (!tab) return;

                tab.activeSubTab = subTabName;
                renderTableReferenceContent(tab);
            }
            
            /**
             * Render table reference sub-tab content
             */
            function renderTableReferenceSubTab(tab) {
                const contentElement = document.getElementById('tableReferenceSubTabContent');
                if (!contentElement || !tab.tableData) return;
                
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
                const editorArea = document.querySelector('.codeoss-editor-area');
                if (!editorArea) return;
                
                editorArea.innerHTML = \`
                    <div class="table-reference-error" style="padding: 40px; text-align: center; color: var(--codeoss-text-danger);">
                        <div style="font-size: 16px; margin-bottom: 10px;">Error loading table information</div>
                        <div style="font-size: 14px; margin-bottom: 20px;">\${error.message}</div>
                        <button onclick="loadTableReferenceData('\${tab.id}')" 
                                style="padding: 8px 16px; background: var(--codeoss-btn-bg); color: var(--codeoss-btn-text); border: 1px solid var(--codeoss-border); border-radius: 3px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                \`;
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
