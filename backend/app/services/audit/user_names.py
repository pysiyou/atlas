"""Resolve performer display names for lab operation audit logs."""
from app.models.lab_audit import LabOperationLog
from app.models.user import User
from sqlalchemy.orm import Session


def build_performer_name_map(db: Session, logs: list[LabOperationLog]) -> dict[str, str]:
    user_ids = {
        int(log.performedBy) for log in logs if log.performedBy and log.performedBy.isdigit()
    }
    if not user_ids:
        return {}
    users = db.query(User.id, User.name).filter(User.id.in_(user_ids)).all()
    return {str(user.id): user.name for user in users}
