/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Simple CSV Modal System
 * 
 * Clean, working CSV modal implementation
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([], function() {
    
    /**
     * Generate simple CSV options modal HTML
     * 
     * @returns {string} HTML for the CSV options modal
     */
    function getCSVOptionsModalHTML() {
        return `
            <!-- CSV Options Modal - Simple Working Version -->
            <div id="csvOptionsModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;">
                <div style="position: relative; margin: 50px auto; width: 600px; max-width: 90%; background: #2d2d30; border: 1px solid #3e3e42; border-radius: 6px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                    <h3 style="margin: 0 0 20px 0; color: #cccccc;">CSV Export Options</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; color: #cccccc;">Delimiter:</label>
                            <select id="csvDelimiter" style="width: 100%; padding: 5px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42;">
                                <option value=",">Comma (,)</option>
                                <option value=";">Semicolon (;)</option>
                                <option value="	">Tab</option>
                                <option value="|">Pipe (|)</option>
                                <option value=" ">Space ( )</option>
                            </select>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 5px; color: #cccccc;">Quote Character:</label>
                            <select id="csvQuoteChar" style="width: 100%; padding: 5px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42;">
                                <option value='"'>Double Quote (")</option>
                                <option value="'">Single Quote (')</option>
                                <option value="">None</option>
                            </select>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 5px; color: #cccccc;">Line Ending:</label>
                            <select id="csvLineEnding" style="width: 100%; padding: 5px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42;">
                                <option value="
">LF (Unix)</option>
                                <option value="
">CRLF (Windows)</option>
                            </select>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 5px; color: #cccccc;">Encoding:</label>
                            <select id="csvEncoding" style="width: 100%; padding: 5px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42;">
                                <option value="utf-8">UTF-8</option>
                                <option value="utf-16">UTF-16</option>
                                <option value="windows-1252">Western (Windows 1252)</option>
                                <option value="iso-8859-1">Western (ISO-8859-1)</option>
                                <option value="gb18030">Chinese Simplified (GB18030)</option>
                                <option value="gbk">Chinese Simplified (GBK)</option>
                                <option value="big5">Traditional Chinese (Big5)</option>
                                <option value="shift-jis">Japanese (Shift-JIS)</option>
                                <option value="iso-2022-kr">Korean (ISO-2022-KR)</option>
                                <option value="euc-kr">Korean (EUC-KR)</option>
                                <option value="macroman">Western (Mac Roman)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; color: #cccccc;">
                            <input type="checkbox" id="csvIncludeHeaders" checked style="margin-right: 8px;">
                            Include Headers
                        </label>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" onclick="closeCSVOptionsModal()" style="padding: 8px 16px; background: #5a5a5a; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px; cursor: pointer;">Cancel</button>
                        <button type="button" onclick="applyCSVOptions()" style="padding: 8px 16px; background: #0e639c; color: #ffffff; border: 1px solid #0e639c; border-radius: 3px; cursor: pointer;">Apply</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate simple CSV modal JavaScript
     *
     * @returns {string} JavaScript code for CSV modal functionality
     */
    function getCSVOptionsModalJS() {
        return `
            // Simple CSV Modal Functions - Clean Implementation
            function showCSVOptionsModal() {
                console.log('Opening CSV Options Modal');
                
                // Load current config and populate form
                const config = getCurrentCSVConfig();
                
                // Populate form fields
                document.getElementById('csvDelimiter').value = config.delimiter;
                document.getElementById('csvQuoteChar').value = config.quoteChar;
                document.getElementById('csvLineEnding').value = config.lineEnding;
                document.getElementById('csvEncoding').value = config.encoding;
                document.getElementById('csvIncludeHeaders').checked = config.includeHeaders;
                
                // Show modal
                document.getElementById('csvOptionsModal').style.display = 'block';
            }
            
            function closeCSVOptionsModal() {
                document.getElementById('csvOptionsModal').style.display = 'none';
            }
            
            function applyCSVOptions() {
                // Get form values
                const config = {
                    delimiter: document.getElementById('csvDelimiter').value,
                    quoteChar: document.getElementById('csvQuoteChar').value,
                    escapeChar: document.getElementById('csvQuoteChar').value, // Use quote char as escape
                    lineEnding: document.getElementById('csvLineEnding').value,
                    includeHeaders: document.getElementById('csvIncludeHeaders').checked,
                    encoding: document.getElementById('csvEncoding').value,
                    encodingBOM: false,
                    trimWhitespace: false,
                    nullValue: '',
                    preset: 'custom'
                };
                
                // Save configuration
                if (typeof saveCSVConfig === 'function') {
                    saveCSVConfig(config);
                } else {
                    console.warn('saveCSVConfig function not available');
                }

                // Close modal
                closeCSVOptionsModal();

                // Regenerate CSV with new settings
                if (typeof window.queryResponsePayload !== 'undefined' && window.queryResponsePayload && window.queryResponsePayload.records) {
                    if (typeof responseGenerateCSV === 'function') {
                        responseGenerateCSV();
                    } else {
                        console.error('responseGenerateCSV function not available');
                        alert('Unable to regenerate CSV. Please run a query first.');
                    }
                } else {
                    console.warn('No query data available to regenerate CSV');
                    alert('No query results available. Please run a query first.');
                }

                // Show success message
                console.log('CSV options applied successfully');
            }
            
            function showCSVPresetMenu() {
                // Simple preset menu
                const presets = [
                    { key: 'standard', name: 'Standard CSV' },
                    { key: 'excel', name: 'Excel Compatible' },
                    { key: 'tab', name: 'Tab Delimited' },
                    { key: 'semicolon', name: 'Semicolon Delimited' },
                    { key: 'pipe', name: 'Pipe Delimited' }
                ];
                
                let menuHTML = '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2d2d30; border: 1px solid #3e3e42; border-radius: 6px; padding: 16px; z-index: 10001; box-shadow: 0 4px 12px rgba(0,0,0,0.5); min-width: 300px;">';
                menuHTML += '<h4 style="margin: 0 0 12px 0; color: #cccccc;">Quick CSV Presets</h4>';

                presets.forEach(preset => {
                    menuHTML += \`<button type="button" onclick="applyCSVPresetQuick('\${preset.key}'); closeCSVPresetMenu();" style="display: block; width: 100%; text-align: left; padding: 8px 12px; margin-bottom: 4px; border: 1px solid #3e3e42; background: #3c3c3c; color: #cccccc; border-radius: 3px; cursor: pointer;">\${preset.name}</button>\`;
                });

                menuHTML += '<button type="button" onclick="showCSVOptionsModal(); closeCSVPresetMenu();" style="width: 100%; padding: 6px 12px; margin-top: 8px; border: 1px solid #0e639c; background: #0e639c; color: #ffffff; border-radius: 3px; cursor: pointer;">Advanced Options...</button>';
                menuHTML += '<button type="button" onclick="closeCSVPresetMenu();" style="width: 100%; padding: 6px 12px; margin-top: 4px; border: 1px solid #3e3e42; background: #5a5a5a; color: #cccccc; border-radius: 3px; cursor: pointer;">Cancel</button>';
                menuHTML += '</div>';
                
                const menu = document.createElement('div');
                menu.id = 'csvPresetMenu';
                menu.innerHTML = menuHTML;
                document.body.appendChild(menu);
            }
            
            function closeCSVPresetMenu() {
                const menu = document.getElementById('csvPresetMenu');
                if (menu) {
                    menu.remove();
                }
            }
            
            function applyCSVPresetQuick(presetKey) {
                const presets = {
                    standard: { delimiter: ',', quoteChar: '"', lineEnding: '\\n', encoding: 'utf-8', includeHeaders: true },
                    excel: { delimiter: ',', quoteChar: '"', lineEnding: '\\r\\n', encoding: 'utf-8', includeHeaders: true },
                    tab: { delimiter: '\\t', quoteChar: '"', lineEnding: '\\n', encoding: 'utf-8', includeHeaders: true },
                    semicolon: { delimiter: ';', quoteChar: '"', lineEnding: '\\r\\n', encoding: 'utf-8', includeHeaders: true },
                    pipe: { delimiter: '|', quoteChar: '"', lineEnding: '\\n', encoding: 'utf-8', includeHeaders: true }
                };
                
                const config = presets[presetKey];
                if (config) {
                    config.escapeChar = config.quoteChar;
                    config.encodingBOM = false;
                    config.trimWhitespace = false;
                    config.nullValue = '';
                    config.preset = presetKey;

                    // Save configuration
                    if (typeof saveCSVConfig === 'function') {
                        saveCSVConfig(config);
                    } else {
                        console.warn('saveCSVConfig function not available');
                    }

                    // Regenerate CSV with new preset
                    if (typeof window.queryResponsePayload !== 'undefined' && window.queryResponsePayload && window.queryResponsePayload.records) {
                        if (typeof responseGenerateCSV === 'function') {
                            responseGenerateCSV();
                        } else {
                            console.error('responseGenerateCSV function not available');
                        }
                    } else {
                        console.warn('No query data available for preset application');
                    }
                }
            }
            
            // Make functions globally available
            window.showCSVOptionsModal = showCSVOptionsModal;
            window.closeCSVOptionsModal = closeCSVOptionsModal;
            window.applyCSVOptions = applyCSVOptions;
            window.showCSVPresetMenu = showCSVPresetMenu;
            window.closeCSVPresetMenu = closeCSVPresetMenu;
            window.applyCSVPresetQuick = applyCSVPresetQuick;
        `;
    }

    /**
     * Export the CSV modal functions
     */
    return {
        getCSVOptionsModalHTML: getCSVOptionsModalHTML,
        getCSVOptionsModalJS: getCSVOptionsModalJS
    };
    
});
