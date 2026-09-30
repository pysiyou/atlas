"""
Redis caching utilities for Atlas backend.
Provides connection management and invalidation helpers.
"""
import hashlib
import json
from datetime import datetime
from typing import Any

import redis

from app.core.config import settings

# Redis client singleton
_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis | None:
    """Get Redis client instance. Returns None if caching is disabled or connection fails."""
    global _redis_client

    if not settings.CACHE_ENABLED:
        return None

    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            # Test connection
            _redis_client.ping()
        except (redis.ConnectionError, redis.TimeoutError):
            _redis_client = None

    return _redis_client


def close_redis():
    """Close Redis connection."""
    global _redis_client
    if _redis_client is not None:
        _redis_client.close()
        _redis_client = None


class CacheKeys:
    """Cache key patterns for different data types."""

    # Static data (1 hour TTL)
    TESTS_CATALOG = "tests:catalog"
    TESTS_BY_CODE = "tests:code:{code}"
    AFFILIATIONS_PRICING = "affiliations:pricing"
    LAB_BOARD_SUMMARY_PREFIX = "lab:board:summary"


def generate_cache_key(base_key: str, **params) -> str:
    """Generate cache key with optional parameters."""
    if not params:
        return base_key

    # Filter out None values and sort for consistency
    filtered = {k: v for k, v in sorted(params.items()) if v is not None}
    if not filtered:
        return base_key

    # Create hash of parameters for complex keys
    param_str = json.dumps(filtered, sort_keys=True, default=str)
    param_hash = hashlib.md5(param_str.encode()).hexdigest()[:8]
    return f"{base_key}:{param_hash}"


def cache_get(key: str) -> Any | None:
    """Get value from cache."""
    client = get_redis()
    if client is None:
        return None

    try:
        data = client.get(key)
        if data:
            return json.loads(data)
    except (redis.RedisError, json.JSONDecodeError):
        pass

    return None


def cache_set(key: str, value: Any, ttl: int) -> bool:
    """Set value in cache with TTL."""
    client = get_redis()
    if client is None:
        return False

    try:
        serialized = json.dumps(value, default=_json_serializer)
        client.setex(key, ttl, serialized)
        return True
    except (redis.RedisError, TypeError):
        return False


def cache_delete(key: str) -> bool:
    """Delete a key from cache."""
    client = get_redis()
    if client is None:
        return False

    try:
        client.delete(key)
        return True
    except redis.RedisError:
        return False


def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching pattern. Returns count of deleted keys."""
    client = get_redis()
    if client is None:
        return 0

    try:
        keys = list(client.scan_iter(match=pattern))
        if keys:
            return client.delete(*keys)
    except redis.RedisError:
        pass

    return 0


def invalidate_lab_board_summary_cache() -> int:
    """Invalidate cached lab monitor board summaries (all role scopes)."""
    return cache_delete_pattern(f"{CacheKeys.LAB_BOARD_SUMMARY_PREFIX}:*")


def invalidate_tests_cache():
    """Invalidate all test-related caches."""
    cache_delete(CacheKeys.TESTS_CATALOG)
    cache_delete_pattern("tests:code:*")
    cache_delete_pattern("tests:catalog:*")


def _json_serializer(obj: Any) -> str:
    """JSON serializer for objects not serializable by default."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if hasattr(obj, "__dict__"):
        return obj.__dict__
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
