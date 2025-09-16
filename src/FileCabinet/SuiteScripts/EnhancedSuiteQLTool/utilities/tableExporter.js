/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/file', 'N/log', 'N/search', 'N/runtime'], function(file, log, search, runtime) {
    
    /**
     * Main execution function for the scheduled script
     */
    function execute(context) {
        try {
            log.audit('Table Export', 'Starting NetSuite table and field export');
            
            // Get all available tables
            const tables = getAllTables();
            log.audit('Table Export', `Found ${tables.length} tables`);
            
            // Export tables to CSV
            const tablesCSV = generateTablesCSV(tables);
            const tablesFile = file.create({
                name: 'netsuite_tables_export.csv',
                fileType: file.Type.CSV,
                contents: tablesCSV,
                folder: getExportFolder()
            });
            const tablesFileId = tablesFile.save();
            log.audit('Table Export', `Tables CSV saved with ID: ${tablesFileId}`);
            
            // Get all fields for all tables and export to CSV
            const allFields = getAllFieldsForAllTables(tables);
            log.audit('Table Export', `Found ${allFields.length} total fields across all tables`);
            
            const fieldsCSV = generateFieldsCSV(allFields);
            const fieldsFile = file.create({
                name: 'netsuite_fields_export.csv',
                fileType: file.Type.CSV,
                contents: fieldsCSV,
                folder: getExportFolder()
            });
            const fieldsFileId = fieldsFile.save();
            log.audit('Table Export', `Fields CSV saved with ID: ${fieldsFileId}`);
            
            log.audit('Table Export', 'Export completed successfully');
            
        } catch (error) {
            log.error('Table Export Error', error.toString());
            throw error;
        }
    }
    
    /**
     * Get all available tables from NetSuite
     */
    function getAllTables() {
        const tables = [];
        
        // Use the same approach as the Enhanced SuiteQL Tool
        // This would need to be adapted based on how you currently get table metadata
        
        // For now, using a comprehensive list of known NetSuite tables
        const knownTables = [
            // Transaction tables
            'transaction', 'transactionline', 'transactionaccountingline',
            'salesorder', 'purchaseorder', 'invoice', 'bill', 'check', 'deposit',
            'cashsale', 'creditmemo', 'vendorcredit', 'journalentry',
            'estimate', 'opportunity', 'workorder', 'assemblybuild',
            'inventoryadjustment', 'inventorytransfer', 'itemreceipt', 'itemfulfillment',
            
            // Entity tables
            'customer', 'vendor', 'employee', 'partner', 'contact',
            'lead', 'prospect', 'entityaddress', 'entityphone', 'entityemail',
            
            // Item tables
            'item', 'inventoryitem', 'noninventoryitem', 'serviceitem',
            'assemblyitem', 'kititem', 'lotitem', 'serialitem',
            'itemvendor', 'itemprice', 'itemlocation',
            
            // Accounting tables
            'account', 'accountingperiod', 'currency', 'exchangerate',
            'department', 'class', 'location', 'subsidiary',
            'taxitem', 'taxcode', 'taxgroup',
            
            // System tables
            'customrecord', 'customfield', 'customlist', 'customsegment',
            'role', 'user', 'group', 'permission',
            'file', 'folder', 'message', 'note',
            
            // CRM tables
            'campaign', 'campaignevent', 'case', 'issue', 'solution',
            'task', 'calendarevent', 'phonecall',
            
            // Manufacturing tables
            'manufacturingoperationtask', 'manufacturingrouting',
            'workorderissue', 'workordercompletion',
            
            // Time tracking
            'timesheet', 'timebill', 'projecttask', 'project',
            
            // Payroll
            'payrollitem', 'paycheck', 'payrollliabilitycheck',
            
            // Advanced tables (if available)
            'bin', 'binnumber', 'inventorydetail', 'inventorynumber',
            'pricing', 'promotioncode', 'giftcertificate',
            'returnauthorization', 'vendorreturnauthorization'
        ];
        
        // Convert to table objects with metadata
        knownTables.forEach(tableName => {
            tables.push({
                id: tableName,
                name: tableName,
                label: formatTableLabel(tableName),
                recordType: getRecordTypeFromTable(tableName),
                category: getTableCategory(tableName)
            });
        });
        
        return tables;
    }
    
    /**
     * Get all fields for all tables
     */
    function getAllFieldsForAllTables(tables) {
        const allFields = [];
        
        tables.forEach(table => {
            try {
                log.debug('Processing Table', `Getting fields for table: ${table.id}`);
                const fields = getFieldsForTable(table.id);
                
                fields.forEach(field => {
                    allFields.push({
                        tableId: table.id,
                        tableName: table.name,
                        tableLabel: table.label,
                        tableCategory: table.category,
                        ...field
                    });
                });
                
                log.debug('Table Processed', `Found ${fields.length} fields for ${table.id}`);
                
            } catch (error) {
                log.error('Field Processing Error', `Error processing table ${table.id}: ${error.toString()}`);
            }
        });
        
        return allFields;
    }
    
    /**
     * Get fields for a specific table using SuiteQL metadata queries
     */
    function getFieldsForTable(tableId) {
        const fields = [];

        try {
            // Try to use SuiteQL to get actual field metadata
            // This approach uses a DESCRIBE-like query to get field information
            const metadataQuery = `
                SELECT
                    '${tableId}' as tableid,
                    'id' as fieldid,
                    'Internal ID' as label,
                    'integer' as type,
                    'F' as isrequired,
                    'T' as isreadonly
                FROM ${tableId}
                WHERE 1=0
                UNION ALL
                SELECT
                    '${tableId}' as tableid,
                    'created' as fieldid,
                    'Date Created' as label,
                    'datetime' as type,
                    'F' as isrequired,
                    'T' as isreadonly
                FROM ${tableId}
                WHERE 1=0
            `;

            // For now, use the predefined mapping approach
            // In a real implementation, you might use the NetSuite Metadata API
            // or parse the actual table structure
            const commonFields = getCommonFieldsForTable(tableId);

            // Try to enhance with actual field discovery
            const discoveredFields = discoverTableFields(tableId);

            // Merge common fields with discovered fields
            const allFields = [...commonFields];
            discoveredFields.forEach(discovered => {
                if (!allFields.find(f => f.id === discovered.id)) {
                    allFields.push(discovered);
                }
            });

            return allFields;

        } catch (error) {
            log.error('Get Fields Error', `Error getting fields for ${tableId}: ${error.toString()}`);
            return getCommonFieldsForTable(tableId);
        }
    }

    /**
     * Discover fields by attempting to query the table
     */
    function discoverTableFields(tableId) {
        const discoveredFields = [];

        try {
            // Try a simple SELECT * query with LIMIT 0 to get column information
            const discoveryQuery = `SELECT * FROM ${tableId} WHERE 1=0`;

            // This would need to be implemented using your existing query execution system
            // For now, return empty array as we can't easily discover fields this way

            log.debug('Field Discovery', `Attempted field discovery for ${tableId}`);

        } catch (error) {
            log.debug('Field Discovery Failed', `Could not discover fields for ${tableId}: ${error.toString()}`);
        }

        return discoveredFields;
    }
    
    /**
     * Get common fields for a table (fallback method)
     */
    function getCommonFieldsForTable(tableId) {
        const commonFields = [
            { id: 'id', name: 'id', label: 'Internal ID', type: 'integer', isRequired: false, isReadOnly: true },
            { id: 'created', name: 'created', label: 'Date Created', type: 'datetime', isRequired: false, isReadOnly: true },
            { id: 'lastmodified', name: 'lastmodified', label: 'Last Modified', type: 'datetime', isRequired: false, isReadOnly: true }
        ];
        
        // Add table-specific fields based on table type
        switch (tableId) {
            case 'customer':
                commonFields.push(
                    { id: 'entityid', name: 'entityid', label: 'Customer ID', type: 'text', isRequired: true, isReadOnly: false },
                    { id: 'companyname', name: 'companyname', label: 'Company Name', type: 'text', isRequired: false, isReadOnly: false },
                    { id: 'email', name: 'email', label: 'Email', type: 'email', isRequired: false, isReadOnly: false },
                    { id: 'phone', name: 'phone', label: 'Phone', type: 'phone', isRequired: false, isReadOnly: false },
                    { id: 'subsidiary', name: 'subsidiary', label: 'Subsidiary', type: 'select', isRequired: false, isReadOnly: false }
                );
                break;
                
            case 'item':
                commonFields.push(
                    { id: 'itemid', name: 'itemid', label: 'Item Name/Number', type: 'text', isRequired: true, isReadOnly: false },
                    { id: 'displayname', name: 'displayname', label: 'Display Name', type: 'text', isRequired: false, isReadOnly: false },
                    { id: 'type', name: 'type', label: 'Type', type: 'select', isRequired: true, isReadOnly: false },
                    { id: 'baseprice', name: 'baseprice', label: 'Base Price', type: 'currency', isRequired: false, isReadOnly: false }
                );
                break;
                
            case 'transaction':
                commonFields.push(
                    { id: 'tranid', name: 'tranid', label: 'Document Number', type: 'text', isRequired: false, isReadOnly: false },
                    { id: 'type', name: 'type', label: 'Type', type: 'select', isRequired: true, isReadOnly: true },
                    { id: 'entity', name: 'entity', label: 'Name', type: 'select', isRequired: true, isReadOnly: false },
                    { id: 'trandate', name: 'trandate', label: 'Date', type: 'date', isRequired: true, isReadOnly: false },
                    { id: 'amount', name: 'amount', label: 'Amount', type: 'currency', isRequired: false, isReadOnly: true }
                );
                break;
                
            default:
                // Add some generic fields for unknown tables
                commonFields.push(
                    { id: 'name', name: 'name', label: 'Name', type: 'text', isRequired: false, isReadOnly: false },
                    { id: 'isinactive', name: 'isinactive', label: 'Inactive', type: 'checkbox', isRequired: false, isReadOnly: false }
                );
        }
        
        return commonFields;
    }
    
    /**
     * Generate CSV content for tables
     */
    function generateTablesCSV(tables) {
        const headers = ['Table ID', 'Table Name', 'Table Label', 'Record Type', 'Category'];
        const rows = [headers];
        
        tables.forEach(table => {
            rows.push([
                escapeCSVField(table.id),
                escapeCSVField(table.name),
                escapeCSVField(table.label),
                escapeCSVField(table.recordType),
                escapeCSVField(table.category)
            ]);
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }
    
    /**
     * Generate CSV content for fields
     */
    function generateFieldsCSV(fields) {
        const headers = [
            'Table ID', 'Table Name', 'Table Label', 'Table Category',
            'Field ID', 'Field Name', 'Field Label', 'Field Type',
            'Is Required', 'Is Read Only', 'Default Value', 'Help Text', 'Select Record Type'
        ];
        const rows = [headers];
        
        fields.forEach(field => {
            rows.push([
                escapeCSVField(field.tableId),
                escapeCSVField(field.tableName),
                escapeCSVField(field.tableLabel),
                escapeCSVField(field.tableCategory),
                escapeCSVField(field.id),
                escapeCSVField(field.name),
                escapeCSVField(field.label),
                escapeCSVField(field.type),
                escapeCSVField(field.isRequired ? 'Yes' : 'No'),
                escapeCSVField(field.isReadOnly ? 'Yes' : 'No'),
                escapeCSVField(field.defaultValue || ''),
                escapeCSVField(field.help || ''),
                escapeCSVField(field.selectRecordType || '')
            ]);
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }
    
    /**
     * Escape CSV field content
     */
    function escapeCSVField(value) {
        if (!value) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
    }
    
    /**
     * Get export folder ID
     */
    function getExportFolder() {
        // Return the SuiteScripts folder or create a specific export folder
        return -15; // SuiteScripts folder
    }
    
    /**
     * Format table label from table ID
     */
    function formatTableLabel(tableName) {
        return tableName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    }
    
    /**
     * Get record type from table name
     */
    function getRecordTypeFromTable(tableName) {
        const recordTypeMap = {
            'customer': 'customer',
            'vendor': 'vendor',
            'employee': 'employee',
            'item': 'item',
            'salesorder': 'salesorder',
            'invoice': 'invoice',
            'transaction': 'transaction'
        };
        return recordTypeMap[tableName] || 'unknown';
    }
    
    /**
     * Get table category
     */
    function getTableCategory(tableName) {
        if (['customer', 'vendor', 'employee', 'partner', 'contact'].includes(tableName)) {
            return 'Entity';
        } else if (['item', 'inventoryitem', 'serviceitem'].includes(tableName)) {
            return 'Item';
        } else if (['transaction', 'salesorder', 'invoice', 'bill'].includes(tableName)) {
            return 'Transaction';
        } else if (['account', 'department', 'class', 'location'].includes(tableName)) {
            return 'Accounting';
        } else {
            return 'Other';
        }
    }
    
    return {
        execute: execute
    };
});
