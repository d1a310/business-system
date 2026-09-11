from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
)
from sqlalchemy.sql import func

from app.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    phone = Column(
        String(30),
        nullable=True,
    )

    email = Column(
        String(150),
        nullable=True,
    )

    address = Column(
        Text,
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    logo_url = Column(
        Text,
        nullable=True,
    )

    slug = Column(
        String(100),
        nullable=True,
        unique=True,
        index=True,
    )

    online_booking_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )