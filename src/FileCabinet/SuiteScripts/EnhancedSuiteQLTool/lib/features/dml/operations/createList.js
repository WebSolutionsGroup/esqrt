/**
 * @fileoverview CREATE LIST DML Operation
 * 
 * This module handles the execution of CREATE LIST statements,
 * creating custom lists with values and translations in NetSuite.
 * 
 * @author Enhanced SuiteQL Tool
 * @version 1.0.0
 */

define(['N/record', 'N/error', 'N/log'], function(record, error, log) {
    'use strict';

    // Supported languages for translations
    var SUPPORTED_LANGUAGES = [
        'zh_CN', 'zh_TW', 'cs_CZ', 'da_DK', 'nl_NL', 'en_AU', 'en_CA', 'en_GB', 'en_US',
        'fi_FI', 'fr_FR', 'fr_CA', 'de_DE', 'id_ID', 'it_IT', 'ja_JP', 'ko_KR', 'no_NO',
        'pl_PL', 'pt_BR', 'ru_RU', 'es_ES', 'es_419', 'sv_SE', 'th_TH', 'tr_TR'
    ];

    /**
     * Execute CREATE LIST operation
     * 
     * @param {Object} parsedStatement - Parsed CREATE LIST statement
     * @returns {Object} Execution result
     */
    function execute(parsedStatement) {
        log.debug({
            title: 'Executing CREATE LIST',
            details: 'List ID: ' + parsedStatement.listId + ', Values: ' + parsedStatement.options.values.length
        });

        try {
            // Create the custom list
            var listTypeId = createCustomList(parsedStatement);
            
            // Log success
            log.audit({
                title: 'CREATE LIST Success',
                details: 'Created list: ' + parsedStatement.fullListId + ' with ' + parsedStatement.options.values.length + ' values'
            });

            return {
                success: true,
                result: {
                    listTypeId: listTypeId,
                    listId: parsedStatement.fullListId,
                    valuesCreated: parsedStatement.options.values.length,
                    values: parsedStatement.options.values
                },
                error: null,
                message: 'Custom list ' + parsedStatement.fullListId + ' created successfully with ' + parsedStatement.options.values.length + ' values',
                metadata: {
                    operation: 'CREATE_LIST',
                    listId: parsedStatement.listId,
                    fullListId: parsedStatement.fullListId,
                    displayName: parsedStatement.displayName
                }
            };

        } catch (executionError) {
            log.error({
                title: 'CREATE LIST Error',
                details: 'List ID: ' + parsedStatement.listId + ', Error: ' + executionError.message
            });

            return {
                success: false,
                result: null,
                error: executionError.message,
                message: null,
                metadata: {
                    operation: 'CREATE_LIST',
                    listId: parsedStatement.listId,
                    errorType: executionError.name || 'EXECUTION_ERROR'
                }
            };
        }
    }

    /**
     * Create custom list
     * 
     * @param {Object} parsedStatement - Parsed CREATE LIST statement
     * @returns {string} List type internal ID
     */
    function createCustomList(parsedStatement) {
        log.debug({
            title: 'Creating custom list',
            details: 'Script ID: ' + parsedStatement.fullListId + ', Name: ' + parsedStatement.displayName
        });

        var customList = record.create({
            type: record.Type.CUSTOM_LIST
        });

        // NetSuite automatically adds 'customlist_' prefix, so only pass the suffix
        var listScriptId = parsedStatement.fullListId.replace(/^customlist_/, '');

        customList.setValue({
            fieldId: 'scriptid',
            value: listScriptId
        });

        customList.setValue({
            fieldId: 'name',
            value: parsedStatement.displayName
        });

        customList.setValue({
            fieldId: 'description',
            value: parsedStatement.options.description || ''
        });

        customList.setValue({
            fieldId: 'isordered',
            value: parsedStatement.options.optionsorder === 'ORDER_ENTERED'
        });

        customList.setValue({
            fieldId: 'ismatrixoption',
            value: parsedStatement.options.matrixoption === true
        });

        customList.setValue({
            fieldId: 'isinactive',
            value: parsedStatement.options.isinactive === true
        });

        // Add list values
        addListValues(customList, parsedStatement.options.values);

        var listTypeId = customList.save();

        log.debug({
            title: 'Custom list created',
            details: 'Internal ID: ' + listTypeId + ', Script ID: ' + parsedStatement.fullListId
        });

        return listTypeId;
    }

    /**
     * Add values to the custom list
     * 
     * @param {Object} customList - Custom list record
     * @param {Array} values - Array of value objects
     */
    function addListValues(customList, values) {
        values.forEach(function(value, index) {
            try {
                // Set basic value properties
                customList.setSublistValue({
                    sublistId: 'customvalue',
                    fieldId: 'value',
                    line: index,
                    value: value.value
                });

                // Set abbreviation if provided
                if (value.abbreviation) {
                    customList.setSublistValue({
                        sublistId: 'customvalue',
                        fieldId: 'abbreviation',
                        line: index,
                        value: value.abbreviation
                    });
                }

                // Set inactive status
                customList.setSublistValue({
                    sublistId: 'customvalue',
                    fieldId: 'isinactive',
                    line: index,
                    value: value.inactive === true
                });

                // Add translations
                addValueTranslations(customList, index, value.translations || []);

                log.debug({
                    title: 'List value added',
                    details: 'Index: ' + index + ', Value: ' + value.value + ', Translations: ' + (value.translations ? value.translations.length : 0)
                });

            } catch (valueError) {
                log.error({
                    title: 'Error adding list value',
                    details: 'Index: ' + index + ', Value: ' + value.value + ', Error: ' + valueError.message
                });
                throw valueError;
            }
        });
    }

    /**
     * Add translations for a list value
     * 
     * @param {Object} customList - Custom list record
     * @param {number} lineIndex - Line index for the value
     * @param {Array} translations - Array of translation objects
     */
    function addValueTranslations(customList, lineIndex, translations) {
        translations.forEach(function(translation) {
            // Validate language
            if (!SUPPORTED_LANGUAGES.includes(translation.language)) {
                throw error.create({
                    name: 'INVALID_LANGUAGE',
                    message: 'Unsupported language: ' + translation.language
                });
            }

            try {
                // Set translation value
                customList.setSublistValue({
                    sublistId: 'customvalue',
                    fieldId: 'translation_' + translation.language,
                    line: lineIndex,
                    value: translation.value
                });

                log.debug({
                    title: 'Translation added',
                    details: 'Line: ' + lineIndex + ', Language: ' + translation.language + ', Value: ' + translation.value
                });

            } catch (translationError) {
                log.error({
                    title: 'Error adding translation',
                    details: 'Line: ' + lineIndex + ', Language: ' + translation.language + ', Error: ' + translationError.message
                });
                throw translationError;
            }
        });
    }

    /**
     * Get supported languages for translations
     * 
     * @returns {Array} Array of supported language codes
     */
    function getSupportedLanguages() {
        return SUPPORTED_LANGUAGES.slice(); // Return a copy
    }

    /**
     * Check if language is supported for translations
     * 
     * @param {string} language - Language code to check
     * @returns {boolean} True if supported
     */
    function isLanguageSupported(language) {
        return SUPPORTED_LANGUAGES.includes(language);
    }

    /**
     * Validate list options
     * 
     * @param {Object} options - List options to validate
     * @returns {Object} Validation result
     */
    function validateListOptions(options) {
        var validation = {
            isValid: true,
            errors: []
        };

        if (!options || typeof options !== 'object') {
            validation.isValid = false;
            validation.errors.push('Options object is required');
            return validation;
        }

        // Validate values array
        if (!options.values || !Array.isArray(options.values)) {
            validation.isValid = false;
            validation.errors.push('Values array is required');
        } else if (options.values.length === 0) {
            validation.isValid = false;
            validation.errors.push('At least one value is required');
        } else {
            // Validate individual values
            options.values.forEach(function(value, index) {
                if (!value.value || typeof value.value !== 'string') {
                    validation.isValid = false;
                    validation.errors.push('Value at index ' + index + ' must have a non-empty string value');
                }

                // Validate translations if present
                if (value.translations && Array.isArray(value.translations)) {
                    value.translations.forEach(function(translation, transIndex) {
                        if (!translation.language || !isLanguageSupported(translation.language)) {
                            validation.isValid = false;
                            validation.errors.push('Invalid language at value ' + index + ', translation ' + transIndex + ': ' + translation.language);
                        }
                        if (!translation.value || typeof translation.value !== 'string') {
                            validation.isValid = false;
                            validation.errors.push('Translation value required at value ' + index + ', translation ' + transIndex);
                        }
                    });
                }
            });
        }

        return validation;
    }

    // Public API
    return {
        execute: execute,
        createCustomList: createCustomList,
        addListValues: addListValues,
        addValueTranslations: addValueTranslations,
        getSupportedLanguages: getSupportedLanguages,
        isLanguageSupported: isLanguageSupported,
        validateListOptions: validateListOptions,
        SUPPORTED_LANGUAGES: SUPPORTED_LANGUAGES
    };
});
