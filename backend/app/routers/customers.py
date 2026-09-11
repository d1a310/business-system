from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.models.appointment import Appointment
from app.models.service import Service
from app.routers.auth import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


CANCELLED_STATUSES = {
    "CANCELLED",
    "CANCELED",
}

COMPLETED_STATUS = "COMPLETED"


# =========================================================
# SCHEMAS
# =========================================================

class CustomerCreate(BaseModel):
    full_name: str = Field(
        min_length=1,
        max_length=150
    )
    phone: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class CustomerUpdate(BaseModel):
    full_name: str = Field(
        min_length=1,
        max_length=150
    )
    phone: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class CustomerResponse(BaseModel):
    id: int
    business_id: int
    full_name: str
    phone: str | None
    email: str | None
    notes: str | None

    class Config:
        from_attributes = True


class CustomerSummaryResponse(BaseModel):
    id: int
    business_id: int
    full_name: str
    phone: str | None
    email: str | None
    notes: str | None

    total_appointments: int
    completed_appointments: int
    cancelled_appointments: int

    total_spent: float
    average_spent: float

    last_appointment_date: date | None

    favorite_service: str | None
    favorite_service_count: int

    customer_segment: str


class CustomerAppointmentHistory(BaseModel):
    id: int
    appointment_date: date
    appointment_time: time
    service_id: int
    service_name: str
    price: float
    duration_minutes: int
    status: str
    notes: str | None = None


class CustomerDetailResponse(BaseModel):
    id: int
    business_id: int
    full_name: str
    phone: str | None
    email: str | None
    notes: str | None

    total_appointments: int
    completed_appointments: int
    cancelled_appointments: int

    total_spent: float
    average_spent: float

    last_appointment_date: date | None

    favorite_service: str | None
    favorite_service_count: int

    customer_segment: str

    appointment_history: list[
        CustomerAppointmentHistory
    ]


# =========================================================
# HELPERS
# =========================================================

def normalize_status(value) -> str:
    if value is None:
        return ""

    if hasattr(value, "value"):
        return str(
            value.value
        ).upper()

    return str(value).upper()


def service_price(service) -> float:
    if not service:
        return 0.0

    try:
        return float(
            service.price or 0
        )
    except (
        TypeError,
        ValueError
    ):
        return 0.0


def service_duration(service) -> int:
    if not service:
        return 30

    try:
        duration = int(
            service.duration_minutes or 30
        )
    except (
        TypeError,
        ValueError
    ):
        return 30

    if duration <= 0:
        return 30

    return duration


def calculate_customer_segment(
    total_spent: float,
    completed_appointments: int,
) -> str:

    if (
        completed_appointments >= 5
        and total_spent >= 2500
    ):
        return "VIP"

    if (
        completed_appointments >= 3
        or total_spent >= 1500
    ):
        return "SADIK"

    return "YENI"


# =========================================================
# GET ALL CUSTOMERS
# =========================================================

@router.get(
    "",
    response_model=list[CustomerResponse]
)
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    customers = (
        db.query(Customer)
        .filter(
            Customer.business_id
            == current_user.business_id
        )
        .order_by(
            Customer.full_name.asc()
        )
        .all()
    )

    return customers


# =========================================================
# CUSTOMER SUMMARY LIST
# =========================================================

