import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Employees.css";

const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  email: "",
  specialty: "",
};

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(EMPTY_FORM);

  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [workingHoursEmployee, setWorkingHoursEmployee] = useState(null);
  const [workingHours, setWorkingHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  // ---------------------------------------------------------
  // ÇALIŞANLARI GETİR
  // ---------------------------------------------------------

  const fetchEmployees = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/employees");

      setEmployees(response.data);
    } catch (error) {
      console.error("Çalışanlar alınamadı:", error);
      alert(
        error.response?.data?.detail ||
          "Çalışanlar yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();

    const interval = setInterval(() => {
      fetchEmployees(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------
  // ARAMA
  // ---------------------------------------------------------

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = employees.filter((employee) => {
      const matchesSearch =
        !keyword ||
        employee.full_name?.toLowerCase().includes(keyword) ||
        employee.phone?.toLowerCase().includes(keyword) ||
        employee.email?.toLowerCase().includes(keyword) ||
        employee.specialty?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && employee.is_active) ||
        (statusFilter === "INACTIVE" && !employee.is_active);

      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "status") {
        return (
          Number(Boolean(b.is_active)) -
          Number(Boolean(a.is_active))
        );
      }

      if (sortBy === "specialty") {
        return String(a.specialty || "Genel").localeCompare(
          String(b.specialty || "Genel"),
          "tr"
        );
      }

      if (sortBy === "id") {
        return Number(a.id || 0) - Number(b.id || 0);
      }

      return String(a.full_name || "").localeCompare(
        String(b.full_name || ""),
        "tr"
      );
    });
  }, [employees, search, statusFilter, sortBy]);

  const activeCount = useMemo(
    () => employees.filter((employee) => employee.is_active).length,
    [employees]
  );

  const inactiveCount = employees.length - activeCount;

  const specialtyCount = useMemo(() => {
    return new Set(
      employees
        .map((employee) => String(employee.specialty || "Genel").trim().toLowerCase())
        .filter(Boolean)
    ).size;
  }, [employees]);

  // ---------------------------------------------------------
  // EMPLOYEE MODAL
  // ---------------------------------------------------------

  const openCreateModal = () => {
    setEditingEmployee(null);
    setEmployeeForm(EMPTY_FORM);
    setShowEmployeeModal(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);

    setEmployeeForm({
      full_name: employee.full_name || "",
      phone: employee.phone || "",
      email: employee.email || "",
      specialty: employee.specialty || "",
    });

    setShowEmployeeModal(true);
  };

  const closeEmployeeModal = () => {
    if (saving) {
      return;
    }

    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setEmployeeForm(EMPTY_FORM);
  };

  const handleEmployeeChange = (event) => {
    const { name, value } = event.target;

    setEmployeeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------------------------------------
  // CREATE / UPDATE EMPLOYEE
  // ---------------------------------------------------------

  const handleEmployeeSubmit = async (event) => {
    event.preventDefault();

    if (!employeeForm.full_name.trim()) {
      alert("Çalışan adı zorunludur.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        full_name: employeeForm.full_name.trim(),
        phone: employeeForm.phone.trim() || null,
        email: employeeForm.email.trim() || null,
        specialty: employeeForm.specialty.trim() || null,
      };

      if (editingEmployee) {
        await api.put(
          `/employees/${editingEmployee.id}`,
          payload
        );
      } else {
        await api.post("/employees", payload);
      }

      await fetchEmployees();

      closeEmployeeModal();
    } catch (error) {
      console.error("Çalışan kaydedilemedi:", error);

      alert(
        error.response?.data?.detail ||
          "Çalışan kaydedilirken bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // EMPLOYEE DELETE
  // ---------------------------------------------------------

  const handleDeleteEmployee = async (employee) => {
    const confirmed = window.confirm(
      `${employee.full_name} adlı çalışanı silmek istediğine emin misin?\n\nBu çalışana bağlı randevular da silinebilir.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/employees/${employee.id}`);

      await fetchEmployees();
    } catch (error) {
      console.error("Çalışan silinemedi:", error);

      alert(
        error.response?.data?.detail ||
          "Çalışan silinirken bir hata oluştu."
      );
    }
  };

  // ---------------------------------------------------------
  // ACTIVE / INACTIVE
  // ---------------------------------------------------------

  const handleToggleEmployee = async (employee) => {
    try {
      await api.put(`/employees/${employee.id}`, {
        full_name: employee.full_name,
        phone: employee.phone || null,
        email: employee.email || null,
        specialty: employee.specialty || null,
        is_active: !employee.is_active,
      });

      await fetchEmployees();
    } catch (error) {
      console.error("Çalışan durumu değiştirilemedi:", error);

      alert(
        error.response?.data?.detail ||
          "Çalışan durumu güncellenemedi."
      );
    }
  };

  // ---------------------------------------------------------
  // WORKING HOURS
  // ---------------------------------------------------------

  const openWorkingHours = async (employee) => {
    setWorkingHoursEmployee(employee);
    setShowWorkingHoursModal(true);
    setLoadingHours(true);

    try {
      const response = await api.get(
        `/employees/${employee.id}/working-hours`
      );

      const hours = [...response.data].sort(
        (a, b) => a.day_of_week - b.day_of_week
      );

      setWorkingHours(hours);
    } catch (error) {
      console.error(
        "Çalışma saatleri alınamadı:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Çalışma saatleri alınamadı."
      );

      setShowWorkingHoursModal(false);
    } finally {
      setLoadingHours(false);
    }
  };

  const closeWorkingHours = () => {
    if (savingHours) {
      return;
    }

    setShowWorkingHoursModal(false);
    setWorkingHoursEmployee(null);
    setWorkingHours([]);
  };

  const updateWorkingHour = (
    index,
    field,
    value
  ) => {
    setWorkingHours((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const toggleDayOff = (index) => {
    setWorkingHours((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const nextDayOff = !item.is_day_off;

        return {
          ...item,
          is_day_off: nextDayOff,
          start_time: nextDayOff
            ? null
            : item.start_time || "09:00:00",
          end_time: nextDayOff
            ? null
            : item.end_time || "18:00:00",
        };
      })
    );
  };

  const handleWorkingHoursSubmit = async (event) => {
    event.preventDefault();

    if (!workingHoursEmployee) {
      return;
    }

    for (const day of workingHours) {
      if (day.is_day_off) {
        continue;
      }

      if (!day.start_time || !day.end_time) {
        alert(
          `${DAY_NAMES[day.day_of_week]} için başlangıç ve bitiş saati girilmelidir.`
        );
        return;
      }

      if (day.start_time >= day.end_time) {
        alert(
          `${DAY_NAMES[day.day_of_week]} için başlangıç saati bitiş saatinden önce olmalıdır.`
        );
        return;
      }
    }

    try {
      setSavingHours(true);

      const payload = {
        hours: workingHours.map((item) => ({
          day_of_week: item.day_of_week,
          start_time: item.is_day_off
            ? null
            : item.start_time?.slice(0, 5),
          end_time: item.is_day_off
            ? null
            : item.end_time?.slice(0, 5),
          is_day_off: item.is_day_off,
        })),
      };

      const response = await api.put(
        `/employees/${workingHoursEmployee.id}/working-hours`,
        payload
      );

      setWorkingHours(
        [...response.data].sort(
          (a, b) => a.day_of_week - b.day_of_week
        )
      );

      alert("Çalışma saatleri başarıyla kaydedildi.");
    } catch (error) {
      console.error(
        "Çalışma saatleri kaydedilemedi:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Çalışma saatleri kaydedilemedi."
      );
    } finally {
      setSavingHours(false);
    }
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="employees-page">
        <div className="employees-loading">
          <div className="loading-spinner"></div>
          <span>Çalışanlar yükleniyor...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="employees-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-copy">
          <div className="page-eyebrow">EKİP YÖNETİMİ</div>
          <h1>Çalışanlar</h1>
          <p>
            İşletmendeki ekibi, uzmanlık alanlarını ve çalışma saatlerini tek ekrandan yönet.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openCreateModal}
        >
          <span>+</span>
          Çalışan Ekle
        </button>
      </div>

      {/* STATS */}
      <div className="employee-stats">
        <div className="employee-stat-card primary">
          <div className="employee-stat-icon">👥</div>
          <div className="employee-stat-copy">
            <span>Toplam Çalışan</span>
            <strong>{employees.length}</strong>
            <small>Ekibindeki toplam kişi</small>
          </div>
        </div>

        <div className="employee-stat-card success-card">
          <div className="employee-stat-icon success">✓</div>
          <div className="employee-stat-copy">
            <span>Aktif</span>
            <strong>{activeCount}</strong>
            <small>Şu anda aktif çalışanlar</small>
          </div>
        </div>

        <div className="employee-stat-card muted-card">
          <div className="employee-stat-icon muted">○</div>
          <div className="employee-stat-copy">
            <span>Pasif</span>
            <strong>{inactiveCount}</strong>
            <small>Yönetim dışında olanlar</small>
          </div>
        </div>

        <div className="employee-stat-card accent-card">
          <div className="employee-stat-icon accent">✦</div>
          <div className="employee-stat-copy">
            <span>Uzmanlık Alanı</span>
            <strong>{specialtyCount}</strong>
            <small>Ekibindeki farklı uzmanlık</small>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="employees-toolbar">
        <div className="employees-toolbar-left">
          <div className="employees-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Ad, telefon, e-posta veya uzmanlık ara..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
                aria-label="Aramayı temizle"
              >
                ×
              </button>
            )}
          </div>

          <div className="employee-filters">
            <button
              type="button"
              className={`filter-chip ${
                statusFilter === "ALL" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("ALL")}
            >
              Tümü
            </button>

            <button
              type="button"
              className={`filter-chip ${
                statusFilter === "ACTIVE" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("ACTIVE")}
            >
              Aktif <span>{activeCount}</span>
            </button>

            <button
              type="button"
              className={`filter-chip ${
                statusFilter === "INACTIVE" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("INACTIVE")}
            >
              Pasif <span>{inactiveCount}</span>
            </button>
          </div>
        </div>

        <div className="employees-toolbar-right">
          <label className="employees-sort">
            <span>Sırala</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="name">İsim</option>
              <option value="specialty">Uzmanlık</option>
              <option value="status">Durum</option>
              <option value="id">ID</option>
            </select>
          </label>

          <button
            type="button"
            className="refresh-button"
            onClick={() => fetchEmployees(true)}
            disabled={refreshing}
            title="Çalışanları yenile"
          >
            <span
              className={
                refreshing
                  ? "refresh-icon spinning"
                  : "refresh-icon"
              }
            >
              ↻
            </span>
            Yenile
          </button>

          <div className="employees-result-count">
            {filteredEmployees.length} / {employees.length} çalışan
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="employees-card">
        {filteredEmployees.length === 0 ? (
          <div className="employees-empty">
            <div className="empty-icon">👤</div>

            <h3>
              {search
                ? "Sonuç bulunamadı"
                : "Henüz çalışan yok"}
            </h3>

            <p>
              {search
                ? "Farklı bir arama terimi deneyebilirsin."
                : "İlk çalışanını ekleyerek başlayabilirsin."}
            </p>

            {!search && (
              <button
                className="primary-button"
                onClick={openCreateModal}
              >
                <span>+</span>
                İlk Çalışanı Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="employees-table-wrapper">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Çalışan</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Uzmanlık</th>
                  <th>Durum</th>
                  <th>Çalışma</th>
                  <th className="actions-column">
                    İşlemler
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    onDoubleClick={() => openEditModal(employee)}
                    title="Düzenlemek için çift tıklayabilirsin"
                  >
                    <td>
                      <div className="employee-info">
                        <div className="employee-avatar">
                          {employee.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </div>

                        <div>
                          <strong>
                            {employee.full_name}
                          </strong>

                          <span>
                            #{employee.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="table-text">
                        {employee.phone || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="table-text">
                        {employee.email || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="specialty-badge">
                        {employee.specialty || "Genel"}
                      </span>
                    </td>

                    <td>
                      <button
                        className={`status-badge ${
                          employee.is_active
                            ? "active"
                            : "inactive"
                        }`}
                        onClick={() =>
                          handleToggleEmployee(employee)
                        }
                        title="Durumu değiştir"
                      >
                        <span></span>

                        {employee.is_active
                          ? "Aktif"
                          : "Pasif"}
                      </button>
                    </td>

                    <td>
                      <button
                        className="working-hours-button"
                        onClick={() =>
                          openWorkingHours(employee)
                        }
                      >
                        <span>◷</span>
                        Saatler
                      </button>
                    </td>

                    <td>
                      <div className="employee-actions">
                        <button
                          className="action-button edit"
                          onClick={() =>
                            openEditModal(employee)
                          }
                          title="Düzenle"
                        >
                          ✎
                        </button>

                        <button
                          className="action-button delete"
                          onClick={() =>
                            handleDeleteEmployee(employee)
                          }
                          title="Sil"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------
          CREATE / EDIT EMPLOYEE MODAL
      ---------------------------------------------------- */}

      {showEmployeeModal && (
        <div
          className="modal-overlay"
          onMouseDown={closeEmployeeModal}
        >
          <div
            className="employee-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingEmployee
                    ? "Çalışanı Düzenle"
                    : "Yeni Çalışan"}
                </h2>

                <p>
                  Çalışan bilgilerini aşağıdan
                  düzenleyebilirsin.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeEmployeeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEmployeeSubmit}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Ad Soyad *</label>

                  <input
                    name="full_name"
                    type="text"
                    placeholder="Örn. Ahmet Yılmaz"
                    value={employeeForm.full_name}
                    onChange={handleEmployeeChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Telefon</label>

                  <input
                    name="phone"
                    type="text"
                    placeholder="05xx xxx xx xx"
                    value={employeeForm.phone}
                    onChange={handleEmployeeChange}
                  />
                </div>

                <div className="form-group">
                  <label>E-posta</label>

                  <input
                    name="email"
                    type="email"
                    placeholder="ornek@mail.com"
                    value={employeeForm.email}
                    onChange={handleEmployeeChange}
                  />
                </div>

                <div className="form-group full">
                  <label>Uzmanlık</label>

                  <input
                    name="specialty"
                    type="text"
                    placeholder="Örn. Saç Kesimi, Sakal"
                    value={employeeForm.specialty}
                    onChange={handleEmployeeChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeEmployeeModal}
                  disabled={saving}
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Kaydediliyor..."
                    : editingEmployee
                    ? "Değişiklikleri Kaydet"
                    : "Çalışanı Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------
          WORKING HOURS MODAL
      ---------------------------------------------------- */}

      {showWorkingHoursModal && (
        <div
          className="modal-overlay"
          onMouseDown={closeWorkingHours}
        >
          <div
            className="working-hours-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <div className="working-hours-title-row">
                  <div className="working-hours-icon">
                    ◷
                  </div>

                  <div>
                    <h2>Çalışma Saatleri</h2>

                    <p>
                      {workingHoursEmployee?.full_name}
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={closeWorkingHours}
              >
                ×
              </button>
            </div>

            {loadingHours ? (
              <div className="working-hours-loading">
                <div className="loading-spinner"></div>

                <span>
                  Çalışma saatleri yükleniyor...
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleWorkingHoursSubmit}
              >
                <div className="working-hours-content">
                  <div className="working-hours-info">
                    <div className="info-icon">
                      ℹ
                    </div>

                    <span>
                      Çalışanın hangi günlerde ve hangi
                      saatlerde çalıştığını belirle.
                    </span>
                  </div>

                  <div className="working-days">
                    {workingHours.map(
                      (day, index) => (
                        <div
                          className={`working-day-row ${
                            day.is_day_off
                              ? "day-off"
                              : ""
                          }`}
                          key={day.day_of_week}
                        >
                          <div className="day-name">
                            <div className="day-number">
                              {index + 1}
                            </div>

                            <strong>
                              {
                                DAY_NAMES[
                                  day.day_of_week
                                ]
                              }
                            </strong>
                          </div>

                          <label className="day-off-toggle">
                            <input
                              type="checkbox"
                              checked={
                                day.is_day_off
                              }
                              onChange={() =>
                                toggleDayOff(index)
                              }
                            />

                            <span className="toggle-slider"></span>

                            <span className="day-off-label">
                              Tatil
                            </span>
                          </label>

                          <div className="time-fields">
                            <div className="time-field">
                              <label>
                                Başlangıç
                              </label>

                              <input
                                type="time"
                                value={
                                  day.start_time
                                    ? day.start_time.slice(
                                        0,
                                        5
                                      )
                                    : ""
                                }
                                disabled={
                                  day.is_day_off
                                }
                                onChange={(event) =>
                                  updateWorkingHour(
                                    index,
                                    "start_time",
                                    event.target.value
                                  )
                                }
                              />
                            </div>

                            <span className="time-separator">
                              —
                            </span>

                            <div className="time-field">
                              <label>
                                Bitiş
                              </label>

                              <input
                                type="time"
                                value={
                                  day.end_time
                                    ? day.end_time.slice(
                                        0,
                                        5
                                      )
                                    : ""
                                }
                                disabled={
                                  day.is_day_off
                                }
                                onChange={(event) =>
                                  updateWorkingHour(
                                    index,
                                    "end_time",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeWorkingHours}
                    disabled={savingHours}
                  >
                    Vazgeç
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={savingHours}
                  >
                    {savingHours
                      ? "Kaydediliyor..."
                      : "Çalışma Saatlerini Kaydet"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;