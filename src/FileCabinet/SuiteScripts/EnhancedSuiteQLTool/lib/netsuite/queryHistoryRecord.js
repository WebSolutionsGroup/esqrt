/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Query History Record Management
 * 
 * This module handles CRUD operations for the custom record:
 * customrecord_sqrt_query_history
 * 
 * Custom Record Fields:
 * - custrecord_sqrt_history_query_content (Long Text) - SQL query content
 * - custrecord_sqrt_history_executed_by (Employee) - User who executed the query
 * - custrecord_sqrt_history_executed_date (Date/Time) - When query was executed
 * - custrecord_sqrt_history_execution_time (Decimal) - Query execution time in ms
 * - custrecord_sqrt_history_record_count (Integer) - Number of records returned
 * - custrecord_sqrt_history_success (Checkbox) - Whether query executed successfully
 * - custrecord_sqrt_history_error_message (Long Text) - Error message if failed
 * - custrecord_sqrt_history_result_format (List) - Format used (table, csv, json)
 * - custrecord_sqrt_history_query_hash (Text) - Hash of query for deduplication
 * - custrecord_sqrt_history_session_id (Text) - Browser session identifier
 * - custrecord_sqrt_history_shared_with_roles (Multiple Select - Role) - Shared roles
 * - custrecord_sqrt_history_shared_with_users (Multiple Select - Employee) - Shared users
 * - custrecord_sqrt_history_sharing_level (List) - None/Role/Individual/Public
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define(['N/record', 'N/search', 'N/runtime', 'N/log'], function(record, search, runtime, log) {
    
    // Custom Record and Field IDs
    const RECORD_TYPE = 'customrecord_sqrt_query_history';
    const FIELDS = {
        QUERY_CONTENT: 'custrecord_sqrt_history_query_content',
        EXECUTED_BY: 'custrecord_sqrt_history_executed_by',
        EXECUTED_DATE: 'custrecord_sqrt_history_executed_date',
        EXECUTION_TIME: 'custrecord_sqrt_history_execution_time',
        RECORD_COUNT: 'custrecord_sqrt_history_record_count',
        SUCCESS: 'custrecord_sqrt_history_success',
        ERROR_MESSAGE: 'custrecord_sqrt_history_error_message',
        RESULT_FORMAT: 'custrecord_sqrt_history_result_format',
        QUERY_HASH: 'custrecord_sqrt_history_query_hash',
        SESSION_ID: 'custrecord_sqrt_history_session_id',
        SHARED_WITH_ROLES: 'custrecord_sqrt_history_shared_with_roles',
        SHARED_WITH_USERS: 'custrecord_sqrt_history_shared_with_users',
        SHARING_LEVEL: 'custrecord_sqrt_history_sharing_level'
    };

    // Sharing levels (using numeric IDs from custom list)
    const SHARING_LEVELS = {
        PRIVATE: '1',     // Only owner can see
        ROLE: '2',        // Shared with specific roles
        INDIVIDUAL: '3',  // Shared with specific users
        PUBLIC: '4'       // Everyone can see
    };

    // Result format mapping (string to internal ID as string)
    // These correspond to the internal IDs NetSuite assigns to custom list values
    const RESULT_FORMAT_MAPPING = {
        'table': '1',  // val_sqrt_format_table (ID: 1)
        'csv': '2',    // val_sqrt_format_csv (ID: 2)
        'json': '3'    // val_sqrt_format_json (ID: 3)
    };
    


    /**
     * Create a simple hash of a query string for deduplication
     *
     * @param {string} queryContent - SQL query content
     * @returns {string} Simple hash string
     */
    function createQueryHash(queryContent) {
        // Simple hash function for query deduplication
        let hash = 0;
        const cleanQuery = queryContent.replace(/\s+/g, ' ').trim().toLowerCase();
        
        for (let i = 0; i < cleanQuery.length; i++) {
            const char = cleanQuery.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
    }
    
    /**
     * Add a query execution to history
     * 
     * @param {Object} historyData - Query execution data
     * @param {string} historyData.queryContent - SQL query content
     * @param {number} [historyData.executionTime] - Execution time in milliseconds
     * @param {number} [historyData.recordCount] - Number of records returned
     * @param {boolean} [historyData.success] - Whether query executed successfully
     * @param {string} [historyData.errorMessage] - Error message if failed
     * @param {string} [historyData.resultFormat] - Result format (table, csv, json)
     * @param {string} [historyData.sessionId] - Browser session identifier
     * @returns {number} Record internal ID
     */
    function addQueryToHistory(historyData) {
        try {
            const currentUser = runtime.getCurrentUser();
            const queryHash = createQueryHash(historyData.queryContent);
            
            const newRecord = record.create({
                type: RECORD_TYPE,
                isDynamic: true
            });
            
            // Set required fields
            newRecord.setValue({
                fieldId: FIELDS.QUERY_CONTENT,
                value: historyData.queryContent || ''
            });
            
            newRecord.setValue({
                fieldId: FIELDS.EXECUTED_BY,
                value: currentUser.id
            });
            
            newRecord.setValue({
                fieldId: FIELDS.EXECUTED_DATE,
                value: new Date()
            });
            
            newRecord.setValue({
                fieldId: FIELDS.QUERY_HASH,
                value: queryHash
            });
            
            // Set optional fields
            if (historyData.executionTime !== undefined) {
                newRecord.setValue({
                    fieldId: FIELDS.EXECUTION_TIME,
                    value: historyData.executionTime
                });
            }
            
            if (historyData.recordCount !== undefined) {
                newRecord.setValue({
                    fieldId: FIELDS.RECORD_COUNT,
                    value: historyData.recordCount
                });
            }
            
            newRecord.setValue({
                fieldId: FIELDS.SUCCESS,
                value: historyData.success !== false // Default to true if not specified
            });
            
            if (historyData.errorMessage) {
                newRecord.setValue({
                    fieldId: FIELDS.ERROR_MESSAGE,
                    value: historyData.errorMessage
                });
            }
            
            // Set result format field - all operations use 'table' format consistently
            if (historyData.resultFormat) {
                try {
                    // Try different approaches to set the result format
                    var formatValue = RESULT_FORMAT_MAPPING[historyData.resultFormat.toLowerCase()];
                    if (!formatValue) {
                        formatValue = '1'; // Default to table format
                    }

                    newRecord.setValue({
                        fieldId: FIELDS.RESULT_FORMAT,
                        value: formatValue
                    });
                    log.debug('Set result format successfully', {
                        requestedFormat: historyData.resultFormat,
                        mappedValue: formatValue
                    });
                } catch(formatError) {
                    // If setting the field fails, try without it but log the issue
                    log.error('Failed to set result format, continuing without it', {
                        error: formatError.toString(),
                        requestedFormat: historyData.resultFormat,
                        mappedValue: RESULT_FORMAT_MAPPING[historyData.resultFormat.toLowerCase()]
                    });
                    // Continue without setting result format - operation should still succeed
                }
            }
            
            if (historyData.sessionId) {
                newRecord.setValue({
                    fieldId: FIELDS.SESSION_ID,
                    value: historyData.sessionId
                });
            }
            
            const recordId = newRecord.save();
            
            log.debug('Query History Added', 'Record ID: ' + recordId);
            return recordId;
            
        } catch (e) {
            log.error('Error adding query to history', {
                error: e.toString(),
                message: e.message,
                name: e.name,
                stack: e.stack,
                historyData: historyData
            });
            throw new Error('Failed to add query to history: ' + e.message);
        }
    }
    
    /**
     * Get query history for a user
     * 
     * @param {Object} [options] - Search options
     * @param {number} [options.userId] - User ID (defaults to current user)
     * @param {number} [options.limit] - Maximum number of records to return
     * @param {boolean} [options.successOnly] - Only return successful queries
     * @param {Date} [options.fromDate] - Start date filter
     * @param {Date} [options.toDate] - End date filter
     * @returns {Array} Array of history objects
     */
    function getQueryHistory(options) {
        try {
            const currentUser = runtime.getCurrentUser();
            const userId = options?.userId || currentUser.id;
            const limit = options?.limit || 50;
            
            const searchObj = search.create({
                type: RECORD_TYPE,
                filters: [
                    search.createFilter({
                        name: FIELDS.EXECUTED_BY,
                        operator: search.Operator.ANYOF,
                        values: userId
                    })
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: FIELDS.QUERY_CONTENT }),
                    search.createColumn({ name: FIELDS.EXECUTED_BY }),
                    search.createColumn({ name: FIELDS.EXECUTED_DATE, sort: search.Sort.DESC }),
                    search.createColumn({ name: FIELDS.EXECUTION_TIME }),
                    search.createColumn({ name: FIELDS.RECORD_COUNT }),
                    search.createColumn({ name: FIELDS.SUCCESS }),
                    search.createColumn({ name: FIELDS.ERROR_MESSAGE }),
                    search.createColumn({ name: FIELDS.RESULT_FORMAT }),
                    search.createColumn({ name: FIELDS.QUERY_HASH }),
                    search.createColumn({ name: FIELDS.SESSION_ID })
                ]
            });
            
            // Add optional filters
            if (options?.successOnly) {
                searchObj.filters.push(search.createFilter({
                    name: FIELDS.SUCCESS,
                    operator: search.Operator.IS,
                    values: true
                }));
            }
            
            if (options?.fromDate) {
                searchObj.filters.push(search.createFilter({
                    name: FIELDS.EXECUTED_DATE,
                    operator: search.Operator.ONORAFTER,
                    values: options.fromDate
                }));
            }
            
            if (options?.toDate) {
                searchObj.filters.push(search.createFilter({
                    name: FIELDS.EXECUTED_DATE,
                    operator: search.Operator.ONORBEFORE,
                    values: options.toDate
                }));
            }
            
            const results = [];
            let count = 0;
            
            searchObj.run().each(function(result) {
                if (count >= limit) return false; // Stop iteration
                
                results.push({
                    id: result.getValue('internalid'),
                    queryContent: result.getValue(FIELDS.QUERY_CONTENT),
                    executedBy: result.getValue(FIELDS.EXECUTED_BY),
                    executedDate: result.getValue(FIELDS.EXECUTED_DATE),
                    executionTime: result.getValue(FIELDS.EXECUTION_TIME),
                    recordCount: result.getValue(FIELDS.RECORD_COUNT),
                    success: result.getValue(FIELDS.SUCCESS),
                    errorMessage: result.getValue(FIELDS.ERROR_MESSAGE),
                    resultFormat: result.getValue(FIELDS.RESULT_FORMAT),
                    queryHash: result.getValue(FIELDS.QUERY_HASH),
                    sessionId: result.getValue(FIELDS.SESSION_ID)
                });
                
                count++;
                return true; // Continue iteration
            });
            
            return results;
            
        } catch (e) {
            log.error('Error getting query history', e.toString());
            throw new Error('Failed to get query history: ' + e.message);
        }
    }
    
    /**
     * Get unique queries from history (deduplicated by hash)
     * 
     * @param {Object} [options] - Search options
     * @param {number} [options.userId] - User ID (defaults to current user)
     * @param {number} [options.limit] - Maximum number of unique queries
     * @returns {Array} Array of unique query objects
     */
    function getUniqueQueryHistory(options) {
        try {
            const currentUser = runtime.getCurrentUser();
            const userId = options?.userId || currentUser.id;
            const limit = options?.limit || 20;
            
            const searchObj = search.create({
                type: RECORD_TYPE,
                filters: [
                    search.createFilter({
                        name: FIELDS.EXECUTED_BY,
                        operator: search.Operator.ANYOF,
                        values: userId
                    }),
                    search.createFilter({
                        name: FIELDS.SUCCESS,
                        operator: search.Operator.IS,
                        values: true
                    })
                ],
                columns: [
                    search.createColumn({ 
                        name: FIELDS.QUERY_HASH,
                        summary: search.Summary.GROUP
                    }),
                    search.createColumn({ 
                        name: FIELDS.QUERY_CONTENT,
                        summary: search.Summary.MAX
                    }),
                    search.createColumn({ 
                        name: FIELDS.EXECUTED_DATE,
                        summary: search.Summary.MAX,
                        sort: search.Sort.DESC
                    }),
                    search.createColumn({ 
                        name: 'internalid',
                        summary: search.Summary.COUNT
                    })
                ]
            });
            
            const results = [];
            let count = 0;
            
            searchObj.run().each(function(result) {
                if (count >= limit) return false; // Stop iteration
                
                results.push({
                    queryHash: result.getValue({ name: FIELDS.QUERY_HASH, summary: search.Summary.GROUP }),
                    queryContent: result.getValue({ name: FIELDS.QUERY_CONTENT, summary: search.Summary.MAX }),
                    lastExecuted: result.getValue({ name: FIELDS.EXECUTED_DATE, summary: search.Summary.MAX }),
                    executionCount: result.getValue({ name: 'internalid', summary: search.Summary.COUNT })
                });
                
                count++;
                return true; // Continue iteration
            });
            
            return results;
            
        } catch (e) {
            log.error('Error getting unique query history', e.toString());
            throw new Error('Failed to get unique query history: ' + e.message);
        }
    }
    
    /**
     * Delete a single query history record
     *
     * @param {number} recordId - Record internal ID
     * @returns {boolean} Success flag
     */
    function deleteHistoryRecord(recordId) {
        try {
            const currentUser = runtime.getCurrentUser();

            // First, verify the record belongs to the current user
            const historyRecord = record.load({
                type: RECORD_TYPE,
                id: recordId
            });

            const recordOwner = historyRecord.getValue(FIELDS.EXECUTED_BY);

            // Only allow users to delete their own history unless they're admin
            const isAdmin = currentUser.roleId === 'administrator' ||
                           currentUser.roleId === 'customrole_admin' ||
                           currentUser.roleId === 'customrole_suiteql_admin';

            if (recordOwner !== currentUser.id && !isAdmin) {
                throw new Error('You can only delete your own query history');
            }

            record.delete({
                type: RECORD_TYPE,
                id: recordId
            });

            log.debug('Query History Record Deleted', 'Record ID: ' + recordId);
            return true;

        } catch (e) {
            log.error('Error deleting history record', e.toString());
            throw new Error('Failed to delete history record: ' + e.message);
        }
    }

    /**
     * Clear all query history for a specific user
     *
     * @param {number} [userId] - User ID (defaults to current user)
     * @returns {number} Number of records deleted
     */
    function clearUserHistory(userId) {
        try {
            const currentUser = runtime.getCurrentUser();
            const targetUserId = userId || currentUser.id;

            // Only allow users to clear their own history unless they're admin
            const isAdmin = currentUser.roleId === 'administrator' ||
                           currentUser.roleId === 'customrole_admin' ||
                           currentUser.roleId === 'customrole_suiteql_admin';

            if (targetUserId !== currentUser.id && !isAdmin) {
                throw new Error('You can only clear your own query history');
            }

            const searchObj = search.create({
                type: RECORD_TYPE,
                filters: [
                    search.createFilter({
                        name: FIELDS.EXECUTED_BY,
                        operator: search.Operator.ANYOF,
                        values: targetUserId
                    })
                ],
                columns: [
                    search.createColumn({ name: 'internalid' })
                ]
            });

            let deletedCount = 0;
            const recordsToDelete = [];

            searchObj.run().each(function(result) {
                recordsToDelete.push(result.getValue('internalid'));
                return true;
            });

            // Delete in batches to avoid governance limits
            for (let i = 0; i < recordsToDelete.length; i++) {
                try {
                    record.delete({
                        type: RECORD_TYPE,
                        id: recordsToDelete[i]
                    });
                    deletedCount++;
                } catch (e) {
                    log.error('Error deleting history record', 'ID: ' + recordsToDelete[i] + ', Error: ' + e.toString());
                }
            }

            log.audit('Query History Clear', 'Deleted ' + deletedCount + ' records for user ' + targetUserId);
            return deletedCount;

        } catch (e) {
            log.error('Error clearing user history', e.toString());
            throw new Error('Failed to clear user history: ' + e.message);
        }
    }

    /**
     * Delete old query history records
     *
     * @param {number} daysToKeep - Number of days of history to keep
     * @returns {number} Number of records deleted
     */
    function cleanupOldHistory(daysToKeep) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const searchObj = search.create({
                type: RECORD_TYPE,
                filters: [
                    search.createFilter({
                        name: FIELDS.EXECUTED_DATE,
                        operator: search.Operator.BEFORE,
                        values: cutoffDate
                    })
                ],
                columns: [
                    search.createColumn({ name: 'internalid' })
                ]
            });
            
            let deletedCount = 0;
            const recordsToDelete = [];
            
            searchObj.run().each(function(result) {
                recordsToDelete.push(result.getValue('internalid'));
                return true;
            });
            
            // Delete in batches to avoid governance limits
            for (let i = 0; i < recordsToDelete.length; i++) {
                try {
                    record.delete({
                        type: RECORD_TYPE,
                        id: recordsToDelete[i]
                    });
                    deletedCount++;
                } catch (e) {
                    log.error('Error deleting history record', 'ID: ' + recordsToDelete[i] + ', Error: ' + e.toString());
                }
            }
            
            log.audit('Query History Cleanup', 'Deleted ' + deletedCount + ' old records');
            return deletedCount;
            
        } catch (e) {
            log.error('Error cleaning up old history', e.toString());
            throw new Error('Failed to cleanup old history: ' + e.message);
        }
    }
    
    /**
     * Share a query history entry
     *
     * @param {number} recordId - History record ID
     * @param {string} sharingLevel - Sharing level (private/role/individual/public)
     * @param {Array} [sharedWithRoles] - Array of role IDs to share with
     * @param {Array} [sharedWithUsers] - Array of user IDs to share with
     * @returns {boolean} Success flag
     */
    function shareQueryHistory(recordId, sharingLevel, sharedWithRoles, sharedWithUsers) {
        try {
            const currentUser = runtime.getCurrentUser();
            const historyRecord = record.load({
                type: RECORD_TYPE,
                id: recordId
            });

            // Check if current user is the owner
            const createdBy = historyRecord.getValue(FIELDS.EXECUTED_BY);
            if (createdBy !== currentUser.id) {
                throw new Error('Only the owner can share this query history');
            }

            // Update sharing settings
            historyRecord.setValue({
                fieldId: FIELDS.SHARING_LEVEL,
                value: sharingLevel
            });

            if (sharedWithRoles && sharedWithRoles.length > 0) {
                historyRecord.setValue({
                    fieldId: FIELDS.SHARED_WITH_ROLES,
                    value: sharedWithRoles
                });
            }

            if (sharedWithUsers && sharedWithUsers.length > 0) {
                historyRecord.setValue({
                    fieldId: FIELDS.SHARED_WITH_USERS,
                    value: sharedWithUsers
                });
            }

            historyRecord.save();

            log.debug('Query History Shared', 'Record ID: ' + recordId + ', Sharing Level: ' + sharingLevel);
            return true;

        } catch (e) {
            log.error('Error sharing query history', e.toString());
            throw new Error('Failed to share query history: ' + e.message);
        }
    }

    /**
     * Get shared query history (queries shared with current user)
     *
     * @param {Object} [options] - Search options
     * @param {number} [options.limit] - Maximum number of records to return
     * @returns {Array} Array of shared history objects
     */
    function getSharedQueryHistory(options) {
        try {
            const currentUser = runtime.getCurrentUser();
            const limit = options?.limit || 50;

            const searchObj = search.create({
                type: RECORD_TYPE,
                filters: [
                    // Exclude user's own queries
                    search.createFilter({
                        name: FIELDS.EXECUTED_BY,
                        operator: search.Operator.NONEOF,
                        values: currentUser.id
                    }),
                    // Only successful queries
                    search.createFilter({
                        name: FIELDS.SUCCESS,
                        operator: search.Operator.IS,
                        values: true
                    }),
                    // Security filter for shared queries
                    search.createFilter({
                        name: 'formulanumeric',
                        operator: search.Operator.EQUALTO,
                        values: 1,
                        formula: `CASE
                            WHEN {${FIELDS.SHARING_LEVEL}} = '${SHARING_LEVELS.PUBLIC}' THEN 1
                            WHEN {${FIELDS.SHARING_LEVEL}} = '${SHARING_LEVELS.ROLE}' AND {${FIELDS.SHARED_WITH_ROLES}} LIKE '%${currentUser.roleId}%' THEN 1
                            WHEN {${FIELDS.SHARING_LEVEL}} = '${SHARING_LEVELS.INDIVIDUAL}' AND {${FIELDS.SHARED_WITH_USERS}} LIKE '%${currentUser.id}%' THEN 1
                            ELSE 0
                        END`
                    })
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: FIELDS.QUERY_CONTENT }),
                    search.createColumn({ name: FIELDS.EXECUTED_BY }),
                    search.createColumn({ name: FIELDS.EXECUTED_DATE, sort: search.Sort.DESC }),
                    search.createColumn({ name: FIELDS.EXECUTION_TIME }),
                    search.createColumn({ name: FIELDS.RECORD_COUNT }),
                    search.createColumn({ name: FIELDS.RESULT_FORMAT }),
                    search.createColumn({ name: FIELDS.QUERY_HASH }),
                    search.createColumn({ name: FIELDS.SHARING_LEVEL })
                ]
            });

            const results = [];
            let count = 0;

            searchObj.run().each(function(result) {
                if (count >= limit) return false; // Stop iteration

                results.push({
                    id: result.getValue('internalid'),
                    queryContent: result.getValue(FIELDS.QUERY_CONTENT),
                    executedBy: result.getValue(FIELDS.EXECUTED_BY),
                    executedDate: result.getValue(FIELDS.EXECUTED_DATE),
                    executionTime: result.getValue(FIELDS.EXECUTION_TIME),
                    recordCount: result.getValue(FIELDS.RECORD_COUNT),
                    resultFormat: result.getValue(FIELDS.RESULT_FORMAT),
                    queryHash: result.getValue(FIELDS.QUERY_HASH),
                    sharingLevel: result.getValue(FIELDS.SHARING_LEVEL)
                });

                count++;
                return true; // Continue iteration
            });

            return results;

        } catch (e) {
            log.error('Error getting shared query history', e.toString());
            throw new Error('Failed to get shared query history: ' + e.message);
        }
    }

    /**
     * Transfer ownership of query history records to another user
     *
     * @param {number} fromUserId - Current owner's employee ID
     * @param {number} toUserId - New owner's employee ID
     * @param {Object} [options] - Transfer options
     * @param {boolean} [options.adminOverride] - Allow admin to transfer without being owner
     * @param {Date} [options.fromDate] - Only transfer history from this date
     * @param {Date} [options.toDate] - Only transfer history to this date
     * @returns {Object} Transfer results
     */
    function transferHistoryOwnership(fromUserId, toUserId, options) {
        try {
            const currentUser = runtime.getCurrentUser();

            // Check admin permissions
            const isAdminOverride = options?.adminOverride && (
                currentUser.roleId === 'administrator' ||
                currentUser.roleId === 'customrole_admin' ||
                currentUser.roleId === 'customrole_suiteql_admin'
            );

            const isOwnerTransfer = fromUserId === currentUser.id;

            if (!isOwnerTransfer && !isAdminOverride) {
                throw new Error('Only the owner or administrator can transfer query history');
            }

            // Validate new owner exists
            try {
                const newOwnerRecord = record.load({
                    type: 'employee',
                    id: toUserId
                });

                if (!newOwnerRecord) {
                    throw new Error('New owner not found');
                }
            } catch (e) {
                throw new Error('Invalid new owner ID: ' + toUserId);
            }

            // Build search filters
            const filters = [
                search.createFilter({
                    name: FIELDS.EXECUTED_BY,
                    operator: search.Operator.ANYOF,
                    values: fromUserId
                })
            ];

            if (options?.fromDate) {
                filters.push(search.createFilter({
                    name: FIELDS.EXECUTED_DATE,
                    operator: search.Operator.ONORAFTER,
                    values: options.fromDate
                }));
            }

            if (options?.toDate) {
                filters.push(search.createFilter({
                    name: FIELDS.EXECUTED_DATE,
                    operator: search.Operator.ONORBEFORE,
                    values: options.toDate
                }));
            }

            // Get history records to transfer
            const searchObj = search.create({
                type: RECORD_TYPE,
                filters: filters,
                columns: [
                    search.createColumn({ name: 'internalid' })
                ]
            });

            const recordsToTransfer = [];
            searchObj.run().each(function(result) {
                recordsToTransfer.push(result.getValue('internalid'));
                return true;
            });

            // Transfer each record
            const results = {
                total: recordsToTransfer.length,
                successful: 0,
                failed: 0,
                errors: []
            };

            for (let i = 0; i < recordsToTransfer.length; i++) {
                try {
                    const historyRecord = record.load({
                        type: RECORD_TYPE,
                        id: recordsToTransfer[i]
                    });

                    historyRecord.setValue({
                        fieldId: FIELDS.EXECUTED_BY,
                        value: toUserId
                    });

                    // Reset sharing to private for security
                    historyRecord.setValue({
                        fieldId: FIELDS.SHARING_LEVEL,
                        value: SHARING_LEVELS.PRIVATE
                    });

                    historyRecord.setValue({
                        fieldId: FIELDS.SHARED_WITH_ROLES,
                        value: []
                    });

                    historyRecord.setValue({
                        fieldId: FIELDS.SHARED_WITH_USERS,
                        value: []
                    });

                    historyRecord.save();
                    results.successful++;

                } catch (e) {
                    results.failed++;
                    results.errors.push({
                        recordId: recordsToTransfer[i],
                        error: e.message
                    });
                }
            }

            log.audit('Query History Ownership Transfer', {
                fromUser: fromUserId,
                toUser: toUserId,
                transferredBy: currentUser.id,
                adminOverride: isAdminOverride,
                results: results
            });

            return results;

        } catch (e) {
            log.error('Error transferring history ownership', e.toString());
            throw new Error('Failed to transfer history ownership: ' + e.message);
        }
    }

    /**
     * Export the query history record functions
     */
    return {
        RECORD_TYPE: RECORD_TYPE,
        FIELDS: FIELDS,
        SHARING_LEVELS: SHARING_LEVELS,
        RESULT_FORMAT_MAPPING: RESULT_FORMAT_MAPPING,
        addQueryToHistory: addQueryToHistory,
        getQueryHistory: getQueryHistory,
        getUniqueQueryHistory: getUniqueQueryHistory,
        getSharedQueryHistory: getSharedQueryHistory,
        shareQueryHistory: shareQueryHistory,
        transferHistoryOwnership: transferHistoryOwnership,
        deleteHistoryRecord: deleteHistoryRecord,
        clearUserHistory: clearUserHistory,
        cleanupOldHistory: cleanupOldHistory,
        createQueryHash: createQueryHash
    };
    
});
