"""Read/query operations for specimens."""
from app.domains.lab.models.sample import Sample
from app.shared.contracts.enums import SampleStatus
from sqlalchemy.orm import Session


class SpecimenQueryService:
    """Read/query operations for samples."""

    def __init__(self, db: Session):
        self.db = db

    def list_samples(
        self,
        skip: int,
        limit: int,
        order_id: int | None = None,
        sample_status: SampleStatus | None = None,
        paginated: bool = False,
    ):
        from app.domains.lab.schemas.sample import SampleResponse
        from app.shared.schemas.pagination import create_paginated_response, skip_to_page
        from fastapi import HTTPException
        from fastapi import status as http_status

        query = self.db.query(Sample)
        if order_id:
            query = query.filter(Sample.orderId == order_id)
        if sample_status:
            query = query.filter(Sample.status == sample_status)
        query = query.order_by(Sample.updatedAt.desc())
        total = query.count() if paginated else 0
        samples = query.offset(skip).limit(limit).all()
        try:
            serialized = [SampleResponse.model_validate(s).model_dump(mode="json") for s in samples]
        except Exception:
            import logging

            logging.getLogger(__name__).exception("Error serializing samples")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error processing sample data",
            )
        if paginated:
            return create_paginated_response(serialized, total, skip_to_page(skip, limit), limit)
        return serialized

    def list_pending(self) -> list:
        return (
            self.db.query(Sample)
            .filter(Sample.status == SampleStatus.PENDING)
            .order_by(Sample.updatedAt.desc())
            .all()
        )

    def get_by_id(self, sample_id: int) -> Sample:
        from fastapi import HTTPException
        from fastapi import status as http_status

        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Sample {sample_id} not found",
            )
        return sample
