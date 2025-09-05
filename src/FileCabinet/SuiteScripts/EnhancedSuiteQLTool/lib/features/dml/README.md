# DML (Data Manipulation Language) System

The DML system provides a modular, extensible framework for executing data manipulation operations within the Enhanced SuiteQL Query Tool. It follows the same architectural patterns as the synthetic functions and procedures system.

## Architecture

The DML system consists of several modular components:

### Core Modules

- **`dmlProcessor.js`** - Main entry point that orchestrates DML operations
- **`dmlParser.js`** - Parses and analyzes DML statements
- **`dmlExecutionEngine.js`** - Executes DML operations with proper error handling
- **`operations/`** - Directory containing individual DML operation modules

### Operation Modules

- **`operations/createRecord.js`** - Handles CREATE RECORD statements
- **`operations/createList.js`** - Handles CREATE LIST statements

## Supported Operations

### INSERT INTO

Creates new record instances in NetSuite. Supports both standard NetSuite records and custom record types.

**Syntax:**
```sql
-- VALUES syntax
INSERT INTO table_name (field1, field2, field3)
VALUES (value1, value2, value3);

-- SET syntax
INSERT INTO table_name SET
    field1 = value1,
    field2 = value2,
    field3 = value3;
```

**Examples:**
```sql
-- Insert into standard NetSuite record
INSERT INTO customer (companyname, email, phone)
VALUES ('Acme Corporation', 'contact@acme.com', '555-1234');

-- Insert into custom record using SET syntax
INSERT INTO customrecord_employee SET
    name = 'John Doe',
    department = 'Engineering',
    hire_date = '2024-01-15',
    active = true;

-- Insert into custom list
INSERT INTO customlist_departments SET
    value = 'Engineering',
    abbreviation = 'ENG';
```

### UPDATE SET WHERE

Updates existing record instances in NetSuite based on specified conditions.

**Syntax:**
```sql
UPDATE table_name SET
    field1 = value1,
    field2 = value2
WHERE condition;
```

**Examples:**
```sql
-- Update by internal ID
UPDATE customer SET
    companyname = 'New Company Name',
    email = 'newemail@company.com'
WHERE id = 123;

-- Update by field value
UPDATE customrecord_employee SET
    department = 'Marketing',
    salary = 75000
WHERE name = 'John Doe';

-- Update multiple records
UPDATE customrecord_employee SET
    active = false
WHERE department = 'Engineering';
```

### DELETE FROM WHERE

Deletes existing record instances from NetSuite based on specified conditions.

**Syntax:**
```sql
DELETE FROM table_name WHERE condition;
```

**Examples:**
```sql
-- Delete by internal ID
DELETE FROM customer WHERE id = 123;

-- Delete by field value
DELETE FROM customrecord_employee WHERE department = 'Engineering';

-- Delete multiple records
DELETE FROM customrecord_employee WHERE active = false;
```

**⚠️ Safety Note:** DELETE operations require a WHERE clause to prevent accidental deletion of all records.

### CREATE RECORD

**⚠️ IMPORTANT LIMITATION:** NetSuite does not allow creating custom record types programmatically via SuiteScript. This operation generates detailed instructions for manual creation in the NetSuite UI.

The CREATE RECORD statement will return comprehensive step-by-step instructions including all configuration options and field definitions that can be used to manually create the custom record type in NetSuite.

**Syntax:**
```sql
CREATE RECORD record_name (
    [name = "Display Name",]
    [description = "Record description",]
    [owner = employee_id,]
    [accessType = "CUSTRECORDENTRYPERM",]
    [prefix "prefix_value",]
    [allowQuickAdd = true/false,]
    [enableSystemNotes = true/false,]
    [includeInGlobalSearch = true/false,]
    [showInApplicationMenu = true/false,]
    [enableOptimisticLocking = true/false,]
    [enableOnlineForm = true/false,]
    [enableNameTranslation = true/false,]
    [allowAttachments = true/false,]
    [showNotes = true/false,]
    [enableMailMerge = true/false,]
    [recordsAreOrdered = true/false,]
    [showCreationDate = true/false,]
    [showLastModified = true/false,]
    [showOwner = true/false,]
    [allowInlineEditing = true/false,]
    [allowQuickSearch = true/false,]
    [allowReports = true/false,]
    [allowDuplicates = true/false,]
    field1 TYPE,
    field2 TYPE(options),
    field3 TYPE
);
```

**Example with comprehensive configuration:**
```sql
CREATE RECORD employee_data (
    name = "Employee Data",
    description = "Employee information and records",
    owner = 123,
    accessType = "CUSTRECORDENTRYPERM",
    prefix "sqrt_",
    allowQuickAdd = true,
    enableSystemNotes = true,
    includeInGlobalSearch = true,
    showInApplicationMenu = false,
    allowAttachments = true,
    allowInlineEditing = true,
    allowQuickSearch = true,
    allowReports = true,
    employee_name FREEFORMTEXT,
    hire_date DATE,
    department LIST(department),
    salary CURRENCY,
    active CHECKBOX
);
```

