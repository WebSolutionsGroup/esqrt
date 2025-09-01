/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*/

/* 

------------------------------------------------------------------------------------------
Script Information
------------------------------------------------------------------------------------------

Name:
Enhanced SuiteQL Query Tool (Modular Architecture)

ID:
_suiteql_query_tool_enhanced

Description
A utility for running SuiteQL queries in a NetSuite instance.

Enhancements (2025 Update):
- Redesigned UI inspired by modern database management tools.
- Added CodeMirror for syntax-highlighted query editor with intelligent auto-complete for SQL keywords and NetSuite objects.
- Improved result display with resizable panels, query history sidebar, and export options (CSV, JSON, PDF).
- Added query validation and error highlighting.
- Enhanced pagination with infinite scrolling option.
- Integrated split-pane layout for query editor and results with modern interface design.
- Added theme support (light/dark mode toggle) for enhanced user experience.
- Preserved original functionality while modernizing the interface.
- REFACTORED: Complete modular architecture for maximum maintainability and extensibility.

------------------------------------------------------------------------------------------
MIT License
------------------------------------------------------------------------------------------

Copyright (c) 2021 Timothy Dietrich.
Copyright (c) 2025 Web Solutions Group, LLC - Enhanced Version.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


------------------------------------------------------------------------------------------
Developer(s)
------------------------------------------------------------------------------------------

Tim Dietrich (Original Developer)
* timdietrich@me.com
* https://timdietrich.me

Matt Owen - Web Solutions Group, LLC (Enhanced Version Developer)
* Enhanced UI with modern interface inspired by contemporary database management tools
* Added CodeMirror syntax highlighting, query history, and improved user experience
* Refactored into complete modular architecture for maximum maintainability and extensibility
* Web Solutions Group, LLC - Professional NetSuite Development Services


------------------------------------------------------------------------------------------
History
------------------------------------------------------------------------------------------

20210714 - Tim Dietrich
* First public beta of v2021.2.

20210725 - Tim Dietrich
* Second public beta of v2021.2.

20211027 - Tim Dietrich
* Production release of v2021.2.
* Adds support for "virtual views" and option to suppress "total rows count."
* Adds support for running queries based on the selected text in the query textarea.
* The Tables Reference now opens in its own tab.
* Removed upgrade functionality.

20250807 - Enhanced by Matt Owen - Web Solutions Group, LLC
* Production release of v2025.1.
* UI overhaul with modern database tool interface: Split-pane layout, syntax highlighting with CodeMirror, auto-complete, query history, dark mode, improved results viewer.
* Built upon Tim Dietrich's original foundation with modern interface enhancements and improved user experience.

20250807 - Modular Refactoring by Matt Owen - Web Solutions Group, LLC
* Complete modular architecture implementation with separate modules for:
  - Core functionality (constants, modules, request handlers)
  - Data processing (query engine, file operations, document generation)
  - UI components (layouts, styles, modals)
  - Feature modules (editor, export, controls, query execution, history)
* Improved maintainability and extensibility while preserving all existing functionality.
* Created comprehensive lib/ directory structure with organized, focused modules.

*/

// Import the complete modular architecture
define([
    './lib/core/constants',
    './lib/core/modules',
    './lib/core/requestHandlers',
    './lib/ui/layouts/toolGenerator'
], function(constants, nsModules, requestHandlers, toolGenerator) {
    
    // Global variables for backward compatibility with existing HTML generation functions
    var scriptURL;
    var datatablesEnabled = constants.CONFIG.DATATABLES_ENABLED;
    var remoteLibraryEnabled = constants.CONFIG.REMOTE_LIBRARY_ENABLED;
    var rowsReturnedDefault = constants.CONFIG.ROWS_RETURNED_DEFAULT;
    var queryFolderID = constants.CONFIG.QUERY_FOLDER_ID;
    var toolUpgradesEnabled = constants.CONFIG.TOOL_UPGRADES_ENABLED;
    var workbooksEnabled = constants.CONFIG.WORKBOOKS_ENABLED;
    var version = constants.CONFIG.VERSION;
    
    // Legacy module references for backward compatibility with existing functions
    var file = nsModules.file;
    var https = nsModules.https;
    var log = nsModules.log;
    var message = nsModules.message;
    var query = nsModules.query;
    var record = nsModules.record;
    var render = nsModules.render;
    var runtime = nsModules.runtime;
    var serverWidget = nsModules.serverWidget;
    var url = nsModules.url;
    
    /**
     * Enhanced SuiteQL Query Tool - Modular Architecture
     * 
     * This is the main entry point for the Enhanced SuiteQL Query Tool.
     * It uses a complete modular architecture with separate modules for:
     * 
     * - Core functionality (constants, modules, request handlers)
     * - Data processing (query engine, file operations, document generation)
     * - UI components (layouts, styles, modals)
     * - Feature modules (editor, export, controls, query execution, history)
     * 
     * All original functionality is preserved while providing a clean,
     * maintainable, and extensible codebase.
     */
    return {
        onRequest: function(context) {
            try {
                // Set the script URL for use in HTML generation
                scriptURL = nsModules.scriptInfo.getScriptURL();
                
                // Use the complete modular request handler with UI modules
                requestHandlers.handleRequest(context, toolGenerator.htmlGenerateTool);
                
            } catch(error) {
                // Fallback error handling
                nsModules.logger.error('Main onRequest Error', error);
                context.response.write('An error occurred: ' + error.message);
            }
        }
    };
    
    // ========================================================================
    // Modular Architecture Complete
    // All functionality has been extracted to organized, focused modules
    // ========================================================================
    
});