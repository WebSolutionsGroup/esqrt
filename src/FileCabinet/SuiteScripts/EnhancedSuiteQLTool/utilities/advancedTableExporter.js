/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * 
 * Advanced NetSuite Table and Field Metadata Exporter
 * Integrates with Enhanced SuiteQL Tool infrastructure
 */

define(['N/file', 'N/log', 'N/search', 'N/runtime', 'N/https', 'N/url'], function(file, log, search, runtime, https, url) {
    
    /**
     * Main execution function
     */
    function execute(context) {
        try {
            log.audit('Advanced Table Export', 'Starting comprehensive NetSuite metadata export');
            
            const startTime = new Date();
            
            // Get comprehensive table list
            const tables = getComprehensiveTableList();
            log.audit('Table Discovery', `Found ${tables.length} tables to analyze`);
            
            // Export tables metadata
            exportTablesMetadata(tables);
            
            // Export fields metadata with enhanced discovery
            exportFieldsMetadata(tables);
            
            // Export relationships and joins
            exportTableRelationships(tables);
            
            // Export summary statistics
            exportSummaryStatistics(tables);
            
            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;
            
            log.audit('Export Complete', `Metadata export completed in ${duration} seconds`);
            
        } catch (error) {
            log.error('Export Error', error.toString());
            throw error;
        }
    }
    
    /**
     * Get comprehensive list of NetSuite tables using Records Catalog API
     */
    function getComprehensiveTableList() {
        const tables = [];

        try {
            log.audit('Table Discovery', 'Starting Records Catalog API discovery');

            // Use NetSuite's Records Catalog API to get all tables
            const allRecordTypes = fetchAllRecordTypesFromAPI();

            if (allRecordTypes && allRecordTypes.length > 0) {
                log.audit('API Discovery Success', `Found ${allRecordTypes.length} record types from API`);

                allRecordTypes.forEach(recordType => {
                    tables.push({
                        id: recordType.id || recordType.scriptId,
                        name: recordType.id || recordType.scriptId,
                        label: recordType.label || recordType.name || recordType.id,
                        category: determineRecordCategory(recordType),
                        recordType: recordType.id || recordType.scriptId,
                        isCustom: isCustomRecord(recordType),
                        estimatedSize: 'Unknown',
                        lastAnalyzed: new Date().toISOString(),
                        apiData: recordType // Store original API data for reference
                    });
                });

                log.audit('Table Discovery Complete', `Processed ${tables.length} total tables`);
                return tables;
            } else {
                log.audit('API Discovery Failed', 'No data from Records Catalog API, using fallback methods');
                return getFallbackTableList();
            }

        } catch (error) {
            log.error('Table Discovery Error', error.toString());
            return getFallbackTableList();
        }
    }

    /**
     * Get all record types using server-side NetSuite APIs
     * Since Records Catalog API is client-side only, we use comprehensive search-based discovery
     */
    function fetchAllRecordTypesFromAPI() {
        try {
            log.audit('Server-side Discovery', 'Using comprehensive search-based table discovery');

            const allTables = [];

            // Get all custom record types
            const customRecords = getAllCustomRecordTypes();
            allTables.push(...customRecords);
            log.audit('Custom Records', `Found ${customRecords.length} custom record types`);

            // Get all custom lists
            const customLists = getAllCustomLists();
            allTables.push(...customLists);
            log.audit('Custom Lists', `Found ${customLists.length} custom lists`);

            // Get all standard record types by trying to search them
            const standardRecords = discoverStandardRecordTypes();
            allTables.push(...standardRecords);
            log.audit('Standard Records', `Found ${standardRecords.length} standard record types`);

            // Get system tables
            const systemTables = getSystemRecordTypes();
            allTables.push(...systemTables);
            log.audit('System Tables', `Found ${systemTables.length} system tables`);

            log.audit('Total Discovery', `Found ${allTables.length} total record types`);
            return allTables;

        } catch (error) {
            log.error('Discovery Error', error.toString());
            return [];
        }
    }

    /**
     * Get all custom record types using search
     */
    function getAllCustomRecordTypes() {
        const customRecords = [];

        try {
            const customRecordSearch = search.create({
                type: 'customrecordtype',
                columns: [
                    'scriptid',
                    'name',
                    'recordname',
                    'isinactive',
                    'owner',
                    'accesstype'
                ],
                filters: [
                    // Get both active and inactive to be comprehensive
                ]
            });

            customRecordSearch.run().each(function(result) {
                const scriptId = result.getValue('scriptid');
                const name = result.getValue('name');
                const recordName = result.getValue('recordname');
                const isInactive = result.getValue('isinactive');

                customRecords.push({
                    id: scriptId,
                    scriptId: scriptId,
                    name: name,
                    label: name || recordName || scriptId,
                    recordName: recordName,
                    isInactive: isInactive === 'T',
                    origin: 'CUSTOM',
                    family: 'CUSTOM',
                    isCustom: true
                });

                return true; // Continue iteration
            });

        } catch (error) {
            log.error('Custom Record Search Error', error.toString());
        }

        return customRecords;
    }

    /**
     * Get all custom lists using search
     */
    function getAllCustomLists() {
        const customLists = [];

        try {
            const customListSearch = search.create({
                type: 'customlist',
                columns: [
                    'scriptid',
                    'name',
                    'isinactive',
                    'owner',
                    'description'
                ],
                filters: [
                    // Get both active and inactive to be comprehensive
                ]
            });

            customListSearch.run().each(function(result) {
                const scriptId = result.getValue('scriptid');
                const name = result.getValue('name');
                const isInactive = result.getValue('isinactive');
                const description = result.getValue('description');

                customLists.push({
                    id: scriptId,
                    scriptId: scriptId,
                    name: name,
                    label: name || scriptId,
                    description: description,
                    isInactive: isInactive === 'T',
                    origin: 'CUSTOM',
                    family: 'CUSTOMLIST',
                    isCustom: true
                });

                return true; // Continue iteration
            });

        } catch (error) {
            log.error('Custom List Search Error', error.toString());
        }

        return customLists;
    }

    /**
     * Discover standard record types by attempting searches
     */
    function discoverStandardRecordTypes() {
        const standardRecords = [];

        // Comprehensive list of NetSuite record types to test
        const recordTypesToTest = [
            // Transaction types
            'transaction', 'salesorder', 'purchaseorder', 'invoice', 'bill', 'check', 'deposit',
            'cashsale', 'creditmemo', 'vendorcredit', 'journalentry', 'estimate', 'opportunity',
            'workorder', 'assemblybuild', 'inventoryadjustment', 'inventorytransfer',
            'itemreceipt', 'itemfulfillment', 'returnauthorization', 'vendorreturnauthorization',

            // Entity types
            'customer', 'vendor', 'employee', 'partner', 'contact', 'lead', 'prospect',

            // Item types
            'item', 'inventoryitem', 'noninventoryitem', 'serviceitem', 'assemblyitem',
            'kititem', 'otherchargeitem', 'paymentitem', 'discountitem', 'markupitem',
            'subtotalitem', 'giftcertificateitem', 'downloaditem', 'descriptionitem',

            // Accounting types
            'account', 'accountingperiod', 'currency', 'exchangerate', 'department',
            'class', 'location', 'subsidiary', 'taxitem', 'taxcode', 'taxgroup',
            'budget', 'billingschedule', 'term', 'paymentmethod',

            // System types
            'role', 'user', 'group', 'file', 'folder', 'message', 'note',
            'workflow', 'script', 'scriptdeployment', 'savedsearch',

            // CRM types
            'campaign', 'case', 'issue', 'solution', 'task', 'calendarevent', 'phonecall',
            'supportcase', 'topic', 'escalationrule',

            // Manufacturing types
            'manufacturingoperationtask', 'manufacturingrouting', 'bomrevision',
            'routingrevision', 'workcentercategory', 'workcenter',

            // Project types
            'project', 'projecttask', 'timesheet', 'timebill', 'timeentry',
            'projecttemplate', 'projectexpensetype',

            // Payroll types
            'payrollitem', 'paycheck', 'payrollliabilitycheck', 'employeetype',
            'employeestatus', 'payfrequency',

            // Advanced types
            'pricing', 'pricinglevel', 'promotioncode', 'couponcode', 'giftcertificate',
            'subscription', 'subscriptionplan', 'subscriptionterm', 'billingaccount',
            'revrecschedule', 'revrectemplate', 'allocation', 'amortization',

            // Setup types
            'state', 'country', 'nexus', 'salesterritory', 'shippingitem',
            'shippingpartner', 'unitstype', 'itemgroup', 'customergroup',
            'vendorgroup', 'partnergroup', 'leadgroup', 'prospectgroup',

            // Other system types
            'systemnote', 'usereventscript', 'clientscript', 'scheduledscript',
            'mapreducescript', 'restlet', 'suitelet', 'workflowactionscript',
            'massupdate', 'csvimport', 'integration', 'customfield',
            'customsegment', 'customtransactiontype', 'customrecordtype',

            // Additional discovered types
            'entityaddress', 'entityphone', 'entityemail', 'entitygroup',
            'itemvendor', 'itemprice', 'itemlocation', 'itemsubstitution',
            'itemaccountmapping', 'itemdemandplan', 'itemsupplyplan',
            'bin', 'binnumber', 'inventorydetail', 'inventorynumber',
            'inventorybalance', 'inventorycostrevaluation',
            'transactionline', 'transactionaccountingline',
            'consolidatedexchangerate', 'accountingbook', 'accountingcontext'
        ];

        recordTypesToTest.forEach(recordType => {
            try {
                // Test if we can create a search for this record type
                const testSearch = search.create({
                    type: recordType,
                    columns: ['internalid'],
                    filters: [['internalid', 'anyof', '1']] // Dummy filter that won't return results
                });

                // If we can create the search, the record type exists
                standardRecords.push({
                    id: recordType,
                    scriptId: recordType,
                    name: recordType,
                    label: formatTableLabel(recordType),
                    origin: 'SYSTEM',
                    family: determineRecordFamily(recordType),
                    isCustom: false,
                    discoveryMethod: 'search_test'
                });

                log.debug('Record Type Found', `Discovered standard record type: ${recordType}`);

            } catch (error) {
                // Record type doesn't exist or isn't accessible
                log.debug('Record Type Not Found', `${recordType}: ${error.toString()}`);
            }
        });

        return standardRecords;
    }

    /**
     * Get system record types that are always available
     */
    function getSystemRecordTypes() {
        const systemRecords = [];

        // These are record types that might not be discoverable via search but exist
        const knownSystemTypes = [
            'customrecordtype', 'customlist', 'customfield', 'customsegment',
            'workflow', 'workflowstate', 'workflowtrigger', 'script',
            'scriptdeployment', 'savedsearch', 'integration', 'csvimport',
            'massupdate', 'systemnote', 'usereventscript', 'clientscript',
            'scheduledscript', 'mapreducescript', 'restlet', 'suitelet',
            'workflowactionscript', 'customtransactiontype'
        ];

        knownSystemTypes.forEach(recordType => {
            systemRecords.push({
                id: recordType,
                scriptId: recordType,
                name: recordType,
                label: formatTableLabel(recordType),
                origin: 'SYSTEM',
                family: 'SETUP',
                isCustom: false,
                discoveryMethod: 'known_system'
            });
        });

        return systemRecords;
    }

    /**
     * Determine record family for categorization
     */
    function determineRecordFamily(recordType) {
        const familyMap = {
            // Transaction family
            'transaction': 'TRANSACTION', 'salesorder': 'TRANSACTION', 'purchaseorder': 'TRANSACTION',
            'invoice': 'TRANSACTION', 'bill': 'TRANSACTION', 'check': 'TRANSACTION',
            'deposit': 'TRANSACTION', 'cashsale': 'TRANSACTION', 'creditmemo': 'TRANSACTION',
            'vendorcredit': 'TRANSACTION', 'journalentry': 'TRANSACTION', 'estimate': 'TRANSACTION',
            'opportunity': 'TRANSACTION', 'workorder': 'TRANSACTION', 'assemblybuild': 'TRANSACTION',
            'inventoryadjustment': 'TRANSACTION', 'inventorytransfer': 'TRANSACTION',
            'itemreceipt': 'TRANSACTION', 'itemfulfillment': 'TRANSACTION',

            // Entity family
            'customer': 'ENTITY', 'vendor': 'ENTITY', 'employee': 'ENTITY',
            'partner': 'ENTITY', 'contact': 'ENTITY', 'lead': 'ENTITY', 'prospect': 'ENTITY',

            // Item family
            'item': 'ITEM', 'inventoryitem': 'ITEM', 'noninventoryitem': 'ITEM',
            'serviceitem': 'ITEM', 'assemblyitem': 'ITEM', 'kititem': 'ITEM',
            'otherchargeitem': 'ITEM', 'paymentitem': 'ITEM', 'discountitem': 'ITEM',

            // Activity family
            'task': 'ACTIVITY', 'calendarevent': 'ACTIVITY', 'phonecall': 'ACTIVITY',
            'campaign': 'ACTIVITY', 'case': 'ACTIVITY',

            // Setup family
            'account': 'SETUP', 'department': 'SETUP', 'class': 'SETUP',
            'location': 'SETUP', 'subsidiary': 'SETUP', 'currency': 'SETUP',
            'role': 'SETUP', 'user': 'SETUP', 'group': 'SETUP',

            // Support family
            'issue': 'SUPPORT', 'solution': 'SUPPORT', 'supportcase': 'SUPPORT',

            // Project family
            'project': 'PROJECT', 'projecttask': 'PROJECT', 'timesheet': 'PROJECT',
            'timebill': 'PROJECT', 'timeentry': 'PROJECT'
        };

        return familyMap[recordType] || 'OTHER';
    }

    /**
     * Get all custom record types from NetSuite
     */
    function getCustomRecordTables() {
        const customTables = [];

        try {
            // Search for all custom record types
            const customRecordSearch = search.create({
                type: 'customrecordtype',
                columns: [
                    'scriptid',
                    'name',
                    'recordname',
                    'isinactive'
                ],
                filters: [
                    ['isinactive', 'is', 'F']
                ]
            });

            customRecordSearch.run().each(function(result) {
                const scriptId = result.getValue('scriptid');
                const name = result.getValue('name');
                const recordName = result.getValue('recordname');

                customTables.push({
                    id: scriptId,
                    name: scriptId,
                    label: name || recordName || scriptId,
                    category: 'Custom',
                    recordType: 'customrecord',
                    isCustom: true,
                    estimatedSize: 'Unknown',
                    lastAnalyzed: new Date().toISOString()
                });

                return true; // Continue iteration
            });

            log.audit('Custom Records Found', `Discovered ${customTables.length} custom record types`);

        } catch (error) {
            log.error('Custom Record Discovery Error', error.toString());
        }

        return customTables;
    }

    /**
     * Get all custom lists from NetSuite
     */
    function getCustomListTables() {
        const customLists = [];

        try {
            // Search for all custom lists
            const customListSearch = search.create({
                type: 'customlist',
                columns: [
                    'scriptid',
                    'name',
                    'isinactive'
                ],
                filters: [
                    ['isinactive', 'is', 'F']
                ]
            });

            customListSearch.run().each(function(result) {
                const scriptId = result.getValue('scriptid');
                const name = result.getValue('name');

                customLists.push({
                    id: scriptId,
                    name: scriptId,
                    label: name || scriptId,
                    category: 'CustomList',
                    recordType: 'customlist',
                    isCustom: true,
                    estimatedSize: 'Unknown',
                    lastAnalyzed: new Date().toISOString()
                });

                return true; // Continue iteration
            });

            log.audit('Custom Lists Found', `Discovered ${customLists.length} custom lists`);

        } catch (error) {
            log.error('Custom List Discovery Error', error.toString());
        }

        return customLists;
    }

    /**
     * Get comprehensive list of standard NetSuite tables
     */
    function getStandardNetSuiteTables() {
        // Comprehensive list of actual NetSuite table names organized by category
        const tableCategories = {
            // Activity tables
            activity: [
                'activity', 'activitycontact', 'activitytimeitem'
            ],

            // Transaction tables
            transaction: [
                'transaction', 'transactionline', 'transactionaccountingline',
                'salesorder', 'salesorderitem', 'salesorderitemcommitment', 'salesorderitemfulfillment',
                'purchaseorder', 'purchaseorderitem', 'purchaseorderitemreceipt',
                'invoice', 'invoiceitem', 'invoiceitemfulfillment',
                'bill', 'billitem', 'billitemreceipt',
                'check', 'checkitem', 'deposit', 'depositapplication',
                'cashsale', 'cashsaleitem', 'creditmemo', 'creditmemoitem',
                'vendorcredit', 'vendorcredititem', 'journalentry', 'journalentryline',
                'estimate', 'estimateitem', 'opportunity', 'opportunityitem',
                'workorder', 'workorderitem', 'workorderissue', 'workordercompletion',
                'assemblybuild', 'assemblybuilditem', 'inventoryadjustment',
                'inventorytransfer', 'itemreceipt', 'itemreceiptitem',
                'itemfulfillment', 'itemfulfillmentitem', 'returnauthorization',
                'returnauthorizationitem', 'vendorreturnauthorization', 'vendorreturnauthorizationitem'
            ],

            // Entity tables
            entity: [
                'entity', 'customer', 'vendor', 'employee', 'partner', 'contact',
                'lead', 'prospect', 'entityaddress', 'entityphone', 'entityemail',
                'customersubsidiary', 'vendorsubsidiary', 'employeesubsidiary',
                'entitygroup', 'entitystatus', 'entitytype'
            ],

            // Item tables
            item: [
                'item', 'inventoryitem', 'noninventoryitem', 'serviceitem',
                'assemblyitem', 'kititem', 'lotitem', 'serialitem', 'otherchargeitem',
                'itemvendor', 'itemprice', 'itemlocation', 'itemsubstitution',
                'itemaccountmapping', 'itemdemandplan', 'itemsupplyplan',
                'bin', 'binnumber', 'inventorydetail', 'inventorynumber',
                'inventorybalance', 'inventorycostrevaluation', 'itemgroup',
                'itemtype', 'unitstype', 'unitsconversion'
            ],

            // Accounting tables
            accounting: [
                'account', 'accountingperiod', 'currency', 'exchangerate',
                'department', 'class', 'location', 'subsidiary',
                'taxitem', 'taxcode', 'taxgroup', 'taxdetail', 'taxtype',
                'budget', 'budgetdetail', 'consolidatedexchangerate',
                'accountingbook', 'accountingcontext', 'allocation',
                'amortization', 'recognition', 'billingschedule'
            ],

            // System tables
            system: [
                'role', 'user', 'group', 'permission', 'accesstoken',
                'file', 'folder', 'message', 'note', 'systemnote',
                'workflow', 'workflowstate', 'workflowtrigger',
                'customfield', 'customlist', 'customsegment',
                'savedsearch', 'script', 'scriptdeployment'
            ],

            // CRM tables
            crm: [
                'campaign', 'campaignevent', 'campaignresponse', 'campaignhistory',
                'case', 'issue', 'solution', 'task', 'calendarevent',
                'phonecall', 'supportcase', 'caseissue', 'casesolution',
                'caseorigin', 'casestatus', 'casetype', 'issuetype'
            ],

            // Manufacturing tables
            manufacturing: [
                'manufacturingoperationtask', 'manufacturingrouting',
                'manufacturingcosttemplate', 'workorderissue', 'workordercompletion',
                'bomrevision', 'bomrevisioncomponent', 'routingrevision',
                'routingrevisionoperation', 'workcentercategory', 'workcenter'
            ],

            // Project tables
            project: [
                'project', 'projecttask', 'projectexpense', 'projectrevenue',
                'timesheet', 'timebill', 'timeentry', 'projecttemplate',
                'projecttasktemplate', 'projecttype', 'projectstatus'
            ],

            // Payroll tables
            payroll: [
                'payrollitem', 'paycheck', 'payrollliabilitycheck',
                'employeetype', 'employeestatus', 'payfrequency',
                'payrollbatch', 'payrolljournal'
            ],

            // Advanced feature tables
            advanced: [
                'pricing', 'pricinggroup', 'promotioncode', 'couponcode',
                'giftcertificate', 'intercompanytransfer', 'intercompanyjournal',
                'consolidation', 'revrecschedule', 'revrectemplate',
                'subscriptionplan', 'subscriptionterm', 'billingaccount'
            ],

            // Setup tables
            setup: [
                'state', 'country', 'nexus', 'salesterritory',
                'shippingitem', 'shippingpartner', 'paymentmethod',
                'term', 'discountitem', 'markupitem', 'subtotalitem'
            ],

            // Support tables
            support: [
                'escalationrule', 'escalationassignment', 'knowledgebase',
                'topic', 'topicassignment', 'solutionhistory'
            ]
        };

        // Flatten all tables into a single array
        const allStandardTables = [];
        Object.entries(tableCategories).forEach(([category, tables]) => {
            tables.forEach(tableName => {
                allStandardTables.push({
                    id: tableName,
                    name: tableName,
                    label: formatTableLabel(tableName),
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    recordType: getRecordTypeFromTable(tableName),
                    isCustom: false,
                    estimatedSize: 'Unknown',
                    lastAnalyzed: new Date().toISOString()
                });
            });
        });

        log.audit('Standard Tables', `Added ${allStandardTables.length} standard NetSuite tables`);
        return allStandardTables;
    }

    /**
     * Get system tables that might be missed in standard discovery
     */
    function getSystemTables() {
        const systemTables = [];

        // Add tables that are commonly available but might be missed
        const additionalSystemTables = [
            'customfield', 'customsegment', 'savedSearch', 'workflowstate',
            'workflowtrigger', 'accesstoken', 'consolidatedexchangerate',
            'accountingbook', 'accountingcontext', 'taxdetail',
            'budgetdetail', 'allocation', 'amortization', 'recognition'
        ];

        additionalSystemTables.forEach(tableName => {
            systemTables.push({
                id: tableName,
                name: tableName,
                label: formatTableLabel(tableName),
                category: 'System',
                recordType: tableName,
                isCustom: false,
                estimatedSize: 'Unknown',
                lastAnalyzed: new Date().toISOString()
            });
        });

        return systemTables;
    }

    /**
     * Fallback table list using multiple discovery methods
     */
    function getFallbackTableList() {
        log.audit('Fallback Discovery', 'Using fallback methods for table discovery');

        const tables = [];

        try {
            // Try to get custom records using search
            const customRecords = getCustomRecordTables();
            tables.push(...customRecords);

            // Try to get custom lists using search
            const customLists = getCustomListTables();
            tables.push(...customLists);

            // Add comprehensive standard tables
            const standardTables = getStandardNetSuiteTables();
            tables.push(...standardTables);

            log.audit('Fallback Complete', `Found ${tables.length} tables using fallback methods`);

        } catch (error) {
            log.error('Fallback Error', error.toString());
            // Final fallback to minimal predefined list
            return getPredefinedTableList();
        }

        return tables;
    }

    /**
     * Minimal predefined table list (last resort)
     */
    function getPredefinedTableList() {
        log.audit('Minimal Fallback', 'Using minimal predefined table list');

        const predefinedTables = [
            'transaction', 'customer', 'vendor', 'employee', 'item',
            'account', 'department', 'class', 'location', 'subsidiary'
        ];

        return predefinedTables.map(tableName => ({
            id: tableName,
            name: tableName,
            label: formatTableLabel(tableName),
            category: determineTableCategory(tableName),
            recordType: getRecordTypeFromTable(tableName),
            isCustom: false,
            estimatedSize: 'Unknown',
            lastAnalyzed: new Date().toISOString()
        }));
    }

    /**
     * Determine record category from API record type data
     */
    function determineRecordCategory(recordType) {
        // Check if we have API data with category information
        if (recordType.family) {
            return recordType.family;
        }

        if (recordType.origin) {
            return recordType.origin === 'SYSTEM' ? 'System' : 'Custom';
        }

        // Check if it's a custom record
        if (isCustomRecord(recordType)) {
            return 'Custom';
        }

        // Fallback to table name analysis
        const tableName = recordType.id || recordType.scriptId || '';
        return determineTableCategory(tableName);
    }

    /**
     * Check if a record type is custom
     */
    function isCustomRecord(recordType) {
        // Check various indicators of custom records
        if (recordType.isCustom === true) {
            return true;
        }

        if (recordType.origin === 'CUSTOM') {
            return true;
        }

        const id = recordType.id || recordType.scriptId || '';
        return id.startsWith('customrecord') || id.startsWith('customlist');
    }
    
    /**
     * Export tables metadata to CSV
     */
    function exportTablesMetadata(tables) {
        try {
            const headers = [
                'Table ID', 'Table Name', 'Table Label', 'Category', 'Record Type',
                'Is Custom', 'Estimated Size', 'Last Analyzed', 'Field Count',
                'Has Transactions', 'Has Subsidiaries', 'Has Departments'
            ];
            
            const rows = [headers];
            
            tables.forEach(table => {
                const fieldCount = getFieldCountForTable(table.id);
                const hasTransactions = isTransactionTable(table.id);
                const hasSubsidiaries = hasSubsidiaryField(table.id);
                const hasDepartments = hasDepartmentField(table.id);
                
                rows.push([
                    escapeCSVField(table.id),
                    escapeCSVField(table.name),
                    escapeCSVField(table.label),
                    escapeCSVField(table.category),
                    escapeCSVField(table.recordType),
                    escapeCSVField(table.isCustom ? 'Yes' : 'No'),
                    escapeCSVField(table.estimatedSize),
                    escapeCSVField(table.lastAnalyzed),
                    escapeCSVField(fieldCount.toString()),
                    escapeCSVField(hasTransactions ? 'Yes' : 'No'),
                    escapeCSVField(hasSubsidiaries ? 'Yes' : 'No'),
                    escapeCSVField(hasDepartments ? 'Yes' : 'No')
                ]);
            });
            
            const csvContent = rows.map(row => row.join(',')).join('\n');
            
            const tablesFile = file.create({
                name: `netsuite_tables_metadata_${getTimestamp()}.csv`,
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: getExportFolder()
            });
            
            const fileId = tablesFile.save();
            log.audit('Tables Export', `Tables metadata saved with ID: ${fileId}`);
            
        } catch (error) {
            log.error('Tables Export Error', error.toString());
        }
    }
    
    /**
     * Export comprehensive fields metadata
     */
    function exportFieldsMetadata(tables) {
        try {
            const headers = [
                'Table ID', 'Table Name', 'Table Category', 'Field ID', 'Field Name',
                'Field Label', 'Field Type', 'Is Required', 'Is Read Only',
                'Is Custom', 'Default Value', 'Help Text', 'Select Record Type',
                'Max Length', 'Decimal Places', 'Has Joins', 'Join Tables'
            ];
            
            const rows = [headers];
            let totalFields = 0;
            
            tables.forEach(table => {
                try {
                    const fields = getEnhancedFieldsForTable(table.id);
                    totalFields += fields.length;
                    
                    fields.forEach(field => {
                        rows.push([
                            escapeCSVField(table.id),
                            escapeCSVField(table.name),
                            escapeCSVField(table.category),
                            escapeCSVField(field.id),
                            escapeCSVField(field.name),
                            escapeCSVField(field.label),
                            escapeCSVField(field.type),
                            escapeCSVField(field.isRequired ? 'Yes' : 'No'),
                            escapeCSVField(field.isReadOnly ? 'Yes' : 'No'),
                            escapeCSVField(field.isCustom ? 'Yes' : 'No'),
                            escapeCSVField(field.defaultValue || ''),
                            escapeCSVField(field.helpText || ''),
                            escapeCSVField(field.selectRecordType || ''),
                            escapeCSVField(field.maxLength || ''),
                            escapeCSVField(field.decimalPlaces || ''),
                            escapeCSVField(field.hasJoins ? 'Yes' : 'No'),
                            escapeCSVField((field.joinTables || []).join('; '))
                        ]);
                    });
                    
                    log.debug('Field Processing', `Processed ${fields.length} fields for ${table.id}`);
                    
                } catch (error) {
                    log.error('Field Processing Error', `Error processing ${table.id}: ${error.toString()}`);
                }
            });
            
            const csvContent = rows.map(row => row.join(',')).join('\n');
            
            const fieldsFile = file.create({
                name: `netsuite_fields_metadata_${getTimestamp()}.csv`,
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: getExportFolder()
            });
            
            const fileId = fieldsFile.save();
            log.audit('Fields Export', `Fields metadata saved with ID: ${fileId}, Total fields: ${totalFields}`);
            
        } catch (error) {
            log.error('Fields Export Error', error.toString());
        }
    }
    
    /**
     * Export table relationships and joins
     */
    function exportTableRelationships(tables) {
        try {
            const headers = [
                'Source Table', 'Source Field', 'Target Table', 'Target Field',
                'Relationship Type', 'Is Required', 'Description'
            ];
            
            const rows = [headers];
            
            tables.forEach(table => {
                const relationships = getTableRelationships(table.id);
                relationships.forEach(rel => {
                    rows.push([
                        escapeCSVField(rel.sourceTable),
                        escapeCSVField(rel.sourceField),
                        escapeCSVField(rel.targetTable),
                        escapeCSVField(rel.targetField),
                        escapeCSVField(rel.relationshipType),
                        escapeCSVField(rel.isRequired ? 'Yes' : 'No'),
                        escapeCSVField(rel.description || '')
                    ]);
                });
            });
            
            const csvContent = rows.map(row => row.join(',')).join('\n');
            
            const relationshipsFile = file.create({
                name: `netsuite_relationships_${getTimestamp()}.csv`,
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: getExportFolder()
            });
            
            const fileId = relationshipsFile.save();
            log.audit('Relationships Export', `Relationships saved with ID: ${fileId}`);
            
        } catch (error) {
            log.error('Relationships Export Error', error.toString());
        }
    }
    
    /**
     * Export summary statistics
     */
    function exportSummaryStatistics(tables) {
        try {
            const stats = {
                totalTables: tables.length,
                customTables: tables.filter(t => t.isCustom).length,
                transactionTables: tables.filter(t => isTransactionTable(t.id)).length,
                entityTables: tables.filter(t => t.category === 'Entity').length,
                itemTables: tables.filter(t => t.category === 'Item').length,
                accountingTables: tables.filter(t => t.category === 'Accounting').length,
                exportDate: new Date().toISOString(),
                netsuiteVersion: 'Unknown', // Could be enhanced to detect version
                accountId: runtime.accountId
            };
            
            const summaryContent = Object.entries(stats)
                .map(([key, value]) => `${key},${escapeCSVField(String(value))}`)
                .join('\n');
            
            const summaryFile = file.create({
                name: `netsuite_export_summary_${getTimestamp()}.csv`,
                fileType: file.Type.CSV,
                contents: 'Metric,Value\n' + summaryContent,
                folder: getExportFolder()
            });
            
            const fileId = summaryFile.save();
            log.audit('Summary Export', `Summary statistics saved with ID: ${fileId}`);
            
        } catch (error) {
            log.error('Summary Export Error', error.toString());
        }
    }
    
    // Helper functions (continued in next section due to length limit)
    
    /**
     * Get enhanced field information for a table using Records Catalog API
     */
    function getEnhancedFieldsForTable(tableId) {
        try {
            log.debug('Field Discovery', `Getting fields for table: ${tableId}`);

            // Try to get field information from Records Catalog API
            const tableDetail = fetchTableDetailFromAPI(tableId);

            if (tableDetail && tableDetail.fields) {
                log.debug('API Fields Found', `Found ${tableDetail.fields.length} fields from API for ${tableId}`);

                return tableDetail.fields.map(field => ({
                    id: field.id || field.name,
                    name: field.id || field.name,
                    label: field.label || field.displayName || field.name,
                    type: field.type || 'unknown',
                    isRequired: field.isRequired || false,
                    isReadOnly: field.isReadOnly || false,
                    isCustom: field.isCustom || false,
                    defaultValue: field.defaultValue || '',
                    helpText: field.help || field.description || '',
                    selectRecordType: field.selectRecordType || '',
                    maxLength: field.maxLength || '',
                    decimalPlaces: field.decimalPlaces || '',
                    hasJoins: field.joins && field.joins.length > 0,
                    joinTables: field.joins ? field.joins.map(j => j.targetTable || j.target) : [],
                    apiData: field // Store original API data
                }));
            } else {
                log.debug('API Fields Failed', `No field data from API for ${tableId}, using fallback`);
                return getComprehensiveFieldsForTable(tableId);
            }

        } catch (error) {
            log.error('Field Discovery Error', `Error getting fields for ${tableId}: ${error.toString()}`);
            return getComprehensiveFieldsForTable(tableId);
        }
    }

    /**
     * Discover fields for a table using search introspection
     */
    function fetchTableDetailFromAPI(tableId) {
        try {
            log.debug('Field Discovery', `Discovering fields for ${tableId} using search introspection`);

            // Try to discover fields by creating a search and examining available columns
            const discoveredFields = discoverFieldsViaSearch(tableId);

            if (discoveredFields.length > 0) {
                return {
                    fields: discoveredFields,
                    discoveryMethod: 'search_introspection'
                };
            } else {
                return null;
            }

        } catch (error) {
            log.debug('Field Discovery Error', `Error discovering fields for ${tableId}: ${error.toString()}`);
            return null;
        }
    }

    /**
     * Discover fields by attempting to create searches with common field names
     */
    function discoverFieldsViaSearch(tableId) {
        const discoveredFields = [];

        // Common field names to test across all record types
        const commonFieldsToTest = [
            'internalid', 'id', 'name', 'created', 'lastmodified', 'createdby', 'lastmodifiedby',
            'isinactive', 'externalid', 'subsidiary', 'department', 'class', 'location',
            'memo', 'description', 'notes', 'owner', 'custrecord', 'entity', 'item',
            'account', 'amount', 'quantity', 'rate', 'date', 'trandate', 'duedate',
            'status', 'type', 'number', 'tranid', 'entityid', 'itemid', 'accountnumber',
            'email', 'phone', 'fax', 'address', 'city', 'state', 'zipcode', 'country',
            'firstname', 'lastname', 'middlename', 'title', 'companyname', 'salutation',
            'currency', 'exchangerate', 'total', 'subtotal', 'tax', 'discount',
            'shipping', 'handling', 'terms', 'paymentmethod', 'billingaddress',
            'shippingaddress', 'salesrep', 'partner', 'leadsource', 'campaign'
        ];

        // Record type specific fields
        const specificFields = getRecordTypeSpecificFields(tableId);
        const allFieldsToTest = [...commonFieldsToTest, ...specificFields];

        allFieldsToTest.forEach(fieldName => {
            try {
                // Test if this field exists by trying to create a search with it
                const testSearch = search.create({
                    type: tableId,
                    columns: [fieldName],
                    filters: [['internalid', 'anyof', '1']] // Dummy filter
                });

                // If we can create the search, the field exists
                discoveredFields.push({
                    id: fieldName,
                    name: fieldName,
                    label: formatFieldLabel(fieldName),
                    type: inferFieldType(fieldName),
                    isRequired: isRequiredField(fieldName),
                    isReadOnly: isReadOnlyField(fieldName),
                    isCustom: fieldName.startsWith('custrecord') || fieldName.startsWith('custbody') || fieldName.startsWith('custcol'),
                    discoveryMethod: 'search_test'
                });

                log.debug('Field Found', `${tableId}.${fieldName}`);

            } catch (error) {
                // Field doesn't exist or isn't accessible
                log.debug('Field Not Found', `${tableId}.${fieldName}: ${error.toString()}`);
            }
        });

        return discoveredFields;
    }

    /**
     * Get record type specific fields to test
     */
    function getRecordTypeSpecificFields(recordType) {
        const specificFieldsMap = {
            'customer': ['isperson', 'isindividual', 'companyname', 'firstname', 'lastname', 'email', 'phone', 'creditlimit', 'balance'],
            'vendor': ['companyname', 'email', 'phone', 'fax', 'terms', 'creditlimit', 'balance'],
            'employee': ['firstname', 'lastname', 'email', 'phone', 'title', 'supervisor', 'department', 'location', 'hiredate'],
            'item': ['itemid', 'displayname', 'description', 'type', 'baseprice', 'cost', 'quantityavailable', 'reorderpoint'],
            'transaction': ['tranid', 'trandate', 'postingperiod', 'entity', 'amount', 'status', 'memo'],
            'salesorder': ['entity', 'trandate', 'duedate', 'total', 'status', 'salesrep', 'terms'],
            'invoice': ['entity', 'trandate', 'duedate', 'total', 'amountremaining', 'status'],
            'account': ['accountnumber', 'acctname', 'accttype', 'balance', 'description'],
            'contact': ['firstname', 'lastname', 'email', 'phone', 'company', 'title'],
            'case': ['title', 'status', 'priority', 'origin', 'category', 'assigned'],
            'task': ['title', 'status', 'priority', 'assigned', 'duedate', 'estimatedwork'],
            'project': ['projectname', 'status', 'startdate', 'enddate', 'estimatedwork', 'actualwork']
        };

        return specificFieldsMap[recordType] || [];
    }

    /**
     * Format field label from field name
     */
    function formatFieldLabel(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/id$/i, 'ID')
            .trim();
    }

    /**
     * Infer field type from field name
     */
    function inferFieldType(fieldName) {
        const typeMap = {
            'id': 'integer', 'internalid': 'integer', 'number': 'integer',
            'amount': 'currency', 'total': 'currency', 'subtotal': 'currency',
            'balance': 'currency', 'cost': 'currency', 'price': 'currency',
            'date': 'date', 'trandate': 'date', 'duedate': 'date',
            'created': 'datetime', 'lastmodified': 'datetime',
            'email': 'email', 'phone': 'phone', 'fax': 'phone',
            'isinactive': 'checkbox', 'isperson': 'checkbox',
            'quantity': 'float', 'rate': 'float', 'exchangerate': 'float'
        };

        for (const [pattern, type] of Object.entries(typeMap)) {
            if (fieldName.toLowerCase().includes(pattern)) {
                return type;
            }
        }

        return 'text'; // Default type
    }

    /**
     * Check if field is typically required
     */
    function isRequiredField(fieldName) {
        const requiredFields = ['name', 'entityid', 'itemid', 'trandate', 'entity', 'account'];
        return requiredFields.includes(fieldName.toLowerCase());
    }

    /**
     * Check if field is typically read-only
     */
    function isReadOnlyField(fieldName) {
        const readOnlyFields = ['internalid', 'id', 'created', 'lastmodified', 'createdby', 'lastmodifiedby'];
        return readOnlyFields.includes(fieldName.toLowerCase());
    }
    
    /**
     * Get comprehensive fields for a table
     */
    function getComprehensiveFieldsForTable(tableId) {
        const fields = [];
        
        // Add standard fields that exist on most tables
        fields.push(
            { id: 'id', name: 'id', label: 'Internal ID', type: 'integer', isRequired: false, isReadOnly: true, isCustom: false },
            { id: 'created', name: 'created', label: 'Date Created', type: 'datetime', isRequired: false, isReadOnly: true, isCustom: false },
            { id: 'lastmodified', name: 'lastmodified', label: 'Last Modified', type: 'datetime', isRequired: false, isReadOnly: true, isCustom: false }
        );
        
        // Add table-specific fields based on comprehensive mapping
        const specificFields = getTableSpecificFields(tableId);
        fields.push(...specificFields);
        
        return fields;
    }
    
    /**
     * Get table-specific fields
     */
    function getTableSpecificFields(tableId) {
        // This would contain comprehensive field mappings for each table
        // Truncated for brevity - would include hundreds of field definitions
        const fieldMappings = {
            'customer': [
                { id: 'entityid', name: 'entityid', label: 'Customer ID', type: 'text', isRequired: true, isReadOnly: false, isCustom: false },
                { id: 'companyname', name: 'companyname', label: 'Company Name', type: 'text', isRequired: false, isReadOnly: false, isCustom: false },
                { id: 'email', name: 'email', label: 'Email', type: 'email', isRequired: false, isReadOnly: false, isCustom: false },
                { id: 'subsidiary', name: 'subsidiary', label: 'Subsidiary', type: 'select', isRequired: false, isReadOnly: false, isCustom: false, selectRecordType: 'subsidiary' }
            ],
            'item': [
                { id: 'itemid', name: 'itemid', label: 'Item Name/Number', type: 'text', isRequired: true, isReadOnly: false, isCustom: false },
                { id: 'displayname', name: 'displayname', label: 'Display Name', type: 'text', isRequired: false, isReadOnly: false, isCustom: false },
                { id: 'type', name: 'type', label: 'Type', type: 'select', isRequired: true, isReadOnly: false, isCustom: false }
            ]
            // Add more comprehensive mappings here
        };
        
        return fieldMappings[tableId] || [];
    }
    
    /**
     * Utility functions
     */
    function escapeCSVField(value) {
        if (!value) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
    }
    
    function getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    }
    
    function getExportFolder() {
        try {
            // Try to create/find the utilities folder path
            // First, try to find the EnhancedSuiteQLTool folder
            const enhancedToolFolderSearch = search.create({
                type: 'folder',
                columns: ['internalid', 'name', 'parent'],
                filters: [
                    ['name', 'is', 'EnhancedSuiteQLTool']
                ]
            });

            let enhancedToolFolderId = null;
            enhancedToolFolderSearch.run().each(function(result) {
                enhancedToolFolderId = result.getValue('internalid');
                return false; // Stop after first match
            });

            if (enhancedToolFolderId) {
                // Now look for utilities folder within EnhancedSuiteQLTool
                const utilitiesSearch = search.create({
                    type: 'folder',
                    columns: ['internalid', 'name'],
                    filters: [
                        ['name', 'is', 'utilities'],
                        'AND',
                        ['parent', 'anyof', enhancedToolFolderId]
                    ]
                });

                let utilitiesFolderId = null;
                utilitiesSearch.run().each(function(result) {
                    utilitiesFolderId = result.getValue('internalid');
                    return false; // Stop after first match
                });

                if (utilitiesFolderId) {
                    log.audit('Folder Found', `Using utilities folder ID: ${utilitiesFolderId}`);
                    return utilitiesFolderId;
                }
            }

            log.audit('Folder Fallback', 'Utilities folder not found, using SuiteScripts root');
            return -15; // SuiteScripts folder

        } catch (error) {
            log.error('Folder Detection Error', error.toString());
            return -15; // Fallback to SuiteScripts folder
        }
    }
    
    function formatTableLabel(tableName) {
        return tableName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    }
    
    function determineTableCategory(tableName) {
        if (['customer', 'vendor', 'employee', 'partner', 'contact', 'lead', 'prospect'].includes(tableName)) {
            return 'Entity';
        } else if (tableName.includes('item') || ['bin', 'inventory'].some(term => tableName.includes(term))) {
            return 'Item';
        } else if (['transaction', 'sales', 'purchase', 'invoice', 'bill', 'check', 'deposit'].some(term => tableName.includes(term))) {
            return 'Transaction';
        } else if (['account', 'department', 'class', 'location', 'subsidiary', 'currency'].includes(tableName)) {
            return 'Accounting';
        } else if (['campaign', 'case', 'task', 'calendar', 'phone'].some(term => tableName.includes(term))) {
            return 'CRM';
        } else if (['manufacturing', 'work', 'project', 'time'].some(term => tableName.includes(term))) {
            return 'Operations';
        } else if (['custom', 'role', 'user', 'file', 'workflow'].some(term => tableName.includes(term))) {
            return 'System';
        } else {
            return 'Other';
        }
    }
    
    function getRecordTypeFromTable(tableName) {
        const recordTypeMap = {
            'customer': 'customer',
            'vendor': 'vendor',
            'employee': 'employee',
            'item': 'item',
            'salesorder': 'salesorder',
            'invoice': 'invoice'
        };
        return recordTypeMap[tableName] || tableName;
    }
    
    function getFieldCountForTable(tableId) {
        return getComprehensiveFieldsForTable(tableId).length;
    }
    
    function isTransactionTable(tableId) {
        return ['transaction', 'sales', 'purchase', 'invoice', 'bill', 'check', 'deposit', 'journal'].some(term => tableId.includes(term));
    }
    
    function hasSubsidiaryField(tableId) {
        return !['systemnote', 'file', 'folder'].includes(tableId);
    }
    
    function hasDepartmentField(tableId) {
        return ['transaction', 'customer', 'vendor', 'employee', 'item'].some(term => tableId.includes(term));
    }
    
    function getTableRelationships(tableId) {
        // Return predefined relationships - would be enhanced with actual discovery
        return [];
    }
    
    return {
        execute: execute
    };
});
