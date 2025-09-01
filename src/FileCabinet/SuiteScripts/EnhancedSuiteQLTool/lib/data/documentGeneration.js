/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Document Generation
 * 
 * This module handles PDF and HTML document generation
 * from query results using NetSuite's render module.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../core/constants',
    '../core/modules'
], function(constants, nsModules) {
    
    /**
     * Generate a document (PDF or HTML) from query results
     * 
     * @param {Object} context - The request context
     * @returns {void} - Writes the generated document to the response
     */
    function documentGenerate(context) {
        try {
            var sessionScope = nsModules.runtime.getCurrentSession();
            var docInfo = JSON.parse(sessionScope.get({ name: 'suiteQLDocumentInfo' }));
            
            var moreRecords = true;
            var paginatedRowBegin = docInfo.rowBegin;
            var paginatedRowEnd = docInfo.rowEnd;
            var queryParams = new Array();
            var records = new Array();
            
            // Fetch all records for the document
            do {
                var paginatedSQL = 'SELECT * FROM ( SELECT ROWNUM AS ROWNUMBER, * FROM (' + 
                                 docInfo.query + ' ) ) WHERE ( ROWNUMBER BETWEEN ' + 
                                 paginatedRowBegin + ' AND ' + paginatedRowEnd + ')';
                
                var queryResults = nsModules.queryUtils.runSuiteQL({ 
                    query: paginatedSQL, 
                    params: queryParams 
                }).asMappedResults();
                
                records = records.concat(queryResults);
                
                if (queryResults.length < 5000) { 
                    moreRecords = false; 
                }
                
                paginatedRowBegin = paginatedRowBegin + 5000;
                
            } while (moreRecords);
            
            var recordsDataSource = { 'records': records };
            var renderer = nsModules.renderUtils.create();
            
            renderer.addCustomDataSource({ 
                alias: 'results', 
                format: nsModules.renderUtils.getDataSource().OBJECT, 
                data: recordsDataSource 
            });
            
            renderer.templateContent = docInfo.template;
            
            // Generate the appropriate document type
            if (docInfo.docType == 'pdf') {
                generatePDF(context, renderer);
            } else {
                generateHTML(context, renderer);
            }
            
        } catch(e) {
            nsModules.logger.error('documentGenerate Error', e);
            context.response.write('Error: ' + e);
        }
    }
    
    /**
     * Generate a PDF document
     * 
     * @param {Object} context - The request context
     * @param {Object} renderer - The NetSuite renderer object
     * @returns {void} - Writes PDF to response
     */
    function generatePDF(context, renderer) {
        try {
            let renderObj = renderer.renderAsPdf();
            let pdfString = renderObj.getContents();
            
            context.response.setHeader('Content-Type', 'application/pdf');
            context.response.write(pdfString);
            
        } catch(e) {
            nsModules.logger.error('generatePDF Error', e);
            throw e;
        }
    }
    
    /**
     * Generate an HTML document
     * 
     * @param {Object} context - The request context
     * @param {Object} renderer - The NetSuite renderer object
     * @returns {void} - Writes HTML to response
     */
    function generateHTML(context, renderer) {
        try {
            let htmlString = renderer.renderAsString();
            
            context.response.setHeader('Content-Type', 'text/html');
            context.response.write(htmlString);
            
        } catch(e) {
            nsModules.logger.error('generateHTML Error', e);
            throw e;
        }
    }
    
    /**
     * Submit document generation request
     * 
     * @param {Object} context - The request context
     * @param {Object} requestPayload - The document request payload
     * @returns {void} - Writes response to context
     */
    function documentSubmit(context, requestPayload) {
        try {
            var responsePayload;
            var sessionScope = nsModules.runtime.getCurrentSession();
            
            sessionScope.set({ 
                name: 'suiteQLDocumentInfo', 
                value: JSON.stringify(requestPayload) 
            });
            
            responsePayload = { 'submitted': true };
            
        } catch(e) {
            nsModules.logger.error('documentSubmit Error', e);
            responsePayload = { 'error': e };
        }
        
        context.response.write(JSON.stringify(responsePayload, null, 5));
    }
    
    /**
     * Validate document template
     * 
     * @param {string} template - The document template
     * @returns {Object} - Validation result
     */
    function validateTemplate(template) {
        if (!template || template.trim() === '') {
            return {
                isValid: false,
                message: constants.ERROR_MESSAGES.TEMPLATE_EMPTY
            };
        }
        
        // Basic template validation
        if (!template.includes('${results}')) {
            return {
                isValid: false,
                message: 'Template must include ${results} placeholder'
            };
        }
        
        return {
            isValid: true,
            message: 'Template is valid'
        };
    }
    
    /**
     * Get default PDF template
     * 
     * @returns {string} - Default PDF template
     */
    function getDefaultPDFTemplate() {
        return '<pdf>' +
            '<head>' +
                '<style type="text/css">' +
                    'table { width: 100%; border-collapse: collapse; }' +
                    'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }' +
                    'th { background-color: #f2f2f2; font-weight: bold; }' +
                    '.header { text-align: center; margin-bottom: 20px; }' +
                '</style>' +
            '</head>' +
            '<body>' +
                '<div class="header">' +
                    '<h1>SuiteQL Query Results</h1>' +
                    '<p>Generated on: ${.now}</p>' +
                '</div>' +
                '<table>' +
                    '<#if results.records?has_content>' +
                        '<thead>' +
                            '<tr>' +
                                '<#list results.records[0]?keys as key>' +
                                    '<th>${key}</th>' +
                                '</#list>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>' +
                            '<#list results.records as record>' +
                                '<tr>' +
                                    '<#list record?values as value>' +
                                        '<td>${value!""}</td>' +
                                    '</#list>' +
                                '</tr>' +
                            '</#list>' +
                        '</tbody>' +
                    '<#else>' +
                        '<tr><td colspan="100%">No records found</td></tr>' +
                    '</#if>' +
                '</table>' +
            '</body>' +
            '</pdf>';
    }
    
    /**
     * Get default HTML template
     * 
     * @returns {string} - Default HTML template
     */
    function getDefaultHTMLTemplate() {
        return '<!DOCTYPE html>' +
            '<html>' +
                '<head>' +
                    '<title>SuiteQL Query Results</title>' +
                    '<style type="text/css">' +
                        'body { font-family: Arial, sans-serif; margin: 20px; }' +
                        'table { width: 100%; border-collapse: collapse; margin-top: 20px; }' +
                        'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }' +
                        'th { background-color: #f2f2f2; font-weight: bold; }' +
                        '.header { text-align: center; margin-bottom: 20px; }' +
                        '.no-records { text-align: center; color: #666; }' +
                    '</style>' +
                '</head>' +
                '<body>' +
                    '<div class="header">' +
                        '<h1>SuiteQL Query Results</h1>' +
                        '<p>Generated on: ${.now}</p>' +
                    '</div>' +
                    '<#if results.records?has_content>' +
                        '<table>' +
                            '<thead>' +
                                '<tr>' +
                                    '<#list results.records[0]?keys as key>' +
                                        '<th>${key}</th>' +
                                    '</#list>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                                '<#list results.records as record>' +
                                    '<tr>' +
                                        '<#list record?values as value>' +
                                            '<td>${value!""}</td>' +
                                        '</#list>' +
                                    '</tr>' +
                                '</#list>' +
                            '</tbody>' +
                        '</table>' +
                        '<p>Total Records: ${results.records?size}</p>' +
                    '<#else>' +
                        '<div class="no-records">' +
                            '<h3>No records found</h3>' +
                        '</div>' +
                    '</#if>' +
                '</body>' +
            '</html>';
    }
    
    /**
     * Export the document generation functions
     */
    return {
        documentGenerate: documentGenerate,
        documentSubmit: documentSubmit,
        generatePDF: generatePDF,
        generateHTML: generateHTML,
        validateTemplate: validateTemplate,
        getDefaultPDFTemplate: getDefaultPDFTemplate,
        getDefaultHTMLTemplate: getDefaultHTMLTemplate
    };
    
});
