"""
Database helper utilities for common operations.
"""
from typing import Any, Type, TypeVar, Union
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

T = TypeVar("T")


def apply_updates(db_model: Any, update_schema: BaseModel) -> None:
    """
    Apply Pydantic schema updates to SQLAlchemy model.
    Only updates fields that are present in the schema (exclude_unset=True)
    and exist on the model.
    """
    update_data = update_schema.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(db_model, field):
            setattr(db_model, field, value)


def get_or_404(
    db: Session,
    model: Type[T],
    id_value: Union[int, str],
    id_field: str = "id",
    detail: str | None = None,
) -> T:
    """
    Fetch entity by ID or raise 404 HTTPException.
    Supports int (orderId, patientId, paymentId) or str IDs.
    """
    entity = db.query(model).filter(getattr(model, id_field) == id_value).first()
    if not entity:
        raise HTTPException(
            status_code=404,
            detail=detail or f"{model.__name__} not found",
        )
    return entity
