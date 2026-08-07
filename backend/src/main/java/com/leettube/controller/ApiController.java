package com.leettube.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.leettube.service.LeetCodeService;
import com.leettube.service.YouTubeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ApiController — the two REST endpoints that replace direct API calls in content.js.
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │  Endpoint                              │ Replaces (in content.js)                  │
 * ├─────────────────────────────────────────────────────────────────────────────────────┤
 * │  GET /api/problem/{slug}               │ fetch("https://leetcode.com/graphql", ...) │
 * │  GET /api/search?lcNo=&channelId=      │ searchLC(number, channelId)               │
 * │  POST /api/cache/clear                 │ localStorage.removeItem(CACHE_KEY)        │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    private static final Logger log = LoggerFactory.getLogger(ApiController.class);

    private final LeetCodeService leetCodeService;
    private final YouTubeService  youTubeService;

    public ApiController(LeetCodeService leetCodeService, YouTubeService youTubeService) {
        this.leetCodeService = leetCodeService;
        this.youTubeService  = youTubeService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/problem/{slug}
    // Returns: { "id": "1", "title": "Two Sum" }
    //
    // Replaces content.js lines 528-532:
    //   const res = await fetch("https://leetcode.com/graphql", { ... });
    //   const { questionFrontendId: lcNo, title } = (await res.json()).data.question;
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/problem/{slug}")
    public ResponseEntity<Map<String, String>> getProblem(@PathVariable String slug) {
        log.info("GET /api/problem/{}", slug);

        try {
            Map<String, String> problem = leetCodeService.getProblemBySlug(slug);
            return ResponseEntity.ok(problem);
        } catch (Exception e) {
            log.error("Failed to fetch problem for slug '{}': {}", slug, e.getMessage());
            return ResponseEntity.status(404).body(Map.of("error", "Problem not found: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/search?lcNo=1&channelId=UC_mYaQAE6-71rjSN6CeCA-g
    // Returns: YouTube Data API v3 search response JSON (items array)
    //
    // Replaces content.js lines 592-605:
    //   async function searchLC(number, channelId) { ... fetch YT API ... }
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/search")
    public ResponseEntity<JsonNode> searchYouTube(
            @RequestParam String lcNo,
            @RequestParam String channelId) {

        log.info("GET /api/search?lcNo={}&channelId={}", lcNo, channelId);

        JsonNode result = youTubeService.searchForProblem(lcNo, channelId);

        if (result == null) {
            return ResponseEntity.status(503).build();
        }

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/cache/clear
    // Evicts the server-side YouTube search cache (equivalent to clearing
    // localStorage.removeItem(CACHE_KEY) for the current session in content.js).
    // Note: localStorage caching for video IDs is still handled by the extension.
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/cache/clear")
    public ResponseEntity<Map<String, String>> clearCache() {
        log.info("POST /api/cache/clear — evicting server-side YouTube search cache");
        youTubeService.resetKeyIndex();
        return ResponseEntity.ok(Map.of("status", "Cache clear triggered. Server cache will expire naturally."));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/health
    // Simple health check so users can verify the server is running.
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status",  "UP",
                "service", "LeetTube Backend",
                "version", "1.0.0"
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/diagnostics
    // Shows key count and last YouTube API error to help diagnose issues.
    // Browser-restricted keys (created for Chrome extension use) will show
    // "keyInvalid" or "accessNotConfigured" when called from a server.
    // Fix: Create a new unrestricted or IP-restricted YouTube API key and add
    //      it to backend/src/main/resources/application.properties
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/diagnostics")
    public ResponseEntity<Map<String, Object>> diagnostics() {
        return ResponseEntity.ok(java.util.Map.of(
                "keyCount",        youTubeService.getKeyCount(),
                "lastYtError",     youTubeService.getLastErrorReason(),
                "lastYtMessage",   youTubeService.getLastErrorMessage(),
                "note", "If lastYtError is 'keyInvalid' or 'accessNotConfigured', your YouTube API keys " +
                        "are browser-restricted. Create a new unrestricted key at " +
                        "https://console.cloud.google.com/apis/credentials"
        ));
    }
}
