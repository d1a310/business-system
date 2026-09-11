import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Dashboard.css";

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

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "₺0";
  }

  return Number(value).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  });
}

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const parts = String(dateString)
    .split("-")
    .map(Number);

  if (parts.length !== 3) {
    return dateString;
  }

  const [year, month, day] = parts;

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

function getTodayLabel() {
  return new Date().toLocaleDateString(
    "tr-TR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDashboard = async (
    silent = false
  ) => {
    try {
      setErrorMessage("");

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        "/dashboard/summary"
      );

      setData(response.data);
    } catch (error) {
      console.error(
        "Dashboard verileri alınamadı:",
        error
      );

      setErrorMessage(
        error.response?.data?.detail ||
          "Dashboard verileri yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const stats = data?.stats || {};

  const upcomingAppointments =
    data?.upcoming_appointments || [];

  const topServices =
    data?.top_services || [];

  const employeePerformance =
    data?.employee_performance || [];

  const maxServiceCount = useMemo(() => {
    if (!topServices.length) {
      return 1;
    }

    return Math.max(
      ...topServices.map(
        (service) => service.count || 0
      ),
      1
    );
  }, [topServices]);

  const maxEmployeeCompleted = useMemo(() => {
    if (!employeePerformance.length) {
      return 1;
    }

    return Math.max(
      ...employeePerformance.map(
        (employee) =>
          employee.completed || 0
      ),
      1
    );
  }, [employeePerformance]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>

          <span>
            Dashboard yükleniyor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {errorMessage ? (
        <div className="dashboard-alert" role="alert">
          <div className="dashboard-alert-icon">!</div>
          <div className="dashboard-alert-content">
            <strong>Dashboard verileri alınamadı</strong>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboard(false)}
          >
            Tekrar Dene
          </button>
        </div>
      ) : null}

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">
            İşletme Özeti
          </div>

          <h1>
            Günaydın 👋
          </h1>

          <p>
            İşletmenin bugünkü durumuna
            hızlıca göz at.
          </p>
        </div>

        <div className="dashboard-header-right">
          <div className="dashboard-date">
            <span>Bugün</span>
            <strong>
              {getTodayLabel()}
            </strong>
          </div>

          <button
            className="refresh-button"
            onClick={() =>
              fetchDashboard(true)
            }
            disabled={refreshing}
            title="Yenile"
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
        </div>
      </div>

      {/* =====================================================
          MAIN STATS
      ====================================================== */}

      <div className="dashboard-stats">

        <div className="dashboard-stat-card">
          <div className="stat-top">
            <div className="stat-icon appointments">
              📅
            </div>

            <span className="stat-label">
              Bugünkü Randevu
            </span>
          </div>

          <div className="stat-value">
            {stats.today_appointments || 0}
          </div>

          <div className="stat-bottom">
            <span>
              Bekleyen
            </span>

            <strong>
              {stats.pending_appointments || 0}
            </strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-top">
            <div className="stat-icon revenue">
              ₺
            </div>

            <span className="stat-label">
              Bugünkü Gelir
            </span>
          </div>

          <div className="stat-value revenue-value">
            {formatPrice(
              stats.today_revenue
            )}
          </div>

          <div className="stat-bottom">
            <span>
              Tamamlanan
            </span>

            <strong>
              {stats.completed_appointments ||
                0}
            </strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-top">
            <div className="stat-icon month">
              ↗
            </div>

            <span className="stat-label">
              Bu Ay Gelir
            </span>
          </div>

          <div className="stat-value revenue-value">
            {formatPrice(
              stats.month_revenue
            )}
          </div>

          <div className="stat-bottom">
            <span>
              Tamamlanan ziyaret
            </span>

            <strong>
              {stats.month_completed || 0}
            </strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-top">
            <div className="stat-icon customers">
              👥
            </div>

            <span className="stat-label">
              Toplam Müşteri
            </span>
          </div>

          <div className="stat-value">
            {stats.total_customers || 0}
          </div>

          <div className="stat-bottom">
            <span>
              Aktif çalışan
            </span>

            <strong>
              {stats.active_employees || 0}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          SECONDARY STATS
      ====================================================== */}

      <div className="dashboard-mini-stats">

        <div className="mini-stat">
          <div className="mini-stat-icon">
            ✓
          </div>

          <div>
            <span>
              Onaylanan
            </span>

            <strong>
              {stats.confirmed_appointments ||
                0}
            </strong>
          </div>
        </div>

        <div className="mini-stat">
          <div className="mini-stat-icon">
            ✦
          </div>

          <div>
            <span>
              Aktif hizmet
            </span>

            <strong>
              {stats.active_services || 0}
            </strong>
          </div>
        </div>

        <div className="mini-stat">
          <div className="mini-stat-icon">
            👤
          </div>

          <div>
            <span>
              Aktif çalışan
            </span>

            <strong>
              {stats.active_employees || 0}
            </strong>
          </div>
        </div>

        <div className="mini-stat">
          <div className="mini-stat-icon warning">
            ⏳
          </div>

          <div>
            <span>
              Bekleyen işlemler
            </span>

            <strong>
              {stats.pending_appointments ||
                0}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <section className="dashboard-quick-actions">
        <div className="quick-actions-copy">
          <span className="quick-actions-eyebrow">Hızlı İşlemler</span>
          <strong>Günün işlerini buradan yönetin</strong>
          <p>En sık kullandığınız bölümlere tek tıkla geçin.</p>
        </div>

        <div className="quick-actions-list">
          <a href="/appointments" className="quick-action">
            <span className="quick-action-icon">＋</span>
            <span>
              <strong>Randevu Yönet</strong>
              <small>Bugünkü randevular</small>
            </span>
            <b>→</b>
          </a>

          <a href="/customers" className="quick-action">
            <span className="quick-action-icon">♙</span>
            <span>
              <strong>Müşteri Ekle</strong>
              <small>Müşteri kayıtlarını yönet</small>
            </span>
            <b>→</b>
          </a>

          <a href="/services" className="quick-action">
            <span className="quick-action-icon">✦</span>
            <span>
              <strong>Hizmetleri Düzenle</strong>
              <small>Fiyat ve süre bilgileri</small>
            </span>
            <b>→</b>
          </a>

          <a href="/employees" className="quick-action">
            <span className="quick-action-icon">◉</span>
            <span>
              <strong>Çalışanları Yönet</strong>
              <small>Ekip ve çalışma düzeni</small>
            </span>
            <b>→</b>
          </a>
        </div>
      </section>

      {/* =====================================================
          CONTENT GRID
      ====================================================== */}

      <div className="dashboard-grid">

        {/* ===================================================
            UPCOMING APPOINTMENTS
        ==================================================== */}

        <section className="dashboard-panel upcoming-panel">

          <div className="panel-header">
            <div>
              <h2>
                Yaklaşan Randevular
              </h2>

              <p>
                Sıradaki müşteri ve işlemler
              </p>
            </div>

            <a
              href="/appointments"
              className="panel-link"
            >
              Tümünü Gör
              <span>→</span>
            </a>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="panel-empty">
              <div className="panel-empty-icon">
                📅
              </div>

              <strong>
                Yaklaşan randevu yok
              </strong>

              <span>
                Yeni randevular burada
                görünecek.
              </span>
            </div>
          ) : (
            <div className="upcoming-list">

              {upcomingAppointments.map(
                (appointment) => {
                  const status =
                    String(
                      appointment.status ||
                        ""
                    ).toUpperCase();

                  return (
                    <div
                      className="upcoming-item"
                      key={appointment.id}
                    >

                      <div className="upcoming-date-box">
                        <strong>
                          {formatDate(
                            appointment.date
                          )}
                        </strong>

                        <span>
                          {appointment.time}
                        </span>
                      </div>

                      <div className="upcoming-main">
                        <strong>
                          {
                            appointment.customer_name
                          }
                        </strong>

                        <span>
                          {
                            appointment.service_name
                          }
                        </span>
                      </div>

                      <div className="upcoming-worker">
                        <span>
                          Çalışan
                        </span>

                        <strong>
                          {
                            appointment.employee_name
                          }
                        </strong>
                      </div>

                      <div className="upcoming-price">
                        <strong>
                          {formatPrice(
                            appointment.price
                          )}
                        </strong>

                        <span
                          className={`dashboard-status ${
                            STATUS_CLASSES[
                              status
                            ] || ""
                          }`}
                        >
                          <i></i>

                          {STATUS_LABELS[
                            status
                          ] ||
                            appointment.status}
                        </span>
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* ===================================================
            TOP SERVICES
        ==================================================== */}

        <section className="dashboard-panel services-panel">

          <div className="panel-header">
            <div>
              <h2>
                En Çok Tercih Edilenler
              </h2>

              <p>
                Hizmet performansı
              </p>
            </div>

            <a
              href="/services"
              className="panel-link"
            >
              Hizmetler
              <span>→</span>
            </a>
          </div>

          {topServices.length === 0 ? (
            <div className="panel-empty">
              <div className="panel-empty-icon">
                ✦
              </div>

              <strong>
                Henüz veri yok
              </strong>

              <span>
                Randevu oluştukça
                burada görünecek.
              </span>
            </div>
          ) : (
            <div className="service-ranking">

              {topServices.map(
                (service, index) => {
                  const percentage =
                    ((service.count || 0) /
                      maxServiceCount) *
                    100;

                  return (
                    <div
                      className="service-rank-item"
                      key={service.id}
                    >

                      <div className="rank-number">
                        {index + 1}
                      </div>

                      <div className="rank-content">

                        <div className="rank-top">
                          <strong>
                            {service.name}
                          </strong>

                          <span>
                            {service.count}{" "}
                            randevu
                          </span>
                        </div>

                        <div className="rank-bar">
                          <span
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></span>
                        </div>

                      </div>

                      <strong className="rank-revenue">
                        {formatPrice(
                          service.revenue
                        )}
                      </strong>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>

      {/* =====================================================
          EMPLOYEE PERFORMANCE
      ====================================================== */}

      <section className="dashboard-panel employee-panel">

        <div className="panel-header">
          <div>
            <h2>
              Çalışan Performansı
            </h2>

            <p>
              Tamamlanan randevu ve gelir
              performansı
            </p>
          </div>

          <a
            href="/employees"
            className="panel-link"
          >
            Çalışanlar
            <span>→</span>
          </a>
        </div>

        {employeePerformance.length ===
        0 ? (
          <div className="panel-empty compact">
            <div className="panel-empty-icon">
              👥
            </div>

            <strong>
              Henüz performans verisi yok
            </strong>

            <span>
              Çalışanların randevuları
              burada görünecek.
            </span>
          </div>
        ) : (
          <div className="employee-performance">

            {employeePerformance.map(
              (employee) => {
                const percentage =
                  ((employee.completed ||
                    0) /
                    maxEmployeeCompleted) *
                  100;

                return (
                  <div
                    className="employee-performance-row"
                    key={employee.id}
                  >

                    <div className="employee-performance-info">

                      <div className="employee-mini-avatar">
                        {employee.name
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </div>

                      <div>
                        <strong>
                          {employee.name}
                        </strong>

                        <span>
                          {
                            employee.appointments
                          }{" "}
                          randevu
                        </span>
                      </div>

                    </div>

                    <div className="employee-progress-area">

                      <div className="employee-progress-label">
                        <span>
                          Tamamlanan
                        </span>

                        <strong>
                          {
                            employee.completed
                          }
                        </strong>
                      </div>

                      <div className="employee-progress">
                        <span
                          style={{
                            width: `${percentage}%`,
                          }}
                        ></span>
                      </div>

                    </div>

                    <div className="employee-performance-revenue">
                      <span>
                        Gelir
                      </span>

                      <strong>
                        {formatPrice(
                          employee.revenue
                        )}
                      </strong>
                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>

    </div>
  );
}

export default Dashboard;