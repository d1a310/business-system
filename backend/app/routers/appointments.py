from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.employee_working_hour import EmployeeWorkingHour
from app.models.service import Service
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


# =========================================================
# SABİTLER
# =========================================================

CANCELLED_STATUSES = {
    "CANCELLED",
    "CANCELED",
}

VALID_STATUSES = {
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
}


# =========================================================
# SCHEMAS
# =========================================================

class AppointmentCreate(BaseModel):
    customer_id: int
    service_id: int
    employee_id: int
    appointment_date: date
    appointment_time: time
    notes: str | None = None


class AppointmentStatusUpdate(BaseModel):
    status: str


class AppointmentResponse(BaseModel):
    id: int
    business_id: int
    customer_id: int
    service_id: int

    # Eski randevular için NULL olabilir.
    employee_id: int | None = None

    appointment_date: date
    appointment_time: time
    status: str
    notes: str | None = None

    class Config:
        from_attributes = True


# =========================================================
# YARDIMCI FONKSİYONLAR
# =========================================================

def normalize_status(value) -> str:
    if value is None:
        return ""

    if hasattr(value, "value"):
        return str(value.value).upper()

    return str(value).upper()


def get_customer_for_business(
    customer_id: int,
    business_id: int,
    db: Session,
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.business_id == business_id,
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Müşteri bulunamadı.",
        )

    return customer


def get_service_for_business(
    service_id: int,
    business_id: int,
    db: Session,
    require_active: bool = True,
):
    query = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.business_id == business_id,
        )
    )

    if require_active:
        query = query.filter(
            Service.is_active == True
        )

    service = query.first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail=(
                "Hizmet bulunamadı veya aktif değil."
                if require_active
                else "Hizmet bulunamadı."
            ),
        )

    return service


def get_employee_for_business(
    employee_id: int,
    business_id: int,
    db: Session,
    require_active: bool = True,
):
    query = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.business_id == business_id,
        )
    )

    if require_active:
        query = query.filter(
            Employee.is_active == True
        )

    employee = query.first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail=(
                "Çalışan bulunamadı veya aktif değil."
                if require_active
                else "Çalışan bulunamadı."
            ),
        )

    return employee


def get_service_duration(
    service: Service,
) -> int:
    duration = service.duration_minutes

    if duration is None:
        return 30

    try:
        duration = int(duration)
    except (TypeError, ValueError):
        return 30

    if duration <= 0:
        return 30

    return duration


def build_interval(
    appointment_date: date,
    appointment_time: time,
    duration_minutes: int,
):
    start = datetime.combine(
        appointment_date,
        appointment_time,
    )

    end = start + timedelta(
        minutes=duration_minutes,
    )

    return start, end


def intervals_overlap(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> bool:
    return (
        start_a < end_b
        and end_a > start_b
    )


def get_working_hour(
    employee_id: int,
    selected_date: date,
    db: Session,
):
    return (
        db.query(EmployeeWorkingHour)
        .filter(
            EmployeeWorkingHour.employee_id == employee_id,
            EmployeeWorkingHour.day_of_week == selected_date.weekday(),
        )
        .first()
    )


def validate_working_hours(
    employee_id: int,
    selected_date: date,
    appointment_time: time,
    duration_minutes: int,
    db: Session,
):
    working_hour = get_working_hour(
        employee_id,
        selected_date,
        db,
    )

    if not working_hour:
        raise HTTPException(
            status_code=400,
            detail="Çalışanın bu gün için çalışma saati tanımlı değil.",
        )

    if working_hour.is_day_off:
        raise HTTPException(
            status_code=400,
            detail="Çalışan seçilen gün izinli.",
        )

    if (
        working_hour.start_time is None
        or working_hour.end_time is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Çalışanın çalışma saatleri eksik.",
        )

    appointment_start, appointment_end = build_interval(
        selected_date,
        appointment_time,
        duration_minutes,
    )

    working_start = datetime.combine(
        selected_date,
        working_hour.start_time,
    )

    working_end = datetime.combine(
        selected_date,
        working_hour.end_time,
    )

    if appointment_start < working_start:
        raise HTTPException(
            status_code=400,
            detail=(
                "Randevu çalışanın çalışma başlangıç "
                "saatinden önce olamaz."
            ),
        )

    if appointment_end > working_end:
        raise HTTPException(
            status_code=400,
            detail=(
                "Randevu hizmet süresi nedeniyle "
                "çalışma saatinin dışına taşıyor."
            ),
        )


def check_appointment_conflict(
    business_id: int,
    employee_id: int,
    appointment_date: date,
    appointment_time: time,
    duration_minutes: int,
    db: Session,
    exclude_appointment_id: int | None = None,
):
    new_start, new_end = build_interval(
        appointment_date,
        appointment_time,
        duration_minutes,
    )

    query = (
        db.query(Appointment)
        .filter(
            Appointment.business_id == business_id,
            Appointment.employee_id == employee_id,
            Appointment.appointment_date == appointment_date,
        )
    )

    if exclude_appointment_id is not None:
        query = query.filter(
            Appointment.id != exclude_appointment_id
        )

    existing_appointments = query.all()

    for existing in existing_appointments:

        existing_status = normalize_status(
            existing.status
        )

        # İptal edilmiş randevu slotu kapatmaz.
        if existing_status in CANCELLED_STATUSES:
            continue

        existing_service = (
            db.query(Service)
            .filter(
                Service.id == existing.service_id
            )
            .first()
        )

        if existing_service:
            existing_duration = get_service_duration(
                existing_service
            )
        else:
            existing_duration = 30

        existing_start, existing_end = build_interval(
            existing.appointment_date,
            existing.appointment_time,
            existing_duration,
        )

        if intervals_overlap(
            new_start,
            new_end,
            existing_start,
            existing_end,
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Bu çalışanın seçilen saatinde "
                    "başka bir randevu bulunuyor."
                ),
            )


