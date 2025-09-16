# NetSuite Table and Field Metadata Exporter

This utility helps you export comprehensive NetSuite table and field metadata to CSV files for analysis in Excel or other tools.

## Files Included

1. **tableExporter.js** - Basic scheduled script for metadata export
2. **advancedTableExporter.js** - Enhanced version with comprehensive metadata
3. **exportTrigger.js** - Client script to trigger exports from the Enhanced SuiteQL Tool
4. **tableExporterDeployment.xml** - Deployment configuration

## Setup Instructions

### Option 1: Scheduled Script Deployment

1. **Upload the Script**
   - Upload `advancedTableExporter.js` to your SuiteScripts folder
   - Navigate to Customization > Scripting > Scripts > New
   - Select "SuiteScript 2.1" and upload the file

2. **Create Script Record**
   - Script Type: Scheduled Script
   - Name: "NetSuite Metadata Exporter"
   - ID: `customscript_metadata_exporter`
   - Script File: Point to your uploaded file

3. **Deploy the Script**
   - Create a new deployment
   - Set status to "Released"
   - Configure execution settings:
     - Queue: 1
     - Max Concurrency: 1
     - Log Level: Debug

4. **Execute the Script**
   - Go to the deployment record
   - Click "Save & Execute" or schedule it to run

### Option 2: Browser Console Method (Quick & Easy)

1. **Open Enhanced SuiteQL Tool**
   - Navigate to your Enhanced SuiteQL Tool page
   - Open browser developer tools (F12)
   - Go to the Console tab

2. **Load the Export Function**
   ```javascript
   // Copy and paste the exportNetSuiteMetadata function from exportTrigger.js
   // Then run:
   exportNetSuiteMetadata();
   ```

3. **Download Results**
   - The function will automatically download CSV files to your browser's download folder
   - Files will be named: `netsuite_tables.csv` and `netsuite_fields.csv`

## Output Files

### Tables CSV (`netsuite_tables_metadata_[timestamp].csv`)
Contains comprehensive table information:
- Table ID and Name
- Table Label and Category
- Record Type and Custom Status
- Field Count and Feature Flags
- Analysis Metadata

### Fields CSV (`netsuite_fields_metadata_[timestamp].csv`)
Contains detailed field information:
- Table and Field Identification
- Field Properties (type, required, readonly)
- Custom Field Detection
- Join Information
- Data Type Details

### Relationships CSV (`netsuite_relationships_[timestamp].csv`)
Contains table relationship mappings:
- Source and Target Tables
- Field Relationships
- Join Types and Requirements

### Summary CSV (`netsuite_export_summary_[timestamp].csv`)
Contains export statistics:
- Total counts by category
- Export metadata
- Account information

## Excel Analysis Tips

### Recommended Pivot Tables

1. **Tables by Category**
   - Rows: Category
   - Values: Count of Table ID
   - Shows distribution of tables across categories

2. **Fields by Type**
   - Rows: Field Type
   - Values: Count of Field ID
   - Shows most common field types

3. **Custom vs Standard**
   - Rows: Is Custom
   - Columns: Table Category
   - Values: Count of Table ID

### Useful Filters

- **Transaction Tables**: Filter Category = "Transaction"
- **Custom Objects**: Filter Is Custom = "Yes"
- **Required Fields**: Filter Is Required = "Yes"
- **Join Fields**: Filter Has Joins = "Yes"

### Analysis Queries

```excel
// Count of tables by category
=COUNTIF(Category:Category,"Transaction")

// Percentage of custom tables
=COUNTIF(IsCustom:IsCustom,"Yes")/COUNTA(TableID:TableID)*100

// Average fields per table
=AVERAGE(FieldCount:FieldCount)
```

## Customization Options

### Adding More Tables
Edit the `getComprehensiveTableList()` function to include additional tables:

```javascript
const additionalTables = [
    'your_custom_table',
    'another_table'
];
```

### Enhanced Field Discovery
Modify `getEnhancedFieldsForTable()` to include:
- Custom field detection via SuiteQL
- Field validation rules
- Default value analysis
- Usage statistics

### Custom Categories
Update `determineTableCategory()` to add your own categorization logic:

```javascript
if (tableName.includes('your_prefix')) {
    return 'Your Category';
}
```

## Troubleshooting

### Common Issues

1. **Script Timeout**
   - Reduce the number of tables processed per execution
   - Split into multiple smaller scripts
   - Increase script execution time limits

2. **Permission Errors**
   - Ensure script has access to all record types
   - Check user permissions for metadata access
   - Verify SuiteQL permissions

3. **Missing Fields**
   - Some fields may not be accessible via SuiteQL
   - Custom fields require specific permissions
   - System fields may be restricted

### Performance Optimization

1. **Batch Processing**
   - Process tables in smaller batches
   - Use governance monitoring
   - Implement checkpointing for large exports

2. **Selective Export**
   - Filter tables by category
   - Export only changed tables
   - Skip empty or inactive tables

## Advanced Features

### Integration with Enhanced SuiteQL Tool
The export can be integrated directly into your Enhanced SuiteQL Tool interface:

1. Add export button to the main toolbar
2. Use existing table metadata from the tool
3. Export current query results along with metadata

### Automated Scheduling
Set up regular exports to track schema changes:

1. Schedule weekly metadata exports
2. Compare exports to detect changes
3. Alert on new tables or field modifications

### Data Lineage Tracking
Enhance the export to include:

1. Field usage in saved searches
2. Workflow dependencies
3. Custom script references
4. Report and dashboard usage

## Support

For issues or enhancements:
1. Check the script execution logs in NetSuite
2. Review browser console for client-side errors
3. Verify permissions and access rights
4. Test with a smaller subset of tables first

## Version History

- v1.0: Basic table and field export
- v1.1: Added relationships and summary statistics
- v1.2: Enhanced field discovery and categorization
- v1.3: Browser console integration for quick exports
