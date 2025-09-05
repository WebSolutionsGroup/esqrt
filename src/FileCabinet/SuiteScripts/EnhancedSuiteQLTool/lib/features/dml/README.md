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

### CREATE RECORD

Creates custom record types with fields in NetSuite.

**Syntax:**
```sql
CREATE RECORD record_name (
    field1 TYPE,
    field2 TYPE(options),
    field3 TYPE
);
```

**Example:**
```sql
CREATE RECORD employee_data (
    employee_name FREEFORMTEXT,
    hire_date DATE,
    department LIST(customlist_departments),
    salary CURRENCY,
    active CHECKBOX
);
```

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
- `LONGTEXT` - Long text field
- `PERCENT` - Percentage field
- `PHONENUMBER` - Phone number field
- `TEXTAREA` - Text area field

### CREATE LIST

Creates custom lists with values and translations in NetSuite.

**Syntax:**
```sql
CREATE LIST list_name (
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
