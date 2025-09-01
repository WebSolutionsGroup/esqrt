/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Layout Utilities
 * 
 * This module handles layout utilities including responsive design,
 * resizers, sidebar management, and general UI interactions.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the resizers initialization JavaScript
     * 
     * @returns {string} JavaScript code for resizers initialization
     */
    function getInitializeResizersJS() {
        return `
            function initializeResizers() {
                const editorContainer = document.querySelector('.${constants.CSS_CLASSES.CODEOSS_EDITOR}');
                const resultsContainer = document.querySelector('.${constants.CSS_CLASSES.CODEOSS_RESULTS}');
                const sidebar = document.querySelector('.${constants.CSS_CLASSES.CODEOSS_SIDEBAR}');
                const editorResizer = document.getElementById('editorResizer');

                console.log('Initializing resizers...', {
                    editorContainer: editorContainer,
                    resultsContainer: resultsContainer,
                    editorResizer: editorResizer
                });

                if (!editorContainer || !resultsContainer || !editorResizer) {
                    console.warn('Missing required elements for resizers');
                    return;
                }
                
                let isResizing = false;
                let isSidebarResizing = false;
                let startY = 0;
                let startX = 0;
                let startEditorHeight = 0;
                let startSidebarWidth = 0;
                
                // Editor/Results vertical resizer
                editorResizer.addEventListener('mousedown', function(e) {
                    console.log('Resizer mousedown event triggered');
                    isResizing = true;
                    startY = e.clientY;
                    startEditorHeight = editorContainer.offsetHeight;
                    document.body.style.cursor = 'row-resize';
                    editorResizer.style.backgroundColor = 'var(--codeoss-accent)';
                    e.preventDefault();
                });
                
                // Sidebar horizontal resizer
                if (sidebar) {
                    const sidebarResizer = sidebar.querySelector('.codeoss-sidebar-resizer');
                    if (sidebarResizer) {
                        sidebarResizer.addEventListener('mousedown', function(e) {
                            isSidebarResizing = true;
                            startX = e.clientX;
                            startSidebarWidth = sidebar.offsetWidth;
                            document.body.style.cursor = 'col-resize';
                            e.preventDefault();
                        });
                    }
                }
                
                // Mouse move handler
                document.addEventListener('mousemove', function(e) {
                    if (isResizing) {
                        const deltaY = e.clientY - startY;
                        const newHeight = Math.max(${constants.CONFIG.UI.EDITOR.MIN_HEIGHT}, startEditorHeight + deltaY);
                        const maxHeight = window.innerHeight * 0.7;
                        const finalHeight = Math.min(newHeight, maxHeight);

                        // Override flex with explicit height
                        editorContainer.style.flex = 'none';
                        editorContainer.style.height = finalHeight + 'px';

                        console.log('Resizing editor to height:', finalHeight);

                        if (codeEditor) {
                            codeEditor.refresh();
                        }
                    }
                    
                    if (isSidebarResizing && sidebar) {
                        const deltaX = e.clientX - startX;
                        const newWidth = Math.max(${constants.CONFIG.UI.SIDEBAR.MIN_WIDTH}, Math.min(${constants.CONFIG.UI.SIDEBAR.MAX_WIDTH}, startSidebarWidth + deltaX));
                        sidebar.style.width = newWidth + 'px';
                    }
                });
                
                // Mouse up handler
                document.addEventListener('mouseup', function() {
                    if (isResizing || isSidebarResizing) {
                        document.body.style.cursor = '';
                        editorResizer.style.backgroundColor = '';
                        isResizing = false;
                        isSidebarResizing = false;
                        console.log('Resizing ended');
                    }
                });
            }
        `;
    }
    
    /**
     * Generate the responsive layout JavaScript
     * 
     * @returns {string} JavaScript code for responsive layout
     */
    function getInitializeResponsiveLayoutJS() {
        return `
            function initializeResponsiveLayout() {
                // Handle window resize
                window.addEventListener('resize', function() {
                    adjustLayoutForScreenSize();
                    if (codeEditor) {
                        codeEditor.refresh();
                    }
                });
                
                // Initial layout adjustment
                adjustLayoutForScreenSize();
            }
            
            function adjustLayoutForScreenSize() {
                const container = document.querySelector('.${constants.CSS_CLASSES.CODEOSS_CONTAINER}');
                const sidebar = document.querySelector('.${constants.CSS_CLASSES.CODEOSS_SIDEBAR}');
                
                if (!container) return;
                
                const headerHeight = calculateNetSuiteHeaderHeight();
                container.style.top = headerHeight + 'px';
                container.style.height = 'calc(100vh - ' + headerHeight + 'px)';
                
                // Responsive sidebar handling
                if (sidebar && window.innerWidth < 768) {
                    sidebar.style.width = '250px';
                } else if (sidebar && window.innerWidth < 480) {
                    sidebar.style.width = '200px';
                }
                
                // Refresh CodeMirror if it exists
                if (codeEditor) {
                    setTimeout(() => {
                        codeEditor.refresh();
                    }, 100);
                }
            }
            
            function calculateNetSuiteHeaderHeight() {
                // Try to find the actual position where our content should start
                let headerHeight = 90; // Default fallback
                
                try {
                    // Look for NetSuite's page title elements
                    const pageTitleSecond = document.querySelector('.uir-page-title-secondline');
                    const pageTitleFirst = document.querySelector('.uir-page-title-firstline');
                    const mainForm = document.querySelector('form[name="main_form"]');
                    
                    if (pageTitleSecond) {
                        const rect = pageTitleSecond.getBoundingClientRect();
                        headerHeight = rect.bottom + 10; // Add small margin
                    } else if (pageTitleFirst) {
                        const rect = pageTitleFirst.getBoundingClientRect();
                        headerHeight = rect.bottom + 10;
                    } else if (mainForm) {
                        const rect = mainForm.getBoundingClientRect();
                        headerHeight = rect.top + 10;
                    }
                    
                    // Ensure minimum height
                    headerHeight = Math.max(headerHeight, 60);
                    
                } catch (e) {
                    console.warn('Could not calculate NetSuite header height:', e);
                }
                
                return headerHeight;
            }
        `;
    }
    
    /**
     * Generate the sidebar toggle JavaScript
     * 
     * @returns {string} JavaScript code for sidebar toggle
     */
    function getToggleSidebarJS() {
        return `
            function toggleSidebar() {
                const sidebar = document.querySelector('.${constants.CSS_CLASSES.CODEOSS_SIDEBAR}');
                const editorArea = document.querySelector('.codeoss-editor-area');
                
                if (!sidebar || !editorArea) return;
                
                const isVisible = sidebar.style.display !== 'none';
                
                if (isVisible) {
                    // Hide sidebar
                    sidebar.style.display = 'none';
                    editorArea.style.marginLeft = '0';
                } else {
                    // Show sidebar
                    sidebar.style.display = 'flex';
                    editorArea.style.marginLeft = '';
                }
                
                // Refresh CodeMirror after layout change
                if (codeEditor) {
                    setTimeout(() => {
                        codeEditor.refresh();
                    }, 300);
                }
            }
        `;
    }
    

    
    /**
     * Generate the modal handlers JavaScript
     * 
     * @returns {string} JavaScript code for modal handlers
     */
    function getModalHandlersJS() {
        return `
            function initializeModalHandlers() {
                // Local load modal handler
                $('#${constants.MODAL_IDS.LOCAL_LOAD}').on('show.bs.modal', function() {
                    localLibraryFilesGet();
                });
                
                // Remote load modal handler
                $('#${constants.MODAL_IDS.REMOTE_LOAD}').on('show.bs.modal', function() {
                    remoteLibraryIndexGet();
                });
                
                // Save modal handler
                $('#${constants.MODAL_IDS.SAVE}').on('show.bs.modal', function() {
                    // Pre-populate filename if we have an active file
                    if (activeSQLFile && activeSQLFile.name) {
                        document.getElementById('saveQueryFormFileName').value = activeSQLFile.name;
                        document.getElementById('saveQueryFormDescription').value = activeSQLFile.description || '';
                    } else {
                        // Generate default filename
                        const timestamp = new Date().toISOString().split('T')[0];
                        document.getElementById('saveQueryFormFileName').value = 'query-' + timestamp + '.sql';
                        document.getElementById('saveQueryFormDescription').value = '';
                    }
                    
                    document.getElementById('saveQueryForm').style.display = 'block';
                    document.getElementById('saveQueryMessage').style.display = 'none';
                });
                
                // Workbooks modal handler
                $('#${constants.MODAL_IDS.WORKBOOKS}').on('show.bs.modal', function() {
                    workbooksListGet();
                });
            }
        `;
    }
    
    /**
     * Generate the keyboard handlers JavaScript
     * 
     * @returns {string} JavaScript code for keyboard handlers
     */
    function getKeyboardHandlersJS() {
        return `
            function initializeKeyboardHandlers() {
                // Global keyboard shortcuts
                document.addEventListener('keydown', function(e) {
                    // Ctrl+R or F5 - Run query
                    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
                        e.preventDefault();
                        querySubmit();
                        return false;
                    }
                    
                    // Ctrl+Enter - Run query
                    if (e.ctrlKey && e.key === 'Enter') {
                        e.preventDefault();
                        querySubmit();
                        return false;
                    }
                    
                    // Ctrl+S - Save query (if local library enabled)
                    if (e.ctrlKey && e.key === 's') {
                        e.preventDefault();
                        if (${constants.CONFIG.QUERY_FOLDER_ID !== null}) {
                            $('#${constants.MODAL_IDS.SAVE}').modal('show');
                        }
                        return false;
                    }
                    
                    // Ctrl+O - Open query (if local library enabled)
                    if (e.ctrlKey && e.key === 'o') {
                        e.preventDefault();
                        if (${constants.CONFIG.QUERY_FOLDER_ID !== null}) {
                            $('#${constants.MODAL_IDS.LOCAL_LOAD}').modal('show');
                        }
                        return false;
                    }
                    
                    // Escape - Close modals or panels
                    if (e.key === 'Escape') {
                        // Close any open modals
                        $('.modal').modal('hide');
                        
                        // Close controls panel if open
                        const controlsPanel = document.getElementById('${constants.ELEMENT_IDS.CONTROLS_PANEL}');
                        if (controlsPanel && controlsPanel.style.display !== 'none') {
                            toggleControls();
                        }
                    }
                    

                });
            }
        `;
    }
    
    /**
     * Generate the full screen utilities JavaScript
     *
     * @returns {string} JavaScript code for full screen utilities
     */
    function getFullScreenUtilitiesJS() {
        return `
            function enterFullScreen() {
                const container = document.querySelector('.${constants.CSS_CLASSES.CODEOSS_CONTAINER}');
                if (!container) return;

                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
            }

            function exitFullScreen() {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }

            function toggleFullScreen() {
                if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
                    exitFullScreen();
                } else {
                    enterFullScreen();
                }
            }
        `;
    }

    /**
     * Generate the query results header update JavaScript
     *
     * @returns {string} JavaScript code for updating query results header
     */
    function getUpdateQueryResultsHeaderJS() {
        return `
            function updateQueryResultsHeader(recordCount, totalCount, elapsedTime) {
                const header = document.getElementById('${constants.ELEMENT_IDS.QUERY_RESULTS_HEADER}');
                if (header && recordCount !== undefined && elapsedTime !== undefined) {
                    let headerText = 'Query Results - Retrieved ' + recordCount;
                    if (totalCount !== undefined && document.getElementById('${constants.ELEMENT_IDS.RETURN_TOTALS}') && document.getElementById('${constants.ELEMENT_IDS.RETURN_TOTALS}').checked) {
                        headerText += ' of ' + totalCount;
                    }
                    headerText += ' rows in ' + elapsedTime + 'ms';
                    header.textContent = headerText;
                } else if (header) {
                    header.textContent = 'Query Results';
                }
            }
        `;
    }
    
    /**
     * Get all layout utilities JavaScript functions
     *
     * @returns {string} Complete JavaScript code for layout utilities functionality
     */
    function getAllLayoutUtilitiesJS() {
        return getInitializeResizersJS() + '\n' +
               getInitializeResponsiveLayoutJS() + '\n' +
               getToggleSidebarJS() + '\n' +
               getModalHandlersJS() + '\n' +
               getKeyboardHandlersJS() + '\n' +
               getFullScreenUtilitiesJS() + '\n' +
               getUpdateQueryResultsHeaderJS();
    }
    
    /**
     * Export the layout utilities functions
     */
    return {
        getInitializeResizersJS: getInitializeResizersJS,
        getInitializeResponsiveLayoutJS: getInitializeResponsiveLayoutJS,
        getToggleSidebarJS: getToggleSidebarJS,

        getModalHandlersJS: getModalHandlersJS,
        getKeyboardHandlersJS: getKeyboardHandlersJS,
        getFullScreenUtilitiesJS: getFullScreenUtilitiesJS,
        getUpdateQueryResultsHeaderJS: getUpdateQueryResultsHeaderJS,
        getAllLayoutUtilitiesJS: getAllLayoutUtilitiesJS
    };
    
});
