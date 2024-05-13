import {
    LightningElement,api
  
} from 'lwc';


import {
    NavigationMixin
} from "lightning/navigation";



export default class SelectSignatureOptions extends NavigationMixin(LightningElement)  {
    
    @api recordId;
    @api listOfRecipients;
    @api dfsle__EmailMessage__c= 'Message TBD';
    @api dfsle__EmailSubject__c = 'Subject TBD';

    handleMessageChange(event) {      
        this.dfsle__EmailMessage__c = event.target.value;
    }

    handleSubjectChange(event) {       
        this.dfsle__EmailSubject__c = event.target.value;
    }

    nextStep() {

        this[NavigationMixin.Navigate]({
            type: 'standard__component',
            attributes: {
                componentName: "c__sendToDocuSign"               
            },
            state: {
                recordId: this.recordId,
                listOfRecipients: this.listOfRecipients,
                dfsle__EmailMessage__c: this.dfsle__EmailMessage__c,
                dfsle__EmailSubject__c: this.dfsle__EmailSubject__c
            }
        });
    }


}