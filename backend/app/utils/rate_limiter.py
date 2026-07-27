import time
from typing import Dict, List
from fastapi import HTTPException

class SlidingWindowRateLimiter:
    """
    Sliding Window Rate Limiter algorithm.
    More precise than Token Bucket, it tracks exact timestamps of requests 
    within a moving time window to prevent bursting across boundaries.
    """
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        # In a real distributed system this would be Redis. 
        # For this implementation, we use an in-memory Hash Map (O(1) lookups).
        self.requests: Dict[str, List[float]] = {}
        
    def check_rate_limit(self, client_id: str):
        """
        Validates if a client is within their rate limit.
        Throws HTTPException 429 if exceeded.
        """
        now = time.time()
        window_start = now - self.window_seconds
        
        if client_id not in self.requests:
            self.requests[client_id] = []
            
        # 1. Remove outdated timestamps outside the sliding window
        # (Using a simple list comprehension is O(N) where N is very small (e.g. 5))
        self.requests[client_id] = [req_time for req_time in self.requests[client_id] if req_time > window_start]
        
        # 2. Check if we are over the limit
        if len(self.requests[client_id]) >= self.limit:
            oldest_request = self.requests[client_id][0]
            retry_after = int((oldest_request + self.window_seconds) - now) + 1
            raise HTTPException(
                status_code=429, 
                detail=f"Rate limit exceeded ({self.limit} requests per {self.window_seconds}s). Please try again in {retry_after} seconds."
            )
            
        # 3. Add current request timestamp
        self.requests[client_id].append(now)

# Global rate limiter: 5 requests per 60 seconds
ml_rate_limiter = SlidingWindowRateLimiter(limit=5, window_seconds=60)
