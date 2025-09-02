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
            function responseGenerateCSV(customConfig) {
                if (!queryResponsePayload || !queryResponsePayload.records || queryResponsePayload.records.length === 0) {
                    document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = '<p style="padding: 20px; color: var(--codeoss-text-secondary);">No data to display in CSV format.</p>';
                    return;
                }

                // Get CSV configuration (use custom config if provided, otherwise load from storage)
                const config = customConfig || getCurrentCSVConfig();
                const records = queryResponsePayload.records;
                let csvContent = '';

                // Generate headers if enabled
                if (config.includeHeaders && records.length > 0) {
                    const headers = Object.keys(records[0]);
                    const headerRow = headers.map(header => {
                        // Use custom header name if defined, otherwise use original
                        const displayHeader = config.customHeaders[header] || header;
                        return escapeCsvValue(displayHeader, config);
                    });
                    csvContent += headerRow.join(config.delimiter) + config.lineEnding;
                }

                // Generate data rows
                if (records.length > 0) {
                    const headers = Object.keys(records[0]);
                    records.forEach(record => {
                        const row = headers.map(header => {
                            let value = record[header];
                            if (value === null || value === undefined) {
                                value = config.nullValue || '';
                            }
                            return escapeCsvValue(String(value), config);
                        });
                        csvContent += row.join(config.delimiter) + config.lineEnding;
                    });
                }

                // Store the generated content for download
                window.currentCSVContent = csvContent;
                window.currentCSVConfig = config;

                // Display in a clean textarea with configuration info
                const configInfo = \`Delimiter: \${config.delimiter === '\\t' ? 'Tab' : config.delimiter} | Quote: \${config.quoteChar || 'None'} | Encoding: \${config.encoding}\`;
                const csvDisplay = \`
                    <div style="margin-bottom: 8px; font-size: 10px; color: var(--codeoss-text-secondary); padding: 0 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            \${configInfo} |
                            <button type="button" onclick="showCSVOptionsModal()" style="background: none; border: none; color: var(--codeoss-link); cursor: pointer; text-decoration: underline; font-size: 10px;">Configure Options</button>
                        </div>
                        <button type="button" onclick="copyCSVToClipboard()" style="background: var(--codeoss-btn-secondary-bg); color: var(--codeoss-btn-secondary-text); border: 1px solid var(--codeoss-border); border-radius: 3px; padding: 4px 8px; font-size: 10px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            📋 Copy to Clipboard
                        </button>
                    </div>
                    <textarea id="${constants.ELEMENT_IDS.RESPONSE_DATA}" readonly style="width: 100%; height: 380px; font-family: monospace; font-size: 11px; background-color: var(--codeoss-input-bg); color: var(--codeoss-text-primary); border: 1px solid var(--codeoss-border); padding: 8px; resize: vertical; margin: 0;">\${csvContent}</textarea>
                \`;

                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = csvDisplay;
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'block';

                // Show CSV export buttons in header
                const csvExportGroup = document.getElementById('csvExportGroup');
                if (csvExportGroup) {
                    csvExportGroup.style.display = 'flex';
                } else {
                    // Fallback for individual buttons
                    document.getElementById('downloadCSVBtn').style.display = 'inline-block';
                    document.getElementById('copyCSVBtn').style.display = 'inline-block';
                }
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
            function escapeCsvValue(value, config) {
                if (value === null || value === undefined) {
                    return config.nullValue || '';
                }

                let stringValue = String(value);

                // Apply whitespace trimming if configured
                if (config.trimWhitespace) {
                    stringValue = stringValue.trim();
                }

                // If no quote character is specified, use escape character for special chars
                if (!config.quoteChar) {
                    if (config.escapeChar) {
                        // Escape the escape character itself first
                        stringValue = stringValue.replace(new RegExp('\\\\' + config.escapeChar, 'g'), config.escapeChar + config.escapeChar);
                        // Escape delimiter
                        stringValue = stringValue.replace(new RegExp('\\\\' + config.delimiter, 'g'), config.escapeChar + config.delimiter);
                        // Escape newlines
                        stringValue = stringValue.replace(/\\n/g, config.escapeChar + 'n');
                        stringValue = stringValue.replace(/\\r/g, config.escapeChar + 'r');
                    }
                    return stringValue;
                }

                // Check if quoting is needed
                const needsQuoting = stringValue.includes(config.delimiter) ||
                                   stringValue.includes('\\n') ||
                                   stringValue.includes('\\r') ||
                                   stringValue.includes(config.quoteChar);

                if (needsQuoting) {
                    // Escape quote characters within the value
                    if (config.escapeChar === config.quoteChar) {
                        // Standard CSV: double the quote character
                        stringValue = stringValue.replace(new RegExp(config.quoteChar, 'g'), config.quoteChar + config.quoteChar);
                    } else if (config.escapeChar) {
                        // Use custom escape character
                        stringValue = stringValue.replace(new RegExp('\\\\' + config.escapeChar, 'g'), config.escapeChar + config.escapeChar);
                        stringValue = stringValue.replace(new RegExp(config.quoteChar, 'g'), config.escapeChar + config.quoteChar);
                    }

                    return config.quoteChar + stringValue + config.quoteChar;
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
                const csvContent = window.currentCSVContent || document.getElementById('${constants.ELEMENT_IDS.RESPONSE_DATA}').value;
                const config = window.currentCSVConfig || getCurrentCSVConfig();

                if (!csvContent) {
                    alert('No CSV data to download.');
                    return;
                }

                // Prepare content with encoding considerations
                let finalContent = csvContent;
                let mimeType = 'text/csv;charset=utf-8;';

                // Add BOM for UTF-8 if configured
                if (config.encoding === 'utf-8' && config.encodingBOM) {
                    finalContent = '\\uFEFF' + csvContent;
                } else if (config.encoding === 'utf-8-bom') {
                    finalContent = '\\uFEFF' + csvContent;
                    mimeType = 'text/csv;charset=utf-8;';
                } else if (config.encoding === 'utf-16le') {
                    mimeType = 'text/csv;charset=utf-16le;';
                } else if (config.encoding === 'ascii') {
                    mimeType = 'text/csv;charset=ascii;';
                } else if (config.encoding === 'iso-8859-1') {
                    mimeType = 'text/csv;charset=iso-8859-1;';
                }

                const blob = new Blob([finalContent], { type: mimeType });
                const link = document.createElement('a');

                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);

                    // Generate filename with timestamp and format info
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                    const delimiterName = config.delimiter === '\\t' ? 'tab' :
                                        config.delimiter === ';' ? 'semicolon' :
                                        config.delimiter === '|' ? 'pipe' : 'csv';
                    const filename = \`suiteql-results-\${timestamp}.\${delimiterName === 'csv' ? 'csv' : delimiterName + '.csv'}\`;
                    link.setAttribute('download', filename);

                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    // Fallback for older browsers
                    window.open('data:' + mimeType + ',' + encodeURIComponent(finalContent));
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
                        // console.warn('Inconsistent record structure detected at record', i);
                        // Don't fail, just warn - we'll handle missing fields
                    }
                }
                
                return { valid: true, message: 'CSV data is valid' };
            }

            function validateCSVExportCompatibility(config, records) {
                const result = {
                    valid: true,
                    warnings: [],
                    errors: [],
                    recommendations: []
                };

                // Check for encoding compatibility
                if (config.encoding === 'ascii') {
                    // Check if data contains non-ASCII characters
                    let hasNonAscii = false;
                    records.slice(0, 100).forEach(record => { // Sample first 100 records
                        Object.values(record).forEach(value => {
                            if (value && typeof value === 'string' && /[^\\x00-\\x7F]/.test(value)) {
                                hasNonAscii = true;
                            }
                        });
                    });

                    if (hasNonAscii) {
                        result.warnings.push('Data contains non-ASCII characters. Consider using UTF-8 encoding.');
                        result.recommendations.push('Switch to UTF-8 encoding for better compatibility');
                    }
                }

                // Check for delimiter conflicts in data
                let delimiterConflicts = 0;
                records.slice(0, 50).forEach(record => { // Sample first 50 records
                    Object.values(record).forEach(value => {
                        if (value && typeof value === 'string' && value.includes(config.delimiter)) {
                            delimiterConflicts++;
                        }
                    });
                });

                if (delimiterConflicts > 0) {
                    const percentage = Math.round((delimiterConflicts / (records.length * Object.keys(records[0] || {}).length)) * 100);
                    if (percentage > 10) {
                        result.warnings.push(\`\${percentage}% of fields contain the delimiter character. This may cause parsing issues.\`);
                        result.recommendations.push('Consider using a different delimiter or enabling quote enclosure');
                    }
                }

                // Check for quote character conflicts
                if (config.quoteChar) {
                    let quoteConflicts = 0;
                    records.slice(0, 50).forEach(record => {
                        Object.values(record).forEach(value => {
                            if (value && typeof value === 'string' && value.includes(config.quoteChar)) {
                                quoteConflicts++;
                            }
                        });
                    });

                    if (quoteConflicts > 0 && config.escapeChar !== config.quoteChar) {
                        result.warnings.push('Data contains quote characters but escape method is not set to quote doubling');
                        result.recommendations.push('Use quote doubling escape method for better compatibility');
                    }
                }

                // Check for newline characters in data
                let newlineCount = 0;
                records.slice(0, 50).forEach(record => {
                    Object.values(record).forEach(value => {
                        if (value && typeof value === 'string' && (value.includes('\\n') || value.includes('\\r'))) {
                            newlineCount++;
                        }
                    });
                });

                if (newlineCount > 0 && !config.quoteChar) {
                    result.warnings.push('Data contains newline characters but no quote enclosure is set');
                    result.recommendations.push('Enable quote enclosure to handle newlines properly');
                }

                // Check for very large fields
                let largeCellCount = 0;
                records.slice(0, 20).forEach(record => {
                    Object.values(record).forEach(value => {
                        if (value && typeof value === 'string' && value.length > 32767) {
                            largeCellCount++;
                        }
                    });
                });

                if (largeCellCount > 0) {
                    result.warnings.push('Some fields exceed 32,767 characters and may not be compatible with Excel');
                    result.recommendations.push('Consider truncating large fields or using a different export format');
                }

                // Performance recommendations
                if (records.length > 100000) {
                    result.recommendations.push('Large dataset detected. Consider exporting in smaller chunks for better performance');
                }

                // Excel-specific recommendations
                if (config.encoding === 'utf-8' && config.encodingBOM && config.delimiter === ',') {
                    result.recommendations.push('Configuration is optimized for Microsoft Excel compatibility');
                }

                return result;
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
     * Generate the CSV configuration management JavaScript
     *
     * @returns {string} JavaScript code for CSV configuration management
     */
    function getCSVConfigJS() {
        return `
            function getCurrentCSVConfig() {
                const defaultConfig = {
                    delimiter: ',',
                    quoteChar: '"',
                    escapeChar: '"',
                    lineEnding: '\\n',
                    includeHeaders: true,
                    encoding: 'utf-8',
                    encodingBOM: true,
                    customHeaders: {},
                    nullValue: '',
                    dateFormat: 'iso',
                    numberFormat: 'default',
                    trimWhitespace: false,
                    preset: 'standard'
                };

                try {
                    const saved = localStorage.getItem('suiteql-csv-config');
                    if (saved) {
                        const config = JSON.parse(saved);
                        // Merge with defaults to ensure all properties exist
                        return Object.assign({}, defaultConfig, config);
                    }
                } catch (e) {
                    // console.warn('Could not load CSV config from localStorage:', e);
                }
                return defaultConfig;
            }

            function saveCSVConfig(config) {
                try {
                    localStorage.setItem('suiteql-csv-config', JSON.stringify(config));
                } catch (e) {
                    // console.warn('Could not save CSV config to localStorage:', e);
                }
            }

            function applyCSVPreset(presetName) {
                const presets = {
                    standard: {
                        name: 'Standard CSV',
                        description: 'RFC 4180 compliant CSV format',
                        config: {
                            delimiter: ',',
                            quoteChar: '"',
                            escapeChar: '"',
                            lineEnding: '\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: false
                        }
                    },
                    excel: {
                        name: 'Excel Compatible',
                        description: 'CSV format optimized for Microsoft Excel',
                        config: {
                            delimiter: ',',
                            quoteChar: '"',
                            escapeChar: '"',
                            lineEnding: '\\r\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: true
                        }
                    },
                    tab: {
                        name: 'Tab Delimited',
                        description: 'Tab-separated values format',
                        config: {
                            delimiter: '\\t',
                            quoteChar: '"',
                            escapeChar: '"',
                            lineEnding: '\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: false
                        }
                    },
                    semicolon: {
                        name: 'Semicolon Delimited',
                        description: 'European CSV format using semicolons',
                        config: {
                            delimiter: ';',
                            quoteChar: '"',
                            escapeChar: '"',
                            lineEnding: '\\r\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: true
                        }
                    },
                    pipe: {
                        name: 'Pipe Delimited',
                        description: 'Pipe-separated values format',
                        config: {
                            delimiter: '|',
                            quoteChar: '"',
                            escapeChar: '"',
                            lineEnding: '\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: false
                        }
                    }
                };

                if (!presets[presetName]) {
                    throw new Error('Unknown preset: ' + presetName);
                }

                const defaultConfig = getCurrentCSVConfig();
                const config = Object.assign({}, defaultConfig, presets[presetName].config);
                config.preset = presetName;
                saveCSVConfig(config);
                return config;
            }

            // Make CSV functions globally available
            window.applyCSVPreset = applyCSVPreset;
            window.getCurrentCSVConfig = getCurrentCSVConfig;
            window.saveCSVConfig = saveCSVConfig;

            function validateCSVConfig(config) {
                const result = {
                    valid: true,
                    warnings: [],
                    errors: []
                };

                // Validate delimiter
                if (!config.delimiter || config.delimiter.length === 0) {
                    result.errors.push('Delimiter cannot be empty');
                    result.valid = false;
                } else if (config.delimiter.length > 1 && config.delimiter !== '\\t') {
                    result.warnings.push('Multi-character delimiters may not be compatible with all CSV parsers');
                }

                // Check for delimiter conflicts
                if (config.delimiter === config.quoteChar && config.quoteChar !== '') {
                    result.errors.push('Delimiter and quote character cannot be the same');
                    result.valid = false;
                }

                // Validate quote character
                if (config.quoteChar && config.quoteChar.length > 1) {
                    result.warnings.push('Multi-character quote characters may not be compatible with all CSV parsers');
                }

                // Check for newlines in delimiter or quote char
                if (config.delimiter.includes('\\n') || config.delimiter.includes('\\r')) {
                    result.errors.push('Delimiter cannot contain newline characters');
                    result.valid = false;
                }

                if (config.quoteChar && (config.quoteChar.includes('\\n') || config.quoteChar.includes('\\r'))) {
                    result.errors.push('Quote character cannot contain newline characters');
                    result.valid = false;
                }

                return result;
            }

            // Note: showCSVOptionsModal is defined in csvOptionsModal.js
            // This function is for the preset menu only

            // Note: createCSVOptionsModal is defined in csvOptionsModal.js
            // This duplicate function has been removed to prevent conflicts

            // Note: showCSVPresetMenu is defined in csvOptionsModal.js
            // This duplicate function has been removed to prevent conflicts

            // Note: closeCSVPresetMenu is defined in csvOptionsModal.js

            function applyCSVPresetQuick(presetName) {
                const config = applyCSVPreset(presetName);

                // Regenerate CSV with new preset if data is available
                if (queryResponsePayload && queryResponsePayload.records) {
                    responseGenerateCSV(config);

                    // Show notification
                    const notification = document.createElement('div');
                    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 12px 16px; border-radius: 4px; z-index: 10000; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
                    notification.textContent = \`Applied \${presetName} preset\`;
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 3000);
                }
            }

            function closeCSVOptionsModal() {
                const modal = document.getElementById('csvOptionsModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }

            function setupCSVModalEventListeners() {
                // Add change listeners for real-time preview
                const fields = ['csvDelimiter', 'csvQuoteChar', 'csvLineEnding', 'csvIncludeHeaders', 'csvEncoding', 'csvEncodingBOM'];
                fields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.addEventListener('change', updateCSVPreviewInModal);
                    }
                });

                // Initial preview update
                setTimeout(updateCSVPreviewInModal, 100);
            }

            function updateCSVPreviewInModal() {
                if (!queryResponsePayload || !queryResponsePayload.records || queryResponsePayload.records.length === 0) {
                    const preview = document.getElementById('csvPreview');
                    if (preview) {
                        preview.value = 'No data available for preview';
                    }
                    return;
                }

                const config = getCurrentConfigFromModalForm();
                const records = queryResponsePayload.records.slice(0, 3); // First 3 rows for preview
                let preview = '';

                if (config.includeHeaders && records.length > 0) {
                    const headers = Object.keys(records[0]);
                    const headerRow = headers.map(header => escapeCsvValue(header, config));
                    preview += headerRow.join(config.delimiter) + config.lineEnding;
                }

                records.forEach(record => {
                    const headers = Object.keys(record);
                    const row = headers.map(header => {
                        let value = record[header];
                        if (value === null || value === undefined) {
                            value = config.nullValue || '';
                        }
                        return escapeCsvValue(String(value), config);
                    });
                    preview += row.join(config.delimiter) + config.lineEnding;
                });

                if (queryResponsePayload.records.length > 3) {
                    preview += '... (' + (queryResponsePayload.records.length - 3) + ' more rows)';
                }

                const previewElement = document.getElementById('csvPreview');
                if (previewElement) {
                    previewElement.value = preview;
                }
            }

            function getCurrentConfigFromModalForm() {
                const delimiterSelect = document.getElementById('csvDelimiter');
                const quoteSelect = document.getElementById('csvQuoteChar');
                const lineEndingSelect = document.getElementById('csvLineEnding');
                const includeHeadersCheck = document.getElementById('csvIncludeHeaders');
                const encodingSelect = document.getElementById('csvEncoding');
                const encodingBOMCheck = document.getElementById('csvEncodingBOM');

                return {
                    delimiter: delimiterSelect ? delimiterSelect.value : ',',
                    quoteChar: quoteSelect ? quoteSelect.value : '"',
                    escapeChar: quoteSelect ? quoteSelect.value : '"', // Use same as quote char for doubling
                    lineEnding: lineEndingSelect ? lineEndingSelect.value : '\\n',
                    includeHeaders: includeHeadersCheck ? includeHeadersCheck.checked : true,
                    encoding: encodingSelect ? encodingSelect.value : 'utf-8',
                    encodingBOM: encodingBOMCheck ? encodingBOMCheck.checked : false,
                    nullValue: '',
                    trimWhitespace: false,
                    customHeaders: {}
                };
            }

            function applyCSVPresetInModal(presetName) {
                const config = applyCSVPreset(presetName);

                // Update form fields
                const delimiterSelect = document.getElementById('csvDelimiter');
                if (delimiterSelect) {
                    delimiterSelect.value = config.delimiter;
                }

                const quoteSelect = document.getElementById('csvQuoteChar');
                if (quoteSelect) {
                    quoteSelect.value = config.quoteChar;
                }

                const lineEndingSelect = document.getElementById('csvLineEnding');
                if (lineEndingSelect) {
                    lineEndingSelect.value = config.lineEnding;
                }

                const includeHeadersCheck = document.getElementById('csvIncludeHeaders');
                if (includeHeadersCheck) {
                    includeHeadersCheck.checked = config.includeHeaders;
                }

                const encodingSelect = document.getElementById('csvEncoding');
                if (encodingSelect) {
                    encodingSelect.value = config.encoding;
                }

                const encodingBOMCheck = document.getElementById('csvEncodingBOM');
                if (encodingBOMCheck) {
                    encodingBOMCheck.checked = config.encodingBOM;
                }

                // Update preview
                updateCSVPreviewInModal();
            }

            function applyCSVOptions() {
                const config = getCurrentConfigFromModalForm();

                // Save configuration
                saveCSVConfig(config);

                // Close modal
                closeCSVOptionsModal();

                // Regenerate CSV with new settings
                responseGenerateCSV(config);

                // Show notification
                const notification = document.createElement('div');
                notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 12px 16px; border-radius: 4px; z-index: 10000; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
                notification.textContent = 'CSV options applied successfully';
                document.body.appendChild(notification);

                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);
            }

            function resetCSVOptionsToDefault() {
                const defaultConfig = {
                    delimiter: ',',
                    quoteChar: '"',
                    escapeChar: '"',
                    lineEnding: '\\n',
                    includeHeaders: true,
                    encoding: 'utf-8',
                    encodingBOM: true,
                    customHeaders: {},
                    nullValue: '',
                    dateFormat: 'iso',
                    numberFormat: 'default',
                    trimWhitespace: false,
                    preset: 'standard'
                };
                saveCSVConfig(defaultConfig);

                // Update form fields
                applyCSVPresetInModal('standard');
            }

            // Simple test function to verify JavaScript is working
            function testCSVFunction() {
                alert('CSV function test - this works!');
            }

            // Make sure all modal functions are globally available
            // Note: The main showCSVOptionsModal function is defined in csvOptionsModal.js
            // These are fallbacks and additional functions
            if (typeof window.showCSVOptionsModal !== 'undefined') {
                window.openCSVOptionsModal = window.showCSVOptionsModal;  // Fallback for old name
            }

            if (typeof window.showCSVPresetMenu !== 'undefined') {
                // Preset menu functions are available
            }

            // Test function to verify CSV functions are loaded
            window.testCSVFunctions = function() {
                // console.log('CSV Functions Test:');
                // console.log('showCSVOptionsModal:', typeof window.showCSVOptionsModal);
                // console.log('showCSVPresetMenu:', typeof window.showCSVPresetMenu);
                // console.log('applyCSVPreset:', typeof window.applyCSVPreset);
                // console.log('getCurrentCSVConfig:', typeof window.getCurrentCSVConfig);
                return 'CSV functions test complete - check console';
            };




            function applyCSVPreset(presetName) {
                // console.log('Applying preset:', presetName);

                let config;
                switch(presetName) {
                    case 'standard':
                        config = {
                            delimiter: ',',
                            quoteChar: '"',
                            lineEnding: '\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: false
                        };
                        break;
                    case 'excel':
                        config = {
                            delimiter: ',',
                            quoteChar: '"',
                            lineEnding: '\\r\\n',
                            includeHeaders: true,
                            encoding: 'utf-8-bom',
                            encodingBOM: true
                        };
                        break;
                    case 'tab':
                        config = {
                            delimiter: '\\t',
                            quoteChar: '"',
                            lineEnding: '\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: false
                        };
                        break;
                    case 'semicolon':
                        config = {
                            delimiter: ';',
                            quoteChar: '"',
                            lineEnding: '\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: false
                        };
                        break;
                    case 'pipe':
                        config = {
                            delimiter: '|',
                            quoteChar: '"',
                            lineEnding: '\\n',
                            includeHeaders: true,
                            encoding: 'utf-8',
                            encodingBOM: false
                        };
                        break;
                    default:
                        return;
                }

                // Update form fields
                const delimiterSelect = document.getElementById('csvDelimiterSelect');
                const quoteSelect = document.getElementById('csvQuoteSelect');
                const lineEndingSelect = document.getElementById('csvLineEndingSelect');
                const includeHeadersCheck = document.getElementById('csvIncludeHeadersCheck');
                const encodingSelect = document.getElementById('csvEncodingSelect');
                const bomCheck = document.getElementById('csvBOMCheck');

                if (delimiterSelect) delimiterSelect.value = config.delimiter;
                if (quoteSelect) quoteSelect.value = config.quoteChar;
                if (lineEndingSelect) lineEndingSelect.value = config.lineEnding;
                if (includeHeadersCheck) includeHeadersCheck.checked = config.includeHeaders;
                if (encodingSelect) encodingSelect.value = config.encoding;
                if (bomCheck) bomCheck.checked = config.encodingBOM;

                // Update preview
                updateCSVPreview();

                // Show notification
                showCSVNotification('Applied ' + presetName + ' preset', 'info');
            }

            // Note: copyCSVToClipboard is defined in getCopyCSVToClipboardJS() above
            // This duplicate function has been removed to prevent conflicts

            function getConfigFromModal() {
                const delimiterSelect = document.getElementById('csvDelimiterSelect');
                const quoteSelect = document.getElementById('csvQuoteSelect');
                const lineEndingSelect = document.getElementById('csvLineEndingSelect');
                const includeHeadersCheck = document.getElementById('csvIncludeHeadersCheck');
                const encodingSelect = document.getElementById('csvEncodingSelect');
                const bomCheck = document.getElementById('csvBOMCheck');

                return {
                    delimiter: delimiterSelect ? delimiterSelect.value : ',',
                    quoteChar: quoteSelect ? quoteSelect.value : '"',
                    escapeChar: quoteSelect ? quoteSelect.value : '"',
                    lineEnding: lineEndingSelect ? lineEndingSelect.value : '\\n',
                    includeHeaders: includeHeadersCheck ? includeHeadersCheck.checked : true,
                    encoding: encodingSelect ? encodingSelect.value : 'utf-8',
                    encodingBOM: bomCheck ? bomCheck.checked : false,
                    nullValue: '',
                    trimWhitespace: false,
                    customHeaders: {}
                };
            }

            function applyCSVSettings() {
                const config = getConfigFromModal();

                // Save configuration
                saveCSVConfig(config);

                // Close modal
                closeCSVOptionsModal();

                // Regenerate CSV with new settings
                if (queryResponsePayload && queryResponsePayload.records) {
                    responseGenerateCSV(config);
                }

                // Show success notification
                showCSVNotification('CSV settings applied successfully!', 'success');
            }

            function resetCSVToDefaults() {
                const defaultConfig = {
                    delimiter: ',',
                    quoteChar: '"',
                    escapeChar: '"',
                    lineEnding: '\\n',
                    includeHeaders: true,
                    encoding: 'utf-8',
                    encodingBOM: true,
                    customHeaders: {},
                    nullValue: '',
                    trimWhitespace: false,
                    preset: 'standard'
                };

                saveCSVConfig(defaultConfig);
                loadCurrentCSVSettings();
                updateCSVPreview();
                showCSVNotification('Settings reset to defaults', 'info');
            }

            function showCSVNotification(message, type) {
                const notification = document.createElement('div');
                const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
                notification.style.cssText = \`position: fixed; top: 20px; right: 20px; background: \${bgColor}; color: white; padding: 12px 16px; border-radius: 4px; z-index: 10001; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);\`;
                notification.textContent = message;
                document.body.appendChild(notification);

                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);
            }
        `;
    }

    /**
     * Get all CSV export JavaScript functions
     *
     * @returns {string} Complete JavaScript code for CSV export functionality
     */
    function getAllCSVExportJS() {
        return getCSVConfigJS() + '\n' +
               getEscapeCSVValueJS() + '\n' +
               getResponseGenerateCSVJS() + '\n' +
               getDownloadCSVJS() + '\n' +
               getCopyCSVToClipboardJS() + '\n' +
               getValidateCSVDataJS() + '\n' +
               getCSVPreviewJS() + '\n' +
               '';
    }




    /**
     * Get CSV export functions including modal support
     *
     * @returns {Object} CSV export functions with modal support
     */
    function getCSVExportWithModal() {
        return {
            javascript: getAllCSVExportJS(),
            html: ''
        };
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
        getCSVConfigJS: getCSVConfigJS,
        getAllCSVExportJS: getAllCSVExportJS,
        getCSVExportWithModal: getCSVExportWithModal
    };
    
});
