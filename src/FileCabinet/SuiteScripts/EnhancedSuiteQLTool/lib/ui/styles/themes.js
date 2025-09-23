/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Themes and Styles
 * 
 * This module contains all CSS styles, theme definitions, and styling
 * utilities for the Enhanced SuiteQL Query Tool.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Get external CSS and JavaScript dependencies
     * 
     * @returns {string} HTML string with external dependencies
     */
    function getExternalDependencies() {
        return `
            <!-- Load dependencies in proper order with error handling -->
            <script>
                // Check if jQuery is already loaded (NetSuite includes it)
                if (typeof jQuery === 'undefined') {
                    document.write('<script src="${constants.CONFIG.CDN.JQUERY}"><\\/script>');
                }
            </script>

            <!-- Bootstrap CSS -->
            <link rel="stylesheet" href="${constants.CONFIG.CDN.BOOTSTRAP_CSS}">

            <!-- CodeMirror CSS first -->
            <link rel="stylesheet" href="${constants.CONFIG.CDN.CODEMIRROR_CSS}">
            <link rel="stylesheet" href="${constants.CONFIG.CDN.CODEMIRROR_HINT_CSS}">

            <!-- CodeMirror JavaScript -->
            <script src="${constants.CONFIG.CDN.CODEMIRROR_JS}"></script>
            <script src="${constants.CONFIG.CDN.CODEMIRROR_SQL}"></script>
            <script src="${constants.CONFIG.CDN.CODEMIRROR_HINT_JS}"></script>
            <script src="${constants.CONFIG.CDN.CODEMIRROR_SQL_HINT}"></script>
            <script src="${constants.CONFIG.CDN.CODEMIRROR_ADDON_MARK_SELECTION}" onload="/* console.log('CodeMirror mark-selection addon loaded') */"></script>

            <!-- Bootstrap JS (after jQuery) -->
            <script src="${constants.CONFIG.CDN.BOOTSTRAP_JS}"></script>
        `;
    }
    
    /**
     * Get DataTables external dependencies if enabled
     * 
     * @returns {string} HTML string with DataTables dependencies
     */
    function getDataTablesExternals() {
        if (constants.CONFIG.DATATABLES_ENABLED === true) {
            return `
                <link rel="stylesheet" type="text/css" href="${constants.CONFIG.CDN.DATATABLES_CSS}">
                <script type="text/javascript" charset="utf8" src="${constants.CONFIG.CDN.DATATABLES_JS}"></script>
            `;
        } else {
            return '';
        }
    }
    
    /**
     * Get the main CSS styles for the Code-OSS inspired interface
     * 
     * @returns {string} CSS styles as HTML string
     */
    function getMainStyles() {
        return `
            <style type="text/css">
                /* Code - OSS Style Variables - Default to Light Theme */
                :root {
                    --codeoss-bg-primary: #ffffff;
                    --codeoss-bg-secondary: #f3f3f3;
                    --codeoss-bg-tertiary: #e8e8e8;
                    --codeoss-text-primary: #333333;
                    --codeoss-text-secondary: #666666;
                    --codeoss-border: #e5e5e5;
                    --codeoss-accent: #007acc;
                    --codeoss-accent-hover: #005a9e;
                    --codeoss-success: #16825d;
                    --codeoss-warning: #bf8803;
                    --codeoss-error: #d73a49;
                    --codeoss-selection: #add6ff;
                    --codeoss-editor-bg: #ffffff;
                    --codeoss-sidebar-bg: #f3f3f3;
                    --codeoss-panel-bg: #f8f8f8;
                    --codeoss-toolbar-bg: #e8e8e8;
                    --codeoss-input-bg: #ffffff;
                    --codeoss-input-border: #d0d0d0;
                    --codeoss-button-bg: #007acc;
                    --codeoss-button-hover: #005a9e;
                    --codeoss-font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                }

                /* Dark theme override */
                .dark-theme {
                    --codeoss-bg-primary: #1e1e1e;
                    --codeoss-bg-secondary: #252526;
                    --codeoss-bg-tertiary: #2d2d30;
                    --codeoss-text-primary: #cccccc;
                    --codeoss-text-secondary: #969696;
                    --codeoss-border: #3e3e42;
                    --codeoss-accent: #007acc;
                    --codeoss-accent-hover: #1177bb;
                    --codeoss-success: #4ec9b0;
                    --codeoss-warning: #ffcc02;
                    --codeoss-error: #f44747;
                    --codeoss-selection: #264f78;
                    --codeoss-editor-bg: #1e1e1e;
                    --codeoss-sidebar-bg: #252526;
                    --codeoss-panel-bg: #181818;
                    --codeoss-toolbar-bg: #2d2d30;
                    --codeoss-input-bg: #3c3c3c;
                    --codeoss-input-border: #3e3e42;
                    --codeoss-button-bg: #0e639c;
                    --codeoss-button-hover: #1177bb;
                }

                /* Base styles */
                body {
                    background-color: var(--codeoss-bg-primary);
                    color: var(--codeoss-text-primary);
                    font-family: var(--codeoss-font-family);
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }

                /* Preserve NetSuite header and navigation */
                body {
                    overflow: hidden !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* NetSuite form container adjustments */
                .uir-page-title-secondline,
                .uir-page-title,
                form[name="main_form"],
                table[role="presentation"],
                .uir-page-title-firstline {
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* Keep NetSuite page title visible but clean */
                .uir-page-title-secondline {
                    display: block !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* Override NetSuite's default table styling */
                table[role="presentation"] {
                    width: 100% !important;
                    border: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border-spacing: 0 !important;
                    border-collapse: collapse !important;
                }

                table[role="presentation"] td {
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                }

                /* Ensure proper viewport usage */
                html {
                    height: 100% !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* Override NetSuite container restrictions */
                #div__bodytab,
                #div__body,
                .bglt {
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* Remove default NetSuite spacing */
                .uir-page-title-firstline {
                    margin-bottom: 0 !important;
                    padding-bottom: 0 !important;
                }
            </style>
        `;
    }
    
    /**
     * Get component-specific styles
     * 
     * @returns {string} CSS styles for UI components
     */
    function getComponentStyles() {
        return `
            <style type="text/css">
                /* Code - OSS style toolbar */
                .codeoss-toolbar {
                    background-color: var(--codeoss-toolbar-bg);
                    border-bottom: 1px solid var(--codeoss-border);
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 35px;
                }

                .codeoss-toolbar h5 {
                    margin: 0;
                    color: var(--codeoss-text-primary);
                    font-size: 13px;
                    font-weight: 400;
                }

                .codeoss-toolbar .toolbar-buttons {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                /* Code - OSS style buttons */
                .codeoss-btn {
                    background-color: var(--codeoss-button-bg);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    font-size: 11px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-family: var(--codeoss-font-family);
                    transition: background-color 0.2s;
                }

                .codeoss-btn:hover {
                    background-color: var(--codeoss-button-hover);
                }

                .codeoss-btn-secondary {
                    background-color: var(--codeoss-bg-tertiary);
                    color: var(--codeoss-text-primary);
                    border: 1px solid var(--codeoss-border);
                }

                .codeoss-btn-secondary:hover {
                    background-color: var(--codeoss-border);
                }

                /* Sortable table header styles */
                .sortable-header {
                    position: relative;
                    transition: background-color 0.2s ease;
                }

                .sortable-header:hover {
                    background-color: var(--codeoss-hover) !important;
                }

                .sort-indicator {
                    font-size: 12px;
                    margin-left: 4px;
                    opacity: 0.5;
                    transition: opacity 0.2s ease;
                    display: inline-block;
                    min-width: 12px;
                    text-align: center;
                }

                .sortable-header:hover .sort-indicator {
                    opacity: 0.8;
                }

                /* Single table with sticky header - updated for v1.2.0 */
                .codeoss-table-wrapper {
                    background-color: var(--codeoss-panel-bg);
                    border: 1px solid var(--codeoss-border);
                    border-radius: 4px;
                }

                .codeoss-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: var(--codeoss-font-family);
                    font-size: 12px;
                }

                /* Sticky header */
                .codeoss-table th {
                    position: sticky !important;
                    top: 0 !important;
                    background-color: var(--codeoss-bg-secondary) !important;
                    border: 1px solid var(--codeoss-border);
                    padding: 8px 12px;
                    text-align: left;
                    font-weight: 600;
                    color: var(--codeoss-text-primary);
                    z-index: 10 !important;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                }

                .codeoss-table td {
                    border: 1px solid var(--codeoss-border);
                    padding: 6px 12px;
                    color: var(--codeoss-text-primary);
                }

                .codeoss-table tbody tr:nth-child(even) {
                    background-color: var(--codeoss-bg-secondary);
                }

                .codeoss-table tbody tr:hover {
                    background-color: var(--codeoss-hover);
                }
            </style>
        `;
    }
    
    /**
     * Get layout-specific styles
     *
     * @returns {string} CSS styles for layout components
     */
    function getLayoutStyles() {
        return `
            <style type="text/css">
                /* Hide NetSuite's form header, preserve main navigation */
                .uir-form-header {
                    display: none !important;
                }

                /* Ensure main navigation stays visible */
                div[data-header-section="navigation"].uif43 {
                    display: block !important;
                }

                /* Code - OSS style split layout - positioned below NetSuite navigation */
                .codeoss-container {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 95px) !important; /* Perfect height for navigation clearance */
                    width: 100vw;
                    background-color: var(--codeoss-bg-primary);
                    position: fixed;
                    top: 95px !important; /* Perfect position to clear navigation */
                    left: 0;
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    overflow: hidden;
                }

                .codeoss-main {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                    min-height: 0;
                }

                .codeoss-sidebar {
                    width: 300px;
                    background-color: var(--codeoss-sidebar-bg);
                    border-right: 1px solid var(--codeoss-border);
                    display: flex;
                    flex-direction: column;
                    min-width: 200px;
                    max-width: 500px;
                    flex-shrink: 0;
                }

                .codeoss-editor-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    min-width: 0;
                }

                .codeoss-editor-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background-color: var(--codeoss-editor-bg);
                    border-bottom: 1px solid var(--codeoss-border);
                    min-height: 200px;
                    max-height: 70vh;
                    overflow: hidden;
                }

                .codeoss-results-container {
                    flex: 1;
                    background-color: var(--codeoss-panel-bg);
                    border-top: 1px solid var(--codeoss-border);
                    display: flex;
                    flex-direction: column;
                    min-height: 150px;
                    overflow: hidden;
                }

                /* Resizer styles */
                .codeoss-resizer {
                    height: 4px;
                    background-color: var(--codeoss-border);
                    cursor: row-resize;
                    position: relative;
                    z-index: 10;
                    flex-shrink: 0;
                }

                .codeoss-resizer:hover {
                    background-color: var(--codeoss-accent);
                }

                .codeoss-sidebar-resizer {
                    width: 4px;
                    background-color: var(--codeoss-border);
                    cursor: col-resize;
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    z-index: 10;
                }

                .codeoss-sidebar-resizer:hover {
                    background-color: var(--codeoss-accent);
                }

                /* Query Tabs Styles */
                .codeoss-tabs-container {
                    display: flex;
                    align-items: center;
                    background-color: var(--codeoss-sidebar-bg);
                    border-bottom: 1px solid var(--codeoss-border);
                    padding: 0;
                    min-height: 35px;
                    flex-shrink: 0;
                }

                .codeoss-tabs-bar {
                    display: flex;
                    align-items: center;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    flex-shrink: 1;
                    min-width: 0;
                }

                .codeoss-tabs-bar::-webkit-scrollbar {
                    display: none;
                }

                .codeoss-tab {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    background-color: var(--codeoss-sidebar-bg);
                    border-right: 1px solid var(--codeoss-border);
                    cursor: pointer;
                    min-width: 120px;
                    max-width: 200px;
                    position: relative;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .codeoss-tab:hover {
                    background-color: var(--codeoss-hover);
                }

                .codeoss-tab.active {
                    background-color: var(--codeoss-editor-bg);
                    border-bottom: 2px solid var(--codeoss-accent);
                }

                .codeoss-tab-title {
                    flex: 1;
                    font-size: 12px;
                    color: var(--codeoss-text-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    margin-right: 8px;
                }

                .codeoss-tab-close {
                    background: none;
                    border: none;
                    color: var(--codeoss-text-secondary);
                    cursor: pointer;
                    font-size: 14px;
                    padding: 2px 4px;
                    border-radius: 2px;
                    line-height: 1;
                    opacity: 0.7;
                }

                .codeoss-tab-close:hover {
                    background-color: var(--codeoss-hover);
                    opacity: 1;
                }

                /* Add New Tab Button - positioned right after tabs */
                .codeoss-add-tab-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--codeoss-sidebar-bg);
                    border: none;
                    border-right: 1px solid var(--codeoss-border);
                    color: var(--codeoss-text-secondary);
                    cursor: pointer;
                    padding: 8px 12px;
                    font-size: 16px;
                    font-weight: bold;
                    min-height: 35px;
                    min-width: 35px;
                    box-sizing: border-box;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                    line-height: 1;
                }

                .codeoss-add-tab-btn:hover {
                    background-color: var(--codeoss-hover);
                    color: var(--codeoss-accent);
                }

                .codeoss-add-tab-btn:active {
                    background-color: var(--codeoss-accent);
                    color: white;
                }

                .codeoss-tabs-actions {
                    display: flex;
                    align-items: center;
                    padding: 0 8px;
                    gap: 4px;
                    flex-shrink: 0;
                    margin-left: auto;
                }

                .codeoss-tab-action-btn {
                    background: none;
                    border: none;
                    color: var(--codeoss-text-secondary);
                    cursor: pointer;
                    font-size: 14px;
                    padding: 4px 6px;
                    border-radius: 2px;
                    line-height: 1;
                    opacity: 0.7;
                }

                .codeoss-tab-action-btn:hover {
                    background-color: var(--codeoss-hover);
                    opacity: 1;
                }

                /* Inline Tab Name Editing Styles */
                #currentTabName:hover {
                    background-color: var(--codeoss-hover);
                    color: var(--codeoss-accent);
                }

                /* Sidebar Section Styles */
                .codeoss-sidebar-section {
                    border-bottom: 1px solid var(--codeoss-border);
                    display: flex;
                    flex-direction: column;
                    flex: 0 0 auto; /* Don't grow by default */
                    min-height: 0;
                }

                /* Expanded section takes all available space */
                .codeoss-sidebar-section.expanded {
                    flex: 1;
                }

                .codeoss-sidebar-section-header {
                    padding: 8px 12px;
                    background-color: var(--codeoss-toolbar-bg);
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: bold;
                    color: var(--codeoss-text-secondary);
                    display: flex;
                    align-items: center;
                    user-select: none;
                }

                .codeoss-sidebar-section-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                    min-height: 0;
                }

                .codeoss-sidebar-section-content::-webkit-scrollbar {
                    width: 6px;
                }

                .codeoss-sidebar-section-content::-webkit-scrollbar-track {
                    background: var(--codeoss-panel-bg);
                }

                .codeoss-sidebar-section-content::-webkit-scrollbar-thumb {
                    background: var(--codeoss-border);
                    border-radius: 3px;
                }

                .codeoss-sidebar-section-content::-webkit-scrollbar-thumb:hover {
                    background: var(--codeoss-text-secondary);
                }

                #savedQueriesContainer {
                    flex: 1;
                    overflow-y: auto;
                    min-height: 0;
                }



                /* Saved Queries Styles */
                .codeoss-saved-query-item {
                    background-color: var(--codeoss-sidebar-bg);
                    border: 1px solid var(--codeoss-border);
                    border-radius: 4px;
                    padding: 8px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .codeoss-saved-query-item:hover {
                    background-color: var(--codeoss-hover);
                }

                .codeoss-saved-query-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 4px;
                }

                .codeoss-saved-query-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--codeoss-text-primary);
                    margin: 0;
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .codeoss-saved-query-actions {
                    display: flex;
                    gap: 4px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .codeoss-saved-query-item:hover .codeoss-saved-query-actions {
                    opacity: 1;
                }

                .codeoss-btn-icon {
                    background: none;
                    border: none;
                    color: var(--codeoss-text-secondary);
                    cursor: pointer;
                    font-size: 12px;
                    padding: 2px 4px;
                    border-radius: 2px;
                    line-height: 1;
                }

                .codeoss-btn-icon:hover {
                    background-color: var(--codeoss-hover);
                    color: var(--codeoss-text-primary);
                }

                .codeoss-saved-query-meta {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .codeoss-saved-query-date {
                    font-size: 10px;
                    color: var(--codeoss-text-secondary);
                }

                .codeoss-saved-query-tags {
                    font-size: 10px;
                    color: var(--codeoss-accent);
                    background-color: var(--codeoss-hover);
                    padding: 1px 4px;
                    border-radius: 2px;
                }

                .codeoss-saved-query-description {
                    font-size: 10px;
                    color: var(--codeoss-text-secondary);
                    margin-bottom: 4px;
                    line-height: 1.3;
                }

                .codeoss-saved-query-preview {
                    font-size: 10px;
                    color: var(--codeoss-text-secondary);
                    font-family: var(--codeoss-font-mono);
                    background-color: var(--codeoss-editor-bg);
                    padding: 4px;
                    border-radius: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .codeoss-empty-state {
                    text-align: center;
                    color: var(--codeoss-text-secondary);
                    font-size: 11px;
                    padding: 16px 8px;
                    font-style: italic;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .codeoss-sidebar {
                        width: 250px;
                        min-width: 200px;
                    }
                    .codeoss-toolbar .toolbar-buttons {
                        flex-wrap: wrap;
                        gap: 4px;
                    }
                    .codeoss-btn {
                        padding: 4px 8px;
                        font-size: 10px;
                    }
                }

                @media (max-width: 480px) {
                    .codeoss-sidebar {
                        width: 200px;
                        min-width: 150px;
                    }
                    .codeoss-toolbar h5 {
                        font-size: 11px;
                    }
                    .codeoss-btn {
                        padding: 3px 6px;
                        font-size: 9px;
                    }
                }
            </style>
        `;
    }

    /**
     * Export the theming functions
     */
    return {
        getExternalDependencies: getExternalDependencies,
        getDataTablesExternals: getDataTablesExternals,
        getMainStyles: getMainStyles,
        getComponentStyles: getComponentStyles,
        getLayoutStyles: getLayoutStyles
    };

});