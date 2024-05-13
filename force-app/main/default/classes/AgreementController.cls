public with sharing class AgreementController {
    @AuraEnabled(cacheable=true)
    public static List<ContentDocumentLink> getFiles(String recordId){
        System.debug('### retrieveing files from :'+recordId);
        List<ContentDocumentLink> cdls = [SELECT ContentDocumentId, ContentDocument.Title   FROM ContentDocumentLink     WHERE LinkedEntityID = :recordId];

        return cdls;

    }


   
}