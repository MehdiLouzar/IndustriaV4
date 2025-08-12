package com.industria.platform.entity;

/**
 * Énumération des statuts de notification.
 * 
 * Suit le cycle de vie d'une notification email depuis sa création
 * jusqu'à sa livraison finale ou son échec.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum NotificationStatus {
    PENDING,
    SENT,
    FAILED,
    DELIVERED
}
