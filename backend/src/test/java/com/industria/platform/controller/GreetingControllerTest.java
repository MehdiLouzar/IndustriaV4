package com.industria.platform.controller;

import com.industria.platform.config.I18nConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GreetingController.class)
@Import(I18nConfig.class)
class GreetingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void greetingInFrench() throws Exception {
        mockMvc.perform(get("/api/public/greeting").header("Accept-Language", "fr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Bienvenue sur la plateforme"));
    }
}
