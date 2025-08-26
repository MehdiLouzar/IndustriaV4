package com.industria.platform.dto;

import com.industria.platform.dto.UserDto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        int expiresIn,
        String tokenType,
        UserDto userInfo
) {}