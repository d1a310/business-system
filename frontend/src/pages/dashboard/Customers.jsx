import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Customers.css";

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  email: "",
  notes: "",
};

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

const SEGMENT_LABELS = {
  VIP: "VIP",
  SADIK: "Sadık",
  YENI: "Yeni",
};

const SEGMENT_CLASSES = {
  VIP: "vip",
  SADIK: "loyal",
  YENI: "new",
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
    year: "numeric",
  });
}

function formatShortDate(dateString) {
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

function formatTime(timeString) {
  if (!timeString) {
    return "—";
  }

  return String(timeString).slice(0, 5);
}

function getInitials(fullName) {
  if (!fullName) {
    return "?";
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState(null);

  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

  const [showDetailModal, setShowDetailModal] =
    useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [customerDetail, setCustomerDetail] =
    useState(null);

  const [loadingDetail, setLoadingDetail] =
    useState(false);

  // =========================================================
  // FETCH CUSTOMER ANALYTICS
  // =========================================================

  const fetchCustomers = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        "/customers/summary"
      );

      setCustomers(response.data || []);
    } catch (error) {
      console.error(
        "Müşteri analitikleri alınamadı:",
        error
      );

      // Summary endpointinde sorun varsa
      // temel müşteri listesini dene.
      try {
        const fallbackResponse =
          await api.get("/customers");

        setCustomers(
          fallbackResponse.data || []
        );
      } catch (fallbackError) {
        console.error(
          "Müşteriler de alınamadı:",
          fallbackError
        );

        alert(
          error.response?.data?.detail ||
            "Müşteriler yüklenirken bir hata oluştu."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    const interval = setInterval(() => {
      fetchCustomers(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // CUSTOMER STATS
  // =========================================================

  const customerStats = useMemo(() => {
    const total = customers.length;

    const vip = customers.filter(
      (customer) =>
        customer.customer_segment === "VIP"
    ).length;

    const loyal = customers.filter(
      (customer) =>
        customer.customer_segment === "SADIK"
    ).length;

    const totalRevenue = customers.reduce(
      (sum, customer) =>
        sum +
        Number(customer.total_spent || 0),
      0
    );

    return {
      total,
      vip,
      loyal,
      totalRevenue,
    };
  }, [customers]);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered = customers.filter((customer) => {
      const matchesSearch =
        !keyword ||
        customer.full_name?.toLowerCase().includes(keyword) ||
        customer.phone?.toLowerCase().includes(keyword) ||
        customer.email?.toLowerCase().includes(keyword) ||
        customer.customer_segment?.toLowerCase().includes(keyword) ||
        customer.favorite_service?.toLowerCase().includes(keyword);

      const matchesSegment =
        segmentFilter === "ALL" ||
        customer.customer_segment === segmentFilter;

      return matchesSearch && matchesSegment;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "spending") {
        return (
          Number(b.total_spent || 0) -
          Number(a.total_spent || 0)
        );
      }

      if (sortBy === "visits") {
        return (
          Number(b.completed_appointments || 0) -
          Number(a.completed_appointments || 0)
        );
      }

      if (sortBy === "name") {
        return String(a.full_name || "").localeCompare(
          String(b.full_name || ""),
          "tr"
        );
      }

      return String(b.last_appointment_date || "").localeCompare(
        String(a.last_appointment_date || "")
      );
    });
  }, [customers, search, segmentFilter, sortBy]);

  // =========================================================
  // CREATE MODAL
  // =========================================================

  const openCreateModal = () => {
    setEditingCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });

    setShowFormModal(true);
  };

  // =========================================================
  // EDIT MODAL
  // =========================================================

  const openEditModal = (customer) => {
    setEditingCustomer(customer);

    setForm({
      full_name: customer.full_name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      notes: customer.notes || "",
    });

    setShowFormModal(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeFormModal = () => {
    if (saving) {
      return;
    }

    setShowFormModal(false);
    setEditingCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleFormChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.full_name.trim()) {
      alert(
        "Müşteri adı zorunludur."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        full_name:
          form.full_name.trim(),

        phone:
          form.phone.trim() || null,

        email:
          form.email.trim() || null,

        notes:
          form.notes.trim() || null,
      };

      if (editingCustomer) {
        await api.put(
          `/customers/${editingCustomer.id}`,
          payload
        );
      } else {
        await api.post(
          "/customers",
          payload
        );
      }

      await fetchCustomers();

      setShowFormModal(false);
      setEditingCustomer(null);

      setForm({
        ...EMPTY_FORM,
      });

      alert(
        editingCustomer
          ? "Müşteri başarıyla güncellendi."
          : "Müşteri başarıyla oluşturuldu."
      );
    } catch (error) {
      console.error(
        "Müşteri kaydedilemedi:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Müşteri kaydedilirken bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (
    customer
  ) => {
    const confirmed =
      window.confirm(
        `"${customer.full_name}" adlı müşteriyi silmek istediğine emin misin?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/customers/${customer.id}`
      );

      await fetchCustomers();

      if (
        selectedCustomer?.id ===
        customer.id
      ) {
        setShowDetailModal(false);
        setSelectedCustomer(null);
        setCustomerDetail(null);
      }
    } catch (error) {
      console.error(
        "Müşteri silinemedi:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Müşteri silinirken bir hata oluştu."
      );
    }
  };

  // =========================================================
  // DETAIL
  // =========================================================

  const openDetailModal = async (
    customer
  ) => {
    setSelectedCustomer(customer);
    setCustomerDetail(null);
    setShowDetailModal(true);
    setLoadingDetail(true);

    try {
      const response = await api.get(
        `/customers/${customer.id}/detail`
      );

      setCustomerDetail(
        response.data
      );
    } catch (error) {
      console.error(
        "Müşteri detayı alınamadı:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Müşteri detayları alınamadı."
      );

      setShowDetailModal(false);
      setSelectedCustomer(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // =========================================================
  // CLOSE DETAIL
  // =========================================================

  const closeDetailModal = () => {
    if (loadingDetail) {
      return;
    }

    setShowDetailModal(false);
    setSelectedCustomer(null);
    setCustomerDetail(null);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="customers-page">
        <div className="customers-loading">
          <div className="loading-spinner"></div>

          <span>
            Müşteri verileri yükleniyor...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="customers-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">

        <div>
          <div className="customer-eyebrow">
            Müşteri Yönetimi
          </div>

          <h1>
            Müşteriler
          </h1>

          <p>
            Müşteri ilişkilerini, ziyaret geçmişini ve
            işletmene kattıkları değeri tek merkezden yönet.
          </p>
        </div>

        <div className="customers-header-actions">
          <button
            className="refresh-customers-button"
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
            title="Müşteri listesini yenile"
          >
            <span className={refreshing ? "refresh-symbol spinning" : "refresh-symbol"}>
              ↻
            </span>
            Yenile
          </button>

          <button
            className="primary-button"
            onClick={openCreateModal}
          >
            <span>+</span>
            Müşteri Ekle
          </button>
        </div>

      </div>

      {/* =====================================================
          ANALYTICS STATS
      ====================================================== */}

      <div className="customer-stats">

        <div className="customer-stat-card">

          <div className="customer-stat-icon">
            👥
          </div>

          <div>
            <span>
              Toplam Müşteri
            </span>

            <strong>
              {customerStats.total}
            </strong>
          </div>

        </div>

        <div className="customer-stat-card">

          <div className="customer-stat-icon vip">
            ★
          </div>

          <div>
            <span>
              VIP Müşteri
            </span>

            <strong>
              {customerStats.vip}
            </strong>
          </div>

        </div>

        <div className="customer-stat-card">

          <div className="customer-stat-icon loyal">
            ♡
          </div>

          <div>
            <span>
              Sadık Müşteri
            </span>

            <strong>
              {customerStats.loyal}
            </strong>
          </div>

        </div>

        <div className="customer-stat-card">

          <div className="customer-stat-icon revenue">
            ₺
          </div>

          <div>
            <span>
              Toplam Müşteri Geliri
            </span>

            <strong className="customer-revenue-value">
              {formatPrice(
                customerStats.totalRevenue
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          TOOLBAR
      ====================================================== */}

      <div className="customers-toolbar">

        <div className="customers-toolbar-left">
          <div className="customers-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Müşteri, telefon, e-posta veya hizmet ara..."
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

          <select
            className="customer-filter-select"
            value={segmentFilter}
            onChange={(event) =>
              setSegmentFilter(event.target.value)
            }
          >
            <option value="ALL">Tüm Segmentler</option>
            <option value="VIP">VIP</option>
            <option value="SADIK">Sadık</option>
            <option value="YENI">Yeni</option>
          </select>

          <select
            className="customer-filter-select sort-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="recent">Son ziyarete göre</option>
            <option value="spending">Harcamaya göre</option>
            <option value="visits">Ziyarete göre</option>
            <option value="name">İsme göre</option>
          </select>
        </div>

        <div className="customers-count-wrap">
          <span className="customers-count">
            {filteredCustomers.length} / {customers.length} müşteri
          </span>
          {search || segmentFilter !== "ALL" ? (
            <button
              type="button"
              className="reset-filters-button"
              onClick={() => {
                setSearch("");
                setSegmentFilter("ALL");
                setSortBy("recent");
              }}
            >
              Filtreleri temizle
            </button>
          ) : null}
        </div>

      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="customers-card">

        {filteredCustomers.length === 0 ? (

          <div className="customers-empty">

            <div className="empty-icon">
              👤
            </div>

            <h3>
              {search
                ? "Sonuç bulunamadı"
                : "Henüz müşteri yok"}
            </h3>

            <p>
              {search
                ? "Farklı bir arama terimi deneyebilirsin."
                : "İlk müşterini ekleyerek başlayabilirsin."}
            </p>

            {!search && (
              <button
                className="primary-button"
                onClick={
                  openCreateModal
                }
              >
                <span>+</span>
                İlk Müşteriyi Ekle
              </button>
            )}

          </div>

        ) : (

          <div className="customers-table-wrapper">

            <table className="customers-table">

              <thead>

                <tr>

                  <th>
                    Müşteri
                  </th>

                  <th>
                    Segment
                  </th>

                  <th>
                    Ziyaret
                  </th>

                  <th>
                    Harcama
                  </th>

                  <th>
                    Son Ziyaret
                  </th>

                  <th>
                    Favori Hizmet
                  </th>

                  <th className="actions-column">
                    İşlemler
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredCustomers.map(
                  (customer) => {

                    const segment =
                      customer.customer_segment ||
                      "YENI";

                    return (
                      <tr
                        key={customer.id}
                        className="customer-row"
                        onDoubleClick={() => openDetailModal(customer)}
                      >

                        {/* CUSTOMER */}

                        <td>

                          <div className="customer-info">

                            <div className="customer-avatar">
                              {getInitials(
                                customer.full_name
                              )}
                            </div>

                            <div>

                              <strong>
                                {
                                  customer.full_name
                                }
                              </strong>

                              <span>
                                {customer.phone ||
                                  "Telefon yok"}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* SEGMENT */}

                        <td>

                          <span
                            className={`customer-segment ${
                              SEGMENT_CLASSES[
                                segment
                              ] || "new"
                            }`}
                          >

                            <span>
                              {segment ===
                              "VIP"
                                ? "★"
                                : segment ===
                                  "SADIK"
                                ? "♥"
                                : "•"}
                            </span>

                            {
                              SEGMENT_LABELS[
                                segment
                              ] ||
                                "Yeni"
                            }

                          </span>

                        </td>

                        {/* VISITS */}

                        <td>

                          <div className="customer-visit-cell">

                            <strong>
                              {
                                customer.completed_appointments ||
                                0
                              }
                            </strong>

                            <span>
                              tamamlanan
                            </span>

                          </div>

                        </td>

                        {/* SPENDING */}

                        <td>

                          <div className="customer-spending">

                            <strong>
                              {formatPrice(
                                customer.total_spent
                              )}
                            </strong>

                            <span>
                              Ort.{" "}
                              {formatPrice(
                                customer.average_spent
                              )}
                            </span>

                          </div>

                        </td>

                        {/* LAST VISIT */}

                        <td>

                          <span className="last-visit">
                            {formatShortDate(
                              customer.last_appointment_date
                            )}
                          </span>

                        </td>

                        {/* FAVORITE SERVICE */}

                        <td>

                          {customer.favorite_service ? (

                            <div className="favorite-service">

                              <strong>
                                {
                                  customer.favorite_service
                                }
                              </strong>

                              <span>
                                {
                                  customer.favorite_service_count
                                }{" "}
                                kez
                              </span>

                            </div>

                          ) : (

                            <span className="not-available">
                              Henüz yok
                            </span>

                          )}

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="customer-actions">

                            <button
                              className="detail-button"
                              onClick={() =>
                                openDetailModal(
                                  customer
                                )
                              }
                            >
                              Detay
                            </button>

                            <button
                              type="button"
                              className="action-button edit"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditModal(customer);
                              }}
                              title="Düzenle"
                            >
                              ✎
                            </button>

                            <button
                              type="button"
                              className="action-button delete"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(customer);
                              }}
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
          CREATE / EDIT MODAL
      ====================================================== */}

      {showFormModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeFormModal
          }
        >

          <div
            className="customer-form-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {editingCustomer
                    ? "Müşteriyi Düzenle"
                    : "Yeni Müşteri"}
                </h2>

                <p>
                  Müşteri bilgilerini
                  aşağıdan düzenleyebilirsin.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={
                  closeFormModal
                }
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="customer-form">

                <div className="form-group full">

                  <label>
                    Ad Soyad *
                  </label>

                  <input
                    type="text"
                    name="full_name"
                    placeholder="Örn. Ahmet Yılmaz"
                    value={
                      form.full_name
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Telefon
                  </label>

                  <input
                    type="text"
                    name="phone"
                    placeholder="05xx xxx xx xx"
                    value={
                      form.phone
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    E-posta
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="ornek@mail.com"
                    value={
                      form.email
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>

                <div className="form-group full">

                  <label>
                    Not
                  </label>

                  <textarea
                    name="notes"
                    rows="4"
                    placeholder="Müşteri hakkında not..."
                    value={
                      form.notes
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeFormModal
                  }
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
                    : editingCustomer
                    ? "Değişiklikleri Kaydet"
                    : "Müşteriyi Ekle"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          CUSTOMER DETAIL MODAL
      ====================================================== */}

      {showDetailModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeDetailModal
          }
        >

          <div
            className="customer-detail-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="detail-modal-header">

              <div className="detail-profile">

                <div className="detail-avatar">

                  {getInitials(
                    customerDetail?.full_name ||
                      selectedCustomer?.full_name
                  )}

                </div>

                <div>

                  <div className="detail-name-line">

                    <h2>
                      {customerDetail?.full_name ||
                        selectedCustomer?.full_name ||
                        "Müşteri"}
                    </h2>

                    {customerDetail?.customer_segment && (
                      <span
                        className={`customer-segment detail-segment ${
                          SEGMENT_CLASSES[
                            customerDetail.customer_segment
                          ] || "new"
                        }`}
                      >
                        {
                          SEGMENT_LABELS[
                            customerDetail
                              .customer_segment
                          ] || "Yeni"
                        }
                      </span>
                    )}

                  </div>

                  <span>
                    Müşteri #
                    {customerDetail?.id ||
                      selectedCustomer?.id}
                  </span>

                </div>

              </div>

              <button
                className="modal-close"
                onClick={
                  closeDetailModal
                }
                disabled={
                  loadingDetail
                }
              >
                ×
              </button>

            </div>

            {loadingDetail ? (

              <div className="customer-detail-loading">

                <div className="loading-spinner"></div>

                <span>
                  Müşteri geçmişi
                  yükleniyor...
                </span>

              </div>

            ) : customerDetail ? (

              <>

                {/* CONTACT */}

                <div className="detail-contact">

                  <div>

                    <span>
                      Telefon
                    </span>

                    <strong>
                      {customerDetail.phone ||
                        "Belirtilmemiş"}
                    </strong>

                  </div>

                  <div>

                    <span>
                      E-posta
                    </span>

                    <strong>
                      {customerDetail.email ||
                        "Belirtilmemiş"}
                    </strong>

                  </div>

                </div>

                {/* STATS */}

                <div className="detail-stats">

                  <div className="detail-stat">

                    <span>
                      Toplam Randevu
                    </span>

                    <strong>
                      {
                        customerDetail.total_appointments
                      }
                    </strong>

                  </div>

                  <div className="detail-stat">

                    <span>
                      Tamamlanan
                    </span>

                    <strong>
                      {
                        customerDetail.completed_appointments
                      }
                    </strong>

                  </div>

                  <div className="detail-stat">

                    <span>
                      Ortalama Harcama
                    </span>

                    <strong>
                      {formatPrice(
                        customerDetail.average_spent
                      )}
                    </strong>

                  </div>

                  <div className="detail-stat highlight">

                    <span>
                      Toplam Harcama
                    </span>

                    <strong>
                      {formatPrice(
                        customerDetail.total_spent
                      )}
                    </strong>

                  </div>

                </div>

                {/* FAVORITE / LAST */}

                <div className="detail-insights">

                  <div className="detail-insight-card">

                    <div className="insight-icon">
                      ✦
                    </div>

                    <div>

                      <span>
                        En Çok Tercih
                      </span>

                      <strong>
                        {customerDetail.favorite_service ||
                          "Henüz yok"}
                      </strong>

                      {customerDetail.favorite_service_count >
                        0 && (
                        <small>
                          {
                            customerDetail.favorite_service_count
                          }{" "}
                          kez
                        </small>
                      )}

                    </div>

                  </div>

                  <div className="detail-insight-card">

                    <div className="insight-icon">
                      ◷
                    </div>

                    <div>

                      <span>
                        Son Ziyaret
                      </span>

                      <strong>
                        {customerDetail.last_appointment_date
                          ? formatDate(
                              customerDetail.last_appointment_date
                            )
                          : "Henüz yok"}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* LAST NOTES */}

                {customerDetail.notes && (

                  <div className="customer-detail-note">

                    <span>
                      Müşteri Notu
                    </span>

                    <p>
                      {customerDetail.notes}
                    </p>

                  </div>

                )}

                {/* HISTORY */}

                <div className="history-section">

                  <div className="history-header">

                    <div>

                      <h3>
                        Randevu Geçmişi
                      </h3>

                      <span>
                        {
                          customerDetail
                            .appointment_history
                            ?.length || 0
                        }{" "}
                        kayıt
                      </span>

                    </div>

                  </div>

                  {customerDetail
                    .appointment_history
                    ?.length ? (

                    <div className="history-list">

                      {customerDetail
                        .appointment_history
                        .map(
                          (appointment) => {

                            const status =
                              String(
                                appointment.status ||
                                  ""
                              ).toUpperCase();

                            return (
                              <div
                                className="history-item"
                                key={
                                  appointment.id
                                }
                              >

                                <div className="history-date">

                                  <strong>
                                    {formatDate(
                                      appointment.appointment_date
                                    )}
                                  </strong>

                                  <span>
                                    {formatTime(
                                      appointment.appointment_time
                                    )}
                                  </span>

                                </div>

                                <div className="history-service">

                                  <strong>
                                    {
                                      appointment.service_name
                                    }
                                  </strong>

                                  <span>
                                    {
                                      appointment.duration_minutes
                                    }{" "}
                                    dk
                                  </span>

                                </div>

                                <div className="history-price">

                                  {formatPrice(
                                    appointment.price
                                  )}

                                </div>

                                <div
                                  className={`history-status ${
                                    STATUS_CLASSES[
                                      status
                                    ] || ""
                                  }`}
                                >

                                  <span></span>

                                  {
                                    STATUS_LABELS[
                                      status
                                    ] ||
                                      appointment.status
                                  }

                                </div>

                              </div>
                            );
                          }
                        )}

                    </div>

                  ) : (

                    <div className="history-empty">

                      <div>
                        📅
                      </div>

                      <strong>
                        Henüz randevu yok
                      </strong>

                      <span>
                        Bu müşterinin randevu
                        geçmişi burada
                        görünecek.
                      </span>

                    </div>

                  )}

                </div>

                {/* FOOTER */}

                <div className="modal-footer">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeDetailModal
                    }
                  >
                    Kapat
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      const customerToEdit =
                        customerDetail;

                      closeDetailModal();

                      openEditModal(
                        customerToEdit
                      );
                    }}
                  >
                    Müşteriyi Düzenle
                  </button>

                </div>

              </>

            ) : null}

          </div>

        </div>

      )}

    </div>
  );
}

export default Customers;