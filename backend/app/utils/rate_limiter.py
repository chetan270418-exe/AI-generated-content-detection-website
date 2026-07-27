import time
from typing import Dict, List, Optional
from fastapi import HTTPException
import redis

# Redis connection for rate limiting (fallback to None if unavailable)
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=1, decode_responses=True)
    redis_client.ping()
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
            # --- REDIS IMPLEMENTATION ---
            key = f"rate_limit:{client_id}"
            pipeline = redis_client.pipeline()
            
            # 1. Remove timestamps outside the sliding window
            pipeline.zremrangebyscore(key, 0, window_start)
            # 2. Count requests in the current window
            pipeline.zcount(key, window_start, now)
            # 3. Add current request (score=timestamp, value=timestamp)
            pipeline.zadd(key, {str(now): now})
            # 4. Set TTL to window_seconds so we don't leak memory for inactive clients
            pipeline.expire(key, self.window_seconds)
            
            results = pipeline.execute()
            req_count = results[1]
            
            if req_count >= self.limit:
                # If over limit, we technically just added a new request. Let's remove it.
                redis_client.zrem(key, str(now))
                
                # Find oldest request to calculate retry
                oldest = redis_client.zrange(key, 0, 0, withscores=True)
                if oldest:
                    retry_after = int((oldest[0][1] + self.window_seconds) - now) + 1
                else:
                    retry_after = self.window_seconds
                    
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
