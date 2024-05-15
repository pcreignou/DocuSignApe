public with sharing class DSEnvelopeController{
    @AuraEnabled(cacheable = true)
    public static dfsle__Envelope__c getEnvelopeRecord(String envelopeId){
        return [SELECT Id, Name, dfsle__EmailSubject__c,dfsle__CustomFields__c
                FROM dfsle__Envelope__c
                WHERE dfsle__DocuSignId__c = :envelopeId
                LIMIT 1];
    }

}