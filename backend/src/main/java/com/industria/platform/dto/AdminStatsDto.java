package com.industria.platform.dto;

import java.util.List;

/**
 * DTO pour les statistiques du tableau de bord administrateur.
 * 
 * @author Industria Platform
 * @version 1.0
 */
public class AdminStatsDto {
    private Long totalUsers;
    private Long totalZones;
    private Long availableParcels;
    private Long totalParcels;
    private Long pendingAppointments;
    private Long totalAppointments;
    private List<RecentActivityDto> recentActivities;

    public AdminStatsDto() {}

    public AdminStatsDto(Long totalUsers, Long totalZones, Long availableParcels, Long totalParcels,
                        Long pendingAppointments, Long totalAppointments, List<RecentActivityDto> recentActivities) {
        this.totalUsers = totalUsers;
        this.totalZones = totalZones;
        this.availableParcels = availableParcels;
        this.totalParcels = totalParcels;
        this.pendingAppointments = pendingAppointments;
        this.totalAppointments = totalAppointments;
        this.recentActivities = recentActivities;
    }

    // Getters and Setters
    public Long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(Long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public Long getTotalZones() {
        return totalZones;
    }

    public void setTotalZones(Long totalZones) {
        this.totalZones = totalZones;
    }

    public Long getAvailableParcels() {
        return availableParcels;
    }

    public void setAvailableParcels(Long availableParcels) {
        this.availableParcels = availableParcels;
    }

    public Long getTotalParcels() {
        return totalParcels;
    }

    public void setTotalParcels(Long totalParcels) {
        this.totalParcels = totalParcels;
    }

    public Long getPendingAppointments() {
        return pendingAppointments;
    }

    public void setPendingAppointments(Long pendingAppointments) {
        this.pendingAppointments = pendingAppointments;
    }

    public Long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(Long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public List<RecentActivityDto> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<RecentActivityDto> recentActivities) {
        this.recentActivities = recentActivities;
    }

    /**
     * DTO pour une activité récente dans le système.
     */
    public static class RecentActivityDto {
        private String id;
        private String action;
        private String description;
        private UserSummaryDto user;
        private String createdAt;

        public RecentActivityDto() {}

        public RecentActivityDto(String id, String action, String description, UserSummaryDto user, String createdAt) {
            this.id = id;
            this.action = action;
            this.description = description;
            this.user = user;
            this.createdAt = createdAt;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public UserSummaryDto getUser() {
            return user;
        }

        public void setUser(UserSummaryDto user) {
            this.user = user;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }
    }

    /**
     * DTO simplifié pour un utilisateur dans les activités récentes.
     */
    public static class UserSummaryDto {
        private String name;

        public UserSummaryDto() {}

        public UserSummaryDto(String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}