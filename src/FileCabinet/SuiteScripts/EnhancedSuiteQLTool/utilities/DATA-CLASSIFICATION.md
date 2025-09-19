# NetSuite Table Classification Guide

This document outlines the classification hierarchy for NetSuite tables based on the standard NetSuite navigation structure.

## 🚀 Quick Start - Running the Classification

### Method 1: Browser Console (Recommended)
1. **Export your table metadata** using the Enhanced SuiteQL Tool metadata exporter
2. **Open any browser page** and press F12 → Console
3. **Copy and paste** the entire `classifyNetSuiteTables.js` script
4. **Run**: `classifyNetSuiteTables()`
5. **Select** your `netsuite_tables_metadata_*.csv` file when prompted
6. **Download** the classified CSV automatically

### Method 2: Node.js (Local Processing) - Just Do It
1. **Ensure you have Node.js installed**
2. **Place your CSV file** in the utilities directory
3. **Update the file path** in `processTableClassification.js` (line 265)
4. **Run**: `node processTableClassification.js`
5. **Find output** in `netsuite_tables_classified_*.csv`

### Method 3: Direct Processing
The classification engine automatically processes your metadata and generates:
- **Input**: `netsuite_tables_metadata_*.csv`
- **Output**: `netsuite_tables_classified_*.csv`

## 📊 Classification Results Summary

**Total Tables**: 1,879 classified tables
**Top Categories**:
- Customizations - Custom Records: 269 tables
- System Data - Other System: 223 tables
- Customizations - Custom Lists: 151 tables
- List Data - Items: 142 tables
- Setup Data - Company: 113 tables

## 🎯 Output Format

The classified CSV contains:
- **Table ID**: NetSuite table identifier
- **Table Label**: Human-readable name
- **Data Type**: Main category (Setup Data, List Data, etc.)
- **Category**: Subcategory (Accounting, Items, Sales, etc.)
- **Confidence**: Classification confidence (high/medium/low)
- **Record Family**: NetSuite's internal family
- **Is Custom**: Custom vs system table flag

## 🔧 Files in this Classification System

- **`classifyNetSuiteTables.js`** - Browser-based classification script
- **`processTableClassification.js`** - Node.js classification processor
- **`netsuiteTableClassifier.js`** - Core classification engine
- **`netsuite_tables_classified_2025-09-19.csv`** - Example classified output

## Classification Hierarchy

### Setup Data
**Company**
- Company Feature Setup
- Company Preferences

**Subsidiaries**
- Subsidiaries

**Departments**
- Departments

**Locations**
- Locations

**Classifications**
- Classifications

**Sales Channels**
- Sales Channels

**Accounting**
- Accounts
- Budget Exchange Rates
- Consolidated Exchange Rates
- Currency Exchange Rates
- Fiscal Calendars
- Accounting Periods
- Expense Categories
- Expense Report Policies
- Project Resource Roles

**Sales**
- Teams
- Rules
- Territories

**Marketing**
- Categories
- Audiences
- Verticals
- Families
- Search Engines
- Channels
- Offers

**Support**
- Support Cases

**Users**
- Users
- Roles

### List Data
**Accounting**
- Subsidiary
- Department
- Location
- Classification
- Account

**Activities**
- Calendar Event
- Phone Call
- Task

**Communications**
- Message
- Note

**Employees**
- Employee

**Items**
- Item (by ItemType)

**Payment Instruments**
- General Token
- Payment Card
- Payment Card Token

**Relationships**
- Customer
- Customer Subsidiary Relationship
- Entity Group
- Lead
- Lead Contact
- Prospect
- Prospect Contact
- Vendor
- Vendor Subsidiary Relationship

### Transaction Data
**Bank**
- Checks
- Deposits
- Transfers
- Credit Card Charges
- Credit Card Refunds

**Purchases**
- Purchase Orders
- Requisitions
- Requests for Quote
- Purchase Contracts
- Blanket Purchase Orders
- Purchase Order Receipts
- Vendor Return Authorizations
- Inbound Shipments

