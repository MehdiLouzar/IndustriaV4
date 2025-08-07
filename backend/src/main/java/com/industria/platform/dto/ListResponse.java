package com.industria.platform.dto;

import java.util.List;

public record ListResponse<T>(List<T> items, long totalItems, int totalPages, int page, int limit) {}
