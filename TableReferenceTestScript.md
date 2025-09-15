# Table Reference Functionality Test Script
## Enhanced SuiteQL Query Tool - Release 1.3.0

### Overview
This test script provides comprehensive testing procedures for the new Table Reference functionality introduced in Release 1.3.0. The Table Reference feature allows users to browse available NetSuite record types, view detailed field information, explore join relationships, and preview data.

### Prerequisites
- Enhanced SuiteQL Query Tool v1.3.0 deployed to NetSuite
- User with appropriate permissions to access Records Catalog
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## Test Case 1: Table Explorer Sidebar Section

### Test 1.1: Table Explorer Visibility
**Objective**: Verify the Table Explorer section appears in the sidebar

**Steps**:
1. Open the Enhanced SuiteQL Query Tool
2. Look for the "TABLE EXPLORER" section in the left sidebar
3. Verify it appears below "SAVED QUERIES" section

**Expected Results**:
- Table Explorer section is visible with collapsed state (▶ icon)
- Section title shows "TABLE EXPLORER"
- Search box is not visible when collapsed

### Test 1.2: Table Explorer Expansion
**Objective**: Test expanding and collapsing the Table Explorer section

**Steps**:
1. Click on the "TABLE EXPLORER" section header
2. Verify the section expands
3. Click the header again to collapse

**Expected Results**:
- Section expands showing search box and category tree
- Icon changes from ▶ to ▼ when expanded
- Other sidebar sections collapse (accordion behavior)
- Section collapses when clicked again

### Test 1.3: Search Functionality
**Objective**: Test the record type search functionality

**Steps**:
1. Expand the Table Explorer section
2. Click in the search box
3. Type "employee"
4. Observe filtering results
5. Clear the search box

**Expected Results**:
- Search box accepts input
- Categories and items filter based on search term
- Categories with no matching items are hidden
- Clearing search restores all items

---

## Test Case 2: Table Categories and Data Loading

### Test 2.1: System Category
**Objective**: Test loading and displaying system record types

**Steps**:
1. Expand the Table Explorer section
2. Click on "📊 SYSTEM" category header
3. Wait for data to load
4. Verify record types are displayed

**Expected Results**:
- System category expands (icon changes to ▼)
- Loading occurs (may take a few seconds)
- Standard NetSuite record types are displayed grouped by Record Family:
  - ENTITY family: Employee, Customer, Vendor, Contact, etc.
  - TRANSACTION family: Sales Order, Invoice, Purchase Order, etc.
  - ITEM family: Inventory Item, Service Item, etc.
  - Other families as available in your NetSuite account
- Each family header shows the family name and count (e.g., "ENTITY (15)")
- Each item shows label and ID
- Items are clickable

### Test 2.2: Custom Category
**Objective**: Test loading custom record types

**Steps**:
1. Click on "📁 CUSTOM" category header
2. Wait for data to load
3. Verify custom record types are displayed

**Expected Results**:
- Custom category expands
- Custom record types and lists are displayed grouped by Record Family:
  - CUSTOM family: Custom record types (starting with "customrecord_")
  - CUSTOMLIST family: Custom lists (starting with "customlist_")
- Each family header shows the family name and count
- If no custom records exist, shows "No custom available" message

### Test 2.3: Functions and Procedures Categories
**Objective**: Test placeholder categories for future functionality

**Steps**:
1. Click on "📋 FUNCTIONS" category header
2. Click on "⚙️ PROCEDURES" category header

**Expected Results**:
- Categories expand but show "No functions/procedures available" message
- This is expected as these features are planned for future releases

---

## Test Case 3: Table Reference Tab Opening

### Test 3.1: Opening Table Reference
**Objective**: Test opening a table reference from the explorer

**Steps**:
1. Expand System category
2. Click on "Employee" record type
3. Observe the main content area

**Expected Results**:
- A new tab opens with "Employee" as the title
- Main content area switches to table reference view
- Tab appears in the query tabs bar
- Loading indicator appears initially

### Test 3.2: Multiple Table References
**Objective**: Test opening multiple table references

**Steps**:
1. Open "Employee" table reference
2. Open "Customer" table reference
3. Switch between tabs

**Expected Results**:
- Both tabs appear in the tab bar
- Can switch between table reference tabs
- Each tab maintains its own state
- Active tab is highlighted

### Test 3.3: Duplicate Table Reference
**Objective**: Test opening the same table reference twice

**Steps**:
1. Open "Employee" table reference
2. Try to open "Employee" again from the explorer

**Expected Results**:
- No duplicate tab is created
- Existing "Employee" tab becomes active
- No additional loading occurs

---

## Test Case 4: Table Reference Sub-tabs

### Test 4.1: Overview Tab
**Objective**: Test the Overview sub-tab functionality

**Steps**:
1. Open any table reference (e.g., "Employee")
2. Ensure "OVERVIEW" tab is active (should be default)
3. Review the displayed information

**Expected Results**:
- Overview tab is active by default
- Shows Record Type Overview section with:
  - ID, Original Name, Origin, Record Family, Available, Feature, Permission
- Shows Data Information section with:
  - Number of Rows (initially shows "Loading..." with spinner), Last Modified, First Created
- Row count loads automatically and displays formatted number (e.g., "1,234")
- Information is properly formatted and readable

### Test 4.2: Row Count Loading
**Objective**: Test the automatic row count loading functionality

**Steps**:
1. Open any table reference (e.g., "Employee")
2. Observe the "Number of Rows" field in the Overview tab
3. Wait for the row count to load
4. If an error occurs, click on the error message to retry

**Expected Results**:
- Initially shows "Loading..." with a spinning indicator
- Row count loads automatically (may take 5-15 seconds for large tables)
- Displays formatted number with commas (e.g., "1,234" or "15,678")
- If error occurs, shows clickable error message for retry
- Error cases handle gracefully (permissions, network issues, etc.)

### Test 4.3: Fields Tab
**Objective**: Test the Fields sub-tab functionality

**Steps**:
1. In an open table reference, click "FIELDS" tab
2. Wait for fields to load
3. Review the fields table

**Expected Results**:
- Fields tab becomes active (highlighted)
- Shows field count in header
- Displays fields table with columns: checkbox, Name, Type, Available, Feature, Permission, Join
- First field is selected by default
- Selection count shows "1 field selected"

### Test 4.4: Fields Selection and Query Generation
**Objective**: Test field selection and query generation

**Steps**:
1. In the Fields tab, select/deselect various fields
2. Click "Select All" button
3. Click "Query" button

**Expected Results**:
- Field selection updates the count display
- Select All selects all fields
- Query button generates a SELECT statement
- New query tab opens with generated SQL
- Generated query includes selected fields

### Test 4.5: Fields Filtering
**Objective**: Test field filtering functionality

**Steps**:
1. In the Fields tab, type in the "Filter Search Fields" box
2. Try filtering for "name"
3. Clear the filter

**Expected Results**:
- Fields table filters based on search term
- Only matching fields are visible
- Clearing filter restores all fields

### Test 4.6: Joins Tab
**Objective**: Test the Joins sub-tab functionality

**Steps**:
1. Click "JOINS" tab
2. Review join relationships
3. Click on a linked table name

**Expected Results**:
- Shows join relationships table
- Displays Join Type, Source/Target Record Type, Field ID, Cardinality, Available
- Linked table names are clickable
- Clicking a linked table opens that table's reference

### Test 4.7: Preview Tab
**Objective**: Test the Preview sub-tab functionality

**Steps**:
1. Click "PREVIEW" tab
2. Wait for preview to load
3. Click "Generate Preview Query" button

**Expected Results**:
- Shows preview interface with controls
- Initially shows loading message
- "Generate Preview Query" button creates a new query tab
- Generated query is a simple SELECT * with LIMIT

