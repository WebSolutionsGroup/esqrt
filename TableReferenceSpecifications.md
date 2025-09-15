I would like to table reference functionality to the tool, that will allow users to browse available "tables" and "fields" in the NetSuite database, and view documentation for each table and field.  This will be a searchable and filterable interface that will allow users to quickly find the information they need.  The interface should also allow users to view the data type, length, and other relevant information for each field.  The interface should also allow users to view the relationships between tables, and the fields that are available in each table.

I would like the functionality to be clean and logically rendered in a way that is easy to understand and use. I would like the interface to be searchable and filterable.

I would like you to take special care to ensure that the interface is as performant as possible, and that it does not cause any issues with the NetSuite platform and ensure that it is modular, extensible, and maintainable. Also ensure that it utilizes the same methods and patterns as the rest of the tool. Also be careful not to introduce any string literals in the code that would cause rendering issues with the Netsuite Suitescript engine, and that it is fully configurable and customizable.

To begin, in the left panel, I would like a "Table Explorer" section that contains a list of all available tables.  The list should be searchable and filterable.  When a user clicks on a table, a new tab should be opened in the main panel that displays the documentation for that table. With subtabs for each of the following:

1. Overview
2. Fields
3. Joins
4. Preview

The "Overview" tab should contain information about a table as seen in the sample graphical design.
The "Fields" tab should contain a list of all fields available in the table as seen in the sample graphical design.
The "Joins" tab should contain a list of all tables that are related to the current table as seen in the sample graphical design.
The "Preview" tab should contain a preview of the data in the table as seen in the sample graphical design.

I would like to use the same methods utilzed by the legacy SuiteQL Query tool - found in the root directory: suiteql-query-tool.v20211027.suitelet.js

Here is a sample overview of how the legacy tool is using Netsuite's endpoints:

It relies on NetSuite's internal Records Catalog API endpoints (exposed via URLs like /app/recordscatalog/rcendpoint.nl). These endpoints return JSON data about NetSuite's record types and their structure. The metadata is fetched dynamically via XHR (XMLHttpRequest) calls in client-side JavaScript embedded in the HTML output of the Suitelet.
Below, I'll break down how the Tables Reference works, focusing on how it retrieves the list of tables and columns. I'll reference relevant parts of the script for clarity.

1. Entry Point for Tables Reference

When the user clicks the "Tables Reference" button in the main UI, it triggers the JavaScript function tablesReferenceOpen() (defined in jsFunctiontablesReferenceOpen()):
javascriptfunction tablesReferenceOpen() {		
    window.open( "${scriptURL}&function=tablesReference", "_tablesRef" );			
}

This opens a new window/tab pointing to the Suitelet's URL with the query parameter &function=tablesReference.


On the server side, in getRequestHandle(context), this parameter routes to htmlGenerateTablesReference(context):

This function creates a NetSuite form (serverWidget.createForm) with an INLINEHTML field containing Bootstrap-styled HTML, CSS, and JavaScript.
The HTML sets up a two-column layout:

Left: "tablesColumn" (initially "Loading Tables Index...").
Right: "tableInfoColumn" (for selected table details).


It includes external libraries (e.g., Bootstrap, jQuery, DataTables for sorting/searching).
Embedded JavaScript calls tableNamesGet() on load to populate the tables list.



2. Fetching the List of All "Tables" (Record Types)

This is handled by the JavaScript function tableNamesGet() (defined in jsFunctionTableNamesGet()).
API Call:

It makes an XHR GET request to NetSuite's Records Catalog endpoint:
javascriptvar url = '/app/recordscatalog/rcendpoint.nl?action=getRecordTypes&data=' + encodeURI( JSON.stringify( { structureType: 'FLAT' } ) );

Endpoint Breakdown:

/app/recordscatalog/rcendpoint.nl: NetSuite's internal API for querying the Records Catalog (a metadata repository of all record types in the account).
action=getRecordTypes: Specifies the action to retrieve a list of record types.
data=...: JSON-encoded parameters, including structureType: 'FLAT', which requests a flat list of record types (without hierarchical structure).


This endpoint returns a JSON response with an array of record types (e.g., [{ id: 'employee', label: 'Employee' }, ...]).


No authentication needed beyond the user's session: Since this runs in the browser context of a logged-in NetSuite user, it leverages the existing session.


Processing the Response:

