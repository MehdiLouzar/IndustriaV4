package com.industria.platform.exception;


import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
@Getter
public class ForbiddenException extends RuntimeException {
    private final String resource;
    private final String action;

    public ForbiddenException(String message) {
        super(message);
        this.resource = null;
        this.action = null;
    }

    public ForbiddenException(String resource, String action) {
        super(String.format("You don't have permission to %s %s", action, resource));
        this.resource = resource;
        this.action = action;
    }

}

