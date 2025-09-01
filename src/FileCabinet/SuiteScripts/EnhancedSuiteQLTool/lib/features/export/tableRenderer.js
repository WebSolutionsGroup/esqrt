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
                for (let i = 0; i < headers.length; i++) {
                    if ((i === 0) && firstColumnIsRowNumber && !rowNumbersHidden) {
                        thead += '<th style="text-align: center;">&nbsp;#&nbsp;</th>';
                    } else if ((i === 0) && firstColumnIsRowNumber && rowNumbersHidden) {
                        continue;
                    } else {
                        thead += '<th>' + headers[i] + '</th>';
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

                // Create simple table content (exactly like original)
                let content = '<div style="overflow: auto; max-height: 400px;">';
                content += '<table class="` + constants.CSS_CLASSES.CODEOSS_TABLE + `" id="resultsTable">';
                content += thead;
                content += tbody;
                content += '</table>';
                content += '</div>';

                // Add hidden textarea for copying (like original)
                content += '<textarea id="responseData" style="position: absolute; left: -9999px; opacity: 0;"></textarea>';

                document.getElementById('` + constants.ELEMENT_IDS.RESULTS_DIV + `').innerHTML = content;
                document.getElementById('` + constants.ELEMENT_IDS.WELCOME_MESSAGE + `').style.display = 'none';
                document.getElementById('` + constants.ELEMENT_IDS.STATUS_TEXT + `').textContent = 'Query completed - ' + records.length + ' rows';

                // Show copy button, hide CSV export buttons
                document.getElementById('` + constants.ELEMENT_IDS.COPY_CLIPBOARD_BTN + `').style.display = 'inline-block';
                document.getElementById('downloadCSVBtn').style.display = 'none';
                document.getElementById('copyCSVBtn').style.display = 'none';

                // Do NOT initialize DataTables by default (keep it simple like original)
            }
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
                        scrollY: '400px',
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
                    console.warn('DataTables initialization failed:', e);
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
               getDataTablesInitJS() + '\n' +
               getTableExportJS() + '\n' +
               getTableFilteringJS();
    }
    
    /**
     * Export the table rendering functions
     */
    return {
        getResponseGenerateTableJS: getResponseGenerateTableJS,
        getDataTablesInitJS: getDataTablesInitJS,
        getTableExportJS: getTableExportJS,
        getTableFilteringJS: getTableFilteringJS,
        getAllTableRenderingJS: getAllTableRenderingJS
    };
    
});
