/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Table Renderer
 * 
 * This module handles table rendering functionality including
 * generating HTML tables from query results with sorting,
 * filtering, and interactive features.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the table response generation JavaScript
     * 
     * @returns {string} JavaScript code for table response generation
     */
    function getResponseGenerateTableJS() {
        return `
            function responseGenerateTable() {

                // Show null format div (like original)
                const nullFormatDiv = document.getElementById('nullFormatDiv');
                if (nullFormatDiv) {
                    nullFormatDiv.style.display = 'block';
                }

                if (!queryResponsePayload || !queryResponsePayload.records || queryResponsePayload.records.length === 0) {
                    document.getElementById('` + constants.ELEMENT_IDS.RESULTS_DIV + `').innerHTML = '<h5 class="text-warning">No Records Were Found</h5>';
                    return;
                }

                const records = queryResponsePayload.records;
                const hideRowNumbers = document.getElementById('` + constants.ELEMENT_IDS.HIDE_ROW_NUMBERS + `') && document.getElementById('` + constants.ELEMENT_IDS.HIDE_ROW_NUMBERS + `').checked;
                const enablePagination = document.getElementById('` + constants.ELEMENT_IDS.ENABLE_PAGINATION + `') && document.getElementById('` + constants.ELEMENT_IDS.ENABLE_PAGINATION + `').checked;

                const headers = Object.keys(records[0]);
                let firstColumnIsRowNumber = false;
                let rowNumbersHidden = false;

                if (enablePagination) {
                    firstColumnIsRowNumber = true;
                    if (hideRowNumbers) {
                        rowNumbersHidden = true;
                    }
                }

                // Generate table header with sortable columns
                let thead = '<thead class="thead-light"><tr>';
                let cellIndex = 0; // Track the actual cell index in the table body
                for (let i = 0; i < headers.length; i++) {
                    if ((i === 0) && firstColumnIsRowNumber && !rowNumbersHidden) {
                        thead += '<th style="text-align: center;">&nbsp;#&nbsp;</th>';
                        cellIndex++; // Row number takes up cell index 0
                    } else if ((i === 0) && firstColumnIsRowNumber && rowNumbersHidden) {
                        continue; // Skip this column entirely, no cell index increment
                    } else {
                        // For sortable columns, use the current cell index that matches table body
                        const sortColumnIndex = cellIndex;
                        // console.log('Creating header for', headers[i], 'with sort index', sortColumnIndex, 'at cell index', cellIndex);
                        thead += '<th class="sortable-header" onclick="window.sortTable(' + sortColumnIndex + ')" style="cursor: pointer; user-select: none;" title="Click to sort">';
                        thead += headers[i] + ' <span class="sort-indicator" id="sort-indicator-' + sortColumnIndex + '">⇅</span>';
                        thead += '</th>';
                        cellIndex++; // Increment for each data column
                    }
                }
                thead += '</tr></thead>';

                // Generate table body (exactly like original)
                let tbody = '<tbody>';
                for (let r = 0; r < records.length; r++) {
                    tbody += '<tr>';
                    for (let i = 0; i < headers.length; i++) {
                        let value = records[r][headers[i]];
                        if (value === null) {
                            // Handle null values like original
                            value = 'null';
                        }
                        if ((i === 0) && firstColumnIsRowNumber && !rowNumbersHidden) {
                            tbody += '<td style="text-align: center;">' + value + '</td>';
                        } else if ((i === 0) && firstColumnIsRowNumber && rowNumbersHidden) {
                            continue;
                        } else {
                            tbody += '<td>' + value + '</td>';
                        }
                    }
                    tbody += '</tr>';
                }
                tbody += '</tbody>';

                // Update the header with results info
                updateQueryResultsHeader(records.length, queryResponsePayload.totalRecordCount, queryResponsePayload.elapsedTime);

                // Create single table with sticky header
                let content = '<div class="codeoss-table-wrapper" style="height: calc(100% - 5px);">';
                content += '<table class="` + constants.CSS_CLASSES.CODEOSS_TABLE + `" id="resultsTable">';
                content += thead;
                content += tbody;
                content += '</table>';
                content += '</div>';

                // Add hidden textarea for copying (like original)
                content += '<textarea id="responseData" style="position: absolute; left: -9999px; opacity: 0;"></textarea>';

                console.log('DEBUG: Setting table HTML with single table structure');
                console.log('DEBUG: Table class:', '` + constants.CSS_CLASSES.CODEOSS_TABLE + `');
                document.getElementById('` + constants.ELEMENT_IDS.RESULTS_DIV + `').innerHTML = content;

                // Verify the table structure was applied
                setTimeout(() => {
                    const table = document.getElementById('resultsTable');
                    const headers = table ? table.querySelectorAll('th') : [];
                    console.log('DEBUG: Table found:', !!table);
                    console.log('DEBUG: Headers found:', headers.length);
                    console.log('DEBUG: First header position style:', headers[0] ? getComputedStyle(headers[0]).position : 'none');
                }, 100);
                document.getElementById('` + constants.ELEMENT_IDS.WELCOME_MESSAGE + `').style.display = 'none';
                document.getElementById('` + constants.ELEMENT_IDS.STATUS_TEXT + `').textContent = 'Query completed - ' + records.length + ' rows';

                // No synchronization needed with single table approach

                // Define sorting functions directly after table creation
                window.currentSortColumn = -1;
                window.currentSortDirection = 'asc';
                window.originalTableData = null;

                window.sortTable = function(columnIndex) {
                    const table = document.getElementById('resultsTable');
                    if (!table) return;

                    const tbody = table.querySelector('tbody');
                    if (!tbody) return;

                    // Store original data if not already stored
                    if (!window.originalTableData) {
                        window.originalTableData = Array.from(tbody.rows).map(row =>
                            Array.from(row.cells).map(cell => cell.innerHTML)
                        );
                    }

                    // Determine sort direction
                    if (window.currentSortColumn === columnIndex) {
                        window.currentSortDirection = window.currentSortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        window.currentSortDirection = 'asc';
                        window.currentSortColumn = columnIndex;
                    }

                    // Get all rows as array
                    const rows = Array.from(tbody.rows);

                    // Sort rows
                    // console.log('About to start sorting...');
                    try {
                        // console.log('Starting sort operation');
                        rows.sort((a, b) => {
                            if (!a.cells[columnIndex] || !b.cells[columnIndex]) {
                                console.error('Column index', columnIndex, 'not found. Row has', a.cells.length, 'cells');
                                return 0;
                            }
                            let aVal = a.cells[columnIndex].textContent.trim();
                            let bVal = b.cells[columnIndex].textContent.trim();
                            // console.log('Sorting comparison:', aVal, 'vs', bVal);

                        // Log first comparison only to avoid spam
                        if (a === rows[0] && b === rows[1]) {
                            console.log('Sample comparison for column', columnIndex + ':', aVal, 'vs', bVal);
                        }

                        // Handle null values
                        if (aVal === 'null') aVal = '';
                        if (bVal === 'null') bVal = '';

                        let comparison = 0;

                        // Try to parse as dates first (common formats: MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD, etc.)
                        const dateRegex = /^(\\d{1,2}\\/\\d{1,2}\\/\\d{4}|\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}-\\d{1,2}-\\d{4})$/;
                        if (dateRegex.test(aVal) && dateRegex.test(bVal)) {
                            const aDate = new Date(aVal);
                            const bDate = new Date(bVal);
                            if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                                comparison = aDate.getTime() - bDate.getTime();
                            } else {
                                // Fallback to string comparison if date parsing fails
                                comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
                            }
                        }
                        // Try numeric comparison
                        else {
                            const aNum = parseFloat(aVal);
                            const bNum = parseFloat(bVal);

                            if (!isNaN(aNum) && !isNaN(bNum)) {
                                comparison = aNum - bNum;
                            } else {
                                comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
                            }
                        }

                        return window.currentSortDirection === 'asc' ? comparison : -comparison;
                        });
                    } catch (error) {
                        console.error('Error during sorting:', error);
                        return;
                    }

                    // Clear tbody and append sorted rows
                    tbody.innerHTML = '';
                    rows.forEach(row => tbody.appendChild(row));

                    // Update indicators
                    const indicators = document.querySelectorAll('.sort-indicator');
                    indicators.forEach(indicator => {
                        indicator.textContent = '⇅';
                        indicator.style.opacity = '0.5';
                    });

                    const activeIndicator = document.getElementById('sort-indicator-' + columnIndex);
                    if (activeIndicator) {
                        activeIndicator.textContent = window.currentSortDirection === 'asc' ? '↑' : '↓';
                        activeIndicator.style.opacity = '1';
                    }

                    // console.log('Sort completed');
                };

                // Show copy button, hide CSV export buttons
                document.getElementById('` + constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN + `').style.display = 'inline-block';
                document.getElementById('downloadCSVBtn').style.display = 'none';
                document.getElementById('copyCSVBtn').style.display = 'none';

                // Do NOT initialize DataTables by default (keep it simple like original)

                // Reset sorting state for new table
                currentSortColumn = -1;
                currentSortDirection = 'asc';
                originalTableData = null;
            }
        `;
    }

    /**
     * Generate the table sorting JavaScript
     *
     * @returns {string} JavaScript code for table sorting functionality
     */
    function getTableSortingJS() {
        return `
            // Global variables for sorting state
            let currentSortColumn = -1;
            let currentSortDirection = 'asc';
            let originalTableData = null;

            function sortTable(columnIndex) {
                // console.log('sortTable called with columnIndex:', columnIndex);
                const table = document.getElementById('resultsTable');
                if (!table) {
                    console.error('Table with id "resultsTable" not found');
                    return;
                }

                const tbody = table.querySelector('tbody');
                if (!tbody) {
                    console.error('Table tbody not found');
                    return;
                }

                // Store original data if not already stored
                if (!originalTableData) {
                    originalTableData = Array.from(tbody.rows).map(row =>
                        Array.from(row.cells).map(cell => cell.innerHTML)
                    );
                }

                // Determine sort direction
                if (currentSortColumn === columnIndex) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortDirection = 'asc';
                    currentSortColumn = columnIndex;
                }

                // Get all rows as array
                const rows = Array.from(tbody.rows);
                // console.log('Number of rows to sort:', rows.length);
                // console.log('Sorting column index:', columnIndex, 'Direction:', currentSortDirection);

                // Sort rows based on column content
                rows.sort((a, b) => {
                    if (!a.cells[columnIndex] || !b.cells[columnIndex]) {
                        console.error('Column index', columnIndex, 'not found in row');
                        return 0;
                    }
                    let aVal = a.cells[columnIndex].textContent.trim();
                    let bVal = b.cells[columnIndex].textContent.trim();

                    // Handle null values
                    if (aVal === 'null') aVal = '';
                    if (bVal === 'null') bVal = '';

                    let comparison = 0;

                    // Try to parse as dates first (common formats: MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD, etc.)
                    const dateRegex = /^(\\d{1,2}\\/\\d{1,2}\\/\\d{4}|\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}-\\d{1,2}-\\d{4})$/;
                    if (dateRegex.test(aVal) && dateRegex.test(bVal)) {
                        const aDate = new Date(aVal);
                        const bDate = new Date(bVal);
                        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                            comparison = aDate.getTime() - bDate.getTime();
                        } else {
                            // Fallback to string comparison if date parsing fails
                            comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
                        }
                    }
                    // Try to parse as numbers for numeric sorting
                    else {
                        const aNum = parseFloat(aVal);
                        const bNum = parseFloat(bVal);

                        if (!isNaN(aNum) && !isNaN(bNum)) {
                            // Numeric comparison
                            comparison = aNum - bNum;
                        } else {
                            // String comparison (case insensitive)
                            comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
                        }
                    }

                    return currentSortDirection === 'asc' ? comparison : -comparison;
                });

                // Clear tbody and append sorted rows
                tbody.innerHTML = '';
                rows.forEach(row => tbody.appendChild(row));

                // Update sort indicators
                updateSortIndicators(columnIndex, currentSortDirection);
            }

            function updateSortIndicators(sortedColumn, direction) {
                // Reset all indicators
                const indicators = document.querySelectorAll('.sort-indicator');
                indicators.forEach(indicator => {
                    indicator.textContent = '⇅';
                    indicator.style.opacity = '0.5';
                });

                // Update the active indicator
                const activeIndicator = document.getElementById('sort-indicator-' + sortedColumn);
                if (activeIndicator) {
                    activeIndicator.textContent = direction === 'asc' ? '↑' : '↓';
                    activeIndicator.style.opacity = '1';
                }
            }

            function resetTableSort() {
                if (!originalTableData) return;

                const table = document.getElementById('resultsTable');
                if (!table) return;

                const tbody = table.querySelector('tbody');
                if (!tbody) return;

                // Restore original order
                tbody.innerHTML = '';
                originalTableData.forEach(rowData => {
                    const row = tbody.insertRow();
                    rowData.forEach(cellData => {
                        const cell = row.insertCell();
                        cell.innerHTML = cellData;
                    });
                });

                // Reset sort state
                currentSortColumn = -1;
                currentSortDirection = 'asc';

                // Reset indicators
                updateSortIndicators(-1, 'asc');
            }

            // Make sorting functions globally available
            window.sortTable = sortTable;
            window.resetTableSort = resetTableSort;
        `;
    }



    /**
     * Generate the DataTables initialization JavaScript
     * 
     * @returns {string} JavaScript code for DataTables initialization
     */
    function getDataTablesInitJS() {
        return `
            function initializeDataTable() {
                try {
                    if ($.fn.DataTable.isDataTable('#resultsTable')) {
                        $('#resultsTable').DataTable().destroy();
                    }
                    
                    $('#resultsTable').DataTable({
                        pageLength: ` + constants.CONFIG.ROWS_RETURNED_DEFAULT + `,
                        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                        scrollX: true,
                        scrollY: 'calc(100vh - 305px)', // Dynamic height with 5px bottom spacing
                        scrollCollapse: true,
                        responsive: true,
                        order: [],
                        columnDefs: [
                            { orderable: false, targets: 0 } // Disable sorting on row number column
                        ],
                        language: {
                            search: "Filter records:",
                            lengthMenu: "Show _MENU_ records per page",
                            info: "Showing _START_ to _END_ of _TOTAL_ records",
                            infoEmpty: "No records available",
                            infoFiltered: "(filtered from _MAX_ total records)",
                            paginate: {
                                first: "First",
                                last: "Last",
                                next: "Next",
                                previous: "Previous"
                            }
                        },
                        dom: '<"top"lf>rt<"bottom"ip><"clear">'
                    });
                } catch (e) {
                    // Silently handle DataTables initialization errors
                }
            }
        `;
    }
    
    /**
     * Generate the table export functions JavaScript
     * 
     * @returns {string} JavaScript code for table export functions
     */
    function getTableExportJS() {
        return `
            function exportTableAsCSV() {
                if (!queryResponsePayload || !queryResponsePayload.records) {
                    alert('No table data to export.');
                    return;
                }
                
                // Switch to CSV view and trigger download
                responseGenerateCSV();
                setTimeout(() => {
                    downloadCSV();
                }, 100);
            }
            
            function exportTableAsJSON() {
                if (!queryResponsePayload || !queryResponsePayload.records) {
                    alert('No table data to export.');
                    return;
                }
                
                // Switch to JSON view and trigger download
                responseGenerateJSON();
                setTimeout(() => {
                    downloadJSON();
                }, 100);
            }
            
            function copyTableToClipboard() {
                const table = document.getElementById('resultsTable');
                if (!table) {
                    alert('No table to copy.');
                    return;
                }
                
                let tableText = '';
                const rows = table.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const cells = row.querySelectorAll('th, td');
                    const rowData = Array.from(cells).map(cell => {
                        return cell.textContent.trim();
                    });
                    tableText += rowData.join('\\t') + '\\n';
                });
                
                // Copy to clipboard
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(tableText).then(() => {
                        alert('Table data copied to clipboard (tab-separated)');
                    }).catch(() => {
                        alert('Failed to copy table data to clipboard');
                    });
                } else {
                    // Fallback
                    const textArea = document.createElement('textarea');
                    textArea.value = tableText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        alert('Table data copied to clipboard (tab-separated)');
                    } catch (err) {
                        alert('Failed to copy table data to clipboard');
                    }
                    document.body.removeChild(textArea);
                }
            }
        `;
    }
    
    /**
     * Generate the table filtering JavaScript
     * 
     * @returns {string} JavaScript code for table filtering
     */
    function getTableFilteringJS() {
        return `
            function filterTable(searchTerm) {
                const table = document.getElementById('resultsTable');
                if (!table) return;
                
                const tbody = table.querySelector('tbody');
                const rows = tbody.querySelectorAll('tr');
                
                searchTerm = searchTerm.toLowerCase();
                
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    let found = false;
                    
                    cells.forEach(cell => {
                        if (cell.textContent.toLowerCase().includes(searchTerm)) {
                            found = true;
                        }
                    });
                    
                    row.style.display = found ? '' : 'none';
                });
                
                // Update visible count
                const visibleRows = tbody.querySelectorAll('tr:not([style*="display: none"])');
                const statusElement = document.querySelector('.table-status');
                if (statusElement) {
                    statusElement.textContent = \`Showing \${visibleRows.length} of \${rows.length} records\`;
                }
            }
            
            function clearTableFilter() {
                const table = document.getElementById('resultsTable');
                if (!table) return;
                
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    row.style.display = '';
                });
                
                // Clear search input if exists
                const searchInput = document.querySelector('.table-search');
                if (searchInput) {
                    searchInput.value = '';
                }
            }
        `;
    }
    
    /**
     * Get all table rendering JavaScript functions
     *
     * @returns {string} Complete JavaScript code for table rendering functionality
     */
    function getAllTableRenderingJS() {
        return getResponseGenerateTableJS() + '\n' +
               getTableSortingJS() + '\n' +
               getDataTablesInitJS() + '\n' +
               getTableExportJS() + '\n' +
               getTableFilteringJS() + '\n' +
               getColumnSyncJS();
    }

    /**
     * Generate simplified table JavaScript (no synchronization needed)
     *
     * @returns {string} JavaScript code for single table approach
     */
    function getColumnSyncJS() {
        return `
            // Single table approach - no synchronization needed
            // Sticky headers handle alignment automatically
        `;
    }

    /**
     * Export the table rendering functions
     */
    return {
        getResponseGenerateTableJS: getResponseGenerateTableJS,
        getTableSortingJS: getTableSortingJS,
        getDataTablesInitJS: getDataTablesInitJS,
        getTableExportJS: getTableExportJS,
        getTableFilteringJS: getTableFilteringJS,
        getColumnSyncJS: getColumnSyncJS,
        getAllTableRenderingJS: getAllTableRenderingJS
    };
    
});
