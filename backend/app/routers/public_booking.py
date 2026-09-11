from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.employee_working_hour import EmployeeWorkingHour
from app.models.service import Service
from app.models.appointment import Appointment
from app.models.notification import Notification


router = APIRouter(
    prefix="/public",
    tags=["Public Booking"],
)


CANCELLED_STATUSES = {
    "CANCELLED",
    "CANCELED",
}


# =========================================================
# SCHEMAS
# =========================================================

class PublicBusinessResponse(BaseModel):
    id: int
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    description: str | None = None
    logo_url: str | None = None
    slug: str
    online_booking_enabled: bool


class PublicServiceResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    price: float
    duration_minutes: int


class PublicEmployeeResponse(BaseModel):
    id: int
    full_name: str


class PublicSlotResponse(BaseModel):
    time: str


class PublicBookingCreate(BaseModel):
    business_slug: str

    customer_name: str = Field(
        min_length=2,
        max_length=150,
    )

    phone: str = Field(
        min_length=7,
        max_length=30,
    )

    email: str | None = None

    service_id: int
    employee_id: int

    appointment_date: date
    appointment_time: time

    notes: str | None = None


class PublicBookingResponse(BaseModel):
    success: bool
    message: str
    appointment_id: int
    appointment_date: date
    appointment_time: time


class PublicAppointmentResponse(BaseModel):
    appointment_id: int
    business_name: str
    business_slug: str
    business_phone: str | None = None
    business_address: str | None = None
    business_logo_url: str | None = None
    customer_name: str
    service_name: str
    service_price: float
    service_duration_minutes: int
    employee_name: str
    appointment_date: date
    appointment_time: time
    status: str
    notes: str | None = None


# =========================================================
# HELPERS
# =========================================================

def normalize_status(value) -> str:
    if value is None:
        return ""

    if hasattr(value, "value"):
        return str(value.value).upper()

    return str(value).upper()


def get_service_duration(service) -> int:
    if service is None:
        return 30

    try:
        duration = int(
            service.duration_minutes or 30
        )
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
        minutes=duration_minutes
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


def get_business_by_slug(
    slug: str,
    db: Session,
):
    normalized_slug = slug.strip().lower()

    business = (
        db.query(Business)
        .filter(
            Business.slug == normalized_slug
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="İşletme bulunamadı.",
        )

    if not business.online_booking_enabled:
        raise HTTPException(
            status_code=403,
            detail="Bu işletme şu anda online randevu kabul etmiyor.",
        )

    return business


def check_conflict(
    business_id: int,
    employee_id: int,
    appointment_date: date,
    appointment_time: time,
    duration_minutes: int,
    db: Session,
) -> bool:

    new_start, new_end = build_interval(
        appointment_date,
        appointment_time,
        duration_minutes,
    )

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.business_id == business_id,
            Appointment.employee_id == employee_id,
            Appointment.appointment_date == appointment_date,
        )
        .all()
    )

    for appointment in appointments:

        status = normalize_status(
            appointment.status
        )

        if status in CANCELLED_STATUSES:
            continue

        service = (
            db.query(Service)
            .filter(
                Service.id == appointment.service_id
            )
            .first()
        )

        duration = get_service_duration(
            service
        )

        existing_start, existing_end = build_interval(
            appointment.appointment_date,
            appointment.appointment_time,
            duration,
        )

        if intervals_overlap(
            new_start,
            new_end,
            existing_start,
            existing_end,
        ):
            return True

    return False


def validate_working_hours(
    employee_id: int,
    selected_date: date,
    appointment_time: time,
    duration_minutes: int,
    db: Session,
):
    working_hour = (
        db.query(EmployeeWorkingHour)
        .filter(
            EmployeeWorkingHour.employee_id == employee_id,
            EmployeeWorkingHour.day_of_week == selected_date.weekday(),
        )
        .first()
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
            detail="Çalışma saatleri eksik.",
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
            detail="Seçilen saat çalışma başlangıç saatinden önce.",
        )

    if appointment_end > working_end:
        raise HTTPException(
            status_code=400,
            detail="Hizmet süresi çalışma saatinin dışına taşıyor.",
        )


# =========================================================
# BUSINESS
# =========================================================

