import time
from typing import Dict, List
from fastapi import HTTPException
import os
import redis

# Redis connection for rate limiting — reads REDIS_URL env var so it works
# on localhost in dev and on AWS/Docker in production without code changes.
_redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.from_url(_redis_url, db=1, decode_responses=True)
    redis_client.ping()
    # Lua script for atomic sliding window rate limiting
    # KEYS[1]: rate limit key
    # ARGV[1]: current time (now)
    # ARGV[2]: window start time
    # ARGV[3]: limit
    # ARGV[4]: window seconds
    # Returns: { 1: allowed (1/0), 2: retry_after_seconds }
    RATE_LIMIT_LUA = """
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local window_start = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local window_seconds = tonumber(ARGV[4])
    
    -- 1. Remove timestamps outside the sliding window
    redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
    
    -- 2. Count requests in the current window
    local current_count = redis.call('ZCOUNT', key, window_start, now)
    
    if current_count >= limit then
        -- Find oldest request to calculate retry
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local retry_after = window_seconds
        if oldest and oldest[2] then
            retry_after = math.floor((tonumber(oldest[2]) + window_seconds) - now) + 1
        end
        return {0, retry_after}
    end
    
    -- 3. Add current request and update TTL
    -- Note: Using 'now' as both score and member. Microsecond collisions 
    -- could technically merge two requests into one entry, but the risk 
    -- is negligible for this application's scale.
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, window_seconds)
    
    return {1, 0}
    """
    check_rate_limit_script = redis_client.register_script(RATE_LIMIT_LUA)
    
except (redis.ConnectionError, redis.TimeoutError):
    redis_client = None


class SlidingWindowRateLimiter:
    """
    Sliding Window Rate Limiter algorithm.
    Uses Redis Sorted Sets for O(log(N)) scalable distributed rate limiting.
    Falls back to in-memory Dict if Redis is unavailable.
    """
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = {}
        
    def check_rate_limit(self, client_id: str):
        now = time.time()
        window_start = now - self.window_seconds
        
        if redis_client:
            # --- ATOMIC REDIS IMPLEMENTATION ---
            # Using Lua script prevents Time-of-check to Time-of-use (TOCTOU) race conditions
            key = f"rate_limit:{client_id}"
            
            # Script returns [is_allowed (1 or 0), retry_after]
            is_allowed, retry_after = check_rate_limit_script(
                keys=[key],
                args=[now, window_start, self.limit, self.window_seconds]
            )
            
            if is_allowed == 0:
                raise HTTPException(
                    status_code=429, 
                    detail=f"Rate limit exceeded ({self.limit} requests per {self.window_seconds}s). Please try again in {retry_after} seconds."
                )
        else:
            # --- FALLBACK IN-MEMORY IMPLEMENTATION ---
            if client_id not in self.requests:
                self.requests[client_id] = []
                
            self.requests[client_id] = [req_time for req_time in self.requests[client_id] if req_time > window_start]
            
            if len(self.requests[client_id]) >= self.limit:
                oldest_request = self.requests[client_id][0]
                retry_after = int((oldest_request + self.window_seconds) - now) + 1
                raise HTTPException(
                    status_code=429, 
                    detail=f"Rate limit exceeded ({self.limit} requests per {self.window_seconds}s). Please try again in {retry_after} seconds."
                )
                
            self.requests[client_id].append(now)

# Global rate limiter: 5 requests per 60 seconds
ml_rate_limiter = SlidingWindowRateLimiter(limit=5, window_seconds=60)
