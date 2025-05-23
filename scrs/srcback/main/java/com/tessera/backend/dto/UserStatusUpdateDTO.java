package com.tessera.backend.dto;

import com.tessera.backend.entity.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusUpdateDTO {
    @NotNull
    private UserStatus status;
    private String reason;
}