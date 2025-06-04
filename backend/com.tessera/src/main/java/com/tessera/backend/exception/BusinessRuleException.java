package com.tessera.backend.exception;

public class BusinessRuleException extends ApiException {
    public BusinessRuleException(String message) {
        super(message);
    }
    public BusinessRuleException(String message, Throwable cause) {
        super(message, cause);
    }
}
