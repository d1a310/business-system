import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Services.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  duration_minutes: "30",
  is_active: true,
};

const DURATION_OPTIONS = [
  30,
  60,
  90,
  120,
  150,
  180,
  210,
  240,
];

function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "—";
  }

  return Number(price).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
}

function Services() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [form, setForm] = useState(
    EMPTY_FORM
  );

  // =========================================================
  // FETCH
  // =========================================================

  const fetchServices = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        "/services"
      );

      setServices(response.data || []);
    } catch (error) {
      console.error(
        "Hizmetler alınamadı:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Hizmetler yüklenirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();

    const interval = setInterval(() => {
      fetchServices(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = services.filter((service) => {
      const matchesSearch =
        !keyword ||
        service.name?.toLowerCase().includes(keyword) ||
        service.description?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && service.is_active) ||
        (statusFilter === "INACTIVE" && !service.is_active);

      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price") {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      if (sortBy === "duration") {
        return Number(b.duration_minutes || 0) - Number(a.duration_minutes || 0);
      }

      if (sortBy === "status") {
        return Number(Boolean(b.is_active)) - Number(Boolean(a.is_active));
      }

      return String(a.name || "").localeCompare(
        String(b.name || ""),
        "tr"
      );
    });
  }, [services, search, statusFilter, sortBy]);

  const activeCount = useMemo(
    () => services.filter((service) => service.is_active).length,
    [services]
  );

  const inactiveCount = services.length - activeCount;

  const averagePrice = useMemo(() => {
    if (!services.length) return 0;
    return (
      services.reduce(
        (sum, service) => sum + Number(service.price || 0),
        0
      ) / services.length
    );
  }, [services]);

  // =========================================================
  // MODAL
  // =========================================================

  const openCreateModal = () => {
    setEditingService(null);
    setForm({
      ...EMPTY_FORM,
    });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);

    setForm({
      name: service.name || "",
      description:
        service.description || "",
      price:
        service.price !== null &&
        service.price !== undefined
          ? String(service.price)
          : "",
      duration_minutes: String(
        service.duration_minutes || 30
      ),
      is_active: service.is_active !== false,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingService(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Hizmet adı zorunludur.");
      return;
    }

    const duration = Number(
      form.duration_minutes
    );

    if (
      !Number.isInteger(duration) ||
      duration < 30 ||
      duration > 480 ||
      duration % 30 !== 0
    ) {
      alert(
        "Hizmet süresi 30 ile 480 dakika arasında ve 30'un katı olmalıdır."
      );

      return;
    }

    const price = Number(
      form.price || 0
    );

    if (price < 0) {
      alert(
        "Fiyat negatif olamaz."
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description:
          form.description.trim() ||
          null,
        price,
        duration_minutes: duration,
        is_active: form.is_active,
      };

      if (editingService) {
        await api.put(
          `/services/${editingService.id}`,
          payload
        );
      } else {
        await api.post(
          "/services",
          payload
        );
      }

      await fetchServices();

      setShowModal(false);
      setEditingService(null);
      setForm({
        ...EMPTY_FORM,
      });

      alert(
        editingService
          ? "Hizmet başarıyla güncellendi."
          : "Hizmet başarıyla oluşturuldu."
      );
    } catch (error) {
      console.error(
        "Hizmet kaydedilemedi:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Hizmet kaydedilirken hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // TOGGLE
  // =========================================================

  const toggleService = async (service) => {
    try {
      await api.put(
        `/services/${service.id}`,
        {
          name: service.name,
          description:
            service.description || null,
          price: Number(
            service.price || 0
          ),
          duration_minutes:
            service.duration_minutes || 30,
          is_active:
            !service.is_active,
        }
      );

      await fetchServices();
    } catch (error) {
      console.error(
        "Hizmet durumu değiştirilemedi:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Hizmet durumu değiştirilemedi."
      );
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const deleteService = async (
    service
  ) => {
    const confirmed =
      window.confirm(
        `"${service.name}" hizmetini silmek istediğine emin misin?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/services/${service.id}`
      );

      await fetchServices();
    } catch (error) {
      console.error(
        "Hizmet silinemedi:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Hizmet silinemedi."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="services-page">
        <div className="services-loading">
          <div className="loading-spinner"></div>

          <span>
            Hizmetler yükleniyor...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="services-page">

      {/* HEADER */}

      <div className="page-header">
        <div className="page-heading-copy">
          <div className="page-eyebrow">İŞLETME KATALOĞU <span></span> HİZMET YÖNETİMİ</div>
          <h1>Hizmetler</h1>

          <p>
            Sunduğun hizmetleri, fiyatlarını
            ve sürelerini tek bir premium panelden yönet.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            openCreateModal
          }
        >
          <span>+</span>
          Hizmet Ekle
        </button>
      </div>

      {/* STATS */}

      <div className="service-stats">

        <div className="service-stat-card">
          <div className="service-stat-icon">
            ✦
          </div>

          <div>
            <span>
              Toplam Hizmet
            </span>

            <strong>
              {services.length}
            </strong>
          </div>
        </div>

        <div className="service-stat-card">
          <div className="service-stat-icon active">
            ✓
          </div>

          <div>
            <span>
              Aktif Hizmet
            </span>

              <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="service-stat-card">
          <div className="service-stat-icon muted">
            ○
          </div>

          <div>
            <span>Pasif Hizmet</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>

        <div className="service-stat-card">
          <div className="service-stat-icon average">
            ₺
          </div>

          <div>
            <span>Ortalama Fiyat</span>
            <strong className="service-average-value">
              {formatPrice(averagePrice)}
            </strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="services-toolbar">
        <div className="services-toolbar-left">
          <div className="services-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Hizmet adı veya açıklama ara..."
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

          <div className="services-filters">
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

        <div className="services-toolbar-right">
          <label className="services-sort">
            <span>Sırala</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="name">İsim</option>
              <option value="price">Fiyat</option>
              <option value="duration">Süre</option>
              <option value="status">Durum</option>
            </select>
          </label>

          <button
            type="button"
            className="refresh-button"
            onClick={() => fetchServices(true)}
            disabled={refreshing}
            title="Hizmetleri yenile"
          >
            <span className={refreshing ? "refresh-icon spinning" : "refresh-icon"}>
              ↻
            </span>
            Yenile
          </button>

          <span className="services-count">
            {filteredServices.length} / {services.length} hizmet
          </span>
        </div>
      </div>

      {/* TABLE */}

      <div className="services-card">

        {filteredServices.length === 0 ? (
          <div className="services-empty">

            <div className="empty-icon">
              ✦
            </div>

            <h3>
              {search
                ? "Sonuç bulunamadı"
                : "Henüz hizmet yok"}
            </h3>

            <p>
              {search
                ? "Farklı bir arama terimi deneyebilirsin."
                : "İlk hizmetini ekleyerek başlayabilirsin."}
            </p>

            {!search && (
              <button
                className="primary-button"
                onClick={
                  openCreateModal
                }
              >
                <span>+</span>
                İlk Hizmeti Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="services-table-wrapper">

            <table className="services-table">

              <thead>
                <tr>
                  <th>
                    Hizmet
                  </th>

                  <th>
                    Süre
                  </th>

                  <th>
                    Fiyat
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

                {filteredServices.map(
                  (service) => (
                    <tr key={service.id} onDoubleClick={() => openEditModal(service)} title="Düzenlemek için çift tıklayabilirsin">

                      <td>
                        <div className="service-info">

                          <div className="service-avatar">
                            ✦
                          </div>

                          <div>
                            <strong>
                              {service.name}
                            </strong>

                            <span>
                              {service.description ||
                                "Açıklama eklenmemiş"}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="duration-badge">
                          ◷
                          {service.duration_minutes ||
                            30}{" "}
                          dk
                        </span>
                      </td>

                      <td>
                        <strong className="service-price">
                          {formatPrice(
                            service.price
                          )}
                        </strong>
                      </td>

                      <td>
                        <button
                          className={`service-status ${
                            service.is_active
                              ? "active"
                              : "inactive"
                          }`}
                          onClick={() =>
                            toggleService(
                              service
                            )
                          }
                        >
                          <span></span>

                          {service.is_active
                            ? "Aktif"
                            : "Pasif"}
                        </button>
                      </td>

                      <td>
                        <div className="service-actions">

                          <button
                            className="action-button edit"
                            onClick={() =>
                              openEditModal(
                                service
                              )
                            }
                            title="Düzenle"
                          >
                            ✎
                          </button>

                          <button
                            className="action-button delete"
                            onClick={() =>
                              deleteService(
                                service
                              )
                            }
                            title="Sil"
                          >
                            ×
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}
      </div>

      {/* =====================================================
          MODAL
      ====================================================== */}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={
            closeModal
          }
        >
          <div
            className="service-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="modal-header">

              <div>
                <h2>
                  {editingService
                    ? "Hizmeti Düzenle"
                    : "Yeni Hizmet"}
                </h2>

                <p>
                  Hizmet bilgilerini ve
                  süresini belirle.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="service-form">

                {/* NAME */}

                <div className="form-group full">
                  <label>
                    Hizmet Adı *
                  </label>

                  <input
                    name="name"
                    type="text"
                    placeholder="Örn. Saç + Sakal"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                {/* PRICE */}

                <div className="form-group">
                  <label>
                    Fiyat (TL) *
                  </label>

                  <div className="price-input">
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={
                        form.price
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                    <span>
                      TL
                    </span>
                  </div>
                </div>

                {/* DURATION */}

                <div className="form-group">
                  <label>
                    Süre *
                  </label>

                  <select
                    name="duration_minutes"
                    value={
                      form.duration_minutes
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    {DURATION_OPTIONS.map(
                      (duration) => (
                        <option
                          key={
                            duration
                          }
                          value={
                            duration
                          }
                        >
                          {duration} dakika
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* DESCRIPTION */}

                <div className="form-group full">
                  <label>
                    Açıklama
                  </label>

                  <textarea
                    name="description"
                    rows="3"
                    placeholder="Hizmet hakkında kısa açıklama..."
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                {/* ACTIVE */}

                <div className="form-group full">

                  <label className="active-toggle">

                    <input
                      type="checkbox"
                      name="is_active"
                      checked={
                        form.is_active
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span className="active-toggle-slider"></span>

                    <span className="active-toggle-text">
                      Hizmet aktif
                    </span>

                  </label>

                  <small>
                    Pasif hizmetler yeni
                    randevu oluştururken
                    seçilemez.
                  </small>

                </div>

              </div>

              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Kaydediliyor..."
                    : editingService
                    ? "Değişiklikleri Kaydet"
                    : "Hizmeti Ekle"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}

export default Services;