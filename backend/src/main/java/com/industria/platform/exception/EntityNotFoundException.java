package com.industria.platform.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
@Getter
public class EntityNotFoundException extends RuntimeException {
    private final String entity;
    private final String id;

    public EntityNotFoundException(String entity, String id) {
        super(String.format("%s not found with id: %s", entity, id));
        this.entity = entity;
        this.id = id;
    }

    public EntityNotFoundException(String message) {
        super(message);
        this.entity = null;
        this.id = null;
    }

}