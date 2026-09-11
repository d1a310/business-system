from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from pydantic import BaseModel, EmailStr, Field

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.user import User
from app.models.appointment import Appointment
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)


class EmployeeCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: EmailStr | None = None

    position: str | None = Field(
        default=None,
        max_length=100,
    )

    is_active: bool = True


class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: EmailStr | None = None

    position: str | None = Field(
        default=None,
        max_length=100,
    )

    is_active: bool | None = None


class EmployeeResponse(BaseModel):
    id: int
    business_id: int
    full_name: str
    phone: str | None
    email: EmailStr | None
    position: str | None
    is_active: bool

    class Config:
        from_attributes = True


@router.get(
    "",
    response_model=list[EmployeeResponse],
)
def get_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employees = (
        db.query(Employee)
        .filter(
            Employee.business_id
            == current_user.business_id
        )
        .order_by(
            Employee.id.desc()
        )
        .all()
    )

    return employees


@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Çalışan bulunamadı.",
        )

    return employee


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = Employee(
        business_id=current_user.business_id,
        full_name=data.full_name,
        phone=data.phone,
        email=data.email,
        position=data.position,
        is_active=data.is_active,
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    return employee


@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse,
)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Çalışan bulunamadı.",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(employee, key, value)

    db.commit()
    db.refresh(employee)

    return employee


@router.delete(
    "/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Çalışan bulunamadı.",
        )

    appointment_count = (
        db.query(Appointment)
        .filter(
            Appointment.employee_id == employee_id,
            Appointment.business_id
            == current_user.business_id,
        )
        .count()
    )

    if appointment_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Bu çalışana bağlı randevular var, çalışan silinemez.",
        )

    db.delete(employee)
    db.commit()

    return None