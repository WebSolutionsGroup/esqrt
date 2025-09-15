/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Main Layout
 * 
 * This module contains the main UI layout generation including
 * the query interface, toolbar, sidebar, editor, and results areas.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants',
    '../styles/themes',
    '../components/modals',
    '../components/queryTabs'
], function(constants, themes, modals, queryTabs) {
    
    /**
     * Generate the main query UI layout
     * 
     * @returns {string} HTML string for the main query interface
     */
    function htmlQueryUI() {
        return `
            <div class="${constants.CSS_CLASSES.CODEOSS_CONTAINER}" id="${constants.ELEMENT_IDS.QUERY_UI}">

                <!-- Code - OSS Style Toolbar -->
                <div class="${constants.CSS_CLASSES.CODEOSS_TOOLBAR}">
                    <h5 id="queryHeader">
                        <a href="#" onClick="javascript:defaultQuerySet();" title="Click to load a sample query." style="color: var(--codeoss-text-primary); text-decoration: none;">
                            ENHANCED SUITEQL QUERY TOOL
                        </a>
                    </h5>
                    <div class="toolbar-buttons">
                        <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="toggleSidebar();" title="Toggle Sidebar">☰</button>
                        ${getWorkbooksButton()}
                        <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="toggleTheme();">🌓 Theme</button>
                    </div>
                </div>

                <!-- Main Code - OSS Layout -->
                <div class="codeoss-main">

                    <!-- Expandable Sidebar with Multiple Sections -->
                    <div class="${constants.CSS_CLASSES.CODEOSS_SIDEBAR}">
                        <div class="codeoss-sidebar-header">EXPLORER</div>

                        <!-- Query History Section -->
                        <div class="codeoss-sidebar-section">
                            <div class="codeoss-sidebar-section-header" onclick="toggleSidebarSection('queryHistory')">
                                <span class="codeoss-sidebar-section-icon" id="queryHistoryIcon">▼</span>
                                <span class="codeoss-sidebar-section-title">QUERY HISTORY</span>
                            </div>
                            <div class="codeoss-sidebar-section-content" id="queryHistoryContent">
                                <div id="${constants.ELEMENT_IDS.QUERY_HISTORY_LIST}"></div>
                            </div>
                        </div>



                        <!-- Saved Queries Section -->
                        <div class="codeoss-sidebar-section">
                            <div class="codeoss-sidebar-section-header" onclick="toggleSidebarSection('savedQueries')">
                                <span class="codeoss-sidebar-section-icon" id="savedQueriesIcon">▼</span>
                                <span class="codeoss-sidebar-section-title">SAVED QUERIES</span>
                            </div>
                            <div class="codeoss-sidebar-section-content" id="savedQueriesContent">
                                <div id="savedQueriesContainer">
                                    <!-- Saved queries will be rendered here -->
                                </div>
                            </div>
                        </div>

                        <!-- Table Explorer Section -->
                        <div class="codeoss-sidebar-section">
                            <div class="codeoss-sidebar-section-header" onclick="toggleSidebarSection('tableExplorer')">
                                <span class="codeoss-sidebar-section-icon" id="tableExplorerIcon">▶</span>
                                <span class="codeoss-sidebar-section-title">TABLE EXPLORER</span>
                            </div>
                            <div class="codeoss-sidebar-section-content collapsed" id="tableExplorerContent">
                                <!-- Search Box -->
                                <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_SEARCH}">
                                    <input type="text" id="${constants.ELEMENT_IDS.TABLE_EXPLORER_SEARCH}"
                                           placeholder="Search Record Types"
                                           onkeyup="filterTableExplorer()"
                                           style="width: 100%; padding: 4px 8px; border: 1px solid var(--codeoss-border); background: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border-radius: 3px; font-size: 12px;">
                                </div>

                                <!-- Table Explorer Tree -->
                                <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_TREE}" id="${constants.ELEMENT_IDS.TABLE_EXPLORER_CONTENT}">
                                    <!-- Functions Section -->
                                    <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_CATEGORY}">
                                        <div class="table-explorer-category-header" onclick="toggleTableCategory('functions')">
                                            <span class="table-explorer-category-icon" id="functionsIcon">▶</span>
                                            <span class="table-explorer-category-title">📋 FUNCTIONS</span>
                                        </div>
                                        <div class="table-explorer-category-content collapsed" id="functionsContent">
                                            <div id="${constants.ELEMENT_IDS.TABLE_FUNCTIONS_LIST}">
                                                <!-- Functions will be loaded here -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Procedures Section -->
                                    <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_CATEGORY}">
                                        <div class="table-explorer-category-header" onclick="toggleTableCategory('procedures')">
                                            <span class="table-explorer-category-icon" id="proceduresIcon">▶</span>
                                            <span class="table-explorer-category-title">⚙️ PROCEDURES</span>
                                        </div>
                                        <div class="table-explorer-category-content collapsed" id="proceduresContent">
                                            <div id="${constants.ELEMENT_IDS.TABLE_PROCEDURES_LIST}">
                                                <!-- Procedures will be loaded here -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- System Section -->
                                    <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_CATEGORY}">
                                        <div class="table-explorer-category-header" onclick="toggleTableCategory('system')">
                                            <span class="table-explorer-category-icon" id="systemIcon">▶</span>
                                            <span class="table-explorer-category-title">📊 SYSTEM</span>
                                        </div>
                                        <div class="table-explorer-category-content collapsed" id="systemContent">
                                            <div id="${constants.ELEMENT_IDS.TABLE_SYSTEM_LIST}">
                                                <!-- System tables will be loaded here -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Custom Section -->
                                    <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_CATEGORY}">
                                        <div class="table-explorer-category-header" onclick="toggleTableCategory('custom')">
                                            <span class="table-explorer-category-icon" id="customIcon">▶</span>
                                            <span class="table-explorer-category-title">📁 CUSTOM</span>
                                        </div>
                                        <div class="table-explorer-category-content collapsed" id="customContent">
                                            <div id="${constants.ELEMENT_IDS.TABLE_CUSTOM_LIST}">
                                                <!-- Custom tables will be loaded here -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="codeoss-sidebar-resizer"></div>
                    </div>

                    <!-- Main Editor and Results Area -->
                    <div class="codeoss-editor-area">

                        <!-- Query Tabs -->
                        ${queryTabs.getQueryTabsHTML()}

                        <!-- Query Editor Container -->
                        <div class="${constants.CSS_CLASSES.CODEOSS_EDITOR}">
                            <div class="${constants.CSS_CLASSES.CODEOSS_TOOLBAR}">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span id="currentTabName" style="font-size: 12px; color: var(--codeoss-text-primary); cursor: pointer; padding: 4px 8px; border-radius: 3px; min-width: 120px;"
                                          ondblclick="startInlineTabEdit()"
                                          title="Double-click to edit query name">Untitled query</span>
                                    <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN}" onclick="querySubmit();" accesskey="r" title="Run Query (Ctrl+R)">▶ Run Query</button>
                                    <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="saveCurrentTabAsQuery();" title="Save Query">💾</button>
                                    <div id="${constants.ELEMENT_IDS.FILE_INFO}" style="font-size: 10px; color: var(--codeoss-text-secondary);"></div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="codeoss-zoom-controls">
                                        <button type="button" class="codeoss-zoom-btn" onclick="zoomOut(); return false;" title="Zoom Out">−</button>
                                        <span class="codeoss-zoom-level" id="${constants.ELEMENT_IDS.ZOOM_LEVEL}">100%</span>
                                        <button type="button" class="codeoss-zoom-btn" onclick="zoomIn(); return false;" title="Zoom In">+</button>
                                        <button type="button" class="codeoss-zoom-btn" onclick="resetZoom(); return false;" title="Reset Zoom">⌂</button>
                                    </div>
                                </div>
                            </div>
                            <textarea id="${constants.ELEMENT_IDS.QUERY_TEXTAREA}" placeholder="Enter a SuiteQL query here..."></textarea>
                        </div>

                        <!-- Resizer -->
                        <div class="codeoss-resizer" id="editorResizer"></div>

                        <!-- Results Container -->
                        <div class="${constants.CSS_CLASSES.CODEOSS_RESULTS}">
                            <div class="codeoss-results-header">
                                <span id="${constants.ELEMENT_IDS.QUERY_RESULTS_HEADER}">Query Results</span>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="copyResultsToClipboard(); return false;" id="${constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN}" style="display: none;">📋 Copy to Clipboard</button>
                                    <div class="csv-export-group" style="display: none; position: relative;" id="csvExportGroup">
                                        <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="downloadCSV(); return false;" id="downloadCSVBtn">📥 Download CSV</button>
                                        <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="copyCSVToClipboard(); return false;" id="copyCSVBtn">📋 Copy CSV</button>
                                        <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="showCSVPresetMenu(); return false;" id="csvPresetsBtn" title="Quick CSV format presets">📋▼</button>
                                        <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="showCSVOptionsModal(); return false;" id="csvOptionsBtn" title="Configure CSV export options">⚙️</button>
                                    </div>
                                    <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="toggleControls(); return false;" id="${constants.ELEMENT_IDS.TOGGLE_CONTROLS_BTN}">⚙ Options</button>
                                    <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="clearResults(); return false;">🗑 Clear</button>
                                </div>
                            </div>

                            <!-- Results Main Area with Side Panel -->
                            <div class="codeoss-results-main" style="display: flex; height: 100%;">
                                <!-- Results Content Area -->
                                <div class="codeoss-results-content" id="resultsContentArea" style="flex: 1; transition: flex 0.3s ease;">
                                    <div id="${constants.ELEMENT_IDS.RESULTS_DIV}" style="display: none; flex: 1; flex-direction: column; height: 100%;"></div>
                                    <div id="${constants.ELEMENT_IDS.WELCOME_MESSAGE}" style="padding: 20px; color: var(--codeoss-text-secondary); max-width: 800px; margin: 0 auto;">
                                        ${getWelcomeMessage()}
                                    </div>
                                </div>

                                <!-- Options Side Panel -->
                                <div id="${constants.ELEMENT_IDS.CONTROLS_PANEL}" class="codeoss-controls-panel" style="display: none; width: 300px; border-left: 1px solid var(--codeoss-border); background-color: var(--codeoss-panel-bg); transition: all 0.3s ease;">
                                    <div style="padding: 16px;">
                                        <h4 style="margin: 0 0 16px 0; color: var(--codeoss-text-primary); font-size: 12px; text-transform: uppercase;">Query Options</h4>
                                        <div id="${constants.ELEMENT_IDS.CONTROLS_CONTENT}">
                                            <!-- Controls will be inserted here -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                <!-- Status Bar -->
                <div class="codeoss-status-bar">
                    <div>
                        <span id="${constants.ELEMENT_IDS.STATUS_TEXT}">Ready</span>
                    </div>
                    <div style="flex: 1; text-align: center; font-size: 10px; opacity: 0.8;">
                        <span>Original: <a href="https://timdietrich.me/netsuite-suitescripts/suiteql-query-tool/" target="_blank" style="color: white; text-decoration: underline;">Tim Dietrich</a> | Enhanced: Matt Owen - <a href="https://www.websolutionsgroup.com" target="_blank" style="color: white; text-decoration: underline;">Web Solutions Group, LLC</a></span>
                    </div>
                    <div>
                        <span id="${constants.ELEMENT_IDS.CURSOR_POSITION}">Ln 1, Col 1</span>
                    </div>
                </div>

            </div>
        `;
    }
    
    /**
     * Get the welcome message content
     * 
     * @returns {string} HTML string for the welcome message
     */
    function getWelcomeMessage() {
        return `
            <div style="text-align: center; margin-bottom: 32px;">
                <h2 style="color: var(--codeoss-text-primary); margin-bottom: 8px; font-size: 24px;">ENHANCED SUITEQL QUERY TOOL</h2>
                <p style="color: var(--codeoss-text-secondary); font-size: 14px; margin: 0;">Professional NetSuite SuiteQL Query Interface</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
                <!-- Getting Started -->
                <div style="background-color: var(--codeoss-panel-bg); border: 1px solid var(--codeoss-border); border-radius: 4px; padding: 16px;">
                    <h3 style="color: var(--codeoss-text-primary); margin: 0 0 12px 0; font-size: 14px; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">🚀</span> Getting Started
                    </h3>
                    <ul style="margin: 0; padding-left: 16px; line-height: 1.6;">
                        <li><a href="#" onclick="defaultQuerySet()" style="color: var(--codeoss-accent); text-decoration: none;">Load a sample query</a></li>
                        <li>Write your SuiteQL query (try <span id="autoCompleteShortcut">Ctrl+Space</span> for auto-complete)</li>
                        <li>Click "▶ Run Query" in the editor toolbar or press <span id="executeShortcut">Ctrl+R</span></li>
                        <li>View results in table, CSV, or JSON format</li>
                    </ul>
                </div>

                <!-- Key Features -->
                <div style="background-color: var(--codeoss-panel-bg); border: 1px solid var(--codeoss-border); border-radius: 4px; padding: 16px;">
                    <h3 style="color: var(--codeoss-text-primary); margin: 0 0 12px 0; font-size: 14px; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">✨</span> Key Features
                    </h3>
                    <ul style="margin: 0; padding-left: 16px; line-height: 1.6;">
                        <li>Intelligent auto-complete (<span id="autoCompleteShortcut2">Ctrl+Space</span>)</li>
                        <li>Syntax highlighting & query validation</li>
                        <li>Query history & saved queries</li>
                        <li>Multiple export formats (CSV, JSON, PDF)</li>
                        <li>Dark/light theme support</li>
                    </ul>
                </div>
            </div>

            <!-- Keyboard Shortcuts Panel -->
            <div style="background-color: var(--codeoss-panel-bg); border: 1px solid var(--codeoss-border); border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                <h3 style="color: var(--codeoss-text-primary); margin: 0 0 12px 0; font-size: 14px; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">⌨️</span> Keyboard Shortcuts <span id="platformIndicator" style="font-size: 12px; color: var(--codeoss-text-secondary); margin-left: 8px;"></span>
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <strong style="color: var(--codeoss-text-primary); font-size: 12px;">Query Operations:</strong>
                        <ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 13px; line-height: 1.4;">
                            <li><span id="executeShortcut2">Ctrl+R</span> - Execute query</li>
                            <li><span id="executeShortcut3">Ctrl+Enter</span> - Execute query (alt)</li>
                            <li><strong>F5</strong> - Execute query (universal)</li>
                        </ul>
                    </div>
                    <div>
                        <strong style="color: var(--codeoss-text-primary); font-size: 12px;">Editor Features:</strong>
                        <ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 13px; line-height: 1.4;">
                            <li><span id="autoCompleteShortcut3">Ctrl+Space</span> - Auto-complete</li>
                            <li><span id="saveShortcut">Ctrl+S</span> - Save query</li>
                            <li><strong>Escape</strong> - Close panels/modals</li>
                        </ul>
                    </div>
                </div>
            </div>

            <script>
                // Update keyboard shortcuts based on platform
                (function() {
                    var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                    var cmdKey = isMac ? 'Cmd' : 'Ctrl';
                    var platformName = isMac ? '(Mac)' : '(Windows/Linux)';

                    // Update all shortcut displays
                    var shortcuts = [
                        'autoCompleteShortcut', 'autoCompleteShortcut2', 'autoCompleteShortcut3',
                        'executeShortcut', 'executeShortcut2', 'executeShortcut3',
                        'saveShortcut'
                    ];

                    shortcuts.forEach(function(id) {
                        var element = document.getElementById(id);
                        if (element) {
                            var text = element.textContent;
                            element.textContent = text.replace('Ctrl', cmdKey);
                            if (isMac) {
                                element.style.fontWeight = 'bold';
                                element.style.color = 'var(--codeoss-accent)';
                            }
                        }
                    });

                    // Update platform indicator
                    var platformIndicator = document.getElementById('platformIndicator');
                    if (platformIndicator) {
                        platformIndicator.textContent = platformName;
                    }
                })();
            </script>

            <!-- Credits -->
            <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--codeoss-border); font-size: 11px; color: var(--codeoss-text-secondary);">
                <p style="margin: 0;">
                    Original tool by <a href="https://timdietrich.me/netsuite-suitescripts/suiteql-query-tool/" target="_blank" style="color: var(--codeoss-accent);">Tim Dietrich</a> |
                    Enhanced by Matt Owen - <a href="https://www.websolutionsgroup.com" target="_blank" style="color: var(--codeoss-accent);">Web Solutions Group, LLC</a>
                </p>
            </div>
        `;
    }
    
    /**
     * Get workbooks button HTML (if enabled)
     * 
     * @returns {string} HTML string for workbooks button
     */
    function getWorkbooksButton() {
        if (constants.CONFIG.WORKBOOKS_ENABLED) {
            return `<button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" data-toggle="modal" data-target="#${constants.MODAL_IDS.WORKBOOKS}">Workbooks</button>`;
        }
        return '';
    }
    
    /**
     * Get remote library button HTML (if enabled)
     *
     * @returns {string} HTML string for remote library button
     */
    function getRemoteLibraryButton() {
        if (constants.CONFIG.REMOTE_LIBRARY_ENABLED) {
            return `<button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" data-toggle="modal" data-target="#${constants.MODAL_IDS.REMOTE_LOAD}" style="width: 100%; margin-bottom: 8px;">🌐 Remote Library</button>`;
        }
        return '';
    }
    
    /**
     * Get local library buttons HTML (if enabled)
     * 
     * @returns {string} HTML string for local library buttons
     */
    function getLocalLibraryButtons() {
        if (constants.CONFIG.QUERY_FOLDER_ID !== null) {
            return `
                <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" data-toggle="modal" data-target="#${constants.MODAL_IDS.LOCAL_LOAD}" style="width: 100%; margin-bottom: 8px;">💾 Load Query</button>
                <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" data-toggle="modal" data-target="#${constants.MODAL_IDS.SAVE}" style="width: 100%; margin-bottom: 8px;">💾 Save Query</button>
            `;
        }
        return '';
    }
    
    /**
     * Export the layout functions
     */
    return {
        htmlQueryUI: htmlQueryUI,
        getWelcomeMessage: getWelcomeMessage,
        getWorkbooksButton: getWorkbooksButton,
        getRemoteLibraryButton: getRemoteLibraryButton,
        getLocalLibraryButtons: getLocalLibraryButtons
    };
    
});