On successful response (status 200), it parses the JSON: let recordTypes = JSON.parse( xhr.response ).data;.
It builds an HTML table (#tableNamesTable) in the "tablesColumn" div:

Each row shows the table's label (e.g., "Employee") as a bold link and its ID (e.g., "employee") below it.
The link has an onclick handler: tableDetailsGet('employee') to load details for that table.


If DataTables is enabled (datatablesEnabled = true in the script), it initializes DataTables on the table for sorting/searching: $('#tableNamesTable').DataTable();.
Error handling: If the request fails (non-200 status), it shows an error message.


What Counts as a "Table"?

In SuiteQL, "tables" are NetSuite record types (e.g., Employee, Transaction, Item) that are queryable.
This endpoint returns all queryable record types in the account, including standard ones (e.g., Employee) and custom records (e.g., customrecord_mytype).
The list is comprehensive but filtered to SuiteQL-compatible types (based on NetSuite's Records Catalog).



3. Fetching "Columns" (Fields) and Other Details for a Specific Table

When a table is selected (e.g., clicking "Employee"), it triggers tableDetailsGet(tableName) (defined in jsFunctionTableDetailsGet()).
API Call:

It makes another XHR GET request to the Records Catalog endpoint:
javascriptvar url = '/app/recordscatalog/rcendpoint.nl?action=getRecordTypeDetail&data=' + encodeURI( JSON.stringify( { scriptId: tableName, detailType: 'SS_ANAL' } ) );

Endpoint Breakdown:

action=getRecordTypeDetail: Retrieves detailed metadata for a specific record type.
data=...: JSON parameters:

scriptId: tableName (e.g., "employee" – the internal ID of the record type).
detailType: 'SS_ANAL': Specifies "SuiteAnalytics" detail level, which includes SuiteQL-relevant info (fields, joins, etc.).




Response: JSON with data containing the record type details, including:

label: Human-readable name (e.g., "Employee").
fields: Array of field objects (these are the "columns").
joins: Array of join objects (relationships to other tables).






Processing the Response:

Parses the JSON: let recordDetail = JSON.parse( xhr.response ).data;.
Builds HTML content for the "tableInfoColumn":

Header: Table label and ID (e.g., "Employee (employee)").
Columns Section:

A table (#tableColumnsTable) listing fields where field.isColumn is true (indicating it's queryable in SuiteQL).
Columns: Label (e.g., "Last Name"), Name/ID (e.g., "lastname"), Type (e.g., "TEXT").
Iterates over recordDetail.fields and filters for isColumn: true.
Initializes DataTables if enabled.


Joins Section (if recordDetail.joins.length > 0):

A table (#tableJoinsTable) with: Label, Table Name (linked to load that table's details), Cardinality (e.g., "MANY_TO_ONE"), Join Pairs (e.g., field mappings like "entityid").


Sample Query:

Generates a textarea with a sample SELECT query listing all columns (e.g., SELECT\n\temployee.id,\n\temployee.lastname,\n... FROM\n\temployee\n).
Includes a "Click here to copy the query" link that triggers tableQueryCopy() (selects and copies the textarea content).




Error handling: Alerts on non-200 status.



4. Key Observations and Limitations

Data Source: The metadata comes from NetSuite's Records Catalog, not direct database introspection (e.g., no information_schema queries). This ensures it's accurate for the current account's configuration (including enabled features, custom fields, and bundles).
Client-Side Execution: All fetching happens in the browser via XHR, making it interactive and fast. No server-side processing for the Tables Reference beyond rendering the initial HTML.
Caching/Nonce: No explicit caching; requests are fresh each time. (Note: The remote library index uses a nonce for cache-busting, but not here.)
Dependencies:

Requires a logged-in NetSuite session with access to the Records Catalog (standard for most roles).
Uses external CDNs for jQuery, Bootstrap, and DataTables (configurable via datatablesEnabled).


Potential Issues:

If the Records Catalog endpoints change (rare, but NetSuite internal), this could break.
Custom records are included if they're queryable.
No filtering for deprecated/obsolete fields; it shows what's in the catalog.
Performance: For accounts with thousands of custom fields, the details table could be large, but DataTables helps with pagination/search.


Script Variables Involved:

datatablesEnabled = true: Enables sortable/searchable tables.
No direct SuiteQL involvement here – it's all API-based.