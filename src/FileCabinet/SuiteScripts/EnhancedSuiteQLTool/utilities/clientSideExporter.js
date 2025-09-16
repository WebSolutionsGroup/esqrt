/**
 * Client-Side NetSuite Metadata Exporter
 * 
 * This script can be run directly in the browser console on the Enhanced SuiteQL Tool page
 * to export all NetSuite record types and fields using the same Records Catalog API
 * that the Table Explorer uses.
 * 
 * Usage:
 * 1. Open Enhanced SuiteQL Tool in NetSuite
 * 2. Open browser developer tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Run: exportAllNetSuiteMetadata()
 */

// Wrap everything in an IIFE to avoid variable conflicts
(function() {
    'use strict';

    // Records Catalog API endpoints (use existing ones if available)
    const EXPORTER_ENDPOINTS = window.RECORDS_CATALOG_ENDPOINTS || {
        GET_RECORD_TYPES: '/app/recordscatalog/rcendpoint.nl?action=getRecordTypes&data=',
        GET_RECORD_TYPE_DETAIL: '/app/recordscatalog/rcendpoint.nl?action=getRecordTypeDetail&data=',
        GET_RECORD_TYPE_OVERVIEW: '/app/recordscatalog/rcendpoint.nl?action=getRecordTypeOverview&data='
    };

    // Local variables to store fetched data
    let allRecordTypes = null;
    let allFieldData = {};
    let exportProgress = {
        totalTables: 0,
        processedTables: 0,
        errors: 0
    };

/**
 * Main export function - call this to start the export
 * @param {number} maxTables - Maximum number of tables to process for field details (default: all)
 */
async function exportAllNetSuiteMetadata(maxTables = null) {
    console.log('🚀 Starting NetSuite metadata export...');
    
    try {
        // Step 1: Fetch all record types
        console.log('📋 Fetching all record types...');
        await fetchAllRecordTypes();
        
        if (!allRecordTypes || allRecordTypes.length === 0) {
            console.error('❌ No record types found!');
            return;
        }
        
        console.log(`✅ Found ${allRecordTypes.length} record types`);
        
        // Step 2: Export tables CSV
        console.log('📊 Generating tables CSV...');
        exportTablesCSV();
        
        // Step 3: Fetch field details for a sample of tables (to avoid overwhelming the system)
        console.log('🔍 Fetching field details...');
        await fetchFieldDetailsForTables();
        
        // Step 4: Export fields CSV
        console.log('📋 Generating fields CSV...');
        exportFieldsCSV();
        
        // Step 5: Export summary
        console.log('📈 Generating summary...');
        exportSummaryCSV();
        
        console.log('🎉 Export completed successfully!');
        
    } catch (error) {
        console.error('❌ Export failed:', error);
    }
}

/**
 * Fetch all record types using the Records Catalog API
 */
function fetchAllRecordTypes() {
    return new Promise((resolve, reject) => {
        // Use the exact same API call as Table Explorer
        const requestData = { structureType: 'FLAT' };
        const url = EXPORTER_ENDPOINTS.GET_RECORD_TYPES + encodeURI(JSON.stringify(requestData));
        
        console.log('🌐 Calling Records Catalog API:', url);
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.response);
                    allRecordTypes = response.data || [];
                    
                    console.log(`✅ Successfully loaded ${allRecordTypes.length} record types`);
                    
                    // Log sample data structure
                    if (allRecordTypes.length > 0) {
                        console.log('📋 Sample record type:', allRecordTypes[0]);
                    }
                    
                    resolve(allRecordTypes);
                } catch (error) {
                    console.error('❌ Error parsing response:', error);
                    reject(error);
                }
            } else {
                console.error('❌ API request failed:', xhr.status, xhr.statusText);
                reject(new Error(`API request failed: ${xhr.status}`));
            }
        };
        
        xhr.onerror = function() {
            console.error('❌ Network error occurred');
            reject(new Error('Network error'));
        };
        
        xhr.send();
    });
}

/**
 * Fetch field details for a subset of tables
 */
