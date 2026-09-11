from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    business_id = Column(
        Integer,
        ForeignKey(
            "businesses.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    notification_type = Column(
        String(50),
        nullable=False,
        default="INFO",
    )

    entity_type = Column(
        String(50),
        nullable=True,
    )

    entity_id = Column(
        Integer,
        nullable=True,
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )