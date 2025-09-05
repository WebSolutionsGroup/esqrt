/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Constants Module
 * 
 * This module contains all configuration constants and settings
 * used throughout the Enhanced SuiteQL Query Tool.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([], function() {
    
    /**
     * Configuration Constants
     */
    var CONFIG = {
        // Feature toggles
        DATATABLES_ENABLED: false,
        REMOTE_LIBRARY_ENABLED: true,
        TOOL_UPGRADES_ENABLED: true,
        WORKBOOKS_ENABLED: false,
        
        // Default settings
        ROWS_RETURNED_DEFAULT: 25,
        QUERY_FOLDER_ID: null,
        
        // Version information
        VERSION: 'v2025.1',
        
        // UI Constants
        UI: {
            ZOOM: {
                MIN: 50,
                MAX: 200,
                DEFAULT: 100,
                STEP: 10
            },
            SIDEBAR: {
                MIN_WIDTH: 200,
                MAX_WIDTH: 500,
                DEFAULT_WIDTH: 300
            },
            EDITOR: {
                MIN_HEIGHT: 150,
                DEFAULT_FONT_SIZE: 14
            },
            QUERY_HISTORY: {
                MAX_ITEMS: 10,
                PREVIEW_LENGTH: 60
            }
        },
        
        // External CDN URLs
        CDN: {
            BOOTSTRAP_CSS: 'https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
            BOOTSTRAP_JS: 'https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
            CODEMIRROR_CSS: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css',
            CODEMIRROR_JS: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js',
            CODEMIRROR_SQL: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/mode/sql/sql.min.js',
            CODEMIRROR_THEME: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/theme/monokai.min.css',
            CODEMIRROR_HINT_CSS: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/hint/show-hint.min.css',
            CODEMIRROR_HINT_JS: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/hint/show-hint.min.js',
            CODEMIRROR_SQL_HINT: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/hint/sql-hint.min.js',
            CODEMIRROR_ADDON_MARK_SELECTION: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/selection/mark-selection.min.js',
            SPLIT_CSS: 'https://cdnjs.cloudflare.com/ajax/libs/split.js/1.6.0/split.min.css',
            SPLIT_JS: 'https://cdnjs.cloudflare.com/ajax/libs/split.js/1.6.0/split.min.js',
            DATATABLES_CSS: 'https://cdn.datatables.net/1.10.25/css/jquery.dataTables.css',
            DATATABLES_JS: 'https://cdn.datatables.net/1.10.25/js/jquery.dataTables.js',
            JQUERY: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js'
        },
        
        // SQL Keywords for auto-completion
        SQL_KEYWORDS: [
            'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'JOIN',
            'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'UNION', 'UNION ALL',
            'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'INDEX',
            'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL',
            'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'TOP', 'LIMIT',
            'ASC', 'DESC', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'AS', 'ON', 'USING', 'WITH', 'RECURSIVE', 'OFFSET', 'FETCH',
            'BUILTIN.DF', 'TO_CHAR', 'TO_DATE', 'SUBSTR', 'LENGTH', 'UPPER', 'LOWER',
            'COALESCE', 'NULLIF', 'CAST', 'CONVERT',
            // Stored procedure and function keywords
            'FUNCTION', 'PROCEDURE', 'REPLACE', 'CALL', 'RETURNS', 'RETURN',
            'BEGIN', 'END', 'DECLARE', 'SET', 'IF', 'WHILE', 'FOR', 'LOOP',
            // Boolean and null values
            'TRUE', 'FALSE', 'NULL'
        ],
        
        // Common NetSuite tables for auto-completion
        NETSUITE_TABLES: [
            'Employee', 'Customer', 'Vendor', 'Item', 'Transaction', 'Account',
            'Department', 'Location', 'Class', 'Subsidiary', 'Currency',
            'TransactionLine', 'ItemFulfillment', 'SalesOrder', 'PurchaseOrder',
            'Invoice', 'Bill', 'CashSale', 'Check', 'Deposit', 'JournalEntry',
            'Contact', 'Lead', 'Prospect', 'Partner', 'Project', 'Task',
            'TimeEntry', 'ExpenseReport', 'PayrollItem', 'TaxCode', 'TaxGroup',
            'PriceLevel', 'DiscountItem', 'PaymentItem', 'OtherChargeItem',
            'ServiceItem', 'InventoryItem', 'NonInventoryItem', 'KitItem',
            'AssemblyItem', 'GiftCertificateItem', 'DownloadItem', 'MarkupItem',
            'SubtotalItem', 'EndGroup', 'BeginGroup', 'DescriptionItem'
        ],
        
        // Common NetSuite fields for auto-completion
        NETSUITE_FIELDS: [
            'ID', 'InternalId', 'ExternalId', 'Name', 'Email', 'Phone',
            'FirstName', 'LastName', 'CompanyName', 'Date', 'Amount',
            'Quantity', 'Rate', 'Total', 'Status', 'Type', 'Number',
            'Memo', 'Description', 'Created', 'LastModified', 'CreatedBy',
            'LastModifiedBy', 'IsInactive', 'Entity', 'Item', 'Account',
            'Department', 'Location', 'Class', 'Subsidiary', 'Currency',
            'TranDate', 'TranId', 'PostingPeriod', 'DueDate', 'Terms',
            'ShipDate', 'ShipMethod', 'ShipTo', 'BillTo', 'SalesRep',
            'Partner', 'LeadSource', 'PromoCode', 'CouponCode', 'DiscountItem',
            'TaxItem', 'TaxCode', 'TaxRate', 'GrossAmount', 'NetAmount',
            'TaxAmount', 'ForeignAmount', 'ExchangeRate', 'Approved',
            'ApprovalStatus', 'NextApprover', 'Source', 'Reversing'
        ]
    };
    
    /**
     * Error Messages
     */
    var ERROR_MESSAGES = {
        QUERY_EMPTY: 'Please enter a query.',
        TEMPLATE_EMPTY: 'Please enter a template.',
        INVALID_ROW_BEGIN: 'Enter an integer for the beginning row.',
        INVALID_ROW_END: 'Enter an integer for the ending row.',
        PARSE_RESPONSE_ERROR: 'Unable to parse the response.',
        UNRESOLVED_VIEW: 'Unresolved View',
        NO_SQL_FILES: 'No SQL Files',
        NO_WORKBOOKS: 'No Workbooks'
    };
    
    /**
     * Success Messages
     */
    var SUCCESS_MESSAGES = {
        FILE_SAVED: 'Query saved successfully.',
        QUERY_EXECUTED: 'Query executed successfully.',
        DATA_COPIED: 'Data copied to clipboard.'
    };
    
    /**
     * Default SQL Query Template
     */
    var DEFAULT_QUERY = `SELECT
	ID,
	LastName,
	FirstName,
	Phone,
	Email
FROM
	Employee`;
    
    /**
     * CSS Class Names
     */
    var CSS_CLASSES = {
        CODEOSS_CONTAINER: 'codeoss-container',
        CODEOSS_TOOLBAR: 'codeoss-toolbar',
        CODEOSS_SIDEBAR: 'codeoss-sidebar',
        CODEOSS_EDITOR: 'codeoss-editor-container',
        CODEOSS_RESULTS: 'codeoss-results-container',
        CODEOSS_BTN: 'codeoss-btn',
        CODEOSS_BTN_SECONDARY: 'codeoss-btn-secondary',
        CODEOSS_TABLE: 'codeoss-table',
        QUERY_HISTORY_ITEM: 'query-history-item'
    };
    
    /**
     * HTML Element IDs
     */
    var ELEMENT_IDS = {
        QUERY_UI: 'queryUI',
        QUERY_TEXTAREA: 'query',
        RESULTS_DIV: 'resultsDiv',
        WELCOME_MESSAGE: 'welcomeMessage',
        STATUS_TEXT: 'statusText',
        CURSOR_POSITION: 'cursorPosition',
        ZOOM_LEVEL: 'zoomLevel',
        FILE_INFO: 'fileInfo',
        QUERY_HISTORY_LIST: 'query-history-list',
        CONTROLS_PANEL: 'controlsPanel',
        CONTROLS_CONTENT: 'controlsContent',
        COPY_CLIPBOARD_BTN: 'copyToClipboardBtn',
        TOGGLE_CONTROLS_BTN: 'toggleControlsBtn',
        QUERY_RESULTS_HEADER: 'queryResultsHeader',
        RESPONSE_DATA: 'responseData',
        ROW_BEGIN: 'rowBegin',
        ROW_END: 'rowEnd',
        RETURN_ALL: 'returnAll',
        ENABLE_PAGINATION: 'enablePagination',
        ROW_RANGE_DIV: 'rowRangeDiv',
        HIDE_ROW_NUMBERS: 'hideRowNumbers',
        RETURN_TOTALS: 'returnTotals',
        ENABLE_VIEWS: 'enableViews',
        NULL_FORMAT_DIV: 'nullFormatDiv',
        TEMPLATE: 'template'
    };
    
    /**
     * Modal IDs
     */
    var MODAL_IDS = {
        LOCAL_LOAD: 'localLoadModal',
        REMOTE_LOAD: 'remoteLoadModal',
        SAVE: 'saveModal',
        WORKBOOKS: 'workbooksModal',
        PARAMETERS: 'parametersModal'
    };
    
    /**
     * Request Function Names
     */
    var REQUEST_FUNCTIONS = {
        DOCUMENT_SUBMIT: 'documentSubmit',
        QUERY_EXECUTE: 'queryExecute',
        SQL_FILE_EXISTS: 'sqlFileExists',
        SQL_FILE_LOAD: 'sqlFileLoad',
        SQL_FILE_SAVE: 'sqlFileSave',
        LOCAL_LIBRARY_FILES_GET: 'localLibraryFilesGet',
        WORKBOOK_LOAD: 'workbookLoad',
        WORKBOOKS_GET: 'workbooksGet',

        DOCUMENT_GENERATE: 'documentGenerate',
        SAVED_QUERY_SAVE: 'savedQuerySave',
        SAVED_QUERY_UPDATE: 'savedQueryUpdate',
        SAVED_QUERY_LOAD: 'savedQueryLoad',
        SAVED_QUERY_DELETE: 'savedQueryDelete',
        SAVED_QUERIES_LIST: 'savedQueriesList',
        QUERY_HISTORY_SAVE: 'queryHistorySave',
        QUERY_HISTORY_LIST: 'queryHistoryList',
        QUERY_HISTORY_DELETE: 'queryHistoryDelete',
        QUERY_HISTORY_CLEAR: 'queryHistoryClear',
        QUERY_HISTORY_TEST: 'queryHistoryTest'
    };
    
    /**
     * Export the constants object
     */
    return {
        CONFIG: CONFIG,
        ERROR_MESSAGES: ERROR_MESSAGES,
        SUCCESS_MESSAGES: SUCCESS_MESSAGES,
        DEFAULT_QUERY: DEFAULT_QUERY,
        CSS_CLASSES: CSS_CLASSES,
        ELEMENT_IDS: ELEMENT_IDS,
        MODAL_IDS: MODAL_IDS,
        REQUEST_FUNCTIONS: REQUEST_FUNCTIONS
    };
    
});