---

## Test Case 5: Integration with Existing Features

### Test 5.1: Tab Management Integration
**Objective**: Test integration with existing tab system

**Steps**:
1. Open a regular query tab
2. Open a table reference tab
3. Switch between different tab types
4. Close tabs

**Expected Results**:
- Table reference tabs integrate seamlessly with query tabs
- Can switch between query and table reference tabs
- Tab closing works for both types
- Tab counter resets appropriately

### Test 5.2: Theme Integration
**Objective**: Test theme compatibility

**Steps**:
1. Open table reference with light theme
2. Toggle to dark theme
3. Verify all elements update properly

**Expected Results**:
- All table reference elements respect theme changes
- Colors, borders, and backgrounds update appropriately
- Text remains readable in both themes
- No visual artifacts or inconsistencies

### Test 5.3: Responsive Layout
**Objective**: Test responsive behavior

**Steps**:
1. Open table reference
2. Resize browser window
3. Toggle sidebar
4. Test on different screen sizes

**Expected Results**:
- Table reference content adapts to window size
- Sidebar toggle works with table reference open
- Content remains accessible at different sizes
- No horizontal scrolling issues

---

## Test Case 6: Error Handling and Edge Cases

### Test 6.1: Network Error Handling
**Objective**: Test behavior when NetSuite API is unavailable

**Steps**:
1. Simulate network issues (if possible)
2. Try to load table explorer data
3. Observe error handling

**Expected Results**:
- Graceful error messages appear
- Retry functionality is available
- Application doesn't crash or become unresponsive

### Test 6.2: Empty Data Handling
**Objective**: Test behavior with no data

**Steps**:
1. Check custom category when no custom records exist
2. Check tables with no joins
3. Verify empty state messages

**Expected Results**:
- Appropriate "no data" messages are displayed
- UI remains functional
- No JavaScript errors occur

### Test 6.3: Large Data Sets
**Objective**: Test performance with large amounts of data

**Steps**:
1. Open table reference for a table with many fields
2. Test search/filter performance
3. Check memory usage

**Expected Results**:
- Large field lists load without issues
- Search/filter remains responsive
- No significant memory leaks
- Reasonable loading times

---

## Test Case 7: Browser Compatibility

### Test 7.1: Chrome Testing
**Steps**: Repeat core functionality tests in Chrome
**Expected Results**: All features work as expected

### Test 7.2: Firefox Testing
**Steps**: Repeat core functionality tests in Firefox
**Expected Results**: All features work as expected

### Test 7.3: Safari Testing
**Steps**: Repeat core functionality tests in Safari
**Expected Results**: All features work as expected

### Test 7.4: Edge Testing
**Steps**: Repeat core functionality tests in Edge
**Expected Results**: All features work as expected

---

## Performance Benchmarks

### Expected Performance Metrics:
- Table Explorer initial load: < 3 seconds
- Category expansion: < 2 seconds
- Table reference opening: < 5 seconds
- Field filtering: < 500ms response time
- Tab switching: < 200ms

### Memory Usage:
- No significant memory leaks during extended use
- Reasonable memory consumption for cached data

---

## Known Limitations (Release 1.3.0)

1. **Functions and Procedures**: Categories are placeholders for future implementation
2. **Preview Data**: Currently generates query instead of showing actual preview
3. **Row Counts**: Not available in overview (would require additional API calls)
4. **Custom Field Details**: Limited metadata available through Records Catalog API

---

## Reporting Issues

When reporting issues, please include:
1. Browser type and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console error messages (if any)
5. Screenshots (if applicable)

---

## Test Completion Checklist

- [ ] All test cases executed
- [ ] Performance benchmarks met
- [ ] Browser compatibility verified
- [ ] Error handling tested
- [ ] Integration with existing features confirmed
- [ ] Documentation reviewed and updated
- [ ] Known limitations documented
