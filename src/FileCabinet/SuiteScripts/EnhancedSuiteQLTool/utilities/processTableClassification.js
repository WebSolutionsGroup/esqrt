/**
 * Process NetSuite Table Classification
 * 
 * This script reads the CSV file and generates the classified output
 */

const fs = require('fs');
const path = require('path');

// Classification rules
const CLASSIFICATION_RULES = {
    'Setup Data': {
        'Company': {
            patterns: [/company/i, /feature/i, /preference/i, /configuration/i, /config/i, /setup/i],
            families: ['SETUP'],
            keywords: ['company', 'feature', 'preference', 'configuration', 'setup']
        },
        'Subsidiaries': {
            patterns: [/subsidiary/i, /subsidiar/i],
            families: ['SETUP'],
            keywords: ['subsidiary']
        },
        'Departments': {
            patterns: [/department/i],
            families: ['SETUP'],
            keywords: ['department']
        },
        'Locations': {
            patterns: [/location/i],
            families: ['SETUP'],
            keywords: ['location']
        },
        'Classifications': {
            patterns: [/classification/i, /class/i],
            families: ['SETUP'],
            keywords: ['classification', 'class']
        },
        'Accounting': {
            patterns: [/account/i, /accounting/i, /fiscal/i, /period/i, /currency/i, /exchange/i, /budget/i],
            families: ['ACCOUNTING', 'SETUP'],
            keywords: ['account', 'accounting', 'fiscal', 'period', 'currency', 'exchange', 'budget']
        },
        'Sales': {
            patterns: [/team/i, /territory/i, /rule/i, /sales.*rule/i],
            families: ['SETUP'],
            keywords: ['team', 'territory', 'rule']
        },
        'Marketing': {
            patterns: [/category/i, /audience/i, /vertical/i, /family/i, /search.*engine/i, /channel/i, /offer/i],
            families: ['SETUP'],
            keywords: ['category', 'audience', 'vertical', 'family', 'channel', 'offer']
        },
        'Users': {
            patterns: [/user/i, /role/i, /permission/i],
            families: ['SETUP'],
            keywords: ['user', 'role', 'permission']
        }
    },
    'List Data': {
        'Accounting': {
            patterns: [/account/i, /subsidiary/i, /department/i, /location/i, /classification/i],
            families: ['ACCOUNTING', 'SETUP'],
            keywords: ['account', 'subsidiary', 'department', 'location', 'classification']
        },
        'Activities': {
            patterns: [/activity/i, /event/i, /call/i, /task/i, /calendar/i, /phone/i],
            families: ['EVENT', 'ACTIVITY'],
            keywords: ['activity', 'event', 'call', 'task', 'calendar', 'phone']
        },
        'Communications': {
            patterns: [/message/i, /note/i, /communication/i, /email/i],
            families: ['COMMUNICATION'],
            keywords: ['message', 'note', 'communication', 'email']
        },
        'Employees': {
            patterns: [/employee/i, /payroll/i, /hr/i, /timeoff/i, /time.*off/i],
            families: ['ENTITY'],
            keywords: ['employee', 'payroll', 'hr', 'timeoff']
        },
        'Items': {
            patterns: [/item/i, /inventory/i, /product/i, /assembly/i, /kit/i, /service/i, /non.*inventory/i],
            families: ['ITEM'],
            keywords: ['item', 'inventory', 'product', 'assembly', 'kit', 'service']
        },
        'Payment Instruments': {
            patterns: [/token/i, /payment.*card/i, /payment.*instrument/i],
            families: ['PAYMENT'],
            keywords: ['token', 'payment', 'card', 'instrument']
        },
        'Relationships': {
            patterns: [/customer/i, /vendor/i, /prospect/i, /lead/i, /partner/i, /contact/i, /entity/i],
            families: ['ENTITY'],
            keywords: ['customer', 'vendor', 'prospect', 'lead', 'partner', 'contact', 'entity']
        }
    },
    'Transaction Data': {
        'Bank': {
            patterns: [/check/i, /deposit/i, /transfer/i, /credit.*card/i, /bank/i],
            families: ['TRANSACTION'],
            keywords: ['check', 'deposit', 'transfer', 'credit', 'bank']
        },
        'Purchases': {
            patterns: [/purchase/i, /requisition/i, /quote/i, /contract/i, /receipt/i, /po/i, /purchase.*order/i],
            families: ['TRANSACTION'],
            keywords: ['purchase', 'requisition', 'quote', 'contract', 'receipt']
        },
        'Payables': {
            patterns: [/bill/i, /payment/i, /prepayment/i, /variance/i, /vendor.*bill/i, /vendor.*payment/i],
            families: ['TRANSACTION'],
            keywords: ['bill', 'payment', 'prepayment', 'variance']
        },
        'Sales': {
            patterns: [/opportunity/i, /quote/i, /sales.*order/i, /cash.*sale/i, /statement/i, /so/i],
            families: ['TRANSACTION'],
            keywords: ['opportunity', 'quote', 'sales', 'cash', 'statement']
        },
        'Billing': {
            patterns: [/billing/i, /invoice/i, /invoicing/i],
            families: ['TRANSACTION'],
            keywords: ['billing', 'invoice', 'invoicing']
        },
        'Customers': {
            patterns: [/customer.*invoice/i, /customer.*payment/i, /credit.*memo/i, /refund/i, /return.*authorization/i, /deposit/i],
            families: ['TRANSACTION'],
            keywords: ['customer', 'invoice', 'payment', 'credit', 'refund', 'return', 'deposit']
        },
        'Order Management': {
            patterns: [/fulfillment/i, /fulfil/i, /shipment/i, /shipping/i],
            families: ['TRANSACTION'],
            keywords: ['fulfillment', 'fulfil', 'shipment', 'shipping']
        },
        'Employees': {
            patterns: [/expense.*report/i, /time.*entry/i, /time.*off/i, /payroll/i],
            families: ['TRANSACTION'],
            keywords: ['expense', 'time', 'payroll']
        },
        'Inventory': {
            patterns: [/inventory.*adjustment/i, /inventory.*count/i, /inventory.*transfer/i, /bin.*transfer/i, /revaluation/i],
            families: ['TRANSACTION'],
            keywords: ['inventory', 'adjustment', 'count', 'transfer', 'bin', 'revaluation']
        },
        'Manufacturing': {
            patterns: [/work.*order/i, /assembly.*build/i, /component/i, /completion/i, /manufacturing/i],
            families: ['TRANSACTION'],
            keywords: ['work', 'assembly', 'component', 'completion', 'manufacturing']
        },
        'Financial': {
            patterns: [/journal/i, /intercompany/i, /budget/i, /allocation/i, /revaluation/i],
            families: ['TRANSACTION'],
            keywords: ['journal', 'intercompany', 'budget', 'allocation', 'revaluation']
        }
    },
    'Customizations': {
        'Custom Lists': {
            patterns: [/^CUSTOMLIST/i],
            families: ['CUSTOMLIST'],
            keywords: ['customlist']
        },
        'Custom Records': {
            patterns: [/^CUSTOMRECORD/i],
            families: ['CUSTOM'],
            keywords: ['customrecord']
        },
        'Scripts': {
            patterns: [/script/i, /deployment/i, /suitescript/i],
            families: ['SCRIPT'],
            keywords: ['script', 'deployment', 'suitescript']
        },
        'Custom Objects': {
            patterns: [/custom.*record.*type/i, /custom.*list/i, /custom.*field/i],
            families: ['CUSTOM'],
            keywords: ['custom', 'record', 'type', 'list', 'field']
        }
    },
    'System Data': {
        'Workflow': {
            patterns: [/workflow/i, /approval/i, /state/i, /action/i],
            families: ['WORKFLOW'],
            keywords: ['workflow', 'approval', 'state', 'action']
        },
        'Integration': {
            patterns: [/integration/i, /api/i, /web.*service/i, /endpoint/i, /connector/i],
            families: ['INTEGRATION'],
            keywords: ['integration', 'api', 'web', 'service', 'endpoint', 'connector']
        },
        'Security': {
            patterns: [/security/i, /authentication/i, /authorization/i, /token/i, /oauth/i],
            families: ['SECURITY'],
            keywords: ['security', 'authentication', 'authorization', 'token', 'oauth']
        },
        'Audit': {
            patterns: [/audit/i, /log/i, /history/i, /trail/i],
            families: ['AUDIT'],
            keywords: ['audit', 'log', 'history', 'trail']
        },
        'System Configuration': {
            patterns: [/system/i, /configuration/i, /preference/i, /setting/i],
            families: ['SYSTEM'],
            keywords: ['system', 'configuration', 'preference', 'setting']
        }
    }
};

