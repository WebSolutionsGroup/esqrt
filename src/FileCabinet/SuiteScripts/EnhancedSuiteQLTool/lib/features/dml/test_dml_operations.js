/**
 * @fileoverview Test DML Operations
 * 
 * Simple test script to verify DML operations parsing and validation.
 * This is for development testing only.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define([
    'N/log',
    './dmlParser',
    './dmlExecutionEngine'
], function(log, dmlParser, dmlExecutionEngine) {
    'use strict';

    /**
     * Test DML operations
     */
    function testDMLOperations() {
        log.audit({
            title: 'Testing DML Operations',
            details: 'Starting DML operation tests'
        });

        // Test INSERT parsing
        testInsertParsing();
        
        // Test UPDATE parsing
        testUpdateParsing();
        
        // Test DELETE parsing
        testDeleteParsing();
        
        // Test validation
        testValidation();

        log.audit({
            title: 'DML Tests Complete',
            details: 'All DML operation tests completed'
        });
    }

    /**
     * Test INSERT statement parsing
     */
    function testInsertParsing() {
        var testQueries = [
            "INSERT INTO customer (companyname, email) VALUES ('Acme Corp', 'contact@acme.com')",
            "INSERT INTO customrecord_employee SET name='John Doe', department='Engineering'",
            "INSERT INTO customlist_departments SET value='Engineering', abbreviation='ENG'"
        ];

        for (var i = 0; i < testQueries.length; i++) {
            try {
                var analysis = dmlParser.analyzeDMLQuery(testQueries[i]);
                log.debug({
                    title: 'INSERT Test ' + (i + 1),
                    details: 'Query: ' + testQueries[i] + '\nResult: ' + JSON.stringify(analysis)
                });
            } catch (error) {
                log.error({
                    title: 'INSERT Test ' + (i + 1) + ' Failed',
                    details: 'Query: ' + testQueries[i] + '\nError: ' + error.message
                });
            }
        }
    }

    /**
     * Test UPDATE statement parsing
     */
    function testUpdateParsing() {
        var testQueries = [
            "UPDATE customer SET companyname='New Name' WHERE id=123",
            "UPDATE customrecord_employee SET department='Marketing' WHERE name='John Doe'",
            "UPDATE customer SET companyname='Test', email='test@test.com' WHERE id IN (123, 456)"
        ];

        for (var i = 0; i < testQueries.length; i++) {
            try {
                var analysis = dmlParser.analyzeDMLQuery(testQueries[i]);
                log.debug({
                    title: 'UPDATE Test ' + (i + 1),
                    details: 'Query: ' + testQueries[i] + '\nResult: ' + JSON.stringify(analysis)
                });
            } catch (error) {
                log.error({
                    title: 'UPDATE Test ' + (i + 1) + ' Failed',
                    details: 'Query: ' + testQueries[i] + '\nError: ' + error.message
                });
            }
        }
    }

    /**
     * Test DELETE statement parsing
     */
    function testDeleteParsing() {
        var testQueries = [
            "DELETE FROM customer WHERE id=123",
            "DELETE FROM customrecord_employee WHERE department='Engineering'",
            "DELETE FROM customer WHERE id IN (123, 456, 789)"
        ];

        for (var i = 0; i < testQueries.length; i++) {
            try {
                var analysis = dmlParser.analyzeDMLQuery(testQueries[i]);
                log.debug({
                    title: 'DELETE Test ' + (i + 1),
                    details: 'Query: ' + testQueries[i] + '\nResult: ' + JSON.stringify(analysis)
                });
            } catch (error) {
                log.error({
                    title: 'DELETE Test ' + (i + 1) + ' Failed',
                    details: 'Query: ' + testQueries[i] + '\nError: ' + error.message
                });
            }
        }
    }

    /**
     * Test validation
     */
    function testValidation() {
        var testCases = [
            {
                type: 'INSERT',
                statement: {
                    tableName: 'customer',
                    fields: { companyname: 'Test Corp', email: 'test@test.com' }
                }
            },
            {
                type: 'UPDATE',
                statement: {
                    tableName: 'customer',
                    setFields: { companyname: 'New Name' },
                    whereCondition: { type: 'EQUALS', field: 'id', value: 123 }
                }
            },
            {
                type: 'DELETE',
                statement: {
                    tableName: 'customer',
                    whereCondition: { type: 'EQUALS', field: 'id', value: 123 }
                }
            }
        ];

        for (var i = 0; i < testCases.length; i++) {
            try {
                var validation = dmlExecutionEngine.validateDMLOperation(
                    testCases[i].type,
                    testCases[i].statement
                );
                log.debug({
                    title: 'Validation Test ' + (i + 1),
                    details: 'Type: ' + testCases[i].type + '\nValid: ' + validation.isValid + '\nErrors: ' + JSON.stringify(validation.errors)
                });
            } catch (error) {
                log.error({
                    title: 'Validation Test ' + (i + 1) + ' Failed',
                    details: 'Type: ' + testCases[i].type + '\nError: ' + error.message
                });
            }
        }
    }

    // Public API
    return {
        testDMLOperations: testDMLOperations
    };
});
