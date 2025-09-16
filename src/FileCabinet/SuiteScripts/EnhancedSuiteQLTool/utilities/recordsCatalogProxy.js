/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Records Catalog API Proxy - Provides server-side access to Records Catalog data
 * This Suitelet acts as a proxy to call the client-side Records Catalog API
 */

define(['N/ui/serverWidget', 'N/log'], function(serverWidget, log) {
    
    /**
     * Suitelet entry point
     */
    function onRequest(context) {
        if (context.request.method === 'GET') {
            handleGetRequest(context);
        } else if (context.request.method === 'POST') {
            handlePostRequest(context);
        }
    }
    
    /**
     * Handle GET request - serve the proxy page
     */
    function handleGetRequest(context) {
        const form = serverWidget.createForm({
            title: 'Records Catalog API Proxy'
        });
        
        // Add hidden field to store the result
        const resultField = form.addField({
            id: 'custpage_result',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Result'
        });
        resultField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        
        // No client script needed - all functionality is in the HTML
        
        // Add HTML content with the proxy functionality
        const htmlField = form.addField({
            id: 'custpage_html',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'HTML'
        });
        
        htmlField.defaultValue = `
            <div id="proxy-container" style="padding: 20px;">
                <h3>Records Catalog API Proxy</h3>
                <p>This page provides server-side access to NetSuite's Records Catalog API.</p>
                
                <div id="status" style="margin: 20px 0; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                    Ready to fetch record types...
                </div>
                
                <button type="button" id="fetch-records" onclick="fetchAllRecordTypes()"
                        style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Fetch All Record Types
                </button>

                <button type="button" id="fetch-fields" onclick="fetchFieldsForAllTables()"
                        style="margin-left: 10px; padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>
                    Fetch Fields & Joins
                </button>
                
                <div id="results" style="margin-top: 20px; max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
                    Results will appear here...
                </div>
                
                <script>
                    // Records Catalog API endpoints (same as Table Explorer)
                    var RECORDS_CATALOG_ENDPOINTS = {
                        GET_RECORD_TYPES: '/app/recordscatalog/rcendpoint.nl?action=getRecordTypes&data=',
                        GET_RECORD_TYPE_DETAIL: '/app/recordscatalog/rcendpoint.nl?action=getRecordTypeDetail&data='
                    };
                    
                    var allRecordTypes = null;
                    var allFieldData = {};
                    var exportProgress = {
                        totalTables: 0,
                        processedTables: 0,
                        errors: 0
                    };
                    
                    function updateStatus(message) {
                        document.getElementById('status').innerHTML = message;
                    }
                    
                    function updateResults(content) {
                        document.getElementById('results').innerHTML = content;
                    }
                    
                    function fetchAllRecordTypes() {
                        updateStatus('Fetching record types from Records Catalog API...');
                        
                        // Use the exact same API call as Table Explorer
                        const requestData = { structureType: 'FLAT' };
                        const url = RECORDS_CATALOG_ENDPOINTS.GET_RECORD_TYPES + encodeURI(JSON.stringify(requestData));
                        
                        console.log('Fetching record types with URL:', url);
                        
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', url, true);
                        
                        xhr.onload = function() {
                            if (xhr.status === 200) {
                                try {
                                    const response = JSON.parse(xhr.response);
                                    allRecordTypes = response.data || [];
                                    
                                    updateStatus('Successfully loaded ' + allRecordTypes.length + ' record types!');
                                    
                                    // Display summary
                                    const summary = generateSummary(allRecordTypes);
                                    updateResults(summary);
                                    
                                    // Store result for server-side access
                                    document.getElementById('custpage_result').value = JSON.stringify(allRecordTypes);
                                    
                                    // Enable field fetch and export buttons
                                    enableFieldFetchButton();
                                    showExportButton();
                                    
                                } catch (error) {
                                    updateStatus('Error parsing response: ' + error.message);
                                    console.error('Error parsing record types response:', error);
                                }
                            } else {
                                updateStatus('Failed to fetch record types. Status: ' + xhr.status);
                                console.error('Failed to fetch record types:', xhr.status, xhr.statusText);
                            }
                        };
                        
                        xhr.onerror = function() {
                            updateStatus('Network error occurred while fetching record types');
                        };
                        
                        xhr.send();
                    }
                    
                    function generateSummary(recordTypes) {
                        const categories = {};
                        const families = {};
                        let customCount = 0;
                        let systemCount = 0;
                        
                        recordTypes.forEach(record => {
                            // Count by origin
                            if (isCustomRecord(record)) {
                                customCount++;
                            } else {
                                systemCount++;
                            }
                            
                            // Count by family
                            const family = getRecordFamily(record);
                            families[family] = (families[family] || 0) + 1;
                        });
                        
                        let html = '<h4>Record Types Summary</h4>';
                        html += '<p><strong>Total Records:</strong> ' + recordTypes.length + '</p>';
                        html += '<p><strong>System Records:</strong> ' + systemCount + '</p>';
                        html += '<p><strong>Custom Records:</strong> ' + customCount + '</p>';
                        
                        html += '<h5>By Family:</h5><ul>';
                        Object.entries(families).sort((a, b) => b[1] - a[1]).forEach(([family, count]) => {
                            html += '<li>' + family + ': ' + count + '</li>';
                        });
                        html += '</ul>';
                        
                        return html;
                    }
                    
                    function isCustomRecord(record) {
                        return record.isCustom === true || 
                               (record.id && (record.id.startsWith('customrecord') || record.id.startsWith('customlist'))) ||
                               (record.scriptId && (record.scriptId.startsWith('customrecord') || record.scriptId.startsWith('customlist')));
                    }
                    
                    function getRecordFamily(record) {
                        if (record.family) return record.family;
                        if (record.recordFamily) return record.recordFamily;
                        if (isCustomRecord(record)) return 'CUSTOM';
                        return 'OTHER';
                    }
                    
                    function enableFieldFetchButton() {
                        document.getElementById('fetch-fields').disabled = false;
                    }

                    async function fetchFieldsForAllTables() {
                        if (!allRecordTypes) {
                            alert('Please fetch record types first!');
                            return;
                        }

                        updateStatus('Fetching field details for tables...');

                        // Limit to first 50 tables to avoid overwhelming the system
                        const tablesToProcess = allRecordTypes.slice(0, 50);
                        exportProgress.totalTables = tablesToProcess.length;
                        exportProgress.processedTables = 0;
                        exportProgress.errors = 0;

                        for (let i = 0; i < tablesToProcess.length; i++) {
                            const table = tablesToProcess[i];

                            try {
                                updateStatus('Processing ' + (i + 1) + '/' + tablesToProcess.length + ': ' + table.id);

                                const fieldData = await fetchTableDetail(table.id);
                                if (fieldData) {
                                    allFieldData[table.id] = fieldData;
                                }

                                exportProgress.processedTables++;

                                // Add small delay to avoid overwhelming the server
                                await new Promise(resolve => setTimeout(resolve, 200));

                            } catch (error) {
                                console.warn('Error processing', table.id, ':', error.message);
                                exportProgress.errors++;
                            }
                        }

                        updateStatus('Field processing complete! Processed: ' + exportProgress.processedTables + ', Errors: ' + exportProgress.errors);
                        showFieldExportButton();
                    }

                    function fetchTableDetail(tableId) {
                        return new Promise((resolve, reject) => {
                            const requestData = {
                                scriptId: tableId,
                                detailType: 'SS_ANAL'
                            };
                            const url = RECORDS_CATALOG_ENDPOINTS.GET_RECORD_TYPE_DETAIL + encodeURI(JSON.stringify(requestData));

                            const xhr = new XMLHttpRequest();
                            xhr.open('GET', url, true);

                            xhr.onload = function() {
                                if (xhr.status === 200) {
                                    try {
                                        const response = JSON.parse(xhr.response);
                                        resolve(response.data);
                                    } catch (error) {
                                        reject(error);
                                    }
                                } else {
                                    reject(new Error(`Status: ${xhr.status}`));
                                }
                            };

                            xhr.onerror = function() {
                                reject(new Error('Network error'));
                            };

                            xhr.timeout = 10000;
                            xhr.ontimeout = function() {
                                reject(new Error('Request timeout'));
                            };

                            xhr.send();
                        });
                    }

                    function showExportButton() {
                        const exportBtn = document.createElement('button');
                        exportBtn.innerHTML = 'Export Tables CSV';
                        exportBtn.style.cssText = 'margin-left: 10px; padding: 10px 20px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;';
                        exportBtn.onclick = function() {
                            exportToCSV();
                        };
                        document.getElementById('fetch-records').parentNode.appendChild(exportBtn);
                    }

                    function showFieldExportButton() {
                        const fieldExportBtn = document.createElement('button');
                        fieldExportBtn.innerHTML = 'Export Fields CSV';
                        fieldExportBtn.style.cssText = 'margin-left: 10px; padding: 10px 20px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer;';
                        fieldExportBtn.onclick = function() {
                            exportFieldsToCSV();
                        };
                        document.getElementById('fetch-records').parentNode.appendChild(fieldExportBtn);
                    }
                    
                    function exportToCSV() {
                        if (!allRecordTypes) {
                            alert('No data to export. Please fetch record types first.');
                            return;
                        }
                        
                        // Generate CSV content
                        const headers = ['ID', 'Label', 'Family', 'Origin', 'Is Custom', 'Script ID'];
                        const rows = [headers];
                        
                        allRecordTypes.forEach(record => {
                            rows.push([
                                escapeCSV(record.id || ''),
                                escapeCSV(record.label || ''),
                                escapeCSV(getRecordFamily(record)),
                                escapeCSV(record.origin || ''),
                                escapeCSV(isCustomRecord(record) ? 'Yes' : 'No'),
                                escapeCSV(record.scriptId || '')
                            ]);
                        });
                        
                        const csvContent = rows.map(row => row.join(',')).join('\\n');
                        
                        // Download CSV
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        
                        if (link.download !== undefined) {
                            const url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', 'netsuite_record_types_' + new Date().toISOString().slice(0,10) + '.csv');
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                    
                    function escapeCSV(value) {
                        if (!value) return '';
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\\n')) {
                            return '"' + stringValue.replace(/"/g, '""') + '"';
                        }
                        return stringValue;
                    }

                    function exportFieldsToCSV() {
                        if (!allFieldData || Object.keys(allFieldData).length === 0) {
                            alert('No field data available. Please fetch fields first.');
                            return;
                        }

                        // Generate fields CSV
                        const headers = [
                            'Table ID', 'Table Label', 'Field ID', 'Field Label', 'Field Type',
                            'Is Required', 'Is Read Only', 'Is Custom', 'Default Value', 'Help Text',
                            'Select Record Type', 'Max Length', 'Has Joins', 'Join Tables'
                        ];
                        const rows = [headers];

                        let totalFields = 0;

                        Object.keys(allFieldData).forEach(function(tableId) {
                            const tableDetail = allFieldData[tableId];
                            const table = allRecordTypes.find(function(t) { return t.id === tableId; });
                            const tableLabel = table ? table.label : tableId;

                            if (tableDetail && tableDetail.fields) {
                                tableDetail.fields.forEach(function(field) {
                                    const joinTables = field.joins ? field.joins.map(function(j) { return j.targetTable || j.target; }).join('; ') : '';

                                    rows.push([
                                        escapeCSV(tableId),
                                        escapeCSV(tableLabel),
                                        escapeCSV(field.id || field.name || ''),
                                        escapeCSV(field.label || field.displayName || ''),
                                        escapeCSV(field.type || ''),
                                        escapeCSV(field.isRequired ? 'Yes' : 'No'),
                                        escapeCSV(field.isReadOnly ? 'Yes' : 'No'),
                                        escapeCSV(field.isCustom ? 'Yes' : 'No'),
                                        escapeCSV(field.defaultValue || ''),
                                        escapeCSV(field.help || field.description || ''),
                                        escapeCSV(field.selectRecordType || ''),
                                        escapeCSV(field.maxLength || ''),
                                        escapeCSV(field.joins && field.joins.length > 0 ? 'Yes' : 'No'),
                                        escapeCSV(joinTables)
                                    ]);
                                    totalFields++;
                                });
                            }
                        });

                        const csvContent = rows.map(function(row) { return row.join(','); }).join('\\n');

                        // Download CSV
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');

                        if (link.download !== undefined) {
                            const url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', 'netsuite_fields_' + new Date().toISOString().slice(0,10) + '.csv');
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }

                        updateStatus('Fields CSV exported: ' + totalFields + ' fields from ' + Object.keys(allFieldData).length + ' tables');
                    }

                    // Auto-fetch on page load
                    window.addEventListener('load', function() {
                        setTimeout(fetchAllRecordTypes, 1000);
                    });
                </script>
            </div>
        `;
        
        context.response.writePage(form);
    }
    
    /**
     * Handle POST request - return the fetched data
     */
    function handlePostRequest(context) {
        try {
            const result = context.request.parameters.custpage_result;
            
            if (result) {
                const recordTypes = JSON.parse(result);
                log.audit('Records Received', `Received ${recordTypes.length} record types from client`);
                
                context.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                
                context.response.write(JSON.stringify({
                    success: true,
                    count: recordTypes.length,
                    data: recordTypes
                }));
            } else {
                context.response.write(JSON.stringify({
                    success: false,
                    error: 'No data received'
                }));
            }
            
        } catch (error) {
            log.error('POST Error', error.toString());
            context.response.write(JSON.stringify({
                success: false,
                error: error.toString()
            }));
        }
    }
    
    return {
        onRequest: onRequest
    };
});
