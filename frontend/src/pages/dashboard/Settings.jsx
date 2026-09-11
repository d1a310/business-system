import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Settings.css";


const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  description: "",
  logo_url: "",
  slug: "",
  online_booking_enabled: true,
};


function Settings() {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [savedBookingUrl, setSavedBookingUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");
  const [dirty, setDirty] = useState(false);


  // =========================================================
  // LOAD SETTINGS
  // =========================================================

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get("/business/settings");

        const data =
          response.data;

        const loadedForm = {
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          description:
            data.description || "",
          logo_url:
            data.logo_url || "",
          slug:
            data.slug || "",
          online_booking_enabled:
            data.online_booking_enabled ??
            true,
        };

        setForm(
          loadedForm
        );

        if (loadedForm.slug) {
          setSavedBookingUrl(
            `${window.location.origin}/book/${loadedForm.slug}`
          );
        }
      } catch (err) {
        console.error(
          "İşletme ayarları alınamadı:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "İşletme ayarları yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);


  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (
    event
  ) => {
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

    setSuccess("");
    setError("");
    setDirty(true);
  };


  // =========================================================
  // SLUG
  // =========================================================

  const handleSlugChange = (
    event
  ) => {
    let value =
      event.target.value
        .toLowerCase()
        .trim();

    value = value
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(
        /[^a-z0-9-\s]/g,
        ""
      )
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setForm((prev) => ({
      ...prev,
      slug: value,
    }));

    setSuccess("");
    setError("");
    setDirty(true);
  };


  // =========================================================
  // SAVE
  // =========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanedName =
      form.name.trim();

    const cleanedSlug =
      form.slug.trim();

    if (!cleanedName) {
      setError(
        "İşletme adı zorunludur."
      );
      return;
    }

    if (
      !cleanedSlug ||
      cleanedSlug.length < 3
    ) {
      setError(
        "Özel randevu adresi en az 3 karakter olmalıdır."
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await api.put(
          "/business/settings",
          {
            name:
              cleanedName,

            phone:
              form.phone.trim() ||
              null,

            email:
              form.email.trim() ||
              null,

            address:
              form.address.trim() ||
              null,

            description:
              form.description.trim() ||
              null,

            logo_url:
              form.logo_url.trim() ||
              null,

            slug:
              cleanedSlug,

            online_booking_enabled:
              form.online_booking_enabled,
          }
        );

      const data =
        response.data;

      const updatedForm = {
        name:
          data.name || "",

        phone:
          data.phone || "",

        email:
          data.email || "",

        address:
          data.address || "",

        description:
          data.description || "",

        logo_url:
          data.logo_url || "",

        slug:
          data.slug || "",

        online_booking_enabled:
          data.online_booking_enabled ??
          true,
      };

      setForm(
        updatedForm
      );

      const bookingUrl =
        updatedForm.slug
          ? `${window.location.origin}/book/${updatedForm.slug}`
          : "";

      setSavedBookingUrl(
        bookingUrl
      );

      setSuccess(
        "İşletme ayarları başarıyla kaydedildi."
      );
      setDirty(false);
    } catch (err) {
      console.error(
        "İşletme ayarları kaydedilemedi:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Ayarlar kaydedilirken bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };


  // =========================================================
  // OPEN BOOKING PAGE
  // =========================================================

  const openBookingPage = () => {
    if (!savedBookingUrl) {
      return;
    }

    window.open(
      savedBookingUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };


  // =========================================================
  // COPY BOOKING LINK
  // =========================================================

  const copyBookingLink = async () => {
    if (!savedBookingUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        savedBookingUrl
      );

      setSuccess(
        "Randevu bağlantısı panoya kopyalandı."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(
        "Link kopyalanamadı:",
        err
      );

      setError(
        "Bağlantı kopyalanamadı."
      );
    }
  };


  // =========================================================
  // WHATSAPP SHARE
  // =========================================================

  const shareOnWhatsApp = () => {
    if (!savedBookingUrl) {
      return;
    }

    const message =
      `Online randevu almak için bağlantıya tıklayabilirsiniz:\n\n${savedBookingUrl}`;

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="settings-page">

        <div className="settings-loading">

          <div className="settings-spinner"></div>

          <span>
            İşletme ayarları yükleniyor...
          </span>

        </div>

      </div>
    );
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="settings-page">

      {/* HEADER */}

      <div className="settings-header">

        <div>

          <span className="settings-eyebrow">
            İŞLETME YÖNETİMİ
          </span>

          <h1>
            Ayarlar
          </h1>

          <p>
            İşletmenizin bilgilerini ve
            online randevu ayarlarını
            buradan yönetin.
          </p>

        </div>

      </div>


      {/* ALERTS */}

      {error && (
        <div className="settings-alert error">
          <span>!</span>
          {error}
        </div>
      )}

      {success && (
        <div className="settings-alert success">
          <span>✓</span>
          {success}
        </div>
      )}


      <form
        className="settings-form"
        onSubmit={
          handleSubmit
        }
      >

        {/* ===================================================
            BUSINESS INFO
        ==================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              ◫
            </div>

            <div>

              <h2>
                İşletme Bilgileri
              </h2>

              <p>
                Müşterilerin göreceği
                temel işletme bilgileri.
              </p>

            </div>

          </div>


          <div className="settings-grid">

            <div className="settings-field">

              <label>
                İşletme Adı *
              </label>

              <input
                type="text"
                name="name"
                value={
                  form.name
                }
                onChange={
                  handleChange
                }
                placeholder="İşletme adınız"
              />

            </div>


            <div className="settings-field">

              <label>
                Telefon
              </label>

              <input
                type="tel"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
                placeholder="05xx xxx xx xx"
              />

            </div>


            <div className="settings-field">

              <label>
                E-posta
              </label>

              <input
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                placeholder="info@isletme.com"
              />

            </div>


            <div className="settings-field">

              <label>
                Adres
              </label>

              <input
                type="text"
                name="address"
                value={
                  form.address
                }
                onChange={
                  handleChange
                }
                placeholder="İşletme adresi"
              />

            </div>


            <div className="settings-field full">

              <label>
                Açıklama
              </label>

              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                placeholder="İşletmeniz hakkında kısa bir açıklama..."
                rows="4"
              />

            </div>


            <div className="settings-field full">

              <label>
                Logo URL
              </label>

              <input
                type="url"
                name="logo_url"
                value={
                  form.logo_url
                }
                onChange={
                  handleChange
                }
                placeholder="https://..."
              />

              <small>
                Şimdilik internet üzerindeki
                logo adresini kullanıyoruz.
                Dosya yükleme sistemini daha
                sonra ekleyeceğiz.
              </small>

            </div>

          </div>

        </section>


        {/* ===================================================
            ONLINE BOOKING
        ==================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              ↗
            </div>

            <div>

              <h2>
                Online Randevu
              </h2>

              <p>
                Müşterilerinizin online
                randevu almasını yönetin.
              </p>

            </div>

          </div>


          {/* TOGGLE */}

          <div className="booking-toggle-box">

            <div>

              <strong>
                Online randevu kabul et
              </strong>

              <span>
                Aktif olduğunda müşterileriniz
                online randevu bağlantınız
                üzerinden randevu oluşturabilir.
              </span>

            </div>


            <label className="settings-switch">

              <input
                type="checkbox"
                name="online_booking_enabled"
                checked={
                  form.online_booking_enabled
                }
                onChange={
                  handleChange
                }
              />

              <span></span>

            </label>

          </div>


          {/* LINK BOX */}

          <div className="booking-link-box">

            <div className="booking-link-heading">

              <div>

                <span>
                  RANDEVU BAĞLANTISI
                </span>

                <strong>
                  Özel bağlantı adresiniz
                </strong>

              </div>


              <div
                className={
                  form.online_booking_enabled
                    ? "link-status"
                    : "link-status disabled"
                }
              >
                {form.online_booking_enabled
                  ? "Aktif"
                  : "Kapalı"}
              </div>

            </div>


            {/* SLUG */}

            <div className="slug-input">

              <span>
                /book/
              </span>

              <input
                type="text"
                name="slug"
                value={
                  form.slug
                }
                onChange={
                  handleSlugChange
                }
                placeholder="isletme-adiniz"
              />

            </div>


            {/* URL */}

            <div className="booking-url-result">

              <div className="booking-url-content">

                <span>
                  Müşterilerinize
                  vereceğiniz randevu linki
                </span>

                {savedBookingUrl ? (

                  <a
                    href={
                      savedBookingUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="booking-url-link"
                  >
                    {savedBookingUrl}
                  </a>

                ) : (

                  <strong className="booking-url-empty">
                    Önce değişiklikleri kaydedin
                  </strong>

                )}

              </div>


              <div className="booking-url-actions">

                <button
                  type="button"
                  className="booking-open-button"
                  onClick={
                    openBookingPage
                  }
                  disabled={
                    !savedBookingUrl
                  }
                >
                  ↗ Aç
                </button>


                <button
                  type="button"
                  className="booking-copy-button"
                  onClick={
                    copyBookingLink
                  }
                  disabled={
                    !savedBookingUrl
                  }
                >
                  ⧉ Kopyala
                </button>

              </div>

            </div>


            {/* SHARE ACTIONS */}

            <div className="booking-share-section">

              <div className="booking-share-text">

                <strong>
                  Müşterilerinizle paylaşın
                </strong>

                <span>
                  Linki WhatsApp üzerinden
                  hızlıca gönderebilirsiniz.
                </span>

              </div>


              <button
                type="button"
                className="booking-whatsapp-button"
                onClick={
                  shareOnWhatsApp
                }
                disabled={
                  !savedBookingUrl
                }
              >
                <span className="whatsapp-icon">
                  W
                </span>

                WhatsApp'ta Paylaş
              </button>

            </div>

          </div>

        </section>


        {/* ===================================================
            SAVE
        ==================================================== */}

        <div className="settings-actions">

          <div>

            <span>
              Değişikliklerinizi kaydetmeyi
              unutmayın.
            </span>

          </div>


          <button
            type="submit"
            disabled={
              saving
            }
          >
            {saving
              ? "Kaydediliyor..."
              : dirty
              ? "Değişiklikleri Kaydet"
              : "Ayarlar Kaydedildi"}
          </button>

        </div>

      </form>

    </div>
  );
}


export default Settings;