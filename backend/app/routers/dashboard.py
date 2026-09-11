from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.service import Service
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


CANCELLED_STATUSES = {
    "CANCELLED",
    "CANCELED",
}


# =========================================================
# HELPERS
# =========================================================

def normalize_status(value):
    if value is None:
        return ""

    if hasattr(value, "value"):
        return str(value.value).upper()

    return str(value).upper()


def get_month_range():
    today = date.today()
    month_start = today.replace(day=1)

    if today.month == 12:
        next_month = date(
            today.year + 1,
            1,
            1,
        )
    else:
        next_month = date(
            today.year,
            today.month + 1,
            1,
        )

    return month_start, next_month


def get_service_price(service):
    if not service:
        return 0.0

    try:
        return float(service.price or 0)
    except (TypeError, ValueError):
        return 0.0


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    business_id = current_user.business_id
    today = date.today()

    month_start, next_month = get_month_range()

    # =====================================================
    # CUSTOMERS
    # =====================================================

    total_customers = (
        db.query(Customer)
        .filter(
            Customer.business_id == business_id
        )
        .count()
    )

    # =====================================================
    # SERVICES
    # =====================================================

    active_services = (
        db.query(Service)
        .filter(
            Service.business_id == business_id,
            Service.is_active == True,
        )
        .count()
    )

    # =====================================================
    # EMPLOYEES
    # =====================================================

    active_employees = (
        db.query(Employee)
        .filter(
            Employee.business_id == business_id,
            Employee.is_active == True,
        )
        .count()
    )

    # =====================================================
    # APPOINTMENTS
    # =====================================================

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.business_id == business_id
        )
        .all()
    )

    # =====================================================
    # PRELOAD RELATED DATA
    # =====================================================
    # All related records are explicitly limited to the
    # current business. This keeps dashboard data isolated
    # in a multi-business environment.

    customer_ids = {
        appointment.customer_id
        for appointment in appointments
        if appointment.customer_id is not None
    }

    service_ids = {
        appointment.service_id
        for appointment in appointments
        if appointment.service_id is not None
    }

    employee_ids = {
        appointment.employee_id
        for appointment in appointments
        if appointment.employee_id is not None
    }

    customers_by_id = {}

    if customer_ids:
        customers = (
            db.query(Customer)
            .filter(
                Customer.id.in_(customer_ids),
                Customer.business_id == business_id,
            )
            .all()
        )
        customers_by_id = {
            customer.id: customer
            for customer in customers
        }

    services_by_id = {}

    if service_ids:
        services = (
            db.query(Service)
            .filter(
                Service.id.in_(service_ids),
                Service.business_id == business_id,
            )
            .all()
        )
        services_by_id = {
            service.id: service
            for service in services
        }

    employees_by_id = {}

    if employee_ids:
        employees = (
            db.query(Employee)
            .filter(
                Employee.id.in_(employee_ids),
                Employee.business_id == business_id,
            )
            .all()
        )
        employees_by_id = {
            employee.id: employee
            for employee in employees
        }

    # =====================================================
    # TODAY
    # =====================================================

    today_appointments = []

    for appointment in appointments:
        if appointment.appointment_date == today:
            status = normalize_status(
                appointment.status
            )

            if status not in CANCELLED_STATUSES:
                today_appointments.append(
                    appointment
                )

    # =====================================================
    # TODAY REVENUE
    # =====================================================

    today_revenue = 0.0

    for appointment in today_appointments:
        status = normalize_status(
            appointment.status
        )

        if status != "COMPLETED":
            continue

        service = services_by_id.get(
            appointment.service_id
        )

        today_revenue += get_service_price(
            service
        )

    # =====================================================
    # MONTH REVENUE
    # =====================================================

    month_revenue = 0.0
    month_completed = 0

    for appointment in appointments:
        if not (
            appointment.appointment_date >= month_start
            and appointment.appointment_date < next_month
        ):
            continue

        status = normalize_status(
            appointment.status
        )

        if status != "COMPLETED":
            continue

        month_completed += 1

        service = services_by_id.get(
            appointment.service_id
        )

        month_revenue += get_service_price(
            service
        )

    # =====================================================
    # UPCOMING APPOINTMENTS
    # =====================================================

    now = datetime.now()
    upcoming = []

    for appointment in appointments:
        status = normalize_status(
            appointment.status
        )

        if status in CANCELLED_STATUSES:
            continue

        appointment_datetime = datetime.combine(
            appointment.appointment_date,
            appointment.appointment_time,
        )

        if appointment_datetime < now:
            continue

        customer = customers_by_id.get(
            appointment.customer_id
        )

        service = services_by_id.get(
            appointment.service_id
        )

        employee = employees_by_id.get(
            appointment.employee_id
        )

        upcoming.append(
            {
                "id": appointment.id,
                "date": str(
                    appointment.appointment_date
                ),
                "time": appointment.appointment_time.strftime(
                    "%H:%M"
                ),
                "customer_name": (
                    customer.full_name
                    if customer
                    else "Bilinmiyor"
                ),
                "service_name": (
                    service.name
                    if service
                    else "Bilinmiyor"
                ),
                "employee_name": (
                    employee.full_name
                    if employee
                    else "Atanmamış"
                ),
                "status": status,
                "price": get_service_price(
                    service
                ),
            }
        )

    upcoming.sort(
        key=lambda item: (
            item["date"],
            item["time"],
        )
    )

    upcoming = upcoming[:8]

    # =====================================================
    # TOP SERVICES
    # =====================================================

    service_stats = {}

    for appointment in appointments:
        status = normalize_status(
            appointment.status
        )

        if status in CANCELLED_STATUSES:
            continue

        service = services_by_id.get(
            appointment.service_id
        )

        if not service:
            continue

        service_id = service.id

        if service_id not in service_stats:
            service_stats[service_id] = {
                "id": service.id,
                "name": service.name,
                "count": 0,
                "revenue": 0.0,
            }

        service_stats[service_id]["count"] += 1

        if status == "COMPLETED":
            service_stats[service_id]["revenue"] += (
                get_service_price(service)
            )

    top_services = list(
        service_stats.values()
    )

    top_services.sort(
        key=lambda item: (
            item["count"],
            item["revenue"],
        ),
        reverse=True,
    )

    top_services = top_services[:5]

    # =====================================================
    # EMPLOYEE PERFORMANCE
    # =====================================================

    employee_stats = {}

    for appointment in appointments:
        if not appointment.employee_id:
            continue

        status = normalize_status(
            appointment.status
        )

        if status in CANCELLED_STATUSES:
            continue

        employee = employees_by_id.get(
            appointment.employee_id
        )

        if not employee:
            continue

        employee_id = employee.id

        if employee_id not in employee_stats:
            employee_stats[employee_id] = {
                "id": employee.id,
                "name": employee.full_name,
                "appointments": 0,
                "completed": 0,
                "revenue": 0.0,
            }

        employee_stats[employee_id]["appointments"] += 1

        if status == "COMPLETED":
            employee_stats[employee_id]["completed"] += 1

            service = services_by_id.get(
                appointment.service_id
            )

            employee_stats[employee_id]["revenue"] += (
                get_service_price(service)
            )

    employee_performance = list(
        employee_stats.values()
    )

    employee_performance.sort(
        key=lambda item: (
            item["completed"],
            item["revenue"],
        ),
        reverse=True,
    )

    employee_performance = (
        employee_performance[:5]
    )

    # =====================================================
    # STATUS COUNTERS
    # =====================================================

    pending_count = 0
    confirmed_count = 0
    completed_count = 0

    for appointment in appointments:
        status = normalize_status(
            appointment.status
        )

        if status == "PENDING":
            pending_count += 1
        elif status == "CONFIRMED":
            confirmed_count += 1
        elif status == "COMPLETED":
            completed_count += 1

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "today": str(today),
        "stats": {
            "total_customers": total_customers,
            "active_services": active_services,
            "active_employees": active_employees,
            "today_appointments": len(
                today_appointments
            ),
            "today_revenue": round(
                today_revenue,
                2,
            ),
            "month_revenue": round(
                month_revenue,
                2,
            ),
            "month_completed": month_completed,
            "pending_appointments": pending_count,
            "confirmed_appointments": confirmed_count,
            "completed_appointments": completed_count,
        },
        "upcoming_appointments": upcoming,
        "top_services": top_services,
        "employee_performance": employee_performance,
    }
