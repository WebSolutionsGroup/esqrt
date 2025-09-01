/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Tool Generator
 *
 * This module generates the complete HTML for the Enhanced SuiteQL Query Tool
 * by combining all UI components, styles, and JavaScript functionality.
 *
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants',
    '../styles/themes',
    '../components/modals',
    '../components/sidebarSections',
    '../components/queryTabs',
    './mainLayout',
    '../../features/editor/codeMirrorSetup',
    '../../features/queryHistory/historyManager',

    '../../features/export/csvExporter',
    '../../features/export/jsonExporter',
    '../../features/export/tableRenderer',
    '../../features/controls/options',
    '../../features/query/queryExecution',
    '../../features/savedQueries/savedQueriesManager',
    '../../features/ui/layoutUtils'
], function(constants, themes, modals, sidebarSections, queryTabs, mainLayout, editorSetup, historyManager, csvExporter, jsonExporter, tableRenderer, controlsOptions, queryExecution, savedQueriesManager, layoutUtils) {

    /**
     * Get all JavaScript functions from feature modules
     *
     * @returns {string} Complete JavaScript functions from all feature modules
     */
    function getJavaScriptFunctions() {
        return `
            // ========================================================================
            // Enhanced SuiteQL Query Tool - Complete JavaScript Functions
            // Generated from modular feature modules
            // ========================================================================

            ${editorSetup.getAllEditorJS()}

            ${queryTabs.getAllQueryTabsJS()}

            ${historyManager.getAllQueryHistoryJS()}

            ${sidebarSections.getAllSidebarSectionsJS()}

            ${csvExporter.getAllCSVExportJS()}

            ${jsonExporter.getAllJSONExportJS()}

            ${tableRenderer.getAllTableRenderingJS()}

            ${controlsOptions.getAllControlsJS()}

            ${queryExecution.getAllQueryExecutionJS()}

            ${savedQueriesManager.getAllSavedQueriesJS()}

            ${layoutUtils.getAllLayoutUtilitiesJS()}

            // ========================================================================
            // Initialization Functions
            // ========================================================================

            function initializeApplication() {
                // Initialize all components in the correct order
                initializeTheme();

                // Always bring up the editor ASAP so other failures don't block it
                initCodeMirror();

                // Sidebar and history
                try { initializeSidebarSections(); } catch(e) { console.warn('initializeSidebarSections failed:', e); }
                try { initializeQueryHistory(); } catch(e) { console.warn('initializeQueryHistory failed:', e); }

                // Layout and handlers
                try { initializeResponsiveLayout(); } catch(e) { console.warn('initializeResponsiveLayout failed:', e); }
                try { initializeResizers(); } catch(e) { console.warn('initializeResizers failed:', e); }
                try { initializeModalHandlers(); } catch(e) { console.warn('initializeModalHandlers failed:', e); }
                try { initializeKeyboardHandlers(); } catch(e) { console.warn('initializeKeyboardHandlers failed:', e); }

                // Initialize query tabs after CodeMirror is ready
                setTimeout(function() {
                    try { initializeQueryTabs(); } catch(e) { console.error('initializeQueryTabs failed:', e); }
                }, 200);

                // Initialize saved queries and controls
                try { initializeSavedQueries(); } catch(e) { console.warn('initializeSavedQueries failed:', e); }
                try { initializeControlsPanel(); } catch(e) { console.warn('initializeControlsPanel failed:', e); }

                // Set default query only if no tabs were loaded
                setTimeout(function() {
                    try {
                        if (typeof queryTabs !== 'undefined' && queryTabs.length === 0) {
                            defaultQuerySet();
                        }
                    } catch(e) { console.warn('defaultQuerySet failed:', e); }
                }, 300);

                // Final layout adjustments
                setTimeout(function() {
                    try { adjustLayoutForScreenSize(); } catch(e) { console.warn('adjustLayoutForScreenSize failed:', e); }
                    if (codeEditor) {
                        try { codeEditor.refresh(); } catch(e) { console.warn('codeEditor.refresh failed:', e); }
                    }
                }, 500);
            }
        `;
    }

    /**
     * Generate the complete tool HTML
     * This is the main function that combines all UI components
     *
     * @returns {string} Complete HTML for the Enhanced SuiteQL Query Tool
     */
    function htmlGenerateTool() {
        return `
            ${themes.getExternalDependencies()}
            ${themes.getDataTablesExternals()}
            ${themes.getMainStyles()}
            ${themes.getComponentStyles()}
            ${themes.getLayoutStyles()}
            ${getAdditionalStyles()}
            ${modals.getModalStyles()}

            ${modals.getAllModals()}
            ${mainLayout.htmlQueryUI()}

            <script>
                var
                    activeSQLFile = {},
                    queryResponsePayload,
                    fileLoadResponsePayload,
                    queryHistory = [],
                    codeEditor;

                // Debug logging
                // console.log('Enhanced SuiteQL Query Tool - Starting initialization...');
                // console.log('jQuery available:', typeof jQuery !== 'undefined');
                // console.log('CodeMirror available:', typeof CodeMirror !== 'undefined');

                window.jQuery = window.$ = jQuery;

                // Initialize Code - OSS style interface
                $('#${constants.ELEMENT_IDS.QUERY_UI}').show();
                $('#templateHeaderRow').hide();
                $('#templateFormRow').hide();

                // Initialize responsive layout
                try {
                    initializeResponsiveLayout();
                    // console.log('Responsive layout initialized');
                } catch(e) {
                    console.error('Error initializing responsive layout:', e);
                }

                // Initialize resizable layout
                try {
                    initializeResizers();
                    // console.log('Resizers initialized');
                } catch(e) {
                    console.error('Error initializing resizers:', e);
                }

                // Set initial theme
                document.body.classList.add('light-theme');
                // console.log('Theme set to light');

                // Include all JavaScript functions from modular architecture
                ${editorSetup.getAllEditorJS()}
                ${queryTabs.getAllQueryTabsJS()}
                ${historyManager.getAllQueryHistoryJS()}
                ${sidebarSections.getAllSidebarSectionsJS()}
                ${csvExporter.getAllCSVExportJS()}
                ${jsonExporter.getAllJSONExportJS()}
                ${tableRenderer.getAllTableRenderingJS()}
                ${controlsOptions.getAllControlsJS()}
                ${queryExecution.getAllQueryExecutionJS()}
                ${savedQueriesManager.getAllSavedQueriesJS()}
                ${layoutUtils.getAllLayoutUtilitiesJS()}

                // ========================================================================
                // Initialization Functions
                // ========================================================================

                function initializeApplication() {
                    // Initialize all components in the correct order
                    initializeTheme();

                    // Always bring up the editor ASAP so other failures don't block it
                    initCodeMirror();

                    // Sidebar and history
                    try { initializeSidebarSections(); } catch(e) { console.warn('initializeSidebarSections failed:', e); }
                    try { initializeQueryHistory(); } catch(e) { console.warn('initializeQueryHistory failed:', e); }

                    // Layout and handlers
                    try { initializeResponsiveLayout(); } catch(e) { console.warn('initializeResponsiveLayout failed:', e); }
                    try { initializeResizers(); } catch(e) { console.warn('initializeResizers failed:', e); }
                    try { initializeModalHandlers(); } catch(e) { console.warn('initializeModalHandlers failed:', e); }
                    try { initializeKeyboardHandlers(); } catch(e) { console.warn('initializeKeyboardHandlers failed:', e); }

                    // Initialize query tabs after CodeMirror is ready
                    setTimeout(function() {
                        try { initializeQueryTabs(); } catch(e) { console.error('initializeQueryTabs failed:', e); }
                    }, 200);

                    // Initialize saved queries and controls
                    try { initializeSavedQueries(); } catch(e) { console.warn('initializeSavedQueries failed:', e); }
                    try { initializeControlsPanel(); } catch(e) { console.warn('initializeControlsPanel failed:', e); }

                    // Set default query only if no tabs were loaded
                    setTimeout(function() {
                        try {
                            if (typeof queryTabs !== 'undefined' && queryTabs.length === 0) {
                                defaultQuerySet();
                            }
                        } catch(e) { console.warn('defaultQuerySet failed:', e); }
                    }, 300);

                    // Final layout adjustments
                    setTimeout(function() {
                        try { adjustLayoutForScreenSize(); } catch(e) { console.warn('adjustLayoutForScreenSize failed:', e); }
                        if (codeEditor) {
                            try { codeEditor.refresh(); } catch(e) { console.warn('codeEditor.refresh failed:', e); }
                        }
                    }, 500);
                }

                // Initialize the complete application after a short delay to ensure all scripts are loaded
                setTimeout(function() {
                    // console.log('Starting application initialization...');
                    try {
                        initializeApplication();
                        // console.log('Application initialization completed');
                    } catch(e) {
                        console.error('Error during application initialization:', e);
                    }
                }, 100);

            </script>
        `;
    }

    /**
     * Get additional CSS styles for specific components
     *
     * @returns {string} Additional CSS styles
     */
    function getAdditionalStyles() {
        return `
            <style type="text/css">
                /* Resizer styles */
                .codeoss-resizer {
                    height: 4px;
                    background-color: var(--codeoss-border);
                    cursor: row-resize;
                    position: relative;
                }

                .codeoss-resizer:hover {
                    background-color: var(--codeoss-accent);
                }

                .codeoss-sidebar-resizer {
                    width: 4px;
                    background-color: var(--codeoss-border);
                    cursor: col-resize;
                }

                .codeoss-sidebar-resizer:hover {
                    background-color: var(--codeoss-accent);
                }

                /* CodeMirror Code - OSS styling */
                .CodeMirror {
                    height: 100%;
                    font-family: var(--codeoss-font-family);
                    font-size: 14px;
                    line-height: 1.4;
                    background-color: var(--codeoss-editor-bg);
                    color: var(--codeoss-text-primary);
                }

                .CodeMirror-gutters {
                    background-color: var(--codeoss-editor-bg);
                    border-right: 1px solid var(--codeoss-border);
                }

                .CodeMirror-linenumber {
                    color: var(--codeoss-text-secondary);
                    font-size: 12px;
                }

                .CodeMirror-cursor {
                    border-left: 1px solid var(--codeoss-text-primary);
                }

                .CodeMirror-selected { background-color: var(--codeoss-selection); }
                /* Improve selection styling to look like inline rounded selection */
                .CodeMirror ::selection { background: rgba(21, 126, 251, 0.35); }
                .CodeMirror ::-moz-selection { background: rgba(21, 126, 251, 0.35); }
                .CodeMirror-selected, .CodeMirror-focused .CodeMirror-selected { border-radius: 6px; }
                .CodeMirror-line::selection, .CodeMirror-line > span::selection, .CodeMirror-line > span > span::selection {
                    background: rgba(21, 126, 251, 0.35);
                }
                .CodeMirror-line::-moz-selection, .CodeMirror-line > span::-moz-selection, .CodeMirror-line > span > span::-moz-selection {
                    background: rgba(21, 126, 251, 0.35);
                }

                /* Higher-contrast selection for both themes (uses mark-selection addon) */
                .dark-theme .CodeMirror-selected { background-color: rgba(38, 79, 120, 0.85) !important; }
                .dark-theme .CodeMirror-selectedtext { background-color: rgba(38, 79, 120, 0.85) !important; color: #ffffff !important; border-radius: 6px; }
                .dark-theme .CodeMirror ::selection { background: rgba(38, 79, 120, 0.85); }
                .dark-theme .CodeMirror ::-moz-selection { background: rgba(38, 79, 120, 0.85); }

                .light-theme .CodeMirror-selected { background-color: rgba(173, 214, 255, 0.6) !important; }
                .light-theme .CodeMirror-selectedtext { background-color: rgba(173, 214, 255, 0.6) !important; color: #000000 !important; border-radius: 6px; }
                .light-theme .CodeMirror ::selection { background: rgba(173, 214, 255, 0.6); }
                .light-theme .CodeMirror ::-moz-selection { background: rgba(173, 214, 255, 0.6); }


                /* Custom SQL Syntax Highlighting Colors */
                .CodeMirror .cm-keyword {
                    color: var(--codeoss-accent) !important; /* Same blue as query button, footer, and tab underlines */
                    font-weight: bold;
                }

                .CodeMirror .cm-string {
                    color: #CE9178 !important; /* Orange for text/strings */
                }

                .CodeMirror .cm-string-2 {
                    color: #CE9178 !important; /* Orange for quoted strings */
                }

                .CodeMirror .cm-comment {
                    color: #6A9955 !important; /* Green for comments */
                    font-style: italic;
                }

                .CodeMirror .cm-number {
                    color: #b5cea8 !important; /* Light green for numbers */
                }

                .CodeMirror .cm-operator {
                    color: var(--codeoss-text-primary) !important; /* Default text color for operators */
                }

                .CodeMirror .cm-builtin {
                    color: #007acc !important; /* Blue for built-in functions */
                }

                .CodeMirror .cm-variable {
                    color: var(--codeoss-text-primary) !important; /* Default text color for variables */
                }

                .CodeMirror .cm-variable-2 {
                    color: #9cdcfe !important; /* Light blue for table/column names */
                }

                .CodeMirror .cm-variable-3 {
                    color: #4fc1ff !important; /* Bright blue for special variables */
                }

                /* Sidebar styling */
                .codeoss-sidebar-header {
                    padding: 8px 12px;
                    background-color: var(--codeoss-bg-tertiary);
                    border-bottom: 1px solid var(--codeoss-border);
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--codeoss-text-secondary);
                }

                .codeoss-sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                }

                /* Expandable sidebar sections */
                .codeoss-sidebar-section {
                    border-bottom: 1px solid var(--codeoss-border);
                }

                .codeoss-sidebar-section-header {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    background-color: var(--codeoss-sidebar-bg);
                    cursor: pointer;
                    user-select: none;
                    transition: background-color 0.2s;
                }

                .codeoss-sidebar-section-header:hover {
                    background-color: var(--codeoss-bg-tertiary);
                }

                .codeoss-sidebar-section-icon {
                    font-size: 10px;
                    margin-right: 6px;
                    color: var(--codeoss-text-secondary);
                }

                .codeoss-sidebar-section-title {
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--codeoss-text-secondary);
                }

                .codeoss-sidebar-section-content {
                    padding: 8px 12px;
                    background-color: var(--codeoss-sidebar-bg);
                    transition: all 0.3s ease;
                    overflow: hidden;
                }

                .codeoss-sidebar-section-content.collapsed {
                    max-height: 0;
                    padding-top: 0;
                    padding-bottom: 0;
                }

                /* Sidebar section buttons */
                .codeoss-sidebar-section-content .codeoss-btn-secondary {
                    font-size: 11px;
                    padding: 6px 8px;
                    text-align: left;
                    justify-content: flex-start;
                    border-radius: 2px;
                }

                /* Query history styling */
                .${constants.CSS_CLASSES.QUERY_HISTORY_ITEM} {
                    padding: 6px 8px;
                    margin-bottom: 2px;
                    background-color: var(--codeoss-bg-secondary);
                    border: 1px solid transparent;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 11px;
                    color: var(--codeoss-text-primary);
                    transition: all 0.2s;
                }

                .${constants.CSS_CLASSES.QUERY_HISTORY_ITEM}:hover {
                    background-color: var(--codeoss-bg-tertiary);
                    border-color: var(--codeoss-border);
                }

                /* Results panel styling */
                .codeoss-results-header {
                    padding: 8px 12px;
                    background-color: var(--codeoss-bg-tertiary);
                    border-bottom: 1px solid var(--codeoss-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--codeoss-text-secondary);
                }

                .codeoss-results-content {
                    flex: 1;
                    overflow: auto;
                    padding: 12px;
                    background-color: var(--codeoss-panel-bg);
                }

                /* Controls panel */
                .codeoss-controls-panel {
                    background-color: var(--codeoss-panel-bg);
                    border-left: 1px solid var(--codeoss-border);
                    overflow-y: auto;
                    transition: all 0.3s ease;
                }

                .codeoss-controls-panel h4 {
                    color: var(--codeoss-text-primary);
                    font-size: 12px;
                    text-transform: uppercase;
                    margin: 0 0 16px 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--codeoss-border);
                }

                /* Status bar */
                .codeoss-status-bar {
                    background-color: var(--codeoss-accent);
                    color: white;
                    padding: 4px 12px;
                    font-size: 11px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    min-height: 22px;
                }

                /* Zoom controls */
                .codeoss-zoom-controls {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .codeoss-zoom-btn {
                    background-color: var(--codeoss-bg-tertiary);
                    border: 1px solid var(--codeoss-border);
                    color: var(--codeoss-text-primary);
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 12px;
                    border-radius: 2px;
                }

                .codeoss-zoom-btn:hover {
                    background-color: var(--codeoss-border);
                }

                .codeoss-zoom-level {
                    font-size: 10px;
                    color: var(--codeoss-text-secondary);
                    min-width: 35px;
                    text-align: center;
                }

                /* Editor header title */
                .codeoss-query-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--codeoss-text-primary);
                    outline: none;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 40vw;
                }
                .codeoss-query-title:focus {
                    box-shadow: 0 0 0 1px var(--codeoss-accent);
                    border-radius: 2px;
                    padding: 0 2px;
                    background: var(--codeoss-input-bg);
                }
                .codeoss-dirty-dot { color: var(--codeoss-accent); font-size: 16px; line-height: 1; }

                /* Table styling */
                .${constants.CSS_CLASSES.CODEOSS_TABLE} {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                    background-color: var(--codeoss-panel-bg);
                }

                .${constants.CSS_CLASSES.CODEOSS_TABLE} th {
                    background-color: var(--codeoss-bg-tertiary);
                    color: var(--codeoss-text-primary);
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid var(--codeoss-border);
                    font-weight: 600;
                    font-size: 10px;
                    text-transform: uppercase;
                    cursor: pointer;
                    user-select: none;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    transition: background-color 0.2s;
                }

                .${constants.CSS_CLASSES.CODEOSS_TABLE} th:hover {
                    background-color: var(--codeoss-border);
                }

                .${constants.CSS_CLASSES.CODEOSS_TABLE} td {
                    padding: 6px 8px;
                    border-bottom: 1px solid var(--codeoss-border);
                    color: var(--codeoss-text-primary);
                }

                .${constants.CSS_CLASSES.CODEOSS_TABLE} tbody tr:nth-child(even) {
                    background-color: var(--codeoss-bg-secondary);
                }

                .${constants.CSS_CLASSES.CODEOSS_TABLE} tbody tr:nth-child(odd) {
                    background-color: var(--codeoss-panel-bg);
                }

                .${constants.CSS_CLASSES.CODEOSS_TABLE} tr:hover {
                    background-color: var(--codeoss-border) !important;
                }

                /* Sort indicator styles */
                .sort-indicator {
                    font-size: 10px;
                    margin-left: 4px;
                    transition: color 0.2s ease;
                    display: inline-block;
                    min-width: 8px;
                    text-align: center;
                }

                /* Form controls - scoped to our container only */
                .codeoss-container input[type="text"],
                .codeoss-container input[type="search"],
                .codeoss-container textarea,
                .codeoss-container select {
                    background-color: var(--codeoss-input-bg);
                    border: 1px solid var(--codeoss-input-border);
                    color: var(--codeoss-text-primary);
                    font-family: var(--codeoss-font-family);
                    font-size: 11px;
                    padding: 4px 6px;
                    border-radius: 2px;
                }

                .codeoss-container input[type="text"]:focus,
                .codeoss-container input[type="search"]:focus,
                .codeoss-container textarea:focus,
                .codeoss-container select:focus {
                    outline: none;
                    border-color: var(--codeoss-accent);
                    box-shadow: 0 0 0 1px var(--codeoss-accent);
                }

                /* Scrollbars */
                ::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                ::-webkit-scrollbar-track {
                    background-color: var(--codeoss-bg-primary);
                }

                ::-webkit-scrollbar-thumb {
                    background-color: var(--codeoss-border);
                    border-radius: 5px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background-color: var(--codeoss-text-secondary);
                }
            </style>
        `;
    }



    /**
     * Export the tool generator functions
     */
    return {
        htmlGenerateTool: htmlGenerateTool,
        getAdditionalStyles: getAdditionalStyles,
        getJavaScriptFunctions: getJavaScriptFunctions
    };

});