@router.get(
    "/summary",
    response_model=list[CustomerSummaryResponse]
)
def get_customer_summaries(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Tüm müşterileri analitik bilgileriyle
    birlikte getirir.

    Bu endpoint müşteri listesi için kullanılır.
    """

    customers = (
        db.query(Customer)
        .filter(
            Customer.business_id
            == current_user.business_id
        )
        .order_by(
            Customer.full_name.asc()
        )
        .all()
    )

    result = []

    for customer in customers:

        appointments = (
            db.query(Appointment)
            .filter(
                Appointment.customer_id
                == customer.id,
                Appointment.business_id
                == current_user.business_id
            )
            .order_by(
                Appointment.appointment_date.desc(),
                Appointment.appointment_time.desc()
            )
            .all()
        )

        total_appointments = len(
            appointments
        )

        completed_appointments = 0
        cancelled_appointments = 0
        total_spent = 0.0

        favorite_services = {}

        for appointment in appointments:

            status = normalize_status(
                appointment.status
            )

            if status == COMPLETED_STATUS:
                completed_appointments += 1

            if status in CANCELLED_STATUSES:
                cancelled_appointments += 1

            service = (
                db.query(Service)
                .filter(
                    Service.id
                    == appointment.service_id,
                    Service.business_id
                    == current_user.business_id
                )
                .first()
            )

            if not service:
                continue

            if status == COMPLETED_STATUS:

                price = service_price(
                    service
                )

                total_spent += price

                service_id = service.id

                if service_id not in favorite_services:
                    favorite_services[
                        service_id
                    ] = {
                        "name": service.name,
                        "count": 0,
                    }

                favorite_services[
                    service_id
                ]["count"] += 1

        # -------------------------------------------------
        # AVERAGE
        # -------------------------------------------------

        if completed_appointments > 0:
            average_spent = (
                total_spent
                / completed_appointments
            )
        else:
            average_spent = 0.0

        # -------------------------------------------------
        # FAVORITE SERVICE
        # -------------------------------------------------

        favorite_service = None
        favorite_service_count = 0

        if favorite_services:

            favorite = max(
                favorite_services.values(),
                key=lambda item:
                    item["count"]
            )

            favorite_service = (
                favorite["name"]
            )

            favorite_service_count = (
                favorite["count"]
            )

        # -------------------------------------------------
        # SEGMENT
        # -------------------------------------------------

        customer_segment = (
            calculate_customer_segment(
                total_spent=total_spent,
                completed_appointments=(
                    completed_appointments
                )
            )
        )

        # -------------------------------------------------
        # LAST APPOINTMENT
        # -------------------------------------------------

        last_appointment_date = None

        if appointments:
            last_appointment_date = (
                appointments[0]
                .appointment_date
            )

        result.append(
            CustomerSummaryResponse(
                id=customer.id,
                business_id=customer.business_id,
                full_name=customer.full_name,
                phone=customer.phone,
                email=customer.email,
                notes=customer.notes,

                total_appointments=(
                    total_appointments
                ),

                completed_appointments=(
                    completed_appointments
                ),

                cancelled_appointments=(
                    cancelled_appointments
                ),

                total_spent=round(
                    total_spent,
                    2
                ),

                average_spent=round(
                    average_spent,
                    2
                ),

                last_appointment_date=(
                    last_appointment_date
                ),

                favorite_service=(
                    favorite_service
                ),

                favorite_service_count=(
                    favorite_service_count
                ),

                customer_segment=(
                    customer_segment
                )
            )
        )

    return result


# =========================================================
# GET CUSTOMER
# =========================================================

@router.get(
    "/{customer_id}",
    response_model=CustomerResponse
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.business_id
            == current_user.business_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Müşteri bulunamadı."
        )

    return customer


# =========================================================
# CUSTOMER DETAIL
# =========================================================

@router.get(
    "/{customer_id}/detail",
    response_model=CustomerDetailResponse
)
def get_customer_detail(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.business_id
            == current_user.business_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Müşteri bulunamadı."
        )

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.customer_id
            == customer_id,
            Appointment.business_id
            == current_user.business_id
        )
        .order_by(
            Appointment.appointment_date.desc(),
            Appointment.appointment_time.desc()
        )
        .all()
    )

    total_appointments = len(
        appointments
    )

    completed_appointments = 0
    cancelled_appointments = 0
    total_spent = 0.0

    favorite_service_counts = {}

    history = []

    for appointment in appointments:

        status = normalize_status(
            appointment.status
        )

        if status == COMPLETED_STATUS:
            completed_appointments += 1

        if status in CANCELLED_STATUSES:
            cancelled_appointments += 1

        service = (
            db.query(Service)
            .filter(
                Service.id
                == appointment.service_id,
                Service.business_id
                == current_user.business_id
            )
            .first()
        )

        price = service_price(
            service
        )

        duration = service_duration(
            service
        )

        service_name = (
            service.name
            if service
            else "Hizmet bulunamadı"
        )

        if status == COMPLETED_STATUS:

            total_spent += price

            if service:

                service_id = service.id

                if service_id not in favorite_service_counts:
                    favorite_service_counts[
                        service_id
                    ] = {
                        "name": service.name,
                        "count": 0,
                    }

                favorite_service_counts[
                    service_id
                ]["count"] += 1

        history.append(
            CustomerAppointmentHistory(
                id=appointment.id,
                appointment_date=(
                    appointment.appointment_date
                ),
                appointment_time=(
                    appointment.appointment_time
                ),
                service_id=(
                    appointment.service_id
                ),
                service_name=service_name,
                price=price,
                duration_minutes=duration,
                status=status,
                notes=appointment.notes,
            )
        )

    if completed_appointments > 0:
        average_spent = (
            total_spent
            / completed_appointments
        )
    else:
        average_spent = 0.0

    favorite_service = None
    favorite_service_count = 0

    if favorite_service_counts:

        favorite = max(
            favorite_service_counts.values(),
            key=lambda item:
                item["count"]
        )

        favorite_service = (
            favorite["name"]
        )

        favorite_service_count = (
            favorite["count"]
        )

    customer_segment = (
        calculate_customer_segment(
            total_spent=total_spent,
            completed_appointments=(
                completed_appointments
            )
        )
    )

    last_appointment_date = None

    if appointments:
        last_appointment_date = (
            appointments[0]
            .appointment_date
        )

    return CustomerDetailResponse(
        id=customer.id,
        business_id=customer.business_id,
        full_name=customer.full_name,
        phone=customer.phone,
        email=customer.email,
        notes=customer.notes,

        total_appointments=(
            total_appointments
        ),

        completed_appointments=(
            completed_appointments
        ),

        cancelled_appointments=(
            cancelled_appointments
        ),

        total_spent=round(
            total_spent,
            2
        ),

        average_spent=round(
            average_spent,
            2
        ),

        last_appointment_date=(
            last_appointment_date
        ),

        favorite_service=(
            favorite_service
        ),

        favorite_service_count=(
            favorite_service_count
        ),

        customer_segment=(
            customer_segment
        ),

        appointment_history=history,
    )


# =========================================================
# CREATE CUSTOMER
# =========================================================

@router.post(
    "",
    response_model=CustomerResponse,
    status_code=201
)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    customer = Customer(
        business_id=current_user.business_id,

        full_name=data.full_name.strip(),

        phone=(
            data.phone.strip()
            if data.phone
            else None
        ),

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
    db.commit()
    db.refresh(customer)

    return customer


# =========================================================
# UPDATE CUSTOMER
# =========================================================

@router.put(
    "/{customer_id}",
    response_model=CustomerResponse
)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.business_id
            == current_user.business_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Müşteri bulunamadı."
        )

    customer.full_name = (
        data.full_name.strip()
    )

    customer.phone = (
        data.phone.strip()
        if data.phone
        else None
    )

    customer.email = (
        data.email.strip()
        if data.email
        else None
    )

    customer.notes = (
        data.notes.strip()
        if data.notes
        else None
    )

    db.commit()
    db.refresh(customer)

    return customer


# =========================================================
# DELETE CUSTOMER
# =========================================================

@router.delete(
    "/{customer_id}"
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.business_id
            == current_user.business_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Müşteri bulunamadı."
        )

    appointment_count = (
        db.query(Appointment)
        .filter(
            Appointment.customer_id
            == customer_id
        )
        .count()
    )

    if appointment_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Bu müşteriye bağlı randevular "
                "bulunduğu için müşteri silinemez."
            )
        )

    db.delete(customer)
    db.commit()

    return {
        "message": "Müşteri başarıyla silindi.",
        "id": customer_id
    }