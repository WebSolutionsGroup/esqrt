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
                savedQueries: true  // Default to saved queries expanded
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
                    console.warn('Could not load sidebar states from localStorage:', e);
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
     * Get all sidebar sections JavaScript functions
     * 
     * @returns {string} Complete JavaScript code for sidebar sections functionality
     */
    function getAllSidebarSectionsJS() {
        return getSidebarSectionToggleJS() + '\n' +
               getInitializeSidebarSectionsJS() + '\n' +
               getSidebarSectionUtilitiesJS();
    }
    
    /**
     * Export the sidebar sections functions
     */
    return {
        getSidebarSectionToggleJS: getSidebarSectionToggleJS,
        getInitializeSidebarSectionsJS: getInitializeSidebarSectionsJS,
        getSidebarSectionUtilitiesJS: getSidebarSectionUtilitiesJS,
        getAllSidebarSectionsJS: getAllSidebarSectionsJS
    };
    
});