function classifyTable(tableData) {
    const tableId = tableData['Table ID'] || '';
    const tableName = tableData['Table Name'] || '';
    const tableLabel = tableData['Table Label'] || '';
    const recordFamily = tableData['Record Family'] || '';
    const isCustom = tableData['Is Custom'] === 'Yes';
    
    // Combine all text for pattern matching
    const searchText = `${tableId} ${tableName} ${tableLabel}`.toLowerCase();
    
    // Check each category and subcategory
    for (const [category, subcategories] of Object.entries(CLASSIFICATION_RULES)) {
        for (const [subcategory, rules] of Object.entries(subcategories)) {
            
            // Check family match
            if (rules.families && rules.families.includes(recordFamily)) {
                // Additional pattern validation for family matches
                if (rules.patterns) {
                    const hasPatternMatch = rules.patterns.some(pattern => pattern.test(searchText));
                    if (hasPatternMatch) {
                        return { category, subcategory, confidence: 'high' };
                    }
                }
                // Family match without pattern validation (medium confidence)
                return { category, subcategory, confidence: 'medium' };
            }
            
            // Check pattern match
            if (rules.patterns) {
                const hasPatternMatch = rules.patterns.some(pattern => pattern.test(searchText));
                if (hasPatternMatch) {
                    return { category, subcategory, confidence: 'high' };
                }
            }
            
            // Check keyword match
            if (rules.keywords) {
                const hasKeywordMatch = rules.keywords.some(keyword => 
                    searchText.includes(keyword.toLowerCase())
                );
                if (hasKeywordMatch) {
                    return { category, subcategory, confidence: 'medium' };
                }
            }
        }
    }
    
    // Default classification for unmatched tables
    if (isCustom) {
        if (tableId.startsWith('CUSTOMLIST')) {
            return { category: 'Customizations', subcategory: 'Custom Lists', confidence: 'high' };
        } else if (tableId.startsWith('CUSTOMRECORD')) {
            return { category: 'Customizations', subcategory: 'Custom Records', confidence: 'high' };
        } else {
            return { category: 'Customizations', subcategory: 'Custom Objects', confidence: 'low' };
        }
    }
    
    // Family-based fallback classification
    switch (recordFamily) {
        case 'TRANSACTION':
            return { category: 'Transaction Data', subcategory: 'Other Transactions', confidence: 'low' };
        case 'ENTITY':
            return { category: 'List Data', subcategory: 'Relationships', confidence: 'low' };
        case 'ITEM':
            return { category: 'List Data', subcategory: 'Items', confidence: 'low' };
        case 'SETUP':
            return { category: 'Setup Data', subcategory: 'Other Setup', confidence: 'low' };
        case 'EVENT':
            return { category: 'List Data', subcategory: 'Activities', confidence: 'low' };
        case 'ACCOUNTING':
            return { category: 'Setup Data', subcategory: 'Accounting', confidence: 'low' };
        default:
            return { category: 'System Data', subcategory: 'Other System', confidence: 'low' };
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function escapeCSV(value) {
    if (!value) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
}

// Main processing
console.log('🎯 Processing NetSuite table classification...');

const inputFile = 'src/FileCabinet/SuiteScripts/EnhancedSuiteQLTool/utilities/netsuite_tables_metadata_2025-09-19T00-23-51.csv';
const outputFile = 'src/FileCabinet/SuiteScripts/EnhancedSuiteQLTool/utilities/netsuite_tables_classified_2025-09-19.csv';

try {
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log(`📋 Found ${lines.length - 1} tables to classify`);
    
    const classifiedData = [];
    const stats = {};
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                
                const classification = classifyTable(row);
                
                const classifiedRow = {
                    'Table ID': row['Table ID'],
                    'Table Label': row['Table Label'],
                    'Data Type': classification.category,
                    'Category': classification.subcategory,
                    'Confidence': classification.confidence,
                    'Record Family': row['Record Family'],
                    'Is Custom': row['Is Custom']
                };
                
                classifiedData.push(classifiedRow);
                
                // Update stats
                const key = `${classification.category} - ${classification.subcategory}`;
                stats[key] = (stats[key] || 0) + 1;
            }
        }
    }
    
    console.log('📊 Classification Statistics:');
    Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            console.log(`   ${category}: ${count} tables`);
        });
    
    // Generate output CSV
    const outputHeaders = ['Table ID', 'Table Label', 'Data Type', 'Category', 'Confidence', 'Record Family', 'Is Custom'];
    const csvRows = [outputHeaders];
    
    classifiedData.forEach(row => {
        csvRows.push([
            escapeCSV(row['Table ID']),
            escapeCSV(row['Table Label']),
            escapeCSV(row['Data Type']),
            escapeCSV(row['Category']),
            escapeCSV(row['Confidence']),
            escapeCSV(row['Record Family']),
            escapeCSV(row['Is Custom'])
        ]);
    });
    
    const outputCSV = csvRows.map(row => row.join(',')).join('\n');
    fs.writeFileSync(outputFile, outputCSV);
    
    console.log(`🎉 Classification complete!`);
    console.log(`📁 Output saved to: ${outputFile}`);
    console.log(`📈 Total tables classified: ${classifiedData.length}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
}

module.exports = { classifyTable, CLASSIFICATION_RULES };
