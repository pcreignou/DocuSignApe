import {
    LightningElement,
    api,
    wire,
    track
} from 'lwc';
import {
    ShowToastEvent
} from 'lightning/platformShowToastEvent';

import {
    getRecord
} from 'lightning/uiRecordApi';
import {
    getObjectInfo,
    getPicklistValues
} from "lightning/uiObjectInfoApi";

import {
    NavigationMixin
} from "lightning/navigation";

import contactLookup from '@salesforce/apex/ContactController.contactLookup';

import OPP_NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import DFSLE_RECIPIENT from '@salesforce/schema/dfsle__Recipient__c';

import RECIPIENT_TYPE from '@salesforce/schema/dfsle__Recipient__c.dfsle__Type__c';

export default class SelectRecipients extends NavigationMixin(LightningElement) {
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


    @track listOfRecipients;

    @track envelopeOptions;

    recipientRecordTypeId;
    recipientTypes;
    recipientLookup;

    

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
    

    initData() {

        this.dfsle__EmailMessage__c = 'TBD Email Message';
        this.dfsle__EmailSubject__c = 'TBD Subject';
        let listOfRecipients = [];
        
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

    nextStep() {

        this[NavigationMixin.Navigate]({
            type: 'standard__component',
            attributes: {
                componentName: "c__signatureOptions"               
            },
            state: {
                recordId: this.recordId,
                listOfRecipients: this.listOfRecipients
            }
        });
    }

}