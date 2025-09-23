/**
 * @fileoverview DML Utilities
 * 
 * Shared utilities for DML operations including record type mapping
 * and common validation functions.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define(['N/record', 'N/search', 'N/log'], function(record, search, log) {
    'use strict';

    /**
     * Determine NetSuite record type from table name
     * 
     * @param {string} tableName - Table name from SQL statement
     * @returns {Object} Record type information
     */
    function determineRecordType(tableName) {
        var lowerTableName = tableName.toLowerCase();

        log.debug({
            title: 'determineRecordType',
            details: 'Original: "' + tableName + '", Lowercase: "' + lowerTableName + '"'
        });

        // Debug: Check if we have the inventory cost template mapping
        if (lowerTableName === 'inventorycosttemplate') {
            log.debug({
                title: 'determineRecordType - InventoryCostTemplate Debug',
                details: 'Found inventorycosttemplate, using string literal "inventorycosttemplate"'
            });
        }

        // Custom record types (case-insensitive)
        if (lowerTableName.startsWith('customrecord_')) {
            return {
                type: lowerTableName,  // Use lowercase for consistency
                isCustomRecord: true,
                isCustomList: false
            };
        }

        // Custom lists (case-insensitive)
        if (lowerTableName.startsWith('customlist_')) {
            var result = {
                type: lowerTableName,  // Use lowercase for consistency
                isCustomRecord: false,
                isCustomList: true
            };
            log.debug({
                title: 'determineRecordType - Custom List Detected',
                details: 'Returning: ' + JSON.stringify(result)
            });
            return result;
        }

        // Standard NetSuite records - map common table names to record types
        var standardRecordMap = {
            // Core entities
            'customer': record.Type.CUSTOMER,
            'vendor': record.Type.VENDOR,
            'employee': record.Type.EMPLOYEE,
            'contact': record.Type.CONTACT,
            'lead': record.Type.LEAD,
            'prospect': record.Type.PROSPECT,
            'partner': record.Type.PARTNER,
            
            // Items - default to inventory item, but could be others
            'item': record.Type.INVENTORY_ITEM,
            'inventoryitem': record.Type.INVENTORY_ITEM,
            'noninventoryitem': record.Type.NON_INVENTORY_ITEM,
            'serviceitem': record.Type.SERVICE_ITEM,
            'kititem': record.Type.KIT_ITEM,
            'assemblyitem': record.Type.ASSEMBLY_ITEM,
            
            // Transactions
            'salesorder': record.Type.SALES_ORDER,
            'purchaseorder': record.Type.PURCHASE_ORDER,
            'invoice': record.Type.INVOICE,
            'bill': record.Type.VENDOR_BILL,
            'vendorbill': record.Type.VENDOR_BILL,
            'estimate': record.Type.ESTIMATE,
            'quote': record.Type.ESTIMATE,
            'cashsale': record.Type.CASH_SALE,
            'creditmemo': record.Type.CREDIT_MEMO,
            'vendorcredit': record.Type.VENDOR_CREDIT,
            'check': record.Type.CHECK,
            'deposit': record.Type.DEPOSIT,
            
            // Activities
            'task': record.Type.TASK,
            'event': record.Type.CALENDAR_EVENT,
            'calendarevent': record.Type.CALENDAR_EVENT,
            'phonecall': record.Type.PHONE_CALL,
            'case': record.Type.SUPPORT_CASE,
            'supportcase': record.Type.SUPPORT_CASE,
            
            // Other common records
            'opportunity': record.Type.OPPORTUNITY,
            'project': record.Type.JOB,
            'job': record.Type.JOB,
            'location': record.Type.LOCATION,
            'department': record.Type.DEPARTMENT,
            'classification': record.Type.CLASSIFICATION,
            'subsidiary': record.Type.SUBSIDIARY,

            // Inventory and costing - using string literals since constants may not exist
            'inventorycosttemplate': 'inventorycosttemplate',
            'inventorycosttemplatecostdetail': 'inventorycosttemplatecostdetail',
            'inventorynumber': record.Type.INVENTORY_NUMBER,
            'lotnumberedassemblyitem': record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
            'lotnumberedinventoryitem': record.Type.LOT_NUMBERED_INVENTORY_ITEM,
            'serializedassemblyitem': record.Type.SERIALIZED_ASSEMBLY_ITEM,
            'serializedinventoryitem': record.Type.SERIALIZED_INVENTORY_ITEM,

            // Lists and other records
            'currency': record.Type.CURRENCY,
            'paymentmethod': record.Type.PAYMENT_METHOD,
            'paymentterm': record.Type.TERM,
            'term': record.Type.TERM,
            'taxtype': record.Type.TAX_TYPE,
            'taxcode': record.Type.TAX_CODE,
            'salestaxitem': record.Type.SALES_TAX_ITEM,
            'discountitem': record.Type.DISCOUNT_ITEM,
            'markupitem': record.Type.MARKUP_ITEM,
            'paymentitem': record.Type.PAYMENT_ITEM,
            'subtotalitem': record.Type.SUBTOTAL_ITEM,
            'otherchargeitem': record.Type.OTHER_CHARGE_ITEM,
            'giftcertificateitem': record.Type.GIFT_CERTIFICATE_ITEM
        };

        var recordType = standardRecordMap[tableName.toLowerCase()];

        log.debug({
            title: 'determineRecordType - Lookup Result',
            details: 'Looking up "' + tableName.toLowerCase() + '", Found: ' + (recordType ? '"' + recordType + '"' : 'null')
        });

        if (recordType) {
            var result = {
                type: recordType,
                isCustomRecord: false,
                isCustomList: false
            };
            log.debug({
                title: 'determineRecordType - Standard Record Found',
                details: 'Returning: ' + JSON.stringify(result)
            });
            return result;
        }

        // Default to treating as custom record if not found
        // But don't add prefix if table name already has a valid NetSuite prefix
        log.debug({
            title: 'determineRecordType - Fallback to Custom Record',
            details: 'Table "' + tableName + '" not found in standard record map, treating as custom record'
        });

        var finalType;
        if (lowerTableName.startsWith('customrecord_') || lowerTableName.startsWith('customlist_')) {
            finalType = lowerTableName;  // Use as-is if already has valid prefix
        } else {
            finalType = 'customrecord_' + lowerTableName;  // Add prefix for unknown tables
        }

        log.debug({
            title: 'determineRecordType - Final Custom Record Type',
            details: 'Final type: "' + finalType + '"'
        });

        return {
            type: finalType,
            isCustomRecord: true,
            isCustomList: false
        };
    }

    /**
     * Find custom list internal ID by script ID
     * 
     * @param {string} scriptId - Custom list script ID (e.g., 'customlist_departments')
     * @returns {string|null} Internal ID or null if not found
     */
    function findCustomListInternalId(scriptId) {
        try {
            var searchObj = search.create({
                type: 'customlist',
                filters: [
                    ['scriptid', 'is', scriptId]
                ],
                columns: ['internalid']
            });

            var result = searchObj.run().getRange({ start: 0, end: 1 });
            if (result && result.length > 0) {
                return result[0].id;
            }
            return null;
        } catch (searchError) {
            log.error({
                title: 'Error finding custom list',
                details: 'Script ID: ' + scriptId + ', Error: ' + searchError.message
            });
            return null;
        }
    }

    /**
     * Validate field exists on record type
     * 
     * @param {string} recordType - NetSuite record type
     * @param {string} fieldId - Field ID to validate
     * @returns {boolean} True if field likely exists
     */
    function validateField(recordType, fieldId) {
        // Basic validation - could be enhanced with metadata lookup
        // For now, just check for obviously invalid field names
        if (!fieldId || typeof fieldId !== 'string') {
            return false;
        }

        // Field IDs should be alphanumeric with underscores
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldId)) {
            return false;
        }

        // Common system fields that exist on most records
        var commonFields = [
            'id', 'internalid', 'name', 'entityid', 'companyname', 'email',
            'phone', 'fax', 'address', 'city', 'state', 'zip', 'country',
            'memo', 'comments', 'isinactive', 'created', 'lastmodified'
        ];

        if (commonFields.indexOf(fieldId.toLowerCase()) !== -1) {
            return true;
        }

        // Custom fields start with custbody_, custentity_, etc.
        if (fieldId.startsWith('cust')) {
            return true;
        }

        // Assume other fields are valid - NetSuite will validate during operation
        return true;
    }

    // Public API
    return {
        determineRecordType: determineRecordType,
        findCustomListInternalId: findCustomListInternalId,
        validateField: validateField
    };
});
