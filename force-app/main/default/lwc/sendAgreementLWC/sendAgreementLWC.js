import {
    LightningElement,
    api,
    wire,
    track
} from 'lwc';
import {
    ShowToastEvent
} from 'lightning/platformShowToastEvent';
import createEnvelope from '@salesforce/apex/DocuSignEnvelopeController.createEnvelope';
import sendEnvelope from '@salesforce/apex/DocuSignEnvelopeController.sendEnvelope';
import deleteEnvelope from '@salesforce/apex/DocuSignEnvelopeController.deleteEnvelope';
import {
    getRecord
} from 'lightning/uiRecordApi';
import {
    getObjectInfo,
    getPicklistValues
} from "lightning/uiObjectInfoApi";
import {
    getRelatedListRecords
} from 'lightning/uiRelatedListApi';
import {
    NavigationMixin
} from "lightning/navigation";
import getFiles from '@salesforce/apex/AgreementController.getFiles';
import contactLookup from '@salesforce/apex/ContactController.contactLookup';
import getRecipientPreviewUrl from '@salesforce/apex/DocuSignEnvelopeController.getRecipientPreviewUrl';
import OPP_NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import DFSLE_RECIPIENT from '@salesforce/schema/dfsle__Recipient__c';
import DFSLE_ENVELOPE from '@salesforce/schema/dfsle__Envelope__c';
import RECIPIENT_NAME from '@salesforce/schema/dfsle__Recipient__c.Name';
import RECIPIENT_ROLE from '@salesforce/schema/dfsle__Recipient__c.dfsle__Role__c';
import RECIPIENT_TYPE from '@salesforce/schema/dfsle__Recipient__c.dfsle__Type__c';
import RECIPIENT_EMAIL from '@salesforce/schema/dfsle__Recipient__c.dfsle__Email__c';
import RECIPIENT_ORDER from '@salesforce/schema/dfsle__Recipient__c.dfsle__RoutingOrder__c';
import RECIPIENT_ID from '@salesforce/schema/dfsle__Recipient__c.dfsle__Sequence__c';

export default class SendAgreementLWC extends NavigationMixin(LightningElement) {
    @api
    isSending = false;
    @api recordId;
    @api objectApiName;

    @api envelopeApiName;


    @wire(getRecord, {
        recordId: '$recordId',
        fields: [OPP_NAME_FIELD]
    })
    opportunity;

    relatedFiles;



    @track listOfRecipients;

    @track envelopeOptions;


    recipientRecordTypeId;
    recipientTypes;
    recipientLookup;

    envelopeId;

    @wire(getObjectInfo, {
        objectApiName: DFSLE_RECIPIENT
    })
    results({
        error,
        data
    }) {
        if (data) {
            this.recipientRecordTypeId = data.defaultRecordTypeId;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.recipientRecordTypeId = undefined;
        }
    }

    @wire(getPicklistValues, {
        recordTypeId: "$recipientRecordTypeId",
        fieldApiName: RECIPIENT_TYPE
    })
    picklistResults({
        error,
        data
    }) {
        if (data) {
            this.recipientTypes = data.values;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.recipientTypes = undefined;
        }
    }



    connectedCallback() {

        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(() => {
            console.log('##recordID : ' + this.recordId);
            this.initData();

        }, 0);

    }

    dfsle__EmailMessage__c;
    dfsle__EmailSubject__c;

    isPreviewed = false;

    handleMessageChange(event) {
        this.dfsle__EmailMessage__c = event.target.value;
    }

    handleSubjectChange(event) {
        this.dfsle__EmailSubject__c = event.target.value;
    }

    initData() {

        this.dfsle__EmailMessage__c = 'TBD Email Message';
        this.dfsle__EmailSubject__c = 'TBD Subject';
        let listOfRecipients = [];
        //this.createRow(listOfRecipients);
        this.signerLookup(listOfRecipients);
        this.listOfRecipients = listOfRecipients;

    }



