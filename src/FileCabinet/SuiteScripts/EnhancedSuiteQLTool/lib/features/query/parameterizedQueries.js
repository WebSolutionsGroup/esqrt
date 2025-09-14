/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Parameterized Queries
 * 
 * This module handles parameterized query functionality including:
 * - Parameter detection in SQL queries
 * - Parameter input modal generation
 * - Parameter validation and substitution
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants',
    '../../data/netsuiteFieldMetadata'
], function(constants, fieldMetadata) {
    
    /**
     * Detect parameters in a SQL query
     * 
     * @param {string} query - The SQL query to analyze
     * @returns {Object} Object containing parameter information
     */
    function detectParameters(query) {
        if (!query || typeof query !== 'string') {
            return {
                hasParameters: false,
                parameterCount: 0,
                parameters: []
            };
        }
        
        // Find all ? placeholders that are not inside quoted strings
        const parameters = [];
        let parameterIndex = 0;
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let escaped = false;
        
        for (let i = 0; i < query.length; i++) {
            const char = query[i];
            const prevChar = i > 0 ? query[i - 1] : '';
            
            // Handle escape sequences
            if (escaped) {
                escaped = false;
                continue;
            }
            
            if (char === '\\') {
                escaped = true;
                continue;
            }
            
            // Handle quotes
            if (char === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
                continue;
            }
            
            if (char === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
                continue;
            }
            
            // If we're inside quotes, skip parameter detection
            if (inSingleQuote || inDoubleQuote) {
                continue;
            }
            
            // Detect parameter placeholder
            if (char === '?') {
                parameterIndex++;
                
                // Try to infer parameter context from surrounding SQL
                const context = getParameterContext(query, i);
                
                parameters.push({
                    index: parameterIndex,
                    position: i,
                    name: `Parameter ${parameterIndex}`,
                    type: context.type,
                    context: context.description,
                    required: true,
                    value: null
                });
            }
        }
        
        return {
            hasParameters: parameters.length > 0,
            parameterCount: parameters.length,
            parameters: parameters
        };
    }
    
    /**
     * Get context information for a parameter based on surrounding SQL
     *
     * @param {string} query - The full SQL query
     * @param {number} position - Position of the ? in the query
     * @returns {Object} Context information
     */
    function getParameterContext(query, position) {
        // Get surrounding text (100 characters before and after for better context)
        const start = Math.max(0, position - 100);
        const end = Math.min(query.length, position + 100);
        const context = query.substring(start, end);

        // Try to extract table and field information from the SQL context
        var tableAndField = extractTableAndFieldFromContext(context, position - start);

        if (tableAndField.tableName && tableAndField.fieldName) {
            // Use NetSuite field metadata for accurate type detection
            var parameterType = fieldMetadata.getParameterTypeFromField(tableAndField.tableName, tableAndField.fieldName);
            return {
                type: parameterType.type,
                description: parameterType.description,
                dataType: parameterType.dataType,
                tableName: tableAndField.tableName,
                fieldName: tableAndField.fieldName
            };
        }

        // Fallback to pattern-based detection if we can't identify the field
        return getParameterContextFallback(context.toLowerCase());
    }

    /**
     * Extract table and field names from SQL context around a parameter
     *
     * @param {string} context - SQL context around the parameter
     * @param {number} paramPosition - Position of ? within the context
     * @returns {Object} Object with tableName and fieldName
     */
    function extractTableAndFieldFromContext(context, paramPosition) {
        var result = { tableName: null, fieldName: null };

        try {
            // Look for patterns like "fieldname = ?" or "table.fieldname = ?"
            var beforeParam = context.substring(0, paramPosition).trim();
            var afterParam = context.substring(paramPosition + 1).trim();

            // Pattern 1: "fieldname = ?" or "fieldname IN (?)" or "fieldname LIKE ?"
            var fieldMatch = beforeParam.match(/(\w+\.)?(\w+)\s*(?:=|IN|LIKE|>|<|>=|<=|!=|<>)\s*$/i);
            if (fieldMatch) {
                result.fieldName = fieldMatch[2];
                if (fieldMatch[1]) {
                    // Remove the dot from "table."
                    result.tableName = fieldMatch[1].replace('.', '');
                }
            }

            // Pattern 2: Look for FROM clause to identify table if not found in field reference
            if (!result.tableName) {
                var fromMatch = context.match(/FROM\s+(\w+)/i);
                if (fromMatch) {
                    result.tableName = fromMatch[1];
                }
            }

            // Pattern 3: Look for JOIN clauses for additional table context
            if (!result.tableName) {
                var joinMatch = context.match(/JOIN\s+(\w+)/i);
                if (joinMatch) {
                    result.tableName = joinMatch[1];
                }
            }

        } catch (e) {
            // If parsing fails, return null values
        }

        return result;
    }

    /**
     * Fallback parameter context detection using pattern matching
     *
     * @param {string} context - Lowercase SQL context
     * @returns {Object} Context information
     */
    function getParameterContextFallback(context) {
        // Default context
        let type = 'text';
        let description = 'Enter value';

        // Look for date-related keywords
        if (context.includes('date') || context.includes('created') || context.includes('modified') ||
            context.includes('lastmodified') || context.includes('datecreated')) {
            type = 'date';
            description = 'Select date';
        }
        // Look for amount/currency contexts (but not "id" since many text fields contain "id")
        else if (context.includes('amount') || context.includes('total') || context.includes('cost') ||
                 context.includes('price') || context.includes('balance') || context.includes('limit') ||
                 context.includes('count') || context.includes('qty') || context.includes('quantity')) {
            type = 'number';
            description = 'Enter numeric value';
        }
        // Look for email contexts
        else if (context.includes('email')) {
            type = 'email';
            description = 'Enter email address';
        }
        // Look for boolean contexts
        else if (context.includes('active') || context.includes('enabled') || context.includes('disabled') ||
                 context.includes('isinactive') || context.includes('is_inactive') || context.includes('voided') ||
                 context.includes('approved') || context.includes('taxable')) {
            type = 'select';
            description = 'Select true/false';
        }

        return {
            type: type,
            description: description,
            dataType: type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'
        };
    }
    
    /**
     * Generate the parameter input modal HTML
     * 
     * @param {Array} parameters - Array of parameter objects
     * @returns {string} HTML for the parameter modal
     */
    function getParameterModalHTML(parameters) {
        if (!parameters || parameters.length === 0) {
            return '';
        }
        
        let modalHTML = `
            <!-- Parameter Input Modal -->
            <div id="${constants.MODAL_IDS.PARAMETERS}" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;">
                <div style="position: relative; margin: 50px auto; width: 600px; max-width: 90%; background: #2d2d30; border: 1px solid #3e3e42; border-radius: 6px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                    <h3 style="margin: 0 0 20px 0; color: #cccccc;">Query Parameters</h3>
                    <p style="margin: 0 0 20px 0; color: #999; font-size: 14px;">Please provide values for the following parameters:</p>
                    
                    <form id="parameterForm">
        `;
        
        // Generate input fields for each parameter
        parameters.forEach((param, index) => {
            modalHTML += generateParameterInput(param, index);
        });
        
        modalHTML += `
                    </form>
                    
                    <div style="margin-top: 20px; text-align: right;">
                        <button type="button" onclick="closeParameterModal()" style="margin-right: 10px; padding: 8px 16px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px; cursor: pointer;">Cancel</button>
                        <button type="button" onclick="executeParameterizedQuery()" style="padding: 8px 16px; background: #0e639c; color: white; border: 1px solid #1177bb; border-radius: 3px; cursor: pointer;">Execute Query</button>
                    </div>
                </div>
            </div>
        `;
        
        return modalHTML;
    }
    
    /**
     * Generate input field HTML for a single parameter
     * 
     * @param {Object} param - Parameter object
     * @param {number} index - Parameter index
     * @returns {string} HTML for the parameter input
     */
    function generateParameterInput(param, index) {
        const fieldId = `param_${index}`;
        
        let inputHTML = `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #cccccc; font-weight: 500;">
                    ${param.name}${param.required ? ' *' : ''}
                </label>
                <div style="font-size: 12px; color: #999; margin-bottom: 5px;">${param.context}</div>
        `;
        
        switch (param.type) {
            case 'date':
                inputHTML += `<input type="date" id="${fieldId}" name="${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" ${param.required ? 'required' : ''}>`;
                break;
                
            case 'number':
                inputHTML += `<input type="number" id="${fieldId}" name="${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" ${param.required ? 'required' : ''}>`;
                break;
                
            case 'email':
                inputHTML += `<input type="email" id="${fieldId}" name="${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" ${param.required ? 'required' : ''}>`;
                break;
                
            case 'select':
                inputHTML += `
                    <select id="${fieldId}" name="${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" ${param.required ? 'required' : ''}>
                        <option value="">Select...</option>
                        <option value="T">True</option>
                        <option value="F">False</option>
                    </select>
                `;
                break;
                
            default: // text
                inputHTML += `<input type="text" id="${fieldId}" name="${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" ${param.required ? 'required' : ''}>`;
                break;
        }
        
        inputHTML += `
            </div>
        `;
        
        return inputHTML;
    }
    
    /**
     * Generate JavaScript functions for parameter modal functionality
     *
     * @returns {string} JavaScript code for parameter modal functions
     */
    function getParameterModalJS() {
        return `
            // Parameter Modal Functions
            window.currentParameterizedQuery = null;
            window.currentParameters = null;

            window.showParameterModal = function(query, parameters) {

                // Store the query and parameters for later execution
                window.currentParameterizedQuery = query;
                window.currentParameters = parameters;

                // Generate and inject the modal HTML
                const modalHTML = generateParameterModalHTML(parameters);

                // Remove any existing parameter modal
                const existingModal = document.getElementById('${constants.MODAL_IDS.PARAMETERS}');
                if (existingModal) {
                    existingModal.remove();
                }

                // Add the modal to the page
                document.body.insertAdjacentHTML('beforeend', modalHTML);

                // Show the modal
                const modal = document.getElementById('${constants.MODAL_IDS.PARAMETERS}');
                if (modal) {
                    modal.style.display = 'block';

                    // Focus on the first input
                    const firstInput = modal.querySelector('input, select');
                    if (firstInput) {
                        setTimeout(() => firstInput.focus(), 100);
                    }
                }
            }

            window.closeParameterModal = function(clearData = true) {
                const modal = document.getElementById('${constants.MODAL_IDS.PARAMETERS}');
                if (modal) {
                    modal.style.display = 'none';
                    modal.remove();
                }

                // Clear stored data only if requested
                if (clearData) {
                    window.currentParameterizedQuery = null;
                    window.currentParameters = null;
                }
            }

            window.executeParameterizedQuery = function() {

                if (!window.currentParameterizedQuery || !window.currentParameters) {
                    alert('No parameterized query to execute');
                    return;
                }

                // Collect parameter values from the form
                const parameterValues = [];
                let allValid = true;

                for (let i = 0; i < window.currentParameters.length; i++) {
                    const fieldId = 'param_' + i;
                    const input = document.getElementById(fieldId);

                    if (!input) {
                        console.error('Parameter input not found:', fieldId);
                        allValid = false;
                        continue;
                    }

                    const value = input.value.trim();

                    // Validate required fields
                    if (window.currentParameters[i].required && !value) {
                        alert('Please provide a value for ' + window.currentParameters[i].name);
                        input.focus();
                        return;
                    }

                    // Validate by type
                    if (value && !validateParameterValue(value, window.currentParameters[i].type)) {
                        alert('Invalid value for ' + window.currentParameters[i].name + '. ' + getValidationMessage(window.currentParameters[i].type));
                        input.focus();
                        return;
                    }

                    // Process the value based on type
                    let processedValue = value || null;
                    if (processedValue && window.currentParameters[i].type === 'date') {
                        // Convert date to MM/DD/YYYY string format for TO_CHAR comparison
                        if (/^\\d{4}-\\d{2}-\\d{2}$/.test(processedValue)) {
                            // Parse YYYY-MM-DD format directly to avoid timezone issues
                            const [year, month, day] = processedValue.split('-');
                            processedValue = \`\${month}/\${day}/\${year}\`;
                        } else {
                            // Fallback to Date object for other formats
                            const dateObj = new Date(processedValue);
                            if (!isNaN(dateObj.getTime())) {
                                const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                                const day = dateObj.getDate().toString().padStart(2, '0');
                                const year = dateObj.getFullYear();
                                processedValue = \`\${month}/\${day}/\${year}\`;
                            }
                        }
                    }

                    parameterValues.push(processedValue);
                }

                if (!allValid) {
                    alert('Please check all parameter values');
                    return;
                }

                // Close the modal but don't clear data yet
                window.closeParameterModal(false);

                // Execute the query with parameters
                window.executeQueryWithParameters(window.currentParameterizedQuery, parameterValues);
            }

            function validateParameterValue(value, type) {
                switch (type) {
                    case 'number':
                        return !isNaN(value) && !isNaN(parseFloat(value));
                    case 'date':
                        return /^\\d{4}-\\d{2}-\\d{2}$/.test(value);
                    case 'email':
                        return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
                    default:
                        return true; // text and select are always valid if not empty
                }
            }

            function getValidationMessage(type) {
                switch (type) {
                    case 'number':
                        return 'Please enter a valid number.';
                    case 'date':
                        return 'Please enter a valid date in YYYY-MM-DD format.';
                    case 'email':
                        return 'Please enter a valid email address.';
                    default:
                        return 'Please enter a valid value.';
                }
            }

            function transformQueryForDateParameters(query, parameters) {
                if (!parameters || !Array.isArray(parameters)) {
                    return query;
                }

                let transformedQuery = query;

                // Process parameters in reverse order to maintain position accuracy
                for (let i = parameters.length - 1; i >= 0; i--) {
                    const param = parameters[i];
                    if (param.type === 'date') {
                        // Find the field name before the = ? pattern
                        const beforeParam = query.substring(0, param.position);
                        const afterParam = query.substring(param.position + 1);

                        // Look for field name pattern (word characters, possibly with dots/underscores)
                        const fieldMatch = beforeParam.match(/([\\w\\.]+)\\s*=\\s*$/);
                        if (fieldMatch) {
                            const fieldName = fieldMatch[1];

                            // Check if this field is already wrapped in TO_CHAR or other functions
                            const beforeFieldMatch = beforeParam.match(/(TO_CHAR\\s*\\(|DATE\\s*\\(|TRUNC\\s*\\()[^)]*\\s*=\\s*$/i);
                            if (beforeFieldMatch) {
                                continue;
                            }

                            const beforeField = beforeParam.substring(0, fieldMatch.index);

                            // Replace "fieldname = ?" with "TO_CHAR(fieldname, 'MM/DD/YYYY') = ?"
                            const replacement = \`TO_CHAR(\${fieldName}, 'MM/DD/YYYY') = ?\`;
                            transformedQuery = beforeField + replacement + afterParam;
                        }
                    }
                }

                return transformedQuery;
            }

            window.executeQueryWithParameters = function(query, parameterValues) {
                // Transform query to handle date parameters better
                let transformedQuery = transformQueryForDateParameters(query, window.currentParameters);

                // Update status and UI (same as regular query execution)
                document.getElementById('${constants.ELEMENT_IDS.STATUS_TEXT}').textContent = 'Executing query...';

                // Hide welcome message and show loading
                document.getElementById('${constants.ELEMENT_IDS.WELCOME_MESSAGE}').style.display = 'none';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--codeoss-text-secondary);"><div style="margin-bottom: 12px;">⏳ Executing query...</div><div style="font-size: 11px;">Please wait while your query is processed.</div></div>';
                document.getElementById('${constants.ELEMENT_IDS.RESULTS_DIV}').style.display = 'block';

                // Prepare request payload with parameters
                const requestPayload = {
                    'function': '${constants.REQUEST_FUNCTIONS.QUERY_EXECUTE}',
                    query: transformedQuery ? transformedQuery.trim() : '',
                    parameters: parameterValues,
                    rowBegin: getRowBegin(),
                    rowEnd: getRowEnd(),
                    paginationEnabled: isPaginationEnabled(),
                    returnTotals: isReturnTotalsEnabled(),
                    viewsEnabled: isViewsEnabled()
                };

                // Track execution start time
                const executionStartTime = Date.now();

                // Execute the query
                fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestPayload)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(\`HTTP error! status: \${response.status}\`);
                    }
                    return response.json();
                })
                .then(data => {
                    const executionTime = Date.now() - executionStartTime;
                    window.queryResponsePayload = data;

                    // Add to query history with execution details (same as regular queries)
                    if (data.error) {
                        if (typeof updateQueryHistory === 'function') {
                            updateQueryHistory(query ? query.trim() : '', executionTime, 0, false, data.error.message || 'Query failed', 'table');
                        }
                    } else {
                        const recordCount = data.records ? data.records.length : 0;
                        if (typeof updateQueryHistory === 'function') {
                            updateQueryHistory(query ? query.trim() : '', executionTime, recordCount, true, null, 'table');
                        }
                    }

                    // Handle the response the same way as regular queries
                    if (typeof handleQueryResponse === 'function') {
                        handleQueryResponse(data);
                    } else {
                        console.error('handleQueryResponse function not available');
                    }

                    // Clear stored parameter data after successful execution
                    window.currentParameterizedQuery = null;
                    window.currentParameters = null;
                })
                .catch(error => {
                    const executionTime = Date.now() - executionStartTime;
                    console.error('Error executing parameterized query:', error);

                    // Add failed query to history
                    if (typeof updateQueryHistory === 'function') {
                        updateQueryHistory(query ? query.trim() : '', executionTime, 0, false, error.message || 'Network error', 'table');
                    }

                    if (typeof handleQueryError === 'function') {
                        handleQueryError(error);
                    } else {
                        alert('Error executing query: ' + error.message);
                    }

                    // Clear stored parameter data after error
                    window.currentParameterizedQuery = null;
                    window.currentParameters = null;
                });
            }

            function generateParameterModalHTML(parameters) {
                if (!parameters || parameters.length === 0) {
                    return '';
                }

                let modalHTML = \`
                    <!-- Parameter Input Modal -->
                    <div id="${constants.MODAL_IDS.PARAMETERS}" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;">
                        <div style="position: relative; margin: 50px auto; width: 600px; max-width: 90%; background: #2d2d30; border: 1px solid #3e3e42; border-radius: 6px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                            <h3 style="margin: 0 0 20px 0; color: #cccccc;">Query Parameters</h3>
                            <p style="margin: 0 0 20px 0; color: #999; font-size: 14px;">Please provide values for the following parameters:</p>

                            <form id="parameterForm">
                \`;

                // Generate input fields for each parameter
                parameters.forEach((param, index) => {
                    modalHTML += generateParameterInputHTML(param, index);
                });

                modalHTML += \`
                            </form>

                            <div style="margin-top: 20px; text-align: right;">
                                <button type="button" onclick="closeParameterModal()" style="margin-right: 10px; padding: 8px 16px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px; cursor: pointer;">Cancel</button>
                                <button type="button" onclick="executeParameterizedQuery()" style="padding: 8px 16px; background: #0e639c; color: white; border: 1px solid #1177bb; border-radius: 3px; cursor: pointer;">Execute Query</button>
                            </div>
                        </div>
                    </div>
                \`;

                return modalHTML;
            }

            function generateParameterInputHTML(param, index) {
                const fieldId = \`param_\${index}\`;

                let inputHTML = \`
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #cccccc; font-weight: 500;">
                            \${param.name}\${param.required ? ' *' : ''}
                        </label>
                        <div style="font-size: 12px; color: #999; margin-bottom: 5px;">\${param.context}</div>
                \`;

                switch (param.type) {
                    case 'date':
                        inputHTML += \`<input type="date" id="\${fieldId}" name="\${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" \${param.required ? 'required' : ''}>\`;
                        break;

                    case 'number':
                        inputHTML += \`<input type="number" id="\${fieldId}" name="\${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" \${param.required ? 'required' : ''}>\`;
                        break;

                    case 'email':
                        inputHTML += \`<input type="email" id="\${fieldId}" name="\${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" \${param.required ? 'required' : ''}>\`;
                        break;

                    case 'select':
                        inputHTML += \`
                            <select id="\${fieldId}" name="\${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" \${param.required ? 'required' : ''}>
                                <option value="">Select...</option>
                                <option value="T">True</option>
                                <option value="F">False</option>
                            </select>
                        \`;
                        break;

                    default: // text
                        inputHTML += \`<input type="text" id="\${fieldId}" name="\${fieldId}" style="width: 100%; padding: 8px; background: #3c3c3c; color: #cccccc; border: 1px solid #3e3e42; border-radius: 3px;" \${param.required ? 'required' : ''}>\`;
                        break;
                }

                inputHTML += \`
                    </div>
                \`;

                return inputHTML;
            }
        `;
    }

    /**
     * Test function to verify parameter detection
     *
     * @returns {Object} Test results
     */
    function testParameterDetection() {
        const testQueries = [
            {
                query: "SELECT * FROM Employee WHERE id = ?",
                expectedCount: 1,
                expectedType: "number"
            },
            {
                query: "SELECT * FROM Employee WHERE email = ? AND datecreated > ?",
                expectedCount: 2,
                expectedTypes: ["email", "date"]
            },
            {
                query: "SELECT * FROM Employee WHERE name = 'John?' AND id = ?",
                expectedCount: 1,
                expectedType: "number"
            },
            {
                query: "SELECT * FROM Employee WHERE active = ?",
                expectedCount: 1,
                expectedType: "select"
            }
        ];

        const results = [];

        testQueries.forEach((test, index) => {
            const result = detectParameters(test.query);
            const success = result.parameterCount === test.expectedCount;

            results.push({
                testIndex: index + 1,
                query: test.query,
                expected: test.expectedCount,
                actual: result.parameterCount,
                success: success,
                parameters: result.parameters
            });
        });

        return {
            totalTests: testQueries.length,
            passedTests: results.filter(r => r.success).length,
            results: results
        };
    }

    /**
     * Export the parameterized query functions
     */
    return {
        detectParameters: detectParameters,
        getParameterContext: getParameterContext,
        getParameterModalHTML: getParameterModalHTML,
        generateParameterInput: generateParameterInput,
        getParameterModalJS: getParameterModalJS,
        testParameterDetection: testParameterDetection
    };

});
