/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - CSV Exporter
 * 
 * This module handles CSV export functionality including
 * generating CSV format from query results and providing
 * download capabilities.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the CSV response generation JavaScript
     * 
     * @returns {string} JavaScript code for CSV response generation
     */
    function getResponseGenerateCSVJS() {
        return `
            function responseGenerateCSV() {
                if (!queryResponsePayload || !queryResponsePayload.records || queryResponsePayload.records.length === 0) {
                    document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = '<p style="padding: 20px; color: var(--codeoss-text-secondary);">No data to display in CSV format.</p>';
                    return;
                }
                
                const records = queryResponsePayload.records;
                let csvContent = '';
                
                // Generate headers
                if (records.length > 0) {
                    const headers = Object.keys(records[0]);
                    csvContent += headers.map(header => escapeCsvValue(header)).join(',') + '\\n';
                    
                    // Generate data rows
                    records.forEach(record => {
                        const row = headers.map(header => {
                            let value = record[header];
                            if (value === null || value === undefined) {
                                value = '';
                            }
                            return escapeCsvValue(String(value));
                        });
                        csvContent += row.join(',') + '\\n';
                    });
                }
                
                // Display in a clean textarea without export buttons
                const csvDisplay = \`
                    <textarea id="${constants.ELEMENT_IDS.RESPONSE_DATA}" readonly style="width: 100%; height: 400px; font-family: monospace; font-size: 11px; background-color: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border: 1px solid var(--codeoss-border); padding: 8px; resize: vertical; margin: 0;">\${csvContent}</textarea>
                \`;

                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = csvDisplay;
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'block';

                // Show CSV export buttons in header
                document.getElementById('downloadCSVBtn').style.display = 'inline-block';
                document.getElementById('copyCSVBtn').style.display = 'inline-block';
                document.getElementById('${constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN}').style.display = 'none';
            }
        `;
    }
    
    /**
     * Generate the CSV value escaping JavaScript
     * 
     * @returns {string} JavaScript code for CSV value escaping
     */
    function getEscapeCSVValueJS() {
        return `
            function escapeCsvValue(value) {
                if (value === null || value === undefined) {
                    return '';
                }
                
                const stringValue = String(value);
                
                // If the value contains comma, newline, or quote, wrap in quotes and escape internal quotes
                if (stringValue.includes(',') || stringValue.includes('\\n') || stringValue.includes('"')) {
                    return '"' + stringValue.replace(/"/g, '""') + '"';
                }
                
                return stringValue;
            }
        `;
    }
    
    /**
     * Generate the CSV download JavaScript
     * 
     * @returns {string} JavaScript code for CSV download
     */
    function getDownloadCSVJS() {
        return `
            function downloadCSV() {
                const csvContent = document.getElementById('${constants.ELEMENT_IDS.RESPONSE_DATA}').value;
                if (!csvContent) {
                    alert('No CSV data to download.');
                    return;
                }
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                
                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    
                    // Generate filename with timestamp
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                    const filename = 'suiteql-results-' + timestamp + '.csv';
                    link.setAttribute('download', filename);
                    
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    // Fallback for older browsers
                    window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
                }
            }
        `;
    }
    
    /**
     * Generate the CSV clipboard copy JavaScript
     * 
     * @returns {string} JavaScript code for copying CSV to clipboard
     */
    function getCopyCSVToClipboardJS() {
        return `
            function copyCSVToClipboard() {
                const csvTextarea = document.getElementById('${constants.ELEMENT_IDS.RESPONSE_DATA}');
                if (!csvTextarea) {
                    alert('No CSV data to copy.');
                    return;
                }
                
                try {
                    csvTextarea.select();
                    csvTextarea.setSelectionRange(0, 99999); // For mobile devices
                    
                    const successful = document.execCommand('copy');
                    if (successful) {
                        // Show temporary success message
                        const originalText = csvTextarea.nextElementSibling ? csvTextarea.nextElementSibling.textContent : '';
                        const successMsg = document.createElement('div');
                        successMsg.style.cssText = 'color: var(--codeoss-success); font-size: 11px; margin-top: 4px;';
                        successMsg.textContent = '✓ CSV data copied to clipboard';
                        csvTextarea.parentNode.appendChild(successMsg);
                        
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
                        navigator.clipboard.writeText(csvTextarea.value).then(() => {
                            alert('CSV data copied to clipboard');
                        }).catch(() => {
                            alert('Failed to copy CSV data to clipboard');
                        });
                    } else {
                        alert('Copy to clipboard not supported. Please select and copy manually.');
                    }
                }
            }
        `;
    }
    
    /**
     * Generate the CSV validation JavaScript
     * 
     * @returns {string} JavaScript code for CSV validation
     */
    function getValidateCSVDataJS() {
        return `
            function validateCSVData(records) {
                if (!records || !Array.isArray(records)) {
                    return { valid: false, message: 'Invalid data format for CSV export' };
                }
                
                if (records.length === 0) {
                    return { valid: false, message: 'No records to export to CSV' };
                }
                
                // Check if all records have the same structure
                const firstRecordKeys = Object.keys(records[0]).sort();
                for (let i = 1; i < records.length; i++) {
                    const currentKeys = Object.keys(records[i]).sort();
                    if (JSON.stringify(firstRecordKeys) !== JSON.stringify(currentKeys)) {
                        console.warn('Inconsistent record structure detected at record', i);
                        // Don't fail, just warn - we'll handle missing fields
                    }
                }
                
                return { valid: true, message: 'CSV data is valid' };
            }
        `;
    }
    
    /**
     * Generate the CSV preview JavaScript
     * 
     * @returns {string} JavaScript code for CSV preview
     */
    function getCSVPreviewJS() {
        return `
            function generateCSVPreview(records, maxRows = 5) {
                if (!records || records.length === 0) {
                    return 'No data available for preview';
                }
                
                const headers = Object.keys(records[0]);
                let preview = headers.map(header => escapeCsvValue(header)).join(',') + '\\n';
                
                const previewRows = Math.min(maxRows, records.length);
                for (let i = 0; i < previewRows; i++) {
                    const row = headers.map(header => {
                        let value = records[i][header];
                        if (value === null || value === undefined) {
                            value = '';
                        }
                        return escapeCsvValue(String(value));
                    });
                    preview += row.join(',') + '\\n';
                }
                
                if (records.length > maxRows) {
                    preview += '... (' + (records.length - maxRows) + ' more rows)\\n';
                }
                
                return preview;
            }
        `;
    }
    
    /**
     * Get all CSV export JavaScript functions
     * 
     * @returns {string} Complete JavaScript code for CSV export functionality
     */
    function getAllCSVExportJS() {
        return getEscapeCSVValueJS() + '\n' +
               getResponseGenerateCSVJS() + '\n' +
               getDownloadCSVJS() + '\n' +
               getCopyCSVToClipboardJS() + '\n' +
               getValidateCSVDataJS() + '\n' +
               getCSVPreviewJS();
    }
    
    /**
     * Export the CSV export functions
     */
    return {
        getResponseGenerateCSVJS: getResponseGenerateCSVJS,
        getEscapeCSVValueJS: getEscapeCSVValueJS,
        getDownloadCSVJS: getDownloadCSVJS,
        getCopyCSVToClipboardJS: getCopyCSVToClipboardJS,
        getValidateCSVDataJS: getValidateCSVDataJS,
        getCSVPreviewJS: getCSVPreviewJS,
        getAllCSVExportJS: getAllCSVExportJS
    };
    
});