@router.get(
    "/businesses/by-slug/{slug}",
    response_model=PublicBusinessResponse,
)
def get_public_business_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    business = get_business_by_slug(
        slug,
        db,
    )

    return {
        "id": business.id,
        "name": business.name,
        "phone": business.phone,
        "email": business.email,
        "address": business.address,
        "description": business.description,
        "logo_url": business.logo_url,
        "slug": business.slug,
        "online_booking_enabled": business.online_booking_enabled,
    }


# =========================================================
# SERVICES
# =========================================================

@router.get(
    "/businesses/by-slug/{slug}/services",
    response_model=list[PublicServiceResponse],
)
def get_public_services_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    business = get_business_by_slug(
        slug,
        db,
    )

    services = (
        db.query(Service)
        .filter(
            Service.business_id == business.id,
            Service.is_active == True,
        )
        .order_by(Service.id.asc())
        .all()
    )

    return [
        {
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "price": float(service.price),
            "duration_minutes": int(
                service.duration_minutes or 30
            ),
        }
        for service in services
    ]


# =========================================================
# EMPLOYEES
# =========================================================

@router.get(
    "/businesses/by-slug/{slug}/employees",
    response_model=list[PublicEmployeeResponse],
)
def get_public_employees_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    business = get_business_by_slug(
        slug,
        db,
    )

    employees = (
        db.query(Employee)
        .filter(
            Employee.business_id == business.id,
            Employee.is_active == True,
        )
        .order_by(Employee.id.asc())
        .all()
    )

    return [
        {
            "id": employee.id,
            "full_name": employee.full_name,
        }
        for employee in employees
    ]


# =========================================================
# AVAILABLE SLOTS
# =========================================================

@router.get(
    "/businesses/by-slug/{slug}/available-slots",
    response_model=list[PublicSlotResponse],
)
def get_public_available_slots_by_slug(
    slug: str,
    employee_id: int,
    service_id: int,
    selected_date: date,
    db: Session = Depends(get_db),
):
    business = get_business_by_slug(
        slug,
        db,
    )

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id,
            Employee.business_id == business.id,
            Employee.is_active == True,
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Çalışan bulunamadı.",
        )

    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.business_id == business.id,
            Service.is_active == True,
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Hizmet bulunamadı.",
        )

    duration_minutes = get_service_duration(
        service
    )

    working_hour = (
        db.query(EmployeeWorkingHour)
        .filter(
            EmployeeWorkingHour.employee_id == employee_id,
            EmployeeWorkingHour.day_of_week == selected_date.weekday(),
        )
        .first()
    )

    if not working_hour:
        return []

    if working_hour.is_day_off:
        return []

    if (
        working_hour.start_time is None
        or working_hour.end_time is None
    ):
        return []

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.business_id == business.id,
            Appointment.employee_id == employee_id,
            Appointment.appointment_date == selected_date,
        )
        .all()
    )

    occupied = []

    for appointment in appointments:

        status = normalize_status(
            appointment.status
        )

        if status in CANCELLED_STATUSES:
            continue

        appointment_service = (
            db.query(Service)
            .filter(
                Service.id == appointment.service_id
            )
            .first()
        )

        appointment_duration = get_service_duration(
            appointment_service
        )

        start, end = build_interval(
            appointment.appointment_date,
            appointment.appointment_time,
            appointment_duration,
        )

        occupied.append(
            (start, end)
        )

    slots = []

    current = datetime.combine(
        selected_date,
        working_hour.start_time,
    )

    working_end = datetime.combine(
        selected_date,
        working_hour.end_time,
    )

    step = timedelta(minutes=30)

    service_duration = timedelta(
        minutes=duration_minutes
    )

    while (
        current + service_duration <= working_end
    ):
        candidate_end = (
            current + service_duration
        )

        conflict = False

        for occupied_start, occupied_end in occupied:

            if intervals_overlap(
                current,
                candidate_end,
                occupied_start,
                occupied_end,
            ):
                conflict = True
                break

        if not conflict:
            slots.append(
                {
                    "time": current.time().strftime(
                        "%H:%M"
                    )
                }
            )

        current += step

    return slots


# =========================================================
# CREATE BOOKING
# =========================================================

