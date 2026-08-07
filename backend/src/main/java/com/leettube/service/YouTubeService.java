package com.leettube.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * YouTubeService — Java backend replacement for searchLC() in content.js.
 *
 * IMPORTANT NOTE ON API KEYS:
 * The original content.js API keys were created as "Browser keys" restricted to
 * the Chrome extension origin (chrome-extension://...). These keys will be rejected
 * when called from a server IP with a 403 "API key not valid" or
 * "keyInvalid" / "accessNotConfigured" error.
 *
 * To fully use the Java backend for YouTube search, you need to create a NEW
 * YouTube Data API v3 key with NO restrictions (or IP-restricted to your server):
 *   1. Go to https://console.cloud.google.com/apis/credentials
 *   2. Create → API key → Edit → Application restrictions → None (or IP addresses)
 *   3. Add the new key to application.properties
 *
 * For now, this service tries ALL keys and logs the actual error reason.
 * The extension falls back gracefully if the server returns 503.
 */
@Service
public class YouTubeService {

    private static final Logger log = LoggerFactory.getLogger(YouTubeService.class);
    private static final String YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

    private final WebClient webClient;
    private final List<String> apiKeys;

    // Thread-safe key rotation index
    private final AtomicInteger keyIndex = new AtomicInteger(0);

    // Store last error reason for diagnostics endpoint
    private volatile String lastErrorReason = "";
    private volatile String lastErrorMessage = "";

    public YouTubeService(
            WebClient webClient,
            @Value("#{'${leettube.youtube.api-keys}'.split(',')}") List<String> apiKeys) {
        this.webClient = webClient;
        this.apiKeys   = apiKeys.stream().map(String::trim).filter(k -> !k.isEmpty()).toList();
        log.info("YouTubeService initialised with {} API key(s)", this.apiKeys.size());
    }

    /**
     * Search YouTube for a LeetCode solution video.
     * Results cached by "lcNo:channelId" for 6 hours.
     *
     * @param lcNo       LeetCode problem number or "UNKNOWN"
     * @param channelId  YouTube channel ID
     * @return           YouTube search JSON, or null if all keys fail
     */
    @Cacheable(value = "ytSearch", key = "#lcNo + ':' + #channelId")
    public JsonNode searchForProblem(String lcNo, String channelId) {
        log.info("Searching YouTube for LC#{} in channel {}", lcNo, channelId);

        // Reset to start of key list for this search
        int savedIndex = keyIndex.get();
        keyIndex.set(0);

        while (keyIndex.get() < apiKeys.size()) {
            String currentKey = apiKeys.get(keyIndex.get()).trim();
            log.debug("Trying key index {} (last 6 chars: ...{})", keyIndex.get(),
                    currentKey.length() > 6 ? currentKey.substring(currentKey.length() - 6) : currentKey);

            try {
                URI uri = UriComponentsBuilder.fromHttpUrl(YT_SEARCH_URL)
                        .queryParam("part",       "snippet")
                        .queryParam("type",       "video")
                        .queryParam("maxResults", "5")
                        .queryParam("q",          "Leetcode " + lcNo)
                        .queryParam("channelId",  channelId)
                        .queryParam("key",        currentKey)
                        .build()
                        .toUri();

                JsonNode json = webClient.get()
                        .uri(uri)
                        .retrieve()
                        .bodyToMono(JsonNode.class)
                        .timeout(Duration.ofSeconds(10))
                        .block();

                if (json == null) {
                    log.warn("Null response from YouTube, rotating key");
                    keyIndex.incrementAndGet();
                    continue;
                }

                // Check for API errors
                JsonNode errorNode = json.path("error");
                if (!errorNode.isMissingNode()) {
                    int    code    = errorNode.path("code").asInt();
                    String message = errorNode.path("message").asText();
                    String reason  = errorNode.path("errors").path(0).path("reason").asText("");

                    lastErrorReason  = reason;
                    lastErrorMessage = message;

                    log.warn("YouTube API error code={} reason='{}' message='{}'", code, reason, message);

                    if ("quotaExceeded".equals(reason) || "dailyLimitExceeded".equals(reason)) {
                        log.warn("Quota exhausted on key index {}, trying next key", keyIndex.get());
                        keyIndex.incrementAndGet();
                        continue;
                    }

                    if ("keyInvalid".equals(reason) || "accessNotConfigured".equals(reason)
                            || "keyExpired".equals(reason) || code == 400 || code == 403) {
                        // Browser-restricted key — try next key anyway
                        log.warn("Key restriction/invalid error, rotating to next key. Reason: {}", reason);
                        keyIndex.incrementAndGet();
                        continue;
                    }

                    // Other API error — rotate and continue
                    log.warn("Unknown API error '{}', rotating key", reason);
                    keyIndex.incrementAndGet();
                    continue;
                }

                // Success!
                log.info("YouTube search succeeded with key index {}", keyIndex.get());
                keyIndex.set(savedIndex); // restore original index position
                return json;

            } catch (Exception e) {
                log.warn("YouTube API call failed (key index {}): {}", keyIndex.get(), e.getMessage());
                keyIndex.incrementAndGet();
            }
        }

        // All keys exhausted
        log.error("All {} YouTube API keys exhausted for LC#{}. Last error: {} — {}",
                apiKeys.size(), lcNo, lastErrorReason, lastErrorMessage);
        keyIndex.set(0); // reset for next call
        return null;
    }

    public void resetKeyIndex() {
        keyIndex.set(0);
        log.info("Key index reset to 0");
    }

    public String getLastErrorReason()  { return lastErrorReason; }
    public String getLastErrorMessage() { return lastErrorMessage; }
    public int    getKeyCount()         { return apiKeys.size(); }
}
