/**
 * Console-Ready NetSuite Metadata Export
 * 
 * Copy and paste this entire file into the browser console
 * when you have the Enhanced SuiteQL Tool open.
 */

/**
 * Main export function - run this after pasting the code
 */
async function exportNetSuiteMetadata() {
    console.log('🚀 Starting comprehensive NetSuite metadata export...');

    // Check if Enhanced SuiteQL Tool is loaded and get table data
    if (!window.tableReferenceCache || !window.tableReferenceCache.recordTypes) {
        console.warn('❌ Enhanced SuiteQL Tool not loaded or no table data available.');
        console.log('💡 Please open the Table Explorer and let it load data first.');
        return;
    }

    const allTables = window.tableReferenceCache.recordTypes;
    console.log(`📊 Found ${allTables.length} tables. Starting comprehensive export...`);

    // Show progress
    const progressDiv = document.createElement('div');
    progressDiv.id = 'export-progress';
    progressDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #2d3748; color: white; padding: 15px; border-radius: 8px;
        font-family: monospace; font-size: 12px; min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(progressDiv);

    function updateProgress(message) {
        progressDiv.innerHTML = `<div>🔄 ${message}</div>`;
        console.log(`📈 ${message}`);
    }

    try {
        // Step 1: Export comprehensive tables metadata
        updateProgress('Exporting tables metadata...');
        const tablesCSV = await generateComprehensiveTablesCSV(allTables);
        downloadCSV(tablesCSV, `netsuite_tables_metadata_${getTimestamp()}.csv`);

        // Step 2: Export detailed fields metadata
        updateProgress('Fetching detailed field information...');
        const fieldsCSV = await generateComprehensiveFieldsCSV(allTables);
        downloadCSV(fieldsCSV, `netsuite_fields_metadata_${getTimestamp()}.csv`);

        // Step 3: Export joins/relationships metadata
        updateProgress('Exporting relationship data...');
        const joinsCSV = await generateComprehensiveJoinsCSV(allTables);
        downloadCSV(joinsCSV, `netsuite_relationships_metadata_${getTimestamp()}.csv`);

        // Step 4: Export summary statistics
        updateProgress('Generating export summary...');
        const summaryCSV = generateExportSummary(allTables);
        downloadCSV(summaryCSV, `netsuite_export_summary_${getTimestamp()}.csv`);

        // Success message
        progressDiv.innerHTML = `
            <div style="color: #48bb78;">✅ Export completed successfully!</div>
            <div style="font-size: 10px; margin-top: 5px;">
                📁 4 CSV files downloaded<br>
                📊 ${allTables.length} tables processed
            </div>
        `;

        setTimeout(() => {
            document.body.removeChild(progressDiv);
        }, 5000);

        console.log('🎉 Export completed successfully! Check your downloads folder.');

    } catch (error) {
        console.error('❌ Export failed:', error);
        progressDiv.innerHTML = `<div style="color: #f56565;">❌ Export failed: ${error.message}</div>`;
        setTimeout(() => {
            document.body.removeChild(progressDiv);
        }, 5000);
    }
}

/**
 * Generate comprehensive tables CSV with full metadata
 */
async function generateComprehensiveTablesCSV(tables) {
    const headers = [
        'Table ID', 'Table Name', 'Table Label', 'Record Family', 'Category',
        'Is Custom', 'Is System', 'Field Count', 'Has Overview', 'Base Type',
        'Description', 'Available', 'Feature Required', 'Permission Required'
    ];
    const rows = [headers];

    // Process tables in batches to avoid overwhelming the system
    const batchSize = 50;
    for (let i = 0; i < tables.length; i += batchSize) {
        const batch = tables.slice(i, i + batchSize);

        for (const table of batch) {
            // Get record family using the same logic as the Enhanced SuiteQL Tool
            const family = getRecordFamily(table);

            // Determine category (System/Custom)
            const isSystem = isSystemRecord(table);
            const isCustom = isCustomRecord(table);
            const category = isSystem ? 'System' : (isCustom ? 'Custom' : 'Unknown');

            // Get overview data if available
            const overview = window.tableReferenceCache?.recordOverviews?.[table.id];
            const hasOverview = !!overview;
            const baseType = overview?.baseType || '';
            const description = overview?.description || table.description || '';

            // Get field count (will be populated when we fetch detailed data)
            let fieldCount = 0;
            if (window.tableReferenceCache?.tableDetails?.[table.id]) {
                const details = window.tableReferenceCache.tableDetails[table.id];
                fieldCount = details.fields ? details.fields.length : 0;
            }

            rows.push([
                escapeCSVField(table.id),
                escapeCSVField(table.name || table.id),
                escapeCSVField(table.label || table.name || table.id),
                escapeCSVField(family),
                escapeCSVField(category),
                escapeCSVField(isCustom ? 'Yes' : 'No'),
                escapeCSVField(isSystem ? 'Yes' : 'No'),
                escapeCSVField(fieldCount.toString()),
                escapeCSVField(hasOverview ? 'Yes' : 'No'),
                escapeCSVField(baseType),
                escapeCSVField(description),
                escapeCSVField(table.available !== false ? 'Yes' : 'No'),
                escapeCSVField(table.feature || table.featureRequired || ''),
                escapeCSVField(table.permission || table.permissionRequired || '')
            ]);
        }
    }

    return rows.map(row => row.join(',')).join('\n');
}

