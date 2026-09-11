from sqlalchemy import (
    Column,
    Integer,
    Time,
    Boolean,
    ForeignKey,
)

from app.database import Base


class EmployeeWorkingHour(Base):
    __tablename__ = "employee_working_hours"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    employee_id = Column(
        Integer,
        ForeignKey(
            "employees.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    day_of_week = Column(
        Integer,
        nullable=False,
    )

    start_time = Column(
        Time,
        nullable=True,
    )

    end_time = Column(
        Time,
        nullable=True,
    )

    is_day_off = Column(
        Boolean,
        nullable=False,
        default=False,
    )