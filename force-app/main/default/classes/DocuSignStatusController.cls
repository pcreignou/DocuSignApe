public with sharing  class DocuSignStatusController {
    @AuraEnabled(cacheable=true)
    public static List<dfsle__EnvelopeStatus__c> getStatusRecords(String sourceId) {
        return [
            SELECT Id,dfsle__SenderName__c,dfsle__Reason__c,dfsle__SenderEmail__c,dfsle__Status__c,CreatedDate, 	dfsle__Expires__c, dfsle__LastStatusUpdate__c,dfsle__EmailSubject__c, dfsle__DocuSignId__c, dfsle__Completed__c,
             (SELECT Name,	dfsle__Email__c,dfsle__Sent__c,dfsle__Status__c,dfsle__RoutingOrder__c,dfsle__LastStatusUpdate__c,dfsle__Type__c,dfsle__Reason__c FROM dfsle__Recipients__r) 
             FROM dfsle__EnvelopeStatus__c where dfsle__SourceId__c = :sourceId ORDER BY CreatedDate  DESC  LIMIT 5
        ];
    }
}