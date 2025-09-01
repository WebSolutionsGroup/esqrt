/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/**
 * Enhanced SuiteQL Query Tool - Modal Components
 * 
 * This module contains all modal dialog HTML generators including
 * local load, remote load, save, and workbooks modals.
 * 
 * @author Matt Owen - Web Solutions Group, LLC
 * @version 2025.1
 */

define([
    '../../core/constants'
], function(constants) {
    
    /**
     * Generate the local load modal HTML
     * 
     * @returns {string} HTML string for the local load modal
     */
    function htmlLocalLoadModal() {
        return `
            <div class="modal fade" id="${constants.MODAL_IDS.LOCAL_LOAD}">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">Local Query Library</h4>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body" id="localSQLFilesList">								
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate the remote load modal HTML
     * 
     * @returns {string} HTML string for the remote load modal
     */
    function htmlRemoteLoadModal() {
        return `
            <div class="modal fade" id="${constants.MODAL_IDS.REMOTE_LOAD}">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">Remote Query Library</h4>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body" id="remoteSQLFilesList">								
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate the save modal HTML
     * 
     * @returns {string} HTML string for the save modal
     */
    function htmlSaveModal() {
        return `
            <div class="modal fade" id="${constants.MODAL_IDS.SAVE}">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">Save Query</h4>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        
                        <div class="modal-body" id="saveQueryMessage" style="display: none;">
                            ERROR
                        </div>

                        <div class="modal-body" id="saveQueryForm" style="display: none;">
                            <form class="row" style="margin-bottom: 24px;">
                                <div class="col-12" style="margin-top: 12px;">
                                    <p style="font-size: 10pt; margin-bottom: 3px;">File Name:</p>
                                    <input type="text" class="form-control" name="saveQueryFormFileName" id="saveQueryFormFileName" style="width: 200px; padding: 3px;" value="">
                                </div>
                                <div class="col-12" style="margin-top: 12px;">
                                    <p style="font-size: 10pt; margin-bottom: 3px;">Description:</p>
                                    <input type="text" class="form-control" name="saveQueryFormDescription" id="saveQueryFormDescription" style="width: 400px; padding: 3px;" value="">
                                </div>
                                <div class="col-12" style="margin-top: 12px;">							
                                    <button type="button" class="btn btn-sm btn-success" onclick="javascript:localSQLFileSave();">Save The Query &gt;</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate the workbooks modal HTML
     * 
     * @returns {string} HTML string for the workbooks modal
     */
    function htmlWorkbooksModal() {
        return `
            <div class="modal fade" id="${constants.MODAL_IDS.WORKBOOKS}">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">Workbooks</h4>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body" id="workbooksList">								
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate all modals HTML
     * 
     * @returns {string} HTML string containing all modals
     */
    function getAllModals() {
        return htmlLocalLoadModal() + 
               htmlRemoteLoadModal() + 
               htmlSaveModal() + 
               htmlWorkbooksModal();
    }
    
    /**
     * Generate modal-specific styles
     * 
     * @returns {string} CSS styles for modals
     */
    function getModalStyles() {
        return `
            <style type="text/css">
                /* Modal customizations for Code-OSS theme */
                .modal-content {
                    background-color: var(--codeoss-bg-secondary);
                    border: 1px solid var(--codeoss-border);
                    color: var(--codeoss-text-primary);
                }
                
                .modal-header {
                    background-color: var(--codeoss-bg-tertiary);
                    border-bottom: 1px solid var(--codeoss-border);
                }
                
                .modal-title {
                    color: var(--codeoss-text-primary);
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .modal-body {
                    background-color: var(--codeoss-bg-secondary);
                }
                
                .close {
                    color: var(--codeoss-text-primary);
                    opacity: 0.8;
                }
                
                .close:hover {
                    color: var(--codeoss-text-primary);
                    opacity: 1;
                }
                
                /* Form controls in modals */
                .modal .form-control {
                    background-color: var(--codeoss-input-bg);
                    border: 1px solid var(--codeoss-input-border);
                    color: var(--codeoss-text-primary);
                }
                
                .modal .form-control:focus {
                    background-color: var(--codeoss-input-bg);
                    border-color: var(--codeoss-accent);
                    color: var(--codeoss-text-primary);
                    box-shadow: 0 0 0 0.2rem rgba(0, 122, 204, 0.25);
                }
                
                /* Modal buttons */
                .modal .btn-success {
                    background-color: var(--codeoss-success);
                    border-color: var(--codeoss-success);
                }
                
                .modal .btn-success:hover {
                    background-color: #3d9970;
                    border-color: #3d9970;
                }
                
                .modal .btn-primary {
                    background-color: var(--codeoss-accent);
                    border-color: var(--codeoss-accent);
                }
                
                .modal .btn-primary:hover {
                    background-color: var(--codeoss-accent-hover);
                    border-color: var(--codeoss-accent-hover);
                }
                
                /* Modal tables */
                .modal .table {
                    color: var(--codeoss-text-primary);
                }
                
                .modal .table th {
                    background-color: var(--codeoss-bg-tertiary);
                    border-color: var(--codeoss-border);
                    color: var(--codeoss-text-primary);
                }
                
                .modal .table td {
                    border-color: var(--codeoss-border);
                }
                
                .modal .table-hover tbody tr:hover {
                    background-color: var(--codeoss-bg-tertiary);
                }
                
                /* Modal responsive tables */
                .modal .table-responsive {
                    border: 1px solid var(--codeoss-border);
                }
            </style>
        `;
    }
    
    /**
     * Export the modal functions
     */
    return {
        htmlLocalLoadModal: htmlLocalLoadModal,
        htmlRemoteLoadModal: htmlRemoteLoadModal,
        htmlSaveModal: htmlSaveModal,
        htmlWorkbooksModal: htmlWorkbooksModal,
        getAllModals: getAllModals,
        getModalStyles: getModalStyles
    };
    
});