# =========================================================
# GET ALL APPOINTMENTS
# =========================================================

@router.get(
    "",
    response_model=list[AppointmentResponse],
)
def get_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.business_id
            == current_user.business_id
        )
        .order_by(
            Appointment.appointment_date.asc(),
            Appointment.appointment_time.asc(),
        )
        .all()
    )

    for appointment in appointments:
        appointment.status = normalize_status(
            appointment.status
        )

    return appointments


# =========================================================
# GET SINGLE APPOINTMENT
# =========================================================

@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Randevu bulunamadı.",
        )

    appointment.status = normalize_status(
        appointment.status
    )

    return appointment


# =========================================================
# CREATE APPOINTMENT
# =========================================================

@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=201,
)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # TARİH
    # -----------------------------------------------------

    if data.appointment_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Geçmiş bir tarihe randevu oluşturulamaz.",
        )

    # -----------------------------------------------------
    # MÜŞTERİ
    # -----------------------------------------------------

    get_customer_for_business(
        data.customer_id,
        current_user.business_id,
        db,
    )

    # -----------------------------------------------------
    # HİZMET
    # -----------------------------------------------------

    service = get_service_for_business(
        data.service_id,
        current_user.business_id,
        db,
        require_active=True,
    )

    # -----------------------------------------------------
    # ÇALIŞAN
    # -----------------------------------------------------

    get_employee_for_business(
        data.employee_id,
        current_user.business_id,
        db,
        require_active=True,
    )

    # -----------------------------------------------------
    # HİZMET SÜRESİ
    # -----------------------------------------------------

    duration_minutes = get_service_duration(
        service
    )

    # -----------------------------------------------------
    # ÇALIŞMA SAATLERİ
    # -----------------------------------------------------

    validate_working_hours(
        employee_id=data.employee_id,
        selected_date=data.appointment_date,
        appointment_time=data.appointment_time,
        duration_minutes=duration_minutes,
        db=db,
    )

    # -----------------------------------------------------
    # ÇAKIŞMA KONTROLÜ
    # -----------------------------------------------------

    check_appointment_conflict(
        business_id=current_user.business_id,
        employee_id=data.employee_id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        duration_minutes=duration_minutes,
        db=db,
    )

    # -----------------------------------------------------
    # KAYIT
    # -----------------------------------------------------

    appointment = Appointment(
        business_id=current_user.business_id,
        customer_id=data.customer_id,
        service_id=data.service_id,
        employee_id=data.employee_id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        status="PENDING",
        notes=data.notes,
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    appointment.status = normalize_status(
        appointment.status
    )

    return appointment


# =========================================================
# UPDATE STATUS
# =========================================================

@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
)
def update_appointment_status(
    appointment_id: int,
    data: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Randevu bulunamadı.",
        )

    new_status = normalize_status(
        data.status
    )

    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Geçersiz randevu durumu. "
                "Kullanılabilecek durumlar: "
                "PENDING, CONFIRMED, COMPLETED, CANCELLED."
            ),
        )

    current_status = normalize_status(
        appointment.status
    )

    if (
        current_status == "COMPLETED"
        and new_status != "COMPLETED"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Tamamlanmış bir randevunun "
                "durumu değiştirilemez."
            ),
        )

    if (
        current_status in CANCELLED_STATUSES
        and new_status not in CANCELLED_STATUSES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "İptal edilmiş bir randevu yeniden "
                "aktif hale getirilemez."
            ),
        )

    appointment.status = new_status

    db.commit()
    db.refresh(appointment)

    appointment.status = normalize_status(
        appointment.status
    )

    return appointment


# =========================================================
# DELETE APPOINTMENT
# =========================================================

@router.delete(
    "/{appointment_id}",
)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.business_id
            == current_user.business_id,
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Randevu bulunamadı.",
        )

    db.delete(appointment)
    db.commit()

    return {
        "message": "Randevu başarıyla silindi.",
        "id": appointment_id,
    }