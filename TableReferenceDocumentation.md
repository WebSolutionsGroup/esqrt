# Table Reference Documentation
## Enhanced SuiteQL Query Tool - Release 1.3.0

### Overview

The Table Reference functionality is a major new feature introduced in Release 1.3.0 that provides users with comprehensive access to NetSuite's record type metadata. This feature allows users to browse available tables, explore field definitions, understand join relationships, and preview data - all within the familiar Code-OSS style interface.

### Key Features

- **Searchable Table Explorer**: Browse and search through all available NetSuite record types
- **Hierarchical Organization**: Tables organized into logical categories (Functions, Procedures, System, Custom)
- **Detailed Field Information**: View comprehensive field metadata including types, availability, and permissions
- **Join Relationship Mapping**: Explore how tables relate to each other through join relationships
- **Data Preview**: Generate preview queries to examine actual table data
- **Integrated Tab System**: Seamlessly integrated with the existing query tab system
- **Theme Support**: Full support for light and dark themes

---

## User Interface Components

### Table Explorer Sidebar Section

The Table Explorer is located in the left sidebar below the Saved Queries section. It provides a hierarchical view of all available record types organized into categories:

#### Categories:
- **📋 FUNCTIONS**: JavaScript functions stored in the file cabinet (planned for future release)
- **⚙️ PROCEDURES**: Stored procedures (planned for future release)
- **📊 SYSTEM**: Standard NetSuite record types organized by Record Family
  - Grouped by families like ENTITY, TRANSACTION, ITEM, etc.
  - Includes Employee, Customer, Vendor, Sales Order, Invoice, etc.
- **📁 CUSTOM**: Custom record types and lists organized by Record Family
  - **CUSTOM**: Custom record types (customrecord_*) created in your NetSuite account
  - **CUSTOMLIST**: Custom lists (customlist_*) created in your NetSuite account
  - Other custom families as defined in your NetSuite configuration

#### Search Functionality:
- Real-time search filtering across all record types
- Search by record label or internal ID
- Categories automatically hide/show based on search results

### Table Reference Tabs

When you click on a record type in the Table Explorer, a new tab opens with detailed information about that table. Each table reference tab contains four sub-tabs:

#### 1. Overview Tab
Displays high-level information about the record type:
- **Record Type Information**: ID, name, origin, record family, availability
- **Feature and Permission Details**: Associated NetSuite features and required permissions
- **Data Information**: Automatic row count loading, creation dates and modification timestamps
- **Row Count**: Real-time count of records in the table (loads automatically with progress indicator)

#### 2. Fields Tab
Provides comprehensive field information:
- **Field Selection**: Checkboxes to select fields for query generation
- **Field Details**: Name, type, availability, features, permissions, and join information
- **Search and Filter**: Real-time filtering of fields by name
- **Query Generation**: Create SELECT queries with selected fields

#### 3. Joins Tab
Shows relationship information:
- **Join Relationships**: Tables that can be joined with the current record type
- **Join Details**: Join type, cardinality, and field mappings
- **Navigation**: Click on related tables to open their reference tabs

#### 4. Preview Tab
Enables data exploration:
- **Preview Controls**: Options for limiting result sets
- **Query Generation**: Create preview queries to examine actual data
- **Integration**: Generated queries open in new query tabs for execution

---

## Technical Implementation

### Architecture

The Table Reference functionality is built using the same modular architecture as the rest of the Enhanced SuiteQL Query Tool:

#### Core Modules:
- **tableReferenceData.js**: Handles NetSuite Records Catalog API interactions
- **tableReferenceTabs.js**: Manages the specialized tab system for table references
- **tableReferenceComponents.js**: Renders UI components for different content types

#### Integration Points:
- **Sidebar Sections**: Extended to include Table Explorer functionality
- **Query Tabs**: Enhanced to support table reference tabs alongside query tabs
- **Theme System**: Full integration with existing light/dark theme support

### Data Sources

The Table Reference functionality leverages NetSuite's internal Records Catalog API:

#### Primary Endpoints:
- `/app/recordscatalog/rcendpoint.nl?action=getRecordTypes`: Retrieves list of all record types
- `/app/recordscatalog/rcendpoint.nl?action=getRecordTypeDetail`: Gets detailed information for specific record types

#### Data Caching:
- Record type lists are cached after initial load
- Individual table details are cached to improve performance
- Cache respects user session and automatically refreshes as needed

### Performance Considerations

- **Lazy Loading**: Data is only fetched when categories are expanded
- **Intelligent Caching**: Reduces redundant API calls
- **Efficient Filtering**: Client-side filtering for responsive search
- **Memory Management**: Proper cleanup of cached data

---

## Usage Guide

### Getting Started

1. **Open the Table Explorer**:
   - Look for the "TABLE EXPLORER" section in the left sidebar
   - Click to expand the section

2. **Browse Record Types**:
   - Expand categories to see available record types
   - Use the search box to find specific tables
   - Click on any record type to open its reference

3. **Explore Table Details**:
   - Use the four sub-tabs to explore different aspects of the table
   - Select fields in the Fields tab to generate queries
   - Follow join relationships to explore related tables

### Common Workflows

#### Workflow 1: Exploring a New Record Type
1. Search for the record type in the Table Explorer
2. Click to open the table reference
3. Review the Overview tab to understand the record type
4. Check the Fields tab to see available data
5. Use the Joins tab to understand relationships

#### Workflow 2: Building a Query
1. Open the table reference for your main table
2. Go to the Fields tab
3. Select the fields you need
4. Click "Query" to generate a SELECT statement
5. Modify the generated query as needed
6. Execute the query

#### Workflow 3: Understanding Relationships
1. Open a table reference
2. Go to the Joins tab
3. Click on related table names to explore them
4. Build complex queries using the relationship information

### Best Practices

#### Performance:
- Use search to quickly find specific record types
- Close unused table reference tabs to conserve memory
- Cache is automatically managed, but refreshing the page clears it

#### Query Building:
- Start with the Fields tab to understand available data
- Use the Overview tab to understand permissions and features
- Check the Joins tab before building complex multi-table queries

#### Navigation:
- Use the tab system to keep multiple table references open
- Table reference tabs integrate with query tabs seamlessly
- Use browser back/forward buttons for navigation history

---

## Troubleshooting

### Common Issues

#### Table Explorer Not Loading
**Symptoms**: Categories remain empty or show loading indefinitely
**Solutions**:
- Check network connectivity
- Verify user permissions for Records Catalog access
- Refresh the page to clear any cached errors
- Check browser console for error messages

#### Search Not Working
**Symptoms**: Search box doesn't filter results
**Solutions**:
- Ensure categories are expanded and loaded
- Try clearing the search box and typing again
- Check for JavaScript errors in browser console

#### Table Reference Tabs Not Opening
**Symptoms**: Clicking record types doesn't open tabs
**Solutions**:
- Verify the record type has loaded properly
- Check for JavaScript errors
- Try refreshing the page and reopening

#### Missing Field Information
**Symptoms**: Fields tab shows limited information
**Solutions**:
- This is expected for some record types with limited metadata
- Check the record type permissions in NetSuite
- Some custom fields may not be available through the API

### Error Messages

#### "Failed to fetch record types"
- Network connectivity issue or API unavailable
- Try refreshing the page
- Check NetSuite system status

#### "No data available"
- Record type may not have queryable fields
- Check record type permissions
- Some record types may not be accessible via SuiteQL

#### "Error loading table data"
- Specific record type may have access restrictions
- Try a different record type to verify functionality
- Check user permissions for the specific record type

---

## Limitations and Future Enhancements

### Current Limitations (Release 1.3.0)

1. **Functions and Procedures**: Categories are placeholders for future implementation
2. **Preview Data**: Currently generates queries instead of showing actual data preview
3. **Row Counts**: Not available in overview section
4. **Custom Field Metadata**: Limited by Records Catalog API capabilities
5. **Bulk Operations**: No bulk selection or export capabilities

### Planned Enhancements

#### Release 1.4.0:
- JavaScript Functions integration with file cabinet
- Stored Procedures support
- Enhanced preview with actual data display
- Export capabilities for field definitions

#### Future Releases:
- Custom field creation workflow
- Record type comparison tools
- Advanced relationship visualization
- Integration with NetSuite's Schema Browser

---

## API Reference

### JavaScript Functions

#### Global Functions Available:
- `loadTableExplorerData(categoryName)`: Load data for a specific category
- `openTableReferenceTab(tableId, tableName)`: Open a table reference tab
- `filterTableExplorer(searchTerm)`: Filter the table explorer
- `generateFieldQuery()`: Generate query from selected fields

#### Event Handlers:
- `toggleTableCategory(categoryName)`: Expand/collapse categories
- `updateFieldSelection()`: Update field selection state
- `switchTableReferenceSubTab(tabId, subTabName)`: Switch sub-tabs

### CSS Classes

#### Table Explorer:
- `.table-explorer-section`: Main container
- `.table-explorer-search`: Search box container
- `.table-explorer-tree`: Category tree container
- `.table-explorer-item`: Individual record type items

#### Table Reference:
- `.table-reference-container`: Main tab container
- `.table-reference-subtabs`: Sub-tab navigation
- `.table-reference-content`: Content area

---

## Record Family Examples

Based on NetSuite's actual record family classifications:

### **System Record Families**:
- **ENTITY**: Employee, Customer, Vendor, Contact, Lead, Partner
- **TRANSACTION**: Sales Order, Invoice, Purchase Order, Bill, Journal Entry
- **ITEM**: Inventory Item, Service Item, Non-Inventory Item, Kit Item
- **ACTIVITY**: Task, Event, Phone Call, Campaign
- **SUPPORT**: Case, Solution, Issue
- **OTHER**: Various other standard NetSuite record types

### **Custom Record Families**:
- **CUSTOM**: Custom record types (customrecord_*)
- **CUSTOMLIST**: Custom lists (customlist_*)

### **Example Hierarchy**:
```
📊 SYSTEM
  ├── ENTITY (15)
  │   ├── Employee
  │   ├── Customer
  │   └── Vendor
  ├── TRANSACTION (12)
  │   ├── Sales Order
  │   └── Invoice
  └── ITEM (8)
      ├── Inventory Item
      └── Service Item

📁 CUSTOM
  ├── CUSTOM (5)
  │   ├── Employee Data
  │   └── Project Tracking
  └── CUSTOMLIST (3)
      ├── Department List
      └── Priority List
```

This hierarchical structure reflects NetSuite's actual record family classifications, with Origin as the primary classification and Record Family as the logical sub-grouping within each origin category.

---

## Support and Feedback

For issues, questions, or feature requests related to the Table Reference functionality:

1. **Check the troubleshooting section** in this documentation
2. **Review the test script** for expected behavior
3. **Check browser console** for error messages
4. **Document the issue** with steps to reproduce

The Table Reference functionality represents a significant enhancement to the Enhanced SuiteQL Query Tool, providing users with unprecedented access to NetSuite's data structure and relationships.
