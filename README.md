# Enhanced SuiteQL Query Tool (ESQRT) v1.2.0

A modern, feature-rich SuiteQL query interface for NetSuite, inspired by contemporary database management tools. This tool provides an enhanced user experience for writing, executing, and managing SuiteQL queries with advanced features like syntax highlighting, query history, export capabilities, synthetic SQL functions, stored procedures, and comprehensive DML operations.

[![NetSuite](https://img.shields.io/badge/NetSuite-Compatible-blue.svg)](https://www.netsuite.com/)
[![SuiteScript](https://img.shields.io/badge/SuiteScript-2.1-green.svg)](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4387799721.html)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🆕 What's New in v1.2.0 - Major DML & Synthetic SQL Release

### 🚀 Synthetic SQL Functions & Stored Procedures
- **JavaScript-Based Functions**: Create custom SQL functions stored in NetSuite File Cabinet
- **Stored Procedures**: Implement complex business logic with parameterized procedures
- **Inline Execution**: Call functions and procedures directly in SuiteQL queries
- **Dynamic Registry**: Automatic discovery and registration of custom functions/procedures

### 🛠 Complete DML Operations Suite
- **INSERT Operations**: Full INSERT support with preview/commit safety model
- **UPDATE Operations**: Comprehensive UPDATE with compound WHERE conditions
- **DELETE Operations**: Safe DELETE operations with preview mode
- **Preview Mode**: All DML operations default to safe preview mode
- **Commit Mode**: Explicit COMMIT keyword required for actual data changes

### 🔧 Advanced WHERE Clause Support
- **Compound Conditions**: Support for complex AND/OR logic in WHERE clauses
- **Boolean Field Handling**: Proper conversion for NetSuite boolean fields
- **IS NULL/IS NOT NULL**: Complete null condition support
- **Custom List Operations**: Full DML support for NetSuite custom lists

[📋 View Complete Release Notes](RELEASE_NOTES_v1.2.0.md)

## 🚀 Features Overview

### Modern User Interface
- **Split-Pane Layout**: Resizable three-panel interface with query editor, history sidebar, and results viewer
- **Syntax Highlighting**: CodeMirror integration with SQL syntax highlighting and line numbers
- **Dark Mode Support**: Toggle between light and dark themes for comfortable coding
- **Responsive Design**: Bootstrap-based responsive interface that works across devices

### Query Editor Enhancements
- **Auto-Complete**: Intelligent context-aware suggestions for SQL keywords and NetSuite objects
- **Syntax Highlighting**: SQL syntax highlighting with line numbers
- **Query Validation**: Real-time error highlighting and validation
- **Bracket Matching**: Automatic bracket and parentheses matching
- **Keyboard Shortcuts**: Ctrl+Space for auto-complete, Ctrl+R for query execution

### Query Management
- **Query History**: Sidebar panel showing recent executed queries with click-to-load functionality
- **Saved Queries**: Save and load queries with custom record integration

### Results & Export
- **Advanced CSV Export**: Comprehensive CSV export with customizable delimiters, encoding, line endings, and presets
- **Multiple Export Formats**: CSV, JSON, PDF, and HTML export options
- **Sortable Result Tables**: Click column headers to sort data ascending/descending
- **DataTables Integration**: Enhanced table display with sorting, searching, and pagination
- **Copy to Clipboard**: One-click data copying functionality
- **Performance Metrics**: Query execution time and record count display

### Advanced Features
- **Multi-Tab Interface**: Advanced tab management with individual state persistence and smart numbering
- **Virtual Views**: Support for custom view definitions using #viewname syntax
- **Pagination Control**: Configurable result pagination with row range selection
- **Custom Records Integration**: Full NetSuite custom record support for saved queries and history

### Synthetic SQL Extensions
- **Custom Functions**: JavaScript-based SQL functions with inline execution
- **Stored Procedures**: Complex business logic procedures with parameter support
- **Dynamic Registry**: Automatic function/procedure discovery and registration
- **File Cabinet Integration**: Functions and procedures stored as JavaScript files

### Data Manipulation Language (DML)
- **Complete DML Suite**: INSERT, UPDATE, DELETE operations for NetSuite records
- **Safety-First Design**: All operations default to preview mode for data protection
- **Compound WHERE Clauses**: Support for complex AND/OR conditions
- **Custom List Support**: Full DML operations for NetSuite custom lists
- **Boolean Field Handling**: Proper conversion for NetSuite boolean field types
- **Modular Architecture**: Clean, maintainable codebase with separated concerns

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [User Interface](#-user-interface)
- [Query Features](#-query-features)
- [DML Operations](#-dml-operations)
- [Synthetic SQL](#-synthetic-sql)
- [Custom Records Setup](#-custom-records-setup)
- [Architecture](#-architecture)
- [Development](#-development)
- [Roadmap](#️-roadmap)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Credits](#-credits)

## 🛠 Installation

### Prerequisites
- NetSuite Administrator access
- SuiteCloud Development Framework (SDF) installed (optional for CLI deployment)

### Option 1: SuiteCloud CLI Deployment (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/WebSolutionsGroup/esqrt.git
   cd esqrt
   ```

2. **Set up project configuration files**:

   The repository excludes environment-specific configuration files. You'll need to create these files with your own NetSuite account details:

   **Create `project.json` in the root directory:**
   ```json
   {
       "defaultAuthId": "your-account-id"
   }
   ```

   **Create `src/project.json` in the src directory:**
   ```json
   {
       "defaultAuthId": "your-account-id"
   }
   ```

   > **Note**: These files are excluded from version control because they contain environment-specific authentication references. Replace `"your-account-id"` with your actual NetSuite account authentication ID.

3. **Configure authentication**:
   ```bash
   # Set up your NetSuite authentication
   suitecloud account:setup
   ```

4. **Deploy to NetSuite**:
   ```bash
   # Validate the project
   suitecloud project:validate

   # Deploy to NetSuite
   suitecloud project:deploy
   ```

### Option 2: Manual Deployment

1. **Upload the script file**:
   - Upload `src/FileCabinet/SuiteScripts/EnhancedSuiteQLTool/enhancedSuiteQLQueryTool.js` to File Cabinet
   - Place it under `/SuiteScripts/EnhancedSuiteQLTool/`
   - Upload the entire `lib/` folder structure to maintain modular architecture

2. **Import script record**:
   - Import the script record from `src/Objects/customscript_suiteql_query_tool_enhanced.xml`
   - Or manually create a Suitelet script record pointing to the uploaded file

3. **Create deployment**:
   - Create a script deployment with appropriate permissions
   - Set the status to "Released"

### Option 3: Custom Records Setup (Optional but Recommended)

For advanced features like saved queries, set up the custom records:

1. **Import custom records**:
   - Import all XML files from `src/Objects/` directory
   - This includes custom record types and custom lists

2. **Set permissions**:
   - Configure role permissions for the custom records
   - See [Custom Records Setup](#-custom-records-setup) for detailed instructions

## 🚀 Quick Start

1. **Access the tool**:
   - Navigate to the script deployment URL in NetSuite
   - Or add it to a role's custom links for easy access

2. **Write your first query**:
   ```sql
   SELECT
       id,
       companyname,
       email
   FROM Customer
   WHERE isinactive = 'F'
   LIMIT 10
   ```

3. **Execute the query**:
   - Click "Run Query" or press Ctrl+R (Windows/Linux) or Cmd+R (Mac)
   - View results in the results panel

4. **Explore the welcome screen**:
   - The tool displays a helpful welcome panel on first load
   - Click "Load a sample query" to get started with an example
   - Review the "Getting Started" and "Key Features" sections
   - Notice the attribution to Tim Dietrich's original work in the footer

5. **Explore features**:
   - Use keyboard shortcuts (Ctrl+R/Cmd+R to run queries, Ctrl+Space/Cmd+Space for auto-complete)
   - Toggle dark mode for comfortable viewing
   - Export results in different formats
   - Save frequently used queries (if custom records are set up)

## ⚙️ Configuration

### Script Configuration Variables

The tool includes several configuration options in `lib/core/constants.js`:

```javascript
var CONFIG = {
    // Feature toggles
    DATATABLES_ENABLED: false,        // Enable DataTables for result display
    REMOTE_LIBRARY_ENABLED: true,     // Enable remote query library access
    TOOL_UPGRADES_ENABLED: true,      // Enable automatic tool upgrades
    WORKBOOKS_ENABLED: false,         // Enable workbooks integration

    // Default settings
    ROWS_RETURNED_DEFAULT: 25,        // Default number of rows to return
    QUERY_FOLDER_ID: null,            // File Cabinet folder for saved queries

    // Version information
    VERSION: 'v1.1.0'
};
```

### Configuration Options

| Setting | Description | Default | Status | Impact |
|---------|-------------|---------|---------|---------|
| `DATATABLES_ENABLED` | Enables enhanced table display | `false` | ⚠️ Partial | Code exists but disabled by default |
| `REMOTE_LIBRARY_ENABLED` | Allows remote query libraries | `true` | ❌ Not Implemented | Shows button but no backend |
| `ROWS_RETURNED_DEFAULT` | Default pagination size | `25` | ✅ Working | Initial value for row limit |
| `QUERY_FOLDER_ID` | File Cabinet folder for queries | `null` | ✅ Working | Enables local query save/load |
| `WORKBOOKS_ENABLED` | Enables saved search integration | `false` | ✅ Working | Shows "Workbooks" button and functionality |

> **Note**: Some features are configured but not fully implemented. Enable with caution and test thoroughly.

## 🖥 User Interface

### Layout Structure

The interface consists of three main areas in a responsive split-pane layout:

#### 1. Sidebar Panel (Left)
- **Query History Section**: Expandable section with recent executed queries
  - Last 10 executed queries with timestamps
  - Click any history item to load it into the editor
  - Query preview shows first 60 characters of each query
- **Saved Queries Section**: Expandable section with saved query library
  - Store and organize frequently used queries
  - Support for tags and descriptions
  - Click to load saved queries into the editor

#### 2. Query Editor Panel (Center Top)
- **CodeMirror Editor**: Syntax-highlighted SQL editor with line numbers
- **Intelligent Auto-Complete**: Context-aware suggestions for SQL keywords, NetSuite tables, and fields
- **Cross-Platform Shortcuts**: Mac (Cmd) and Windows/Linux (Ctrl) keyboard shortcuts
- **Syntax Highlighting**: SQL keywords, strings, and comments highlighted
- **Query Validation**: Real-time error highlighting and bracket matching
- **Advanced Tab Management**: Multiple query tabs with individual state persistence and smart numbering

#### Advanced Tab Management Features

The Enhanced SuiteQL Query Tool provides sophisticated tab management capabilities:

**Tab Creation & Management:**
- **Add Tab Button**: Easy creation of new query tabs with "+" button positioned after existing tabs
- **Smart Tab Numbering**: Tab counter resets to 1 when all tabs are closed, rather than continuing from stored values
- **Individual Tab States**: Each tab maintains its own query content, results, and UI state independently

**Tab Content Persistence:**
- **Automatic Content Saving**: Tab content automatically saved to localStorage on every change
- **Result State Preservation**: Query results, copy button visibility, and welcome message state preserved per tab
- **Session Recovery**: Tab states restored when returning to the application
- **Blank New Tabs**: New tabs start with empty content for immediate query writing

**Tab Switching & Isolation:**
- **Seamless Tab Switching**: Switch between tabs without losing content or results
- **Isolated Results**: Each tab displays its own query results independently
- **State Restoration**: Previous query results and UI state restored when switching back to a tab

#### 3. Results Panel (Center Bottom)
- **Welcome Screen**: Professional welcome panel displayed on first load with:
  - Getting Started guide with sample query link
  - Key Features overview
  - Attribution to Tim Dietrich's original work
- **Results Display**: Query results in table, CSV, JSON, or custom format
- **Export Options**: Multiple export format buttons
- **Performance Metrics**: Execution time and record count
- **Pagination Controls**: Navigate through large result sets

### Toolbar Features

#### Primary Actions
- **Run Query** (Alt+R): Execute the current query
- **Toggle Dark Mode**: Switch between light and dark themes
- **Close All Tabs**: Close all open query tabs

#### Library Actions
- **Saved Queries**: Access saved query library (✅ Working)

#### Planned Features (Not Yet Implemented)
- **Tables Reference**: Open NetSuite schema reference (❌ Planned)
- **Remote Library**: Access remote query collections (❌ Planned)
- **Workbooks**: Load saved searches as SuiteQL (❌ Planned)

#### View Controls
- **Hide/Show Panels**: Collapse panels for more space
- **Format Options**: Choose result display format
- **Zoom Controls**: Adjust interface zoom level

## 🔍 Query Features

### Auto-Complete & Editor Features

The CodeMirror editor provides intelligent auto-complete and enhanced editing capabilities:

#### Auto-Complete System
- **Status**: Currently disabled in v1.2.0 - will be enhanced in future releases
- **Planned Features**: Context-aware suggestions based on SQL context
- **Future Capabilities**:
  - SQL Keywords: SELECT, FROM, WHERE, JOIN, ORDER BY, GROUP BY, and more
  - NetSuite Tables: Employee, Customer, Vendor, Transaction, Item, and 30+ more
  - NetSuite Fields: ID, Name, Email, TranDate, Amount, and 40+ common fields
  - SQL Functions: COUNT, SUM, AVG, BUILTIN.DF, TO_CHAR, and more
  - Synthetic Functions: Custom JavaScript functions and stored procedures
  - Automatic Triggering: Auto-complete will appear after keywords or when typing
  - Manual Triggering: Ctrl+Space for suggestions

#### Syntax Highlighting
- **SQL Keywords**: SELECT, FROM, WHERE, ORDER BY, GROUP BY, HAVING highlighted in blue
- **Strings**: Text strings highlighted in green
- **Comments**: SQL comments highlighted in gray
- **Numbers**: Numeric values highlighted in orange
- **Line Numbers**: Displayed on the left margin

#### Editor Features
- **Bracket Matching**: Automatic matching of parentheses and brackets (✅ Working)
- **Smart Indentation**: Intelligent indentation for nested queries (✅ Working)
- **Line Wrapping**: Long lines wrap for better readability (✅ Working)
- **Basic Search**: Browser-based find functionality (Ctrl+F) (⚠️ Limited - advanced search/replace planned)

#### Keyboard Shortcuts

The tool includes comprehensive cross-platform keyboard shortcuts for efficient query development:

**Query Execution:**
- **Ctrl+R** (Windows/Linux) or **Cmd+R** (Mac) - Execute the current query
- **Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac) - Execute query (alternative)
- **F5** - Execute query (works on all platforms)

**File Operations:**
- **Ctrl+S** (Windows/Linux) or **Cmd+S** (Mac) - Save current query
- **Ctrl+O** (Windows/Linux) or **Cmd+O** (Mac) - Open/load query

**Auto-Complete:**
- **Ctrl+Space** (Windows/Linux) or **Cmd+Space** (Mac) - Trigger auto-complete suggestions

**Interface Navigation:**
- **Escape** - Close open modals or panels
- **Click title** - Load sample query (click "ENHANCED SUITEQL QUERY TOOL" in header)

**Standard Editor Features:**
- **Tab** - Smart indentation
- **Ctrl+A** (Windows/Linux) or **Cmd+A** (Mac) - Select all text
- **Ctrl+Z** (Windows/Linux) or **Cmd+Z** (Mac) - Undo
- **Ctrl+Y** (Windows/Linux) or **Cmd+Y** (Mac) - Redo

#### Auto-Complete Usage Examples

**Manual Triggering:**
- **Windows/Linux**: Press **Ctrl+Space** anywhere in the editor
- **Mac**: Press **Cmd+Space** anywhere in the editor

**Context-Aware Suggestions:**
- Type `SELECT ` and auto-complete will suggest field names
- Type `FROM ` and auto-complete will suggest table names
- Type `WHERE ` and auto-complete will suggest fields and operators
- Type `ORDER BY ` and auto-complete will suggest fields and ASC/DESC

**Automatic Triggering:**
- Auto-complete appears automatically after SQL keywords
- Suggestions appear when typing 2+ characters of a word
- Press **Escape** to close suggestions, **Enter** to accept

### Mac Compatibility

The Enhanced SuiteQL Query Tool is fully compatible with Mac systems:

#### **Mac-Specific Features:**
- **Native Mac Shortcuts**: All keyboard shortcuts use Cmd instead of Ctrl on Mac
- **Automatic Detection**: The tool automatically detects Mac systems and adjusts shortcuts
- **Safari Compatibility**: Fully tested and compatible with Safari browser
- **CodeMirror Integration**: Auto-complete and syntax highlighting work seamlessly on Mac

#### **Mac Keyboard Shortcuts:**
- **Cmd+Space**: Trigger auto-complete (instead of Ctrl+Space)
- **Cmd+R**: Execute query (instead of Ctrl+R)
- **Cmd+Enter**: Execute query alternative (instead of Ctrl+Enter)
- **Cmd+S**: Save query (instead of Ctrl+S)
- **Cmd+O**: Open query (instead of Ctrl+O)
- **F5**: Execute query (works the same on Mac)

#### **Browser Recommendations for Mac:**
- **Safari**: Fully supported and recommended
- **Chrome**: Excellent compatibility
- **Firefox**: Good compatibility
- **Edge**: Good compatibility

> **Note**: The tool automatically detects your operating system and uses the appropriate keyboard shortcuts. Mac users will see Cmd-based shortcuts, while Windows/Linux users will see Ctrl-based shortcuts.

### Virtual Views System

Create reusable query components using the `#viewname` syntax:

#### Example Usage
```sql
-- Create a view file named "active_employees.sql"
SELECT ID, FirstName, LastName, Email
FROM Employee
WHERE IsInactive = 'F'

-- Use the view in your main query
SELECT * FROM (#active_employees)
WHERE Email LIKE '%@company.com'
```

#### Benefits
- **Code Reusability**: Define common query patterns once
- **Maintainability**: Update view definitions in one place
- **Complex Queries**: Build complex queries from simpler components
- **Team Collaboration**: Share common views across team members through file sharing

### Advanced Query Features

#### Dynamic Queries
```sql
-- Use hard-coded values for dynamic queries (parameterized queries planned for future release)
SELECT * FROM Transaction
WHERE TranDate BETWEEN '2024-01-01' AND '2024-12-31'
AND Entity = 123
```

#### Nested Queries Support
```sql
-- Complex nested queries with proper formatting
SELECT
    e.FirstName,
    e.LastName,
    (SELECT COUNT(*) FROM Transaction t WHERE t.Entity = e.ID) as TransactionCount
FROM Employee e
WHERE e.ID IN (
    SELECT DISTINCT Entity
    FROM Transaction
    WHERE TranDate >= ADD_MONTHS(SYSDATE, -12)
)
```

### Export & Results

#### Export Formats

1. **Table Format (Default)**
   - Sortable columns with click-to-sort functionality
   - DataTables integration with sorting and searching
   - Pagination for large result sets
   - Copy to clipboard functionality

2. **Advanced CSV Export**
   - Comprehensive CSV configuration modal with customizable options
   - Multiple export presets: Standard, Excel Compatible, Tab Delimited, Semicolon, Pipe
   - Configurable delimiters, quote characters, line endings, and encoding
   - International encoding support (UTF-8, UTF-16, Windows-1252, etc.)
   - Persistent configuration settings saved to localStorage

3. **JSON Export**
   - Pretty formatted JSON for readability
   - Complete data with all fields preserved
   - API-ready format

4. **PDF Export**
   - Professional formatting with NetSuite templates
   - Multi-page support for large datasets
   - Company branding support

5. **HTML Export**
   - Web-ready format with clean styling
   - Print-friendly optimization
   - Email-ready reports

#### Advanced CSV Export Features

The Enhanced SuiteQL Query Tool includes a comprehensive CSV export system with professional-grade configuration options:

**Export Presets:**
- **Standard CSV**: RFC 4180 compliant format with comma delimiters
- **Excel Compatible**: Optimized for Microsoft Excel with CRLF line endings and BOM
- **Tab Delimited**: Tab-separated values for data analysis tools
- **Semicolon Delimited**: European CSV format using semicolons
- **Pipe Delimited**: Pipe-separated format for specialized applications

**Customizable Options:**
- **Delimiters**: Comma, Semicolon, Tab, Pipe, Space, or custom characters
- **Quote Characters**: Double quote, single quote, or no quoting
- **Line Endings**: Unix (LF) or Windows (CRLF) line endings
- **Encoding Support**: UTF-8, UTF-16, Windows-1252, ISO-8859-1, and international encodings
- **Header Control**: Include or exclude column headers
- **Configuration Persistence**: Settings saved to localStorage for consistent exports

#### Performance Features
- **Execution Time**: Displays query execution time in milliseconds
- **Record Count**: Shows number of records returned
- **Memory Optimization**: Efficient handling of large datasets
- **Pagination**: Configurable row ranges and infinite scrolling

## 🛠 DML Operations

The Enhanced SuiteQL Query Tool provides comprehensive Data Manipulation Language (DML) operations that allow you to safely modify NetSuite data using familiar SQL syntax.

### Safety-First Design

All DML operations follow a **safety-first approach**:
- **Preview Mode (Default)**: All operations default to preview mode showing what would be changed
- **Explicit Commit**: Add `COMMIT` keyword to actually modify data
- **Clear Instructions**: Preview mode provides clear instructions for committing changes
- **Consistent Styling**: Light orange warnings for preview, green success for commits

### INSERT Operations

Create new records and custom list values using standard SQL INSERT syntax.

#### Basic INSERT Syntax
```sql
-- Preview mode (default) - shows what would be inserted
INSERT INTO customrecord_test SET name = 'New Record', active = true;

-- Commit mode - actually creates the record
INSERT INTO customrecord_test SET name = 'New Record', active = true COMMIT;
```

#### Multiple Values INSERT
```sql
-- Insert multiple custom list values
INSERT INTO customlist_categories (name, externalid) VALUES
    ('Category 1', 'cat_001'),
    ('Category 2', 'cat_002'),
    ('Category 3', 'cat_003') COMMIT;
```

### UPDATE Operations

Modify existing records with support for complex WHERE conditions.

#### Basic UPDATE Syntax
```sql
-- Preview mode - shows what would be updated
UPDATE customer SET active = true WHERE id = 123;

-- Commit mode - actually updates the record
UPDATE customer SET active = true WHERE id = 123 COMMIT;
```

#### Complex WHERE Conditions
```sql
-- Compound conditions with AND/OR logic
UPDATE employee SET department = 'Engineering', active = true
WHERE (title LIKE '%Developer%' OR title LIKE '%Engineer%')
  AND hiredate >= '2024-01-01'
  AND isinactive = false COMMIT;
```

#### Boolean Field Handling
```sql
-- Automatic boolean conversion for NetSuite fields
UPDATE customrecord_test SET
    isinactive = false,    -- Converted to boolean false
    active = true,         -- Converted to boolean true
    processed = 'F'        -- String values also supported
WHERE externalid IS NOT NULL;
```

### DELETE Operations

Safely remove records with preview mode protection.

#### Basic DELETE Syntax
```sql
-- Preview mode - shows what would be deleted
DELETE FROM customrecord_temp WHERE created < '2024-01-01';

-- Commit mode - actually deletes the records
DELETE FROM customrecord_temp WHERE created < '2024-01-01' COMMIT;
```

#### Complex DELETE Conditions
```sql
-- Delete with complex WHERE clause
DELETE FROM customlist_old_data
WHERE (category = 'obsolete' OR status = 'inactive')
  AND last_used < '2023-01-01'
  AND isinactive = true COMMIT;
```

### Supported Record Types

DML operations work with:
- **Standard NetSuite Records**: Customer, Vendor, Employee, Item, etc.
- **Custom Records**: Any custom record type
- **Custom Lists**: Custom list values and properties
- **Transaction Records**: Sales Orders, Purchase Orders, Invoices, etc.

### WHERE Clause Features

- **Comparison Operators**: =, !=, <, >, <=, >=
- **Pattern Matching**: LIKE with wildcards (%, _)
- **List Matching**: IN (value1, value2, value3)
- **Null Conditions**: IS NULL, IS NOT NULL
- **Boolean Logic**: AND, OR with proper precedence
- **Parentheses Grouping**: Complex condition grouping
- **Date Comparisons**: Full date/datetime comparison support

## 🚀 Synthetic SQL

Extend NetSuite's SuiteQL with custom JavaScript-based functions and stored procedures.

### Synthetic Functions

Create custom SQL functions using JavaScript that can be called inline in queries.

#### Creating Functions
```sql
CREATE OR REPLACE FUNCTION standardize_country_name AS
function standardize_country_name(context) {
    var country_code = context.params.country_code || '';

    var countryMap = {
        'US': 'United States',
        'CA': 'Canada',
        'UK': 'United Kingdom',
        'DE': 'Germany',
        'FR': 'France'
    };

    return countryMap[country_code] || country_code;
}
```

#### Using Functions in Queries
```sql
-- Use function in SELECT clause with column values
SELECT
    customer,
    standardize_country_name(country) AS country_full_name
FROM customers
WHERE country IN ('US', 'CA', 'UK');

-- Use function with literal values
SELECT standardize_country_name('US') AS country FROM Dual;

-- Access object properties from function results
SELECT
    customer,
    parse_full_address(billing_address).city AS billing_city,
    parse_full_address(billing_address).state AS billing_state
FROM customers;

-- Use functions in WHERE clauses
SELECT * FROM customers
WHERE standardize_country_name(country) = 'United States';
```

#### Function Features
- **JavaScript Implementation**: Full JavaScript language support
- **Parameter Support**: Multiple parameters with type checking
- **Return Values**: Any JavaScript data type
- **File Cabinet Storage**: Functions stored as .js files in NetSuite
- **Dynamic Registry**: Automatic discovery and registration
- **Error Handling**: Comprehensive error handling and logging

### Synthetic Stored Procedures

Implement complex business logic with parameterized procedures.

#### Creating Procedures
```sql
CREATE OR REPLACE PROCEDURE apply_bulk_discount AS
/**
 * Apply bulk discount to qualifying transactions
 *
 * @param {Object} context - Execution context
 * @param {string} context.params.transaction_type - Type of transaction (default: 'SalesOrd')
 * @param {number} context.params.threshold_amount - Minimum amount for discount (default: 1000)
 * @param {number} context.params.discount_percent - Discount percentage (default: 5)
 * @param {boolean} context.params.update_records - Whether to actually update records (default: false)
 * @param {boolean} context.params.show_output - Whether to display real-time output (default: false)
 * @returns {Object} Processing results
 */
function apply_bulk_discount(context) {
    // Import NetSuite modules
    var query = require('N/query');
    var log = require('N/log');

    // Extract and validate parameters with defaults
    var params = context.params || {};
    var transaction_type = params.transaction_type || 'SalesOrd';
    var threshold_amount = parseFloat(params.threshold_amount) || 1000;
    var discount_percent = parseFloat(params.discount_percent) || 5;
    var update_records = params.update_records === true;
    var show_output = params.show_output === true;

    // Real-time output
    if (show_output) {
        console.log('Starting bulk discount application...');
        console.log('Transaction Type: ' + transaction_type);
        console.log('Threshold Amount: $' + threshold_amount);
        console.log('Discount Percent: ' + discount_percent + '%');
        console.log('Update Records: ' + (update_records ? 'Yes' : 'No (Dry Run)'));
    }

    // Initialize results
    var results = {
        success: true,
        transactions_found: 0,
        transactions_updated: 0,
        total_discount_applied: 0,
        errors: []
    };

    try {
        // Search for qualifying transactions using SuiteQL
        var searchQuery = "SELECT id, total FROM transaction WHERE type = '" + transaction_type + "' AND total >= " + threshold_amount;
        var searchResults = suiteql.query(searchQuery);

        if (searchResults.success && searchResults.records) {
            results.transactions_found = searchResults.records.length;

            if (show_output) {
                console.log('Found ' + results.transactions_found + ' qualifying transactions');
            }

            if (update_records) {
                // Apply discounts to qualifying transactions
                searchResults.records.forEach(function(txn) {
                    try {
                        var discount = txn.total * (discount_percent / 100);

                        // Update transaction with DML
                        var updateResult = dml.update(
                            "UPDATE transaction SET discountamount = " + discount + " WHERE id = " + txn.id + " COMMIT"
                        );

                        if (updateResult.success) {
                            results.total_discount_applied += discount;
                            results.transactions_updated++;

                            if (show_output) {
                                console.log('✓ Applied $' + discount.toFixed(2) + ' discount to transaction ' + txn.id);
                            }
                        } else {
                            var errorMsg = 'Failed to update transaction ' + txn.id + ': ' + (updateResult.error || 'Unknown error');
                            results.errors.push(errorMsg);
                            if (show_output) {
                                console.error('✗ ' + errorMsg);
                            }
                        }
                    } catch (e) {
                        var errorMsg = 'Error processing transaction ' + txn.id + ': ' + e.message;
                        results.errors.push(errorMsg);
                        if (show_output) {
                            console.error('✗ ' + errorMsg);
                        }
                    }
                });
            } else {
                // Dry run mode - calculate what would be done
                searchResults.records.forEach(function(txn) {
                    var discount = txn.total * (discount_percent / 100);
                    results.total_discount_applied += discount;
                    results.transactions_updated++;

                    if (show_output) {
                        console.log('✓ Would apply $' + discount.toFixed(2) + ' discount to transaction ' + txn.id + ' [DRY RUN]');
                    }
                });
            }
        }

        // Final summary
        if (show_output) {
            console.log('=== EXECUTION SUMMARY ===');
            console.log('Transactions found: ' + results.transactions_found);
            console.log('Transactions processed: ' + results.transactions_updated);
            console.log('Total discount applied: $' + results.total_discount_applied.toFixed(2));
            console.log('Errors encountered: ' + results.errors.length);
            console.log('Records updated: ' + (update_records ? 'Yes' : 'No (Dry Run)'));
        }

    } catch (e) {
        results.success = false;
        var errorMsg = 'Procedure execution failed: ' + e.message;
        results.errors.push(errorMsg);
        if (show_output) {
            console.error(errorMsg);
        }
    }

    return results;
}
```

#### Executing Procedures
```sql
-- Execute with default parameters (dry run mode)
CALL apply_bulk_discount();

-- Execute with custom parameters (dry run with output)
CALL apply_bulk_discount(
    transaction_type='SalesOrd',
    threshold_amount=500,
    discount_percent=10,
    show_output=true
);

-- Execute with actual updates
CALL apply_bulk_discount(
    transaction_type='SalesOrd',
    threshold_amount=500,
    discount_percent=10,
    update_records=true,
    show_output=true
);

-- Execute with minimal parameters
CALL apply_bulk_discount(update_records=true);
```

#### Procedure Features
- **Parameter Support**: Named parameters accessed via `context.params` with default value handling
- **Complex Logic**: Full JavaScript business logic implementation with error handling
- **NetSuite API Access**: Complete access to NetSuite SuiteScript APIs via `require()`
- **Return Values**: Structured return data with success/error status
- **Real-time Output**: Optional real-time logging with `show_output=true` parameter
- **Dry Run Mode**: Safe testing with `update_records=false` (default)
- **DML Integration**: Execute UPDATE, INSERT, DELETE operations with COMMIT control
- **SuiteQL Integration**: Execute SuiteQL queries via `suiteql.query()`
- **Function Calls**: Call other synthetic functions via `functions.call()`
- **Case Insensitive**: Procedures stored with original case, executed case-insensitively

#### Enhanced Capabilities in v1.2.0

Stored procedures now have access to the complete DML and Synthetic SQL ecosystem:

**DML Operations Within Procedures**:
```javascript
// Execute DML operations from within stored procedures
var insertResult = dml.insert("INSERT INTO customlist_demo (name) VALUES ('Test Item')");
var updateResult = dml.update("UPDATE customer SET comments = 'Updated' WHERE id = 123");
var deleteResult = dml.delete("DELETE FROM customlist_demo WHERE name = 'Test Item'");

console.log('Records affected:', insertResult.recordsAffected);
```

**Function Calls Within Procedures**:
```javascript
// Call other synthetic functions from within procedures
var taxResult = functions.call('calculateTax', [100, 'CA']);
var formattedDate = functions.call('formatDate', ['2024-01-01', 'MM/DD/YYYY']);

console.log('Tax calculated:', taxResult);
```

**SuiteQL Execution Within Procedures**:
```javascript
// Execute regular SuiteQL queries from within procedures
var queryResult = suiteql.query(
    "SELECT id, entityid FROM customer WHERE isinactive = 'F' LIMIT 10"
);

if (queryResult.success) {
    console.log('Found ' + queryResult.recordCount + ' customers');
    queryResult.records.forEach(function(customer) {
        console.log('Customer:', customer.entityid);
    });
}

// Execute SuiteQL queries WITH synthetic functions from within procedures
var functionalQuery = suiteql.query(
    "SELECT id, entityid, test_upper(entityid) AS upper_name FROM customer LIMIT 5"
);

if (functionalQuery.success) {
    console.log('Query with functions returned ' + functionalQuery.recordCount + ' records');
    if (functionalQuery.hasSyntheticFunctions) {
        console.log('Executed ' + functionalQuery.functionsExecuted + ' synthetic functions');
    }

    // Access function results in the data
    functionalQuery.records.forEach(function(customer) {
        console.log('Customer:', customer.entityid, 'Upper:', customer.upper_name);
    });
}
```

**Complete Business Logic Example**:
```javascript
function processCustomerOrders(context) {
    var customerId = context.params.customer_id;
    var results = { processed: 0, errors: 0 };

    // Query customer orders
    var orders = suiteql.query(
        "SELECT id, total FROM transaction WHERE entity = ? AND type = 'SalesOrd'",
        [customerId]
    );

    if (orders.success) {
        orders.records.forEach(function(order) {
            try {
                // Calculate discount using synthetic function
                var discount = functions.call('calculateDiscount', [order.total, 'BULK']);

                // Update order with discount
                var updateResult = dml.update(
                    "UPDATE transaction SET discountamount = " + discount + " WHERE id = " + order.id
                );

                if (updateResult.success) {
                    results.processed++;
                    console.log('Applied discount to order:', order.id);
                }
            } catch (e) {
                results.errors++;
                console.error('Error processing order:', order.id, e.message);
            }
        });
    }

    return results;
}
```

### File Cabinet Integration

Both functions and procedures are stored as JavaScript files in NetSuite's File Cabinet:

**Functions Location**: `SuiteScripts/EnhancedSuiteQLTool/lib/features/functions/`
**Procedures Location**: `SuiteScripts/EnhancedSuiteQLTool/lib/features/storedProcedures/`

#### Automatic Discovery
- **Dynamic Registry**: System automatically scans for new functions/procedures
- **Metadata Extraction**: Extracts function signatures and documentation
- **Error Validation**: Validates JavaScript syntax before registration
- **Performance Caching**: Caches registry for optimal performance

## 📊 Custom Records Setup

The Enhanced SuiteQL Query Tool uses NetSuite custom records to enable advanced features like saved queries and execution history. This setup is optional but highly recommended for team environments.

### Quick Setup Checklist

- [ ] Import custom record types from `src/Objects/`
- [ ] Set appropriate role permissions
- [ ] Test saved query functionality


### Custom Records Included

1. **Saved Queries** (`customrecord_sqrt_saved_queries`)
   - Store and organize frequently used queries
   - Support for tags and descriptions
   - Execution count tracking and favorites

2. **Query History** (`customrecord_sqrt_query_history`)
   - Track all query executions for audit and analytics
   - Performance metrics and error logging
   - Session tracking and user analytics

3. **Supporting Lists**
   - Result Formats (`customlist_sqrt_result_formats`)

### Automatic Integration

The tool automatically detects available custom records:
- If custom records are found, advanced features are enabled
- If not found, the tool falls back to browser localStorage
- No configuration changes needed in the tool itself

### Feature Availability Matrix

| Feature | Without Custom Records | With Custom Records |
|---------|----------------------|-------------------|
| Basic query execution | ✓ | ✓ |
| Query history (session) | ✓ | ✓ |
| Save queries | Browser only | ✓ Persistent |
| Query analytics | ✗ | ✓ |
| Audit trail | ✗ | ✓ |

### Detailed Custom Record Setup

#### Step 1: Import Custom Records
The easiest way to set up custom records is to import the provided XML files:

1. Navigate to **Customization > SuiteBuilder > Import Objects**
2. Upload and import all XML files from the `src/Objects/` directory:
   - `customrecord_sqrt_saved_queries.xml` - Main saved queries record
   - `customrecord_sqrt_query_history.xml` - Query execution history
   - `customlist_sqrt_result_formats.xml` - Result format options

#### Step 2: Set Permissions
1. Go to **Setup > Users/Roles > Manage Roles**
2. Edit each role that should access the tool
3. Add permissions for the custom records:
   - **View**: Full (to see public queries) or Own Records Only
   - **Create**: Full (to save new queries)
   - **Edit**: Own Records Only (to edit own queries)
   - **Delete**: Own Records Only (to delete own queries)

#### Step 3: Test the Setup
1. Access the Enhanced SuiteQL Query Tool
2. Write and execute a test query
3. Try saving the query - you should see save options
4. Verify the query appears in the saved queries list


#### Manual Setup (Alternative)
If you prefer to create the custom records manually, here are the key fields needed:

**Saved Queries Record** (`customrecord_sqrt_saved_queries`):
- Query Title (`custrecord_sqrt_query_title`) - Free-Form Text, Required
- Query Content (`custrecord_sqrt_query_content`) - Long Text, Required
- Query Description (`custrecord_sqrt_query_description`) - Long Text, Optional
- Query Tags (`custrecord_sqrt_query_tags`) - Free-Form Text, Optional
- Created By (`custrecord_sqrt_query_created_by`) - Employee, Required
- Last Modified (`custrecord_sqrt_query_last_modified`) - Date/Time, Required
- Execution Count (`custrecord_sqrt_query_execution_count`) - Integer, Optional
- Favorite (`custrecord_sqrt_query_favorite`) - Checkbox, Optional

## 🏗 Architecture

### Modular Design

The Enhanced SuiteQL Query Tool features a complete modular architecture for maximum maintainability and extensibility:

```
src/FileCabinet/SuiteScripts/EnhancedSuiteQLTool/
├── enhancedSuiteQLQueryTool.js          # Main entry point
└── lib/                                 # Modular architecture
    ├── core/                           # Core system modules
    │   ├── constants.js               # Configuration and constants
    │   ├── modules.js                 # NetSuite module imports
    │   └── requestHandlers.js         # HTTP request routing
    ├── data/                          # Data processing modules
    │   ├── queryEngine.js             # Core SuiteQL execution
    │   ├── fileOperations.js          # File cabinet operations
    │   ├── documentGeneration.js      # PDF/HTML generation
    │   └── customRecordOperations.js  # Custom record CRUD
    ├── ui/                            # User interface modules
    │   ├── components/                # Reusable UI components
    │   ├── layouts/                   # Page layout generators
    │   └── styles/                    # CSS themes and styling
    ├── features/                      # Feature-specific modules
    │   ├── editor/                    # Code editor functionality
    │   ├── export/                    # Data export features
    │   ├── query/                     # Query execution
    │   ├── queryHistory/              # History management
    │   ├── savedQueries/              # Saved query management
    │   ├── controls/                  # UI controls and options
    │   ├── dml/                       # Data Manipulation Language operations
    │   │   ├── operations/            # Individual DML operation modules
    │   │   │   ├── insertRecord.js    # INSERT operations
    │   │   │   ├── updateRecord.js    # UPDATE operations
    │   │   │   ├── deleteRecord.js    # DELETE operations
    │   │   │   ├── createRecord.js    # CREATE RECORD operations
    │   │   │   └── createList.js      # CREATE LIST operations
    │   │   ├── dmlProcessor.js        # Main DML orchestration
    │   │   ├── dmlParser.js           # SQL statement parsing
    │   │   ├── dmlExecutionEngine.js  # DML execution engine
    │   │   └── dmlUtils.js            # DML utility functions
    │   ├── functions/                 # Synthetic SQL functions
    │   ├── storedProcedures/          # Synthetic stored procedures
    │   ├── synthetic/                 # Synthetic SQL engine
    │   │   ├── syntheticFunctions.js  # Function registry and execution
    │   │   ├── syntheticProcedures.js # Procedure registry and execution
    │   │   └── syntheticProcessor.js  # Main synthetic SQL processor
    │   └── ui/                        # UI utilities
    └── netsuite/                      # NetSuite-specific integrations
        ├── savedQueriesRecord.js      # Saved queries CRUD
        └── queryHistoryRecord.js      # Query history CRUD
```

### Key Benefits

#### Maintainability
- **Single Responsibility**: Each module focuses on one specific area
- **Clear Organization**: Related functionality grouped together
- **Easy Navigation**: Logical file structure and naming conventions
- **Reduced Complexity**: Smaller, focused files instead of one large file

#### Extensibility
- **Modular Design**: New features can be added as separate modules
- **Clean Interfaces**: Well-defined module boundaries and APIs
- **Plugin Architecture**: Framework ready for future extensions
- **Future-Proof**: Easy to add functionality without touching existing code

#### Performance
- **On-Demand Loading**: Modules loaded only when needed
- **Optimized Imports**: Only required dependencies imported
- **Efficient Caching**: Browser can cache individual modules
- **Reduced Bundle Size**: Unused modules can be excluded

### Backward Compatibility

The modular version maintains 100% backward compatibility:
- All query functionality preserved
- Virtual views support maintained
- File operations unchanged
- Document generation intact
- All configuration options preserved

## 🛠 Development

### Development Setup

#### Prerequisites
- SuiteCloud CLI tools (requires Node.js runtime)
- NetSuite account with SDF enabled
- Code editor with JavaScript support

#### Local Development
```bash
# Clone the repository
git clone https://github.com/WebSolutionsGroup/esqrt.git
cd esqrt

# Install SuiteCloud CLI (if not already installed)
# Note: This requires Node.js but only for the CLI tools, not the application itself
npm install -g @oracle/suitecloud-cli

# Set up authentication
suitecloud account:setup

# Validate project
suitecloud project:validate

# Deploy to development environment
suitecloud project:deploy
```

### Code Architecture

#### Main Components
1. **Main Entry Point**: `enhancedSuiteQLQueryTool.js` - Module initialization and request routing
2. **Core Modules**: Configuration, NetSuite APIs, and request handling
3. **Data Modules**: Query execution, file operations, and document generation
4. **UI Modules**: HTML generation, styling, and component management
5. **Feature Modules**: Specific functionality like editor, export, and saved queries
6. **NetSuite Integration**: Custom record operations and NetSuite-specific features

#### Key Functions
- **Query Execution**: `lib/data/queryEngine.js` - Core SuiteQL processing
- **UI Generation**: `lib/ui/layouts/toolGenerator.js` - Main interface HTML
- **Request Handling**: `lib/core/requestHandlers.js` - GET/POST processing
- **Custom Records**: `lib/netsuite/savedQueriesRecord.js` - Saved query management

### Extending the Tool

#### Adding New Export Formats
```javascript
// Create new export module in lib/features/export/
define(['../../core/constants'], function(constants) {
    return {
        generateXML: function(data) {
            // XML generation logic
            var xml = '<?xml version="1.0" encoding="UTF-8"?>';
            // ... build XML from data
            return xml;
        }
    };
});
```

#### Adding New UI Components
```javascript
// Create new component in lib/ui/components/
define(['../../core/constants'], function(constants) {
    return {
        generateModal: function(title, content) {
            // Modal HTML generation
            return '<div class="modal">...</div>';
        }
    };
});
```

#### Custom Auto-Complete Sources
```javascript
// Extend auto-complete in lib/features/editor/
var customSuggestions = [
    "CustomRecord", "CustomField", "CustomTransaction"
];
// Add to existing auto-complete logic
```

### Testing

Follow standard NetSuite deployment testing practices:

1. **Deploy to Sandbox**: Always test in a NetSuite sandbox environment first
2. **Validate Deployment**: Use `suitecloud project:validate` before deploying
3. **Test Core Functionality**: Verify query execution, saving, and export features
4. **Browser Testing**: Test in your organization's supported browsers
5. **User Acceptance Testing**: Have end users test the interface and workflows
6. **Production Deployment**: Deploy to production only after thorough sandbox testing

## �️ Roadmap

The Enhanced SuiteQL Query Tool continues to evolve with exciting new features planned for future releases. Here's what's on the horizon:

### 📊 Enhanced Data Export ✅ **COMPLETED in v1.1.0**
- **✅ Enhanced CSV Exporting Options**: Advanced CSV export with customizable delimiters, quote escaping, and encoding options for better data integration workflows

### 🛠 DML & Synthetic SQL ✅ **COMPLETED in v1.2.0**
- **✅ Complete DML Operations**: Full INSERT, UPDATE, DELETE operations with preview/commit safety model for comprehensive data manipulation
- **✅ Synthetic Functions**: JavaScript-based custom SQL functions stored in NetSuite File Cabinet with inline execution capabilities
- **✅ Synthetic Stored Procedures**: Complex business logic procedures with parameter support and real-time output options
- **✅ Advanced WHERE Clauses**: Compound conditions with AND/OR logic, parentheses grouping, and boolean field handling
- **✅ Custom List Support**: Full DML operations for NetSuite custom lists with proper value management

### 🔧 Advanced Query Capabilities ✅ **COMPLETED in v1.2.0**
- **✅ Parameterized Queries**: Interactive parameter input dialog for dynamic queries with `?` placeholders, supporting date pickers, dropdowns, and validation

### 🗂️ Data Discovery & Management
- **Table & Field Browser**: Interactive browser for exploring tables and fields available inside NetSuite, with search, filtering, and documentation features
- **Advanced Autocomplete**: Enhanced autocomplete ability for existing tables and fields, providing intelligent suggestions based on NetSuite schema and query context
- **Remote Library Integration**: Access to remote query collections and shared query repositories for collaborative query development
- **Workbooks Integration**: Load and convert saved searches into SuiteQL queries, bridging the gap between traditional saved searches and modern SQL workflows
- **File Cabinet Browser**: Integrated file management with basic file editing capabilities for managing scripts, templates, and data files

### ✏️ Editor Features
- **Search and Replace**: Advanced find/replace functionality with regex support, case sensitivity options, and keyboard shortcuts (Ctrl+F, Ctrl+H)
- **Jump to Line**: Quick navigation to specific line numbers (Ctrl+G)
- **Multiple Cursors**: Multi-cursor editing for efficient bulk text operations

### 💻 Advanced Development Environment
- **Terminal Emulator Support**: Full terminal emulator integration using [Xterm.js](https://xtermjs.org/) for advanced command-line operations and scripting
- **Python Interpreter Support**: Embedded Python interpreter using [Pyodide](https://pyodide.org/) via Xterm for data analysis and automation scripts
- **Python Notebooks**: Jupyter-like notebook interface built on top of Pyodide via Xterm for interactive data analysis and documentation

### ☁️ Cloud Integration
- **Cloud Service Provider Support**: Integration with major cloud platforms including:
  - **Google Cloud Platform**: BigQuery, Cloud Storage, and other GCP services
  - **Microsoft Azure**: Azure SQL, Blob Storage, and Azure services
  - **Amazon Web Services**: RDS, S3, Redshift, and other AWS services
  - **Snowflake**: Direct Snowflake data warehouse connectivity

### 🤖 AI Integration
- **Natural Language Query Builder**: Convert plain English descriptions into SuiteQL queries using NetSuite AI ("Show me all customers who haven't placed orders in the last 6 months")
- **Query Optimization Suggestions**: AI-powered analysis of query performance with recommendations for indexes, joins, and query structure improvements
- **Smart Schema Discovery**: AI-assisted exploration of NetSuite data relationships with automatic suggestion of relevant tables and fields based on query context
- **Intelligent Error Resolution**: AI-powered error analysis that provides specific suggestions and corrections for SuiteQL syntax and logic errors
- **Query Pattern Recognition**: Machine learning analysis of query history to suggest commonly used patterns and templates based on user behavior
- **Data Insights Generation**: AI-powered analysis of query results to automatically identify trends, anomalies, and business insights with natural language explanations
- **Automated Documentation**: AI-generated documentation for complex queries including purpose, logic explanation, and usage examples

### 🛑 Version 2.0: Enterprise Operation Management

#### Advanced Operation Control & Cancellation
- **Cancellable Operations**: Cooperative cancellation pattern for long-running stored procedures, functions, and queries
- **Real-Time Progress Tracking**: Live progress bars with ETA calculations and detailed status updates
- **Operation Queue Management**: Dashboard for viewing, managing, and prioritizing running operations
- **Checkpoint & Resume**: Ability to pause operations and resume from last checkpoint
- **Smart Batch Processing**: Adaptive batch sizes with automatic governance limit awareness
- **Operation Analytics**: Performance monitoring, execution statistics, and optimization recommendations

#### Enterprise UI/UX Enhancements
- **Operation Dashboard**: Centralized view of all running, queued, and completed operations
- **Advanced Progress Visualization**: Real-time progress with detailed execution metrics
- **Smart Notifications**: Operation completion alerts, failure notifications, and status updates
- **Bulk Operation Management**: Handle multiple long-running operations simultaneously
- **Resource Monitoring**: Track memory usage, execution time, and governance consumption
- **Error Recovery System**: Intelligent rollback and partial operation recovery

#### Background Processing Architecture
- **Cooperative Cancellation Framework**: Built-in cancellation support for all synthetic operations
- **State Management System**: Robust operation state tracking using NetSuite custom records
- **Governance Optimization**: Smart yielding, rescheduling, and resource management
- **Resumable Operations**: Pick up interrupted operations exactly where they left off
- **Performance Intelligence**: Automatic optimization based on execution patterns

**Technical Implementation**: Version 2.0 will introduce a comprehensive operation management framework that transforms the tool from a query interface into a full enterprise data processing platform with professional-grade operation control capabilities.

### 🎯 Coming Soon
These features are actively being planned and developed. Stay tuned for updates and feel free to contribute ideas or feedback through GitHub Issues.

**Want to contribute?** We welcome community input on these roadmap items. If you have specific use cases or requirements for any of these features, please open a GitHub issue to discuss implementation details.

## �🐛 Troubleshooting

### Common Issues

#### 1. Script Not Loading
**Symptoms**: Blank page or error messages
**Solutions**:
- Verify script file is uploaded to correct File Cabinet location
- Check script record configuration and deployment status
- Ensure user has appropriate permissions
- Review browser console for JavaScript errors

#### 2. Query Execution Errors
**Symptoms**: "Error executing query" messages
**Solutions**:
- Verify SuiteQL syntax is correct
- Check user has SuiteQL execution permissions
- Ensure referenced tables and fields exist
- Review NetSuite execution logs for detailed error information

#### 3. Custom Records Not Working
**Symptoms**: Saved queries not persisting
**Solutions**:
- Verify custom records are imported and deployed
- Check role permissions for custom record access
- Ensure field IDs match exactly as specified
- Review NetSuite logs for custom record errors

#### 4. Auto-Complete Not Working
**Symptoms**: Ctrl+Space doesn't show suggestions
**Solutions**:
- Verify CodeMirror libraries are loading correctly
- Check browser console for JavaScript errors
- Ensure internet connection for CDN resources
- Try refreshing the page to reload JavaScript

#### 5. Export Functionality Issues
**Symptoms**: Export buttons not working or generating errors
**Solutions**:
- Check browser popup blockers
- Verify File Cabinet permissions for PDF generation
- Ensure templates are properly configured
- Review browser console for JavaScript errors

### Performance Issues

#### Slow Query Execution
- **Enable Pagination**: Use pagination for large result sets
- **Optimize Queries**: Review query structure and add appropriate WHERE clauses
- **Check Indexes**: Ensure proper indexing on queried fields
- **Monitor Resources**: Check NetSuite governance limits

#### UI Responsiveness
- **Reduce Result Size**: Limit rows returned for better performance
- **Disable DataTables**: Turn off DataTables for very large datasets
- **Browser Resources**: Close other tabs and applications
- **Network Connection**: Ensure stable internet connection

### Debug Mode

Enable debug logging by modifying the configuration:

```javascript
// In lib/core/constants.js
var CONFIG = {
    DEBUG_MODE: true,  // Enable debug logging
    // ... other settings
};
```

## 🤝 Contributing

We welcome contributions to improve the Enhanced SuiteQL Query Tool!

### How to Contribute

1. **Fork the Repository**: Create your own fork for development
2. **Create Feature Branch**: Work on features in separate branches
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Follow Coding Standards**: Maintain consistent code style
4. **Test Thoroughly**: Test all changes in development environment
5. **Submit Pull Request**: Submit changes for review

### Development Guidelines

- Follow the existing modular architecture
- Add proper JSDoc documentation
- Include error handling in all functions
- Test with different NetSuite environments
- Update documentation for new features

### Reporting Issues

When reporting issues, please include:
- NetSuite version and environment
- Browser type and version
- Steps to reproduce the issue
- Error messages or screenshots
- Expected vs actual behavior

## 📄 Credits

### Original Developer - Tim Dietrich

**Tim Dietrich** created the foundational SuiteQL Query Tool that serves as the backbone of this enhanced version. His original work provided:

- **Core SuiteQL Execution Engine**: The fundamental query processing and execution logic
- **Virtual Views System**: Innovative #viewname syntax for reusable query components
- **File Cabinet Integration**: Local library functionality for saving and loading queries
- **Document Generation**: PDF and HTML export capabilities
- **Workbooks Integration**: Saved search to SuiteQL conversion functionality
- **Robust Error Handling**: Comprehensive error management and user feedback
- **NetSuite Best Practices**: Professional SuiteScript implementation patterns

**Tim Dietrich's Contact Information:**
- Email: timdietrich@me.com
- Website: https://timdietrich.me
- Original Tool: https://timdietrich.me/netsuite-suitescripts/suiteql-query-tool/

**Original Version History:**
- **v2021.2 Beta 1** (July 14, 2021) - First public beta release
- **v2021.2 Beta 2** (July 25, 2021) - Second public beta with improvements
- **v2021.2 Production** (October 27, 2021) - Production release with virtual views, selected text queries, and Tables Reference enhancements

### Enhanced Version Developer

**Matt Owen - Web Solutions Group, LLC** built upon Tim's solid foundation to create the modern enhanced version:

- **Modern UI/UX**: Complete interface redesign inspired by contemporary database management tools
- **CodeMirror Integration**: Syntax highlighting, line numbers, and enhanced editing features
- **Split-Pane Layout**: Resizable three-panel interface with query editor, history, and results
- **Dark Mode Support**: Professional light/dark theme system with persistence
- **Query History Management**: Sidebar panel with click-to-load functionality and session tracking
- **Enhanced Export Options**: Improved CSV, JSON, PDF, and HTML export capabilities
- **Custom Records Integration**: NetSuite custom record support for saved queries and execution history
- **Modular Architecture**: Complete refactoring into maintainable, extensible modular codebase
- **Performance Optimizations**: Improved query execution, result handling, and UI responsiveness

**Web Solutions Group, LLC Contact:**
- Professional NetSuite Development Services
- Custom SuiteScript Development and NetSuite Integration Solutions
- Website: https://websolutionsgroup.com

### Acknowledgments
- **Modern Database Tools**: UI design and interface layout inspiration
- **CodeMirror**: Syntax highlighting and editor functionality
- **Bootstrap**: Responsive UI framework
- **DataTables**: Enhanced table display functionality
- **Split.js**: Resizable panel implementation

## 📈 Version History

### v1.1.0 (Current - September 2, 2025)
- **Advanced CSV Export System**: Complete CSV configuration modal with customizable delimiters, encoding, line endings, and presets
- **Enhanced Query Editor**: Intelligent auto-complete with context-aware suggestions for SQL keywords and NetSuite objects
- **Cross-Platform Keyboard Shortcuts**: Mac (Cmd) and Windows/Linux (Ctrl) support with automatic detection
- **Advanced Tab Management**: Tab state persistence, smart numbering, and individual result isolation
- **Sortable Result Tables**: Click column headers to sort data ascending/descending
- **Accordion Sidebar Behavior**: Improved space utilization with collapsible sections
- **Performance Optimizations**: Reduced console logging and improved memory usage
- **Bug Fixes**: Resolved CSV export, tab switching, and UI consistency issues

### v1.2.0 (September 7, 2025)
- **Major DML Operations Suite**: Complete INSERT, UPDATE, DELETE operations with preview/commit safety model
- **Synthetic SQL Functions**: JavaScript-based custom SQL functions with inline execution capabilities
- **Synthetic Stored Procedures**: Complex business logic procedures with parameter support and real-time output
- **Advanced WHERE Clause Engine**: Compound conditions with AND/OR logic, parentheses grouping, and boolean field handling
- **Custom List DML Support**: Full DML operations for NetSuite custom lists with proper value management
- **Safety-First Design**: All DML operations default to preview mode with explicit COMMIT requirement
- **Enhanced User Experience**: Consistent styling for preview (light orange) and commit (green) modes
- **Comprehensive Documentation**: Complete release notes, testing guide, and feature documentation
- **Modular DML Architecture**: Extensible design with separate modules for each operation type
- **NetSuite Integration**: Proper integration with NetSuite record and search APIs

### v1.0.0 (September 1, 2025)
- Production release with complete UI overhaul
- Split-pane layout with resizable panels
- CodeMirror integration with syntax highlighting
- Query history sidebar with click-to-load functionality
- Dark mode support with theme persistence
- Enhanced export options (CSV, JSON, PDF, HTML)
- Virtual views system for query reusability
- Complete modular architecture refactoring
- Custom records integration for saved queries and history
- Built upon Tim Dietrich's original SuiteQL Query Tool foundation

## 🔗 Resources

### Documentation
All documentation is consolidated in this README file:
- [Custom Records Setup](#-custom-records-setup) - Setting up NetSuite custom records
- [Architecture](#-architecture) - Modular architecture overview
- [Development](#-development) - Development setup and guidelines

### NetSuite Resources
- [NetSuite SuiteQL Reference](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156257770590.html)
- [SuiteCloud Development Framework](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_155931263126.html)
- [NetSuite Custom Records Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4625600928.html)

### Development Resources
- [CodeMirror Documentation](https://codemirror.net/doc/manual.html)
- [Bootstrap Documentation](https://getbootstrap.com/docs/)
- [SuiteScript 2.1 API Reference](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4387799721.html)

## 📞 Support

### Getting Help
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: All documentation is available in this comprehensive README
- **Community**: Join NetSuite developer communities for general SuiteQL questions
- **Professional Support**: Contact Web Solutions Group for professional assistance

### Professional Services
For professional NetSuite development services, custom implementations, or enterprise support:

**Web Solutions Group, LLC**
- Professional NetSuite Development Services
- Custom SuiteScript Development
- NetSuite Integration Solutions
- Enterprise Support and Consulting

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Usage Terms
- Free for personal and commercial use
- Attribution to original authors appreciated
- No warranty provided - use at your own risk
- Respect NetSuite's terms of service and licensing agreements

## 🌟 Star History

If you find this tool useful, please consider giving it a star on GitHub! Your support helps us continue improving the tool and adding new features.

---

**Enhanced SuiteQL Query Tool v1.1.0** - Bringing advanced CSV export capabilities and enhanced user experience to NetSuite

*For professional NetSuite development services, contact [Web Solutions Group, LLC](https://websolutionsgroup.com)*

---

### Quick Links
- [🚀 Installation](#-installation)
- [📊 Custom Records Setup](#-custom-records-setup)
- [🏗 Architecture](#-architecture)
- [🛠 Development](#-development)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📋 Changelog](#-changelog)

---

## 📋 Changelog

### v1.2.0 (September 7, 2025) - Major DML & Synthetic SQL Release

#### 🚀 Major New Features
- **Complete DML Operations Suite**: Full INSERT, UPDATE, DELETE operations with preview/commit safety model
- **Synthetic SQL Functions**: JavaScript-based custom SQL functions stored in NetSuite File Cabinet
- **Synthetic Stored Procedures**: Complex business logic procedures with parameter support
- **Advanced WHERE Clause Engine**: Compound conditions with AND/OR logic, parentheses grouping
- **Boolean Field Handling**: Proper conversion for NetSuite boolean fields (isinactive, active, etc.)
- **Custom List DML Support**: Full DML operations for NetSuite custom lists
- **IS NULL/IS NOT NULL Support**: Complete null condition handling in WHERE clauses

#### 🛠 DML Operations
- **INSERT Operations**: Both VALUES and SET syntax, multiple record support, preview/commit modes
- **UPDATE Operations**: SET clause support, compound WHERE conditions, boolean field conversion
- **DELETE Operations**: Safe deletion with preview mode, complex WHERE clause support
- **Safety-First Design**: All operations default to preview mode, explicit COMMIT required

#### 🔧 Technical Improvements
- **Modular DML Architecture**: Separate modules for each DML operation type
- **Enhanced SQL Parsing**: Robust parsing for complex SQL statements
- **NetSuite Integration**: Proper integration with NetSuite record and search APIs
- **Error Handling**: Comprehensive error handling with clear, actionable messages
- **Display Consistency**: Unified styling for preview (light orange) and commit (green) modes

#### 📚 Documentation
- **Comprehensive Release Notes**: Detailed documentation of all new features
- **Complete Testing Guide**: 50+ test scenarios with expected results
- **DML Operations Guide**: Complete reference for all DML operations
- **Synthetic SQL Guide**: Documentation for functions and stored procedures

[📋 View Complete Release Notes](RELEASE_NOTES_v1.2.0.md) | [🧪 View Testing Guide](TESTING_GUIDE_v1.2.0.md)

### v1.1.1 (September 2, 2025) - Bug Fixes & Production Stability

#### 🐛 Bug Fixes
- **Fixed Production Deployment Error**: Resolved `custrecord_esqrt_query_sharing_level` field error by removing incomplete sharing functionality
- **Removed Sharing Features**: Temporarily removed sharing-related fields and functionality to ensure stable production deployment
- **Cleaned Up Debug Logging**: Commented out excessive console.log statements for cleaner browser console output
  - Removed table sorting debug messages
  - Removed CSV export debug logging
  - Removed resizer initialization debug output
  - Reduced noise in browser developer tools

#### 🔧 Technical Improvements
- **Custom Record Cleanup**: Removed sharing-related fields from `customrecord_sqrt_saved_queries` definition
- **Code Maintenance**: Cleaned up debug statements in:
  - `tableRenderer.js` - Table sorting and rendering logs
  - `csvExporter.js` - CSV configuration and export logs
  - `layoutUtils.js` - UI resizer and layout logs
- **Production Ready**: Ensured all features work reliably in production NetSuite environments

#### 📝 Documentation
- **Updated Version**: Bumped version to v1.1.1 to reflect bug fixes
- **Added Changelog**: Created comprehensive changelog section for tracking updates

#### 🚀 Deployment Notes
This release focuses on production stability and resolves deployment issues encountered in v1.1.0. The sharing functionality has been temporarily removed and will be reintroduced in a future release with proper implementation.

**Upgrade Path**: Deploy this version to resolve any production errors related to missing custom record fields. All existing functionality remains intact except for sharing features.

---
