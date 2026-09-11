import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      <header className="home-navbar">
        <div className="home-container home-navbar-inner">
          <Link to="/" className="home-brand" aria-label="Business System ana sayfa">
            <span className="home-brand-mark">B</span>
            <span className="home-brand-copy">
              <strong>Business</strong>
              <small>System</small>
            </span>
          </Link>

          <nav className="home-nav-links">
            <a href="#features">Özellikler</a>
            <a href="#how-it-works">Nasıl Çalışır?</a>
            <a href="#demo">Demo</a>
          </nav>

          <div className="home-nav-actions">
            <Link to="/login" className="home-login-link">
              Giriş Yap
            </Link>
            <a href="/book/ahmetkata" className="home-nav-cta">
              Demo Talep Et <span>↗</span>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-container home-hero-grid">
            <div className="home-hero-copy">
              <div className="home-eyebrow">
                <span className="home-eyebrow-dot" />
                İŞLETMELER İÇİN YENİ NESİL YÖNETİM PLATFORMU
              </div>

              <h1>
                İşletmenizi
                <span> daha akıllı yönetin.</span>
              </h1>

              <p className="home-hero-description">
                Randevularınızı, müşterilerinizi, çalışanlarınızı ve günlük
                operasyonunuzu tek bir profesyonel platformdan yönetin.
              </p>

              <div className="home-hero-actions">
                <a href="/book/ahmetkata" className="home-primary-button">
                  Ücretsiz Demo
                  <span>→</span>
                </a>

                <a href="#features" className="home-secondary-button">
                  Sistemi İncele
                  <span>↓</span>
                </a>
              </div>

              <div className="home-hero-meta">
                <span className="home-meta-item">
                  <b>✓</b> Kurulum ve teknik destek
                </span>
                <span className="home-meta-divider" />
                <span className="home-meta-item">Bulut tabanlı</span>
              </div>
            </div>

            <div className="home-dashboard-stage" aria-hidden="true">
              <div className="home-stage-glow home-stage-glow-one" />
              <div className="home-stage-glow home-stage-glow-two" />

              <div className="home-browser">
                <div className="home-browser-topbar">
                  <div className="home-browser-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="home-browser-title">Business System / Dashboard</div>
                  <div className="home-browser-status">
                    <span />
                    Sistem aktif
                  </div>
                </div>

                <div className="home-dashboard-preview">
                  <aside className="home-mini-sidebar">
                    <div className="home-mini-logo">B</div>
                    <div className="home-mini-nav active">⌂</div>
                    <div className="home-mini-nav">◷</div>
                    <div className="home-mini-nav">♙</div>
                    <div className="home-mini-nav">□</div>
                    <div className="home-mini-nav">⚙</div>
                  </aside>

                  <div className="home-mini-content">
                    <div className="home-mini-top">
                      <div>
                        <span>BUGÜN</span>
                        <h3>Hoş geldiniz, İsa 👋</h3>
                      </div>
                      <div className="home-mini-avatar">İA</div>
                    </div>

                    <div className="home-mini-stats">
                      <div className="home-mini-stat">
                        <span>BUGÜNKÜ RANDEVULAR</span>
                        <strong>18</strong>
                        <small>↑ %12 bu hafta</small>
                      </div>
                      <div className="home-mini-stat">
                        <span>BUGÜNKÜ GELİR</span>
                        <strong>7.850₺</strong>
                        <small>↑ %8 bu hafta</small>
                      </div>
                      <div className="home-mini-stat">
                        <span>AKTİF MÜŞTERİLER</span>
                        <strong>246</strong>
                        <small>+18 bu ay</small>
                      </div>
                    </div>

                    <div className="home-mini-grid">
                      <div className="home-mini-card home-mini-chart">
                        <div className="home-mini-card-head">
                          <div>
                            <span>HAFTALIK PERFORMANS</span>
                            <strong>Randevular</strong>
                          </div>
                          <small>Son 7 gün</small>
                        </div>

                        <div className="home-chart-area">
                          <div className="home-chart-gridline one" />
                          <div className="home-chart-gridline two" />
                          <div className="home-chart-gridline three" />
                          <svg viewBox="0 0 520 170" preserveAspectRatio="none">
                            <path
                              d="M0 138 C45 120 63 126 105 102 C145 79 178 110 215 91 C256 70 279 83 321 57 C365 30 390 71 431 45 C466 24 490 32 520 10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                            <path
                              d="M0 138 C45 120 63 126 105 102 C145 79 178 110 215 91 C256 70 279 83 321 57 C365 30 390 71 431 45 C466 24 490 32 520 10 L520 170 L0 170 Z"
                              fill="currentColor"
                              opacity="0.07"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="home-mini-card home-mini-appointments">
                        <div className="home-mini-card-head">
                          <div>
                            <span>BUGÜNKÜ PROGRAM</span>
                            <strong>Yaklaşan randevular</strong>
                          </div>
                          <small>3 kayıt</small>
                        </div>

                        <div className="home-mini-appointment">
                          <span className="home-mini-time">14:30</span>
                          <div>
                            <strong>Ahmet Yılmaz</strong>
                            <small>Saç + Sakal</small>
                          </div>
                          <span className="home-mini-status">Onaylı</span>
                        </div>

                        <div className="home-mini-appointment">
                          <span className="home-mini-time">15:00</span>
                          <div>
                            <strong>Mehmet Kaya</strong>
                            <small>Saç Kesimi</small>
                          </div>
                          <span className="home-mini-status muted">Bekliyor</span>
                        </div>

                        <div className="home-mini-appointment">
                          <span className="home-mini-time">15:30</span>
                          <div>
                            <strong>Can Demir</strong>
                            <small>Sakal Tıraşı</small>
                          </div>
                          <span className="home-mini-status">Onaylı</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="home-floating-card home-floating-card-one">
                <span className="home-floating-icon">✓</span>
                <div>
                  <small>YENİ RANDEVU</small>
                  <strong>Onaylandı</strong>
                </div>
              </div>

              <div className="home-floating-card home-floating-card-two">
                <span className="home-floating-icon dark">↗</span>
                <div>
                  <small>BU AY</small>
                  <strong>+24,8% büyüme</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-trust">
          <div className="home-container">
            <p>İŞLETMENİZİN TÜM OPERASYONU TEK YERDE</p>
            <div className="home-trust-grid">
              <span>Randevu Yönetimi</span>
              <span>Müşteri Takibi</span>
              <span>Personel Yönetimi</span>
              <span>Performans Analizi</span>
              <span>Online Rezervasyon</span>
            </div>
          </div>
        </section>

        <section className="home-section home-features" id="features">
          <div className="home-container">
            <div className="home-section-heading">
              <div className="home-eyebrow">
                <span className="home-eyebrow-dot" />
                GÜÇLÜ ARAÇLAR
              </div>
              <h2>
                Günlük işlerinizi
                <span> daha kolay hale getirin.</span>
              </h2>
              <p>
                Tekrarlayan operasyonları azaltın, müşterilerinizi daha iyi
                yönetin ve işletmenizin performansını tek ekrandan takip edin.
              </p>
            </div>

            <div className="home-feature-grid">
              <article className="home-feature-card home-feature-main">
                <div className="home-feature-top">
                  <div className="home-feature-icon">◷</div>
                  <span className="home-feature-number">01</span>
                </div>
                <h3>Akıllı Randevu Yönetimi</h3>
                <p>
                  Müşterileriniz online randevu oluştursun, siz tüm programınızı
                  tek panelden yönetin. Çakışmaları azaltın ve gününüzü planlayın.
                </p>

                <div className="home-calendar">
                  <div className="home-calendar-head">
                    <strong>Eylül 2026</strong>
                    <span>‹ &nbsp; ›</span>
                  </div>
                  <div className="home-calendar-week">
                    <span>Pzt</span>
                    <span>Sal</span>
                    <span>Çar</span>
                    <span>Per</span>
                    <span>Cum</span>
                  </div>
                  <div className="home-calendar-days">
                    <span>7</span>
                    <span>8</span>
                    <span className="selected">9</span>
                    <span>10</span>
                    <span>11</span>
                  </div>
                  <div className="home-calendar-slots">
                    <span>14:30</span>
                    <span className="busy">15:00</span>
                    <span>15:30</span>
                    <span className="busy">16:00</span>
                  </div>
                </div>
              </article>

              <article className="home-feature-card home-feature-customer">
                <div className="home-feature-top">
                  <div className="home-feature-icon">♙</div>
                  <span className="home-feature-number">02</span>
                </div>
                <h3>Müşteri Yönetimi</h3>
                <p>
                  Müşterilerinizi, geçmiş randevularını ve iletişim bilgilerini
                  tek, düzenli bir kayıt üzerinden takip edin.
                </p>
                <div className="home-customer-preview">
                  <div className="home-customer-avatar">AY</div>
                  <div>
                    <strong>Ahmet Yılmaz</strong>
                    <small>Son ziyaret · 3 gün önce</small>
                  </div>
                  <span>→</span>
                </div>
              </article>

              <article className="home-feature-card home-feature-analytics">
                <div className="home-feature-top">
                  <div className="home-feature-icon">↗</div>
                  <span className="home-feature-number">03</span>
                </div>
                <h3>Performans Analizi</h3>
                <p>
                  Gelir, randevu ve çalışan performansınızı anlaşılır verilerle
                  takip edin.
                </p>
                <div className="home-bars" aria-hidden="true">
                  <span style={{ height: "28%" }} />
                  <span style={{ height: "48%" }} />
                  <span style={{ height: "40%" }} />
                  <span style={{ height: "64%" }} />
                  <span style={{ height: "54%" }} />
                  <span style={{ height: "82%" }} />
                  <span style={{ height: "72%" }} />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="home-process" id="how-it-works">
          <div className="home-container">
            <div className="home-section-heading centered">
              <div className="home-eyebrow">
                <span className="home-eyebrow-dot" />
                NASIL ÇALIŞIR?
              </div>
              <h2>
                Üç adımda
                <span> dijital işletme.</span>
              </h2>
              <p>
                Sisteminizi kurun, operasyonunuzu yönetin ve işletmenizi
                verilerle büyütün.
              </p>
            </div>

            <div className="home-steps">
              <article className="home-step">
                <span className="home-step-index">01</span>
                <div className="home-step-line" />
                <h3>Sisteminizi Kurun</h3>
                <p>
                  İşletmenize uygun hizmet, çalışan, çalışma saatleri ve online
                  randevu yapısını dakikalar içinde hazırlayın.
                </p>
              </article>

              <article className="home-step">
                <span className="home-step-index">02</span>
                <div className="home-step-line" />
                <h3>Müşterilerinizi Yönetin</h3>
                <p>
                  Randevu, müşteri ve personel süreçlerini tek panel üzerinden
                  merkezi şekilde kontrol edin.
                </p>
              </article>

              <article className="home-step">
                <span className="home-step-index">03</span>
                <div className="home-step-line" />
                <h3>İşletmenizi Büyütün</h3>
                <p>
                  İşletmenizin performansını ölçün, güçlü ve geliştirilmesi
                  gereken alanları veriler üzerinden görün.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="home-cta" id="demo">
          <div className="home-container">
            <div className="home-cta-box">
              <div className="home-cta-content">
                <div className="home-eyebrow">
                  <span className="home-eyebrow-dot" />
                  İLK ADIMI ATIN
                </div>
                <h2>
                  İşletmenizi
                  <span> birlikte dijitalleştirelim.</span>
                </h2>
                <p>
                  Size uygun yönetim yapısını birlikte oluşturalım ve günlük
                  operasyonunuzu daha düzenli hale getirelim.
                </p>
              </div>

              <a className="home-cta-button" href="/book/ahmetkata">
                Demo Talep Et
                <span>↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer" id="contact">
        <div className="home-container home-footer-inner">
          <Link to="/" className="home-brand">
            <span className="home-brand-mark">B</span>
            <span className="home-brand-copy">
              <strong>Business</strong>
              <small>System</small>
            </span>
          </Link>

          <div className="home-footer-links">
            <a href="#features">Özellikler</a>
            <a href="#how-it-works">Nasıl Çalışır?</a>
            <Link to="/login">Giriş</Link>
          </div>

          <p>© 2026 Business System. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
