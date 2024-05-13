public with sharing class ContactController {
    @AuraEnabled(cacheable=true)
    public static Contact contactLookup(String recordId){
        System.debug('### retrieveing lookup from :'+recordId);
       Contact contact =[Select Id, Name, Email  from Contact where Id in  (SELECT Signer_Contact__c FROM Opportunity Where Id = :recordId)];
        
       return contact;

    }


   
}