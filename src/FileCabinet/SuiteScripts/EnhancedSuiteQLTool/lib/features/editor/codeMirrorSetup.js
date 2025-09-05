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

                // Extend CodeMirror's SQL mode with custom keywords
                if (CodeMirror.modes && CodeMirror.modes.sql) {
                    // Add our custom keywords to CodeMirror's SQL mode
                    var customKeywords = {
                        'create': true, 'replace': true, 'procedure': true, 'function': true,
                        'call': true, 'returns': true, 'return': true, 'begin': true, 'end': true,
                        'declare': true, 'set': true, 'if': true, 'while': true, 'for': true, 'loop': true,
                        'true': true, 'false': true, 'null': true
                    };

                    // Extend the existing SQL keywords
                    if (CodeMirror.modes.sql.keywords) {
                        Object.assign(CodeMirror.modes.sql.keywords, customKeywords);
                    }
                }

                // Auto-complete functionality disabled for v1.2.0
                // Will be enhanced in v1.3.0 with proper table/field references

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
                        // Auto-complete disabled for now (will be enhanced in v1.3.0)
                        // "Ctrl-Space": "autocomplete",
                        // "Cmd-Space": "autocomplete",

                        // Query execution shortcuts (cross-platform)
                        "Ctrl-R": function(cm) { querySubmit(); },
                        "Cmd-R": function(cm) { querySubmit(); },
                        "Ctrl-Enter": function(cm) { querySubmit(); },
                        "Cmd-Enter": function(cm) { querySubmit(); },
                        "F5": function(cm) { querySubmit(); },

                        // Save shortcuts (cross-platform)
                        "Ctrl-S": function(cm) {
                            // Use the appropriate save function based on what's available
                            if (typeof saveCurrentTabAsQuery === 'function') {
                                saveCurrentTabAsQuery();
                            } else if (typeof saveCurrentQuery === 'function') {
                                saveCurrentQuery();
                            }
                        },
                        "Cmd-S": function(cm) {
                            // Use the appropriate save function based on what's available
                            if (typeof saveCurrentTabAsQuery === 'function') {
                                saveCurrentTabAsQuery();
                            } else if (typeof saveCurrentQuery === 'function') {
                                saveCurrentQuery();
                            }
                        }
                    },
                    // Hint options disabled for now (will be enhanced in v1.3.0)
                    // hintOptions: {
                    //     hint: function(cm) {
                    //         // Use custom SQL hint if available, otherwise fall back to built-in
                    //         if (CodeMirror.hint && CodeMirror.hint.sql) {
                    //             return CodeMirror.hint.sql(cm);
                    //         } else {
                    //             // Fallback to our custom hint function
                    //             return CodeMirror.helpers.hint.sql(cm);
                    //         }
                    //     },
                    //     completeSingle: false,
                    //     closeOnUnfocus: true,
                    //     alignWithWord: true,
                    //     closeCharacters: /[\\s()\\[\\]{};:>,]/
                    // }
                    });

                    // Set initial empty content - the tab system will override this with saved content if needed
                    // New tabs should start blank, and saved tabs will load their content via switchToTab()
                    codeEditor.setValue('');

                    // console.log('CodeMirror initialized successfully');

                } catch(error) {
                    console.error('Error initializing CodeMirror:', error);
                    return;
                }

                // Add event listeners (autocomplete disabled for v1.2.0)
                codeEditor.on('change', function(cm, change) {
                    updateCursorPosition();
                    fileInfoRefresh();

                    // Auto-completion disabled until v1.3.0
                    // Will be enhanced with proper table/field references
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
