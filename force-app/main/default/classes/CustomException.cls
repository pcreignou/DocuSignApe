public class CustomException extends Exception {

        public virtual class BaseException extends Exception {}
        public class OtherException extends BaseException {}
    
        public static void testExtendedException() {
            try {
                Integer i=0;
                // Your code here
                if (i < 5) throw new OtherException('This is bad');
            } catch (BaseException e) {  
                // This catches the OtherException
                System.debug(e.getMessage());
            }  
        }
    }