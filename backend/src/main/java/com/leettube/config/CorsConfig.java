package com.leettube.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * CORS configuration to allow requests from:
 *   - Chrome extensions  (chrome-extension://<id>)
 *   - LeetCode pages     (https://leetcode.com)
 *   - localhost          (for development testing)
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow Chrome extensions and LeetCode to call this backend
        config.setAllowedOriginPatterns(List.of(
                "chrome-extension://*",
                "https://leetcode.com",
                "https://*.leetcode.com",
                "http://localhost:*",
                "null"   // Chrome extensions sometimes send "null" as origin
        ));

        config.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}