@router.post(
    "/book",
    response_model=PublicBookingResponse,
    status_code=201,
)
def create_public_booking(
    data: PublicBookingCreate,
    db: Session = Depends(get_db),
):
    business = get_business_by_slug(
        data.business_slug,
        db,
    )

    if data.appointment_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Geçmiş bir tarihe randevu verilemez.",
        )

    service = (
        db.query(Service)
        .filter(
            Service.id == data.service_id,
            Service.business_id == business.id,
            Service.is_active == True,
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Hizmet bulunamadı.",
        )

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == data.employee_id,
            Employee.business_id == business.id,
            Employee.is_active == True,
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Çalışan bulunamadı.",
        )

    duration_minutes = get_service_duration(
        service
    )

    validate_working_hours(
        employee_id=data.employee_id,
        selected_date=data.appointment_date,
        appointment_time=data.appointment_time,
        duration_minutes=duration_minutes,
        db=db,
    )

    if check_conflict(
        business_id=business.id,
        employee_id=data.employee_id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        duration_minutes=duration_minutes,
        db=db,
    ):
        raise HTTPException(
            status_code=409,
            detail="Seçilen saat artık dolu. Lütfen başka bir saat seçin.",
        )

    normalized_phone = data.phone.strip()

    customer = (
        db.query(Customer)
        .filter(
            Customer.business_id == business.id,
            Customer.phone == normalized_phone,
        )
        .first()
    )

    if customer:

        customer.full_name = (
            data.customer_name.strip()
        )

        if data.email:
            customer.email = data.email.strip()

        if data.notes:
            customer.notes = data.notes.strip()

    else:

        customer = Customer(
            business_id=business.id,
            full_name=data.customer_name.strip(),
            phone=normalized_phone,
            email=(
                data.email.strip()
                if data.email
                else None
            ),
            notes=(
                data.notes.strip()
                if data.notes
                else None
            ),
        )

        db.add(customer)
        db.flush()

    appointment = Appointment(
        business_id=business.id,
        customer_id=customer.id,
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

    return PublicBookingResponse(
        success=True,
        message="Randevunuz başarıyla oluşturuldu.",
        appointment_id=appointment.id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
    )


# =========================================================
# APPOINTMENT TRACKING
# =========================================================

@router.get(
    "/appointments/{appointment_id}",
    response_model=PublicAppointmentResponse,
)
def get_public_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Randevu bulunamadı.",
        )

    business = (
        db.query(Business)
        .filter(
            Business.id == appointment.business_id
        )
        .first()
    )

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == appointment.customer_id
        )
        .first()
    )

    service = (
        db.query(Service)
        .filter(
            Service.id == appointment.service_id
        )
        .first()
    )

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == appointment.employee_id
        )
        .first()
    )

    if not business or not customer or not service or not employee:
        raise HTTPException(
            status_code=404,
            detail="Randevu bilgileri eksik.",
        )

    return {
        "appointment_id": appointment.id,
        "business_name": business.name,
        "business_slug": business.slug,
        "business_phone": business.phone,
        "business_address": business.address,
        "business_logo_url": business.logo_url,
        "customer_name": customer.full_name,
        "service_name": service.name,
        "service_price": float(service.price),
        "service_duration_minutes": int(
            service.duration_minutes or 30
        ),
        "employee_name": employee.full_name,
        "appointment_date": appointment.appointment_date,
        "appointment_time": appointment.appointment_time,
        "status": normalize_status(
            appointment.status
        ),
        "notes": appointment.notes,
    }


# =========================================================
# APPOINTMENT CANCELLATION
# =========================================================

@router.patch(
    "/appointments/{appointment_id}/cancel",
)
def cancel_public_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Randevu bulunamadı.",
        )

    current_status = normalize_status(
        appointment.status
    )

    if current_status in CANCELLED_STATUSES:
        return {
            "success": True,
            "message": "Randevu zaten iptal edilmiş.",
            "appointment_id": appointment.id,
            "status": current_status,
        }

    if current_status == "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail="Tamamlanmış bir randevu iptal edilemez.",
        )

    appointment.status = "CANCELLED"

    notification = Notification(
        business_id=appointment.business_id,
        title="Appointment Cancelled",
        message=(
            "Customer cancelled appointment #"
            + str(appointment.id)
        ),
        notification_type="APPOINTMENT",
        entity_type="APPOINTMENT",
        entity_id=appointment.id,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(appointment)

    return {
        "success": True,
        "message": "Randevunuz başarıyla iptal edildi.",
        "appointment_id": appointment.id,
        "status": "CANCELLED",
    }
