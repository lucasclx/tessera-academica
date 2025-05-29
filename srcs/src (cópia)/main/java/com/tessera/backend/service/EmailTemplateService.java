// src/main/java/com/tessera/backend/service/EmailTemplateService.java
package com.tessera.backend.service;

import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailTemplateService {
    
    private final TemplateEngine templateEngine;
    
    public EmailTemplateService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }
    
    public String generateDocumentApprovedTemplate(String studentName, String documentTitle, String advisorName) {
        Context context = new Context();
        context.setVariable("studentName", studentName);
        context.setVariable("documentTitle", documentTitle);
        context.setVariable("advisorName", advisorName);
        
        return templateEngine.process("email/document-approved", context);
    }
    
    public String generateNewCommentTemplate(String recipientName, String commenterName, 
                                           String documentTitle, String commentContent) {
        Context context = new Context();
        context.setVariable("recipientName", recipientName);
        context.setVariable("commenterName", commenterName);
        context.setVariable("documentTitle", documentTitle);
        context.setVariable("commentContent", commentContent);
        
        return templateEngine.process("email/new-comment", context);
    }
}