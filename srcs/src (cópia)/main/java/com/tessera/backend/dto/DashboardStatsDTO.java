package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private int totalUsers;
    private int totalStudents;
    private int totalAdvisors;
    private int pendingRegistrations;
}