package com.tessera.backend.service;

import com.tessera.backend.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    @Autowired(required = false)
    private JavaMailSender mailSender;
    
    private boolean isMailSenderAvailable() {
        return mailSender != null;
    }
    
    public void sendNewRegistrationNotification(String adminEmail, User newUser) {
        if (!isMailSenderAvailable()) {
            // Log em vez de enviar email
            System.out.println("Simulando envio de email para: " + adminEmail);
            System.out.println("Assunto: Nova solicitação de cadastro - Tessera Acadêmica");
            System.out.println("Corpo: Nome: " + newUser.getName() + ", Email: " + newUser.getEmail());
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setSubject("Nova solicitação de cadastro - Tessera Acadêmica");
        message.setText(
                "Olá Administrador,\n\n" +
                "Uma nova solicitação de cadastro foi recebida:\n" +
                "Nome: " + newUser.getName() + "\n" +
                "Email: " + newUser.getEmail() + "\n\n" +
                "Por favor, acesse o painel administrativo para revisar esta solicitação.\n\n" +
                "Atenciosamente,\n" +
                "Equipe Tessera Acadêmica"
        );
        
        mailSender.send(message);
    }
    
    public void sendRegistrationApprovedEmail(String userEmail, String notes) {
        if (!isMailSenderAvailable()) {
            // Log em vez de enviar email
            System.out.println("Simulando envio de email para: " + userEmail);
            System.out.println("Assunto: Cadastro Aprovado - Tessera Acadêmica");
            System.out.println("Corpo: Cadastro aprovado com notas: " + notes);
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(userEmail);
        message.setSubject("Cadastro Aprovado - Tessera Acadêmica");
        
        String messageText = "Olá,\n\n" +
                "Sua solicitação de cadastro na plataforma Tessera Acadêmica foi APROVADA!\n" +
                "Você já pode acessar o sistema utilizando seu email e senha cadastrados.\n\n";
        
        if (notes != null && !notes.isEmpty()) {
            messageText += "Mensagem do administrador: " + notes + "\n\n";
        }
        
        messageText += "Atenciosamente,\n" +
                "Equipe Tessera Acadêmica";
        
        message.setText(messageText);
        mailSender.send(message);
    }
    
    public void sendRegistrationRejectedEmail(String userEmail, String reason) {
        if (!isMailSenderAvailable()) {
            // Log em vez de enviar email
            System.out.println("Simulando envio de email para: " + userEmail);
            System.out.println("Assunto: Cadastro Não Aprovado - Tessera Acadêmica");
            System.out.println("Corpo: Cadastro rejeitado com motivo: " + reason);
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(userEmail);
        message.setSubject("Cadastro Não Aprovado - Tessera Acadêmica");
        message.setText(
                "Olá,\n\n" +
                "Sua solicitação de cadastro na plataforma Tessera Acadêmica não foi aprovada.\n\n" +
                "Motivo: " + reason + "\n\n" +
                "Caso tenha dúvidas, entre em contato conosco.\n\n" +
                "Atenciosamente,\n" +
                "Equipe Tessera Acadêmica"
        );
        
        mailSender.send(message);
    }
}