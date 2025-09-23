/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - NetSuite Modules
 * 
 * This module handles all NetSuite module imports and provides
 * a centralized way to access NetSuite APIs throughout the application.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    'N/file', 
    'N/https', 
    'N/log', 
    'N/ui/message', 
    'N/query', 
    'N/record', 
    'N/render', 
    'N/runtime', 
    'N/ui/serverWidget', 
    'N/url'
], function(
    fileModule, 
    httpsModule, 
    logModule, 
    messageModule, 
    queryModule, 
    recordModule, 
    renderModule, 
    runtimeModule, 
    serverWidgetModule, 
    urlModule
) {
    
    /**
     * NetSuite Module References
     * 
     * These are the initialized NetSuite modules that can be used
     * throughout the application.
     */
    var modules = {
        file: fileModule,
        https: httpsModule,
        log: logModule,
        message: messageModule,
        query: queryModule,
        record: recordModule,
        render: renderModule,
        runtime: runtimeModule,
        serverWidget: serverWidgetModule,
        url: urlModule
    };
    
    /**
     * Script Information
     * 
     * Provides access to current script information and URLs
     */
    var scriptInfo = {
        /**
         * Get the current script URL
         * @returns {string} The script URL
         */
        getScriptURL: function() {
            return urlModule.resolveScript({
                scriptId: runtimeModule.getCurrentScript().id,
                deploymentId: runtimeModule.getCurrentScript().deploymentId,
                returnExternalURL: false
            });
        },
        
        /**
         * Get the current script ID
         * @returns {string} The script ID
         */
        getScriptId: function() {
            return runtimeModule.getCurrentScript().id;
        },

        /**
         * Get the current deployment ID
         * @returns {string} The deployment ID
         */
        getDeploymentId: function() {
            return runtimeModule.getCurrentScript().deploymentId;
        },

        /**
         * Get the current session
         * @returns {Object} The current session object
         */
        getCurrentSession: function() {
            return runtimeModule.getCurrentSession();
        }
    };
    
    /**
     * Logging Utilities
     * 
     * Provides standardized logging functions
     */
    var logger = {
        /**
         * Log debug information
         * @param {string} title - The log title
         * @param {*} details - The log details
         */
        debug: function(title, details) {
            logModule.debug({ title: title, details: details });
        },

        /**
         * Log error information
         * @param {string} title - The log title
         * @param {*} details - The log details
         */
        error: function(title, details) {
            logModule.error({ title: title, details: details });
        },

        /**
         * Log audit information
         * @param {string} title - The log title
         * @param {*} details - The log details
         */
        audit: function(title, details) {
            logModule.audit({ title: title, details: details });
        }
    };
    
    /**
     * File Operations
     * 
     * Provides file-related utilities
     */
    var fileUtils = {
        /**
         * Load a file by ID
         * @param {number|string} fileId - The file ID
         * @returns {Object} The file object
         */
        load: function(fileId) {
            return fileModule.load({ id: fileId });
        },
        
        /**
         * Create a new file
         * @param {Object} options - File creation options
         * @returns {Object} The created file object
         */
        create: function(options) {
            return fileModule.create(options);
        },
        
        /**
         * Get file type constants
         * @returns {Object} File type constants
         */
        getTypes: function() {
            return fileModule.Type;
        }
    };
    
    /**
     * Query Operations
     * 
     * Provides query-related utilities
     */
    var queryUtils = {
        /**
         * Run a SuiteQL query
         * @param {Object} options - Query options
         * @returns {Object} Query results
         */
        runSuiteQL: function(options) {
            return queryModule.runSuiteQL(options);
        },
        
        /**
         * Load a saved query
         * @param {Object} options - Load options
         * @returns {Object} The loaded query
         */
        load: function(options) {
            return queryModule.load(options);
        }
    };
    
    /**
     * Render Operations
     * 
     * Provides rendering utilities for PDF/HTML generation
     */
    var renderUtils = {
        /**
         * Create a new renderer
         * @returns {Object} The renderer object
         */
        create: function() {
            return renderModule.create();
        },
        
        /**
         * Get data source constants
         * @returns {Object} Data source constants
         */
        getDataSource: function() {
            return renderModule.DataSource;
        }
    };
    
    /**
     * Server Widget Operations
     * 
     * Provides UI widget utilities
     */
    var widgetUtils = {
        /**
         * Create a form
         * @param {Object} options - Form options
         * @returns {Object} The form object
         */
        createForm: function(options) {
            return serverWidgetModule.createForm(options);
        },
        
        /**
         * Get field type constants
         * @returns {Object} Field type constants
         */
        getFieldTypes: function() {
            return serverWidgetModule.FieldType;
        }
    };
    
    /**
     * Export all module utilities
     */
    return {
        // Raw modules (for backward compatibility)
        modules: modules,
        
        // Utility functions
        scriptInfo: scriptInfo,
        logger: logger,
        fileUtils: fileUtils,
        queryUtils: queryUtils,
        renderUtils: renderUtils,
        widgetUtils: widgetUtils,
        
        // Direct access to commonly used modules
        file: modules.file,
        https: modules.https,
        log: modules.log,
        message: modules.message,
        query: modules.query,
        record: modules.record,
        render: modules.render,
        runtime: modules.runtime,
        serverWidget: modules.serverWidget,
        url: modules.url
    };
    
});