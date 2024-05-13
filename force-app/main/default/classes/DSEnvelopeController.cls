public with sharing class DSEnvelopeController{
    @AuraEnabled(cacheable = true)
    public static Id getEnvelopeRecord(String envelopeId){
        return [SELECT Id, Name, dfsle__EmailSubject__c
                FROM dfsle__Envelope__c
                WHERE dfsle__DocuSignId__c = :envelopeId
                LIMIT 1].Id;
    }

}