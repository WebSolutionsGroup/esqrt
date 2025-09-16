/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Client script to trigger table metadata export
 */

define(['N/currentRecord', 'N/ui/message', 'N/url', 'N/https'], function(currentRecord, message, url, https) {
    
    /**
     * Add export functionality to Enhanced SuiteQL Tool
     */
    function addExportFunctionality() {
        // Add export button to the interface
        const exportButton = document.createElement('button');
        exportButton.textContent = '📊 Export Metadata';
        exportButton.className = 'export-metadata-btn';
        exportButton.style.cssText = `
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-left: 10px;
        `;
        
        exportButton.onclick = function() {
            triggerMetadataExport();
        };
        
        // Try to add to the main toolbar
        const toolbar = document.querySelector('.main-toolbar') || document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.appendChild(exportButton);
        } else {
            // Fallback: add to body
            document.body.appendChild(exportButton);
        }
    }
    
    /**
     * Trigger the metadata export
     */
    function triggerMetadataExport() {
        try {
            // Show loading message
            const loadingMsg = message.create({
                title: 'Export Started',
                message: 'NetSuite metadata export has been initiated. This may take several minutes.',
                type: message.Type.INFORMATION
            });
            loadingMsg.show();
            
            // Create export request
            const exportData = {
                action: 'exportMetadata',
                timestamp: new Date().toISOString(),
                options: {
                    includeTables: true,
                    includeFields: true,
                    includeRelationships: true,
                    includeStatistics: true
                }
            };
            
            // Trigger the scheduled script (you'll need to implement this endpoint)
            triggerScheduledScript(exportData)
                .then(response => {
                    loadingMsg.hide();
                    
                    const successMsg = message.create({
                        title: 'Export Initiated',
                        message: 'Metadata export has been started. Check the SuiteScripts folder for CSV files when complete.',
                        type: message.Type.CONFIRMATION
                    });
                    successMsg.show();
                    
                    // Auto-hide after 5 seconds
                    setTimeout(() => successMsg.hide(), 5000);
                })
                .catch(error => {
                    loadingMsg.hide();
                    
                    const errorMsg = message.create({
                        title: 'Export Error',
                        message: 'Failed to start metadata export: ' + error.message,
                        type: message.Type.ERROR
                    });
                    errorMsg.show();
                });
                
        } catch (error) {
            console.error('Export trigger error:', error);
            
            const errorMsg = message.create({
                title: 'Export Error',
                message: 'Failed to trigger export: ' + error.message,
                type: message.Type.ERROR
            });
            errorMsg.show();
        }
    }
    
    /**
     * Trigger the scheduled script
     */
    function triggerScheduledScript(exportData) {
        return new Promise((resolve, reject) => {
            try {
                // This would need to be implemented as a RESTlet or Suitelet endpoint
                // For now, we'll simulate the trigger
                
                // In a real implementation, you would:
                // 1. Create a RESTlet that triggers the scheduled script
                // 2. Call that RESTlet from here
                // 3. The RESTlet would use N/task to start the scheduled script
                
                console.log('Export triggered with data:', exportData);
                
                // Simulate async operation
                setTimeout(() => {
                    resolve({ success: true, message: 'Export started' });
                }, 1000);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Initialize export functionality when page loads
     */
    function pageInit(context) {
        // Add export functionality after a short delay to ensure DOM is ready
        setTimeout(() => {
            addExportFunctionality();
        }, 1000);
    }
    
    /**
     * Manual export function that can be called from console
     */
    function manualExport() {
        triggerMetadataExport();
    }
    
    // Make manual export available globally for console access
    window.triggerMetadataExport = manualExport;
    
    return {
        pageInit: pageInit,
        triggerMetadataExport: manualExport
    };
});

/**
 * Alternative approach: Direct export function for browser console
 * 
 * You can run this directly in the browser console on the Enhanced SuiteQL Tool page:
 */
function exportNetSuiteMetadata() {
    // Get all tables from the current Enhanced SuiteQL Tool state
    const tables = window.getAllAvailableTables ? window.getAllAvailableTables() : [];
    
    if (tables.length === 0) {
        console.warn('No tables found. Make sure Enhanced SuiteQL Tool is loaded.');
        return;
    }
    
    console.log(`Found ${tables.length} tables. Starting export...`);
    
    // Export tables to CSV
    const tablesCSV = generateTablesCSV(tables);
    downloadCSV(tablesCSV, 'netsuite_tables.csv');
    
    // Export fields to CSV
    const fieldsCSV = generateFieldsCSV(tables);
    downloadCSV(fieldsCSV, 'netsuite_fields.csv');
    
    console.log('Export completed. Check your downloads folder.');
}

function generateTablesCSV(tables) {
    const headers = ['Table ID', 'Table Name', 'Table Label', 'Category', 'Record Type'];
    const rows = [headers];
    
    tables.forEach(table => {
        rows.push([
            escapeCSVField(table.id || table.name),
            escapeCSVField(table.name),
            escapeCSVField(table.label || table.name),
            escapeCSVField(table.category || 'Unknown'),
            escapeCSVField(table.recordType || 'Unknown')
        ]);
    });
    
    return rows.map(row => row.join(',')).join('\n');
}

function generateFieldsCSV(tables) {
    const headers = [
        'Table ID', 'Table Name', 'Field ID', 'Field Name', 'Field Label', 
        'Field Type', 'Is Required', 'Is Read Only', 'Has Joins'
    ];
    const rows = [headers];
    
    tables.forEach(table => {
        const fields = table.fields || [];
        fields.forEach(field => {
            rows.push([
                escapeCSVField(table.id || table.name),
                escapeCSVField(table.name),
                escapeCSVField(field.id || field.name),
                escapeCSVField(field.name),
                escapeCSVField(field.label || field.name),
                escapeCSVField(field.type || 'Unknown'),
                escapeCSVField(field.isRequired ? 'Yes' : 'No'),
                escapeCSVField(field.isReadOnly ? 'Yes' : 'No'),
                escapeCSVField(field.hasJoins ? 'Yes' : 'No')
            ]);
        });
    });
    
    return rows.map(row => row.join(',')).join('\n');
}

function escapeCSVField(value) {
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
    }
}

// Make the export function available globally
if (typeof window !== 'undefined') {
    window.exportNetSuiteMetadata = exportNetSuiteMetadata;
}
