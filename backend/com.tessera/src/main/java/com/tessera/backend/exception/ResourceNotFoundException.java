package com.tessera.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends NotFoundException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}