**Example with minimal configuration:**
```sql
CREATE RECORD employee_data (
    name = "Employee Information",
    description = "Employee information and records",
    prefix "sqrt_",
    employee_name FREEFORMTEXT,
    hire_date DATE,
    department LIST(customlist_departments),
    salary CURRENCY,
    active CHECKBOX
);
```

**Example with auto-generated name (backward compatible):**
```sql
CREATE RECORD employee_data (
    employee_name FREEFORMTEXT,
    hire_date DATE
);
```

**Record Configuration Options:**

**Basic Information:**
- `name` - Display name for the record type (required by NetSuite)
- `description` - Description of the record type
- `owner` - Employee ID of the record type owner
- `accessType` - Access permission type (e.g., "CUSTRECORDENTRYPERM")
- `prefix` - Prefix for script IDs (legacy syntax: `prefix "value"`)

**Access & Permissions:**
- `allowQuickAdd` - Allow quick add functionality
- `includeInGlobalSearch` - Include records in global search
- `showInApplicationMenu` - Show in application menu
- `allowAttachments` - Allow file attachments
- `allowInlineEditing` - Allow inline editing in lists
- `allowQuickSearch` - Allow quick search functionality
- `allowReports` - Allow reports on this record type
- `allowDuplicates` - Allow duplicate records

**System Features:**
- `enableSystemNotes` - Enable system notes tracking
- `enableOptimisticLocking` - Enable optimistic locking
- `enableOnlineForm` - Enable online forms
- `enableNameTranslation` - Enable name translation
- `showNotes` - Show notes field
- `enableMailMerge` - Enable mail merge functionality
- `recordsAreOrdered` - Records are ordered/numbered

**Display Options:**
- `showCreationDate` - Show creation date in lists
- `showLastModified` - Show last modified date in lists
- `showOwner` - Show owner in lists

**Supported Field Types:**
- `CHECKBOX` - Boolean checkbox field
- `CURRENCY` - Currency field
- `DATE` - Date field
- `DATETIME` - Date/time field
- `DECIMAL` - Decimal number field
- `EMAILADDRESS` - Email address field
- `FREEFORMTEXT` - Free-form text field
- `INTEGER` - Integer field
- `LIST(list_id)` - List/record field with reference
  - Standard lists: `LIST(department)`, `LIST(location)`, `LIST(subsidiary)`
  - Custom lists: `LIST(customlist_departments)` or `LIST(my_custom_list)` (auto-prefixed)
- `LONGTEXT` - Long text field
- `PERCENT` - Percentage field
- `PHONENUMBER` - Phone number field
- `TEXTAREA` - Text area field

## Supported Record Types

The DML operations support both standard NetSuite records and custom record types:

### Standard NetSuite Records

Table names are mapped to NetSuite record types:

| Table Name | NetSuite Record Type | Description |
|------------|---------------------|-------------|
| `customer` | Customer | Customer records |
| `vendor` | Vendor | Vendor records |
| `employee` | Employee | Employee records |
| `item` | Inventory Item | Inventory item records |
| `salesorder` | Sales Order | Sales order transactions |
| `purchaseorder` | Purchase Order | Purchase order transactions |
| `invoice` | Invoice | Invoice transactions |
| `bill` | Vendor Bill | Vendor bill transactions |
| `contact` | Contact | Contact records |
| `lead` | Lead | Lead records |
| `opportunity` | Opportunity | Opportunity records |
| `task` | Task | Task records |
| `event` | Calendar Event | Calendar event records |
| `case` | Support Case | Support case records |

### Custom Records

Custom record types use their script ID as the table name:
- `customrecord_employee` - Custom employee record
- `customrecord_project` - Custom project record
- `customrecord_*` - Any custom record type

### Custom Lists

Custom lists use their script ID as the table name:
- `customlist_departments` - Custom departments list
- `customlist_priorities` - Custom priorities list
- `customlist_*` - Any custom list

## WHERE Clause Support

The WHERE clause supports the following conditions:

### Equality Conditions
```sql
WHERE field = value
WHERE id = 123
WHERE name = 'John Doe'
```

### IN Conditions
```sql
WHERE field IN (value1, value2, value3)
WHERE id IN (123, 456, 789)
WHERE department IN ('Engineering', 'Marketing')
```

### Field Types
- **String values**: Use single or double quotes: `'value'` or `"value"`
- **Numeric values**: Use without quotes: `123`, `45.67`
- **Boolean values**: Use `true` or `false`
- **NULL values**: Use `NULL`

**Prefix Behavior:**
When a prefix is specified, it affects all generated script IDs:
- **Record script ID**: `customrecord_{prefix}{record_name}`
- **Field script IDs**: `custrecord_{prefix}{record_name}_{field_name}`
- **Display name**: `{prefix}{record_name}`

