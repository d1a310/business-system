import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import api from "../../services/api";

import "./Booking.css";


function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatPrice(price) {
  return Number(
    price || 0
  ).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
}


function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const parts =
    dateString.split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  const [
    year,
    month,
    day,
  ] = parts.map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(
    "tr-TR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}


function formatTime(timeValue) {
  if (!timeValue) {
    return "";
  }

  return String(
    timeValue
  ).slice(0, 5);
}


function Booking() {
  const { slug } =
    useParams();


  const [business, setBusiness] =
    useState(null);

  const [services, setServices] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [slots, setSlots] =
    useState([]);


  const [loading, setLoading] =
    useState(true);

  const [loadingSlots, setLoadingSlots] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);


  const [success, setSuccess] =
    useState(null);

  const [error, setError] =
    useState("");


  const [form, setForm] =
    useState({
      customer_name: "",
      phone: "",
      email: "",
      service_id: "",
      employee_id: "",
      appointment_date: getToday(),
      appointment_time: "",
      notes: "",
    });


  // =========================================================
  // İŞLETME + HİZMET + ÇALIŞAN
  // =========================================================

  useEffect(() => {
    const loadData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            businessResponse,
            servicesResponse,
            employeesResponse,
          ] =
            await Promise.all([
              api.get(
                `/public/businesses/by-slug/${slug}`
              ),

              api.get(
                `/public/businesses/by-slug/${slug}/services`
              ),

              api.get(
                `/public/businesses/by-slug/${slug}/employees`
              ),
            ]);

          setBusiness(
            businessResponse.data
          );

          setServices(
            servicesResponse.data || []
          );

          setEmployees(
            employeesResponse.data || []
          );
        } catch (err) {
          console.error(
            "Online randevu verileri yüklenemedi:",
            err
          );

          setError(
            err.response?.data?.detail ||
              "İşletme bilgileri yüklenemedi."
          );
        } finally {
          setLoading(false);
        }
      };

    loadData();
  }, [slug]);


  // =========================================================
  // SEÇİLENLER
  // =========================================================

  const selectedService =
    useMemo(() => {
      return services.find(
        (service) =>
          Number(service.id) ===
          Number(form.service_id)
      );
    }, [
      services,
      form.service_id,
    ]);


  const selectedEmployee =
    useMemo(() => {
      return employees.find(
        (employee) =>
          Number(employee.id) ===
          Number(form.employee_id)
      );
    }, [
      employees,
      form.employee_id,
    ]);


  // =========================================================
  // SLOT'LAR
  // =========================================================

  useEffect(() => {
    if (
      !form.service_id ||
      !form.employee_id ||
      !form.appointment_date
    ) {
      setSlots([]);
      return;
    }


    const loadSlots =
      async () => {
        try {
          setLoadingSlots(true);
          setError("");
          setSlots([]);

          setForm((prev) => ({
            ...prev,
            appointment_time: "",
          }));

          const response =
            await api.get(
              `/public/businesses/by-slug/${slug}/available-slots`,
              {
                params: {
                  employee_id:
                    Number(
                      form.employee_id
                    ),

                  service_id:
                    Number(
                      form.service_id
                    ),

                  selected_date:
                    form.appointment_date,
                },
              }
            );

          setSlots(
            response.data || []
          );
        } catch (err) {
          console.error(
            "Müsait saatler alınamadı:",
            err
          );

          setSlots([]);

          setError(
            err.response?.data?.detail ||
              "Uygun saatler alınamadı."
          );
        } finally {
          setLoadingSlots(false);
        }
      };


    loadSlots();
  }, [
    slug,
    form.service_id,
    form.employee_id,
    form.appointment_date,
  ]);


  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };


  const selectService = (
    serviceId
  ) => {
    setForm((prev) => ({
      ...prev,
      service_id:
        String(serviceId),
      appointment_time: "",
    }));

    setError("");
  };


  const selectEmployee = (
    employeeId
  ) => {
    setForm((prev) => ({
      ...prev,
      employee_id:
        String(employeeId),
      appointment_time: "",
    }));

    setError("");
  };


  const selectTime = (
    slotTime
  ) => {
    setForm((prev) => ({
      ...prev,
      appointment_time:
        formatTime(slotTime),
    }));

    setError("");
  };


  // =========================================================
  // RANDEVU OLUŞTUR
  // =========================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess(null);


      if (
        !form.customer_name.trim()
      ) {
        setError(
          "Ad soyad zorunludur."
        );
        return;
      }


      if (!form.phone.trim()) {
        setError(
          "Telefon numarası zorunludur."
        );
        return;
      }


      if (!form.service_id) {
        setError(
          "Lütfen bir hizmet seç."
        );
        return;
      }


      if (!form.employee_id) {
        setError(
          "Lütfen bir çalışan seç."
        );
        return;
      }


      if (!form.appointment_time) {
        setError(
          "Lütfen uygun bir saat seç."
        );
        return;
      }


      try {
        setSubmitting(true);

        const response =
          await api.post(
            "/public/book",
            {
              business_slug:
                slug,

              customer_name:
                form.customer_name.trim(),

              phone:
                form.phone.trim(),

              email:
                form.email.trim() ||
                null,

              service_id:
                Number(
                  form.service_id
                ),

              employee_id:
                Number(
                  form.employee_id
                ),

              appointment_date:
                form.appointment_date,

              appointment_time:
                form.appointment_time.length ===
                5
                  ? `${form.appointment_time}:00`
                  : form.appointment_time,

              notes:
                form.notes.trim() ||
                null,
            }
          );


        setSuccess(
          response.data
        );


        setForm({
          customer_name: "",
          phone: "",
          email: "",
          service_id: "",
          employee_id: "",
          appointment_date:
            getToday(),
          appointment_time: "",
          notes: "",
        });


        setSlots([]);
      } catch (err) {
        console.error(
          "Randevu oluşturulamadı:",
          err
        );


        if (
          err.response?.status ===
          409
        ) {
          setError(
            "Seçtiğin saat artık dolu. Lütfen başka bir saat seç."
          );

          return;
        }


        setError(
          err.response?.data?.detail ||
            "Randevu oluşturulurken bir hata oluştu."
        );
      } finally {
        setSubmitting(false);
      }
    };


  // =========================================================
  // YENİ RANDEVU
  // =========================================================

  const resetBooking =
    () => {
      setSuccess(null);

      setError("");

      setSlots([]);

      setForm({
        customer_name: "",
        phone: "",
        email: "",
        service_id: "",
        employee_id: "",
        appointment_date:
          getToday(),
        appointment_time: "",
        notes: "",
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="booking-page">

        <div className="booking-loading">

          <div className="booking-spinner"></div>

          <strong>
            Randevu sayfası hazırlanıyor
          </strong>

          <span>
            İşletme bilgileri yükleniyor...
          </span>

        </div>

      </div>
    );
  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error && !business) {
    return (
      <div className="booking-page">

        <div className="booking-error-page">

          <div className="booking-error-icon">
            !
          </div>

          <span className="booking-error-label">
            ONLINE RANDEVU
          </span>

          <h1>
            Randevu sayfası açılamadı
          </h1>

          <p>
            {error}
          </p>

        </div>

      </div>
    );
  }


  // =========================================================
  // SUCCESS
  // =========================================================

  if (success) {
    return (
      <div className="booking-page">

        <div className="booking-success-shell">

          <div className="booking-success-brand">

            {business?.logo_url ? (
              <img
                src={
                  business.logo_url
                }
                alt={
                  business.name
                }
              />
            ) : (
              <div className="booking-brand-mark">
                BS
              </div>
            )}

            <div>
              <strong>
                {
                  business?.name ||
                  "İşletme"
                }
              </strong>

              <span>
                Online Randevu
              </span>
            </div>

          </div>


          <div className="booking-success">

            <div className="success-icon">
              ✓
            </div>

            <span className="success-label">
              RANDEVU OLUŞTURULDU
            </span>

            <h1>
              Randevunuz hazır.
            </h1>

            <p>
              Randevu talebiniz
              başarıyla oluşturuldu.
              Aşağıdaki bilgilerle
              randevunuzu takip
              edebilirsiniz.
            </p>


            <div className="success-card">

              <div>
                <span>
                  Tarih
                </span>

                <strong>
                  {formatDate(
                    success.appointment_date
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Saat
                </span>

                <strong>
                  {formatTime(
                    success.appointment_time
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Randevu No
                </span>

                <strong>
                  #{success.appointment_id}
                </strong>
              </div>

            </div>


            <div className="success-business-card">

              <span>
                İşletme
              </span>

              <strong>
                {
                  business?.name ||
                  "İşletme"
                }
              </strong>

            </div>


            <div className="booking-success-actions">

              <Link
                to={`/track/${success.appointment_id}`}
                className="booking-track-button"
              >
                Randevumu Gör
                <span>
                  →
                </span>
              </Link>


              <button
                type="button"
                className="booking-new-button"
                onClick={
                  resetBooking
                }
              >
                Yeni Randevu Al
              </button>

            </div>

          </div>


          <div className="booking-footer">
            Powered by
            <strong>
              Business System
            </strong>
          </div>

        </div>

      </div>
    );
  }


  // =========================================================
  // MAIN
  // =========================================================

  return (
    <div className="booking-page">

      <div className="booking-shell">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <header className="booking-header">

          <div className="booking-brand">

            {business?.logo_url ? (
              <img
                className="booking-business-logo"
                src={
                  business.logo_url
                }
                alt={
                  business.name
                }
              />
            ) : (
              <div className="booking-brand-mark">
                BS
              </div>
            )}

            <div>

              <strong>
                {
                  business?.name ||
                  "İşletme"
                }
              </strong>

              <span>
                Online Randevu
              </span>

            </div>

          </div>


          <div className="booking-business-meta">

            {business?.phone && (
              <a
                href={`tel:${business.phone}`}
              >
                <span>
                  ☎
                </span>

                {business.phone}
              </a>
            )}

            {business?.address && (
              <span>
                <span>
                  ●
                </span>

                {business.address}
              </span>
            )}

          </div>

        </header>


        {/* ===================================================
            HERO
        ==================================================== */}

        <section className="booking-hero">

          <div className="booking-hero-copy">

            <span className="booking-eyebrow">
              ONLINE RANDEVU
            </span>

            <h1>
              Randevunu
              <br />
              kolayca planla.
            </h1>

            <p>
              Hizmetini seç, çalışanını
              belirle ve sana uygun
              zamanı ayır.
            </p>

          </div>


          {business?.description && (
            <div className="booking-business-description">

              <span>
                {
                  business.description
                }
              </span>

            </div>
          )}

        </section>


        {/* ===================================================
            STEPS
        ==================================================== */}

        <div className="booking-progress">

          <div
            className={
              form.service_id
                ? "booking-progress-step completed"
                : "booking-progress-step active"
            }
          >
            <span>
              01
            </span>

            <strong>
              Hizmet
            </strong>
          </div>


          <div
            className={
              form.employee_id
                ? "booking-progress-step completed"
                : form.service_id
                ? "booking-progress-step active"
                : "booking-progress-step"
            }
          >
            <span>
              02
            </span>

            <strong>
              Çalışan
            </strong>
          </div>


          <div
            className={
              form.appointment_time
                ? "booking-progress-step completed"
                : form.employee_id
                ? "booking-progress-step active"
                : "booking-progress-step"
            }
          >
            <span>
              03
            </span>

            <strong>
              Tarih & Saat
            </strong>
          </div>


          <div
            className={
              form.customer_name &&
              form.phone
                ? "booking-progress-step completed"
                : form.appointment_time
                ? "booking-progress-step active"
                : "booking-progress-step"
            }
          >
            <span>
              04
            </span>

            <strong>
              Bilgiler
            </strong>
          </div>

        </div>


        {/* ===================================================
            FORM + SUMMARY
        ==================================================== */}

        <form
          className="booking-layout"
          onSubmit={handleSubmit}
        >

          <div className="booking-main">

            {/* SERVICE */}

            <section className="booking-section">

              <div className="booking-section-heading">

                <div className="booking-section-number">
                  01
                </div>

                <div>
                  <h2>
                    Hizmetini seç
                  </h2>

                  <p>
                    Almak istediğin hizmeti seç.
                  </p>
                </div>

              </div>


              <div className="booking-service-grid">

                {services.length === 0 ? (

                  <div className="booking-empty-message">
                    Aktif hizmet bulunmuyor.
                  </div>

                ) : (

                  services.map(
                    (service) => {

                      const selected =
                        Number(
                          form.service_id
                        ) ===
                        Number(
                          service.id
                        );


                      return (
                        <button
                          type="button"
                          key={
                            service.id
                          }
                          className={
                            selected
                              ? "booking-service selected"
                              : "booking-service"
                          }
                          onClick={() =>
                            selectService(
                              service.id
                            )
                          }
                        >

                          <div className="booking-service-main">

                            <strong>
                              {
                                service.name
                              }
                            </strong>

                            <span>
                              {
                                service.duration_minutes ||
                                30
                              }{" "}
                              dakika
                            </span>

                          </div>


                          <div className="booking-service-side">

                            <b>
                              {formatPrice(
                                service.price
                              )}
                            </b>

                            <span
                              className="booking-selection-check"
                            >
                              {selected
                                ? "✓"
                                : ""}
                            </span>

                          </div>

                        </button>
                      );
                    }
                  )

                )}

              </div>

            </section>


            {/* EMPLOYEE */}

            <section className="booking-section">

              <div className="booking-section-heading">

                <div className="booking-section-number">
                  02
                </div>

                <div>
                  <h2>
                    Çalışanını seç
                  </h2>

                  <p>
                    Tercih ettiğin çalışanı belirle.
                  </p>
                </div>

              </div>


              <div className="booking-employee-grid">

                {employees.length === 0 ? (

                  <div className="booking-empty-message">
                    Aktif çalışan bulunmuyor.
                  </div>

                ) : (

                  employees.map(
                    (employee) => {

                      const selected =
                        Number(
                          form.employee_id
                        ) ===
                        Number(
                          employee.id
                        );


                      return (
                        <button
                          type="button"
                          key={
                            employee.id
                          }
                          className={
                            selected
                              ? "booking-employee selected"
                              : "booking-employee"
                          }
                          onClick={() =>
                            selectEmployee(
                              employee.id
                            )
                          }
                        >

                          <div className="booking-employee-avatar">

                            {employee.full_name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "?"}

                          </div>


                          <div className="booking-employee-info">

                            <strong>
                              {
                                employee.full_name
                              }
                            </strong>

                            <span>
                              {
                                employee.specialty ||
                                "Uzman"
                              }
                            </span>

                          </div>


                          {selected && (
                            <div className="employee-check">
                              ✓
                            </div>
                          )}

                        </button>
                      );
                    }
                  )

                )}

              </div>

            </section>


            {/* DATE & TIME */}

            <section className="booking-section">

              <div className="booking-section-heading">

                <div className="booking-section-number">
                  03
                </div>

                <div>
                  <h2>
                    Tarih ve saat
                  </h2>

                  <p>
                    Sana uygun günü ve saati seç.
                  </p>
                </div>

              </div>


              <div className="booking-date-wrapper">

                <label>
                  TARİH
                </label>

                <input
                  type="date"
                  name="appointment_date"
                  min={getToday()}
                  value={
                    form.appointment_date
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {!form.service_id ||
              !form.employee_id ? (

                <div className="booking-slot-placeholder">
                  Önce hizmet ve çalışan seçmelisin.
                </div>

              ) : loadingSlots ? (

                <div className="booking-slot-placeholder">

                  <div className="booking-mini-spinner"></div>

                  Uygun saatler kontrol ediliyor...

                </div>

              ) : slots.length === 0 ? (

                <div className="booking-slot-placeholder">
                  Bu tarih için uygun saat bulunmuyor.
                </div>

              ) : (

                <div className="booking-slots">

                  {slots.map(
                    (slot) => {

                      const slotTime =
                        formatTime(
                          slot.time
                        );

                      const selected =
                        form.appointment_time ===
                        slotTime;


                      return (
                        <button
                          type="button"
                          key={
                            slotTime
                          }
                          className={
                            selected
                              ? "booking-slot selected"
                              : "booking-slot"
                          }
                          onClick={() =>
                            selectTime(
                              slotTime
                            )
                          }
                        >

                          {slotTime}

                        </button>
                      );
                    }
                  )}

                </div>

              )}


              {selectedService && (
                <div className="booking-selected-service">

                  <div>

                    <span>
                      SEÇİLEN HİZMET
                    </span>

                    <strong>
                      {
                        selectedService.name
                      }
                    </strong>

                  </div>

                  <span>
                    {
                      selectedService.duration_minutes ||
                      30
                    }{" "}
                    dk
                  </span>

                </div>
              )}

            </section>


            {/* CUSTOMER INFO */}

            <section className="booking-section">

              <div className="booking-section-heading">

                <div className="booking-section-number">
                  04
                </div>

                <div>
                  <h2>
                    Bilgilerin
                  </h2>

                  <p>
                    Randevunu oluşturmak için
                    bilgilerini gir.
                  </p>
                </div>

              </div>


              <div className="booking-info-grid">

                <div className="booking-field">

                  <label>
                    AD SOYAD *
                  </label>

                  <input
                    type="text"
                    name="customer_name"
                    placeholder="Örn. Ahmet Yılmaz"
                    value={
                      form.customer_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="booking-field">

                  <label>
                    TELEFON *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="05xx xxx xx xx"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="booking-field">

                  <label>
                    E-POSTA
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="ornek@mail.com"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="booking-field full">

                  <label>
                    NOT
                  </label>

                  <textarea
                    name="notes"
                    rows="4"
                    placeholder="Eklemek istediğin bir not varsa..."
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </section>


            {error && (
              <div className="booking-error">

                <span>
                  !
                </span>

                <div>
                  {error}
                </div>

              </div>
            )}

            <div className="booking-submit">
              <div className="booking-submit-summary">
                <span>RANDEVU ÖZETİ</span>

                <strong>
                  {selectedService?.name || "Hizmet seçilmedi"}
                  {form.appointment_time
                    ? ` • ${form.appointment_time}`
                    : ""}
                </strong>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  loadingSlots ||
                  !form.appointment_time
                }
              >
                {submitting
                  ? "Randevu oluşturuluyor..."
                  : "Randevumu Oluştur →"}
              </button>
            </div>

          </div>


          {/* =================================================
              SUMMARY
          ================================================== */}

          <aside className="booking-summary">

            <div className="booking-summary-inner">

              <span className="booking-summary-eyebrow">
                RANDEVU ÖZETİ
              </span>

              <h2>
                Randevun
              </h2>


              <div className="summary-business">

                {business?.logo_url ? (
                  <img
                    src={
                      business.logo_url
                    }
                    alt={
                      business.name
                    }
                  />
                ) : (
                  <div className="summary-business-mark">
                    BS
                  </div>
                )}

                <div>
                  <strong>
                    {
                      business?.name ||
                      "İşletme"
                    }
                  </strong>

                  <span>
                    Online Randevu
                  </span>
                </div>

              </div>


              <div className="summary-divider"></div>


              <div className="summary-item">

                <span>
                  Hizmet
                </span>

                <strong>
                  {
                    selectedService?.name ||
                    "Henüz seçilmedi"
                  }
                </strong>

              </div>


              <div className="summary-item">

                <span>
                  Çalışan
                </span>

                <strong>
                  {
                    selectedEmployee?.full_name ||
                    "Henüz seçilmedi"
                  }
                </strong>

              </div>


              <div className="summary-item">

                <span>
                  Tarih
                </span>

                <strong>
                  {form.appointment_date
                    ? formatDate(
                        form.appointment_date
                      )
                    : "Henüz seçilmedi"}
                </strong>

              </div>


              <div className="summary-item">

                <span>
                  Saat
                </span>

                <strong>
                  {
                    form.appointment_time ||
                    "Henüz seçilmedi"
                  }
                </strong>

              </div>


              {selectedService && (
                <div className="summary-total">

                  <span>
                    Toplam
                  </span>

                  <strong>
                    {formatPrice(
                      selectedService.price
                    )}
                  </strong>

                </div>
              )}


              <div className="summary-notice">

                <span>
                  ✓
                </span>

                <p>
                  Randevun oluşturulduktan
                  sonra takip bağlantın
                  gösterilecektir.
                </p>

              </div>

            </div>

          </aside>

        </form>


        <footer className="booking-footer">

          Powered by
          <strong>
            Business System
          </strong>

        </footer>

      </div>

    </div>
  );
}


export default Booking;