**Payables**
- Vendor Bills
- Bill Payments
- Vendor Prepayments
- Bill Variances
- Vendor Return Credits

**Sales**
- Opportunities
- Quotes
- Sales Orders
- Cash Sales
- Statement Charges

**Billing**
- Billing Operations

**Customers**
- Customer Invoices
- Customer Payments
- Credit Memos
- Refunds
- Return Authorizations
- Item Receipts
- Cash Sale Refunds
- Finance Charges
- Customer Deposits

**Order Management**
- Order Fulfillments

**Employees**
- Expense Reports
- Time Off
- Time Entries

**Inventory**
- Inventory Adjustments
- Inventory Counts
- Inventory Cost Revaluations
- Inventory Bin Transfers
- Inventory Distributions
- Inventory Transfers
- Inventory Intercompany Transfer Orders
- Inventory Transfer Orders
- Inventory Status Changes

**Manufacturing**
- Work Orders
- Assembly Builds
- Component Issues
- Completions

**Demand Planning**
- Item Demand Plans
- Item Supply Plans

**Supply Planning**
- Supply Plan Definitions

**Quota/Forecast**
- Sales Quotas
- Rep Forecasts
- Manager Forecasts

**Financial**
- Journal Entries
- Intercompany Journal Entries
- Budgets
- Allocation Schedules
- Allocation Batches
- Open Currency Balance Revaluations
- Project Intercompany Cross Charges

### Customizations

**Custom Lists**
- CUSTOMLIST_%

**Custom Records**
- CUSTOMRECORD_%

**Scripts**
- Script
- Script Deployment

**Custom Objects**
- Custom Record Type
- Custom List
- Custom Field

## 🧠 Classification Logic

The classification engine uses multiple methods to intelligently categorize tables:

### 1. Pattern Matching
- **Regex patterns** for table names, IDs, and labels
- **Keyword detection** in table descriptions
- **Family-based classification** using NetSuite's record families

### 2. Confidence Scoring
- **High**: Exact pattern/family match
- **Medium**: Family match or keyword match
- **Low**: Fallback classification

### 3. Fallback Logic
- **Custom tables**: Automatically classified by CUSTOMLIST/CUSTOMRECORD prefix
- **Family-based**: Uses NetSuite's internal record family when patterns don't match
- **Default**: System Data - Other System for unmatched tables

### 4. Classification Rules Examples

#### Setup Data - Accounting
- **Patterns**: `/account/i`, `/accounting/i`, `/fiscal/i`, `/period/i`
- **Families**: `['ACCOUNTING', 'SETUP']`
- **Keywords**: `['account', 'accounting', 'fiscal', 'period']`

#### Transaction Data - Sales
- **Patterns**: `/opportunity/i`, `/quote/i`, `/sales.*order/i`
- **Families**: `['TRANSACTION']`
- **Keywords**: `['opportunity', 'quote', 'sales']`

#### Customizations - Custom Records
- **Patterns**: `/^CUSTOMRECORD/i`
- **Families**: `['CUSTOM']`
- **Keywords**: `['customrecord']`

## 📈 Usage in Excel

After classification, you can:

1. **Create Pivot Tables** by Data Type and Category
2. **Filter by confidence level** to focus on reliable classifications
3. **Analyze customization levels** using custom vs system breakdown
4. **Group by Record Family** to see NetSuite's internal organization
5. **Track table usage** by combining with field count data

## 🔄 Re-running Classification

To re-run the classification with updated data:

1. **Export fresh metadata** from Enhanced SuiteQL Tool
2. **Update file paths** in the processing scripts
3. **Run classification** using any of the three methods above
4. **Compare results** with previous classifications to track changes

The classification system is designed to be:
- **Extensible**: Easy to add new rules and categories
- **Maintainable**: Clear separation of logic and data
- **Accurate**: Multiple validation methods ensure reliable results