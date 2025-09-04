/**
 * Format a phone number string into a standard format
 * 
 * @param {Object} context - Execution context
 * @param {string} context.params.phone_number - Phone number to format
 * @param {string} context.params.format - Format type ('us', 'international', 'digits')
 * @returns {string} Formatted phone number
 */
function format_phone(context) {
    var phone_number = context.params.phone_number || '';
    var format = (context.params.format || 'us').toLowerCase();
    
    // Remove all non-digit characters
    var digits = phone_number.replace(/\D/g, '');
    
    // Handle empty input
    if (!digits) {
        return '';
    }
    
    // Format based on requested format
    switch (format) {
        case 'us':
            return formatUSPhone(digits);
        case 'international':
            return formatInternationalPhone(digits);
        case 'digits':
            return digits;
        default:
            return formatUSPhone(digits);
    }
}

/**
 * Format as US phone number
 */
function formatUSPhone(digits) {
    if (digits.length === 10) {
        return '(' + digits.substr(0, 3) + ') ' + digits.substr(3, 3) + '-' + digits.substr(6, 4);
    } else if (digits.length === 11 && digits.charAt(0) === '1') {
        return '+1 (' + digits.substr(1, 3) + ') ' + digits.substr(4, 3) + '-' + digits.substr(7, 4);
    } else {
        return digits;
    }
}

/**
 * Format as international phone number
 */
function formatInternationalPhone(digits) {
    if (digits.length >= 10) {
        return '+' + digits.substr(0, digits.length - 10) + ' ' + digits.substr(-10);
    } else {
        return '+' + digits;
    }
}

// Function is automatically available by name