    signerLookup(listOfRecipients) {

        let recipientObject = {};
        contactLookup({
                recordId: this.recordId
            })
            .then(result => {

                console.log('## lookup recipient for record ' + JSON.stringify(result));
                let cursor = 0;

                if (listOfRecipients.length > 0) {
                    recipientObject.index = listOfRecipients[listOfRecipients.length - 1].index + 1;
                    cursor = listOfRecipients[listOfRecipients.length - 1].index + 1;
                } else {
                    recipientObject.index = 1;
                    cursor = 1;
                }
                console.log('##lookup recipient ' + result.Name);
                recipientObject.Name = result.Name;
                recipientObject.dfsle__Email__c = result.Email;
                recipientObject.dfsle__Type__c = 'Signer';
                recipientObject.dfsle__RoutingOrder__c = cursor;
                recipientObject.dfsle__Role__c = 'Signer ' + cursor;
                listOfRecipients.push(recipientObject);
                this.listOfRecipients = listOfRecipients;

            }).then(
                this.createRow(this.listOfRecipients)
            )
            .catch(error => {
                this.error = error;
                this.listOfRecipients = undefined;
                const evt = new ShowToastEvent({
                    title: 'Recipient lookup Error',
                    message: error,
                    variant: this.variant,
                });
                this.dispatchEvent(evt);
            });

    }


    createRow(listOfRecipients) {
        console.log('adding new recipient' + JSON.stringify(listOfRecipients));
        let recipientObject = {};
        let cursor = 0;

        if (listOfRecipients.length > 0) {
            recipientObject.index = listOfRecipients[listOfRecipients.length - 1].index + 1;
            cursor = listOfRecipients[listOfRecipients.length - 1].index + 1;
        } else {
            recipientObject.index = 1;
            cursor = 1;
        }
        recipientObject.Name = null;
        recipientObject.dfsle__Email__c = null;
        recipientObject.dfsle__Type__c = 'Signer';
        recipientObject.dfsle__RoutingOrder__c = cursor;
        recipientObject.dfsle__Role__c = 'Signer ' + cursor;
        console.log('##adding new recipient ' + cursor);
        listOfRecipients.push(recipientObject);
    }
    /**
     * Adds a new row
     */
    addNewRow() {
        this.createRow(this.listOfRecipients);
    }
    /**
     * Removes the selected row
     */
    removeRow(event) {
        let toBeDeletedRowIndex = event.target.name;
        let listOfRecipients = [];
        for (let i = 0; i < this.listOfRecipients.length; i++) {
            let tempRecord = Object.assign({}, this.listOfRecipients[i]); //cloning object
            if (tempRecord.index !== toBeDeletedRowIndex) {
                listOfRecipients.push(tempRecord);
            }
        }
        for (let i = 0; i < listOfRecipients.length; i++) {
            listOfRecipients[i].index = i + 1;
        }
        this.listOfRecipients = listOfRecipients;
    }
    /**
     * Removes all rows
     */
    removeAllRows() {
        let listOfRecipients = [];
        this.createRow(listOfRecipients);
        this.listOfRecipients = listOfRecipients;
    }
    handleInputChange(event) {
        let index = event.target.dataset.id;
        let fieldName = event.target.name;
        let value = event.target.value;
        for (let i = 0; i < this.listOfRecipients.length; i++) {
            if (this.listOfRecipients[i].index === parseInt(index)) {
                this.listOfRecipients[i][fieldName] = value;
                console.log(fieldName + ':' + value);
            }
        }
    }

