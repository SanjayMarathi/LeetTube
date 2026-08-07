package com.leettube;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * LeetTube Backend — Spring Boot entry point.
 *
 * This server acts as a secure proxy between the LeetTube Chrome extension
 * and external APIs (YouTube Data API v3, LeetCode GraphQL).
 *
 * It keeps YouTube API keys on the server side (not exposed in the extension),
 * rotates keys on quota exhaustion, and returns structured JSON to the extension.
 *
 * Endpoints:
 *   GET /api/problem/{slug}            → fetch problem ID + title from LeetCode GraphQL
 *   GET /api/search?lcNo=&channelId=   → search YouTube Data API v3 for solution videos
 */
@SpringBootApplication
@EnableCaching
public class LeetTubeApplication {

    public static void main(String[] args) {
        SpringApplication.run(LeetTubeApplication.class, args);
    }
}
