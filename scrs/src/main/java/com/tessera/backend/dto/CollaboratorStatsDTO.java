package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollaboratorStatsDTO {
    private int totalStudents;
    private int totalAdvisors;
    private int primaryStudents;
    private int primaryAdvisors;
    private int secondaryStudents;
    private int secondaryAdvisors;
    private int coStudents;
    private int coAdvisors;
    private int externalAdvisors;
    private int observers;
    private int examiners;
    private int reviewers;
    
    private boolean canAddMoreStudents;
    private boolean canAddMoreAdvisors;
    private int maxStudents;
    private int maxAdvisors;
}
