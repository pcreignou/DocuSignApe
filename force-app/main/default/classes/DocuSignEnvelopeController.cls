public class DocuSignEnvelopeController{
    @AuraEnabled
    public static String createEnvelope(Id recordId, List<dfsle__Recipient__c> rcpts, String emailSubject, String emailMessage,Boolean sendNow){

        Id mySourceId = recordId; // The ID of the initiating Salesforce object        
       
        //retrieve attachments
        system.debug('## record:' + recordId);
        system.debug('## rcpts 1:' + rcpts[0].Name);
        List<ContentDocumentLink> cdls = [SELECT ContentDocumentId
                                          FROM ContentDocumentLink
                                          WHERE LinkedEntityID = :recordId];
        system.debug('## doc count:' + cdls.size());
        Set<Id> files = new Set<Id>();

        String cvIdlist = '';

        for (ContentDocumentLink cdl : cdls){
            for (ContentVersion cv : [SELECT ContentDocumentId, Id
                                      FROM ContentVersion
                                      WHERE ContentDocumentId = :cdl.ContentDocumentId]){

                files.add(cv.Id);
                cvIdlist = cvIdlist + cv.id + '|';
            }
        }


        //notificatiosn and expiration

        dfsle.Notifications notifySigner = new dfsle.Notifications(true,      // Indicates that the recipient should be reminded to sign
        2,      // Number of days to wait before sending a reminder
        1,      // Number of days between reminders
        true,      // Whether or not the envelope expires and is voided
        90,      // How many days before the envelope expires
        10,      // Number of days before expiration to remind the recipient
        false // Placeholder for deprecated field
        );



        List<dfsle.Document> myDocuments = dfsle.DocumentService.getDocuments(ContentVersion.getSObjectType(), files);


        //create recipients

        List<dfsle.Recipient> recipients = new List<dfsle.Recipient>();

        for (dfsle__Recipient__c rcpt : rcpts){


            dfsle.Recipient recipient = dfsle.Recipient.fromSource(rcpt.Name,          // Signer name
            rcpt.dfsle__Email__c,          // Signer email
            null,          // Signer phone number
            rcpt.dfsle__Role__c,          // Signer role
            null).withType(rcpt.dfsle__Type__c).withRoutingOrder(Integer.ValueOf(rcpt.dfsle__RoutingOrder__c)); // No Salesforce association


            recipients.add(recipient);

        }

        


        dfsle.Document.WriteBack documentWriteBack = new dfsle.Document.WriteBack(null, dfsle.Document.WRITE_BACK_NAME_ENVELOPE_STATUS_PDF, false, true);
        Map<String, Map<String, Object>> envelopeEvents = new Map<String, Map<String, Object>>{ dfsle.Envelope.STATUS_COMPLETED => new Map<String, Object>{ 'StageName' => 'Closed Won' } };

        // Create  envelope
        try{
            dfsle.Envelope dsEnvelope = dfsle.EnvelopeService.getEmptyEnvelope(new dfsle.Entity(mySourceId)) // The initiating Salesforce record
            .withEmail(emailMessage, emailSubject).withDocuments(myDocuments).withRecipients(recipients).withNotifications(notifySigner).withOptions(new dfsle.Envelope.Options(true, documentWriteBack, envelopeEvents, new Map<String, Map<String, Object>>()));


            // Send the envelope.
           dsEnvelope = dfsle.EnvelopeService.sendEnvelope(dsEnvelope,           // The envelope to send
            sendNow// Send now?
            );
            System.debug(LoggingLevel.INFO, '## envelop SF ID : ' + dsEnvelope.Id);
            // Return string value of DocuSign envelope ID
            return String.valueOf(dsEnvelope.Id);

        } catch (dfsle.APIException ex){

            if (ex.error.code == dfsle.APIErrorCode.CONSENT_REQUIRED || ex.error.code == 400){
                // user is a valid member of the DocuSign account, but has not granted consent to this application
                //Url loginUrl = dfsle.AuthService.getLoginUrl('/s/apex/community_auth?myState=whatever&recordId=' + recordId);
                String loginUrl = Site.getBaseSecureUrl().removeEnd('/s') + '/apex/exp_communityauth?recordId=' + recordId;
                System.debug(LoggingLevel.INFO, '##' + loginUrl);
                throw new AuraHandledException(loginUrl);
            } else{
                // handle other errors
                System.debug(LoggingLevel.ERROR, '## error :' + ex);
                throw new CustomException('Your authorization was unsuccessful, please contact your Administrator : (' + ex.error.code + ')' + ex);
            }
        } catch (Exception e){
            System.debug('##Exception caught: ' + e.getMessage());
            throw e;
        }
    }

    @AuraEnabled
    public static String sendEnvelope(Id recordId,Id envelopeId){
        system.debug('## sending envelope:' + envelopeId);
         // Send the envelope.
         dfsle.Envelope dsEnvelope= dfsle.EnvelopeService.getEnvelope(Id.valueOf(envelopeId));         
         dfsle.EnvelopeService.sendEnvelope(dsEnvelope,           // The envelope to send
         true // Send now?
         );
       
         System.debug(LoggingLevel.INFO, '## envelop SF ID : ' + dsEnvelope.Id);
        //dfsle.EnvelopeService.saveSentEnvelopes(new List<dfsle.Envelope>{dsEnvelope});
         // Return string value of DocuSign envelope ID
         return String.valueOf(dsEnvelope.Id);

    }

    
    @AuraEnabled
    public static String deleteEnvelope(Id envelopeId){
        system.debug('## deleting envelope:' + envelopeId);
         // Send the envelope.
         dfsle.EnvelopeService.deleteEnvelope(envelopeId);        
      
         System.debug(LoggingLevel.INFO, '## Deleted envelope SF ID : ' + envelopeId);
        /* dfsle.EnvelopeService.saveSentEnvelopes(new List<dfsle.Envelope>{dsEnvelope});*/
         // Return string value of DocuSign envelope ID
         return String.valueOf(envelopeId);

    }   

    @AuraEnabled
    public static String getRecipientPreviewUrl(String envelopeId, Integer sequence){
        Url mySigningUrl = dfsle.SigningService.getRecipientPreviewUrl(dfsle.UUID.parse(envelopeId),    // envId value as a UUID
        sequence  // sequence to view
        );
        // Return string value of Url to controller
        return mySigningUrl.toExternalForm();
    }

}