"""
Database helper utilities for common operations.
"""
from typing import Any
from pydantic import BaseModel
from sqlalchemy.orm import DeclarativeBase


def apply_updates(db_model: Any, update_schema: BaseModel) -> None:
    """
    Apply Pydantic schema updates to SQLAlchemy model.
    
    Only updates fields that are present in the schema (exclude_unset=True)
    and exist on the model.
    
    Args:
        db_model: SQLAlchemy model instance to update
        update_schema: Pydantic schema with update data
    """
    update_data = update_schema.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(db_model, field):
            setattr(db_model, field, value)
