/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - NetSuite Field Metadata
 * 
 * This module provides comprehensive metadata about NetSuite fields including
 * their actual data types, which is used for parameterized query type inference.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([], function() {
    'use strict';

    /**
     * NetSuite field metadata organized by table/record type
     * This provides accurate data type information for parameterized queries
     */
    var NETSUITE_FIELD_METADATA = {
        // Transaction fields (common across all transaction types)
        transaction: {
            id: { type: 'number', description: 'Internal ID' },
            tranid: { type: 'text', description: 'Transaction number/document number' },
            trandate: { type: 'date', description: 'Transaction date' },
            postingperiod: { type: 'text', description: 'Posting period' },
            type: { type: 'text', description: 'Transaction type' },
            status: { type: 'text', description: 'Transaction status' },
            entity: { type: 'number', description: 'Entity internal ID' },
            entityid: { type: 'text', description: 'Entity ID/name' },
            memo: { type: 'text', description: 'Memo' },
            total: { type: 'number', description: 'Total amount' },
            subtotal: { type: 'number', description: 'Subtotal amount' },
            taxtotal: { type: 'number', description: 'Tax total' },
            amount: { type: 'number', description: 'Amount' },
            foreigntotal: { type: 'number', description: 'Foreign currency total' },
            exchangerate: { type: 'number', description: 'Exchange rate' },
            currency: { type: 'number', description: 'Currency internal ID' },
            currencyname: { type: 'text', description: 'Currency name' },
            currencysymbol: { type: 'text', description: 'Currency symbol' },
            department: { type: 'number', description: 'Department internal ID' },
            location: { type: 'number', description: 'Location internal ID' },
            class: { type: 'number', description: 'Class internal ID' },
            subsidiary: { type: 'number', description: 'Subsidiary internal ID' },
            created: { type: 'datetime', description: 'Created date/time' },
            lastmodified: { type: 'datetime', description: 'Last modified date/time' },
            createdby: { type: 'number', description: 'Created by user ID' },
            lastmodifiedby: { type: 'number', description: 'Last modified by user ID' },
            approved: { type: 'boolean', description: 'Approved status' },
            approvalstatus: { type: 'text', description: 'Approval status' },
            nextuniquenum: { type: 'number', description: 'Next unique number' },
            source: { type: 'text', description: 'Transaction source' },
            voided: { type: 'boolean', description: 'Voided status' },
            reversaldate: { type: 'date', description: 'Reversal date' },
            reversaldefer: { type: 'boolean', description: 'Reversal defer' },
            paypaltranid: { type: 'text', description: 'PayPal transaction ID' },
            authcode: { type: 'text', description: 'Authorization code' },
            pnrefnum: { type: 'text', description: 'Payment reference number' }
        },

        // Customer fields
        customer: {
            id: { type: 'number', description: 'Internal ID' },
            entityid: { type: 'text', description: 'Customer ID' },
            companyname: { type: 'text', description: 'Company name' },
            firstname: { type: 'text', description: 'First name' },
            lastname: { type: 'text', description: 'Last name' },
            email: { type: 'email', description: 'Email address' },
            phone: { type: 'text', description: 'Phone number' },
            fax: { type: 'text', description: 'Fax number' },
            url: { type: 'text', description: 'Website URL' },
            defaultaddress: { type: 'text', description: 'Default address' },
            billaddr1: { type: 'text', description: 'Billing address line 1' },
            billaddr2: { type: 'text', description: 'Billing address line 2' },
            billcity: { type: 'text', description: 'Billing city' },
            billstate: { type: 'text', description: 'Billing state' },
            billzip: { type: 'text', description: 'Billing ZIP code' },
            billcountry: { type: 'text', description: 'Billing country' },
            shipaddr1: { type: 'text', description: 'Shipping address line 1' },
            shipaddr2: { type: 'text', description: 'Shipping address line 2' },
            shipcity: { type: 'text', description: 'Shipping city' },
            shipstate: { type: 'text', description: 'Shipping state' },
            shipzip: { type: 'text', description: 'Shipping ZIP code' },
            shipcountry: { type: 'text', description: 'Shipping country' },
            isinactive: { type: 'boolean', description: 'Inactive status' },
            isperson: { type: 'boolean', description: 'Is person (vs company)' },
            taxable: { type: 'boolean', description: 'Taxable status' },
            taxitem: { type: 'number', description: 'Tax item internal ID' },
            resalenumber: { type: 'text', description: 'Resale number' },
            accountnumber: { type: 'text', description: 'Account number' },
            creditlimit: { type: 'number', description: 'Credit limit' },
            balance: { type: 'number', description: 'Current balance' },
            unbilledorders: { type: 'number', description: 'Unbilled orders amount' },
            overduebalance: { type: 'number', description: 'Overdue balance' },
            daysoverdue: { type: 'number', description: 'Days overdue' },
            subsidiary: { type: 'number', description: 'Subsidiary internal ID' },
            currency: { type: 'number', description: 'Currency internal ID' },
            pricelevel: { type: 'number', description: 'Price level internal ID' },
            terms: { type: 'number', description: 'Terms internal ID' },
            discountitem: { type: 'number', description: 'Discount item internal ID' },
            taxfractionunit: { type: 'text', description: 'Tax fraction unit' },
            salesrep: { type: 'number', description: 'Sales rep internal ID' },
            territory: { type: 'number', description: 'Territory internal ID' },
            category: { type: 'number', description: 'Category internal ID' },
            leadsource: { type: 'number', description: 'Lead source internal ID' },
            partner: { type: 'number', description: 'Partner internal ID' },
            referrer: { type: 'text', description: 'Referrer' },
            keywords: { type: 'text', description: 'Keywords' },
            campaignevent: { type: 'number', description: 'Campaign event internal ID' },
            datecreated: { type: 'datetime', description: 'Date created' },
            lastmodifieddate: { type: 'datetime', description: 'Last modified date' }
        },

        // Employee fields
        employee: {
            id: { type: 'number', description: 'Internal ID' },
            entityid: { type: 'text', description: 'Employee ID' },
            firstname: { type: 'text', description: 'First name' },
            lastname: { type: 'text', description: 'Last name' },
            middlename: { type: 'text', description: 'Middle name' },
            email: { type: 'email', description: 'Email address' },
            phone: { type: 'text', description: 'Phone number' },
            mobilephone: { type: 'text', description: 'Mobile phone' },
            homephone: { type: 'text', description: 'Home phone' },
            fax: { type: 'text', description: 'Fax number' },
            address: { type: 'text', description: 'Address' },
            city: { type: 'text', description: 'City' },
            state: { type: 'text', description: 'State' },
            zipcode: { type: 'text', description: 'ZIP code' },
            country: { type: 'text', description: 'Country' },
            isinactive: { type: 'boolean', description: 'Inactive status' },
            issalesrep: { type: 'boolean', description: 'Is sales rep' },
            issupportrep: { type: 'boolean', description: 'Is support rep' },
            istemplate: { type: 'boolean', description: 'Is template' },
            isjobresource: { type: 'boolean', description: 'Is job resource' },
            laborresource: { type: 'boolean', description: 'Labor resource' },
            birthdate: { type: 'date', description: 'Birth date' },
            hiredate: { type: 'date', description: 'Hire date' },
            releasedate: { type: 'date', description: 'Release date' },
            title: { type: 'text', description: 'Job title' },
            department: { type: 'number', description: 'Department internal ID' },
            location: { type: 'number', description: 'Location internal ID' },
            class: { type: 'number', description: 'Class internal ID' },
            subsidiary: { type: 'number', description: 'Subsidiary internal ID' },
            supervisor: { type: 'number', description: 'Supervisor internal ID' },
            approver: { type: 'number', description: 'Approver internal ID' },
            approvalstatus: { type: 'text', description: 'Approval status' },
            nextapprover: { type: 'number', description: 'Next approver internal ID' },
            employeetype: { type: 'number', description: 'Employee type internal ID' },
            employeestatus: { type: 'number', description: 'Employee status internal ID' },
            jobtitle: { type: 'text', description: 'Job title' },
            maritalstatus: { type: 'text', description: 'Marital status' },
            ethnicity: { type: 'text', description: 'Ethnicity' },
            gender: { type: 'text', description: 'Gender' },
            i9verified: { type: 'boolean', description: 'I-9 verified' },
            visatype: { type: 'text', description: 'Visa type' },
            visaexpdate: { type: 'date', description: 'Visa expiration date' },
            payfrequency: { type: 'text', description: 'Pay frequency' },
            currency: { type: 'number', description: 'Currency internal ID' },
            useperquest: { type: 'boolean', description: 'Use per quest' },
            concurrentwebservicesuser: { type: 'boolean', description: 'Concurrent web services user' },
            sendnotificationemails: { type: 'boolean', description: 'Send notification emails' },
            hasofficemobilelicense: { type: 'boolean', description: 'Has office mobile license' },
            eligibleforcommission: { type: 'boolean', description: 'Eligible for commission' },
            salesrole: { type: 'number', description: 'Sales role internal ID' },
            purchaseorderapprover: { type: 'number', description: 'Purchase order approver internal ID' },
            purchaseorderlimit: { type: 'number', description: 'Purchase order limit' },
            expenseapprover: { type: 'number', description: 'Expense approver internal ID' },
            expenselimit: { type: 'number', description: 'Expense limit' },
            timeapprover: { type: 'number', description: 'Time approver internal ID' },
            machineresource: { type: 'number', description: 'Machine resource internal ID' },
            laborresource: { type: 'number', description: 'Labor resource internal ID' },
            workassignment: { type: 'number', description: 'Work assignment internal ID' }
        },

        // Vendor fields
        vendor: {
            id: { type: 'number', description: 'Internal ID' },
            entityid: { type: 'text', description: 'Vendor ID' },
            companyname: { type: 'text', description: 'Company name' },
            firstname: { type: 'text', description: 'First name' },
            lastname: { type: 'text', description: 'Last name' },
            email: { type: 'email', description: 'Email address' },
            phone: { type: 'text', description: 'Phone number' },
            fax: { type: 'text', description: 'Fax number' },
            url: { type: 'text', description: 'Website URL' },
            defaultaddress: { type: 'text', description: 'Default address' },
            billaddr1: { type: 'text', description: 'Billing address line 1' },
            billaddr2: { type: 'text', description: 'Billing address line 2' },
            billcity: { type: 'text', description: 'Billing city' },
            billstate: { type: 'text', description: 'Billing state' },
            billzip: { type: 'text', description: 'Billing ZIP code' },
            billcountry: { type: 'text', description: 'Billing country' },
            isinactive: { type: 'boolean', description: 'Inactive status' },
            isperson: { type: 'boolean', description: 'Is person (vs company)' },
            is1099eligible: { type: 'boolean', description: '1099 eligible' },
            taxid: { type: 'text', description: 'Tax ID' },
            taxidnum: { type: 'text', description: 'Tax ID number' },
            accountnumber: { type: 'text', description: 'Account number' },
            balance: { type: 'number', description: 'Current balance' },
            unbilledbills: { type: 'number', description: 'Unbilled bills amount' },
            subsidiary: { type: 'number', description: 'Subsidiary internal ID' },
            currency: { type: 'number', description: 'Currency internal ID' },
            terms: { type: 'number', description: 'Terms internal ID' },
            creditlimit: { type: 'number', description: 'Credit limit' },
            category: { type: 'number', description: 'Category internal ID' },
            representingsubsidiary: { type: 'number', description: 'Representing subsidiary internal ID' },
            fxaccount: { type: 'number', description: 'FX account internal ID' },
            printoncheckas: { type: 'text', description: 'Print on check as' },
            altphone: { type: 'text', description: 'Alternate phone' },
            homephone: { type: 'text', description: 'Home phone' },
            mobilephone: { type: 'text', description: 'Mobile phone' },
            comments: { type: 'text', description: 'Comments' },
            datecreated: { type: 'datetime', description: 'Date created' },
            lastmodifieddate: { type: 'datetime', description: 'Last modified date' }
        },

        // Item fields (common across item types)
        item: {
            id: { type: 'number', description: 'Internal ID' },
            itemid: { type: 'text', description: 'Item ID/name' },
            displayname: { type: 'text', description: 'Display name' },
            description: { type: 'text', description: 'Description' },
            type: { type: 'text', description: 'Item type' },
            baseprice: { type: 'number', description: 'Base price' },
            cost: { type: 'number', description: 'Cost' },
            costcategory: { type: 'number', description: 'Cost category internal ID' },
            unitstype: { type: 'number', description: 'Units type internal ID' },
            stockunit: { type: 'number', description: 'Stock unit internal ID' },
            purchaseunit: { type: 'number', description: 'Purchase unit internal ID' },
            saleunit: { type: 'number', description: 'Sale unit internal ID' },
            isinactive: { type: 'boolean', description: 'Inactive status' },
            availabletopartners: { type: 'boolean', description: 'Available to partners' },
            isdonationitem: { type: 'boolean', description: 'Is donation item' },
            isonline: { type: 'boolean', description: 'Is online' },
            isgcocompliant: { type: 'boolean', description: 'Is GCO compliant' },
            excludefromsitemap: { type: 'boolean', description: 'Exclude from sitemap' },
            showinstore: { type: 'boolean', description: 'Show in store' },
            storedescription: { type: 'text', description: 'Store description' },
            storedetaileddescription: { type: 'text', description: 'Store detailed description' },
            featuredescription: { type: 'text', description: 'Feature description' },
            specialsdescription: { type: 'text', description: 'Specials description' },
            weight: { type: 'number', description: 'Weight' },
            weightunit: { type: 'text', description: 'Weight unit' },
            billingschedule: { type: 'number', description: 'Billing schedule internal ID' },
            deferredrevenueaccount: { type: 'number', description: 'Deferred revenue account internal ID' },
            revrecschedule: { type: 'number', description: 'Revenue recognition schedule internal ID' },
            stockdescription: { type: 'text', description: 'Stock description' },
            producer: { type: 'boolean', description: 'Producer' },
            manufacturer: { type: 'text', description: 'Manufacturer' },
            mpn: { type: 'text', description: 'Manufacturer part number' },
            multmanufactureaddr: { type: 'boolean', description: 'Multiple manufacturer addresses' },
            manufactureraddr1: { type: 'text', description: 'Manufacturer address line 1' },
            manufacturercity: { type: 'text', description: 'Manufacturer city' },
            manufacturerstate: { type: 'text', description: 'Manufacturer state' },
            manufacturerzip: { type: 'text', description: 'Manufacturer ZIP code' },
            countryofmanufacture: { type: 'text', description: 'Country of manufacture' },
            defaultitemshipmethod: { type: 'number', description: 'Default item ship method internal ID' },
            itemcarrier: { type: 'text', description: 'Item carrier' },
            roundupascomponent: { type: 'boolean', description: 'Round up as component' },
            purchasedescription: { type: 'text', description: 'Purchase description' },
            copyrightsnotice: { type: 'text', description: 'Copyrights notice' },
            fraudrisk: { type: 'text', description: 'Fraud risk' },
            shippingcost: { type: 'number', description: 'Shipping cost' },
            shippingcostunits: { type: 'text', description: 'Shipping cost units' },
            handlingcost: { type: 'number', description: 'Handling cost' },
            handlingcostunits: { type: 'text', description: 'Handling cost units' }
        }
    };

    /**
     * Get field metadata for a specific table and field
     * 
     * @param {string} tableName - Table/record type name
     * @param {string} fieldName - Field name
     * @returns {Object|null} Field metadata or null if not found
     */
    function getFieldMetadata(tableName, fieldName) {
        if (!tableName || !fieldName) {
            return null;
        }

        var normalizedTable = tableName.toLowerCase();
        var normalizedField = fieldName.toLowerCase();

        // Check exact table match first
        if (NETSUITE_FIELD_METADATA[normalizedTable] && 
            NETSUITE_FIELD_METADATA[normalizedTable][normalizedField]) {
            return NETSUITE_FIELD_METADATA[normalizedTable][normalizedField];
        }

        // Check if it's a transaction-related table
        var transactionTables = ['salesorder', 'purchaseorder', 'invoice', 'bill', 'cashsale', 
                                'check', 'deposit', 'journalentry', 'creditmemo', 'vendorcredit',
                                'itemfulfillment', 'itemreceipt', 'inventoryadjustment', 'transferorder'];
        
        if (transactionTables.indexOf(normalizedTable) !== -1 && 
            NETSUITE_FIELD_METADATA.transaction[normalizedField]) {
            return NETSUITE_FIELD_METADATA.transaction[normalizedField];
        }

        // Check if it's an item-related table
        var itemTables = ['inventoryitem', 'noninventoryitem', 'serviceitem', 'kititem', 
                         'assemblyitem', 'giftcertificateitem', 'downloaditem', 'markupitem',
                         'subtotalitem', 'discountitem', 'paymentitem', 'otherchargeitem'];
        
        if (itemTables.indexOf(normalizedTable) !== -1 && 
            NETSUITE_FIELD_METADATA.item[normalizedField]) {
            return NETSUITE_FIELD_METADATA.item[normalizedField];
        }

        return null;
    }

    /**
     * Get parameter type and description based on field metadata
     * 
     * @param {string} tableName - Table/record type name
     * @param {string} fieldName - Field name
     * @returns {Object} Parameter type information
     */
    function getParameterTypeFromField(tableName, fieldName) {
        var fieldMetadata = getFieldMetadata(tableName, fieldName);
        
        if (fieldMetadata) {
            var inputType = 'text';
            var description = fieldMetadata.description;

            switch (fieldMetadata.type) {
                case 'number':
                    inputType = 'number';
                    description = 'Enter numeric value (' + fieldMetadata.description + ')';
                    break;
                case 'date':
                    inputType = 'date';
                    description = 'Select date (' + fieldMetadata.description + ')';
                    break;
                case 'datetime':
                    inputType = 'datetime-local';
                    description = 'Select date and time (' + fieldMetadata.description + ')';
                    break;
                case 'email':
                    inputType = 'email';
                    description = 'Enter email address (' + fieldMetadata.description + ')';
                    break;
                case 'boolean':
                    inputType = 'select';
                    description = 'Select true/false (' + fieldMetadata.description + ')';
                    break;
                case 'text':
                default:
                    inputType = 'text';
                    description = 'Enter text value (' + fieldMetadata.description + ')';
                    break;
            }

            return {
                type: inputType,
                description: description,
                dataType: fieldMetadata.type
            };
        }

        // Fallback to generic text input
        return {
            type: 'text',
            description: 'Enter value',
            dataType: 'text'
        };
    }

    // Public API
    return {
        getFieldMetadata: getFieldMetadata,
        getParameterTypeFromField: getParameterTypeFromField,
        NETSUITE_FIELD_METADATA: NETSUITE_FIELD_METADATA
    };
});
