/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Options and Controls
 * 
 * This module handles the options panel functionality including
 * pagination controls, formatting options, and various query settings.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the controls panel initialization JavaScript
     * 
     * @returns {string} JavaScript code for controls panel initialization
     */
    function getInitializeControlsPanelJS() {
        return `
            function initializeControlsPanel() {
                const controlsPanel = document.getElementById('${constants.ELEMENT_IDS.CONTROLS_CONTENT}');
                if (!controlsPanel) return;
                
                const controlsHTML = \`
                    <div class="control-group" style="margin-bottom: 20px;">
                        <h5 style="margin: 0 0 8px 0; color: var(--codeoss-text-primary); font-size: 11px; text-transform: uppercase;">Result Format</h5>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="display: flex; align-items: center; font-size: 11px; color: var(--codeoss-text-primary);">
                                <input type="radio" name="resultFormat" value="table" checked style="margin-right: 6px;"> Table View
                            </label>
                            <label style="display: flex; align-items: center; font-size: 11px; color: var(--codeoss-text-primary);">
                                <input type="radio" name="resultFormat" value="csv" style="margin-right: 6px;"> CSV Format
                            </label>
                            <label style="display: flex; align-items: center; font-size: 11px; color: var(--codeoss-text-primary);">
                                <input type="radio" name="resultFormat" value="json" style="margin-right: 6px;"> JSON Format
                            </label>
                        </div>
                    </div>
                    
                    <div class="control-group" style="margin-bottom: 20px;">
                        <h5 style="margin: 0 0 8px 0; color: var(--codeoss-text-primary); font-size: 11px; text-transform: uppercase;">Pagination</h5>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: center; font-size: 11px; color: var(--codeoss-text-primary);">
                                <input type="checkbox" id="${constants.ELEMENT_IDS.ENABLE_PAGINATION}" onchange="enablePaginationToggle()" style="margin-right: 6px;"> Enable Pagination
                            </label>
                            <label style="display: flex; align-items: center; font-size: 11px; color: var(--codeoss-text-primary);">
                                <input type="checkbox" id="${constants.ELEMENT_IDS.RETURN_ALL}" onchange="returnAllToggle()" style="margin-right: 6px;"> Return All Records
                            </label>
                            <div id="${constants.ELEMENT_IDS.ROW_RANGE_DIV}" style="display: none;">
                                <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
                                    <label style="font-size: 10px; color: var(--codeoss-text-secondary);">From:</label>
                                    <input type="number" id="${constants.ELEMENT_IDS.ROW_BEGIN}" value="1" min="1" style="width: 60px; padding: 2px 4px; font-size: 10px;">
                                    <label style="font-size: 10px; color: var(--codeoss-text-secondary);">To:</label>
                                    <input type="number" id="${constants.ELEMENT_IDS.ROW_END}" value="${constants.CONFIG.ROWS_RETURNED_DEFAULT}" min="1" style="width: 60px; padding: 2px 4px; font-size: 10px;">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="control-group" style="margin-bottom: 20px;">
                        <h5 style="margin: 0 0 8px 0; color: var(--codeoss-text-primary); font-size: 11px; text-transform: uppercase;">Display Options</h5>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="display: flex; align-items: center; font-size: 11px; color: var(--codeoss-text-primary);">
                                <input type="checkbox" id="${constants.ELEMENT_IDS.HIDE_ROW_NUMBERS}" onchange="hideRowNumbersToggle()" style="margin-right: 6px;"> Hide Row Numbers
                            </label>
                            <label style="display: flex; align-items: center; font-size: 11px; color: var(--codeoss-text-primary);">
                                <input type="checkbox" id="${constants.ELEMENT_IDS.RETURN_TOTALS}" style="margin-right: 6px;"> Show Record Count
                            </label>
                            <label style="display: flex; align-items: center; font-size: 11px; color: var(--codeoss-text-primary);">
                                <input type="checkbox" id="${constants.ELEMENT_IDS.ENABLE_VIEWS}" style="margin-right: 6px;"> Enable Virtual Views
                            </label>
                        </div>
                    </div>
                    
                    <div class="control-group" style="margin-bottom: 20px;">
                        <h5 style="margin: 0 0 8px 0; color: var(--codeoss-text-primary); font-size: 11px; text-transform: uppercase;">Export Options</h5>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="exportTableAsCSV()" style="width: 100%; font-size: 10px; padding: 4px 8px;">📊 Export as CSV</button>
                            <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="showCSVOptionsModal()" style="width: 100%; font-size: 10px; padding: 4px 8px;">⚙️ CSV Export Options</button>
                            <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="exportTableAsJSON()" style="width: 100%; font-size: 10px; padding: 4px 8px;">📋 Export as JSON</button>
                            <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="generatePDFReport()" style="width: 100%; font-size: 10px; padding: 4px 8px;">📄 Generate PDF</button>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <h5 style="margin: 0 0 8px 0; color: var(--codeoss-text-primary); font-size: 11px; text-transform: uppercase;">Query History</h5>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="exportQueryHistory()" style="width: 100%; font-size: 10px; padding: 4px 8px;">💾 Export History</button>
                            <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="importQueryHistory()" style="width: 100%; font-size: 10px; padding: 4px 8px;">📁 Import History</button>
                            <button type="button" class="${constants.CSS_CLASSES.CODEOSS_BTN_SECONDARY}" onclick="clearQueryHistory()" style="width: 100%; font-size: 10px; padding: 4px 8px;">🗑 Clear History</button>
                        </div>
                    </div>
                \`;
                
                controlsPanel.innerHTML = controlsHTML;
                
                // Add event listeners for result format radio buttons
                const formatRadios = controlsPanel.querySelectorAll('input[name="resultFormat"]');
                formatRadios.forEach(radio => {
                    radio.addEventListener('change', function() {
                        if (this.checked && queryResponsePayload) {
                            switch(this.value) {
                                case 'table':
                                    responseGenerateTable();
                                    break;
                                case 'csv':
                                    responseGenerateCSV();
                                    break;
                                case 'json':
                                    responseGenerateJSON();
                                    break;
                            }
                        }
                    });
                });
            }
        `;
    }
    
    /**
     * Generate the toggle controls JavaScript
     * 
     * @returns {string} JavaScript code for toggle controls
     */
    function getToggleControlsJS() {
        return `
            function toggleControls() {
                const panel = document.getElementById('${constants.ELEMENT_IDS.CONTROLS_PANEL}');
                const contentArea = document.getElementById('resultsContentArea');
                const toggleBtn = document.getElementById('${constants.ELEMENT_IDS.TOGGLE_CONTROLS_BTN}');
                
                if (!panel || !contentArea) return;
                
                const isVisible = panel.style.display !== 'none';
                
                if (isVisible) {
                    // Hide panel
                    panel.style.display = 'none';
                    contentArea.style.flex = '1';
                    if (toggleBtn) toggleBtn.textContent = '⚙ Options';
                } else {
                    // Show panel
                    panel.style.display = 'block';
                    contentArea.style.flex = '1';
                    if (toggleBtn) toggleBtn.textContent = '✕ Close';
                }
            }
        `;
    }
    
    /**
     * Generate the pagination toggle JavaScript
     * 
     * @returns {string} JavaScript code for pagination toggle
     */
    function getEnablePaginationToggleJS() {
        return `
            function enablePaginationToggle() {
                const enablePagination = document.getElementById('${constants.ELEMENT_IDS.ENABLE_PAGINATION}');
                const rowRangeDiv = document.getElementById('${constants.ELEMENT_IDS.ROW_RANGE_DIV}');
                const returnAll = document.getElementById('${constants.ELEMENT_IDS.RETURN_ALL}');
                
                if (!enablePagination || !rowRangeDiv) return;
                
                if (enablePagination.checked) {
                    rowRangeDiv.style.display = 'block';
                    if (returnAll) returnAll.checked = false;
                } else {
                    rowRangeDiv.style.display = 'none';
                }
            }
        `;
    }
    
    /**
     * Generate the return all toggle JavaScript
     * 
     * @returns {string} JavaScript code for return all toggle
     */
    function getReturnAllToggleJS() {
        return `
            function returnAllToggle() {
                const returnAll = document.getElementById('${constants.ELEMENT_IDS.RETURN_ALL}');
                const enablePagination = document.getElementById('${constants.ELEMENT_IDS.ENABLE_PAGINATION}');
                const rowRangeDiv = document.getElementById('${constants.ELEMENT_IDS.ROW_RANGE_DIV}');
                
                if (!returnAll) return;
                
                if (returnAll.checked) {
                    if (enablePagination) enablePagination.checked = false;
                    if (rowRangeDiv) rowRangeDiv.style.display = 'none';
                }
            }
        `;
    }
    
    /**
     * Generate the hide row numbers toggle JavaScript
     * 
     * @returns {string} JavaScript code for hide row numbers toggle
     */
    function getHideRowNumbersToggleJS() {
        return `
            function hideRowNumbersToggle() {
                // Re-render the current view to apply the change
                if (queryResponsePayload) {
                    const formatRadios = document.querySelectorAll('input[name="resultFormat"]');
                    const selectedFormat = Array.from(formatRadios).find(radio => radio.checked);
                    
                    if (selectedFormat) {
                        switch(selectedFormat.value) {
                            case 'table':
                                responseGenerateTable();
                                break;
                            case 'csv':
                                responseGenerateCSV();
                                break;
                            case 'json':
                                responseGenerateJSON();
                                break;
                        }
                    } else {
                        responseGenerateTable(); // Default to table
                    }
                }
            }
        `;
    }
    
    /**
     * Generate the clear results JavaScript
     * 
     * @returns {string} JavaScript code for clearing results
     */
    function getClearResultsJS() {
        return `
            function clearResults() {
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.WELCOME_MESSAGE}').style.display = 'block';
                document.getElementById('${constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN}').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = 'Ready';

                // Hide CSV export buttons
                const csvExportGroup = document.getElementById('csvExportGroup');
                if (csvExportGroup) {
                    csvExportGroup.style.display = 'none';
                } else {
                    // Fallback for individual buttons
                    document.getElementById('downloadCSVBtn').style.display = 'none';
                    document.getElementById('copyCSVBtn').style.display = 'none';
                }

                // Clear the response payload
                queryResponsePayload = null;

                // Reset controls to default state
                const formatRadios = document.querySelectorAll('input[name="resultFormat"]');
                formatRadios.forEach(radio => {
                    radio.checked = radio.value === 'table';
                });

                // Clear results for current active tab
                if (typeof saveResultsToCurrentTab === 'function') {
                    saveResultsToCurrentTab();
                }
            }
        `;
    }
    
    /**
     * Generate the copy results to clipboard JavaScript
     * 
     * @returns {string} JavaScript code for copying results to clipboard
     */
    function getCopyResultsToClipboardJS() {
        return `
            function copyResultsToClipboard() {
                const responseData = document.getElementById('${constants.ELEMENT_IDS.RESPONSE_DATA}');
                if (!responseData) {
                    // If no specific response data element, try to copy table data
                    copyTableToClipboard();
                    return;
                }
                
                try {
                    responseData.select();
                    responseData.setSelectionRange(0, 99999); // For mobile devices
                    
                    const successful = document.execCommand('copy');
                    if (successful) {
                        // Show temporary success message
                        const originalBtn = document.getElementById('${constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN}');
                        if (originalBtn) {
                            const originalText = originalBtn.textContent;
                            originalBtn.textContent = '✓ Copied!';
                            originalBtn.style.backgroundColor = 'var(--codeoss-success)';
                            
                            setTimeout(() => {
                                originalBtn.textContent = originalText;
                                originalBtn.style.backgroundColor = '';
                            }, 2000);
                        }
                    } else {
                        throw new Error('Copy command failed');
                    }
                } catch (err) {
                    // Fallback for modern browsers
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(responseData.value).then(() => {
                            alert('Results copied to clipboard');
                        }).catch(() => {
                            alert('Failed to copy results to clipboard');
                        });
                    } else {
                        alert('Copy to clipboard not supported. Please select and copy manually.');
                    }
                }
            }
        `;
    }
    
    /**
     * Get all controls JavaScript functions
     * 
     * @returns {string} Complete JavaScript code for controls functionality
     */
    function getAllControlsJS() {
        return getInitializeControlsPanelJS() + '\n' +
               getToggleControlsJS() + '\n' +
               getEnablePaginationToggleJS() + '\n' +
               getReturnAllToggleJS() + '\n' +
               getHideRowNumbersToggleJS() + '\n' +
               getClearResultsJS() + '\n' +
               getCopyResultsToClipboardJS();
    }
    
    /**
     * Export the controls functions
     */
    return {
        getInitializeControlsPanelJS: getInitializeControlsPanelJS,
        getToggleControlsJS: getToggleControlsJS,
        getEnablePaginationToggleJS: getEnablePaginationToggleJS,
        getReturnAllToggleJS: getReturnAllToggleJS,
        getHideRowNumbersToggleJS: getHideRowNumbersToggleJS,
        getClearResultsJS: getClearResultsJS,
        getCopyResultsToClipboardJS: getCopyResultsToClipboardJS,
        getAllControlsJS: getAllControlsJS
    };
    
});