// Helper functions using same logic as Enhanced SuiteQL Tool
function getRecordFamily(table) {
    // Check if we have overview data with baseType field
    const overview = window.tableReferenceCache?.recordOverviews?.[table.id];
    if (overview && overview.baseType) {
        return overview.baseType;
    }
    
    // Fallback to pattern-based classification
    const tableId = table.id.toLowerCase();
    
    if (tableId.includes('transaction') || tableId.includes('invoice') || tableId.includes('salesorder') || 
        tableId.includes('purchaseorder') || tableId.includes('bill') || tableId.includes('payment')) {
        return 'TRANSACTION';
    } else if (tableId.includes('customer') || tableId.includes('vendor') || tableId.includes('employee') || 
               tableId.includes('contact') || tableId.includes('partner')) {
        return 'ENTITY';
    } else if (tableId.includes('item') || tableId.includes('inventoryitem') || tableId.includes('product')) {
        return 'ITEM';
    } else if (tableId.includes('account') || tableId.includes('budget') || tableId.includes('currency')) {
        return 'ACCOUNTING';
    } else if (tableId.includes('location') || tableId.includes('subsidiary') || tableId.includes('department') || 
               tableId.includes('class') || tableId.includes('classification')) {
        return 'SETUP';
    } else if (tableId.includes('customrecord') || tableId.includes('custom_record')) {
        return 'CUSTOM';
    } else {
        return 'OTHER';
    }
}

function isSystemRecord(table) {
    const tableId = table.id.toLowerCase();
    return !tableId.includes('customrecord') && !tableId.includes('custom_record');
}

function isCustomRecord(table) {
    const tableId = table.id.toLowerCase();
    return tableId.includes('customrecord') || tableId.includes('custom_record');
}

function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
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

/**
 * Generate comprehensive fields CSV with detailed metadata
 */
