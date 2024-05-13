/**
 * This class contains unit tests for validating the behavior of Apex classes
 * and triggers.
 *
 * Unit tests are class methods that verify whether a particular piece
 * of code is working properly. Unit test methods take no arguments,
 * commit no data to the database, and are flagged with the testMethod
 * keyword in the method definition.
 *
 * All test methods in an org are executed whenever Apex code is deployed
 * to a production org to confirm correctness, ensure code
 * coverage, and prevent regressions. All Apex classes are
 * required to have at least 75% code coverage in order to be deployed
 * to a production org. In addition, all triggers must have some code coverage.
 *
 * The @isTest class annotation indicates this class only contains test
 * methods. Classes defined with the @isTest annotation do not count against
 * the org size limit for all Apex scripts.
 *
 * See the Apex Language Reference for more information about Testing and Code Coverage.
 */
@isTest
private class DocuSignEnveloppeControllerTest{
    @isTest
    static void testSendEnvelope(){
        // Mock the DocuSign eSignature API
        dfsle.TestUtils.setMock(new dfsle.ESignatureAPIMock());

        // Run the test as a DocuSign Sender. This is required by dfsle.EnvelopeService.sendEnvelope
        System.runAs(dfsle.UserMock.createDocuSignSender()){

            // Create test data
            Account myAccount = new Account(
                Name = 'Test Account'
            );
            insert myAccount;

            Contact myContact = new Contact(
                AccountId = myAccount.Id, 
                FirstName = 'Test', 
                LastName = 'Contact', 
                Phone = '555-1234-5678', 
                Email = 'test.contact@example.com'
            );
            insert myContact;

            // Create a test envelope with one document and one recipient
            dfsle.Envelope myEnvelope = dfsle.EnvelopeService.getEmptyEnvelope(new dfsle.Entity(myAccount.Id))
            .withDocuments(new List<dfsle.Document>{ dfsle.Document.fromTemplate(dfsle.UUID.randomUUID(), 'test template') })
            .withRecipients(new List<dfsle.Recipient>{ dfsle.Recipient.fromSource(myContact.FirstName + ' ' + myContact.LastName, myContact.Email, myContact.Phone, 'Signer 1', new dfsle.Entity(myContact.Id)) });
        // Perform the test
Test.startTest();
dfsle.Envelope myResult = dfsle.EnvelopeService.sendEnvelope(myEnvelope, true);
Test.stopTest();
  
// Verify the results
System.assertNotEquals(null, myResult);
        }
    }

}