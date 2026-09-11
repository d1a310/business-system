from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey

from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)

    business_id = Column(
        Integer,
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    description = Column(
        String(500),
        nullable=True,
    )

    price = Column(
        Numeric(10, 2),
        nullable=False,
        default=0,
    )

    duration_minutes = Column(
        Integer,
        nullable=False,
        default=30,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )