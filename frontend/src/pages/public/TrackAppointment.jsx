import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./TrackAppointment.css";

const STATUS_CONFIG = {
  PENDING: {
    label: "Onay bekliyor",
    short: "Bekliyor",
    tone: "warning",
    description: "Randevu talebiniz işletme tarafından değerlendiriliyor.",
  },
  CONFIRMED: {
    label: "Randevu onaylandı",
    short: "Onaylandı",
    tone: "success",
    description: "Randevunuz onaylandı. Belirlenen tarih ve saatte sizi bekliyoruz.",
  },
  COMPLETED: {
    label: "Randevu tamamlandı",
    short: "Tamamlandı",
    tone: "complete",
    description: "Randevunuz başarıyla tamamlandı.",
  },
  CANCELLED: {
    label: "Randevu iptal edildi",
    short: "İptal",
    tone: "danger",
    description: "Bu randevu artık aktif değil.",
  },
  CANCELED: {
    label: "Randevu iptal edildi",
    short: "İptal",
    tone: "danger",
    description: "Bu randevu artık aktif değil.",
  },
};

const STEPS = [
  { key: "PENDING", title: "Talep alındı", text: "Randevu talebiniz sisteme kaydedildi." },
  { key: "CONFIRMED", title: "Onaylandı", text: "İşletme randevunuzu onayladı." },
  { key: "COMPLETED", title: "Tamamlandı", text: "Hizmetiniz tamamlandığında süreç kapanır." },
];

function normalizeStatus(status) {
  return String(status || "").toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatWeekday(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "—";
  return String(value).slice(0, 5);
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "BS";
}

function getStepState(status, stepKey) {
  const normalized = normalizeStatus(status);

  if (normalized === "CANCELLED" || normalized === "CANCELED") {
    return "cancelled";
  }

  const order = {
    PENDING: 1,
    CONFIRMED: 2,
    COMPLETED: 3,
  };

  const current = order[normalized] || 1;
  const step = order[stepKey] || 1;

  if (current > step) return "done";
  if (current === step) return "current";
  return "upcoming";
}

export default function TrackAppointment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchAppointment = async () => {
    try {
      setError("");
      setLoading(true);

      const response = await api.get(`/public/appointments/${appointmentId}`);
      setAppointment(response.data);
    } catch (err) {
      console.error("Randevu getirilemedi:", err);
      setError(
        err.response?.data?.detail ||
          "Randevu bilgileri alınamadı. Randevu numarasını kontrol edip tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!appointmentId) {
      setError("Geçerli bir randevu numarası bulunamadı.");
      setLoading(false);
      return;
    }

    fetchAppointment();
  }, [appointmentId]);

  const status = normalizeStatus(appointment?.status);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const canCancel = ["PENDING", "CONFIRMED"].includes(status);

  const bookingUrl = useMemo(() => {
    if (!appointment?.business_slug) return "/";
    return `/book/${appointment.business_slug}`;
  }, [appointment?.business_slug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(appointmentId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleCancel = async () => {
    if (!canCancel || cancelling) return;

    const confirmed = window.confirm(
      "Bu randevuyu iptal etmek istediğine emin misin?"
    );

    if (!confirmed) return;

    try {
      setCancelling(true);

      await api.patch(`/public/appointments/${appointmentId}/cancel`);
      await fetchAppointment();
    } catch (err) {
      console.error("Randevu iptal edilemedi:", err);
      window.alert(
        err.response?.data?.detail ||
          "Randevu iptal edilemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="track-page">
        <div className="track-loading">
          <div className="track-spinner" />
          <strong>Randevunuz hazırlanıyor</strong>
          <span>Bilgiler güvenli şekilde yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="track-page">
        <div className="track-shell">
          <header className="track-header">
            <Link to="/" className="track-brand">
              <span className="track-brand-mark">BS</span>
              <span>
                <strong>Business System</strong>
                <small>Randevu Takibi</small>
              </span>
            </Link>
          </header>

          <main className="track-error">
            <div className="track-error-icon">!</div>
            <span className="track-eyebrow">RANDEVU TAKİBİ</span>
            <h1>Randevu bulunamadı.</h1>
            <p>{error || "Bu randevuya ait kayıt bulunamadı."}</p>

            <div className="track-error-actions">
              <button type="button" onClick={fetchAppointment} className="track-primary">
                Tekrar Dene
              </button>
              <Link to="/" className="track-secondary">
                Ana Sayfaya Dön
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="track-page">
      <div className="track-shell">
        <header className="track-header">
          <Link to={bookingUrl} className="track-brand">
            <span className="track-brand-mark">
              {getInitials(appointment.business_name)}
            </span>
            <span>
              <strong>{appointment.business_name}</strong>
              <small>Online Randevu</small>
            </span>
          </Link>

          <div className="track-header-id">
            <span>RANDEVU NO</span>
            <button type="button" onClick={handleCopy}>
              #{appointment.appointment_id}
              <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
            </button>
          </div>
        </header>

        <main className="track-main">
          <section className="track-hero">
            <div className="track-hero-copy">
              <span className="track-eyebrow">RANDEVU TAKİBİ</span>
              <h1>
                Randevunuzun
                <br />
                durumu hazır.
              </h1>
              <p>
                Randevu bilgileriniz tek ekranda. Tarih, saat, hizmet ve
                güncel durumunuzu buradan takip edebilirsiniz.
              </p>
            </div>

            <div className={`track-status-card ${config.tone}`}>
              <div className="track-status-icon">
                {status === "COMPLETED"
                  ? "✓"
                  : status === "CANCELLED" || status === "CANCELED"
                  ? "×"
                  : "•"}
              </div>
              <div>
                <span>MEVCUT DURUM</span>
                <strong>{config.label}</strong>
                <p>{config.description}</p>
              </div>
            </div>
          </section>

          <section className="track-grid">
            <div className="track-card track-details-card">
              <div className="track-card-heading">
                <div>
                  <span>RANDEVU DETAYI</span>
                  <h2>Planınız</h2>
                </div>
                <span className={`track-pill ${config.tone}`}>{config.short}</span>
              </div>

              <div className="track-detail-list">
                <div className="track-detail-item highlight">
                  <span>Tarih</span>
                  <strong>{formatDate(appointment.appointment_date)}</strong>
                  <small>{formatWeekday(appointment.appointment_date)}</small>
                </div>

                <div className="track-detail-item highlight">
                  <span>Saat</span>
                  <strong>{formatTime(appointment.appointment_time)}</strong>
                  <small>{appointment.service_duration_minutes || 30} dakika</small>
                </div>

                <div className="track-detail-item">
                  <span>Hizmet</span>
                  <strong>{appointment.service_name}</strong>
                  <small>{Number(appointment.service_price || 0).toLocaleString("tr-TR")} ₺</small>
                </div>

                <div className="track-detail-item">
                  <span>Uzman</span>
                  <strong>{appointment.employee_name}</strong>
                  <small>Randevunuzu gerçekleştirecek çalışan</small>
                </div>

                <div className="track-detail-item">
                  <span>Misafir</span>
                  <strong>{appointment.customer_name}</strong>
                  <small>Randevu sahibi</small>
                </div>
              </div>

              {appointment.notes && (
                <div className="track-note">
                  <span>NOT</span>
                  <p>{appointment.notes}</p>
                </div>
              )}
            </div>

            <aside className="track-card track-side-card">
              <div className="track-side-top">
                <span>İŞLETME</span>
                <div className="track-business-avatar">
                  {getInitials(appointment.business_name)}
                </div>
                <h2>{appointment.business_name}</h2>
                <p>Online randevu yönetimi</p>
              </div>

              <div className="track-mini-summary">
                <div>
                  <span>Randevu No</span>
                  <strong>#{appointment.appointment_id}</strong>
                </div>
                <div>
                  <span>Hizmet</span>
                  <strong>{appointment.service_name}</strong>
                </div>
              </div>

              <Link to={bookingUrl} className="track-primary track-book-again">
                Yeni Randevu Al
                <span>→</span>
              </Link>

              {canCancel && (
                <button
                  type="button"
                  className="track-cancel"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? "İptal ediliyor..." : "Randevuyu İptal Et"}
                </button>
              )}
            </aside>
          </section>

          <section className="track-card track-timeline-card">
            <div className="track-card-heading">
              <div>
                <span>RANDEVU SÜRECİ</span>
                <h2>Durum adımları</h2>
              </div>
            </div>

            <div className="track-timeline">
              {STEPS.map((step, index) => {
                const state = getStepState(status, step.key);

                return (
                  <div
                    key={step.key}
                    className={`track-timeline-step ${state}`}
                  >
                    <div className="track-timeline-marker">
                      {state === "done" ? "✓" : String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="track-timeline-copy">
                      <strong>{step.title}</strong>
                      <span>{step.text}</span>
                    </div>

                    {index < STEPS.length - 1 && (
                      <div className={`track-timeline-line ${state}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {(status === "CANCELLED" || status === "CANCELED") && (
              <div className="track-cancelled-banner">
                <strong>Bu randevu iptal edildi.</strong>
                <span>Yeni bir randevu oluşturmak için yukarıdaki butonu kullanabilirsiniz.</span>
              </div>
            )}
          </section>
        </main>

        <footer className="track-footer">
          <span>Powered by</span>
          <strong>Business System</strong>
        </footer>
      </div>
    </div>
  );
}
