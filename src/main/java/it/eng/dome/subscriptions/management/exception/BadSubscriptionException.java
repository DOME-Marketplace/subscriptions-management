package it.eng.dome.subscriptions.management.exception;

public class BadSubscriptionException extends RuntimeException {

    public BadSubscriptionException(String message) {
        super(message);
    }

    public BadSubscriptionException(String message, Throwable cause) {
        super(message, cause);
    }
}
