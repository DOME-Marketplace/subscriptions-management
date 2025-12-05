package it.eng.dome.subscriptions.management.exception;

public class BadSubscriptionException extends RuntimeException {

	private static final long serialVersionUID = -8348403341583834495L;

	public BadSubscriptionException(String message) {
        super(message);
    }

    public BadSubscriptionException(String message, Throwable cause) {
        super(message, cause);
    }
}
