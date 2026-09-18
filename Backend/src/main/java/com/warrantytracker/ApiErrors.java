package com.warrantytracker;

import java.util.*;
import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(StorageUnavailableException.class)
    ResponseEntity<ErrorBody> storage(StorageUnavailableException ex) {
        return ResponseEntity.status(503).body(new ErrorBody(ex.getMessage(), Map.of()));
    }
    record ErrorBody(String message, Map<String, String> errors) {}
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ErrorBody> status(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(new ErrorBody(ex.getReason(), Map.of()));
    }
    @ExceptionHandler(BindException.class)
    ResponseEntity<ErrorBody> validation(BindException ex) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ErrorBody("Please check the submitted fields.", fields));
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorBody> malformed(Exception ex) {
        return ResponseEntity.badRequest().body(new ErrorBody("Invalid request data.", Map.of()));
    }
    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ErrorBody> conflict(Exception ex) {
        return ResponseEntity.status(409).body(new ErrorBody("Warranty changed. Reload it before saving.", Map.of()));
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorBody> integrity(Exception ex) {
        return ResponseEntity.status(409).body(new ErrorBody("The data conflicts with an existing record or database constraint.", Map.of()));
    }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ErrorBody> tooLarge(Exception ex) {
        return ResponseEntity.status(413).body(new ErrorBody("Upload exceeds the 10 MB limit.", Map.of()));
    }
}
