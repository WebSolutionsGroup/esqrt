/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Saved Queries Record Management
 * 
 * This module handles CRUD operations for the custom record:
 * customrecord_sqrt_saved_queries
 * 
 * Custom Record Fields:
 * - custrecord_sqrt_query_title (Text) - Query title/name
 * - custrecord_sqrt_query_content (Long Text) - SQL query content
 * - custrecord_sqrt_query_description (Long Text) - Query description
 * - custrecord_sqrt_query_tags (Text) - Comma-separated tags
 * - custrecord_sqrt_query_category (List/Record) - Query category
 * - custrecord_sqrt_query_created_by (Employee) - Creator
 * - custrecord_sqrt_query_last_modified (Date/Time) - Last modified
 * - custrecord_sqrt_query_execution_count (Integer) - Usage counter
 * - custrecord_sqrt_query_favorite (Checkbox) - Favorite flag
 * - custrecord_sqrt_query_shared_with_roles (Multiple Select - Role) - Shared roles
 * - custrecord_sqrt_query_shared_with_users (Multiple Select - Employee) - Shared users
 * - custrecord_sqrt_query_sharing_level (List) - None/Role/Individual/Public
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define(['N/record', 'N/search', 'N/runtime', 'N/log'], function(record, search, runtime, log) {
    
    // Custom Record and Field IDs
    const RECORD_TYPE = 'customrecord_sqrt_saved_queries';
    const FIELDS = {
        TITLE: 'custrecord_sqrt_query_title',
        CONTENT: 'custrecord_sqrt_query_content',
        DESCRIPTION: 'custrecord_sqrt_query_description',
        TAGS: 'custrecord_sqrt_query_tags',
        CATEGORY: 'custrecord_sqrt_query_category',
        CREATED_BY: 'custrecord_sqrt_query_created_by',
        LAST_MODIFIED: 'custrecord_sqrt_query_last_modified',
        EXECUTION_COUNT: 'custrecord_sqrt_query_execution_count',
        FAVORITE: 'custrecord_sqrt_query_favorite',
        SHARED_WITH_ROLES: 'custrecord_sqrt_query_shared_with_roles',
        SHARED_WITH_USERS: 'custrecord_sqrt_query_shared_with_users',
        SHARING_LEVEL: 'custrecord_sqrt_query_sharing_level'
    };

    // Sharing levels (using numeric IDs from custom list)
    const SHARING_LEVELS = {
        PRIVATE: '1',     // Only owner can see
        ROLE: '2',        // Shared with specific roles
        INDIVIDUAL: '3',  // Shared with specific users
        PUBLIC: '4'       // Everyone can see
    };

    // Category mapping (string to numeric list value ID)
    const CATEGORY_MAPPING = {
        'reports': '1',           // Reports
        'analysis': '2',          // Data Analysis
        'data analysis': '2',     // Data Analysis (alternate)
        'maintenance': '3',       // Maintenance
        'troubleshooting': '4',   // Troubleshooting
        'integration': '5',       // Integration
        'custom': '6',           // Custom
        'testing': '7',          // Testing
        'audit': '8'             // Audit
    };

    /**
     * Check if the custom record type exists
     *
     * @returns {boolean} True if the record type exists
     */
    function checkCustomRecordExists() {
        try {
            // Try to create a search on the record type to see if it exists
            search.create({
                type: RECORD_TYPE,
                filters: [],
                columns: ['internalid']
            });
            return true;
        } catch (e) {
            log.debug('Custom record type check failed', e.toString());
            return false;
        }
    }
    
    /**
     * Create a new saved query record
     * 
     * @param {Object} queryData - Query data object
     * @param {string} queryData.title - Query title
     * @param {string} queryData.content - SQL query content
     * @param {string} [queryData.description] - Query description
     * @param {string} [queryData.tags] - Comma-separated tags
     * @param {string} [queryData.category] - Query category
     * @param {boolean} [queryData.favorite] - Favorite flag
     * @param {string} [queryData.sharingLevel] - Sharing level (private/role/individual/public)
     * @param {Array} [queryData.sharedWithRoles] - Array of role IDs to share with
     * @param {Array} [queryData.sharedWithUsers] - Array of user IDs to share with
     * @returns {number} Record internal ID
     */
    function createSavedQuery(queryData) {
        try {
            log.debug('Creating saved query', {
                recordType: RECORD_TYPE,
                queryData: queryData
            });

            const currentUser = runtime.getCurrentUser();

            // Try to create the record
            const newRecord = record.create({
                type: RECORD_TYPE,
                isDynamic: true
            });

            log.debug('Record created successfully', 'Setting field values...');

            // Set required fields
            const title = queryData.title || 'Query';

            log.debug('Setting record fields', {
                title: title,
                content: queryData.content ? queryData.content.substring(0, 100) + '...' : 'empty'
            });

            // Ensure title is not empty and is a valid string
            let safeName = (title && title.trim()) ? title.trim() : 'Query';

            // Sanitize the name field for NetSuite - remove special characters and limit length
            safeName = safeName.replace(/[^\w\s\-_]/g, '').substring(0, 50).trim();
            if (!safeName || safeName === '') {
                safeName = 'Query_' + Date.now(); // Use timestamp as fallback
            }

            // Set the record's display name (this custom record has includename=T so it has a 'name' field)
            try {
                newRecord.setValue({ fieldId: 'name', value: safeName });
                log.debug('Set name field successfully', safeName);
            } catch(error) {
                log.error('Failed to set name field', error.toString());
                // If name field fails, try setting a timestamp-based default
                try {
                    const fallbackName = 'Query_' + Date.now();
                    newRecord.setValue({ fieldId: 'name', value: fallbackName });
                    log.debug('Set fallback name field', fallbackName);
                } catch(error2) {
                    log.error('Failed to set fallback name field', error2.toString());
                    // Last resort - try a simple string
                    try {
                        newRecord.setValue({ fieldId: 'name', value: 'Query' });
                    } catch(error3) {
                        log.error('Failed to set simple name field', error3.toString());
                    }
                }
            }

            newRecord.setValue({ fieldId: FIELDS.TITLE, value: safeName });
            newRecord.setValue({ fieldId: FIELDS.CONTENT, value: queryData.content || '' });

            // Optional fields (wrapped to avoid errors if fields don't exist in this account)
            try { if (queryData.description) newRecord.setValue({ fieldId: FIELDS.DESCRIPTION, value: queryData.description }); } catch(_e) { log.debug('Description field not available', _e.message); }
            try { if (queryData.tags) newRecord.setValue({ fieldId: FIELDS.TAGS, value: queryData.tags }); } catch(_e) { log.debug('Tags field not available', _e.message); }
            try {
                if (queryData.category && queryData.category.trim() !== '') {
                    const categoryValue = CATEGORY_MAPPING[queryData.category.toLowerCase()];
                    if (categoryValue) {
                        newRecord.setValue({ fieldId: FIELDS.CATEGORY, value: categoryValue });
                    }
                }
            } catch(_e) { log.debug('Category field not available', _e.message); }
            try { newRecord.setValue({ fieldId: FIELDS.FAVORITE, value: !!queryData.favorite }); } catch(_e) { log.debug('Favorite field not available', _e.message); }
            try {
                if (queryData.sharingLevel && queryData.sharingLevel.trim() !== '') {
                    const sharingLevelValue = SHARING_LEVELS[queryData.sharingLevel.toUpperCase()];
                    if (sharingLevelValue) {
                        newRecord.setValue({ fieldId: FIELDS.SHARING_LEVEL, value: sharingLevelValue });
                    }
                }
                // If no sharing level provided, let NetSuite use the field's default value
            } catch(_e) { log.debug('Sharing level field not available', _e.message); }
            try { if (queryData.sharedWithRoles && queryData.sharedWithRoles.length) newRecord.setValue({ fieldId: FIELDS.SHARED_WITH_ROLES, value: queryData.sharedWithRoles }); } catch(_e) { log.debug('Shared with roles field not available', _e.message); }
            try { if (queryData.sharedWithUsers && queryData.sharedWithUsers.length) newRecord.setValue({ fieldId: FIELDS.SHARED_WITH_USERS, value: queryData.sharedWithUsers }); } catch(_e) { log.debug('Shared with users field not available', _e.message); }
            // System/metadata fields
            try {
                newRecord.setValue({ fieldId: FIELDS.CREATED_BY, value: currentUser.id });
                log.debug('Created by field set', currentUser.id);
            } catch(_e) {
                log.error('Created by field not available', _e.message);
            }
            try {
                newRecord.setValue({ fieldId: FIELDS.LAST_MODIFIED, value: new Date() });
                log.debug('Last modified field set');
            } catch(_e) {
                log.debug('Last modified field not available', _e.message);
            }
            try {
                newRecord.setValue({ fieldId: FIELDS.EXECUTION_COUNT, value: 0 });
                log.debug('Execution count field set');
            } catch(_e) {
                log.debug('Execution count field not available', _e.message);
            }

            log.debug('Saving record...');
            const recordId = newRecord.save();

            log.debug('Saved Query Created', 'Record ID: ' + recordId);
            return recordId;

        } catch (e) {
            log.error('Error creating saved query', {
                error: e.toString(),
                stack: e.stack,
                recordType: RECORD_TYPE,
                queryData: queryData
            });

            // Check if it's a record type not found error
            if (e.message && e.message.indexOf('INVALID_RCRD_TYPE') !== -1) {
                throw new Error('Custom record type "' + RECORD_TYPE + '" does not exist. Please create the custom record type first.');
            }

            throw new Error('Failed to create saved query: ' + e.message);
        }
    }
    
    /**
     * Load a saved query record
     * 
     * @param {number} recordId - Record internal ID
     * @returns {Object} Query data object
     */
    function loadSavedQuery(recordId) {
        try {
            const queryRecord = record.load({
                type: RECORD_TYPE,
                id: recordId
            });
            
            return {
                id: recordId,
                title: queryRecord.getValue(FIELDS.TITLE),
                content: queryRecord.getValue(FIELDS.CONTENT),
                description: queryRecord.getValue(FIELDS.DESCRIPTION),
                tags: queryRecord.getValue(FIELDS.TAGS),
                category: queryRecord.getValue(FIELDS.CATEGORY),
                sharingLevel: queryRecord.getValue(FIELDS.SHARING_LEVEL),
                createdBy: queryRecord.getValue(FIELDS.CREATED_BY),
                lastModified: queryRecord.getValue(FIELDS.LAST_MODIFIED),
                executionCount: queryRecord.getValue(FIELDS.EXECUTION_COUNT),
                favorite: queryRecord.getValue(FIELDS.FAVORITE)
            };
            
        } catch (e) {
            log.error('Error loading saved query', e.toString());
            throw new Error('Failed to load saved query: ' + e.message);
        }
    }
    
    /**
     * Update a saved query record
     * 
     * @param {number} recordId - Record internal ID
     * @param {Object} queryData - Updated query data
     * @returns {number} Record internal ID
     */
    function updateSavedQuery(recordId, queryData) {
        try {
            const queryRecord = record.load({
                type: RECORD_TYPE,
                id: recordId
            });
            
            // Update fields if provided (wrapped to avoid missing-field errors)
            if (queryData.title !== undefined) {
                queryRecord.setValue({ fieldId: FIELDS.TITLE, value: queryData.title });

                // Also update the record's display name
                const safeName = (queryData.title && queryData.title.trim()) ? queryData.title.trim() : 'Query';

                // Set the record's display name (this custom record has includename=T so it has a 'name' field)
                try {
                    queryRecord.setValue({ fieldId: 'name', value: safeName });
                    log.debug('Updated name field successfully', safeName);
                } catch(error) {
                    log.error('Failed to update name field', error.toString());
                    // If name field fails, try setting a simple default
                    try {
                        queryRecord.setValue({ fieldId: 'name', value: 'Query' });
                    } catch(error2) {
                        log.error('Failed to set default name field on update', error2.toString());
                    }
                }
            }
            if (queryData.content !== undefined) { queryRecord.setValue({ fieldId: FIELDS.CONTENT, value: queryData.content }); }
            try { if (queryData.description !== undefined) queryRecord.setValue({ fieldId: FIELDS.DESCRIPTION, value: queryData.description }); } catch(_e) {}
            try { if (queryData.tags !== undefined) queryRecord.setValue({ fieldId: FIELDS.TAGS, value: queryData.tags }); } catch(_e) {}
            try {
                if (queryData.category !== undefined && queryData.category.trim() !== '') {
                    const categoryValue = CATEGORY_MAPPING[queryData.category.toLowerCase()];
                    if (categoryValue) {
                        queryRecord.setValue({ fieldId: FIELDS.CATEGORY, value: categoryValue });
                    }
                }
            } catch(_e) {}
            try {
                if (queryData.sharingLevel !== undefined && queryData.sharingLevel.trim() !== '') {
                    const sharingLevelValue = SHARING_LEVELS[queryData.sharingLevel.toUpperCase()];
                    if (sharingLevelValue) {
                        queryRecord.setValue({ fieldId: FIELDS.SHARING_LEVEL, value: sharingLevelValue });
                    }
                }
                // If no sharing level provided, leave the existing value unchanged
            } catch(_e) {}
            try { if (queryData.favorite !== undefined) queryRecord.setValue({ fieldId: FIELDS.FAVORITE, value: queryData.favorite }); } catch(_e) {}
            // Always update last modified
            try { queryRecord.setValue({ fieldId: FIELDS.LAST_MODIFIED, value: new Date() }); } catch(_e) {}
            
            const savedId = queryRecord.save();
            
            log.debug('Saved Query Updated', 'Record ID: ' + savedId);
            return savedId;
            
        } catch (e) {
            log.error('Error updating saved query', e.toString());
            throw new Error('Failed to update saved query: ' + e.message);
        }
    }
    
    /**
     * Delete a saved query record
     * 
     * @param {number} recordId - Record internal ID
     * @returns {boolean} Success flag
     */
    function deleteSavedQuery(recordId) {
        try {
            record.delete({
                type: RECORD_TYPE,
                id: recordId
            });
            
            log.debug('Saved Query Deleted', 'Record ID: ' + recordId);
            return true;
            
        } catch (e) {
            log.error('Error deleting saved query', e.toString());
            throw new Error('Failed to delete saved query: ' + e.message);
        }
    }
    
    /**
     * Search for saved queries
     *
     * @param {Object} [filters] - Search filters
     * @param {string} [filters.title] - Filter by title (contains)
     * @param {string} [filters.tags] - Filter by tags (contains)
     * @param {string} [filters.category] - Filter by category
     * @param {boolean} [filters.isPublic] - Filter by public/private
     * @param {boolean} [filters.favorite] - Filter by favorite
     * @param {number} [filters.createdBy] - Filter by creator
     * @returns {Array} Array of query objects
     */
    function searchSavedQueries(filters) {
        try {
            const currentUser = runtime.getCurrentUser();
            const searchObj = search.create({
                type: RECORD_TYPE,
                filters: [],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: FIELDS.TITLE }),
                    search.createColumn({ name: FIELDS.CONTENT }),
                    search.createColumn({ name: FIELDS.DESCRIPTION }),
                    search.createColumn({ name: FIELDS.TAGS }),
                    search.createColumn({ name: FIELDS.CATEGORY }),
                    search.createColumn({ name: FIELDS.SHARING_LEVEL }),
                    search.createColumn({ name: FIELDS.CREATED_BY }),
                    search.createColumn({ name: FIELDS.LAST_MODIFIED }),
                    search.createColumn({ name: FIELDS.EXECUTION_COUNT }),
                    search.createColumn({ name: FIELDS.FAVORITE })
                ]
            });

            // Add filters
            if (filters) {
                if (filters.title) {
                    searchObj.filters.push(search.createFilter({
                        name: FIELDS.TITLE,
                        operator: search.Operator.CONTAINS,
                        values: filters.title
                    }));
                }

                if (filters.exactTitle) {
                    searchObj.filters.push(search.createFilter({
                        name: FIELDS.TITLE,
                        operator: search.Operator.IS,
                        values: filters.exactTitle
                    }));
                }

                if (filters.tags) {
                    searchObj.filters.push(search.createFilter({
                        name: FIELDS.TAGS,
                        operator: search.Operator.CONTAINS,
                        values: filters.tags
                    }));
                }

                if (filters.category) {
                    searchObj.filters.push(search.createFilter({
                        name: FIELDS.CATEGORY,
                        operator: search.Operator.ANYOF,
                        values: filters.category
                    }));
                }

                if (filters.sharingLevel !== undefined) {
                    searchObj.filters.push(search.createFilter({
                        name: FIELDS.SHARING_LEVEL,
                        operator: search.Operator.IS,
                        values: filters.sharingLevel
                    }));
                }

                if (filters.favorite !== undefined) {
                    searchObj.filters.push(search.createFilter({
                        name: FIELDS.FAVORITE,
                        operator: search.Operator.IS,
                        values: filters.favorite
                    }));
                }

                if (filters.createdBy) {
                    searchObj.filters.push(search.createFilter({
                        name: FIELDS.CREATED_BY,
                        operator: search.Operator.ANYOF,
                        values: filters.createdBy
                    }));
                }
            }

            // Simplified security filter - just show user's own queries for now
            // We can add more complex sharing later once basic functionality works
            try {
                searchObj.filters.push(search.createFilter({
                    name: FIELDS.CREATED_BY,
                    operator: search.Operator.ANYOF,
                    values: [currentUser.id]
                }));
                log.debug('Added security filter', 'User ID: ' + currentUser.id);
            } catch(filterError) {
                log.error('Error adding security filter', filterError.message);
                // If CREATED_BY field doesn't exist, just search all records for now
                log.debug('Searching all records due to filter error');
            }

            const results = [];
            log.debug('Running search for saved queries', 'Current user ID: ' + currentUser.id);

            searchObj.run().each(function(result) {
                const queryData = {
                    id: result.getValue('internalid'),
                    title: result.getValue(FIELDS.TITLE),
                    content: result.getValue(FIELDS.CONTENT),
                    description: result.getValue(FIELDS.DESCRIPTION),
                    tags: result.getValue(FIELDS.TAGS),
                    category: result.getValue(FIELDS.CATEGORY),
                    sharingLevel: result.getValue(FIELDS.SHARING_LEVEL),
                    createdBy: result.getValue(FIELDS.CREATED_BY),
                    lastModified: result.getValue(FIELDS.LAST_MODIFIED),
                    executionCount: result.getValue(FIELDS.EXECUTION_COUNT),
                    favorite: result.getValue(FIELDS.FAVORITE)
                };

                log.debug('Found saved query', {
                    id: queryData.id,
                    title: queryData.title,
                    createdBy: queryData.createdBy,
                    sharingLevel: queryData.sharingLevel
                });

                results.push(queryData);
                return true; // Continue iteration
            });

            log.debug('Search completed', 'Found ' + results.length + ' queries');
            return results;

        } catch (e) {
            log.error('Error searching saved queries', {
                error: e.toString(),
                message: e.message,
                stack: e.stack
            });
            throw new Error('Failed to search saved queries: ' + e.message);
        }
    }

    /**
     * Increment execution count for a saved query
     *
     * @param {number} recordId - Record internal ID
     * @returns {boolean} Success flag
     */
    function incrementExecutionCount(recordId) {
        try {
            const queryRecord = record.load({
                type: RECORD_TYPE,
                id: recordId
            });

            const currentCount = queryRecord.getValue(FIELDS.EXECUTION_COUNT) || 0;
            queryRecord.setValue({
                fieldId: FIELDS.EXECUTION_COUNT,
                value: currentCount + 1
            });

            queryRecord.save();
            return true;

        } catch (e) {
            log.error('Error incrementing execution count', e.toString());
            return false;
        }
    }

    /**
     * Transfer ownership of a saved query to another user
     *
     * @param {number} recordId - Record internal ID
     * @param {number} newOwnerId - New owner's employee ID
     * @param {Object} [options] - Transfer options
     * @param {boolean} [options.adminOverride] - Allow admin to transfer without being owner
     * @returns {boolean} Success flag
     */
    function transferQueryOwnership(recordId, newOwnerId, options) {
        try {
            const currentUser = runtime.getCurrentUser();
            const queryRecord = record.load({
                type: RECORD_TYPE,
                id: recordId
            });

            const currentOwner = queryRecord.getValue(FIELDS.CREATED_BY);

            // Check permissions - must be owner or admin with override
            const isOwner = currentOwner === currentUser.id;
            const isAdminOverride = options?.adminOverride && (
                currentUser.roleId === 'administrator' ||
                currentUser.roleId === 'customrole_admin' ||
                currentUser.roleId === 'customrole_suiteql_admin'
            );

            if (!isOwner && !isAdminOverride) {
                throw new Error('Only the owner or administrator can transfer ownership of this query');
            }

            // Validate new owner exists
            try {
                const newOwnerRecord = record.load({
                    type: 'employee',
                    id: newOwnerId
                });

                if (!newOwnerRecord) {
                    throw new Error('New owner not found');
                }
            } catch (e) {
                throw new Error('Invalid new owner ID: ' + newOwnerId);
            }

            // Transfer ownership
            queryRecord.setValue({
                fieldId: FIELDS.CREATED_BY,
                value: newOwnerId
            });

            // Update last modified
            queryRecord.setValue({
                fieldId: FIELDS.LAST_MODIFIED,
                value: new Date()
            });

            // Reset sharing to private for security
            queryRecord.setValue({
                fieldId: FIELDS.SHARING_LEVEL,
                value: SHARING_LEVELS.PRIVATE
            });

            // Clear sharing lists
            queryRecord.setValue({
                fieldId: FIELDS.SHARED_WITH_ROLES,
                value: []
            });

            queryRecord.setValue({
                fieldId: FIELDS.SHARED_WITH_USERS,
                value: []
            });

            queryRecord.save();

            log.audit('Query Ownership Transferred', {
                recordId: recordId,
                fromUser: currentOwner,
                toUser: newOwnerId,
                transferredBy: currentUser.id,
                adminOverride: isAdminOverride
            });

            return true;

        } catch (e) {
            log.error('Error transferring query ownership', e.toString());
            throw new Error('Failed to transfer query ownership: ' + e.message);
        }
    }

    /**
     * Bulk transfer queries from one user to another
     *
     * @param {number} fromUserId - Current owner's employee ID
     * @param {number} toUserId - New owner's employee ID
     * @param {Object} [options] - Transfer options
     * @param {boolean} [options.adminOverride] - Allow admin to transfer without being owner
     * @param {Array} [options.queryIds] - Specific query IDs to transfer (if not provided, transfers all)
     * @returns {Object} Transfer results
     */
    function bulkTransferQueryOwnership(fromUserId, toUserId, options) {
        try {
            const currentUser = runtime.getCurrentUser();

            // Check admin permissions for bulk transfer
            const isAdminOverride = options?.adminOverride && (
                currentUser.roleId === 'administrator' ||
                currentUser.roleId === 'customrole_admin' ||
                currentUser.roleId === 'customrole_suiteql_admin'
            );

            const isOwnerTransfer = fromUserId === currentUser.id;

            if (!isOwnerTransfer && !isAdminOverride) {
                throw new Error('Only the owner or administrator can perform bulk transfer');
            }

            // Get queries to transfer
            let queriesToTransfer = [];

            if (options?.queryIds && options.queryIds.length > 0) {
                // Transfer specific queries
                queriesToTransfer = options.queryIds;
            } else {
                // Transfer all queries from user
                const searchObj = search.create({
                    type: RECORD_TYPE,
                    filters: [
                        search.createFilter({
                            name: FIELDS.CREATED_BY,
                            operator: search.Operator.ANYOF,
                            values: fromUserId
                        })
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid' })
                    ]
                });

                searchObj.run().each(function(result) {
                    queriesToTransfer.push(result.getValue('internalid'));
                    return true;
                });
            }

            // Transfer each query
            const results = {
                total: queriesToTransfer.length,
                successful: 0,
                failed: 0,
                errors: []
            };

            for (let i = 0; i < queriesToTransfer.length; i++) {
                try {
                    transferQueryOwnership(queriesToTransfer[i], toUserId, { adminOverride: isAdminOverride });
                    results.successful++;
                } catch (e) {
                    results.failed++;
                    results.errors.push({
                        queryId: queriesToTransfer[i],
                        error: e.message
                    });
                }
            }

            log.audit('Bulk Query Ownership Transfer', {
                fromUser: fromUserId,
                toUser: toUserId,
                transferredBy: currentUser.id,
                results: results
            });

            return results;

        } catch (e) {
            log.error('Error in bulk transfer', e.toString());
            throw new Error('Failed to perform bulk transfer: ' + e.message);
        }
    }

    /**
     * Export the saved queries record functions
     */
    return {
        RECORD_TYPE: RECORD_TYPE,
        FIELDS: FIELDS,
        SHARING_LEVELS: SHARING_LEVELS,
        CATEGORY_MAPPING: CATEGORY_MAPPING,
        checkCustomRecordExists: checkCustomRecordExists,
        createSavedQuery: createSavedQuery,
        loadSavedQuery: loadSavedQuery,
        updateSavedQuery: updateSavedQuery,
        deleteSavedQuery: deleteSavedQuery,
        searchSavedQueries: searchSavedQueries,
        incrementExecutionCount: incrementExecutionCount,
        transferQueryOwnership: transferQueryOwnership,
        bulkTransferQueryOwnership: bulkTransferQueryOwnership
    };
    
});
