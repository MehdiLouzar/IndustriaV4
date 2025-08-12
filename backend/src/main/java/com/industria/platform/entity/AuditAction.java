package com.industria.platform.entity;

/**
 * Énumération des actions d'audit traçables.
 * 
 * Définit les types d'actions utilisateur pouvant être auditées
 * pour la conformité et la sécurité du système.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    SOFT_DELETE,
    RESTORE,
    LOGIN,
    LOGOUT,
    APPOINTMENT_CONFIRMED,
    APPOINTMENT_CANCELLED,
    APPOINTMENT_RESCHEDULED
}
