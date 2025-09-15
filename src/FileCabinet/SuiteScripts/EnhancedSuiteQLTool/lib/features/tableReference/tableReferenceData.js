/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Table Reference Data Module
 * 
 * This module handles data operations for the Table Reference functionality,
 * including fetching table lists and detailed table information from
 * NetSuite's Records Catalog API.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate JavaScript for Table Reference data operations
     * 
     * @returns {string} JavaScript code for table reference data functionality
     */
    function getTableReferenceDataJS() {
        return `
            // Table Reference data cache
            var tableReferenceCache = {
                recordTypes: null,
                tableDetails: {},
                recordOverviews: {},
                lastFetch: null,
                // Pagination state
                pagination: {
                    system: { loaded: 0, total: 0, loading: false },
                    custom: { loaded: 0, total: 0, loading: false }
                },
                // Family-level pagination state
                familyPagination: {}
            };

            // Configuration
            var TABLE_REFERENCE_CONFIG = {
                INITIAL_LOAD_SIZE: 100,
                SCROLL_LOAD_SIZE: 50,
                SCROLL_THRESHOLD: 200, // pixels from bottom to trigger load
                ENABLE_COUNT_PREVIEW: true // Show family counts before loading details
            };
            
            // NetSuite Records Catalog API endpoints
            var RECORDS_CATALOG_ENDPOINTS = {
                GET_RECORD_TYPES: '/app/recordscatalog/rcendpoint.nl?action=getRecordTypes&data=',
                GET_RECORD_TYPE_DETAIL: '/app/recordscatalog/rcendpoint.nl?action=getRecordTypeDetail&data=',
                GET_RECORD_TYPE_OVERVIEW: '/app/recordscatalog/rcendpoint.nl?action=getRecordTypeOverview&data=',
                // Browser endpoint for reference (not used in API calls)
                BROWSER_RECORD_VIEW: '/app/recordscatalog/rcbrowser.nl?whence=#/record/'
            };
            
            /**
             * Global search across all record types
             */
            function searchAllRecords(searchTerm) {
                if (!tableReferenceCache.recordTypes || !searchTerm.trim()) {
                    return [];
                }

                const term = searchTerm.toLowerCase();
                return tableReferenceCache.recordTypes.filter(table => {
                    return (table.id && table.id.toLowerCase().includes(term)) ||
                           (table.label && table.label.toLowerCase().includes(term)) ||
                           (table.originalName && table.originalName.toLowerCase().includes(term));
                }).slice(0, 50); // Limit to 50 results for performance
            }

            /**
             * Render search results
             */
            function renderSearchResults(container, results, searchTerm) {
                if (results.length === 0) {
                    container.innerHTML = \`
                        <div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary); font-style: italic;">
                            No records found for "\${searchTerm}"
                        </div>
                    \`;
                    return;
                }

                let html = \`
                    <div style="padding: 8px; background: var(--codeoss-background-secondary); border-bottom: 1px solid var(--codeoss-border); font-weight: 600; font-size: 10px; color: var(--codeoss-text-primary);">
                        SEARCH RESULTS (\${results.length})
                    </div>
                \`;

                results.forEach(table => {
                    const origin = isSystemRecord(table) ? 'System' : 'Custom';
                    const family = getRecordFamily(table);

                    html += \`
                        <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_ITEM}"
                             onclick="openTableReferenceTab('\${table.id}', '\${table.label}')"
                             title="Click to view \${table.label} details"
                             style="padding: 6px 16px; cursor: pointer; border-radius: 3px; font-size: 11px; line-height: 1.3; border-bottom: 1px solid var(--codeoss-border-light);">
                            <div style="font-weight: 500; color: var(--codeoss-text-primary);">\${table.label}</div>
                            <div style="color: var(--codeoss-text-secondary); font-size: 10px;">\${table.id}</div>
                            <div style="color: var(--codeoss-text-tertiary); font-size: 9px; margin-top: 2px;">\${origin} • \${family}</div>
                        </div>
                    \`;
                });

                container.innerHTML = html;
            }

            /**
             * Load table explorer data for a specific category
             */
            function loadTableExplorerData(categoryName) {
                if (!tableReferenceCache.recordTypes) {
                    // First time loading - fetch all record types
                    fetchAllRecordTypes().then(() => {
                        populateTableCategory(categoryName);
                    });
                } else {
                    // Data already cached - just populate the category
                    populateTableCategory(categoryName);
                }
            }
            
            /**
             * Fetch all record types from NetSuite Records Catalog
             */
            function fetchAllRecordTypes() {
                return new Promise((resolve, reject) => {
                    // Use the correct API parameters as documented by Tim Dietrich
                    const requestData = { structureType: 'FLAT' };
                    const url = RECORDS_CATALOG_ENDPOINTS.GET_RECORD_TYPES + encodeURI(JSON.stringify(requestData));

                    console.log('Fetching record types with URL:', url);
                    
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            try {
                                const response = JSON.parse(xhr.response);
                                tableReferenceCache.recordTypes = response.data || [];
                                tableReferenceCache.lastFetch = Date.now();

                                console.log('Loaded', tableReferenceCache.recordTypes.length, 'record types');

                                // Debug: Log the structure and available fields
                                if (tableReferenceCache.recordTypes.length > 0) {
                                    console.log('Sample record structure:', tableReferenceCache.recordTypes[0]);
                                    console.log('Available fields in first record:', Object.keys(tableReferenceCache.recordTypes[0]));

                                    // Look for any CUSTOMLIST records to debug
                                    const customListSample = tableReferenceCache.recordTypes.find(r => r.id && r.id.toUpperCase().includes('CUSTOMLIST'));
                                    if (customListSample) {
                                        console.log('Sample CUSTOMLIST record:', customListSample);
                                        console.log('CUSTOMLIST record fields:', Object.keys(customListSample));

                                        // Test the new overview endpoint for this record
                                        console.log('Testing overview endpoint for:', customListSample.id);
                                        fetchRecordOverview(customListSample.id).then(overview => {
                                            console.log('Overview data for', customListSample.id, ':', overview);
                                        }).catch(error => {
                                            console.error('Failed to fetch overview for', customListSample.id, ':', error);
                                        });
                                    }

                                    // Check what origin/family fields are available across all records
                                    const originFields = new Set();
                                    const familyFields = new Set();
                                    tableReferenceCache.recordTypes.slice(0, 10).forEach(record => {
                                        Object.keys(record).forEach(key => {
                                            if (key.toLowerCase().includes('origin')) originFields.add(key);
                                            if (key.toLowerCase().includes('family') || key.toLowerCase().includes('type')) familyFields.add(key);
                                        });
                                    });
                                    console.log('Fields containing "origin":', Array.from(originFields));
                                    console.log('Fields containing "family" or "type":', Array.from(familyFields));
                                }

                                resolve(tableReferenceCache.recordTypes);
                            } catch (error) {
                                console.error('Error parsing record types response:', error);
                                reject(error);
                            }
                        } else {
                            console.error('Failed to fetch record types:', xhr.status, xhr.statusText);
                            reject(new Error('Failed to fetch record types'));
                        }
                    };
                    
                    xhr.onerror = function() {
                        console.error('Network error while fetching record types');
                        reject(new Error('Network error'));
                    };
                    
                    xhr.send();
                });
            }
            
            /**
             * Helper function to determine if a record is a system record
             * Uses actual API data when available, falls back to ID patterns
             */
            function isSystemRecord(table) {
                // Check if we have overview data with isCustom field
                const overview = tableReferenceCache.recordOverviews[table.id];
                if (overview && typeof overview.isCustom === 'boolean') {
                    return !overview.isCustom; // System records have isCustom = false
                }

                // Check for explicit origin field
                if (table.origin) {
                    return table.origin.toUpperCase() === 'SYSTEM' || table.origin.toUpperCase() === 'STANDARD';
                }

                // Check other possible field names that might indicate origin
                if (table.recordOrigin) {
                    return table.recordOrigin.toUpperCase() === 'SYSTEM' || table.recordOrigin.toUpperCase() === 'STANDARD';
                }

                // Fallback to ID pattern matching
                if (table.id) {
                    const idUpper = table.id.toUpperCase();
                    return !idUpper.startsWith('CUSTOMRECORD_') &&
                           !idUpper.startsWith('CUSTOMLIST_') &&
                           !idUpper.startsWith('CUSTOMSEARCH_');
                }

                return false;
            }

            /**
             * Helper function to determine if a record is a custom record
             * Uses actual API data when available, falls back to ID patterns
             */
            function isCustomRecord(table) {
                // Check if we have overview data with isCustom field
                const overview = tableReferenceCache.recordOverviews[table.id];
                if (overview && typeof overview.isCustom === 'boolean') {
                    return overview.isCustom; // Custom records have isCustom = true
                }

                // Check for explicit origin field
                if (table.origin) {
                    return table.origin.toUpperCase() === 'CUSTOM';
                }

                // Check other possible field names that might indicate origin
                if (table.recordOrigin) {
                    return table.recordOrigin.toUpperCase() === 'CUSTOM';
                }

                // Fallback to ID pattern matching
                if (table.id) {
                    const idUpper = table.id.toUpperCase();
                    return idUpper.startsWith('CUSTOMRECORD_') ||
                           idUpper.startsWith('CUSTOMLIST_') ||
                           idUpper.startsWith('CUSTOMSEARCH_');
                }

                return false;
            }

            /**
             * Helper function to get the record family from API data
             * Uses actual API data when available, derives from ID patterns as fallback
             */
            function getRecordFamily(table) {
                // Check if we have overview data with baseType field
                const overview = tableReferenceCache.recordOverviews[table.id];
                if (overview && overview.baseType) {
                    return overview.baseType; // Use the baseType from overview (e.g., "ENTITY", "TRANSACTION")
                }

                // Check for explicit record family field
                if (table.recordFamily) {
                    return table.recordFamily;
                }

                // Check other possible field names
                if (table.family) {
                    return table.family;
                }

                if (table.recordType) {
                    return table.recordType;
                }

                // Enhanced fallback logic for both custom and system records
                if (table.id) {
                    const idLower = table.id.toLowerCase();
                    const idUpper = table.id.toUpperCase();

                    // Custom record patterns
                    if (idUpper.startsWith('CUSTOMLIST_')) {
                        return 'CUSTOMLIST';
                    } else if (idUpper.startsWith('CUSTOMRECORD_')) {
                        return 'CUSTOM';
                    } else if (idUpper.startsWith('CUSTOMSEARCH_')) {
                        return 'CUSTOMSEARCH';
                    }

                    // System record patterns - common NetSuite entities
                    else if (['employee', 'customer', 'vendor', 'partner', 'contact', 'lead', 'prospect'].includes(idLower)) {
                        return 'ENTITY';
                    }
                    // Transaction records
                    else if (['salesorder', 'purchaseorder', 'invoice', 'bill', 'payment', 'deposit', 'check', 'journalentry', 'estimate', 'opportunity', 'cashsale', 'creditmemo', 'vendorbill', 'vendorpayment', 'vendorcredit'].includes(idLower)) {
                        return 'TRANSACTION';
                    }
                    // Item records
                    else if (['item', 'inventoryitem', 'noninventoryitem', 'serviceitem', 'kititem', 'assemblyitem', 'discountitem', 'paymentitem', 'subtotalitem', 'markupitem', 'downloaditem', 'giftcertificateitem'].includes(idLower)) {
                        return 'ITEM';
                    }
                    // Activity/Event records
                    else if (['task', 'event', 'call', 'calendarevent', 'phonecall'].includes(idLower)) {
                        return 'ACTIVITY';
                    }
                    // Support/Case records
                    else if (['supportcase', 'case', 'issue'].includes(idLower)) {
                        return 'SUPPORT';
                    }
                    // Project records
                    else if (['job', 'project', 'projecttask'].includes(idLower)) {
                        return 'PROJECT';
                    }
                    // Other common system records
                    else if (['account', 'department', 'location', 'subsidiary', 'classification', 'currency', 'taxcode', 'paymentmethod', 'paymentterm', 'priceplan', 'pricelevel'].includes(idLower)) {
                        return 'SETUP';
                    }
                }

                return 'OTHER';
            }

            /**
             * Batch fetch overview data for multiple records
             * This helps with performance by fetching metadata for classification
             */
            function batchFetchOverviews(recordIds, maxConcurrent = 5) {
                return new Promise((resolve) => {
                    let completed = 0;
                    let currentIndex = 0;

                    function processNext() {
                        if (currentIndex >= recordIds.length) {
                            if (completed >= recordIds.length) {
                                resolve();
                            }
                            return;
                        }

                        const recordId = recordIds[currentIndex++];

                        // Skip if already cached
                        if (tableReferenceCache.recordOverviews[recordId]) {
                            completed++;
                            processNext();
                            return;
                        }

                        fetchRecordOverview(recordId)
                            .then(() => {
                                completed++;
                                processNext();
                            })
                            .catch((error) => {
                                console.warn('Failed to fetch overview for', recordId, ':', error);
                                completed++;
                                processNext();
                            });
                    }

                    // Start multiple concurrent requests
                    for (let i = 0; i < Math.min(maxConcurrent, recordIds.length); i++) {
                        processNext();
                    }
                });
            }

            /**
             * Generate family counts for a category (async to fetch overview data)
             */
            function generateFamilyCounts(categoryName) {
                return new Promise((resolve) => {
                    if (!tableReferenceCache.recordTypes) {
                        resolve({});
                        return;
                    }

                    let allFilteredTables = [];
                    if (categoryName === 'system') {
                        allFilteredTables = tableReferenceCache.recordTypes.filter(table => isSystemRecord(table));
                    } else if (categoryName === 'custom') {
                        allFilteredTables = tableReferenceCache.recordTypes.filter(table => isCustomRecord(table));
                    } else {
                        resolve({});
                        return;
                    }

                    console.log('Generating family counts for', categoryName, '- found', allFilteredTables.length, 'records');

                    // Fetch overview data for a sample of records to get accurate family classification
                    // We'll fetch overview for up to 200 records to get a good representation
                    const sampleSize = Math.min(200, allFilteredTables.length);
                    const sampleRecords = allFilteredTables.slice(0, sampleSize);
                    const recordIds = sampleRecords.map(table => table.id);

                    console.log('Fetching overview data for', recordIds.length, 'sample records to determine families');

                    batchFetchOverviews(recordIds).then(() => {
                        // Now group by record family with overview data available
                        const familyCounts = {};
                        allFilteredTables.forEach(table => {
                            const family = getRecordFamily(table);
                            familyCounts[family] = (familyCounts[family] || 0) + 1;
                        });

                        console.log('Family counts for', categoryName, ':', familyCounts);
                        resolve(familyCounts);
                    }).catch(error => {
                        console.error('Error fetching overview data for family counts:', error);
                        // Fallback to basic classification without overview data
                        const familyCounts = {};
                        allFilteredTables.forEach(table => {
                            const family = getRecordFamily(table);
                            familyCounts[family] = (familyCounts[family] || 0) + 1;
                        });
                        resolve(familyCounts);
                    });
                });
            }

            /**
             * Render family count preview (collapsed families with counts)
             */
            function renderFamilyCountPreview(container, categoryName) {
                // Check if we have pre-analyzed counts
                if (tableReferenceCache.preAnalyzedCounts && tableReferenceCache.preAnalyzedCounts[categoryName]) {
                    console.log('Using pre-analyzed family counts for', categoryName);
                    const familyCounts = tableReferenceCache.preAnalyzedCounts[categoryName];
                    renderFamilyCountsUI(container, categoryName, familyCounts);
                    return;
                }

                // Show loading state initially
                container.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary);">Analyzing record families...</div>';

                generateFamilyCounts(categoryName).then(familyCounts => {
                    renderFamilyCountsUI(container, categoryName, familyCounts);
                }).catch(error => {
                    console.error('Error generating family counts:', error);
                    container.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-error);">Error loading record families</div>';
                });
            }

            /**
             * Render the family counts UI
             */
            function renderFamilyCountsUI(container, categoryName, familyCounts) {
                const families = Object.keys(familyCounts).sort();

                if (families.length === 0) {
                    container.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary); font-style: italic;">No records found</div>';
                    return;
                }

                let html = '';
                families.forEach(family => {
                    const count = familyCounts[family];
                    html += \`
                        <div class="table-family-header" onclick="loadFamilyDetails('\${categoryName}', '\${family}')"
                             style="padding: 6px 8px; background: var(--codeoss-background-secondary); border-bottom: 1px solid var(--codeoss-border); font-weight: 600; font-size: 10px; color: var(--codeoss-text-primary); text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; display: flex; align-items: center;">
                            <span class="family-toggle-icon">▶</span>
                            \${family} (\${count})
                            <span style="margin-left: auto; font-size: 9px; color: var(--codeoss-text-secondary); opacity: 0.7;">Click to load</span>
                        </div>
                        <div class="table-family-content collapsed" id="family-\${categoryName}-\${family}" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
                            <div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary); font-size: 10px;">
                                Click header to load \${count} records
                            </div>
                        </div>
                    \`;
                });

                container.innerHTML = html;
            }

            /**
             * Load details for a specific family (with pagination)
             */
            function loadFamilyDetails(categoryName, familyName, loadMore = false) {
                console.log('Loading details for family:', familyName, 'in category:', categoryName, loadMore ? '(load more)' : '(initial)');

                if (!tableReferenceCache.recordTypes) return;

                // Get family pagination key
                const familyKey = \`\${categoryName}-\${familyName}\`;

                // Initialize family pagination if not exists
                if (!tableReferenceCache.familyPagination[familyKey]) {
                    tableReferenceCache.familyPagination[familyKey] = {
                        loaded: 0,
                        total: 0,
                        loading: false,
                        allRecords: []
                    };
                }

                const familyPagination = tableReferenceCache.familyPagination[familyKey];

                // Get all records for this category and family (only once)
                if (familyPagination.allRecords.length === 0) {
                    if (categoryName === 'system') {
                        familyPagination.allRecords = tableReferenceCache.recordTypes.filter(table =>
                            isSystemRecord(table) && getRecordFamily(table) === familyName
                        );
                    } else if (categoryName === 'custom') {
                        familyPagination.allRecords = tableReferenceCache.recordTypes.filter(table =>
                            isCustomRecord(table) && getRecordFamily(table) === familyName
                        );
                    }
                    familyPagination.total = familyPagination.allRecords.length;
                }

                const familyContainer = document.getElementById(\`family-\${categoryName}-\${familyName}\`);
                const familyHeader = familyContainer ? familyContainer.previousElementSibling : null;

                if (!familyContainer || !familyHeader) return;

                // Prevent multiple simultaneous loads
                if (familyPagination.loading) return;
                familyPagination.loading = true;

                // Calculate pagination
                const loadSize = loadMore ? TABLE_REFERENCE_CONFIG.SCROLL_LOAD_SIZE : TABLE_REFERENCE_CONFIG.INITIAL_LOAD_SIZE;
                const startIndex = familyPagination.loaded;
                const endIndex = Math.min(startIndex + loadSize, familyPagination.total);
                const recordsToLoad = familyPagination.allRecords.slice(startIndex, endIndex);

                if (recordsToLoad.length === 0) {
                    familyPagination.loading = false;
                    return;
                }

                // Show loading state
                if (!loadMore) {
                    familyContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary);">Loading records...</div>';
                    familyContainer.classList.remove('collapsed');
                    familyContainer.style.maxHeight = '50px';

                    // Update header to show loading
                    const icon = familyHeader.querySelector('.family-toggle-icon');
                    const loadText = familyHeader.querySelector('span:last-child');
                    if (icon) icon.textContent = '▼';
                    if (loadText) loadText.textContent = 'Loading...';
                } else {
                    // Update existing load more button
                    const loadMoreBtn = familyContainer.querySelector('.family-load-more-button');
                    if (loadMoreBtn) {
                        loadMoreBtn.innerHTML = '<button disabled style="background: var(--codeoss-button-bg); color: var(--codeoss-button-text); border: 1px solid var(--codeoss-border); padding: 6px 12px; border-radius: 3px; font-size: 11px;">Loading...</button>';
                    }
                }

                console.log('Loading', recordsToLoad.length, 'records for family', familyName, '(', startIndex, 'to', endIndex, 'of', familyPagination.total, ')');

                // Fetch overview data for this batch
                const recordIds = recordsToLoad.map(table => table.id);
                batchFetchOverviews(recordIds).then(() => {
                    // Re-filter with overview data (some records might change families)
                    let finalTables = recordsToLoad;
                    if (categoryName === 'system') {
                        finalTables = recordsToLoad.filter(table =>
                            isSystemRecord(table) && getRecordFamily(table) === familyName
                        );
                    } else if (categoryName === 'custom') {
                        finalTables = recordsToLoad.filter(table =>
                            isCustomRecord(table) && getRecordFamily(table) === familyName
                        );
                    }

                    // Update loaded count
                    familyPagination.loaded = endIndex;
                    familyPagination.loading = false;

                    // Render the family content
                    renderFamilyContent(familyContainer, finalTables, familyKey, loadMore);

                    // Update header (only on initial load)
                    if (!loadMore) {
                        const loadText = familyHeader.querySelector('span:last-child');
                        if (loadText) loadText.textContent = '';

                        // Make the family collapsible now
                        familyHeader.onclick = function() { toggleFamilyGroup(this); };
                    }

                    // Setup scroll listener for family container
                    setupFamilyScrollListener(familyContainer, familyKey);

                }).catch(error => {
                    console.error('Error loading family details:', error);
                    familyPagination.loading = false;

                    if (!loadMore) {
                        familyContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-error);">Error loading records</div>';
                        const loadText = familyHeader.querySelector('span:last-child');
                        if (loadText) loadText.textContent = 'Error - click to retry';
                    }
                });
            }

            /**
             * Render family content with pagination support
             */
            function renderFamilyContent(container, tables, familyKey, appendMode = false) {
                const familyPagination = tableReferenceCache.familyPagination[familyKey];

                // Generate HTML for tables
                let tablesHtml = '';
                tables.forEach(table => {
                    tablesHtml += \`
                        <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_ITEM}"
                             onclick="openTableReferenceTab('\${table.id}', '\${table.label}')"
                             title="Click to view \${table.label} details"
                             style="padding: 4px 16px; cursor: pointer; border-radius: 3px; font-size: 11px; line-height: 1.3;">
                            <div style="font-weight: 500; color: var(--codeoss-text-primary);">\${table.label}</div>
                            <div style="color: var(--codeoss-text-secondary); font-size: 10px;">\${table.id}</div>
                        </div>
                    \`;
                });

                if (appendMode) {
                    // Remove existing load more button
                    const existingLoadMore = container.querySelector('.family-load-more-button');
                    if (existingLoadMore) {
                        existingLoadMore.remove();
                    }

                    // Append new tables
                    container.insertAdjacentHTML('beforeend', tablesHtml);
                } else {
                    // Replace content
                    container.innerHTML = tablesHtml;
                }

                // Add load more button if needed
                if (familyPagination.loaded < familyPagination.total) {
                    const remaining = familyPagination.total - familyPagination.loaded;
                    const loadMoreHtml = \`
                        <div class="family-load-more-button" style="text-align: center; padding: 8px; margin-top: 8px; border-top: 1px solid var(--codeoss-border);">
                            <button onclick="loadFamilyDetails('\${familyKey.split('-')[0]}', '\${familyKey.split('-')[1]}', true)"
                                    style="background: var(--codeoss-button-bg); color: var(--codeoss-button-text);
                                           border: 1px solid var(--codeoss-border); padding: 6px 12px;
                                           border-radius: 3px; cursor: pointer; font-size: 11px;">
                                Load More (\${remaining} remaining)
                            </button>
                        </div>
                    \`;
                    container.insertAdjacentHTML('beforeend', loadMoreHtml);
                }

                // Update container height
                container.style.maxHeight = container.scrollHeight + 'px';
            }

            /**
             * Setup scroll listener for family container
             */
            function setupFamilyScrollListener(familyContainer, familyKey) {
                function handleFamilyScroll() {
                    const familyPagination = tableReferenceCache.familyPagination[familyKey];
                    if (familyPagination.loading || familyPagination.loaded >= familyPagination.total) return;

                    const scrollTop = familyContainer.scrollTop;
                    const scrollHeight = familyContainer.scrollHeight;
                    const clientHeight = familyContainer.clientHeight;

                    // Check if we're near the bottom
                    if (scrollHeight - scrollTop - clientHeight < TABLE_REFERENCE_CONFIG.SCROLL_THRESHOLD) {
                        console.log('Family scroll threshold reached, loading more for', familyKey);
                        const [categoryName, familyName] = familyKey.split('-');
                        loadFamilyDetails(categoryName, familyName, true);
                    }
                }

                // Remove existing listener to avoid duplicates
                familyContainer.removeEventListener('scroll', handleFamilyScroll);
                familyContainer.addEventListener('scroll', handleFamilyScroll);
            }

            /**
             * Populate a specific table category with data (with pagination)
             */
            function populateTableCategory(categoryName, loadMore = false) {
                if (!tableReferenceCache.recordTypes) return;

                const categoryElement = document.getElementById(categoryName + 'Content');
                if (!categoryElement) return;

                // Handle functions and procedures (no pagination needed)
                if (categoryName === 'functions' || categoryName === 'procedures') {
                    categoryElement.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary); font-style: italic;">Not yet implemented</div>';
                    return;
                }

                // Only system and custom categories support pagination
                if (categoryName !== 'system' && categoryName !== 'custom') return;

                // If count preview is enabled and this is the initial load, show family counts first
                if (TABLE_REFERENCE_CONFIG.ENABLE_COUNT_PREVIEW && !loadMore) {
                    console.log('Showing family count preview for', categoryName, 'category');
                    renderFamilyCountPreview(categoryElement, categoryName);
                    return;
                }

                // Get all filtered tables for this category
                let allFilteredTables = [];
                if (categoryName === 'system') {
                    allFilteredTables = tableReferenceCache.recordTypes.filter(table => isSystemRecord(table));
                } else if (categoryName === 'custom') {
                    allFilteredTables = tableReferenceCache.recordTypes.filter(table => isCustomRecord(table));
                }

                // Update pagination state
                const pagination = tableReferenceCache.pagination[categoryName];
                pagination.total = allFilteredTables.length;

                if (!loadMore) {
                    // Initial load
                    pagination.loaded = 0;
                    categoryElement.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary);">Loading...</div>';
                }

                // Calculate how many to load
                const loadSize = loadMore ? TABLE_REFERENCE_CONFIG.SCROLL_LOAD_SIZE : TABLE_REFERENCE_CONFIG.INITIAL_LOAD_SIZE;
                const startIndex = pagination.loaded;
                const endIndex = Math.min(startIndex + loadSize, pagination.total);
                const tablesToLoad = allFilteredTables.slice(startIndex, endIndex);

                if (tablesToLoad.length === 0) {
                    if (!loadMore) {
                        categoryElement.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary); font-style: italic;">No records found</div>';
                    }
                    return;
                }

                console.log('Loading', tablesToLoad.length, 'records for', categoryName, 'category (', startIndex, 'to', endIndex, 'of', pagination.total, ')');

                // Set loading state
                pagination.loading = true;

                // Fetch overview data for the batch
                const recordIds = tablesToLoad.map(table => table.id);
                batchFetchOverviews(recordIds).then(() => {
                    // Re-filter with overview data (some records might change categories)
                    let finalTables = tablesToLoad;
                    if (categoryName === 'system') {
                        finalTables = tablesToLoad.filter(table => isSystemRecord(table));
                    } else if (categoryName === 'custom') {
                        finalTables = tablesToLoad.filter(table => isCustomRecord(table));
                    }

                    // Update loaded count
                    pagination.loaded = endIndex;
                    pagination.loading = false;

                    // Render the tables
                    renderTableList(categoryElement, finalTables, categoryName, loadMore);

                    // Add scroll listener for lazy loading
                    if (!loadMore) {
                        setupScrollListener(categoryElement, categoryName);
                    }

                    // Add "Load More" button if there are more records
                    addLoadMoreButton(categoryElement, categoryName);

                }).catch(error => {
                    console.error('Error loading overview data:', error);
                    pagination.loading = false;

                    // Still render without overview data
                    pagination.loaded = endIndex;
                    renderTableList(categoryElement, tablesToLoad, categoryName, loadMore);

                    if (!loadMore) {
                        setupScrollListener(categoryElement, categoryName);
                    }
                    addLoadMoreButton(categoryElement, categoryName);
                });
            }

            /**
             * Setup scroll listener for lazy loading
             */
            function setupScrollListener(categoryElement, categoryName) {
                const scrollContainer = categoryElement.closest('.codeoss-sidebar-section-content');
                if (!scrollContainer) return;

                function handleScroll() {
                    const pagination = tableReferenceCache.pagination[categoryName];
                    if (pagination.loading || pagination.loaded >= pagination.total) return;

                    const scrollTop = scrollContainer.scrollTop;
                    const scrollHeight = scrollContainer.scrollHeight;
                    const clientHeight = scrollContainer.clientHeight;

                    // Check if we're near the bottom
                    if (scrollHeight - scrollTop - clientHeight < TABLE_REFERENCE_CONFIG.SCROLL_THRESHOLD) {
                        console.log('Scroll threshold reached, loading more', categoryName, 'records');
                        populateTableCategory(categoryName, true);
                    }
                }

                // Remove existing listener to avoid duplicates
                scrollContainer.removeEventListener('scroll', handleScroll);
                scrollContainer.addEventListener('scroll', handleScroll);
            }

            /**
             * Add or update the "Load More" button
             */
            function addLoadMoreButton(categoryElement, categoryName) {
                const pagination = tableReferenceCache.pagination[categoryName];

                // Remove existing load more button
                const existingButton = categoryElement.querySelector('.load-more-button');
                if (existingButton) {
                    existingButton.remove();
                }

                // Add new button if there are more records to load
                if (pagination.loaded < pagination.total) {
                    const remaining = pagination.total - pagination.loaded;
                    const buttonHtml = \`
                        <div class="load-more-button" style="text-align: center; padding: 8px; margin-top: 8px;">
                            <button onclick="populateTableCategory('\${categoryName}', true)"
                                    style="background: var(--codeoss-button-bg); color: var(--codeoss-button-text);
                                           border: 1px solid var(--codeoss-border); padding: 6px 12px;
                                           border-radius: 3px; cursor: pointer; font-size: 11px;"
                                    \${pagination.loading ? 'disabled' : ''}>
                                \${pagination.loading ? 'Loading...' : \`Load More (\${remaining} remaining)\`}
                            </button>
                        </div>
                    \`;
                    categoryElement.insertAdjacentHTML('beforeend', buttonHtml);
                }
            }

            /**
             * Render a list of tables in the specified container, grouped by Record Family
             */
            function renderTableList(container, tables, categoryName, appendMode = false) {
                if (!container) return;

                if (tables.length === 0) {
                    if (!appendMode) {
                        container.innerHTML = \`
                            <div class="table-explorer-empty" style="padding: 8px; color: var(--codeoss-text-secondary); font-style: italic; font-size: 11px;">
                                No \${categoryName} available
                            </div>
                        \`;
                    }
                    return;
                }

                // Group tables by Record Family
                const familyGroups = {};
                tables.forEach(table => {
                    const family = getRecordFamily(table);

                    if (!familyGroups[family]) {
                        familyGroups[family] = [];
                    }
                    familyGroups[family].push(table);
                });

                // Sort families alphabetically
                const sortedFamilies = Object.keys(familyGroups).sort();

                let html = '';

                // In append mode, we need to merge with existing family groups
                if (appendMode) {
                    // Get existing family headers and merge new tables
                    const existingFamilyHeaders = container.querySelectorAll('.table-family-header');
                    const existingFamilies = new Map();
                    existingFamilyHeaders.forEach(header => {
                        const familyName = header.textContent.split(' (')[0];
                        existingFamilies.set(familyName, header);
                    });

                    // Process each family
                    sortedFamilies.forEach(family => {
                        const familyTables = familyGroups[family];

                        if (existingFamilies.has(family)) {
                            // Append to existing family
                            const existingHeader = existingFamilies.get(family);
                            const familyContent = existingHeader.nextElementSibling;

                            if (familyContent && familyContent.classList.contains('table-family-content')) {
                                // Create HTML for new tables
                                let newTablesHtml = '';
                                familyTables.forEach(table => {
                                    newTablesHtml += \`
                                        <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_ITEM}"
                                             onclick="openTableReferenceTab('\${table.id}', '\${table.label}')"
                                             title="Click to view \${table.label} details"
                                             style="padding: 4px 16px; cursor: pointer; border-radius: 3px; font-size: 11px; line-height: 1.3;">
                                            <div style="font-weight: 500; color: var(--codeoss-text-primary);">\${table.label}</div>
                                            <div style="color: var(--codeoss-text-secondary); font-size: 10px;">\${table.id}</div>
                                        </div>
                                    \`;
                                });

                                // Append to existing family content
                                familyContent.insertAdjacentHTML('beforeend', newTablesHtml);

                                // Update family header count
                                const currentCount = familyContent.children.length;
                                existingHeader.innerHTML = \`
                                    <span class="family-toggle-icon">▶</span>
                                    \${family} (\${currentCount})
                                \`;
                            }
                        } else {
                            // Add new family with collapsible structure
                            html += \`
                                <div class="table-family-header" onclick="toggleFamilyGroup(this)"
                                     style="padding: 6px 8px; background: var(--codeoss-background-secondary); border-bottom: 1px solid var(--codeoss-border); font-weight: 600; font-size: 10px; color: var(--codeoss-text-primary); text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer;">
                                    <span class="family-toggle-icon">▶</span>
                                    \${family} (\${familyTables.length})
                                </div>
                                <div class="table-family-content collapsed" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
                            \`;

                            familyTables.forEach(table => {
                                html += \`
                                    <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_ITEM}"
                                         onclick="openTableReferenceTab('\${table.id}', '\${table.label}')"
                                         title="Click to view \${table.label} details"
                                         style="padding: 4px 16px; cursor: pointer; border-radius: 3px; font-size: 11px; line-height: 1.3;">
                                        <div style="font-weight: 500; color: var(--codeoss-text-primary);">\${table.label}</div>
                                        <div style="color: var(--codeoss-text-secondary); font-size: 10px;">\${table.id}</div>
                                    </div>
                                \`;
                            });

                            html += '</div>';
                        }
                    });

                    // Append new families
                    if (html) {
                        container.insertAdjacentHTML('beforeend', html);
                    }
                } else {
                    // Initial load - replace all content with collapsible families
                    sortedFamilies.forEach(family => {
                        const familyTables = familyGroups[family];

                        // Family header with toggle functionality
                        html += \`
                            <div class="table-family-header" onclick="toggleFamilyGroup(this)"
                                 style="padding: 6px 8px; background: var(--codeoss-background-secondary); border-bottom: 1px solid var(--codeoss-border); font-weight: 600; font-size: 10px; color: var(--codeoss-text-primary); text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer;">
                                <span class="family-toggle-icon">▶</span>
                                \${family} (\${familyTables.length})
                            </div>
                            <div class="table-family-content collapsed" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
                        \`;

                        // Family tables
                        familyTables.forEach(table => {
                            html += \`
                                <div class="${constants.CSS_CLASSES.TABLE_EXPLORER_ITEM}"
                                     onclick="openTableReferenceTab('\${table.id}', '\${table.label}')"
                                     title="Click to view \${table.label} details"
                                     style="padding: 4px 16px; cursor: pointer; border-radius: 3px; font-size: 11px; line-height: 1.3;">
                                    <div style="font-weight: 500; color: var(--codeoss-text-primary);">\${table.label}</div>
                                    <div style="color: var(--codeoss-text-secondary); font-size: 10px;">\${table.id}</div>
                                </div>
                            \`;
                        });

                        html += '</div>';
                    });

                    container.innerHTML = html;
                }
            }
            
            /**
             * Fetch record overview data for a specific record
             * This provides isCustom and baseType information
             */
            function fetchRecordOverview(recordId) {
                return new Promise((resolve, reject) => {
                    // Check cache first
                    if (tableReferenceCache.recordOverviews[recordId]) {
                        resolve(tableReferenceCache.recordOverviews[recordId]);
                        return;
                    }

                    const requestData = { scriptId: recordId };
                    const url = RECORDS_CATALOG_ENDPOINTS.GET_RECORD_TYPE_OVERVIEW + encodeURI(JSON.stringify(requestData));

                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);

                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            try {
                                const response = JSON.parse(xhr.response);
                                if (response.status === 'ok' && response.data) {
                                    tableReferenceCache.recordOverviews[recordId] = response.data;
                                    resolve(response.data);
                                } else {
                                    console.error('Invalid overview response for', recordId, ':', response);
                                    reject(new Error('Invalid overview response'));
                                }
                            } catch (error) {
                                console.error('Error parsing overview response for', recordId, ':', error);
                                reject(error);
                            }
                        } else {
                            console.error('Failed to fetch overview for', recordId, ':', xhr.status, xhr.statusText);
                            reject(new Error('Failed to fetch overview'));
                        }
                    };

                    xhr.onerror = function() {
                        console.error('Network error while fetching overview for', recordId);
                        reject(new Error('Network error'));
                    };

                    xhr.send();
                });
            }

            /**
             * Test function to explore different API endpoints and parameters
             */
            function testRecordCatalogAPI(recordId) {
                console.log('Testing Records Catalog API for record:', recordId);

                // Test different API endpoints and parameters based on Tim Dietrich's documentation
                const testEndpoints = [
                    {
                        name: 'Documented API (SS_ANAL)',
                        url: RECORDS_CATALOG_ENDPOINTS.GET_RECORD_TYPE_DETAIL + encodeURI(JSON.stringify({
                            scriptId: recordId,
                            detailType: 'SS_ANAL'
                        }))
                    },
                    {
                        name: 'Alternative Detail Type',
                        url: RECORDS_CATALOG_ENDPOINTS.GET_RECORD_TYPE_DETAIL + encodeURI(JSON.stringify({
                            scriptId: recordId,
                            detailType: 'FULL'
                        }))
                    },
                    {
                        name: 'Legacy Parameter Format',
                        url: RECORDS_CATALOG_ENDPOINTS.GET_RECORD_TYPE_DETAIL + encodeURI(JSON.stringify({
                            recordType: recordId
                        }))
                    }
                ];

                testEndpoints.forEach(endpoint => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', endpoint.url, true);
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            try {
                                const response = JSON.parse(xhr.response);
                                console.log(endpoint.name + ' response for ' + recordId + ':', response);
                            } catch (error) {
                                console.error(endpoint.name + ' parse error:', error);
                            }
                        } else {
                            console.log(endpoint.name + ' failed:', xhr.status, xhr.statusText);
                        }
                    };
                    xhr.send();
                });
            }

            /**
             * Fetch detailed information for a specific table
             */
            function fetchTableDetail(tableId) {
                return new Promise((resolve, reject) => {
                    // Check cache first
                    if (tableReferenceCache.tableDetails[tableId]) {
                        resolve(tableReferenceCache.tableDetails[tableId]);
                        return;
                    }
                    
                    const requestData = { 
                        scriptId: tableId, 
                        detailType: 'SS_ANAL' 
                    };
                    const url = RECORDS_CATALOG_ENDPOINTS.GET_RECORD_TYPE_DETAIL + encodeURI(JSON.stringify(requestData));
                    
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            try {
                                const response = JSON.parse(xhr.response);
                                const tableDetail = response.data;
                                
                                // Cache the result
                                tableReferenceCache.tableDetails[tableId] = tableDetail;
                                
                                resolve(tableDetail);
                            } catch (error) {
                                console.error('Error parsing table detail response:', error);
                                reject(error);
                            }
                        } else {
                            console.error('Failed to fetch table detail:', xhr.status, xhr.statusText);
                            reject(new Error('Failed to fetch table detail'));
                        }
                    };
                    
                    xhr.onerror = function() {
                        console.error('Network error while fetching table detail');
                        reject(new Error('Network error'));
                    };
                    
                    xhr.send();
                });
            }
            
            /**
             * Get preview data for a table (limited records)
             */
            function fetchTablePreview(tableId, limit = 20) {
                return new Promise((resolve, reject) => {
                    // This would execute a simple SELECT query to get preview data
                    const previewQuery = \`SELECT * FROM \${tableId} LIMIT \${limit}\`;
                    
                    // Use the existing query execution functionality
                    if (window.executeQueryDirect) {
                        // We'll need to modify this to return a promise instead of updating UI
                        // For now, we'll implement a basic version
                        resolve({ message: 'Preview functionality will be implemented with query execution integration' });
                    } else {
                        reject(new Error('Query execution not available'));
                    }
                });
            }
            
            /**
             * Toggle family group expansion/collapse
             */
            function toggleFamilyGroup(headerElement) {
                const content = headerElement.nextElementSibling;
                const icon = headerElement.querySelector('.family-toggle-icon');

                if (content && content.classList.contains('table-family-content')) {
                    const isCollapsed = content.classList.contains('collapsed');

                    if (isCollapsed) {
                        // Expand
                        content.classList.remove('collapsed');
                        content.style.maxHeight = content.scrollHeight + 'px';
                        icon.textContent = '▼';
                    } else {
                        // Collapse
                        content.classList.add('collapsed');
                        content.style.maxHeight = '0';
                        icon.textContent = '▶';
                    }
                }
            }

            /**
             * Pre-analyze family counts for both system and custom categories
             * This runs in the background when Table Explorer is first opened
             */
            function preAnalyzeFamilyCounts() {
                console.log('Pre-analyzing family counts for faster category expansion');

                // Pre-analyze system families
                generateFamilyCounts('system').then(systemCounts => {
                    console.log('System family counts pre-analyzed:', systemCounts);
                    tableReferenceCache.preAnalyzedCounts = tableReferenceCache.preAnalyzedCounts || {};
                    tableReferenceCache.preAnalyzedCounts.system = systemCounts;
                }).catch(error => {
                    console.warn('Failed to pre-analyze system family counts:', error);
                });

                // Pre-analyze custom families
                generateFamilyCounts('custom').then(customCounts => {
                    console.log('Custom family counts pre-analyzed:', customCounts);
                    tableReferenceCache.preAnalyzedCounts = tableReferenceCache.preAnalyzedCounts || {};
                    tableReferenceCache.preAnalyzedCounts.custom = customCounts;
                }).catch(error => {
                    console.warn('Failed to pre-analyze custom family counts:', error);
                });
            }

            // Make functions available globally for the Table Explorer
            window.loadTableExplorerData = loadTableExplorerData;
            window.populateTableCategory = populateTableCategory;
            window.loadFamilyDetails = loadFamilyDetails;
            window.toggleFamilyGroup = toggleFamilyGroup;
            window.searchAllRecords = searchAllRecords;
            window.renderSearchResults = renderSearchResults;
            window.preAnalyzeFamilyCounts = preAnalyzeFamilyCounts;
            window.fetchTableDetail = fetchTableDetail;
            window.fetchTablePreview = fetchTablePreview;
            window.testRecordCatalogAPI = testRecordCatalogAPI;
        `;
    }
    
    /**
     * Export the table reference data functions
     */
    return {
        getTableReferenceDataJS: getTableReferenceDataJS
    };
    
});
