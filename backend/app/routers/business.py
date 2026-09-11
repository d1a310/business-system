from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.core.security import get_current_user


router = APIRouter(
    prefix="/business",
    tags=["Business"],
)


# =========================================================
# SCHEMAS
# =========================================================

class BusinessSettingsResponse(BaseModel):
    id: int
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    description: str | None = None
    logo_url: str | None = None
    slug: str | None = None
    online_booking_enabled: bool


class BusinessSettingsUpdate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: str | None = Field(
        default=None,
        max_length=150,
    )

    address: str | None = None

    description: str | None = None

    logo_url: str | None = None

    slug: str = Field(
        min_length=3,
        max_length=100,
    )

    online_booking_enabled: bool = True


# =========================================================
# GET SETTINGS
# =========================================================

@router.get(
    "/settings",
    response_model=BusinessSettingsResponse,
)
def get_business_settings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.business_id:
        raise HTTPException(
            status_code=400,
            detail="Kullanıcı bir işletmeye bağlı değil.",
        )

    business = (
        db.query(Business)
        .filter(
            Business.id == current_user.business_id
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="İşletme bulunamadı.",
        )

    return business


# =========================================================
# UPDATE SETTINGS
# =========================================================

@router.put(
    "/settings",
    response_model=BusinessSettingsResponse,
)
def update_business_settings(
    data: BusinessSettingsUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.business_id:
        raise HTTPException(
            status_code=400,
            detail="Kullanıcı bir işletmeye bağlı değil.",
        )

    business = (
        db.query(Business)
        .filter(
            Business.id == current_user.business_id
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="İşletme bulunamadı.",
        )

    normalized_slug = (
        data.slug.strip()
        .lower()
        .replace(" ", "-")
    )

    existing_business = (
        db.query(Business)
        .filter(
            Business.slug == normalized_slug,
            Business.id != business.id,
        )
        .first()
    )

    if existing_business:
        raise HTTPException(
            status_code=409,
            detail="Bu özel bağlantı adresi zaten kullanılıyor.",
        )

    business.name = data.name.strip()

    business.phone = (
        data.phone.strip()
        if data.phone
        else None
    )

    business.email = (
        data.email.strip()
        if data.email
        else None
    )

    business.address = (
        data.address.strip()
        if data.address
        else None
    )

    business.description = (
        data.description.strip()
        if data.description
        else None
    )

    business.logo_url = (
        data.logo_url.strip()
        if data.logo_url
        else None
    )

    business.slug = normalized_slug

    business.online_booking_enabled = (
        data.online_booking_enabled
    )

    db.commit()
    db.refresh(business)

    return business