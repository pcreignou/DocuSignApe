import { LightningElement, api } from 'lwc';

import {
    NavigationMixin
} from "lightning/navigation";


export default class SendForSignature extends NavigationMixin(LightningElement) {
    
    @api recordId

    @api listOfRecipients    
    @api dfsle__EmailMessage__c;
    @api dfsle__EmailSubject__c;

    connectedCallback() {

       
            console.log('##recordID : ' + this.recordId);
            console.log('##Properties : '+JSON.stringify(this.listOfRecipients) + this.dfsle__EmailMessage__c+ this.dfsle__EmailSubject__c)
        

     

    }  


    
}