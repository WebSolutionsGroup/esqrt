/**
 * Calculate tax amount based on amount and state
 * 
 * @param {Object} context - Execution context
 * @param {number} context.params.amount - Amount to calculate tax on
 * @param {string} context.params.state - State code for tax calculation
 * @returns {number} Calculated tax amount
 */
function calculate_tax(context) {
    var amount = parseFloat(context.params.amount) || 0;
    var state = (context.params.state || '').toUpperCase().trim();
    
    // Tax rates by state (simplified example)
    var taxRates = {
        'CA': 0.0875,  // California
        'NY': 0.08,    // New York
        'TX': 0.0625,  // Texas
        'FL': 0.06,    // Florida
        'WA': 0.065,   // Washington
        'OR': 0.0,     // Oregon (no sales tax)
        'NH': 0.0,     // New Hampshire (no sales tax)
        'MT': 0.0,     // Montana (no sales tax)
        'DE': 0.0,     // Delaware (no sales tax)
        'AK': 0.0      // Alaska (no state sales tax)
    };
    
    // Default tax rate for unknown states
    var defaultRate = 0.05;
    
    // Get tax rate for state
    var taxRate = taxRates.hasOwnProperty(state) ? taxRates[state] : defaultRate;
    
    // Calculate tax
    var taxAmount = amount * taxRate;
    
    // Round to 2 decimal places
    return Math.round(taxAmount * 100) / 100;
}