async function fetchFieldDetailsForTables() {
    if (!allRecordTypes) return;
    
    // Process all tables (you can adjust this number if needed)
    const tablesToProcess = allRecordTypes;
    exportProgress.totalTables = tablesToProcess.length;
    exportProgress.processedTables = 0;
    exportProgress.errors = 0;
    
    console.log(`🔍 Processing field details for ${tablesToProcess.length} tables...`);
    console.log(`⚠️ This will take approximately ${Math.ceil(tablesToProcess.length * 0.5 / 60)} minutes to complete.`);

    // Process in batches to show progress and allow for interruption
    const batchSize = 50;
    let processed = 0;

    for (let batchStart = 0; batchStart < tablesToProcess.length; batchStart += batchSize) {
        const batch = tablesToProcess.slice(batchStart, batchStart + batchSize);
        console.log(`📦 Processing batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(tablesToProcess.length / batchSize)} (${batch.length} tables)`);

        for (let i = 0; i < batch.length; i++) {
            const table = batch[i];
            processed++;

            try {
                if (processed % 10 === 0) {
                    console.log(`📋 Processing ${processed}/${tablesToProcess.length}: ${table.id}`);
                }

                const fieldData = await fetchTableDetail(table.id);
                if (fieldData) {
                    allFieldData[table.id] = fieldData;
                }

                exportProgress.processedTables++;

                // Add delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                console.warn(`⚠️ Error processing ${table.id}:`, error.message);
                exportProgress.errors++;
            }
        }

        // Longer pause between batches
        console.log(`✅ Batch complete. Processed: ${exportProgress.processedTables}, Errors: ${exportProgress.errors}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`✅ Field processing complete. Processed: ${exportProgress.processedTables}, Errors: ${exportProgress.errors}`);
}

/**
 * Fetch detailed information for a specific table
 */
function fetchTableDetail(tableId) {
    return new Promise((resolve, reject) => {
        const requestData = { 
            scriptId: tableId, 
            detailType: 'SS_ANAL' 
        };
        const url = EXPORTER_ENDPOINTS.GET_RECORD_TYPE_DETAIL + encodeURI(JSON.stringify(requestData));
        
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
        
        // Set timeout to avoid hanging
        xhr.timeout = 10000;
        xhr.ontimeout = function() {
            reject(new Error('Request timeout'));
        };
        
        xhr.send();
    });
}

/**
 * Export tables to CSV
 */
function exportTablesCSV() {
    if (!allRecordTypes) {
        console.error('❌ No record types data available');
        return;
    }
    
    const headers = [
        'ID', 'Label', 'Family', 'Origin', 'Is Custom', 'Script ID', 
        'Record Name', 'Description', 'Base Type', 'Access Type'
    ];
    const rows = [headers];
    
    allRecordTypes.forEach(record => {
        rows.push([
            escapeCSV(record.id || ''),
            escapeCSV(record.label || ''),
            escapeCSV(getRecordFamily(record)),
            escapeCSV(record.origin || ''),
            escapeCSV(isCustomRecord(record) ? 'Yes' : 'No'),
            escapeCSV(record.scriptId || ''),
            escapeCSV(record.recordName || ''),
            escapeCSV(record.description || ''),
            escapeCSV(record.baseType || ''),
            escapeCSV(record.accessType || '')
        ]);
    });
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    downloadCSV(csvContent, `netsuite_tables_${getTimestamp()}.csv`);
    
    console.log(`✅ Tables CSV exported: ${allRecordTypes.length} records`);
}

/**
 * Export fields to CSV
 */
function exportFieldsCSV() {
    const headers = [
        'Table ID', 'Table Label', 'Field ID', 'Field Label', 'Field Type',
        'Is Required', 'Is Read Only', 'Is Custom', 'Default Value', 'Help Text',
        'Select Record Type', 'Max Length', 'Has Joins'
    ];
    const rows = [headers];
    
    let totalFields = 0;
    
    Object.entries(allFieldData).forEach(([tableId, tableDetail]) => {
        const table = allRecordTypes.find(t => t.id === tableId);
        const tableLabel = table ? table.label : tableId;
        
        if (tableDetail && tableDetail.fields) {
            tableDetail.fields.forEach(field => {
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
                    escapeCSV(field.joins && field.joins.length > 0 ? 'Yes' : 'No')
                ]);
                totalFields++;
            });
        }
    });
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    downloadCSV(csvContent, `netsuite_fields_${getTimestamp()}.csv`);
    
    console.log(`✅ Fields CSV exported: ${totalFields} fields from ${Object.keys(allFieldData).length} tables`);
}

/**
 * Export summary statistics
 */
function exportSummaryCSV() {
    const families = {};
    let customCount = 0;
    let systemCount = 0;
    
    allRecordTypes.forEach(record => {
        if (isCustomRecord(record)) {
            customCount++;
        } else {
            systemCount++;
        }
        
        const family = getRecordFamily(record);
        families[family] = (families[family] || 0) + 1;
    });
    
    const summaryData = [
        ['Metric', 'Value'],
        ['Total Tables', allRecordTypes.length],
        ['System Tables', systemCount],
        ['Custom Tables', customCount],
        ['Tables with Field Details', Object.keys(allFieldData).length],
        ['Export Date', new Date().toISOString()],
        ['NetSuite Account', window.location.hostname || 'Unknown']
    ];
    
    // Add family counts
    Object.entries(families).sort((a, b) => b[1] - a[1]).forEach(([family, count]) => {
        summaryData.push([`${family} Tables`, count]);
    });
    
    const csvContent = summaryData.map(row => row.join(',')).join('\n');
    downloadCSV(csvContent, `netsuite_summary_${getTimestamp()}.csv`);
    
    console.log('✅ Summary CSV exported');
}

/**
 * Helper functions
 */
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

function escapeCSV(value) {
    if (!value) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
}

    // Make the export function available globally
    window.exportAllNetSuiteMetadata = exportAllNetSuiteMetadata;

    console.log('📋 NetSuite Metadata Exporter loaded!');
    console.log('🚀 Run: exportAllNetSuiteMetadata() to start the export');

})(); // End of IIFE
