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

                // Register custom SQL hint function for auto-complete
                CodeMirror.registerHelper("hint", "sql", function(cm) {
                    var cursor = cm.getCursor();
                    var line = cm.getLine(cursor.line);
                    var start = cursor.ch;
                    var end = cursor.ch;

                    // Find the start of the current word
                    while (start && /\\w/.test(line.charAt(start - 1))) --start;
                    // Find the end of the current word
                    while (end < line.length && /\\w/.test(line.charAt(end))) ++end;

                    var word = line.slice(start, end).toLowerCase();

                    // Get suggestions based on context
                    var suggestions = getSQLSuggestions(word, line, cursor);

                    return {
                        list: suggestions,
                        from: CodeMirror.Pos(cursor.line, start),
                        to: CodeMirror.Pos(cursor.line, end)
                    };
                });

                // Auto-complete suggestion function
                function getSQLSuggestions(word, line, cursor) {
                    var suggestions = [];
                    var keywords = ` + JSON.stringify(constants.CONFIG.SQL_KEYWORDS) + `;
                    var tables = ` + JSON.stringify(constants.CONFIG.NETSUITE_TABLES) + `;
                    var fields = ` + JSON.stringify(constants.CONFIG.NETSUITE_FIELDS) + `;

                    // Determine context based on the current line
                    var lineUpper = line.toUpperCase();
                    var beforeCursor = line.substring(0, cursor.ch).toUpperCase();

                    // Context-aware suggestions
                    if (beforeCursor.includes('SELECT') && !beforeCursor.includes('FROM')) {
                        // In SELECT clause - suggest fields and functions
                        suggestions = suggestions.concat(
                            fields.filter(f => f.toLowerCase().startsWith(word)),
                            ['COUNT(*)', 'SUM(', 'AVG(', 'MIN(', 'MAX(', 'DISTINCT'].filter(f => f.toLowerCase().startsWith(word))
                        );
                    } else if (beforeCursor.includes('FROM') && !beforeCursor.includes('WHERE')) {
                        // In FROM clause - suggest tables
                        suggestions = suggestions.concat(
                            tables.filter(t => t.toLowerCase().startsWith(word))
                        );
                    } else if (beforeCursor.includes('WHERE') || beforeCursor.includes('AND') || beforeCursor.includes('OR')) {
                        // In WHERE clause - suggest fields and operators
                        suggestions = suggestions.concat(
                            fields.filter(f => f.toLowerCase().startsWith(word)),
                            ['IS NULL', 'IS NOT NULL', 'LIKE', 'IN', 'BETWEEN'].filter(op => op.toLowerCase().startsWith(word))
                        );
                    } else if (beforeCursor.includes('ORDER BY') || beforeCursor.includes('GROUP BY')) {
                        // In ORDER BY or GROUP BY - suggest fields
                        suggestions = suggestions.concat(
                            fields.filter(f => f.toLowerCase().startsWith(word)),
                            ['ASC', 'DESC'].filter(dir => dir.toLowerCase().startsWith(word))
                        );
                    } else if (beforeCursor.includes('JOIN')) {
                        // After JOIN - suggest tables
                        suggestions = suggestions.concat(
                            tables.filter(t => t.toLowerCase().startsWith(word))
                        );
                    } else {
                        // General context - suggest keywords first, then tables and fields
                        suggestions = suggestions.concat(
                            keywords.filter(k => k.toLowerCase().startsWith(word)),
                            tables.filter(t => t.toLowerCase().startsWith(word)),
                            fields.filter(f => f.toLowerCase().startsWith(word))
                        );
                    }

                    // Remove duplicates and sort
                    suggestions = [...new Set(suggestions)];
                    suggestions.sort();

                    // Limit to top 20 suggestions for performance
                    return suggestions.slice(0, 20);
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
                        // Auto-complete shortcuts (cross-platform)
                        "Ctrl-Space": "autocomplete",
                        "Cmd-Space": "autocomplete",

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
                    hintOptions: {
                        hint: CodeMirror.hint.sql,
                        completeSingle: false,
                        closeOnUnfocus: true,
                        alignWithWord: true,
                        closeCharacters: /[\\s()\\[\\]{};:>,]/
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
                codeEditor.on('change', function(cm, change) {
                    updateCursorPosition();
                    fileInfoRefresh();

                    // Auto-trigger completion for certain characters
                    if (change.text && change.text.length === 1) {
                        var text = change.text[0];
                        var cursor = cm.getCursor();
                        var line = cm.getLine(cursor.line);
                        var beforeCursor = line.substring(0, cursor.ch);

                        // Trigger auto-complete after typing certain characters or patterns
                        if (text === ' ' && /\\b(SELECT|FROM|WHERE|ORDER BY|GROUP BY|JOIN)$/i.test(beforeCursor.trim())) {
                            setTimeout(function() {
                                cm.showHint({
                                    hint: CodeMirror.hint.sql,
                                    completeSingle: false,
                                    closeOnUnfocus: true
                                });
                            }, 100);
                        } else if (text.match(/[a-zA-Z]/) && beforeCursor.length >= 2) {
                            // Auto-trigger after typing 2+ characters
                            var lastWord = beforeCursor.match(/\\b\\w{2,}$/);
                            if (lastWord) {
                                setTimeout(function() {
                                    cm.showHint({
                                        hint: CodeMirror.hint.sql,
                                        completeSingle: false,
                                        closeOnUnfocus: true
                                    });
                                }, 300);
                            }
                        }
                    }
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
