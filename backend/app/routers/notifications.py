from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.core.security import get_current_user


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    entity_type: str | None = None
    entity_id: int | None = None
    is_read: bool
    created_at: datetime

    # SQLAlchemy modelinden Pydantic response üretilebilmesi için
    model_config = ConfigDict(from_attributes=True)


class NotificationCountResponse(BaseModel):
    unread_count: int


@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.business_id:
        raise HTTPException(
            status_code=400,
            detail="Kullanıcının işletme bilgisi bulunamadı.",
        )

    notifications = (
        db.query(Notification)
        .filter(
            Notification.business_id == current_user.business_id
        )
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )

    return notifications


@router.get(
    "/unread-count",
    response_model=NotificationCountResponse,
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.business_id:
        raise HTTPException(
            status_code=400,
            detail="Kullanıcının işletme bilgisi bulunamadı.",
        )

    count = (
        db.query(Notification)
        .filter(
            Notification.business_id == current_user.business_id,
            Notification.is_read == False,
        )
        .count()
    )

    return {
        "unread_count": count
    }


@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.business_id:
        raise HTTPException(
            status_code=400,
            detail="Kullanıcının işletme bilgisi bulunamadı.",
        )

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.business_id == current_user.business_id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Bildirim bulunamadı.",
        )

    notification.is_read = True
    db.commit()

    return {
        "message": "Bildirim okundu olarak işaretlendi."
    }


@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.business_id:
        raise HTTPException(
            status_code=400,
            detail="Kullanıcının işletme bilgisi bulunamadı.",
        )

    (
        db.query(Notification)
        .filter(
            Notification.business_id == current_user.business_id,
            Notification.is_read == False,
        )
        .update(
            {
                Notification.is_read: True
            },
            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "message": "Tüm bildirimler okundu olarak işaretlendi."
    }