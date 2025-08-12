package com.industria.platform.entity;

/**
 * Énumération des types de notifications.
 * 
 * Catégorise les différents types de notifications automatiques
 * envoyées par la plateforme selon les événements déclencheurs.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum NotificationType {
    APPOINTMENT_CONFIRMED,
    APPOINTMENT_CANCELLED,
    APPOINTMENT_RESCHEDULED,
    SYSTEM_NOTIFICATION
}
