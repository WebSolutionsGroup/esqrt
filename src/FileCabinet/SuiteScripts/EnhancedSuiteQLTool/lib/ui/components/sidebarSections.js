/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Sidebar Sections
 * 
 * This module handles the expandable/collapsible sidebar sections
 * functionality including Query History and Saved Queries.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the sidebar section toggle JavaScript
     * 
     * @returns {string} JavaScript code for sidebar section toggle functionality
     */
    function getSidebarSectionToggleJS() {
        return `
            // Track section states (only one expanded at a time - accordion behavior)
            var sidebarSectionStates = {
                queryHistory: false,
                savedQueries: true,  // Default to saved queries expanded
                tableExplorer: false
            };

            function toggleSidebarSection(sectionName) {
                const content = document.getElementById(sectionName + 'Content');
                const icon = document.getElementById(sectionName + 'Icon');
                const section = content ? content.closest('.codeoss-sidebar-section') : null;

                if (!content || !icon || !section) return;

                const isExpanded = sidebarSectionStates[sectionName];

                if (isExpanded) {
                    // Collapse the currently expanded section
                    content.classList.add('collapsed');
                    icon.classList.add('collapsed');
                    icon.textContent = '▶';
                    section.classList.remove('expanded');
                    sidebarSectionStates[sectionName] = false;
                } else {
                    // First, collapse all other sections (accordion behavior)
                    Object.keys(sidebarSectionStates).forEach(otherSectionName => {
                        if (otherSectionName !== sectionName && sidebarSectionStates[otherSectionName]) {
                            const otherContent = document.getElementById(otherSectionName + 'Content');
                            const otherIcon = document.getElementById(otherSectionName + 'Icon');
                            const otherSection = otherContent ? otherContent.closest('.codeoss-sidebar-section') : null;

                            if (otherContent && otherIcon && otherSection) {
                                otherContent.classList.add('collapsed');
                                otherIcon.classList.add('collapsed');
                                otherIcon.textContent = '▶';
                                otherSection.classList.remove('expanded');
                                sidebarSectionStates[otherSectionName] = false;
                            }
                        }
                    });

                    // Then expand the clicked section
                    content.classList.remove('collapsed');
                    icon.classList.remove('collapsed');
                    icon.textContent = '▼';
                    section.classList.add('expanded');
                    sidebarSectionStates[sectionName] = true;

                    // Special handling for Table Explorer - load data when first expanded
                    if (sectionName === 'tableExplorer') {
                        // Initialize table explorer data loading and analyze families
                        setTimeout(() => {
                            if (window.loadTableExplorerData) {
                                // Load basic record types first
                                window.loadTableExplorerData('system').then(() => {
                                    // Pre-analyze family counts for both system and custom
                                    console.log('Pre-analyzing family counts for faster category expansion');
                                    if (window.preAnalyzeFamilyCounts) {
                                        window.preAnalyzeFamilyCounts();
                                    }
                                });
                            }
                        }, 100);
                    }
                }

                // Save state to localStorage
                try {
                    localStorage.setItem('suiteql-sidebar-states', JSON.stringify(sidebarSectionStates));
                } catch(e) {
                    console.warn('Could not save sidebar states to localStorage:', e);
                }
            }
        `;
    }
    
    /**
     * Generate the initialize sidebar sections JavaScript
     * 
     * @returns {string} JavaScript code for initializing sidebar sections
     */
    function getInitializeSidebarSectionsJS() {
        return `
            function initializeSidebarSections() {
                // Load saved states from localStorage
                try {
                    const saved = localStorage.getItem('suiteql-sidebar-states');
                    if (saved) {
                        const savedStates = JSON.parse(saved);
                        Object.assign(sidebarSectionStates, savedStates);
                    }
                } catch(e) {
                    // Silently handle localStorage errors
                }
                
                // Apply saved states to UI
                Object.keys(sidebarSectionStates).forEach(sectionName => {
                    const content = document.getElementById(sectionName + 'Content');
                    const icon = document.getElementById(sectionName + 'Icon');
                    const section = content ? content.closest('.codeoss-sidebar-section') : null;

                    if (!content || !icon || !section) return;

                    const isExpanded = sidebarSectionStates[sectionName];

                    if (!isExpanded) {
                        content.classList.add('collapsed');
                        icon.classList.add('collapsed');
                        icon.textContent = '▶';
                        section.classList.remove('expanded');
                    } else {
                        content.classList.remove('collapsed');
                        icon.classList.remove('collapsed');
                        icon.textContent = '▼';
                        section.classList.add('expanded');
                    }
                });
            }
        `;
    }
    
    /**
     * Generate the sidebar section utilities JavaScript
     * 
     * @returns {string} JavaScript code for sidebar section utilities
     */
    function getSidebarSectionUtilitiesJS() {
        return `
            function expandAllSidebarSections() {
                Object.keys(sidebarSectionStates).forEach(sectionName => {
                    if (!sidebarSectionStates[sectionName]) {
                        toggleSidebarSection(sectionName);
                    }
                });
            }
            
            function collapseAllSidebarSections() {
                Object.keys(sidebarSectionStates).forEach(sectionName => {
                    if (sidebarSectionStates[sectionName]) {
                        toggleSidebarSection(sectionName);
                    }
                });
            }
            
            function getSidebarSectionState(sectionName) {
                return sidebarSectionStates[sectionName] || false;
            }
        `;
    }

    /**
     * Generate the Table Explorer specific JavaScript functions
     *
     * @returns {string} JavaScript code for Table Explorer functionality
     */
    function getTableExplorerJS() {
        return `
            // Table Explorer category states
            var tableExplorerCategoryStates = {
                functions: false,
                procedures: false,
                system: false,  // Start collapsed
                custom: false
            };

            function toggleTableCategory(categoryName) {
                const content = document.getElementById(categoryName + 'Content');
                const icon = document.getElementById(categoryName + 'Icon');

                if (!content || !icon) return;

                const isExpanded = tableExplorerCategoryStates[categoryName];

                if (isExpanded) {
                    // Collapse category
                    content.classList.add('collapsed');
                    icon.textContent = '▶';
                    tableExplorerCategoryStates[categoryName] = false;
                } else {
                    // Expand category
                    content.classList.remove('collapsed');
                    icon.textContent = '▼';
                    tableExplorerCategoryStates[categoryName] = true;

                    // Load data if not already loaded
                    loadTableCategoryData(categoryName);
                }
            }

            function loadTableCategoryData(categoryName) {
                // This will be implemented in the table reference data module
                if (window.loadTableExplorerData) {
                    window.loadTableExplorerData(categoryName);
                }
            }

            function filterTableExplorer() {
                const searchInput = document.getElementById('tableExplorerSearch');
                const searchTerm = searchInput ? searchInput.value.trim() : '';

                if (!searchTerm) {
                    // Clear search results and show normal categories
                    const searchResults = document.getElementById('searchResultsContent');
                    if (searchResults) {
                        searchResults.style.display = 'none';
                    }

                    // Show normal categories
                    const categories = ['functions', 'procedures', 'system', 'custom'];
                    categories.forEach(categoryName => {
                        const categoryElement = document.querySelector(\`[onclick="toggleTableCategory('\${categoryName}')"]\`);
                        if (categoryElement) {
                            categoryElement.closest('.table-explorer-category').style.display = '';
                        }
                    });
                    return;
                }

                // Hide normal categories during search
                const categories = ['functions', 'procedures', 'system', 'custom'];
                categories.forEach(categoryName => {
                    const categoryElement = document.querySelector(\`[onclick="toggleTableCategory('\${categoryName}')"]\`);
                    if (categoryElement) {
                        categoryElement.closest('.table-explorer-category').style.display = 'none';
                    }
                });

                // Show search results
                let searchResults = document.getElementById('searchResultsContent');
                if (!searchResults) {
                    // Create search results container
                    const tableExplorerContent = document.getElementById('tableExplorerContent');
                    const searchHtml = \`
                        <div id="searchResultsContent" style="display: none;">
                            <div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary);">
                                Searching...
                            </div>
                        </div>
                    \`;
                    tableExplorerContent.insertAdjacentHTML('afterbegin', searchHtml);
                    searchResults = document.getElementById('searchResultsContent');
                }

                searchResults.style.display = '';
                searchResults.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--codeoss-text-secondary);">Searching...</div>';

                // Perform search
                if (window.searchAllRecords && window.renderSearchResults) {
                    const results = window.searchAllRecords(searchTerm);
                    window.renderSearchResults(searchResults, results, searchTerm);
                }
            }

            function openTableReference(tableId, tableName) {
                // This will open a new tab with table reference information
                if (window.openTableReferenceTab) {
                    window.openTableReferenceTab(tableId, tableName);
                }
            }
        `;
    }

    /**
     * Get all sidebar sections JavaScript functions
     *
     * @returns {string} Complete JavaScript code for sidebar sections functionality
     */
    function getAllSidebarSectionsJS() {
        return getSidebarSectionToggleJS() + '\n' +
               getInitializeSidebarSectionsJS() + '\n' +
               getSidebarSectionUtilitiesJS() + '\n' +
               getTableExplorerJS();
    }
    
    /**
     * Export the sidebar sections functions
     */
    return {
        getSidebarSectionToggleJS: getSidebarSectionToggleJS,
        getInitializeSidebarSectionsJS: getInitializeSidebarSectionsJS,
        getSidebarSectionUtilitiesJS: getSidebarSectionUtilitiesJS,
        getTableExplorerJS: getTableExplorerJS,
        getAllSidebarSectionsJS: getAllSidebarSectionsJS
    };
    
});
