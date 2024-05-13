public class SendAgreeement{
    
    public static Id createAndSendEnvelope(String jsonAgreement){

        InvocableRequest payload = (InvocableRequest)JSON.deserialize(jsonAgreement, InvocableRequest.class);

        
        Id sourceId =  payload.sourceId;

        String contactId = payload.contactId;
        
        List<Id> docs = payload.docs;
       
        dfsle.Envelope myEnvelope = dfsle.EnvelopeService.getEmptyEnvelope(new dfsle.Entity(sourceId));
        Contact myContact = [SELECT Name, Email
                             FROM Contact
                             WHERE Id = :contactId
                             LIMIT 1];
        dfsle.Recipient myRecipient = dfsle.Recipient.fromSource(myContact.Name, myContact.Email, null, 'Signer1', new dfsle.Entity(myContact.Id));
        myEnvelope = myEnvelope.withRecipients(new List<dfsle.Recipient>{ myRecipient });
        dfsle.UUID myTemplateId = dfsle.UUID.parse('8dafd5dd-xxxx-xxxx-xxxx-542f35b227f7');
        dfsle.Document myDocument = dfsle.Document.fromTemplate(myTemplateId, 'Services Framework Agreement');
        myEnvelope = myEnvelope.withDocuments(new List<dfsle.Document>{ myDocument });
        myEnvelope = dfsle.EnvelopeService.sendEnvelope(myEnvelope, true);
        return myEnvelope.Id;
    }

    @future(callout = true)
    public static void sendEnvelopeInFuture(String jsonPayload){
        createAndSendEnvelope(jsonPayload);
    }

    @InvocableMethod
    public static List<String> sendEnvelope(List<InvocableRequest> loadData){
        InvocableRequest payload = loadData[0];  
        String jsonPayload = JSON.serialize(payload);     
        sendEnvelopeInFuture(jsonPayload);
        return Null;
    }

}