    handleClick() {
        const isInputsCorrect = [...this.template.querySelectorAll('lightning-input', 'lightning-combobox')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
        if (isInputsCorrect) {
            console.log('record:' + this.recordId);
            console.log('recipients : ' + JSON.stringify(this.listOfRecipients));
            this.isSending = !this.isSending;
            createEnvelope({
                    recordId: this.recordId,
                    rcpts: this.listOfRecipients,
                    emailSubject: this.dfsle__EmailSubject__c,
                    emailMessage: this.dfsle__EmailMessage__c,
                    sendNow: false,
                    draftEnvelope:null

                })
                .then((envelopeId) => {

                    this.msg = 'Sucess: ' + envelopeId + '';

                    console.log('Sucess:' + envelopeId);
                    this.envelopeId = envelopeId;
                    this.isSending = !this.isSending;
                    this.isPreviewed = true;

                })
                .catch((error) => {
                    this.msg = 'Error:' + error + '';
                    console.log('Error:');
                    console.log(error);
                });
        }
    }

    handlePreview() {

        console.log('record:' + this.recordId);
        console.log('envelope : ' + this.envelopeId);

        getRecipientPreviewUrl({
                envelopeId: this.envelopeId,
                sequence: 2

            })           
            .then((signingUrl)=> {
                console.log('### Preview URL : ');
                console.log(signingUrl);
                this.signingUrl = signingUrl;
                //window.location.href = sendingUrl;   
                //window.open(sendingUrl, '_blank');
                //window.open(sendingUrl);                
             
            }).then((signingUrl) =>(                   
                this.navigateToWebPage({
                   url: signingUrl
                })
            ))
            .catch((error) => {
                this.msg = 'Error:' + error + '';
                console.log('Error:');
                console.log(error);
            });


    }

    navigateToWebPage() {
        console.log('URL for preview: ');
        console.log(this.signingUrl);

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: this.signingUrl
            }
        });
    }

    handleSend() {
        
        
            console.log('record:' + this.recordId);
            console.log('recipients : ' + JSON.stringify(this.listOfRecipients));
            this.isSending = !this.isSending;
            deleteEnvelope({envelopeId:this.envelopeId})
            .then(createEnvelope({
                    recordId: this.recordId,
                    rcpts: this.listOfRecipients,
                    emailSubject: this.dfsle__EmailSubject__c,
                    emailMessage: this.dfsle__EmailMessage__c,
                    sendNow: true,
                    draftEnvelope:this.envelopeId

                })
                .then((envelopeId) => {

                    this.msg = 'Successfully Sent : ' + envelopeId + '';

                    console.log('SuccessFully sent:' + envelopeId);
                    this.envelopeId = envelopeId;
                    this.isSending = !this.isSending;
                    this.isPreviewed = true;

                })
                .catch((error) => {
                    this.msg = 'Error:' + error + '';
                    console.log('Error:');
                    console.log(error);
                })
            );
        
    }

    handleCancel() {
        
        
        console.log('record:' + this.recordId);
        this.isPreviewed = false;

        deleteEnvelope({               
                envelopeId: this.envelopeId
            })
            .then((envelopeId) => {

                this.msg = 'Successfully Deleted : ' + envelopeId + '';

                console.log('Deleted:' + envelopeId);
                this.envelopeId = envelopeId;
                this.isSending = !this.isSending;               

            })
            .catch((error) => {
                this.msg = 'Error:' + error + '';
                console.log('Error:');
                console.log(error);
            });
    
}

    handleSuccess(event) {
        const evt = new ShowToastEvent({
            title: 'Envelope Sent',
            message: 'Sent Envelope',
            variant: 'success',
        });
        this.dispatchEvent(evt);
    }

    handleFilesTab(event) {
        console.log('##display related files from ' + this.recordId);
        getFiles({
                recordId: this.recordId
            })
            .then(result => {
                this.relatedFiles = result;
                console.log('## added file ' + JSON.stringify(result))
            })
            .catch(error => {
                this.error = error;
                this.relatedFiles = undefined;
                const evt = new ShowToastEvent({
                    title: 'Files Error',
                    message: error,
                    variant: this.variant,
                });
                this.dispatchEvent(evt);
            });



    }

    handleAgreementView(event) {
        let fileId = event.target.name;
        console.log('opening Document  (' + fileId + ')')
        const fileUrl = `/sfc/servlet.shepherd/document/download/${fileId}`;
        window.open(fileUrl, '_blank');
        /*this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state : {
                selectedRecordId: docId
            }
        });*/

    }

}