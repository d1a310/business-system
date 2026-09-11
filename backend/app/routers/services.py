from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.service import Service
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/services",
    tags=["Services"],
)


# =========================================================
# SCHEMAS
# =========================================================

class ServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    price: float = Field(default=0, ge=0)
    duration_minutes: int = Field(default=30, ge=30, le=480)
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    price: float = Field(default=0, ge=0)
    duration_minutes: int = Field(default=30, ge=30, le=480)
    is_active: bool = True


class ServiceResponse(BaseModel):
    id: int
    business_id: int
    name: str
    description: str | None
    price: float
    duration_minutes: int
    is_active: bool

    class Config:
        from_attributes = True


# =========================================================
# VALIDATION
# =========================================================

def validate_duration(duration_minutes: int):
    if duration_minutes < 30:
        raise HTTPException(
            status_code=400,
            detail="Hizmet süresi en az 30 dakika olmalıdır.",
        )

    if duration_minutes > 480:
        raise HTTPException(
            status_code=400,
            detail="Hizmet süresi en fazla 480 dakika olabilir.",
        )

    if duration_minutes % 30 != 0:
        raise HTTPException(
            status_code=400,
            detail="Hizmet süresi 30 dakikanın katı olmalıdır.",
        )


# =========================================================
# GET ALL
# =========================================================

@router.get(
    "",
    response_model=list[ServiceResponse],
)
def get_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    services = (
        db.query(Service)
        .filter(
            Service.business_id
            == current_user.business_id
        )
        .order_by(Service.id.asc())
        .all()
    )

    return services


# =========================================================
# GET ONE
# =========================================================

@router.get(
    "/{service_id}",
    response_model=ServiceResponse,
)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Hizmet bulunamadı.",
        )

    return service


# =========================================================
# CREATE
# =========================================================

@router.post(
    "",
    response_model=ServiceResponse,
    status_code=201,
)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_duration(
        data.duration_minutes
    )

    service = Service(
        business_id=current_user.business_id,
        name=data.name.strip(),
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        price=data.price,
        duration_minutes=data.duration_minutes,
        is_active=data.is_active,
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return service


# =========================================================
# UPDATE
# =========================================================

@router.put(
    "/{service_id}",
    response_model=ServiceResponse,
)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Hizmet bulunamadı.",
        )

    validate_duration(
        data.duration_minutes
    )

    service.name = data.name.strip()

    service.description = (
        data.description.strip()
        if data.description
        else None
    )

    service.price = data.price

    service.duration_minutes = (
        data.duration_minutes
    )

    service.is_active = data.is_active

    db.commit()
    db.refresh(service)

    return service


# =========================================================
# DELETE
# =========================================================

@router.delete(
    "/{service_id}",
)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Hizmet bulunamadı.",
        )

    # Hizmete bağlı randevuları kontrol et
    appointment_count = (
        db.query(
            __import__(
                "app.models.appointment",
                fromlist=["Appointment"],
            ).Appointment
        )
        .filter(
            __import__(
                "app.models.appointment",
                fromlist=["Appointment"],
            ).Appointment.service_id == service_id
        )
        .count()
    )

    if appointment_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Bu hizmete bağlı randevular bulunduğu "
                "için hizmet silinemez. Hizmeti pasif "
                "hale getirebilirsin."
            ),
        )

    db.delete(service)
    db.commit()

    return {
        "message": "Hizmet başarıyla silindi.",
        "id": service_id,
    }