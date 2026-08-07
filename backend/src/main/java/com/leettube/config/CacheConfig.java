package com.leettube.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine in-memory cache configuration.
 *
 * Two caches:
 *   - "problems"  : LeetCode problem metadata (slug → {id, title}). TTL = 24h.
 *   - "ytSearch"  : YouTube search results (lcNo+channelId → video list).  TTL = 6h.
 *
 * This mirrors the localStorage cache in the original content.js,
 * but the cache now lives server-side so API keys are never exposed.
 */
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("problems", "ytSearch");

        manager.setCaffeine(
            Caffeine.newBuilder()
                .expireAfterWrite(6, TimeUnit.HOURS)
                .maximumSize(5_000)
                .recordStats()
        );

        return manager;
    }
}