async function generateComprehensiveFieldsCSV(tables) {
    const headers = [
        'Table ID', 'Table Name', 'Table Label', 'Field ID', 'Field Name', 'Field Label',
        'Data Type', 'Field Type', 'Is Column', 'Is Required', 'Is Read Only', 'Available',
        'Feature Required', 'Permission Required', 'Join Target', 'Join Type', 'Join Field',
        'Is Custom Field', 'Default Value', 'Max Length', 'Description'
    ];
    const rows = [headers];

    // Process tables in smaller batches and fetch detailed field information
    const batchSize = 10; // Smaller batch for detailed field fetching
    let processedTables = 0;

    for (let i = 0; i < tables.length; i += batchSize) {
        const batch = tables.slice(i, i + batchSize);

        // Fetch detailed table information for this batch
        const detailPromises = batch.map(table => {
            if (window.fetchTableDetail) {
                return window.fetchTableDetail(table.id).catch(error => {
                    console.warn(`Failed to fetch details for ${table.id}:`, error);
                    return null;
                });
            }
            return Promise.resolve(null);
        });

        const tableDetails = await Promise.all(detailPromises);

        // Process each table's fields
        batch.forEach((table, batchIndex) => {
            const details = tableDetails[batchIndex];
            const fields = details?.fields || [];

            // Only process queryable fields (isColumn === true)
            const queryableFields = fields.filter(field => field.isColumn === true);

            queryableFields.forEach(field => {
                // Extract comprehensive field metadata using same logic as renderFieldRows
                const dataType = field.dataType || field.fieldType || field.returnType ||
                               (field.type && field.type !== 'RECORD_FIELD' ? field.type : 'STRING');

                const available = field.available !== false ? 'Yes' : 'No';
                const feature = field.feature || field.featureRequired || field.requiredFeature || field.features || '';
                const permission = field.permission || field.permissions || field.requiredPermission || field.permissionRequired || '';

                // Extract join information using same logic as renderFieldRows
                let joinTarget = '';
                let joinType = '';
                let joinField = '';

                if (field.join) {
                    joinTarget = field.join;
                    joinType = 'Direct Join';
                } else if (field.joinField) {
                    joinTarget = field.joinField;
                    joinType = 'Join Field';
                } else if (field.joinTo) {
                    joinTarget = field.joinTo;
                    joinType = 'Join To';
                } else if (field.relationship) {
                    joinTarget = field.relationship;
                    joinType = 'Relationship';
                } else if (field.recordType) {
                    joinTarget = field.recordType;
                    joinType = 'Record Type';
                } else if (field.targetRecordType) {
                    joinTarget = field.targetRecordType;
                    joinType = 'Target Record';
                } else if (field.sourceTargetType) {
                    const sourceTarget = field.sourceTargetType;
                    joinTarget = sourceTarget.label || sourceTarget.id || '';
                    joinType = 'Source Target';
                } else if (field.type && (field.type === 'SELECT' || field.type === 'MULTISELECT')) {
                    if (field.selectOptions && field.selectOptions.recordType) {
                        joinTarget = field.selectOptions.recordType;
                        joinType = 'Select Options';
                    } else if (field.recordTypeId) {
                        joinTarget = field.recordTypeId;
                        joinType = 'Record Type ID';
                    }
                } else if (field.id && field.id.includes('.')) {
                    const parts = field.id.split('.');
                    if (parts.length > 1) {
                        joinTarget = parts[0];
                        joinType = 'Dot Notation';
                        joinField = parts.slice(1).join('.');
                    }
                }

                // Determine if it's a custom field
                const isCustomField = field.id && (field.id.startsWith('custbody') ||
                                                 field.id.startsWith('custcol') ||
                                                 field.id.startsWith('custrecord') ||
                                                 field.id.startsWith('custentity') ||
                                                 field.id.startsWith('custitem')) ? 'Yes' : 'No';

                rows.push([
                    escapeCSVField(table.id),
                    escapeCSVField(table.name || table.id),
                    escapeCSVField(table.label || table.name || table.id),
                    escapeCSVField(field.id),
                    escapeCSVField(field.name || field.id),
                    escapeCSVField(field.label || field.name || field.id),
                    escapeCSVField(dataType),
                    escapeCSVField(field.type || ''),
                    escapeCSVField(field.isColumn ? 'Yes' : 'No'),
                    escapeCSVField(field.isRequired ? 'Yes' : 'No'),
                    escapeCSVField(field.isReadOnly ? 'Yes' : 'No'),
                    escapeCSVField(available),
                    escapeCSVField(feature),
                    escapeCSVField(permission),
                    escapeCSVField(joinTarget),
                    escapeCSVField(joinType),
                    escapeCSVField(joinField),
                    escapeCSVField(isCustomField),
                    escapeCSVField(field.defaultValue || ''),
                    escapeCSVField(field.maxLength || ''),
                    escapeCSVField(field.description || '')
                ]);
            });
        });

        processedTables += batch.length;
        console.log(`📊 Processed ${processedTables}/${tables.length} tables for field export`);
    }

    return rows.map(row => row.join(',')).join('\n');
}

/**
 * Generate comprehensive joins/relationships CSV
 */
