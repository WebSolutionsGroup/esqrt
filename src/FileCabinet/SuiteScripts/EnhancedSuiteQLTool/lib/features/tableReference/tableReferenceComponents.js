/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Table Reference Components Module
 * 
 * This module contains UI components for displaying table overview,
 * field listings, join relationships, and data preview.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate JavaScript for Table Reference components
     * 
     * @returns {string} JavaScript code for table reference components
     */
    function getTableReferenceComponentsJS() {
        return `
            /**
             * Render the Overview tab content
             */
            function renderOverviewTab(container, tableData) {
                if (!container || !tableData) return;

                // Ensure we have overview data for this record
                if (window.fetchRecordOverview && (!window.tableReferenceCache || !window.tableReferenceCache.recordOverviews || !window.tableReferenceCache.recordOverviews[tableData.id])) {
                    console.log('Fetching overview data for', tableData.id);
                    container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--codeoss-text-secondary);">Loading overview data...</div>';

                    window.fetchRecordOverview(tableData.id).then(() => {
                        console.log('Overview data fetched, re-rendering overview for', tableData.id);
                        // Re-render with the new overview data
                        renderOverviewTab(container, tableData);
                    }).catch(error => {
                        console.warn('Failed to fetch overview data for', tableData.id, ':', error);
                        // Continue with existing data
                        renderOverviewTabContent(container, tableData);
                    });
                    return;
                }

                renderOverviewTabContent(container, tableData);
            }

            function renderOverviewTabContent(container, tableData) {
                // First, try to get overview data for accurate classification
                let origin = 'System';
                let recordFamily = 'Other';

                // Check if we have overview data from the new endpoint
                if (window.tableReferenceCache && window.tableReferenceCache.recordOverviews && window.tableReferenceCache.recordOverviews[tableData.id]) {
                    const overview = window.tableReferenceCache.recordOverviews[tableData.id];

                    // Use isCustom field for accurate origin determination
                    if (typeof overview.isCustom === 'boolean') {
                        origin = overview.isCustom ? 'Custom' : 'System';
                    }

                    // Use baseType field for accurate record family
                    if (overview.baseType) {
                        recordFamily = overview.baseType;
                    }
                } else {
                    // Fallback to existing logic if overview data not available
                    if (tableData.origin) {
                        origin = (tableData.origin.toUpperCase() === 'SYSTEM' || tableData.origin.toUpperCase() === 'STANDARD') ? 'System' : 'Custom';
                    } else if (tableData.recordOrigin) {
                        origin = (tableData.recordOrigin.toUpperCase() === 'SYSTEM' || tableData.recordOrigin.toUpperCase() === 'STANDARD') ? 'System' : 'Custom';
                    } else if (tableData.id) {
                        // Fallback: determine from ID
                        const idUpper = tableData.id.toUpperCase();
                        const isCustom = idUpper.startsWith('CUSTOMRECORD_') ||
                                       idUpper.startsWith('CUSTOMLIST_') ||
                                       idUpper.startsWith('CUSTOMSEARCH_');
                        origin = isCustom ? 'Custom' : 'System';
                    }

                    // Determine Record Family
                    if (tableData.recordFamily) {
                        recordFamily = tableData.recordFamily;
                    } else if (tableData.family) {
                        recordFamily = tableData.family;
                    } else if (tableData.recordType) {
                        recordFamily = tableData.recordType;
                    } else if (tableData.id) {
                        // Fallback: derive from ID
                        const idUpper = tableData.id.toUpperCase();
                        if (idUpper.startsWith('CUSTOMLIST_')) {
                            recordFamily = 'CUSTOMLIST';
                        } else if (idUpper.startsWith('CUSTOMRECORD_')) {
                            recordFamily = 'CUSTOM';
                        } else if (idUpper.startsWith('CUSTOMSEARCH_')) {
                            recordFamily = 'CUSTOMSEARCH';
                        }
                    }
                }

                // Get additional fields from overview data if available
                const overview = window.tableReferenceCache && window.tableReferenceCache.recordOverviews && window.tableReferenceCache.recordOverviews[tableData.id];

                const available = tableData.available !== false ? 'YES' : 'NO';
                const feature = (overview && overview.features && overview.features.length > 0) ? overview.features.join(', ') : (tableData.feature || (origin === 'Custom' ? 'Custom Records' : 'Standard Records'));
                const permission = (overview && overview.permissions && overview.permissions.length > 0) ? overview.permissions.join(', ') : (tableData.permission || '-');
                const originalName = (overview && overview.originalName) || tableData.originalName || tableData.label || tableData.id;

                // Calculate data information
                const lastModified = tableData.lastModified || new Date().toISOString().split('T')[0];
                const firstCreated = tableData.firstCreated || tableData.lastModified || new Date().toISOString().split('T')[0];

                // Get table ID for row count query
                const tableId = tableData.id || tableData.scriptId;
                
                container.innerHTML = \`
                    <div class="table-overview-content">
                        <div class="overview-section">
                            <h3 style="color: var(--codeoss-text-primary); font-size: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--codeoss-border); padding-bottom: 8px;">
                                Record Type Overview
                            </h3>
                            
                            <div class="overview-grid" style="display: grid; grid-template-columns: 150px 1fr; gap: 12px; margin-bottom: 24px;">
                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">ID:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${tableData.id || tableData.scriptId}</div>
                                
                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">Original Name:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${originalName}</div>

                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">Origin:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${origin}</div>

                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">Record Family:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${recordFamily}</div>
                                
                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">Available:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${available}</div>
                                
                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">Feature:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${feature}</div>
                                
                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">Permission:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${permission}</div>
                            </div>
                        </div>
                        
                        <div class="overview-section">
                            <h3 style="color: var(--codeoss-text-primary); font-size: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--codeoss-border); padding-bottom: 8px;">
                                Data Information
                            </h3>
                            
                            <div class="overview-grid" style="display: grid; grid-template-columns: 150px 1fr; gap: 12px;">
                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">Number of Rows:</div>
                                <div id="rowCountDisplay_\${tableId}" style="color: var(--codeoss-text-secondary);">
                                    <span class="row-count-loading" style="display: inline-flex; align-items: center;">
                                        <span style="margin-right: 6px;">Loading...</span>
                                        <span class="loading-spinner" style="width: 12px; height: 12px; border: 2px solid var(--codeoss-border); border-top: 2px solid var(--codeoss-accent); border-radius: 50%; animation: spin 1s linear infinite;"></span>
                                    </span>
                                </div>

                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">Last Modified:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${lastModified}</div>

                                <div style="font-weight: 600; color: var(--codeoss-text-primary);">First Created:</div>
                                <div style="color: var(--codeoss-text-secondary);">\${firstCreated}</div>
                            </div>
                        </div>
                    </div>
                \`;

                // Add CSS for loading spinner if not already added
                if (!document.getElementById('rowCountSpinnerCSS')) {
                    const style = document.createElement('style');
                    style.id = 'rowCountSpinnerCSS';
                    style.textContent = \`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        .row-count-error {
                            color: var(--codeoss-text-danger) !important;
                            cursor: pointer;
                        }
                        .row-count-error:hover {
                            text-decoration: underline;
                        }
                    \`;
                    document.head.appendChild(style);
                }

                // Start fetching row count
                fetchTableRowCount(tableId);
            }
            
            /**
             * Render the Fields tab content
             */
            function renderFieldsTab(container, tableData) {
                if (!container || !tableData) return;
                
                const fields = tableData.fields || [];
                const queryableFields = fields.filter(field => field.isColumn === true);
                
                container.innerHTML = \`
                    <div class="table-fields-content">
                        <div class="fields-header" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="color: var(--codeoss-text-primary); font-size: 16px; margin: 0;">
                                    Fields (\${queryableFields.length} queryable)
                                </h3>
                                <div style="color: var(--codeoss-text-secondary); font-size: 12px; margin-top: 4px;">
                                    1 field selected
                                </div>
                            </div>
                            <div class="fields-controls">
                                <button onclick="selectAllFields()" style="padding: 4px 8px; margin-right: 8px; background: var(--codeoss-btn-bg); color: var(--codeoss-btn-text); border: 1px solid var(--codeoss-border); border-radius: 3px; cursor: pointer; font-size: 11px;">
                                    ✓ Select All
                                </button>
                                <button onclick="generateFieldQuery()" style="padding: 4px 8px; background: var(--codeoss-accent); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                                    📋 Query
                                </button>
                            </div>
                        </div>
                        
                        <div class="fields-filter" style="margin-bottom: 16px;">
                            <input type="text" placeholder="Filter Search Fields" 
                                   onkeyup="filterFields(this.value)"
                                   style="width: 100%; padding: 6px 8px; border: 1px solid var(--codeoss-border); background: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border-radius: 3px; font-size: 12px;">
                        </div>
                        
                        <div class="fields-table-container" style="border: 1px solid var(--codeoss-border); border-radius: 3px; overflow: hidden;">
                            <table class="fields-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead style="background: var(--codeoss-bg-secondary);">
                                    <tr>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 40px;">
                                            <input type="checkbox" id="selectAllCheckbox" onchange="toggleAllFields(this.checked)">
                                        </th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Name</th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Type</th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Available</th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Feature</th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Permission</th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Join</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${renderFieldRows(queryableFields)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                \`;
            }
            
            /**
             * Render field rows for the fields table
             */
            function renderFieldRows(fields) {
                if (!fields || fields.length === 0) {
                    return \`
                        <tr>
                            <td colspan="7" style="padding: 20px; text-align: center; color: var(--codeoss-text-secondary); font-style: italic;">
                                No queryable fields found
                            </td>
                        </tr>
                    \`;
                }
                
                return fields.map((field, index) => {
                    const isChecked = index === 0 ? 'checked' : ''; // First field selected by default
                    const available = field.available !== false ? 'YES' : 'NO';
                    const feature = field.feature || '-';
                    const permission = field.permission || '-';
                    const join = field.join || '-';
                    
                    return \`
                        <tr class="field-row" style="border-bottom: 1px solid var(--codeoss-border-light);">
                            <td style="padding: 6px 8px;">
                                <input type="checkbox" class="field-checkbox" value="\${field.id}" \${isChecked} onchange="updateFieldSelection()">
                            </td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-primary);">
                                <div style="font-weight: 500;">\${field.label}</div>
                                <div style="color: var(--codeoss-text-secondary); font-size: 10px;">\${field.id}</div>
                            </td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary);">\${field.type || 'STRING'}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary);">\${available}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary);">\${feature}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary);">\${permission}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary);">\${join}</td>
                        </tr>
                    \`;
                }).join('');
            }
            
            /**
             * Render the Joins tab content
             */
            function renderJoinsTab(container, tableData) {
                if (!container || !tableData) return;
                
                const joins = tableData.joins || [];
                
                container.innerHTML = \`
                    <div class="table-joins-content">
                        <div class="joins-header" style="margin-bottom: 16px;">
                            <h3 style="color: var(--codeoss-text-primary); font-size: 16px; margin: 0;">
                                Join Relationships (\${joins.length})
                            </h3>
                            <div style="color: var(--codeoss-text-secondary); font-size: 12px; margin-top: 4px;">
                                Tables that can be joined with this record type
                            </div>
                        </div>
                        
                        \${joins.length > 0 ? \`
                            <div class="joins-table-container" style="border: 1px solid var(--codeoss-border); border-radius: 3px; overflow: hidden;">
                                <table class="joins-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                    <thead style="background: var(--codeoss-bg-secondary);">
                                        <tr>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Join Type</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Source/Target Record Type</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Field ID</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Cardinality</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary);">Available</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        \${renderJoinRows(joins)}
                                    </tbody>
                                </table>
                            </div>
                        \` : \`
                            <div style="padding: 40px; text-align: center; color: var(--codeoss-text-secondary); font-style: italic; border: 1px solid var(--codeoss-border); border-radius: 3px;">
                                No join relationships available for this record type
                            </div>
                        \`}
                    </div>
                \`;
            }
            
            /**
             * Render join rows for the joins table
             */
            function renderJoinRows(joins) {
                return joins.map(join => {
                    const sourceTarget = join.sourceTargetType || {};
                    const joinPairs = sourceTarget.joinPairs || [];
                    const fieldIds = joinPairs.map(pair => pair.label || pair.id).join(', ');
                    const available = join.available !== false ? 'YES' : 'NO';
                    
                    return \`
                        <tr style="border-bottom: 1px solid var(--codeoss-border-light);">
                            <td style="padding: 6px 8px; color: var(--codeoss-text-primary);">\${join.label}</td>
                            <td style="padding: 6px 8px;">
                                <a href="#" onclick="openTableReference('\${sourceTarget.id}', '\${sourceTarget.label}')" 
                                   style="color: var(--codeoss-accent); text-decoration: none; font-weight: 500;">
                                    \${sourceTarget.label}
                                </a>
                                <div style="color: var(--codeoss-text-secondary); font-size: 10px;">\${sourceTarget.id}</div>
                            </td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary);">\${fieldIds || '-'}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary);">\${join.cardinality || '-'}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary);">\${available}</td>
                        </tr>
                    \`;
                }).join('');
            }
            
            /**
             * Render the Preview tab content
             */
            function renderPreviewTab(container, tab) {
                if (!container) return;
                
                container.innerHTML = \`
                    <div class="table-preview-content">
                        <div class="preview-header" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="color: var(--codeoss-text-primary); font-size: 16px; margin: 0;">
                                    Data Preview
                                </h3>
                                <div style="color: var(--codeoss-text-secondary); font-size: 12px; margin-top: 4px;">
                                    Sample records from \${tab.tableName}
                                </div>
                            </div>
                            <div class="preview-controls">
                                <select style="padding: 4px 8px; margin-right: 8px; border: 1px solid var(--codeoss-border); background: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border-radius: 3px; font-size: 11px;">
                                    <option value="50">50 per page</option>
                                    <option value="100">100 per page</option>
                                    <option value="200">200 per page</option>
                                </select>
                                <button onclick="refreshPreview('\${tab.id}')" style="padding: 4px 8px; background: var(--codeoss-btn-bg); color: var(--codeoss-btn-text); border: 1px solid var(--codeoss-border); border-radius: 3px; cursor: pointer; font-size: 11px;">
                                    🔄 Refresh
                                </button>
                            </div>
                        </div>
                        
                        <div class="preview-loading" style="padding: 40px; text-align: center; color: var(--codeoss-text-secondary);">
                            <div style="font-size: 14px; margin-bottom: 10px;">Loading preview data...</div>
                            <div style="font-size: 12px;">This may take a moment for large tables</div>
                        </div>
                    </div>
                \`;
                
                // Load preview data
                loadPreviewData(tab);
            }
            
            /**
             * Load preview data for a table
             */
            function loadPreviewData(tab) {
                // This would integrate with the query execution system
                // For now, show a placeholder
                setTimeout(() => {
                    const container = document.querySelector('.preview-loading');
                    if (container) {
                        container.innerHTML = \`
                            <div style="padding: 20px; text-align: center; color: var(--codeoss-text-secondary); font-style: italic; border: 1px solid var(--codeoss-border); border-radius: 3px;">
                                Preview functionality will be integrated with query execution system
                                <br><br>
                                <button onclick="generatePreviewQuery('\${tab.tableId}')" 
                                        style="padding: 8px 16px; background: var(--codeoss-accent); color: white; border: none; border-radius: 3px; cursor: pointer;">
                                    Generate Preview Query
                                </button>
                            </div>
                        \`;
                    }
                }, 1000);
            }

            /**
             * Fetch row count for a table
             */
            function fetchTableRowCount(tableId) {
                const displayElement = document.getElementById(\`rowCountDisplay_\${tableId}\`);
                if (!displayElement) return;

                // Prepare the COUNT query
                const countQuery = \`SELECT COUNT(*) as row_count FROM \${tableId}\`;

                // Use the existing query execution system
                const requestPayload = {
                    'function': 'queryExecute',
                    query: countQuery,
                    rowBegin: 1,
                    rowEnd: 1,
                    paginationEnabled: false,
                    returnTotals: false,
                    viewsEnabled: false
                };

                // Execute the count query
                fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestPayload)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        // Handle error case
                        displayElement.innerHTML = \`
                            <span class="row-count-error" onclick="fetchTableRowCount('\${tableId}')" title="Click to retry: \${data.error.message || 'Query failed'}">
                                Error (click to retry)
                            </span>
                        \`;
                    } else if (data.records && data.records.length > 0) {
                        // Successfully got row count
                        const rowCount = data.records[0].row_count || data.records[0].ROW_COUNT || 0;
                        const formattedCount = Number(rowCount).toLocaleString();
                        displayElement.innerHTML = \`
                            <span style="color: var(--codeoss-text-primary); font-weight: 500;">\${formattedCount}</span>
                        \`;
                    } else {
                        // No data returned
                        displayElement.innerHTML = \`
                            <span class="row-count-error" onclick="fetchTableRowCount('\${tableId}')" title="Click to retry">
                                No data (click to retry)
                            </span>
                        \`;
                    }
                })
                .catch(error => {
                    console.error('Error fetching row count:', error);
                    displayElement.innerHTML = \`
                        <span class="row-count-error" onclick="fetchTableRowCount('\${tableId}')" title="Click to retry: \${error.message}">
                            Network error (click to retry)
                        </span>
                    \`;
                });
            }

            /**
             * Utility functions for field interactions
             */
            function updateFieldSelection() {
                const checkboxes = document.querySelectorAll('.field-checkbox');
                const selectedCount = document.querySelectorAll('.field-checkbox:checked').length;
                const totalCount = checkboxes.length;

                // Update the selection count display
                const countDisplay = document.querySelector('.fields-header div div');
                if (countDisplay) {
                    countDisplay.textContent = \`\${selectedCount} field\${selectedCount !== 1 ? 's' : ''} selected\`;
                }

                // Update the select all checkbox
                const selectAllCheckbox = document.getElementById('selectAllCheckbox');
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = selectedCount === totalCount;
                    selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCount;
                }
            }

            function toggleAllFields(checked) {
                const checkboxes = document.querySelectorAll('.field-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = checked;
                });
                updateFieldSelection();
            }

            function selectAllFields() {
                toggleAllFields(true);
            }

            function filterFields(searchTerm) {
                const rows = document.querySelectorAll('.field-row');
                const searchLower = searchTerm.toLowerCase();

                rows.forEach(row => {
                    const fieldName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                    if (fieldName.includes(searchLower)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            }

            function generateFieldQuery() {
                const selectedFields = Array.from(document.querySelectorAll('.field-checkbox:checked'))
                    .map(checkbox => checkbox.value);

                if (selectedFields.length === 0) {
                    alert('Please select at least one field to generate a query.');
                    return;
                }

                // Get the current table ID from the active tab
                const activeTab = tableReferenceTabs.find(tab => tab.isActive);
                if (!activeTab) return;

                const query = \`SELECT\\n\\t\${selectedFields.join(',\\n\\t')}\\nFROM\\n\\t\${activeTab.tableId}\`;

                // Create a new query tab with the generated query
                if (window.addNewQueryTab) {
                    const tabId = window.addNewQueryTab('Generated Query', query);
                    // Switch back to query mode
                    if (window.switchToTab) {
                        window.switchToTab(tabId);
                    }
                }
            }

            function generatePreviewQuery(tableId) {
                const query = \`SELECT * FROM \${tableId} LIMIT 20\`;

                // Create a new query tab with the preview query
                if (window.addNewQueryTab) {
                    const tabId = window.addNewQueryTab('Preview Query', query);
                    // Switch back to query mode
                    if (window.switchToTab) {
                        window.switchToTab(tabId);
                    }
                }
            }

            function refreshPreview(tabId) {
                const tab = tableReferenceTabs.find(t => t.id === tabId);
                if (tab && tab.activeSubTab === 'preview') {
                    renderPreviewTab(document.getElementById('tableReferenceSubTabContent'), tab);
                }
            }

            // Make utility functions available globally
            window.updateFieldSelection = updateFieldSelection;
            window.toggleAllFields = toggleAllFields;
            window.selectAllFields = selectAllFields;
            window.filterFields = filterFields;
            window.generateFieldQuery = generateFieldQuery;
            window.generatePreviewQuery = generatePreviewQuery;
            window.refreshPreview = refreshPreview;
            window.fetchTableRowCount = fetchTableRowCount;
        `;
    }
    
    /**
     * Export the table reference components functions
     */
    return {
        getTableReferenceComponentsJS: getTableReferenceComponentsJS
    };
    
});
