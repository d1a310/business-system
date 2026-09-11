from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.employee_working_hour import EmployeeWorkingHour
from app.models.appointment import Appointment
from app.models.service import Service
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/employees",
    tags=["Employee Working Hours"]
)


DAY_NAMES = {
    0: "Pazartesi",
    1: "Salı",
    2: "Çarşamba",
    3: "Perşembe",
    4: "Cuma",
    5: "Cumartesi",
    6: "Pazar",
}


# =========================================================
# SCHEMAS
# =========================================================

class WorkingHourItem(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    is_day_off: bool = False


class WorkingHoursUpdate(BaseModel):
    hours: list[WorkingHourItem]


class WorkingHourResponse(BaseModel):
    id: int
    employee_id: int
    day_of_week: int
    start_time: time | None
    end_time: time | None
    is_day_off: bool

    class Config:
        from_attributes = True


class AvailableSlotResponse(BaseModel):
    time: str


# =========================================================
# HELPER
# =========================================================

def get_employee_for_business(
    employee_id: int,
    business_id: int,
    db: Session
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.business_id == business_id
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Çalışan bulunamadı."
        )

    return employee


# =========================================================
# GET WORKING HOURS
# =========================================================

@router.get(
    "/{employee_id}/working-hours",
    response_model=list[WorkingHourResponse]
)
def get_working_hours(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_employee_for_business(
        employee_id,
        current_user.business_id,
        db
    )

    existing = (
        db.query(EmployeeWorkingHour)
        .filter(
            EmployeeWorkingHour.employee_id == employee_id
        )
        .order_by(
            EmployeeWorkingHour.day_of_week
        )
        .all()
    )

    if len(existing) == 7:
        return existing

    existing_by_day = {
        item.day_of_week: item
        for item in existing
    }

    for day in range(7):

        if day in existing_by_day:
            continue

        new_row = EmployeeWorkingHour(
            employee_id=employee_id,
            day_of_week=day,
            start_time=time(9, 0),
            end_time=time(18, 0),
            is_day_off=False
        )

        db.add(new_row)

    db.flush()
    db.commit()

    result = (
        db.query(EmployeeWorkingHour)
        .filter(
            EmployeeWorkingHour.employee_id == employee_id
        )
        .order_by(
            EmployeeWorkingHour.day_of_week
        )
        .all()
    )

    return result


# =========================================================
# UPDATE WORKING HOURS
# =========================================================

@router.put(
    "/{employee_id}/working-hours",
    response_model=list[WorkingHourResponse]
)
def update_working_hours(
    employee_id: int,
    data: WorkingHoursUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_employee_for_business(
        employee_id,
        current_user.business_id,
        db
    )

    if len(data.hours) != 7:
        raise HTTPException(
            status_code=400,
            detail="Tam olarak 7 gün gönderilmelidir."
        )

    day_numbers = [
        item.day_of_week
        for item in data.hours
    ]

    if sorted(day_numbers) != list(range(7)):
        raise HTTPException(
            status_code=400,
            detail=(
                "day_of_week değerleri "
                "0 ile 6 arasında ve benzersiz olmalıdır."
            )
        )

    existing = (
        db.query(EmployeeWorkingHour)
        .filter(
            EmployeeWorkingHour.employee_id == employee_id
        )
        .all()
    )

    existing_by_day = {
        item.day_of_week: item
        for item in existing
    }

    for item in data.hours:

        if item.is_day_off:
            start_time = None
            end_time = None

        else:
            if (
                item.start_time is None
                or item.end_time is None
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"{DAY_NAMES[item.day_of_week]} için "
                        "başlangıç ve bitiş saati zorunludur."
                    )
                )

            if item.start_time >= item.end_time:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"{DAY_NAMES[item.day_of_week]} için "
                        "başlangıç saati bitiş saatinden "
                        "önce olmalıdır."
                    )
                )

            start_time = item.start_time
            end_time = item.end_time

        if item.day_of_week in existing_by_day:

            row = existing_by_day[item.day_of_week]

            row.start_time = start_time
            row.end_time = end_time
            row.is_day_off = item.is_day_off

        else:

            row = EmployeeWorkingHour(
                employee_id=employee_id,
                day_of_week=item.day_of_week,
                start_time=start_time,
                end_time=end_time,
                is_day_off=item.is_day_off
            )

            db.add(row)

    db.commit()

    updated = (
        db.query(EmployeeWorkingHour)
        .filter(
            EmployeeWorkingHour.employee_id == employee_id
        )
        .order_by(
            EmployeeWorkingHour.day_of_week
        )
        .all()
    )

    return updated


# =========================================================
# AVAILABLE APPOINTMENT SLOTS
# =========================================================

