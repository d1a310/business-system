import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";

import "./Appointments.css";


const STATUS_LABELS = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
  CANCELED: "İptal",
};


const STATUS_CLASSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  CANCELED: "cancelled",
};


const EMPTY_FORM = {
  customer_id: "",
  service_id: "",
  employee_id: "",
  appointment_date: "",
  appointment_time: "",
  notes: "",
};


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


function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


function formatPrice(price) {
  if (
    price === null ||
    price === undefined
  ) {
    return "—";
  }

  return Number(price).toLocaleString(
    "tr-TR",
    {
      style: "currency",
      currency: "TRY",
    }
  );
}


function formatTime(timeValue) {
  if (!timeValue) {
    return "—";
  }

  return String(timeValue).slice(0, 5);
}


function Appointments() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();


  const [appointments, setAppointments] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);


  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  const [showModal, setShowModal] =
    useState(false);

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);


  const [form, setForm] = useState({
    ...EMPTY_FORM,
    appointment_date: getToday(),
  });


  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [dateFilter, setDateFilter] =
    useState("");


  const [availableSlots, setAvailableSlots] =
    useState([]);

  const [loadingSlots, setLoadingSlots] =
    useState(false);


  const [slotMessage, setSlotMessage] =
    useState(
      "Çalışan, hizmet ve tarih seçildiğinde uygun saatler burada görünecek."
    );


  // =========================================================
  // VERİLERİ GETİR
  // =========================================================

  const fetchAppointments = async () => {
    const response =
      await api.get("/appointments");

    setAppointments(
      response.data || []
    );
  };


  const fetchCustomers = async () => {
    const response =
      await api.get("/customers");

    setCustomers(
      response.data || []
    );
  };


  const fetchServices = async () => {
    const response =
      await api.get("/services");

    setServices(
      response.data || []
    );
  };


  const fetchEmployees = async () => {
    const response =
      await api.get("/employees");

    setEmployees(
      (response.data || []).filter(
        (employee) =>
          employee.is_active
      )
    );
  };


  const fetchAll = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchAppointments(),
        fetchCustomers(),
        fetchServices(),
        fetchEmployees(),
      ]);
    } catch (error) {
      console.error(
        "Randevu verileri alınamadı:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Randevu verileri yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAll();
  }, []);


  // =========================================================
  // BİLDİRİMDEN GELEN RANDEVUYU AÇ
  // =========================================================

  useEffect(() => {
    const appointmentId =
      searchParams.get(
        "appointmentId"
      );

    if (
      !appointmentId ||
      appointments.length === 0
    ) {
      return;
    }

    const appointment =
      appointments.find(
        (item) =>
          String(item.id) ===
          String(appointmentId)
      );

    if (appointment) {
      setSelectedAppointment(
        appointment
      );
    }
  }, [
    searchParams,
    appointments,
  ]);


  // =========================================================
  // MAP'LER
  // =========================================================

  const customerMap = useMemo(() => {
    return Object.fromEntries(
      customers.map((customer) => [
        customer.id,
        customer,
      ])
    );
  }, [customers]);


  const serviceMap = useMemo(() => {
    return Object.fromEntries(
      services.map((service) => [
        service.id,
        service,
      ])
    );
  }, [services]);


  const employeeMap = useMemo(() => {
    return Object.fromEntries(
      employees.map((employee) => [
        employee.id,
        employee,
      ])
    );
  }, [employees]);


  // =========================================================
  // FİLTRE
  // =========================================================

  const filteredAppointments =
    useMemo(() => {
      return [...appointments]
        .filter((appointment) => {
          if (
            statusFilter !== "ALL" &&
            appointment.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            dateFilter &&
            appointment.appointment_date !==
              dateFilter
          ) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          const dateA =
            `${a.appointment_date} ${a.appointment_time}`;

          const dateB =
            `${b.appointment_date} ${b.appointment_time}`;

          return dateA.localeCompare(
            dateB
          );
        });
    }, [
      appointments,
      statusFilter,
      dateFilter,
    ]);


  // =========================================================
  // MODAL AÇ
  // =========================================================

  const openCreateModal = () => {
    setForm({
      ...EMPTY_FORM,
      appointment_date: getToday(),
    });

    setAvailableSlots([]);

    setSlotMessage(
      "Çalışan, hizmet ve tarih seçildiğinde uygun saatler burada görünecek."
    );

    setShowModal(true);
  };


  // =========================================================
  // CREATE MODAL KAPAT
  // =========================================================

  const closeModal = () => {
    if (saving || loadingSlots) {
      return;
    }

    setShowModal(false);

    setForm({
      ...EMPTY_FORM,
      appointment_date: getToday(),
    });

    setAvailableSlots([]);

    setSlotMessage(
      "Çalışan, hizmet ve tarih seçildiğinde uygun saatler burada görünecek."
    );
  };


  // =========================================================
  // DETAY MODALINI KAPAT
  // =========================================================

  const closeDetailModal = () => {
    setSelectedAppointment(null);

    navigate(
      "/appointments",
      {
        replace: true,
      }
    );
  };


  // =========================================================
  // FORM DEĞİŞİKLİĞİ
  // =========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (
        name === "employee_id" ||
        name === "service_id" ||
        name === "appointment_date"
      ) {
        next.appointment_time = "";
      }

      return next;
    });

    if (
      name === "employee_id" ||
      name === "service_id" ||
      name === "appointment_date"
    ) {
      setAvailableSlots([]);

      setSlotMessage(
        "Uygun saatler kontrol ediliyor..."
      );
    }
  };


  // =========================================================
  // UYGUN SAATLER
  // =========================================================

  const fetchAvailableSlots = async (
    employeeId,
    selectedDate,
    serviceId
  ) => {
    if (
      !employeeId ||
      !selectedDate ||
      !serviceId
    ) {
      setAvailableSlots([]);

      setSlotMessage(
        "Çalışan, hizmet ve tarih seçildiğinde uygun saatler burada görünecek."
      );

      return;
    }

    try {
      setLoadingSlots(true);

      setAvailableSlots([]);

      setForm((prev) => ({
        ...prev,
        appointment_time: "",
      }));

      setSlotMessage(
        "Uygun saatler kontrol ediliyor..."
      );

      const response =
        await api.get(
          `/employees/${employeeId}/available-slots`,
          {
            params: {
              date: selectedDate,
              service_id: Number(
                serviceId
              ),
            },
          }
        );

      const slots =
        Array.isArray(response.data)
          ? response.data
          : [];

      setAvailableSlots(slots);

      if (slots.length === 0) {
        setSlotMessage(
          "Bu hizmet için seçilen gün ve çalışanda uygun başlangıç saati bulunmuyor."
        );
      } else {
        setSlotMessage(
          `${slots.length} uygun başlangıç saati bulundu.`
        );
      }
    } catch (error) {
      console.error(
        "Uygun saatler alınamadı:",
        error
      );

      setAvailableSlots([]);

      setSlotMessage(
        error.response?.data?.detail ||
          "Uygun saatler alınamadı."
      );
    } finally {
      setLoadingSlots(false);
    }
  };


  // =========================================================
  // SLOT KONTROL
  // =========================================================

  useEffect(() => {
    if (!showModal) {
      return;
    }

    if (
      form.employee_id &&
      form.service_id &&
      form.appointment_date
    ) {
      fetchAvailableSlots(
        form.employee_id,
        form.appointment_date,
        form.service_id
      );
    } else {
      setAvailableSlots([]);

      setSlotMessage(
        "Çalışan, hizmet ve tarih seçildiğinde uygun saatler burada görünecek."
      );
    }
  }, [
    form.employee_id,
    form.service_id,
    form.appointment_date,
    showModal,
  ]);


  // =========================================================
  // SAAT SEÇ
  // =========================================================

  const handleSelectSlot = (
    slotTime
  ) => {
    setForm((prev) => ({
      ...prev,
      appointment_time:
        formatTime(slotTime),
    }));
  };


  // =========================================================
  // RANDEVU OLUŞTUR
  // =========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.customer_id) {
      alert("Müşteri seçmelisin.");
      return;
    }

    if (!form.service_id) {
      alert("Hizmet seçmelisin.");
      return;
    }

    if (!form.employee_id) {
      alert("Çalışan seçmelisin.");
      return;
    }

    if (!form.appointment_date) {
      alert("Tarih seçmelisin.");
      return;
    }

    if (!form.appointment_time) {
      alert("Uygun bir saat seçmelisin.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer_id:
          Number(form.customer_id),

        service_id:
          Number(form.service_id),

        employee_id:
          Number(form.employee_id),

        appointment_date:
          form.appointment_date,

        appointment_time:
          form.appointment_time.length ===
          5
            ? `${form.appointment_time}:00`
            : form.appointment_time,

        notes:
          form.notes.trim() || null,
      };

      await api.post(
        "/appointments",
        payload
      );

      await fetchAppointments();

      setShowModal(false);

      setForm({
        ...EMPTY_FORM,
        appointment_date: getToday(),
      });

      setAvailableSlots([]);

      alert(
        "Randevu başarıyla oluşturuldu."
      );
    } catch (error) {
      console.error(
        "Randevu oluşturulamadı:",
        error
      );

      if (
        error.response?.status ===
        409
      ) {
        alert(
          error.response?.data?.detail ||
            "Bu saat artık dolu. Lütfen başka bir saat seç."
        );

        await fetchAvailableSlots(
          form.employee_id,
          form.appointment_date,
          form.service_id
        );

        return;
      }

      alert(
        error.response?.data?.detail ||
          "Randevu oluşturulurken bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };


  // =========================================================
  // DURUM GÜNCELLE
  // =========================================================

  const updateStatus = async (
    appointment,
    newStatus
  ) => {
    try {
      await api.patch(
        `/appointments/${appointment.id}/status`,
        {
          status: newStatus,
        }
      );

      await fetchAppointments();

      /*
        Eğer detay modalı açıksa ve buradan
        durum değiştirildiyse:

        1. Yeni durum kaydedildi.
        2. Modal kapatılıyor.
        3. URL temizleniyor.
        4. Randevu listesine dönülüyor.
      */

      if (
        selectedAppointment &&
        selectedAppointment.id ===
          appointment.id
      ) {
        setSelectedAppointment(null);

        navigate(
          "/appointments",
          {
            replace: true,
          }
        );

        return;
      }
    } catch (error) {
      console.error(
        "Randevu durumu güncellenemedi:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Randevu durumu güncellenemedi."
      );
    }
  };


  // =========================================================
  // SİL
  // =========================================================

  const handleDelete = async (
    appointment
  ) => {
    const confirmed =
      window.confirm(
        "Bu randevuyu silmek istediğine emin misin?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/appointments/${appointment.id}`
      );

      await fetchAppointments();

      if (
        selectedAppointment?.id ===
        appointment.id
      ) {
        setSelectedAppointment(null);

        navigate(
          "/appointments",
          {
            replace: true,
          }
        );
      }
    } catch (error) {
      console.error(
        "Randevu silinemedi:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Randevu silinemedi."
      );
    }
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="appointments-page">

        <div className="appointments-loading">

          <div className="loading-spinner"></div>

          <span>
            Randevular yükleniyor...
          </span>

        </div>

      </div>
    );
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="appointments-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h1>
            Randevular
          </h1>

          <p>
            Randevuları, çalışanları ve
            uygun çalışma saatlerini yönet.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={
            openCreateModal
          }
        >

          <span>
            +
          </span>

          Randevu Oluştur

        </button>

      </div>


      {/* STATS */}

      <div className="appointment-stats">

        <div className="appointment-stat-card">

          <div className="appointment-stat-icon">
            📅
          </div>

          <div>

            <span>
              Toplam
            </span>

            <strong>
              {appointments.length}
            </strong>

          </div>

        </div>


        <div className="appointment-stat-card">

          <div className="appointment-stat-icon">
            ⏳
          </div>

          <div>

            <span>
              Bekliyor
            </span>

            <strong>
              {
                appointments.filter(
                  (item) =>
                    item.status ===
                    "PENDING"
                ).length
              }
            </strong>

          </div>

        </div>


        <div className="appointment-stat-card">

          <div className="appointment-stat-icon">
            ✓
          </div>

          <div>

            <span>
              Onaylandı
            </span>

            <strong>
              {
                appointments.filter(
                  (item) =>
                    item.status ===
                    "CONFIRMED"
                ).length
              }
            </strong>

          </div>

        </div>


        <div className="appointment-stat-card">

          <div className="appointment-stat-icon">
            ✦
          </div>

          <div>

            <span>
              Tamamlandı
            </span>

            <strong>
              {
                appointments.filter(
                  (item) =>
                    item.status ===
                    "COMPLETED"
                ).length
              }
            </strong>

          </div>

        </div>

      </div>


      {/* FILTERS */}

      <div className="appointments-toolbar">

        <div className="appointment-filters">

          <button
            className={
              statusFilter === "ALL"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setStatusFilter("ALL")
            }
          >
            Tümü
            <span className="filter-count">
              {appointments.length}
            </span>
          </button>


          <button
            className={
              statusFilter ===
              "PENDING"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setStatusFilter(
                "PENDING"
              )
            }
          >
            Bekleyen
            <span className="filter-count">
              {appointments.filter(
                (item) => item.status === "PENDING"
              ).length}
            </span>
          </button>


          <button
            className={
              statusFilter ===
              "CONFIRMED"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setStatusFilter(
                "CONFIRMED"
              )
            }
          >
            Onaylanan
            <span className="filter-count">
              {appointments.filter(
                (item) => item.status === "CONFIRMED"
              ).length}
            </span>
          </button>


          <button
            className={
              statusFilter ===
              "COMPLETED"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setStatusFilter(
                "COMPLETED"
              )
            }
          >
            Tamamlanan
            <span className="filter-count">
              {appointments.filter(
                (item) => item.status === "COMPLETED"
              ).length}
            </span>
          </button>


          <button
            className={
              statusFilter ===
              "CANCELLED"
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setStatusFilter(
                "CANCELLED"
              )
            }
          >
            İptal
            <span className="filter-count">
              {appointments.filter(
                (item) =>
                  item.status === "CANCELLED" ||
                  item.status === "CANCELED"
              ).length}
            </span>
          </button>

        </div>


        <div className="appointment-date-filter">

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value
              )
            }
          />


          {dateFilter && (
            <button
              onClick={() =>
                setDateFilter("")
              }
            >
              Temizle
            </button>
          )}

        </div>

      </div>


      {/* TABLE */}

      <div className="appointments-card">

        {filteredAppointments.length ===
        0 ? (

          <div className="appointments-empty">

            <div className="empty-icon">
              📅
            </div>

            <h3>
              Randevu bulunamadı
            </h3>

            <p>
              Seçtiğin filtrelere uygun
              randevu bulunmuyor.
            </p>

            <button
              className="primary-button"
              onClick={
                openCreateModal
              }
            >

              <span>
                +
              </span>

              Yeni Randevu

            </button>

          </div>

        ) : (

          <div className="appointments-table-wrapper">

            <table className="appointments-table">

              <thead>

                <tr>

                  <th>
                    Tarih
                  </th>

                  <th>
                    Saat
                  </th>

                  <th>
                    Müşteri
                  </th>

                  <th>
                    Hizmet
                  </th>

                  <th>
                    Çalışan
                  </th>

                  <th>
                    Ücret
                  </th>

                  <th>
                    Durum
                  </th>

                  <th className="actions-column">
                    İşlemler
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredAppointments.map(
                  (appointment) => {

                    const customer =
                      customerMap[
                        appointment.customer_id
                      ];

                    const service =
                      serviceMap[
                        appointment.service_id
                      ];

                    const employee =
                      employeeMap[
                        appointment.employee_id
                      ];

                    const status =
                      String(
                        appointment.status ||
                          ""
                      ).toUpperCase();


                    return (
                      <tr
                        key={appointment.id}
                        onDoubleClick={() =>
                          setSelectedAppointment(appointment)
                        }
                        title="Detayı açmak için çift tıklayabilirsin"
                      >

                        <td>
                          <span className="appointment-date">
                            {formatDate(
                              appointment.appointment_date
                            )}
                          </span>
                        </td>


                        <td>
                          <span className="appointment-time">
                            {formatTime(
                              appointment.appointment_time
                            )}
                          </span>
                        </td>


                        <td>

                          <div className="appointment-person">

                            <div className="person-avatar customer">
                              {customer?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "?"}
                            </div>

                            <div>

                              <strong>
                                {customer?.full_name ||
                                  "Bilinmiyor"}
                              </strong>

                              <span>
                                {customer?.phone ||
                                  "Telefon yok"}
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <div className="service-cell">

                            <strong>
                              {service?.name ||
                                "Bilinmiyor"}
                            </strong>

                            {service && (
                              <span>
                                {service.duration_minutes
                                  ? `${service.duration_minutes} dk`
                                  : "Süre belirtilmemiş"}
                              </span>
                            )}

                          </div>

                        </td>


                        <td>

                          <div className="appointment-person">

                            <div className="person-avatar employee">
                              {employee?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "?"}
                            </div>

                            <div>

                              <strong>
                                {employee?.full_name ||
                                  "Atanmamış"}
                              </strong>

                              {employee?.specialty && (
                                <span>
                                  {
                                    employee.specialty
                                  }
                                </span>
                              )}

                            </div>

                          </div>

                        </td>


                        <td>

                          <strong className="appointment-price">
                            {formatPrice(
                              service?.price
                            )}
                          </strong>

                        </td>


                        <td>

                          <span
                            className={`appointment-status ${
                              STATUS_CLASSES[
                                status
                              ] || ""
                            }`}
                          >

                            <span></span>

                            {STATUS_LABELS[
                              status
                            ] ||
                              appointment.status ||
                              "Bilinmiyor"}

                          </span>

                        </td>


                        <td>

                          <div className="appointment-actions">

                            <button
                              className="action-text"
                              onClick={() =>
                                setSelectedAppointment(
                                  appointment
                                )
                              }
                            >
                              Detay
                            </button>


                            {status ===
                              "PENDING" && (
                              <button
                                className="action-text confirm"
                                onClick={() =>
                                  updateStatus(
                                    appointment,
                                    "CONFIRMED"
                                  )
                                }
                              >
                                Onayla
                              </button>
                            )}


                            {status ===
                              "CONFIRMED" && (
                              <button
                                className="action-text complete"
                                onClick={() =>
                                  updateStatus(
                                    appointment,
                                    "COMPLETED"
                                  )
                                }
                              >
                                Tamamla
                              </button>
                            )}


                            {status !==
                              "COMPLETED" &&
                              status !==
                                "CANCELLED" &&
                              status !==
                                "CANCELED" && (
                                <button
                                  className="action-text cancel"
                                  onClick={() =>
                                    updateStatus(
                                      appointment,
                                      "CANCELLED"
                                    )
                                  }
                                >
                                  İptal
                                </button>
                              )}


                            <button
                              className="action-icon delete"
                              onClick={() =>
                                handleDelete(
                                  appointment
                                )
                              }
                              title="Sil"
                            >
                              ×
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================================
          CREATE APPOINTMENT MODAL
      ====================================================== */}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={closeModal}
        >

          <div
            className="appointment-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Yeni Randevu
                </h2>

                <p>
                  Müşteri, hizmet, çalışan ve
                  uygun saati seç.
                </p>

              </div>


              <button
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
            >

              <div className="appointment-form">

                <div className="form-group">

                  <label>
                    Müşteri *
                  </label>

                  <select
                    name="customer_id"
                    value={
                      form.customer_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Müşteri seç...
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {
                            customer.full_name
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Hizmet *
                  </label>

                  <select
                    name="service_id"
                    value={
                      form.service_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Hizmet seç...
                    </option>

                    {services
                      .filter(
                        (service) =>
                          service.is_active
                      )
                      .map((service) => (
                        <option
                          key={
                            service.id
                          }
                          value={
                            service.id
                          }
                        >
                          {service.name} (
                          {service.duration_minutes ||
                            30}{" "}
                          dk)
                        </option>
                      ))}

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Çalışan *
                  </label>

                  <select
                    name="employee_id"
                    value={
                      form.employee_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Çalışan seç...
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={
                            employee.id
                          }
                          value={
                            employee.id
                          }
                        >
                          {
                            employee.full_name
                          }
                          {employee.specialty
                            ? ` — ${employee.specialty}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Tarih *
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
                    required
                  />

                </div>


                <div className="form-group full">

                  <label>
                    Uygun Saat *
                  </label>


                  {!form.employee_id ||
                  !form.service_id ||
                  !form.appointment_date ? (

                    <div className="slot-message">

                      <span>
                        ◷
                      </span>

                      Çalışan, hizmet ve
                      tarih seçildiğinde
                      uygun saatler burada
                      görünecek.

                    </div>

                  ) : loadingSlots ? (

                    <div className="slot-message">

                      <div className="slot-spinner"></div>

                      Uygun saatler kontrol
                      ediliyor...

                    </div>

                  ) : availableSlots.length ===
                    0 ? (

                    <div className="slot-message empty">

                      <span>
                        ⊘
                      </span>

                      {slotMessage}

                    </div>

                  ) : (

                    <div className="time-slots">

                      {availableSlots.map(
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
                              key={
                                slotTime
                              }
                              type="button"
                              className={
                                selected
                                  ? "time-slot selected"
                                  : "time-slot"
                              }
                              onClick={() =>
                                handleSelectSlot(
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


                  {form.appointment_time && (
                    <div className="selected-time">

                      <span>
                        ✓
                      </span>

                      <span>
                        Seçilen saat:
                      </span>

                      <strong>
                        {
                          form.appointment_time
                        }
                      </strong>

                    </div>
                  )}

                </div>


                <div className="form-group full">

                  <label>
                    Not
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Randevu hakkında not..."
                    rows="3"
                  />

                </div>

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={
                    saving ||
                    loadingSlots
                  }
                >
                  Vazgeç
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving ||
                    loadingSlots ||
                    !form.appointment_time
                  }
                >
                  {saving
                    ? "Oluşturuluyor..."
                    : "Randevu Oluştur"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* =====================================================
          APPOINTMENT DETAIL MODAL
      ====================================================== */}

      {selectedAppointment && (
        <div
          className="modal-overlay"
          onMouseDown={
            closeDetailModal
          }
        >

          <div
            className="appointment-modal appointment-detail-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Randevu Detayı
                </h2>

                <p>
                  Randevu #
                  {
                    selectedAppointment.id
                  }
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeDetailModal
                }
              >
                ×
              </button>

            </div>


            <div className="appointment-detail-content">

              <div className="appointment-detail-row">

                <span>
                  Durum
                </span>

                <span
                  className={`appointment-status ${
                    STATUS_CLASSES[
                      String(
                        selectedAppointment.status ||
                          ""
                      ).toUpperCase()
                    ] || ""
                  }`}
                >

                  <span></span>

                  {
                    STATUS_LABELS[
                      String(
                        selectedAppointment.status ||
                          ""
                      ).toUpperCase()
                    ] ||
                      selectedAppointment.status ||
                      "Bilinmiyor"
                  }

                </span>

              </div>


              <div className="appointment-detail-row">

                <span>
                  Müşteri
                </span>

                <strong>
                  {
                    customerMap[
                      selectedAppointment.customer_id
                    ]?.full_name ||
                    "Bilinmiyor"
                  }
                </strong>

              </div>


              <div className="appointment-detail-row">

                <span>
                  Telefon
                </span>

                <strong>
                  {
                    customerMap[
                      selectedAppointment.customer_id
                    ]?.phone ||
                    "Telefon yok"
                  }
                </strong>

              </div>


              <div className="appointment-detail-row">

                <span>
                  Hizmet
                </span>

                <strong>
                  {
                    serviceMap[
                      selectedAppointment.service_id
                    ]?.name ||
                    "Bilinmiyor"
                  }
                </strong>

              </div>


              <div className="appointment-detail-row">

                <span>
                  Süre
                </span>

                <strong>
                  {
                    serviceMap[
                      selectedAppointment.service_id
                    ]?.duration_minutes
                      ? `${
                          serviceMap[
                            selectedAppointment.service_id
                          ].duration_minutes
                        } dk`
                      : "—"
                  }
                </strong>

              </div>


              <div className="appointment-detail-row">

                <span>
                  Çalışan
                </span>

                <strong>
                  {
                    employeeMap[
                      selectedAppointment.employee_id
                    ]?.full_name ||
                    "Atanmamış"
                  }
                </strong>

              </div>


              <div className="appointment-detail-row">

                <span>
                  Tarih
                </span>

                <strong>
                  {formatDate(
                    selectedAppointment.appointment_date
                  )}
                </strong>

              </div>


              <div className="appointment-detail-row">

                <span>
                  Saat
                </span>

                <strong>
                  {formatTime(
                    selectedAppointment.appointment_time
                  )}
                </strong>

              </div>


              <div className="appointment-detail-row">

                <span>
                  Ücret
                </span>

                <strong>
                  {formatPrice(
                    serviceMap[
                      selectedAppointment.service_id
                    ]?.price
                  )}
                </strong>

              </div>


              {selectedAppointment.notes && (
                <div className="appointment-detail-notes">

                  <span>
                    Not
                  </span>

                  <p>
                    {
                      selectedAppointment.notes
                    }
                  </p>

                </div>
              )}

            </div>


            <div className="modal-footer">

              {String(
                selectedAppointment.status ||
                  ""
              ).toUpperCase() ===
                "PENDING" && (

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    updateStatus(
                      selectedAppointment,
                      "CONFIRMED"
                    )
                  }
                >
                  Randevuyu Onayla
                </button>

              )}


              {String(
                selectedAppointment.status ||
                  ""
              ).toUpperCase() ===
                "CONFIRMED" && (

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    updateStatus(
                      selectedAppointment,
                      "COMPLETED"
                    )
                  }
                >
                  Randevuyu Tamamla
                </button>

              )}


              {String(
                selectedAppointment.status ||
                  ""
              ).toUpperCase() !==
                "COMPLETED" &&
                String(
                  selectedAppointment.status ||
                    ""
                ).toUpperCase() !==
                  "CANCELLED" &&
                String(
                  selectedAppointment.status ||
                    ""
                ).toUpperCase() !==
                  "CANCELED" && (

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    updateStatus(
                      selectedAppointment,
                      "CANCELLED"
                    )
                  }
                >
                  Randevuyu İptal Et
                </button>

              )}


              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeDetailModal
                }
              >
                Kapat
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


export default Appointments;