/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - CSV Export Configuration
 * 
 * This module manages CSV export configuration settings including
 * delimiters, quote characters, escape characters, line endings,
 * header options, and encoding preferences with localStorage persistence.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Default CSV export configuration
     */
    var DEFAULT_CONFIG = {
        delimiter: ',',
        quoteChar: '"',
        escapeChar: '"', // Use quote doubling by default (CSV standard)
        lineEnding: '\n',
        includeHeaders: true,
        encoding: 'utf-8',
        encodingBOM: true,
        customHeaders: {},
        nullValue: '',
        dateFormat: 'iso', // iso, us, eu, custom
        numberFormat: 'default', // default, us, eu
        trimWhitespace: false,
        preset: 'standard'
    };
    
    /**
     * Predefined CSV export presets
     */
    var PRESETS = {
        standard: {
            name: 'Standard CSV',
            description: 'RFC 4180 compliant CSV format',
            config: {
                delimiter: ',',
                quoteChar: '"',
                escapeChar: '"',
                lineEnding: '\n',
                includeHeaders: true,
                encoding: 'utf-8',
                encodingBOM: false
            }
        },
        excel: {
            name: 'Excel Compatible',
            description: 'CSV format optimized for Microsoft Excel',
            config: {
                delimiter: ',',
                quoteChar: '"',
                escapeChar: '"',
                lineEnding: '\r\n',
                includeHeaders: true,
                encoding: 'utf-8',
                encodingBOM: true
            }
        },
        tab: {
            name: 'Tab Delimited',
            description: 'Tab-separated values format',
            config: {
                delimiter: '\t',
                quoteChar: '"',
                escapeChar: '"',
                lineEnding: '\n',
                includeHeaders: true,
                encoding: 'utf-8',
                encodingBOM: false
            }
        },
        semicolon: {
            name: 'Semicolon Delimited',
            description: 'European CSV format using semicolons',
            config: {
                delimiter: ';',
                quoteChar: '"',
                escapeChar: '"',
                lineEnding: '\r\n',
                includeHeaders: true,
                encoding: 'utf-8',
                encodingBOM: true
            }
        },
        pipe: {
            name: 'Pipe Delimited',
            description: 'Pipe-separated values format',
            config: {
                delimiter: '|',
                quoteChar: '"',
                escapeChar: '"',
                lineEnding: '\n',
                includeHeaders: true,
                encoding: 'utf-8',
                encodingBOM: false
            }
        },
        minimal: {
            name: 'Minimal Quoting',
            description: 'Only quote when necessary',
            config: {
                delimiter: ',',
                quoteChar: '',
                escapeChar: '\\',
                lineEnding: '\n',
                includeHeaders: true,
                encoding: 'utf-8',
                encodingBOM: false
            }
        }
    };
    
    /**
     * Available delimiter options
     */
    var DELIMITER_OPTIONS = [
        { value: ',', label: 'Comma (,)', description: 'Standard CSV delimiter' },
        { value: ';', label: 'Semicolon (;)', description: 'European CSV format' },
        { value: '\t', label: 'Tab (\\t)', description: 'Tab-separated values' },
        { value: '|', label: 'Pipe (|)', description: 'Pipe-separated values' },
        { value: ' ', label: 'Space ( )', description: 'Space-separated values' },
        { value: 'custom', label: 'Custom', description: 'Specify your own delimiter' }
    ];
    
    /**
     * Available quote character options
     */
    var QUOTE_OPTIONS = [
        { value: '"', label: 'Double Quote (")', description: 'Standard CSV quote character' },
        { value: "'", label: "Single Quote (')", description: 'Alternative quote character' },
        { value: '', label: 'None', description: 'No quote enclosure' }
    ];
    
    /**
     * Available line ending options
     */
    var LINE_ENDING_OPTIONS = [
        { value: '\n', label: 'Unix (\\n)', description: 'Unix/Linux/Mac line ending' },
        { value: '\r\n', label: 'Windows (\\r\\n)', description: 'Windows line ending' },
        { value: '\r', label: 'Legacy Mac (\\r)', description: 'Classic Mac line ending' }
    ];
    
    /**
     * Available encoding options
     */
    var ENCODING_OPTIONS = [
        { value: 'utf-8', label: 'UTF-8', description: 'Unicode encoding (recommended)' },
        { value: 'utf-8-bom', label: 'UTF-8 with BOM', description: 'UTF-8 with Byte Order Mark (Excel compatible)' },
        { value: 'utf-16le', label: 'UTF-16 LE', description: 'UTF-16 Little Endian' },
        { value: 'ascii', label: 'ASCII', description: 'Basic ASCII encoding' },
        { value: 'iso-8859-1', label: 'ISO-8859-1', description: 'Latin-1 encoding' }
    ];
    
    /**
     * Get current CSV configuration from localStorage or defaults
     * 
     * @returns {Object} Current CSV configuration
     */
    function getCurrentConfig() {
        try {
            var saved = localStorage.getItem('suiteql-csv-config');
            if (saved) {
                var config = JSON.parse(saved);
                // Merge with defaults to ensure all properties exist
                return Object.assign({}, DEFAULT_CONFIG, config);
            }
        } catch (e) {
            console.warn('Could not load CSV config from localStorage:', e);
        }
        return Object.assign({}, DEFAULT_CONFIG);
    }
    
    /**
     * Save CSV configuration to localStorage
     * 
     * @param {Object} config - CSV configuration to save
     */
    function saveConfig(config) {
        try {
            localStorage.setItem('suiteql-csv-config', JSON.stringify(config));
        } catch (e) {
            console.warn('Could not save CSV config to localStorage:', e);
        }
    }
    
    /**
     * Apply a preset configuration
     * 
     * @param {string} presetName - Name of the preset to apply
     * @returns {Object} Applied configuration
     */
    function applyPreset(presetName) {
        if (!PRESETS[presetName]) {
            throw new Error('Unknown preset: ' + presetName);
        }
        
        var config = Object.assign({}, DEFAULT_CONFIG, PRESETS[presetName].config);
        config.preset = presetName;
        saveConfig(config);
        return config;
    }
    
    /**
     * Validate CSV configuration
     * 
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result with valid flag and messages
     */
    function validateConfig(config) {
        var result = {
            valid: true,
            warnings: [],
            errors: []
        };
        
        // Validate delimiter
        if (!config.delimiter || config.delimiter.length === 0) {
            result.errors.push('Delimiter cannot be empty');
            result.valid = false;
        } else if (config.delimiter.length > 1 && config.delimiter !== '\t') {
            result.warnings.push('Multi-character delimiters may not be compatible with all CSV parsers');
        }
        
        // Check for delimiter conflicts
        if (config.delimiter === config.quoteChar && config.quoteChar !== '') {
            result.errors.push('Delimiter and quote character cannot be the same');
            result.valid = false;
        }
        
        // Validate quote character
        if (config.quoteChar && config.quoteChar.length > 1) {
            result.warnings.push('Multi-character quote characters may not be compatible with all CSV parsers');
        }
        
        // Validate escape character
        if (config.escapeChar && config.escapeChar.length > 1) {
            result.warnings.push('Multi-character escape characters may not be compatible with all CSV parsers');
        }
        
        // Check for newlines in delimiter or quote char
        if (config.delimiter.includes('\n') || config.delimiter.includes('\r')) {
            result.errors.push('Delimiter cannot contain newline characters');
            result.valid = false;
        }
        
        if (config.quoteChar && (config.quoteChar.includes('\n') || config.quoteChar.includes('\r'))) {
            result.errors.push('Quote character cannot contain newline characters');
            result.valid = false;
        }
        
        return result;
    }
    
    /**
     * Get available presets
     * 
     * @returns {Object} Available presets
     */
    function getPresets() {
        return PRESETS;
    }
    
    /**
     * Get delimiter options
     * 
     * @returns {Array} Available delimiter options
     */
    function getDelimiterOptions() {
        return DELIMITER_OPTIONS;
    }
    
    /**
     * Get quote character options
     * 
     * @returns {Array} Available quote character options
     */
    function getQuoteOptions() {
        return QUOTE_OPTIONS;
    }
    
    /**
     * Get line ending options
     * 
     * @returns {Array} Available line ending options
     */
    function getLineEndingOptions() {
        return LINE_ENDING_OPTIONS;
    }
    
    /**
     * Get encoding options
     * 
     * @returns {Array} Available encoding options
     */
    function getEncodingOptions() {
        return ENCODING_OPTIONS;
    }
    
    /**
     * Export the CSV configuration functions
     */
    return {
        getCurrentConfig: getCurrentConfig,
        saveConfig: saveConfig,
        applyPreset: applyPreset,
        validateConfig: validateConfig,
        getPresets: getPresets,
        getDelimiterOptions: getDelimiterOptions,
        getQuoteOptions: getQuoteOptions,
        getLineEndingOptions: getLineEndingOptions,
        getEncodingOptions: getEncodingOptions,
        DEFAULT_CONFIG: DEFAULT_CONFIG
    };
    
});