@router.get(
    "/{employee_id}/available-slots",
    response_model=list[AvailableSlotResponse]
)
def get_available_slots(
    employee_id: int,
    selected_date: date = Query(..., alias="date"),
    service_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Seçilen çalışan + tarih + hizmet için
    gerçekten kullanılabilir başlangıç saatlerini döndürür.

    Slot aralığı 30 dakikadır.
    Hizmetin duration_minutes değeri kadar
    kesintisiz boş alan aranır.
    """

    # -----------------------------------------------------
    # ÇALIŞANI KONTROL ET
    # -----------------------------------------------------

    employee = get_employee_for_business(
        employee_id,
        current_user.business_id,
        db
    )

    if not employee.is_active:
        return []

    # -----------------------------------------------------
    # HİZMETİ KONTROL ET
    # -----------------------------------------------------

    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.business_id == current_user.business_id,
            Service.is_active == True
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Hizmet bulunamadı veya aktif değil."
        )

    duration_minutes = service.duration_minutes or 30

    # Süre 30'un katı olmalı
    if duration_minutes <= 0:
        duration_minutes = 30

    if duration_minutes % 30 != 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Hizmet süresi 30 dakikanın katı olmalıdır."
            )
        )

    required_slot_count = duration_minutes // 30

    # -----------------------------------------------------
    # ÇALIŞMA GÜNÜ
    # -----------------------------------------------------

    day_of_week = selected_date.weekday()

    working_hour = (
        db.query(EmployeeWorkingHour)
        .filter(
            EmployeeWorkingHour.employee_id == employee_id,
            EmployeeWorkingHour.day_of_week == day_of_week
        )
        .first()
    )

    if not working_hour:
        return []

    # Tatil
    if working_hour.is_day_off:
        return []

    if (
        working_hour.start_time is None
        or working_hour.end_time is None
    ):
        return []

    # -----------------------------------------------------
    # MEVCUT RANDEVULAR
    # -----------------------------------------------------

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.employee_id == employee_id,
            Appointment.business_id == current_user.business_id,
            Appointment.appointment_date == selected_date
        )
        .all()
    )

    occupied_slots = set()

    for appointment in appointments:

        status = str(
            appointment.status
        ).upper()

        # İptal randevuları engel değil
        if status in {
            "CANCELLED",
            "CANCELED"
        }:
            continue

        appointment_time = appointment.appointment_time

        if isinstance(
            appointment_time,
            time
        ):
            start_datetime = datetime.combine(
                selected_date,
                appointment_time
            )
        else:
            try:
                parsed_time = time.fromisoformat(
                    str(appointment_time)
                )

                start_datetime = datetime.combine(
                    selected_date,
                    parsed_time
                )

            except ValueError:
                continue

        # Mevcut randevunun hizmetini bul
        appointment_service = (
            db.query(Service)
            .filter(
                Service.id == appointment.service_id
            )
            .first()
        )

        appointment_duration = (
            appointment_service.duration_minutes
            if appointment_service
            and appointment_service.duration_minutes
            else 30
        )

        appointment_slot_count = (
            max(1, appointment_duration // 30)
        )

        # Randevunun kapladığı tüm 30 dk slotlarını işaretle
        for slot_index in range(
            appointment_slot_count
        ):

            blocked_datetime = (
                start_datetime
                + timedelta(
                    minutes=30 * slot_index
                )
            )

            blocked_time = (
                blocked_datetime
                .time()
                .strftime("%H:%M")
            )

            occupied_slots.add(
                blocked_time
            )

    # -----------------------------------------------------
    # UYGUN BAŞLANGIÇ SAATLERİ
    # -----------------------------------------------------

    slots = []

    start_datetime = datetime.combine(
        selected_date,
        working_hour.start_time
    )

    end_datetime = datetime.combine(
        selected_date,
        working_hour.end_time
    )

    slot_duration = timedelta(minutes=30)

    current_datetime = start_datetime

    while (
        current_datetime
        + timedelta(minutes=duration_minutes)
        <= end_datetime
    ):

        possible_slots = []

        # Hizmetin ihtiyacı kadar 30 dk kontrol et
        for slot_index in range(
            required_slot_count
        ):

            check_datetime = (
                current_datetime
                + slot_duration * slot_index
            )

            check_time = (
                check_datetime
                .time()
                .strftime("%H:%M")
            )

            possible_slots.append(
                check_time
            )

        # Tüm süre boyunca boşsa başlangıç saati uygundur
        is_available = all(
            slot not in occupied_slots
            for slot in possible_slots
        )

        if is_available:
            slots.append(
                AvailableSlotResponse(
                    time=current_datetime
                    .time()
                    .strftime("%H:%M")
                )
            )

        current_datetime += slot_duration

    return slots