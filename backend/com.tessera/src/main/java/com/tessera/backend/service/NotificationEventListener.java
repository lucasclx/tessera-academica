package com.tessera.backend.service;

import com.tessera.backend.event.NotificationEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
public class NotificationEventListener {

    @Autowired
    private NotificationService notificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotification(NotificationEvent event) {
        notificationService.createNotification(
                event.user(),
                event.type(),
                event.title(),
                event.message(),
                event.triggeredBy(),
                event.entityId(),
                event.entityType(),
                event.actionUrl(),
                event.priority(),
                event.expiresAt()
        );
    }
}
