/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - CodeMirror Editor Setup
 * 
 * This module handles CodeMirror initialization, configuration,
 * and editor-related functionality including syntax highlighting,
 * auto-completion, and editor controls.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the CodeMirror initialization JavaScript
     * 
     * @returns {string} JavaScript code for CodeMirror setup
     */
    function getInitCodeMirrorJS() {
        return `
            function initCodeMirror() {
                // Check if CodeMirror is available
                if (typeof CodeMirror === 'undefined') {
                    console.error('CodeMirror library not loaded! Retrying in 500ms...');
                    setTimeout(initCodeMirror, 500);
                    return;
                }

                var textarea = document.getElementById('` + constants.ELEMENT_IDS.QUERY_TEXTAREA + `');
                if (!textarea) {
                    console.error('Query textarea not found!');
                    return;
                }

                try {
                    codeEditor = CodeMirror.fromTextArea(textarea, {
                    mode: 'text/x-sql',
                    theme: 'default',
                    lineNumbers: true,
                    lineWrapping: true,
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    indentUnit: 4,
                    smartIndent: true,
                    styleSelectedText: true,
                    extraKeys: {
                        "Ctrl-Space": "autocomplete",
                        "Ctrl-R": function(cm) { querySubmit(); },
                        "Ctrl-Enter": function(cm) { querySubmit(); },
                        "F5": function(cm) { querySubmit(); },
                        "Ctrl-S": function(cm) {
                            // Use the appropriate save function based on what's available
                            if (typeof saveCurrentTabAsQuery === 'function') {
                                saveCurrentTabAsQuery();
                            } else if (typeof saveCurrentQuery === 'function') {
                                saveCurrentQuery();
                            }
                        }
                    },
                    hintOptions: {
                        tables: ` + JSON.stringify(constants.CONFIG.NETSUITE_TABLES) + `,
                        keywords: ` + JSON.stringify(constants.CONFIG.SQL_KEYWORDS) + `,
                        fields: ` + JSON.stringify(constants.CONFIG.NETSUITE_FIELDS) + `
                    }
                    });

                    // Set initial content
                    codeEditor.setValue(` + JSON.stringify(constants.DEFAULT_QUERY) + `);

                    console.log('CodeMirror initialized successfully');

                } catch(error) {
                    console.error('Error initializing CodeMirror:', error);
                    return;
                }

                // Add event listeners
                codeEditor.on('change', function(cm) {
                    updateCursorPosition();
                    fileInfoRefresh();
                });
                
                codeEditor.on('cursorActivity', function(cm) {
                    updateCursorPosition();
                });
                
                // Focus the editor
                setTimeout(function() {
                    codeEditor.focus();
                    codeEditor.refresh();
                }, 100);
            }
        `;
    }
    
    /**
     * Generate the default query set JavaScript
     * 
     * @returns {string} JavaScript code for setting default query
     */
    function getDefaultQuerySetJS() {
        return `
            function defaultQuerySet() {
                if (codeEditor) {
                    codeEditor.setValue(` + JSON.stringify(constants.DEFAULT_QUERY) + `);
                    codeEditor.focus();
                } else {
                    document.getElementById('` + constants.ELEMENT_IDS.QUERY_TEXTAREA + `').value = ` + JSON.stringify(constants.DEFAULT_QUERY) + `;
                }
                fileInfoRefresh();
            }
        `;
    }
    
    /**
     * Generate the cursor position update JavaScript
     * 
     * @returns {string} JavaScript code for cursor position updates
     */
    function getCursorPositionJS() {
        return `
            function updateCursorPosition() {
                if (codeEditor) {
                    const cursor = codeEditor.getCursor();
                    const line = cursor.line + 1;
                    const col = cursor.ch + 1;
                    document.getElementById('` + constants.ELEMENT_IDS.CURSOR_POSITION + `').textContent = 'Ln ' + line + ', Col ' + col;
                }
            }
        `;
    }
    
    /**
     * Generate the file info refresh JavaScript
     * 
     * @returns {string} JavaScript code for file info refresh
     */
    function getFileInfoRefreshJS() {
        return `
            function fileInfoRefresh() {
                const fileInfoElement = document.getElementById('` + constants.ELEMENT_IDS.FILE_INFO + `');
                if (!fileInfoElement) return;

                let fileInfo = '';

                if (activeSQLFile && activeSQLFile.name) {
                    fileInfo = activeSQLFile.name;
                    if (activeSQLFile.description) {
                        fileInfo += ' - ' + activeSQLFile.description;
                    }
                } else {
                    // Leave blank by default; the active tab title is the primary label
                    fileInfo = '';
                }

                // Add modification indicator if content has changed
                if (codeEditor) {
                    const currentContent = codeEditor.getValue();
                    if (activeSQLFile && activeSQLFile.originalContent && currentContent !== activeSQLFile.originalContent) {
                        fileInfo += ' •';
                    }
                }

                fileInfoElement.textContent = fileInfo;
                fileInfoElement.style.display = fileInfo ? 'inline' : 'none';
            }
        `;
    }
    
    /**
     * Generate the zoom controls JavaScript
     * 
     * @returns {string} JavaScript code for zoom controls
     */
    function getZoomControlsJS() {
        return `
            var currentZoom = ` + constants.CONFIG.UI.ZOOM.DEFAULT + `;

            function zoomIn() {
                currentZoom += ` + constants.CONFIG.UI.ZOOM.STEP + `;
                if (currentZoom > ` + constants.CONFIG.UI.ZOOM.MAX + `) {
                    currentZoom = ` + constants.CONFIG.UI.ZOOM.MAX + `;
                }
                updateZoom();
            }

            function zoomOut() {
                currentZoom -= ` + constants.CONFIG.UI.ZOOM.STEP + `;
                if (currentZoom < ` + constants.CONFIG.UI.ZOOM.MIN + `) {
                    currentZoom = ` + constants.CONFIG.UI.ZOOM.MIN + `;
                }
                updateZoom();
            }

            function resetZoom() {
                currentZoom = ` + constants.CONFIG.UI.ZOOM.DEFAULT + `;
                updateZoom();
            }
            
            function updateZoom() {
                const zoomFactor = currentZoom / 100;
                document.getElementById('` + constants.ELEMENT_IDS.ZOOM_LEVEL + `').textContent = currentZoom + '%';

                if (codeEditor) {
                    const fontSize = Math.round(` + constants.CONFIG.UI.EDITOR.DEFAULT_FONT_SIZE + ` * zoomFactor);
                    codeEditor.getWrapperElement().style.fontSize = fontSize + 'px';
                    codeEditor.refresh();
                }

                // Update other UI elements
                const container = document.querySelector('.` + constants.CSS_CLASSES.CODEOSS_CONTAINER + `');
                if (container) {
                    container.style.fontSize = (12 * zoomFactor) + 'px';
                }
            }
        `;
    }
    
    /**
     * Generate the theme toggle JavaScript
     * 
     * @returns {string} JavaScript code for theme toggling
     */
    function getThemeToggleJS() {
        return `
            function toggleTheme() {
                const isDark = document.body.classList.contains('dark-theme');

                if (isDark) {
                    document.body.classList.remove('dark-theme');
                    if (codeEditor) {
                        codeEditor.setOption('theme', 'default');
                    }
                    localStorage.setItem('suiteql-theme', 'light');
                } else {
                    document.body.classList.add('dark-theme');
                    if (codeEditor) {
                        codeEditor.setOption('theme', 'monokai');
                    }
                    localStorage.setItem('suiteql-theme', 'dark');
                }
            }

            function initializeTheme() {
                const savedTheme = localStorage.getItem('suiteql-theme') || 'light';
                if (savedTheme === 'dark') {
                    document.body.classList.add('dark-theme');
                    if (codeEditor) {
                        codeEditor.setOption('theme', 'monokai');
                    }
                } else {
                    // Light theme is default, no class needed
                    if (codeEditor) {
                        codeEditor.setOption('theme', 'default');
                    }
                }
            }
        `;
    }
    
    /**
     * Get all editor-related JavaScript functions
     * 
     * @returns {string} Complete JavaScript code for editor functionality
     */
    function getAllEditorJS() {
        return getInitCodeMirrorJS() + '\n' +
               getDefaultQuerySetJS() + '\n' +
               getCursorPositionJS() + '\n' +
               getFileInfoRefreshJS() + '\n' +
               getZoomControlsJS() + '\n' +
               getThemeToggleJS();
    }
    
    /**
     * Export the editor functions
     */
    return {
        getInitCodeMirrorJS: getInitCodeMirrorJS,
        getDefaultQuerySetJS: getDefaultQuerySetJS,
        getCursorPositionJS: getCursorPositionJS,
        getFileInfoRefreshJS: getFileInfoRefreshJS,
        getZoomControlsJS: getZoomControlsJS,
        getThemeToggleJS: getThemeToggleJS,
        getAllEditorJS: getAllEditorJS
    };
    
});
