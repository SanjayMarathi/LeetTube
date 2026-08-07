package com.leettube.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

/**
 * LeetCodeService — fetches problem metadata from LeetCode's GraphQL endpoint.
 *
 * Uses realistic browser headers to avoid being blocked.
 * Falls back to slug-parsing if GraphQL is unavailable.
 */
@Service
public class LeetCodeService {

    private static final Logger log = LoggerFactory.getLogger(LeetCodeService.class);
    private static final String LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public LeetCodeService(WebClient webClient, ObjectMapper objectMapper) {
        this.webClient    = webClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Fetch problem metadata from LeetCode GraphQL.
     * Result is cached by slug for 6 hours (see CacheConfig).
     *
     * @param slug  URL slug e.g. "two-sum"
     * @return      Map with "id" and "title", or fallback values if unreachable
     */
    @Cacheable(value = "problems", key = "#slug")
    public Map<String, String> getProblemBySlug(String slug) {
        log.info("Fetching LeetCode problem for slug: {}", slug);

        // Build GraphQL request body as a proper JSON object
        ObjectNode body = objectMapper.createObjectNode();
        body.put("operationName", "getQuestionDetail");
        body.put("query",
            "query getQuestionDetail($titleSlug: String!) {" +
            "  question(titleSlug: $titleSlug) {" +
            "    title" +
            "    questionFrontendId" +
            "  }" +
            "}");
        ObjectNode variables = objectMapper.createObjectNode();
        variables.put("titleSlug", slug);
        body.set("variables", variables);

        try {
            JsonNode root = webClient.post()
                    .uri(LEETCODE_GRAPHQL_URL)
                    .header("Content-Type",  "application/json")
                    .header("Accept",        "application/json")
                    .header("User-Agent",    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
                    .header("Referer",       "https://leetcode.com/problems/" + slug + "/")
                    .header("Origin",        "https://leetcode.com")
                    .header("x-csrftoken",   "")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (root != null) {
                JsonNode q = root.path("data").path("question");
                if (!q.isMissingNode() && !q.isNull()) {
                    String title = q.path("title").asText();
                    String lcNo  = q.path("questionFrontendId").asText();
                    if (!title.isEmpty() && !lcNo.isEmpty()) {
                        log.info("Resolved via GraphQL: #{} — {}", lcNo, title);
                        return Map.of("id", lcNo, "title", title, "slug", slug);
                    }
                }
            }
        } catch (WebClientResponseException e) {
            log.warn("LeetCode GraphQL HTTP error {}: {}", e.getStatusCode(), e.getMessage());
        } catch (Exception e) {
            log.warn("LeetCode GraphQL call failed ({}): {}", e.getClass().getSimpleName(), e.getMessage());
        }

        // Fallback: derive a readable title from the slug itself
        log.info("Using slug fallback for: {}", slug);
        return slugFallback(slug);
    }

    /**
     * Fallback when LeetCode GraphQL is unreachable.
     * Converts "two-sum" → title="Two Sum", id="?" — the extension
     * will still search YouTube using the slug-derived title.
     */
    private Map<String, String> slugFallback(String slug) {
        // Convert slug to title: "two-sum" → "Two Sum"
        String title = java.util.Arrays.stream(slug.split("-"))
                .map(w -> w.isEmpty() ? w : Character.toUpperCase(w.charAt(0)) + w.substring(1))
                .collect(java.util.stream.Collectors.joining(" "));
        // We don't have the numeric ID — use a special marker so the extension
        // knows to search by title only
        return Map.of("id", "UNKNOWN", "title", title, "slug", slug, "fallback", "true");
    }
}
