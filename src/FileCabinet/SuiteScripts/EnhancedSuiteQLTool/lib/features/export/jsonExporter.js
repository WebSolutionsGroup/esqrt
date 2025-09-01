/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - JSON Exporter
 * 
 * This module handles JSON export functionality including
 * generating JSON format from query results and providing
 * download capabilities.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the JSON response generation JavaScript
     * 
     * @returns {string} JavaScript code for JSON response generation
     */
    function getResponseGenerateJSONJS() {
        return `
            function responseGenerateJSON() {
                if (!queryResponsePayload || !queryResponsePayload.records || queryResponsePayload.records.length === 0) {
                    document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = '<p style="padding: 20px; color: var(--codeoss-text-secondary);">No data to display in JSON format.</p>';
                    return;
                }
                
                const records = queryResponsePayload.records;
                
                // Create formatted JSON with metadata
                const jsonData = {
                    metadata: {
                        tool: 'Enhanced SuiteQL Query Tool',
                        version: '${constants.CONFIG.VERSION}',
                        exportDate: new Date().toISOString(),
                        recordCount: records.length,
                        elapsedTime: queryResponsePayload.elapsedTime || null,
                        totalRecordCount: queryResponsePayload.totalRecordCount || null
                    },
                    records: records
                };
                
                const jsonContent = JSON.stringify(jsonData, null, 2);
                
                // Display in a clean textarea
                const jsonDisplay = \`
                    <div style="padding: 0;">
                        <textarea id="${constants.ELEMENT_IDS.RESPONSE_DATA}" readonly style="width: 100%; height: 400px; font-family: monospace; font-size: 11px; background-color: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border: 1px solid var(--codeoss-border); padding: 8px; resize: vertical; margin: 0;">\${jsonContent}</textarea>
                        <div style="margin-top: 8px; font-size: 10px; color: var(--codeoss-text-secondary); padding: 0 8px;">
                            Size: \${formatBytes(new Blob([jsonContent]).size)} |
                            Lines: \${jsonContent.split('\\n').length}
                        </div>
                    </div>
                \`;

                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = jsonDisplay;
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'block';

                // Hide CSV export buttons, show copy button
                document.getElementById('downloadCSVBtn').style.display = 'none';
                document.getElementById('copyCSVBtn').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN}').style.display = 'inline-block';
            }
        `;
    }
    
    /**
     * Generate the JSON download JavaScript
     * 
     * @returns {string} JavaScript code for JSON download
     */
    function getDownloadJSONJS() {
        return `
            function downloadJSON() {
                const jsonContent = document.getElementById('${constants.ELEMENT_IDS.RESPONSE_DATA}').value;
                if (!jsonContent) {
                    alert('No JSON data to download.');
                    return;
                }
                
                const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
                const link = document.createElement('a');
                
                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    
                    // Generate filename with timestamp
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                    const filename = 'suiteql-results-' + timestamp + '.json';
                    link.setAttribute('download', filename);
                    
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    // Fallback for older browsers
                    window.open('data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent));
                }
            }
        `;
    }
    
    /**
     * Generate the JSON clipboard copy JavaScript
     * 
     * @returns {string} JavaScript code for copying JSON to clipboard
     */
    function getCopyJSONToClipboardJS() {
        return `
            function copyJSONToClipboard() {
                const jsonTextarea = document.getElementById('${constants.ELEMENT_IDS.RESPONSE_DATA}');
                if (!jsonTextarea) {
                    alert('No JSON data to copy.');
                    return;
                }
                
                try {
                    jsonTextarea.select();
                    jsonTextarea.setSelectionRange(0, 99999); // For mobile devices
                    
                    const successful = document.execCommand('copy');
                    if (successful) {
                        // Show temporary success message
                        const successMsg = document.createElement('div');
                        successMsg.style.cssText = 'color: var(--codeoss-success); font-size: 11px; margin-top: 4px;';
                        successMsg.textContent = '✓ JSON data copied to clipboard';
                        jsonTextarea.parentNode.appendChild(successMsg);
                        
                        setTimeout(() => {
                            if (successMsg.parentNode) {
                                successMsg.parentNode.removeChild(successMsg);
                            }
                        }, 3000);
                    } else {
                        throw new Error('Copy command failed');
                    }
                } catch (err) {
                    // Fallback for modern browsers
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(jsonTextarea.value).then(() => {
                            alert('JSON data copied to clipboard');
                        }).catch(() => {
                            alert('Failed to copy JSON data to clipboard');
                        });
                    } else {
                        alert('Copy to clipboard not supported. Please select and copy manually.');
                    }
                }
            }
        `;
    }
    
    /**
     * Generate the JSON formatting JavaScript
     * 
     * @returns {string} JavaScript code for JSON formatting
     */
    function getFormatJSONJS() {
        return `
            function formatJSON() {
                const jsonTextarea = document.getElementById('${constants.ELEMENT_IDS.RESPONSE_DATA}');
                if (!jsonTextarea) return;
                
                try {
                    const jsonData = JSON.parse(jsonTextarea.value);
                    const formatted = JSON.stringify(jsonData, null, 2);
                    jsonTextarea.value = formatted;
                    
                    // Update size info
                    const sizeInfo = jsonTextarea.parentNode.querySelector('div:last-child');
                    if (sizeInfo) {
                        sizeInfo.innerHTML = \`
                            Size: \${formatBytes(new Blob([formatted]).size)} |
                            Lines: \${formatted.split('\\n').length}
                        \`;
                    }
                } catch (e) {
                    alert('Invalid JSON format: ' + e.message);
                }
            }
        `;
    }
    
    /**
     * Generate the JSON validation JavaScript
     * 
     * @returns {string} JavaScript code for JSON validation
     */
    function getValidateJSONDataJS() {
        return `
            function validateJSONData(records) {
                if (!records || !Array.isArray(records)) {
                    return { valid: false, message: 'Invalid data format for JSON export' };
                }
                
                if (records.length === 0) {
                    return { valid: false, message: 'No records to export to JSON' };
                }
                
                // Check if data can be serialized to JSON
                try {
                    JSON.stringify(records);
                    return { valid: true, message: 'JSON data is valid' };
                } catch (e) {
                    return { valid: false, message: 'Data contains non-serializable values: ' + e.message };
                }
            }
        `;
    }
    
    /**
     * Generate the JSON minify JavaScript
     * 
     * @returns {string} JavaScript code for JSON minification
     */
    function getMinifyJSONJS() {
        return `
            function minifyJSON() {
                const jsonTextarea = document.getElementById('${constants.ELEMENT_IDS.RESPONSE_DATA}');
                if (!jsonTextarea) return;
                
                try {
                    const jsonData = JSON.parse(jsonTextarea.value);
                    const minified = JSON.stringify(jsonData);
                    jsonTextarea.value = minified;
                    
                    // Update size info
                    const sizeInfo = jsonTextarea.parentNode.querySelector('div:last-child');
                    if (sizeInfo) {
                        sizeInfo.innerHTML = \`
                            Size: \${formatBytes(new Blob([minified]).size)} | 
                            Lines: \${minified.split('\\n').length} (minified)
                        \`;
                    }
                } catch (e) {
                    alert('Invalid JSON format: ' + e.message);
                }
            }
        `;
    }
    
    /**
     * Generate the file size formatting JavaScript
     * 
     * @returns {string} JavaScript code for file size formatting
     */
    function getFormatBytesJS() {
        return `
            function formatBytes(bytes, decimals = 2) {
                if (bytes === 0) return '0 Bytes';
                
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                
                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
            }
        `;
    }
    
    /**
     * Get all JSON export JavaScript functions
     * 
     * @returns {string} Complete JavaScript code for JSON export functionality
     */
    function getAllJSONExportJS() {
        return getFormatBytesJS() + '\n' +
               getResponseGenerateJSONJS() + '\n' +
               getDownloadJSONJS() + '\n' +
               getCopyJSONToClipboardJS() + '\n' +
               getFormatJSONJS() + '\n' +
               getValidateJSONDataJS() + '\n' +
               getMinifyJSONJS();
    }
    
    /**
     * Export the JSON export functions
     */
    return {
        getResponseGenerateJSONJS: getResponseGenerateJSONJS,
        getDownloadJSONJS: getDownloadJSONJS,
        getCopyJSONToClipboardJS: getCopyJSONToClipboardJS,
        getFormatJSONJS: getFormatJSONJS,
        getValidateJSONDataJS: getValidateJSONDataJS,
        getMinifyJSONJS: getMinifyJSONJS,
        getFormatBytesJS: getFormatBytesJS,
        getAllJSONExportJS: getAllJSONExportJS
    };
    
});