async function generateComprehensiveJoinsCSV(tables) {
    const headers = [
        'Source Table ID', 'Source Table Name', 'Target Table ID', 'Target Table Name',
        'Join Type', 'Field ID', 'Cardinality', 'Available', 'Join Direction',
        'Source Field', 'Target Field', 'Relationship Type', 'Description'
    ];
    const rows = [headers];

    // Process tables and fetch join information
    const batchSize = 10;
    let processedTables = 0;

    for (let i = 0; i < tables.length; i += batchSize) {
        const batch = tables.slice(i, i + batchSize);

        // Fetch detailed table information for joins
        const detailPromises = batch.map(table => {
            if (window.fetchTableDetail) {
                return window.fetchTableDetail(table.id).catch(error => {
                    console.warn(`Failed to fetch join details for ${table.id}:`, error);
                    return null;
                });
            }
            return Promise.resolve(null);
        });

        const tableDetails = await Promise.all(detailPromises);

        // Process each table's joins
        batch.forEach((table, batchIndex) => {
            const details = tableDetails[batchIndex];
            const joins = details?.joins || [];

            joins.forEach(join => {
                const sourceTarget = join.sourceTargetType || {};
                const joinPairs = sourceTarget.joinPairs || [];
                const fieldIds = joinPairs.map(pair => pair.label || pair.id).join(', ');
                const available = join.available !== false ? 'Yes' : 'No';

                // Determine join type using same logic as renderJoinRows
                let joinType = 'Regular Join';
                if (join.joinType) {
                    switch(join.joinType.toLowerCase()) {
                        case 'jointo':
                        case 'join_to':
                            joinType = 'Join To';
                            break;
                        case 'joinfrom':
                        case 'join_from':
                            joinType = 'Join From';
                            break;
                        case 'regular':
                        case 'regulerjoin':
                            joinType = 'Regular Join';
                            break;
                        case 'automatic':
                            joinType = 'Regular Join';
                            break;
                        case 'polymorphic':
                            joinType = 'Join To';
                            break;
                        case 'inverse':
                            joinType = 'Join From';
                            break;
                        default:
                            joinType = join.joinType;
                    }
                } else if (join.type && join.type !== 'JOIN') {
                    switch(join.type.toLowerCase()) {
                        case 'automatic':
                            joinType = 'Regular Join';
                            break;
                        case 'polymorphic':
                            joinType = 'Join To';
                            break;
                        case 'inverse':
                            joinType = 'Join From';
                            break;
                        default:
                            joinType = join.type;
                    }
                }

                // Extract cardinality and other metadata
                const cardinality = join.cardinality || sourceTarget.cardinality || 'Unknown';
                const joinDirection = joinType.includes('From') ? 'Outbound' : 'Inbound';
                const sourceField = join.sourceField || '';
                const targetField = join.targetField || '';
                const relationshipType = join.relationshipType || join.relationship || '';

                rows.push([
                    escapeCSVField(table.id),
                    escapeCSVField(table.name || table.id),
                    escapeCSVField(sourceTarget.id || ''),
                    escapeCSVField(sourceTarget.label || sourceTarget.name || ''),
                    escapeCSVField(joinType),
                    escapeCSVField(fieldIds),
                    escapeCSVField(cardinality),
                    escapeCSVField(available),
                    escapeCSVField(joinDirection),
                    escapeCSVField(sourceField),
                    escapeCSVField(targetField),
                    escapeCSVField(relationshipType),
                    escapeCSVField(join.description || '')
                ]);
            });
        });

        processedTables += batch.length;
        console.log(`🔗 Processed ${processedTables}/${tables.length} tables for joins export`);
    }

    return rows.map(row => row.join(',')).join('\n');
}

/**
 * Generate export summary with statistics
 */
function generateExportSummary(tables) {
    const headers = ['Metric', 'Value', 'Description'];
    const rows = [headers];

    // Calculate statistics
    const totalTables = tables.length;
    const systemTables = tables.filter(table => isSystemRecord(table)).length;
    const customTables = tables.filter(table => isCustomRecord(table)).length;

    // Count by family
    const familyCounts = {};
    tables.forEach(table => {
        const family = getRecordFamily(table);
        familyCounts[family] = (familyCounts[family] || 0) + 1;
    });

    // Add summary rows
    rows.push(['Total Tables', totalTables.toString(), 'Total number of tables exported']);
    rows.push(['System Tables', systemTables.toString(), 'NetSuite standard tables']);
    rows.push(['Custom Tables', customTables.toString(), 'Customer-created tables']);
    rows.push(['Export Timestamp', new Date().toISOString(), 'When this export was generated']);
    rows.push(['Export Version', '1.3.0', 'Enhanced SuiteQL Tool version']);

    // Add family breakdown
    Object.entries(familyCounts).forEach(([family, count]) => {
        rows.push([`${family} Family`, count.toString(), `Tables in the ${family} record family`]);
    });

    return rows.map(row => row.join(',')).join('\n');
}

console.log('✅ NetSuite Export functions loaded! Run exportNetSuiteMetadata() to start export.');