When no prefix is specified, no extra underscores are added:
- **Record script ID**: `customrecord_{record_name}`
- **Field script IDs**: `custrecord_{record_name}_{field_name}`
- **Display name**: `{record_name}`

Example with prefix "sqrt_":
- Record: `customrecord_sqrt_employee_data`
- Field: `custrecord_sqrt_employee_data_employee_name`
- Display: `sqrt_employee_data`

Example without prefix:
- Record: `customrecord_employee_data`
- Field: `custrecord_employee_data_employee_name`
- Display: `employee_data`

**Script ID Length Limits:**
NetSuite enforces a 40-character total limit on script IDs. The system automatically:
- Calculates available space after NetSuite's automatic prefixes
- Applies intelligent abbreviations only when needed (e.g., `employee` → `emp`, `department` → `dept`)
- Truncates long IDs while preserving readability
- Logs any truncations for reference

**Important:** NetSuite automatically adds prefixes, so we only pass the suffix:
- Records: Pass `"sqrt_employee_data"` → NetSuite creates `customrecord_sqrt_employee_data`
- Fields: Pass `"sqrt_employee_data_name"` → NetSuite creates `custrecord_sqrt_employee_data_name`
- Lists: Pass `"sqrt_departments"` → NetSuite creates `customlist_sqrt_departments`

Available space for our suffix:
- Records: 40 - 13 = 27 characters (NetSuite adds `customrecord_`)
- Fields: 40 - 11 = 29 characters (NetSuite adds `custrecord_`)
- Lists: 40 - 11 = 29 characters (NetSuite adds `customlist_`)

Example with long names:
- We pass: `"sqrt_employee_data_employee_name"` (30 chars)
- NetSuite creates: `custrecord_sqrt_employee_data_employee_name` (41 chars) → **Too long!**
- System truncates to: `"sqrt_emp_data_emp_name"` (22 chars)
- NetSuite creates: `custrecord_sqrt_emp_data_emp_name` (33 chars) ✅

### CREATE LIST

Creates custom lists with values and translations in NetSuite.

**Syntax:**
```sql
CREATE LIST list_name (
    prefix "prefix_value",
    description "List description"
    optionsorder "ORDER_ENTERED"
    matrixoption FALSE
    isinactive FALSE
    values [
        value "Value1" abbreviation "V1" inactive FALSE,
        value "Value2" inactive FALSE translations [
            language "es_ES", value "Valor2",
            language "fr_FR", value "Valeur2"
        ]
    ]
);
```

**Example:**
```sql
CREATE LIST priority_levels (
    prefix "sqrt_",
    description "Priority levels for tasks"
    optionsorder "ORDER_ENTERED"
    matrixoption FALSE
    isinactive FALSE
    values [
        value "High" abbreviation "H" inactive FALSE,
        value "Medium" abbreviation "M" inactive FALSE,
        value "Low" abbreviation "L" inactive FALSE
    ]
);
```

## Integration

The DML system is integrated into the main query engine (`queryEngine.js`) and follows this processing flow:

1. **Query Analysis** - `dmlParser.analyzeDMLQuery()` determines if the query is a DML statement
2. **Validation** - `dmlExecutionEngine.validateDMLOperation()` validates the parsed statement
3. **Execution** - `dmlExecutionEngine.executeDMLOperation()` executes the operation
4. **History Logging** - Results are logged to query history
5. **Response** - Results are returned to the client

## Error Handling

The DML system provides comprehensive error handling:

- **Parse Errors** - Invalid syntax in DML statements
- **Validation Errors** - Invalid field types, missing required fields, etc.
- **Execution Errors** - NetSuite API errors during record/list creation
- **System Errors** - Unexpected errors during processing

All errors are logged and returned with detailed error messages.

## Extending the System

To add new DML operations:

1. **Create Operation Module** - Add a new file in `operations/` directory
2. **Update Parser** - Add detection logic in `dmlParser.js`
3. **Update Execution Engine** - Add execution logic in `dmlExecutionEngine.js`
4. **Update Processor** - Add operation type to supported operations

### Example Operation Module Structure

```javascript
define(['N/record', 'N/error', 'N/log'], function(record, error, log) {
    'use strict';

    function execute(parsedStatement) {
        // Implementation here
        return {
            success: true,
            result: { /* operation result */ },
            error: null,
            message: 'Operation completed successfully',
            metadata: { /* operation metadata */ }
        };
    }

    return {
        execute: execute
    };
});
```

## Testing

Test DML operations by executing them in the Enhanced SuiteQL Query Tool:

1. Enter a DML statement in the query editor
2. Click "Execute Query"
3. Review the results in the output pane
4. Check query history for execution details

## Logging

The DML system provides detailed logging at multiple levels:

- **Debug** - Query analysis, parsing details
- **Audit** - Successful operations
- **Error** - Failed operations with stack traces

All logs are written to NetSuite's system logs with the title prefix "DML".
