from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models

from app.routers import (
    auth,
    services,
    customers,
    appointments,
    employees,
    working_hours,
    dashboard,
    public_booking,
    business,
    notifications,
)


Base.metadata.create_all(
    bind=engine
)


app = FastAPI(
    title="Business System API",
    description="İşletme yönetim sistemi API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth.router)
app.include_router(services.router)
app.include_router(customers.router)
app.include_router(appointments.router)
app.include_router(employees.router)
app.include_router(working_hours.router)
app.include_router(dashboard.router)
app.include_router(public_booking.router)
app.include_router(business.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {
        "message": "Business System API çalışıyor",
        "status": "ok",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }