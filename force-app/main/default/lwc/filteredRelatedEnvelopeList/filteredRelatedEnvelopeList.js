import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import  getEnvelopeStatusRecords  from '@salesforce/apex/DocuSignStatusController.getStatusRecords';
import  getEnvelopeRecord from '@salesforce/apex/DSEnvelopeController.getEnvelopeRecord';

import ID_FIELD from '@salesforce/schema/dfsle__EnvelopeStatus__c.Id';
import STATUS_FIELD from '@salesforce/schema/dfsle__EnvelopeStatus__c.dfsle__Status__c';
import CREATED_DATE from '@salesforce/schema/dfsle__EnvelopeStatus__c.CreatedDate';
import SUBJECT_FIELD from '@salesforce/schema/dfsle__EnvelopeStatus__c.dfsle__EmailSubject__c';
import ENVELOPE_ID_FIELD from '@salesforce/schema/dfsle__EnvelopeStatus__c.dfsle__DocuSignId__c';
import COMPLETED_DATE_FIELD from '@salesforce/schema/dfsle__EnvelopeStatus__c.dfsle__Completed__c';
export default class FilteredRelatedEnvelopeList extends NavigationMixin(LightningElement) {
    @api recordId;
    filterOptions = [
        { label: 'All', value: 'All'},
        { label: 'Completed', value: 'completed' },
        { label: 'Sent', value: 'sent' }
    ];
    
    envelopes = [];
    envelopesToDisplay = [];
    status = 'All';
    showEnvelopes = false;
    section='';
    section = '';
   

    handleSectionToggle(event) {
        this.section = event.detail.openSections;
    }
    
    get cardLabel() {
        return 'Related Envelopes (' + this.envelopes.length + ')';
    }

    convertTime (date1,date2,time) {
        let ms = date1-date2;
        let days = Math.floor(ms / (24*60*60*1000));
        let daysms = ms % (24*60*60*1000);
       let hours = Math.floor(daysms / (60*60*1000));
       let  hoursms = ms % (60*60*1000);
        let minutes = Math.floor(hoursms / (60*1000));
        let minutesms = ms % (60*1000);
        let sec = Math.floor(minutesms / 1000);
        if (days>=30 && time =="past"){
            return date2;
        }  else if (days>=30 && time =="future"){
            return date1;
        }
        if(30 > days >=1 && time=="past"){
            return days + " Day(s) ago ";
        } 
        else if(30 > days >=1 && time=="future"){
            return "in "+days+" Day(s)";
        }else if(hours>0 && time =="past"){
            return hours + " Hour(s) ago ";
        }else if(hours>0 && time =="future"){
            return "in " + hours + " Hour(s)";
        }else if(minutes>0 && time =="past"){
            return minutes + " Minute(s) ago ";
        }else if(minutes>0 && time =="future"){
            return "in "+minutes + " Minute(s)";
        } else if (sec>0 && time == "past"){
            return "a few Seconds ago";

        }else if (sec>0 && time == "future"){
            return "in a few Seconds";

        }                 
    
       
      }

    @wire(getEnvelopeStatusRecords,{
        sourceId: '$recordId'
    })    
    wiredEnvelopes({data, error}){
        if (data) {
           
            this.envelopes =  structuredClone(data);      
            this.envelopes.forEach(element => {
                console.log(element.dfsle__Status__c)
                if(element.dfsle__Status__c == 'Completed' || element.dfsle__Status__c == 'completed'){
                    console.log("Completed true");
                    element.isCompleted = true;
                }else if(element.dfsle__Status__c == 'Voided' || element.dfsle__Status__c == 'voided'){
                    console.log("Voided true");
                    element.isVoided = true;
                }else  if(element.dfsle__Status__c == 'Sent' || element.dfsle__Status__c == 'sent'){
                    console.log("Sent true");
                    element.isSent = true;
                }else if (element.dfsle_Status__c =='Declined' ||element.dfsle_Status__c =='declined'){
                    console.log("Declined true");
                    element.isDeclined = true;

                }             
               
                element.dfsle__Recipients__r.forEach(recipient => {
                    console.log(recipient.dfsle__Status__c)
                    if(recipient.dfsle__Status__c == 'Completed' || recipient.dfsle__Status__c == 'completed'){
                        console.log("Recipient Completed true");
                        recipient.isCompleted = true;
                    }else if(recipient.dfsle__Status__c == 'Created' || recipient.dfsle__Status__c == 'created'){
                        console.log("Recipient Created true");
                        recipient.isCreated = true;
                    }else  if(recipient.dfsle__Status__c == 'Sent' || recipient.dfsle__Status__c == 'sent'){
                        console.log("Recipient Sent true");
                        recipient.isSent = true;
                    }else if(recipient.dfsle__Status__c == "Declined" || recipient.dfsle__Status__c == "declined"){
                        console.log("Recipient Declined")
                        recipient.isDeclined = true;
                        element.isDeclined = true;
                        element.declinedByName = recipient.Name;
                        element.declinedByEmail = recipient.dfsle__Email__c;

                    }
                    let createdDate = new Date(element.CreatedDate);
                    let expirationDate = new Date(element.dfsle__Expires__c);
                    let lastUpdatedDate = new Date(element.dfsle__LastStatusUpdate__c);
                    let completedDate = new Date(element.dfsle__Completed__c);
                    let currentDate = new Date();
                    element.sent = this.convertTime(currentDate , createdDate,"past");                 
                    element.expires = this.convertTime(expirationDate , currentDate,"future"); 
                    element.lastUpdated =this.convertTime(currentDate , lastUpdatedDate,"past");
                    element.completed = this.convertTime(currentDate , completedDate,"past");
                });  
            });         
            console.log('Status records...'+JSON.stringify(this.envelopes));          
            this.updateList();
            this.dispatchEvent(new CustomEvent('envelopecount', { detail: this.envelopes.length}));
        }
        if (error) {
            console.error('Damn Error occurred: '+ JSON.stringify(error));
        }
    }
    handleSelection(event) {
        this.status = event.detail.value;
        this.updateList();
    }
    updateList() {
        if (this.status === 'All') {
            this.envelopesToDisplay = this.envelopes;
        } else {
            this.envelopesToDisplay = this.envelopes.filter(elem => elem.dfsle_Status__c == this.status);
        }
        this.showEnvelopes = this.envelopesToDisplay.length > 0 ? true : false;
    }
    selectedDocuSignEnvelope;
    sfEnvelopeRecord;

    handleActionsMenuSelect(event){
        this.selectedDocuSignEnvelope = event.detail.value;
        console.log("Action "+event.detail.value );
        
        getEnvelopeRecord({
            envelopeId: event.detail.value
        })
        .then(result => {
            //logic to handle result...
            this.sfEnvelopeRecord = result;
            console.log(JSON.stringify(result));
            this.navigateToEnvelope();
        })
        .catch(error => {
            //logic to handle errors
            console.log(JSON.stringify(error))
        });
    }
        
    
  /*  navigateToEnvelope() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.sfEnvelopeRecord,
                objectApiName: 'dfsle__Envelope__c',
                actionName: 'view'
            }
        });
    }*/

    navigateToEnvelope(){
        this[NavigationMixin.GenerateUrl]({
            type: "standard__recordPage",
            attributes: {
                recordId: this.sfEnvelopeRecord,
                objectApiName: 'dfsle__Envelope__c',
                actionName: 'view'
            }
        }).then(url => {
            window.open(url, "_blank");
        });

    }
  
}