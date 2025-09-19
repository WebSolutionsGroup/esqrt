/**
 * NetSuite Table Classification Engine
 * 
 * Intelligently classifies NetSuite tables into categories and subcategories
 * based on NetSuite's navigation hierarchy and table characteristics.
 */

// Classification rules based on NetSuite hierarchy and table patterns
const CLASSIFICATION_RULES = {
    
    // Setup Data
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

    // List Data
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

    // Transaction Data
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

    // Customizations
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

    // System Data
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

/**
 * Classify a table based on its properties
 */
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

/**
 * Export the classification function for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { classifyTable, CLASSIFICATION_RULES };
} else if (typeof window !== 'undefined') {
    window.NetSuiteTableClassifier = { classifyTable, CLASSIFICATION_RULES };
}
