# Enhanced SuiteQL Tool - Stored Procedures Complete Guide

## Overview
Stored procedures in the Enhanced SuiteQL Tool allow you to create reusable JavaScript functions that can execute SuiteQL queries, DML operations, and complex business logic within the NetSuite environment.

## Key Features
- ✅ **Real-time output** with `show_output=true` parameter
- ✅ **Dry run mode** with `update_records=false` for safe testing
- ✅ **SuiteQL integration** via `suiteql.query()` 
- ✅ **DML operations** via `dml.update()`, `dml.insert()`, `dml.delete()`
- ✅ **NetSuite modules** access via `require()`
- ✅ **Comprehensive error handling** and validation
- ✅ **Case-insensitive execution** (procedures stored with original case)

## Syntax
```sql
CREATE OR REPLACE PROCEDURE procedure_name AS
/**
 * JSDoc comments describing the procedure
 * @param {Object} context - Execution context
 * @param {string} context.params.param_name - Parameter description
 * @returns {Object} Return value description
 */
function procedure_name(context) {
    // Procedure implementation
}
```

## Available Context Objects

### Parameters
- `context.params` - Input parameters passed to the procedure

### SuiteQL Integration
- `suiteql.query(sql)` - Execute SuiteQL queries with automatic result handling

### DML Operations
- `dml.update(sql)` - Execute UPDATE statements
- `dml.insert(sql)` - Execute INSERT statements  
- `dml.delete(sql)` - Execute DELETE statements

### Console Output
- `console.log()` - Real-time info output (when `show_output=true`)
- `console.error()` - Real-time error output (when `show_output=true`)

### NetSuite Modules
- `require('N/query')` - NetSuite Query module
- `require('N/record')` - NetSuite Record module
- `require('N/log')` - NetSuite Log module
- `require('N/search')` - NetSuite Search module
- And all other standard NetSuite modules

## Working Example: deactivateTestCategories

### Procedure Creation
```sql
CREATE OR REPLACE PROCEDURE deactivateTestCategories AS
/**
 * Deactivate test categories based on name pattern
 *
 * @param {Object} context - Execution context
 * @param {string} context.params.name - Name pattern to search for in category names
 * @param {boolean} context.params.update_records - Whether to actually update records (default: false for dry run)
 * @param {boolean} context.params.show_output - Whether to display real-time output (default: false)
 * @returns {Object} Processing results
 */
function deactivateTestCategories(context) {
    // Import NetSuite modules
    var query = require('N/query');
    var record = require('N/record');
    var log = require('N/log');

    // Extract and validate parameters
    var params = context.params || {};
    var name = (params.name || '').trim();
    var update_records = params.update_records === true;
    var show_output = params.show_output === true;

    // Real-time output
    if (show_output) {
        console.log('Starting category deactivation process...');
        console.log('Name pattern: ' + name);
        console.log('Update Records: ' + (update_records ? 'Yes' : 'No (Dry Run)'));
    }

    // Initialize output
    var output = {
        success: true,
        processed_count: 0,
        found_count: 0,
        errors: []
    };

    // Validate inputs
    if (!name || name.length === 0) {
        output.success = false;
        output.errors.push('Name parameter is required and cannot be empty');
        if (show_output) {
            console.error('Validation failed: Name parameter is required');
        }
        return output;
    }

    try {
        // Execute SuiteQL query
        var suiteQL = `
            SELECT id, name, isinactive
            FROM CUSTOMLIST_SQRT_QUERY_CATEGORIES
            WHERE name LIKE '%` + name + `%'
            ORDER BY name
        `;

        var categories = suiteql.query(suiteQL);

        if (categories.success && categories.records) {
            output.found_count = categories.records.length;

            // Process each category
            categories.records.forEach(function(category) {
                var categoryId = category.id;
                var categoryName = category.name;
                var isCurrentlyInactive = category.isinactive;

                // Skip if already inactive (false means inactive in NetSuite)
                if (!isCurrentlyInactive) {
                    if (show_output) {
                        console.log('Skipping - already inactive: ' + categoryName);
                    }
                    return;
                }

                // Update category to inactive
                if (update_records) {
                    var updateResult = dml.update(
                        "UPDATE CUSTOMLIST_SQRT_QUERY_CATEGORIES SET isinactive = true WHERE id = " + categoryId + " COMMIT"
                    );

                    if (updateResult.success) {
                        output.processed_count++;
                        if (show_output) {
                            console.log('✓ Successfully deactivated: "' + categoryName + '" (ID: ' + categoryId + ')');
                        }
                    } else {
                        var errorMsg = 'Failed to update category "' + categoryName + '": ' + (updateResult.error || 'Unknown error');
                        output.errors.push(errorMsg);
                        if (show_output) {
                            console.error('✗ ' + errorMsg);
                        }
                    }
                } else {
                    // Dry run mode
                    output.processed_count++;
                    if (show_output) {
                        console.log('✓ Would deactivate: "' + categoryName + '" (ID: ' + categoryId + ') [DRY RUN]');
                    }
                }
            });
        }
    } catch (e) {
        output.success = false;
        output.errors.push('Query or execution failed: ' + e.message);
        if (show_output) {
            console.error(e.message);
        }
    }

    // Final summary
    if (show_output) {
        console.log('=== EXECUTION SUMMARY ===');
        console.log('Categories found: ' + output.found_count);
        console.log('Categories processed: ' + output.processed_count);
        console.log('Errors encountered: ' + output.errors.length);
        console.log('Records updated: ' + (update_records ? 'Yes' : 'No (Dry Run)'));
        console.log('Execution completed successfully: ' + (output.success ? 'Yes' : 'No'));
    }

    return output;
}
```

### Usage Examples

#### 1. Dry Run (Preview Mode)
```sql
CALL deactivateTestCategories(name="Test", show_output=true)
```

#### 2. Live Execution with Output
```sql
CALL deactivateTestCategories(name="Test", update_records=true, show_output=true)
```

#### 3. Silent Execution
```sql
CALL deactivateTestCategories(name="Test", update_records=true)
```

### Expected Output Structure
```json
{
    "success": true,
    "processed_count": 4,
    "found_count": 4,
    "errors": []
}
```

## Best Practices

1. **Always test with dry run first**: Use `update_records=false` to preview changes
2. **Use show_output for debugging**: Set `show_output=true` to see detailed execution flow
3. **Validate parameters**: Always validate input parameters and provide clear error messages
4. **Handle errors gracefully**: Use try-catch blocks and collect errors in an array
5. **Provide execution summary**: Include summary information in console output
6. **Use COMMIT in DML**: Add `COMMIT` to DML statements for immediate persistence
7. **Document thoroughly**: Use JSDoc comments to document parameters and return values

## Common Patterns

### Parameter Validation
```javascript
if (!requiredParam || requiredParam.length === 0) {
    output.success = false;
    output.errors.push('Parameter is required');
    return output;
}
```

### Real-time Output
```javascript
if (show_output) {
    console.log('Processing item: ' + itemName);
}
```

### DML Operations
```javascript
var updateResult = dml.update(
    "UPDATE table_name SET field = value WHERE id = " + recordId + " COMMIT"
);
```

### Error Handling
```javascript
try {
    // Operation
} catch (e) {
    output.errors.push('Error: ' + e.message);
    if (show_output) {
        console.error('Error: ' + e.message);
    }
}
```

This guide provides everything needed to create powerful, reliable stored procedures in the Enhanced SuiteQL Tool!
