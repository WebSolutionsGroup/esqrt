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

                // Data information will be loaded dynamically

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
                            </div>
                        </div>
                    </div>
                \`;

                // Add CSS for loading spinner and table functionality if not already added
                if (!document.getElementById('fieldsTableCSS')) {
                    const style = document.createElement('style');
                    style.id = 'fieldsTableCSS';
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
                        .date-error {
                            color: var(--codeoss-text-danger) !important;
                            cursor: pointer;
                        }
                        .date-error:hover {
                            text-decoration: underline;
                        }

                        /* Sortable table styles */
                        .sortable-header:hover {
                            background-color: var(--codeoss-bg-hover) !important;
                        }
                        .sort-indicator {
                            margin-left: 4px;
                            font-size: 10px;
                            opacity: 0.5;
                        }
                        .sort-indicator.asc::after {
                            content: '▲';
                            opacity: 1;
                        }
                        .sort-indicator.desc::after {
                            content: '▼';
                            opacity: 1;
                        }

                        /* Column resizer styles */
                        .column-resizer:hover {
                            background-color: var(--codeoss-accent) !important;
                        }
                        .column-resizer.resizing {
                            background-color: var(--codeoss-accent) !important;
                        }

                        /* Table row styling */
                        .fields-table tbody tr:nth-child(even) {
                            background-color: rgba(255, 255, 255, 0.02);
                        }
                        .fields-table tbody tr:nth-child(odd) {
                            background-color: transparent;
                        }
                        .fields-table tbody tr:hover {
                            background-color: var(--codeoss-bg-hover) !important;
                        }
                    \`;
                    document.head.appendChild(style);
                }

                // Start fetching row count
                fetchTableRowCount(tableData.id);
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
                                <div style="color: var(--codeoss-text-secondary); font-size: 12px; margin-top: 4px; display: flex; align-items: center; gap: 8px;">
                                    <button type="button" onclick="clearAllFields()" style="padding: 2px 4px; background: transparent; color: var(--codeoss-text-secondary); border: none; cursor: pointer; font-size: 12px; display: flex; align-items: center;" title="Clear selection">
                                        ✕
                                    </button>
                                    <span class="field-selection-count">0 fields selected</span>
                                    <button type="button" onclick="generateFieldQuery()" style="padding: 3px 8px; background: var(--codeoss-accent); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; font-weight: 500;">
                                        <span style="font-size: 9px;">🔍</span> Query
                                    </button>
                                </div>
                            </div>
                            <div class="fields-controls">
                                <button type="button" onclick="selectAllFields()" style="padding: 4px 8px; background: var(--codeoss-btn-bg); color: var(--codeoss-btn-text); border: 1px solid var(--codeoss-border); border-radius: 3px; cursor: pointer; font-size: 11px;">
                                    ✓ Select All
                                </button>
                            </div>
                        </div>
                        
                        <div class="fields-filter" style="margin-bottom: 16px;">
                            <input type="text" placeholder="Filter Search Fields" 
                                   onkeyup="filterFields(this.value)"
                                   style="width: 100%; padding: 6px 8px; border: 1px solid var(--codeoss-border); background: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border-radius: 3px; font-size: 12px;">
                        </div>
                        
                        <div class="fields-table-container" style="border: 1px solid var(--codeoss-border); border-radius: 3px; overflow: auto; position: relative;">
                            <table class="fields-table sortable-table" style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">
                                <thead style="background: var(--codeoss-bg-secondary); position: sticky; top: 0; z-index: 10;">
                                    <tr>
                                        <th class="resizable-column" style="padding: 8px; text-align: center; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 40px; position: relative;">
                                            <input type="checkbox" id="selectAllCheckbox" onchange="toggleAllFields(this.checked)" style="margin: 0;">
                                        </th>
                                        <th class="resizable-column sortable-header" data-column="fieldId" style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 180px; position: relative; cursor: pointer; user-select: none;">
                                            Field Id <span class="sort-indicator"></span>
                                            <div class="column-resizer" style="position: absolute; right: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; background: transparent;"></div>
                                        </th>
                                        <th class="resizable-column sortable-header" data-column="name" style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 200px; position: relative; cursor: pointer; user-select: none;">
                                            Name <span class="sort-indicator"></span>
                                            <div class="column-resizer" style="position: absolute; right: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; background: transparent;"></div>
                                        </th>
                                        <th class="resizable-column sortable-header" data-column="type" style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 100px; position: relative; cursor: pointer; user-select: none;">
                                            Type <span class="sort-indicator"></span>
                                            <div class="column-resizer" style="position: absolute; right: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; background: transparent;"></div>
                                        </th>
                                        <th class="resizable-column sortable-header" data-column="available" style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 80px; position: relative; cursor: pointer; user-select: none;">
                                            Available <span class="sort-indicator"></span>
                                            <div class="column-resizer" style="position: absolute; right: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; background: transparent;"></div>
                                        </th>
                                        <th class="resizable-column sortable-header" data-column="feature" style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 100px; position: relative; cursor: pointer; user-select: none;">
                                            Feature <span class="sort-indicator"></span>
                                            <div class="column-resizer" style="position: absolute; right: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; background: transparent;"></div>
                                        </th>
                                        <th class="resizable-column sortable-header" data-column="permission" style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 100px; position: relative; cursor: pointer; user-select: none;">
                                            Permission <span class="sort-indicator"></span>
                                            <div class="column-resizer" style="position: absolute; right: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; background: transparent;"></div>
                                        </th>
                                        <th class="resizable-column sortable-header" data-column="join" style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 120px; position: relative; cursor: pointer; user-select: none;">
                                            Join <span class="sort-indicator"></span>
                                            <div class="column-resizer" style="position: absolute; right: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; background: transparent;"></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${renderFieldRows(queryableFields)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                \`;

                // Initialize table functionality after DOM is updated
                setTimeout(() => {
                    initializeFieldsTable();
                    // Update field selection count to reflect saved selections
                    updateFieldSelection();
                }, 50);
            }
            
            /**
             * Render field rows for the fields table
             */
            function renderFieldRows(fields) {
                if (!fields || fields.length === 0) {
                    return \`
                        <tr>
                            <td colspan="8" style="padding: 20px; text-align: center; color: var(--codeoss-text-secondary); font-style: italic;">
                                No queryable fields found
                            </td>
                        </tr>
                    \`;
                }
                
                return fields.map((field, index) => {
                    // Get the current tab to check for saved field selections
                    const activeTab = queryTabs.find(tab => tab.isActive && tab.isTableReference);
                    let isChecked = '';

                    // Check if this field should be selected based on saved state
                    if (activeTab && activeTab.selectedFields && activeTab.selectedFields.includes(field.id)) {
                        isChecked = 'checked';
                    }

                    // Debug: Log field properties for the first few fields
                    if (index < 3) {
                        console.log('Field ' + index + ' properties:', Object.keys(field));
                        console.log('Field ' + index + ' data:', field);

                        // Specifically log join-related properties
                        const joinProps = ['join', 'joinField', 'joinTo', 'relationship', 'recordType', 'targetRecordType', 'sourceTargetType', 'selectOptions', 'recordTypeId'];
                        const foundJoinProps = {};
                        joinProps.forEach(prop => {
                            if (field[prop] !== undefined) {
                                foundJoinProps[prop] = field[prop];
                            }
                        });
                        if (Object.keys(foundJoinProps).length > 0) {
                            console.log('Field ' + index + ' join-related properties:', foundJoinProps);
                        }
                    }

                    // Available status
                    const available = field.available !== false ? 'YES' : 'NO';

                    // Feature - try different possible property names
                    const feature = field.feature || field.featureRequired || field.requiredFeature || field.features || '-';

                    // Permission - try different possible property names
                    const permission = field.permission || field.permissions || field.requiredPermission || field.permissionRequired || '-';

                    // Join - try different possible property names and analyze field structure
                    let join = '-';

                    // Try direct join properties first
                    if (field.join) {
                        join = field.join;
                    } else if (field.joinField) {
                        join = field.joinField;
                    } else if (field.joinTo) {
                        join = field.joinTo;
                    } else if (field.relationship) {
                        join = field.relationship;
                    } else if (field.recordType) {
                        // If field has a recordType, it might be a join field
                        join = field.recordType;
                    } else if (field.targetRecordType) {
                        join = field.targetRecordType;
                    } else if (field.sourceTargetType) {
                        // Check if field has sourceTargetType like joins do
                        const sourceTarget = field.sourceTargetType;
                        if (sourceTarget.label) {
                            join = sourceTarget.label;
                        } else if (sourceTarget.id) {
                            join = sourceTarget.id;
                        }
                    } else if (field.type && (field.type === 'SELECT' || field.type === 'MULTISELECT')) {
                        // SELECT fields often reference other records
                        if (field.selectOptions && field.selectOptions.recordType) {
                            join = field.selectOptions.recordType;
                        } else if (field.recordTypeId) {
                            join = field.recordTypeId;
                        }
                    } else if (field.id && field.id.includes('.')) {
                        // Field IDs with dots often indicate joins (e.g., "contact.company")
                        const parts = field.id.split('.');
                        if (parts.length > 1) {
                            join = parts[0]; // The table being joined to
                        }
                    }

                    // Get the actual data type - try different possible properties
                    let dataType = 'STRING'; // Default fallback
                    if (field.dataType) {
                        dataType = field.dataType;
                    } else if (field.fieldType) {
                        dataType = field.fieldType;
                    } else if (field.returnType) {
                        dataType = field.returnType;
                    } else if (field.type && field.type !== 'RECORD_FIELD') {
                        dataType = field.type;
                    }

                    return \`
                        <tr class="field-row" style="border-bottom: 1px solid var(--codeoss-border-light);"
                            data-field-id="\${field.id}" data-name="\${field.label}" data-type="\${dataType}"
                            data-available="\${available}" data-feature="\${feature}" data-permission="\${permission}" data-join="\${join}">
                            <td style="padding: 6px 8px; text-align: center;">
                                <input type="checkbox" class="field-checkbox" value="\${field.id}" \${isChecked} onchange="updateFieldSelection()" style="margin: 0;">
                            </td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-primary); font-family: monospace; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                \${field.id}
                            </td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                \${field.label}
                            </td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${dataType}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${available}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${feature}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${permission}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${join}</td>
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
                            <div class="joins-filter" style="margin-bottom: 16px;">
                                <input type="text" placeholder="Filter Search Joins"
                                       onkeyup="filterJoins(this.value)"
                                       style="width: 100%; padding: 6px 8px; border: 1px solid var(--codeoss-border); background: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border-radius: 3px; font-size: 12px;">
                            </div>

                            <div class="joins-table-container" style="border: 1px solid var(--codeoss-border); border-radius: 3px; overflow: auto; position: relative;">
                                <table class="joins-table sortable-table" style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">
                                    <thead style="background: var(--codeoss-bg-secondary); position: sticky; top: 0; z-index: 10;">
                                        <tr>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 100px;">Join Type</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 300px;">Source/Target Record Type</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 200px;">Field ID</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 100px;">Cardinality</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); width: 80px;">Available</th>
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

                // Initialize table functionality after DOM is updated
                setTimeout(() => {
                    initializeJoinsTable();
                }, 50);
            }
            
            /**
             * Render join rows for the joins table
             */
            function renderJoinRows(joins) {
                return joins.map((join, index) => {
                    // Debug: Log join structure for first few joins
                    if (index < 3) {
                        console.log('Join ' + index + ' structure:', join);
                    }

                    const sourceTarget = join.sourceTargetType || {};
                    const joinPairs = sourceTarget.joinPairs || [];
                    const fieldIds = joinPairs.map(pair => pair.label || pair.id).join(', ');
                    const available = join.available !== false ? 'YES' : 'NO';

                    // Determine join type based on NetSuite patterns
                    let joinType = 'Regular Join'; // Default

                    // Check for specific join type indicators
                    if (join.joinType) {
                        // Use the joinType property if available
                        switch(join.joinType.toLowerCase()) {
                            case 'jointo':
                            case 'join_to':
                                joinType = 'Join To';
                                break;
                            case 'joinfrom':
                            case 'join_from':
                                joinType = 'Join From';
                                break;
                            case 'regular':
                            case 'regulerjoin':
                                joinType = 'Regular Join';
                                break;
                            // Map NetSuite internal types to standard nomenclature
                            case 'automatic':
                                joinType = 'Regular Join';
                                break;
                            case 'polymorphic':
                                joinType = 'Join To';
                                break;
                            case 'inverse':
                                joinType = 'Join From';
                                break;
                            default:
                                joinType = join.joinType;
                        }
                    } else if (join.type && join.type !== 'JOIN') {
                        // Map NetSuite internal types to standard nomenclature
                        switch(join.type.toLowerCase()) {
                            case 'automatic':
                                joinType = 'Regular Join';
                                break;
                            case 'polymorphic':
                                joinType = 'Join To';
                                break;
                            case 'inverse':
                                joinType = 'Join From';
                                break;
                            case 'jointo':
                            case 'join_to':
                                joinType = 'Join To';
                                break;
                            case 'joinfrom':
                            case 'join_from':
                                joinType = 'Join From';
                                break;
                            case 'regular':
                            case 'regulerjoin':
                                joinType = 'Regular Join';
                                break;
                            default:
                                joinType = join.type;
                        }
                    } else if (join.relationship) {
                        // Check relationship type
                        const rel = join.relationship.toLowerCase();
                        if (rel.includes('to')) {
                            joinType = 'Join To';
                        } else if (rel.includes('from')) {
                            joinType = 'Join From';
                        }
                    } else if (join.id) {
                        // Analyze the join ID for patterns
                        const id = join.id.toLowerCase();
                        if (id.includes('jointo') || id.includes('join_to')) {
                            joinType = 'Join To';
                        } else if (id.includes('joinfrom') || id.includes('join_from')) {
                            joinType = 'Join From';
                        }
                    }

                    return \`
                        <tr class="join-row" style="border-bottom: 1px solid var(--codeoss-border-light);">
                            <td style="padding: 6px 8px; color: var(--codeoss-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${joinType}">\${joinType}</td>
                            <td style="padding: 6px 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${sourceTarget.label} (\${sourceTarget.id})">
                                <a href="#" onclick="openTableReference('\${sourceTarget.id}', '\${sourceTarget.label}')"
                                   style="color: var(--codeoss-accent); text-decoration: none; font-weight: 500;">
                                    \${sourceTarget.label}
                                </a>
                                <span style="color: var(--codeoss-text-secondary); margin-left: 8px; font-size: 10px; font-family: monospace;">(\${sourceTarget.id})</span>
                            </td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary); font-family: monospace; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${fieldIds || '-'}">\${fieldIds || '-'}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${join.cardinality || '-'}">\${join.cardinality || '-'}</td>
                            <td style="padding: 6px 8px; color: var(--codeoss-text-secondary); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${available}">\${available}</td>
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
                    <div class="table-preview-content" style="height: 100%; display: flex; flex-direction: column;">
                        <div class="preview-header" style="padding: 8px 12px; border-bottom: 1px solid var(--codeoss-border); background: var(--codeoss-bg-primary); flex-shrink: 0; display: flex; justify-content: flex-end;">
                            <button onclick="refreshPreview('\${tab.id}')" style="
                                padding: 6px 12px;
                                background: var(--codeoss-bg-secondary);
                                color: var(--codeoss-text-primary);
                                border: 1px solid var(--codeoss-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: background-color 0.2s ease;
                            " onmouseover="this.style.background='var(--codeoss-bg-tertiary)'" onmouseout="this.style.background='var(--codeoss-bg-secondary)'">
                                🔄 Refresh
                            </button>
                        </div>
                        <div class="preview-loading" style="flex: 1; padding: 40px; text-align: center; color: var(--codeoss-text-secondary);">
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
                const container = document.querySelector('.preview-loading');
                if (!container) return;

                // Get the selected page size
                const pageSizeSelect = document.getElementById(\`previewPageSize_\${tab.id}\`);
                const pageSize = pageSizeSelect ? pageSizeSelect.value : '50';

                // Show loading state
                container.innerHTML = \`
                    <div style="padding: 40px; text-align: center; color: var(--codeoss-text-secondary);">
                        <div style="font-size: 14px; margin-bottom: 10px;">Loading preview data...</div>
                        <div style="font-size: 12px;">Executing SELECT * FROM \${tab.tableId} (limit=\${pageSize})</div>
                    </div>
                \`;

                // Execute the preview query (NetSuite uses URL parameters for LIMIT, not SQL clause)
                const previewQuery = \`SELECT * FROM \${tab.tableId}\`;

                // Use the existing query execution system with custom parameters
                if (window.executeQueryDirect) {
                    // Prepare request payload with custom row limits for preview
                    const requestPayload = {
                        'function': 'queryExecute',
                        query: previewQuery,
                        rowBegin: 1,
                        rowEnd: parseInt(pageSize),
                        paginationEnabled: true,
                        returnTotals: false,
                        viewsEnabled: false
                    };

                    // Execute the query directly
                    fetch(window.location.href, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestPayload)
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(\`HTTP error! status: \${response.status}\`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Find the main preview container (parent of .preview-loading)
                        const mainContainer = container.closest('.table-preview-content') || container.parentElement;

                        if (data && data.records) {
                            renderPreviewTable(mainContainer, data, tab);
                        } else if (data && data.error) {
                            showPreviewError(mainContainer, data.error, tab);
                        } else {
                            showPreviewError(mainContainer, 'No data returned', tab);
                        }
                    })
                    .catch(error => {
                        // Find the main preview container (parent of .preview-loading)
                        const mainContainer = container.closest('.table-preview-content') || container.parentElement;
                        showPreviewError(mainContainer, error.message, tab);
                    });
                } else {
                    // Fallback if query execution system not available
                    setTimeout(() => {
                        showPreviewPlaceholder(container, tab);
                    }, 1000);
                }
            }

            /**
             * Render preview table with data
             */
            function renderPreviewTable(container, data, tab) {
                // Handle the data format from the query engine
                let columns = [];
                let rows = [];

                if (data && data.records && Array.isArray(data.records)) {
                    rows = data.records;

                    // Extract column names from the first record
                    if (rows.length > 0) {
                        columns = Object.keys(rows[0])
                            .filter(key => key !== 'rownumber') // Exclude the ROWNUM column added by pagination
                            .map(key => ({ name: key }));
                    }
                } else if (data && data.columns && data.rows) {
                    // Handle alternative data format
                    columns = data.columns;
                    rows = data.rows;
                } else {
                    showPreviewError(container, 'Invalid data format received', tab);
                    return;
                }

                // Get the selected page size for display
                const pageSizeSelect = document.getElementById(\`previewPageSize_\${tab.id}\`);
                const currentPageSize = pageSizeSelect ? pageSizeSelect.value : '50';

                container.innerHTML = \`
                    <div class="table-preview-content" style="height: 100%; display: flex; flex-direction: column;">
                        <div class="preview-header" style="padding: 8px 12px; border-bottom: 1px solid var(--codeoss-border); background: var(--codeoss-bg-primary); flex-shrink: 0; display: flex; justify-content: flex-end;">
                            <button onclick="refreshPreview('\${tab.id}')" style="
                                padding: 6px 12px;
                                background: var(--codeoss-bg-secondary);
                                color: var(--codeoss-text-primary);
                                border: 1px solid var(--codeoss-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: background-color 0.2s ease;
                            " onmouseover="this.style.background='var(--codeoss-bg-tertiary)'" onmouseout="this.style.background='var(--codeoss-bg-secondary)'">
                                🔄 Refresh
                            </button>
                        </div>
                        <div class="preview-table-container" style="flex: 1; overflow: auto; position: relative;">
                            <table class="preview-table sortable-table" style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: auto; min-width: \${columns.length * 150}px;">
                                <thead style="background: var(--codeoss-bg-secondary); position: sticky; top: 0; z-index: 10;">
                                    <tr>
                                        \${columns.map((column, index) => {
                                            const sortState = tab.sortState || {};
                                            const isCurrentSort = sortState.column === column.name;
                                            const sortIcon = isCurrentSort
                                                ? (sortState.direction === 'asc' ? '↑' : '↓')
                                                : '⇅';
                                            const sortOpacity = isCurrentSort ? '1' : '0.5';

                                            return \`
                                                <th onclick="sortPreviewTable('\${tab.id}', '\${column.name}')" style="padding: 8px; text-align: left; border-bottom: 1px solid var(--codeoss-border); font-weight: 600; color: var(--codeoss-text-primary); min-width: 150px; white-space: nowrap; cursor: pointer; user-select: none; position: relative;"
                                                    title="Click to sort by \${column.name}">
                                                    <span style="display: inline-block; width: calc(100% - 20px);">\${column.name}</span>
                                                    <span class="sort-indicator" style="opacity: \${sortOpacity}; position: absolute; right: 8px; top: 50%; transform: translateY(-50%);">\${sortIcon}</span>
                                                </th>
                                            \`;
                                        }).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    \${rows.map((row, rowIndex) => \`
                                        <tr class="preview-row" style="border-bottom: 1px solid var(--codeoss-border-light);">
                                            \${columns.map((column, colIndex) => {
                                                const cellValue = row[column.name] || '';
                                                const displayValue = cellValue === null || cellValue === undefined ? '' : String(cellValue);
                                                const truncatedValue = displayValue.length > 100 ? displayValue.substring(0, 100) + '...' : displayValue;

                                                return \`
                                                    <td style="padding: 6px 8px; color: var(--codeoss-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; text-align: left;"
                                                        title="\${displayValue}">
                                                        \${truncatedValue}
                                                    </td>
                                                \`;
                                            }).join('')}
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                        </div>
                                </tbody>
                            </table>
                        </div>

                        <div class="preview-pagination" style="padding: 12px 16px; border-top: 1px solid var(--codeoss-border); background: var(--codeoss-bg-secondary); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                            <div style="display: flex; align-items: center; gap: 8px; color: var(--codeoss-text-secondary); font-size: 12px;">
                                <span>Results per page:</span>
                                <select id="previewPageSize_\${tab.id}" onchange="updatePreviewPageSize('\${tab.id}', this.value)" style="padding: 4px 8px; border: 1px solid var(--codeoss-border); background: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border-radius: 3px; font-size: 11px;">
                                    <option value="50" \${currentPageSize === '50' ? 'selected' : ''}>50</option>
                                    <option value="100" \${currentPageSize === '100' ? 'selected' : ''}>100</option>
                                    <option value="200" \${currentPageSize === '200' ? 'selected' : ''}>200</option>
                                </select>
                            </div>

                            <div style="color: var(--codeoss-text-secondary); font-size: 12px;">
                                1 - \${rows.length} of \${rows.length}
                            </div>
                        </div>
                    </div>
                \`;

                // Initialize table functionality
                setTimeout(() => {
                    initializePreviewTable();
                }, 50);
            }

            /**
             * Show preview error message
             */
            function showPreviewError(container, error, tab) {
                container.innerHTML = \`
                    <div style="height: 100%; display: flex; flex-direction: column;">
                        <div class="preview-header" style="padding: 8px 12px; border-bottom: 1px solid var(--codeoss-border); background: var(--codeoss-bg-primary); flex-shrink: 0; display: flex; justify-content: flex-end;">
                            <button onclick="refreshPreview('\${tab.id}')" style="
                                padding: 6px 12px;
                                background: var(--codeoss-bg-secondary);
                                color: var(--codeoss-text-primary);
                                border: 1px solid var(--codeoss-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: background-color 0.2s ease;
                            " onmouseover="this.style.background='var(--codeoss-bg-tertiary)'" onmouseout="this.style.background='var(--codeoss-bg-secondary)'">
                                🔄 Refresh
                            </button>
                        </div>
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                            <div style="text-align: center; color: var(--codeoss-text-secondary); border: 1px solid var(--codeoss-border); border-radius: 3px; padding: 40px; max-width: 500px;">
                                <div style="color: var(--codeoss-error); font-weight: 500; margin-bottom: 8px;">
                                    ⚠️ Error Loading Preview
                                </div>
                                <div style="font-size: 12px; margin-bottom: 16px;">
                                    \${error}
                                </div>
                                <button onclick="generatePreviewQuery('\${tab.tableId}')"
                                        style="padding: 8px 16px; background: var(--codeoss-accent); color: white; border: none; border-radius: 3px; cursor: pointer;">
                                    Generate Preview Query
                                </button>
                            </div>
                        </div>
                    </div>
                \`;
            }

            /**
             * Show preview placeholder when query system not available
             */
            function showPreviewPlaceholder(container, tab) {
                container.innerHTML = \`
                    <div style="height: 100%; display: flex; flex-direction: column;">
                        <div class="preview-header" style="padding: 8px 12px; border-bottom: 1px solid var(--codeoss-border); background: var(--codeoss-bg-primary); flex-shrink: 0; display: flex; justify-content: flex-end;">
                            <button onclick="refreshPreview('\${tab.id}')" style="
                                padding: 6px 12px;
                                background: var(--codeoss-bg-secondary);
                                color: var(--codeoss-text-primary);
                                border: 1px solid var(--codeoss-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: background-color 0.2s ease;
                            " onmouseover="this.style.background='var(--codeoss-bg-tertiary)'" onmouseout="this.style.background='var(--codeoss-bg-secondary)'">
                                🔄 Refresh
                            </button>
                        </div>
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                            <div style="text-align: center; color: var(--codeoss-text-secondary); font-style: italic; border: 1px solid var(--codeoss-border); border-radius: 3px; padding: 40px; max-width: 500px;">
                                Preview functionality requires query execution system
                                <br><br>
                                <button onclick="generatePreviewQuery('\${tab.tableId}')"
                                        style="padding: 8px 16px; background: var(--codeoss-accent); color: white; border: none; border-radius: 3px; cursor: pointer;">
                                    Generate Preview Query
                                </button>
                            </div>
                        </div>
                    </div>
                \`;
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
             * Fetch date information for a table (MAX modified date and MIN created date)
             */
            function fetchTableDates(tableId) {
                const lastModifiedElement = document.getElementById(\`lastModifiedDisplay_\${tableId}\`);
                const firstCreatedElement = document.getElementById(\`firstCreatedDisplay_\${tableId}\`);

                if (!lastModifiedElement || !firstCreatedElement) return;

                // Prepare the date query - try common date field names
                const dateQuery = \`
                    SELECT
                        MAX(CASE
                            WHEN modifieddate IS NOT NULL THEN modifieddate
                            WHEN lastmodifieddate IS NOT NULL THEN lastmodifieddate
                            WHEN modified IS NOT NULL THEN modified
                            WHEN datemodified IS NOT NULL THEN datemodified
                            ELSE NULL
                        END) as last_modified,
                        MIN(CASE
                            WHEN createddate IS NOT NULL THEN createddate
                            WHEN datecreated IS NOT NULL THEN datecreated
                            WHEN created IS NOT NULL THEN created
                            WHEN createdate IS NOT NULL THEN createdate
                            ELSE NULL
                        END) as first_created
                    FROM \${tableId}
                \`;

                // Use the existing query execution system
                const requestPayload = {
                    'function': 'queryExecute',
                    query: dateQuery,
                    rowBegin: 1,
                    rowEnd: 1,
                    paginationEnabled: false,
                    returnTotals: false,
                    viewsEnabled: false
                };

                // Execute the date query
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
                        // Check if error is due to missing date columns (common case)
                        const errorMsg = data.error.message || data.error.toString() || '';
                        if (errorMsg.toLowerCase().includes('invalid column') ||
                            errorMsg.toLowerCase().includes('column not found') ||
                            errorMsg.toLowerCase().includes('unknown column')) {
                            // Table doesn't have date columns, show dash
                            lastModifiedElement.innerHTML = \`<span style="color: var(--codeoss-text-secondary);">-</span>\`;
                            firstCreatedElement.innerHTML = \`<span style="color: var(--codeoss-text-secondary);">-</span>\`;
                        } else {
                            // Other error, show retry option
                            lastModifiedElement.innerHTML = \`
                                <span class="date-error" onclick="fetchTableDates('\${tableId}')" title="Click to retry: \${errorMsg}">
                                    Error (click to retry)
                                </span>
                            \`;
                            firstCreatedElement.innerHTML = \`
                                <span class="date-error" onclick="fetchTableDates('\${tableId}')" title="Click to retry: \${errorMsg}">
                                    Error (click to retry)
                                </span>
                            \`;
                        }
                    } else if (data.records && data.records.length > 0) {
                        // Successfully got date information
                        const record = data.records[0];
                        const lastModified = record.last_modified || record.LAST_MODIFIED;
                        const firstCreated = record.first_created || record.FIRST_CREATED;

                        // Format dates
                        const formatDate = (dateStr) => {
                            if (!dateStr || dateStr === null || dateStr === undefined) return '-';
                            try {
                                const date = new Date(dateStr);
                                if (isNaN(date.getTime())) return '-';
                                return date.toISOString().split('T')[0]; // YYYY-MM-DD format
                            } catch (e) {
                                return '-'; // Return dash if parsing fails
                            }
                        };

                        lastModifiedElement.innerHTML = \`
                            <span style="color: var(--codeoss-text-primary);">\${formatDate(lastModified)}</span>
                        \`;
                        firstCreatedElement.innerHTML = \`
                            <span style="color: var(--codeoss-text-primary);">\${formatDate(firstCreated)}</span>
                        \`;
                    } else {
                        // No data returned (empty table)
                        lastModifiedElement.innerHTML = \`<span style="color: var(--codeoss-text-secondary);">-</span>\`;
                        firstCreatedElement.innerHTML = \`<span style="color: var(--codeoss-text-secondary);">-</span>\`;
                    }
                })
                .catch(error => {
                    console.error('Error fetching table dates:', error);
                    // For network errors, show retry option
                    lastModifiedElement.innerHTML = \`
                        <span class="date-error" onclick="fetchTableDates('\${tableId}')" title="Click to retry: \${error.message}">
                            Network error (click to retry)
                        </span>
                    \`;
                    firstCreatedElement.innerHTML = \`
                        <span class="date-error" onclick="fetchTableDates('\${tableId}')" title="Click to retry: \${error.message}">
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

                // Save selected fields to the active tab
                const activeTab = queryTabs.find(tab => tab.isActive && tab.isTableReference);
                if (activeTab) {
                    const selectedFields = Array.from(document.querySelectorAll('.field-checkbox:checked'))
                        .map(checkbox => checkbox.value);
                    activeTab.selectedFields = selectedFields;
                }

                // Update the selection count display
                const countDisplay = document.querySelector('.field-selection-count');
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

            function clearAllFields() {
                toggleAllFields(false);
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

            /**
             * Filter joins table based on search term
             */
            function filterJoins(searchTerm) {
                const rows = document.querySelectorAll('.join-row');
                const searchLower = searchTerm.toLowerCase();

                rows.forEach(row => {
                    // Search in join type (column 1), source/target record type (column 2), and field ID (column 3)
                    const joinType = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
                    const recordType = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                    const fieldId = row.querySelector('td:nth-child(3)').textContent.toLowerCase();

                    if (joinType.includes(searchLower) ||
                        recordType.includes(searchLower) ||
                        fieldId.includes(searchLower)) {
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
                const activeTab = queryTabs.find(tab => tab.isActive && tab.isTableReference);
                if (!activeTab) {
                    alert('No active table reference tab found.');
                    return;
                }

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
                const query = \`SELECT * FROM \${tableId}\`;

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
                const tab = queryTabs.find(t => t.id === tabId && t.isTableReference);
                if (tab && tab.activeSubTab === 'preview') {
                    const contentElement = document.getElementById('tableReferenceSubTabContent_' + tab.id);
                    if (contentElement) {
                        renderPreviewTab(contentElement, tab);
                    }
                }
            }

            function updatePreviewPageSize(tabId, pageSize) {
                const tab = queryTabs.find(t => t.id === tabId && t.isTableReference);
                if (tab && tab.activeSubTab === 'preview') {
                    // Store the selected page size in the tab
                    tab.previewPageSize = pageSize;

                    // Reload the preview data with new page size
                    const container = document.querySelector('.preview-loading');
                    if (container) {
                        loadPreviewData(tab);
                    }
                }
            }

            /**
             * Initialize table sorting and resizing functionality
             */
            function initializeFieldsTable() {
                // Wait for DOM to be ready and find the table
                const fieldsTable = document.querySelector('.fields-table');
                if (!fieldsTable) {
                    console.warn('Fields table not found, retrying...');
                    setTimeout(initializeFieldsTable, 100);
                    return;
                }

                // Remove any existing event listeners to prevent duplicates
                const existingHeaders = fieldsTable.querySelectorAll('.sortable-header[data-initialized="true"]');
                if (existingHeaders.length > 0) {
                    return; // Already initialized
                }

                // Initialize column sorting
                const sortableHeaders = fieldsTable.querySelectorAll('.sortable-header');

                sortableHeaders.forEach((header) => {
                    // Mark as initialized
                    header.setAttribute('data-initialized', 'true');

                    header.addEventListener('click', function(e) {
                        // Don't sort if clicking on the resizer
                        if (e.target.classList.contains('column-resizer')) {
                            return;
                        }

                        const column = this.getAttribute('data-column');
                        const indicator = this.querySelector('.sort-indicator');
                        const table = this.closest('table');
                        const tbody = table.querySelector('tbody');
                        const rows = Array.from(tbody.querySelectorAll('.field-row'));

                        if (rows.length === 0) return;

                        // Determine sort direction
                        let direction = 'asc';
                        if (indicator.classList.contains('asc')) {
                            direction = 'desc';
                        }

                        // Clear all sort indicators
                        table.querySelectorAll('.sort-indicator').forEach(ind => {
                            ind.classList.remove('asc', 'desc');
                        });

                        // Set current sort indicator
                        indicator.classList.add(direction);

                        // Sort rows
                        rows.sort((a, b) => {
                            let aVal, bVal;

                            // Get values based on column
                            switch(column) {
                                case 'fieldId':
                                    aVal = a.getAttribute('data-field-id') || '';
                                    bVal = b.getAttribute('data-field-id') || '';
                                    break;
                                case 'name':
                                    aVal = a.getAttribute('data-name') || '';
                                    bVal = b.getAttribute('data-name') || '';
                                    break;
                                case 'type':
                                    aVal = a.getAttribute('data-type') || '';
                                    bVal = b.getAttribute('data-type') || '';
                                    break;
                                case 'available':
                                    aVal = a.getAttribute('data-available') || '';
                                    bVal = b.getAttribute('data-available') || '';
                                    break;
                                case 'feature':
                                    aVal = a.getAttribute('data-feature') || '';
                                    bVal = b.getAttribute('data-feature') || '';
                                    break;
                                case 'permission':
                                    aVal = a.getAttribute('data-permission') || '';
                                    bVal = b.getAttribute('data-permission') || '';
                                    break;
                                case 'join':
                                    aVal = a.getAttribute('data-join') || '';
                                    bVal = b.getAttribute('data-join') || '';
                                    break;
                                default:
                                    aVal = '';
                                    bVal = '';
                            }

                            // Convert to lowercase for case-insensitive sorting
                            aVal = aVal.toLowerCase();
                            bVal = bVal.toLowerCase();

                            if (direction === 'asc') {
                                return aVal.localeCompare(bVal);
                            } else {
                                return bVal.localeCompare(aVal);
                            }
                        });

                        // Re-append sorted rows
                        rows.forEach(row => tbody.appendChild(row));
                    });
                });

                // Initialize column resizing
                const resizers = fieldsTable.querySelectorAll('.column-resizer');

                resizers.forEach(resizer => {
                    let isResizing = false;
                    let startX = 0;
                    let startWidth = 0;
                    let column = null;

                    resizer.addEventListener('mousedown', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        isResizing = true;
                        startX = e.clientX;
                        column = this.parentElement;
                        startWidth = parseInt(window.getComputedStyle(column).width, 10);

                        this.classList.add('resizing');
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                    });

                    document.addEventListener('mousemove', function(e) {
                        if (!isResizing) return;

                        const width = startWidth + e.clientX - startX;
                        if (width > 50) { // Minimum column width
                            column.style.width = width + 'px';
                        }
                    });

                    document.addEventListener('mouseup', function() {
                        if (!isResizing) return;

                        isResizing = false;
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';

                        const activeResizer = document.querySelector('.column-resizer.resizing');
                        if (activeResizer) {
                            activeResizer.classList.remove('resizing');
                        }
                    });
                });
            }

            /**
             * Initialize joins table sorting and resizing functionality
             */
            function initializeJoinsTable() {
                // Wait for DOM to be ready and find the table
                const joinsTable = document.querySelector('.joins-table');
                if (!joinsTable) {
                    console.warn('Joins table not found, retrying...');
                    setTimeout(initializeJoinsTable, 100);
                    return;
                }

                // Add sortable functionality to headers
                const headers = joinsTable.querySelectorAll('th');
                headers.forEach((header, index) => {
                    header.style.cursor = 'pointer';
                    header.style.userSelect = 'none';
                    header.style.position = 'relative';

                    // Add sort indicator
                    const sortIndicator = document.createElement('span');
                    sortIndicator.style.marginLeft = '5px';
                    sortIndicator.style.opacity = '0.5';
                    sortIndicator.textContent = '↕';
                    header.appendChild(sortIndicator);

                    // Add click handler for sorting
                    header.addEventListener('click', function() {
                        sortJoinsTable(index, header, sortIndicator);
                    });

                    // Add column resizer
                    const resizer = document.createElement('div');
                    resizer.className = 'column-resizer';
                    resizer.style.position = 'absolute';
                    resizer.style.top = '0';
                    resizer.style.right = '0';
                    resizer.style.width = '5px';
                    resizer.style.height = '100%';
                    resizer.style.cursor = 'col-resize';
                    resizer.style.userSelect = 'none';
                    header.appendChild(resizer);

                    // Add resize functionality
                    let isResizing = false;
                    let startX = 0;
                    let startWidth = 0;

                    resizer.addEventListener('mousedown', function(e) {
                        isResizing = true;
                        startX = e.clientX;
                        startWidth = parseInt(document.defaultView.getComputedStyle(header).width, 10);
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                        resizer.classList.add('resizing');
                        e.preventDefault();
                    });

                    document.addEventListener('mousemove', function(e) {
                        if (!isResizing) return;
                        const width = startWidth + e.clientX - startX;
                        if (width > 50) { // Minimum column width
                            header.style.width = width + 'px';
                        }
                    });

                    document.addEventListener('mouseup', function() {
                        if (!isResizing) return;
                        isResizing = false;
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                        const activeResizer = document.querySelector('.column-resizer.resizing');
                        if (activeResizer) {
                            activeResizer.classList.remove('resizing');
                        }
                    });
                });
            }

            /**
             * Sort joins table by column
             */
            function sortJoinsTable(columnIndex, header, indicator) {
                const table = document.querySelector('.joins-table tbody');
                const rows = Array.from(table.querySelectorAll('tr'));

                // Determine sort direction
                const currentSort = header.getAttribute('data-sort') || 'none';
                const newSort = currentSort === 'asc' ? 'desc' : 'asc';

                // Clear all sort indicators
                document.querySelectorAll('.joins-table th').forEach(th => {
                    th.setAttribute('data-sort', 'none');
                    const ind = th.querySelector('span');
                    if (ind) ind.textContent = '↕';
                });

                // Set new sort
                header.setAttribute('data-sort', newSort);
                indicator.textContent = newSort === 'asc' ? '↑' : '↓';

                // Sort rows
                rows.sort((a, b) => {
                    const aText = a.cells[columnIndex].textContent.trim();
                    const bText = b.cells[columnIndex].textContent.trim();

                    if (newSort === 'asc') {
                        return aText.localeCompare(bText);
                    } else {
                        return bText.localeCompare(aText);
                    }
                });

                // Re-append sorted rows
                rows.forEach(row => table.appendChild(row));
            }

            /**
             * Initialize preview table sorting and resizing functionality
             */
            function initializePreviewTable() {
                // Wait for DOM to be ready and find the table
                const previewTable = document.querySelector('.preview-table');
                if (!previewTable) {
                    console.warn('Preview table not found, retrying...');
                    setTimeout(initializePreviewTable, 100);
                    return;
                }

                // Add sortable functionality to headers
                const headers = previewTable.querySelectorAll('th');
                headers.forEach((header, index) => {
                    header.style.cursor = 'pointer';
                    header.style.userSelect = 'none';
                    header.style.position = 'relative';

                    // Add sort indicator
                    const sortIndicator = document.createElement('span');
                    sortIndicator.style.marginLeft = '5px';
                    sortIndicator.style.opacity = '0.5';
                    sortIndicator.textContent = '↕';
                    header.appendChild(sortIndicator);

                    // Add click handler for sorting
                    header.addEventListener('click', function() {
                        sortPreviewTable(index, header, sortIndicator);
                    });

                    // Add column resizer
                    const resizer = document.createElement('div');
                    resizer.className = 'column-resizer';
                    resizer.style.position = 'absolute';
                    resizer.style.top = '0';
                    resizer.style.right = '0';
                    resizer.style.width = '5px';
                    resizer.style.height = '100%';
                    resizer.style.cursor = 'col-resize';
                    resizer.style.userSelect = 'none';
                    header.appendChild(resizer);

                    // Add resize functionality
                    let isResizing = false;
                    let startX = 0;
                    let startWidth = 0;

                    resizer.addEventListener('mousedown', function(e) {
                        isResizing = true;
                        startX = e.clientX;
                        startWidth = parseInt(document.defaultView.getComputedStyle(header).width, 10);
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                        resizer.classList.add('resizing');
                        e.preventDefault();
                    });

                    document.addEventListener('mousemove', function(e) {
                        if (!isResizing) return;
                        const width = startWidth + e.clientX - startX;
                        if (width > 50) { // Minimum column width
                            header.style.width = width + 'px';
                        }
                    });

                    document.addEventListener('mouseup', function() {
                        if (!isResizing) return;
                        isResizing = false;
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                        const activeResizer = document.querySelector('.column-resizer.resizing');
                        if (activeResizer) {
                            activeResizer.classList.remove('resizing');
                        }
                    });
                });
            }

            /**
             * Sort preview table by column
             */
            function sortPreviewTable(tabId, columnName) {
                const table = document.querySelector('.preview-table');
                if (!table) return;

                const tbody = table.querySelector('tbody');
                const headers = table.querySelectorAll('th');
                if (!tbody || !headers.length) return;

                // Find the column index by looking at the column name span
                let columnIndex = -1;
                let targetHeader = null;
                headers.forEach((header, index) => {
                    // Look for the column name in the first span (which contains the column name)
                    const columnNameSpan = header.querySelector('span:first-child');
                    if (columnNameSpan && columnNameSpan.textContent.trim() === columnName) {
                        columnIndex = index;
                        targetHeader = header;
                    }
                });

                if (columnIndex === -1 || !targetHeader) return;

                // Get current sort direction
                const currentSort = targetHeader.getAttribute('data-sort') || 'none';
                const newSort = currentSort === 'asc' ? 'desc' : 'asc';

                // Update all sort indicators
                headers.forEach(header => {
                    header.setAttribute('data-sort', 'none');
                    const indicator = header.querySelector('.sort-indicator');
                    if (indicator) {
                        indicator.textContent = '⇅';
                        indicator.style.opacity = '0.5';
                    }
                });

                // Set new sort for target column
                targetHeader.setAttribute('data-sort', newSort);
                const targetIndicator = targetHeader.querySelector('.sort-indicator');
                if (targetIndicator) {
                    targetIndicator.textContent = newSort === 'asc' ? '↑' : '↓';
                    targetIndicator.style.opacity = '1';
                }

                // Sort rows
                const rows = Array.from(tbody.querySelectorAll('tr'));
                rows.sort((a, b) => {
                    const aText = a.cells[columnIndex].textContent.trim();
                    const bText = b.cells[columnIndex].textContent.trim();

                    // Try to parse as numbers for better sorting
                    const aNum = parseFloat(aText);
                    const bNum = parseFloat(bText);

                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return newSort === 'asc' ? aNum - bNum : bNum - aNum;
                    } else {
                        return newSort === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
                    }
                });

                // Re-append sorted rows
                rows.forEach(row => tbody.appendChild(row));
            }

            // Make utility functions available globally
            window.updateFieldSelection = updateFieldSelection;
            window.toggleAllFields = toggleAllFields;
            window.selectAllFields = selectAllFields;
            window.clearAllFields = clearAllFields;
            window.filterFields = filterFields;
            window.filterJoins = filterJoins;
            window.generateFieldQuery = generateFieldQuery;
            window.generatePreviewQuery = generatePreviewQuery;
            window.refreshPreview = refreshPreview;
            window.updatePreviewPageSize = updatePreviewPageSize;
            window.fetchTableRowCount = fetchTableRowCount;
            window.fetchTableDates = fetchTableDates;
            window.initializeFieldsTable = initializeFieldsTable;
            window.initializeJoinsTable = initializeJoinsTable;
            window.initializePreviewTable = initializePreviewTable;

            // Make rendering functions available globally
            window.renderOverviewTab = renderOverviewTab;
            window.renderFieldsTab = renderFieldsTab;
            window.renderJoinsTab = renderJoinsTab;
            window.renderPreviewTab = renderPreviewTab;
        `;
    }
    
    /**
     * Export the table reference components functions
     */
    return {
        getTableReferenceComponentsJS: getTableReferenceComponentsJS
    };
    
});
