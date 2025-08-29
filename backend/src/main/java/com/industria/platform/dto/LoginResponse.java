package com.industria.platform.dto;

import com.industria.platform.dto.UserDto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        Long expiresIn,
        String tokenType,
        UserDto userInfo
) {}