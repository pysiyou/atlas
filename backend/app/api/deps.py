"""
Common API dependencies for route handlers.
"""
from typing import Annotated
from fastapi import Query, Depends

# Pagination defaults
DEFAULT_PAGE_SIZE = 100
MAX_PAGE_SIZE = 1000


def pagination_params(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Max records to return")
) -> dict:
    """
    Standard pagination parameters for list endpoints.
    
    Returns:
        Dictionary with skip and limit values
    """
    return {"skip": skip, "limit": limit}


# Type alias for dependency injection
PaginationParams = Annotated[dict, Depends(pagination_params)]
