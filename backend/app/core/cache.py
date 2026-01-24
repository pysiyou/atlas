"""
Redis caching utilities for Atlas backend.
Provides connection management, caching decorators, and invalidation helpers.
"""
import json
import hashlib
from functools import wraps
from typing import Any, Callable, TypeVar, Optional
from datetime import datetime

import redis
from app.config import settings

T = TypeVar("T")

# Redis client singleton
_redis_client: Optional[redis.Redis] = None


def get_redis() -> Optional[redis.Redis]:
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

    # Semi-static data (5 min TTL)
    PATIENTS_LIST = "patients:list"
    PATIENTS_BY_ID = "patients:id:{id}"

    # Dynamic data (1 min TTL) - generally not cached
    ORDERS_LIST = "orders:list"


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


def cache_get(key: str) -> Optional[Any]:
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


def invalidate_tests_cache():
    """Invalidate all test-related caches."""
    cache_delete(CacheKeys.TESTS_CATALOG)
    cache_delete_pattern("tests:code:*")
    cache_delete_pattern("tests:catalog:*")


def invalidate_affiliations_cache():
    """Invalidate all affiliation-related caches."""
    cache_delete(CacheKeys.AFFILIATIONS_PRICING)
    cache_delete_pattern("affiliations:*")


def invalidate_patients_cache():
    """Invalidate all patient-related caches."""
    cache_delete(CacheKeys.PATIENTS_LIST)
    cache_delete_pattern("patients:*")


def _json_serializer(obj: Any) -> str:
    """JSON serializer for objects not serializable by default."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if hasattr(obj, "__dict__"):
        return obj.__dict__
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def cached(
    key_template: str,
    ttl: int | None = None,
    key_params: list[str] | None = None,
):
    """
    Decorator to cache function results.

    Args:
        key_template: Cache key template (e.g., "tests:catalog")
        ttl: Time-to-live in seconds. Defaults to CACHE_TTL_STATIC.
        key_params: List of function argument names to include in cache key.
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            # Build cache key from parameters
            if key_params:
                param_values = {k: kwargs.get(k) for k in key_params}
                cache_key = generate_cache_key(key_template, **param_values)
            else:
                cache_key = key_template

            # Try to get from cache
            cached_value = cache_get(cache_key)
            if cached_value is not None:
                return cached_value

            # Execute function
            result = func(*args, **kwargs)

            # Cache the result
            cache_ttl = ttl if ttl is not None else settings.CACHE_TTL_STATIC
            cache_set(cache_key, result, cache_ttl)

            return result

        return wrapper

    return decorator
