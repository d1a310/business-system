import { Link } from "react-router-dom";
import "./Home.css";

const stats = [
  ["01", "Randevu yönetimi", "Online ve panelden tek akış"],
  ["02", "Müşteri yönetimi", "Geçmiş ve ilişkiler tek yerde"],
  ["03", "Personel yönetimi", "Çalışan, saat ve performans"],
  ["04", "Performans analizi", "İşletmenizi verilerle büyütün"],
];

function Home() {
  return (
    <div className="landing">
      <div className="landing-noise" />

      <header className="landing-header">
        <div className="landing-container nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">B</span>
            <span className="brand-text">
              <strong>Business</strong>
              <small>System</small>
            </span>
          </Link>

          <nav className="nav-center">
            <a href="#platform">Platform</a>
            <a href="#features">Özellikler</a>
            <a href="#process">Nasıl Çalışır?</a>
            <a href="#demo">Demo</a>
          </nav>

          <div className="nav-actions">
            <Link to="/login" className="nav-login">
              Giriş Yap
            </Link>
            <a href="#demo" className="nav-cta">
              Demo Talep Et <span>↗</span>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-orb orb-one" />
          <div className="hero-orb orb-two" />
          <div className="hero-grid-lines" />

          <div className="landing-container hero-layout">
            <div className="hero-copy">
              <div className="hero-badge">
                <span className="status-dot" />
                İşletmeler için yeni nesil yönetim platformu
              </div>

              <h1>
                İşletmenizi
                <span>tek ekrandan</span>
                yönetin.
              </h1>

              <p className="hero-text">
                Randevularınızı, müşterilerinizi, çalışanlarınızı ve günlük
                operasyonunuzu modern bir panelde birleştirin. Daha az karmaşa,
                daha fazla kontrol.
              </p>

              <div className="hero-actions">
                <a href="#demo" className="btn-primary">
                  Ücretsiz Demo
                  <span>→</span>
                </a>
                <a href="#platform" className="btn-secondary">
                  Platformu Keşfet
                </a>
              </div>

              <div className="hero-proof">
                <div className="avatars">
                  <span>AY</span>
                  <span>MK</span>
                  <span>CD</span>
                  <span>+</span>
                </div>
                <div>
                  <strong>Günlük operasyonunuzu tek akışta toplayın.</strong>
                  <small>Kurulum ve teknik destek dahil.</small>
                </div>
              </div>
            </div>

            <div className="hero-product-wrap" id="platform">
              <div className="hero-product-glow" />
              <div className="product-window">
                <div className="product-bar">
                  <div className="product-dots">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="product-address">business-system / dashboard</div>
                  <div className="product-live">
                    <span />
                    Canlı
                  </div>
                </div>

                <div className="product-body">
                  <aside className="product-sidebar">
                    <div className="product-logo">B</div>
                    {["⌂", "◷", "♙", "▣", "↗", "⚙"].map((item, index) => (
                      <span
                        key={item}
                        className={`product-nav-item ${index === 0 ? "active" : ""}`}
                      >
                        {item}
                      </span>
                    ))}
                  </aside>

                  <div className="product-main">
                    <div className="product-top">
                      <div>
                        <small>BUGÜN · 11 EYLÜL</small>
                        <h3>Günaydın, İsa 👋</h3>
                      </div>
                      <div className="product-user">İA</div>
                    </div>

                    <div className="metric-grid">
                      <div className="metric-card">
                        <span>BUGÜNKÜ RANDEVULAR</span>
                        <strong>18</strong>
                        <small className="up">↗ %12 bu hafta</small>
                      </div>
                      <div className="metric-card">
                        <span>BUGÜNKÜ GELİR</span>
                        <strong>7.850₺</strong>
                        <small className="up">↗ %8 bu hafta</small>
                      </div>
                      <div className="metric-card">
                        <span>AKTİF MÜŞTERİ</span>
                        <strong>246</strong>
                        <small>+18 bu ay</small>
                      </div>
                    </div>

                    <div className="dashboard-row">
                      <div className="panel analytics-panel">
                        <div className="panel-head">
                          <div>
                            <span>HAFTALIK PERFORMANS</span>
                            <strong>Randevu yoğunluğu</strong>
                          </div>
                          <button type="button">Son 7 gün</button>
                        </div>

                        <div className="chart">
                          <div className="chart-gridline line-a" />
                          <div className="chart-gridline line-b" />
                          <div className="chart-gridline line-c" />
                          <svg viewBox="0 0 500 200" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#8b6cff" stopOpacity=".34" />
                                <stop offset="100%" stopColor="#8b6cff" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M0 164 C40 145, 53 149, 95 126 C140 100, 162 137, 200 117 C242 96, 265 105, 308 69 C346 37, 380 81, 416 53 C452 24, 476 37, 500 16 L500 200 L0 200 Z"
                              fill="url(#chartFill)"
                            />
                            <path
                              d="M0 164 C40 145, 53 149, 95 126 C140 100, 162 137, 200 117 C242 96, 265 105, 308 69 C346 37, 380 81, 416 53 C452 24, 476 37, 500 16"
                              fill="none"
                              stroke="#8b6cff"
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>

                        <div className="chart-labels">
                          <span>Pzt</span>
                          <span>Sal</span>
                          <span>Çar</span>
                          <span>Per</span>
                          <span>Cum</span>
                          <span>Cmt</span>
                          <span>Paz</span>
                        </div>
                      </div>

                      <div className="panel schedule-panel">
                        <div className="panel-head">
                          <div>
                            <span>BUGÜNÜN PROGRAMI</span>
                            <strong>Yaklaşan randevular</strong>
                          </div>
                          <button type="button">3</button>
                        </div>

                        {[
                          ["14:30", "Ahmet Yılmaz", "Saç + Sakal", "Onaylı"],
                          ["15:00", "Mehmet Kaya", "Saç Kesimi", "Bekliyor"],
                          ["15:30", "Can Demir", "Sakal Tıraşı", "Onaylı"],
                        ].map(([time, name, service, status]) => (
                          <div className="schedule-item" key={time}>
                            <time>{time}</time>
                            <div>
                              <strong>{name}</strong>
                              <small>{service}</small>
                            </div>
                            <span className={status === "Bekliyor" ? "waiting" : ""}>
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mini-footer-strip">
                      <div>
                        <span>ONLINE RANDEVU</span>
                        <strong>Aktif</strong>
                      </div>
                      <div>
                        <span>PERSONEL</span>
                        <strong>8 kişi</strong>
                      </div>
                      <div>
                        <span>MEMNUNİYET</span>
                        <strong>%96</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="floating-note note-left">
                <span className="floating-icon purple">✓</span>
                <div>
                  <small>YENİ RANDEVU</small>
                  <strong>Onaylandı</strong>
                </div>
              </div>

              <div className="floating-note note-right">
                <span className="floating-icon dark">↗</span>
                <div>
                  <small>BU AY</small>
                  <strong>+24,8% büyüme</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="brand-strip">
          <div className="landing-container">
            <span className="brand-strip-title">TEK PLATFORMDA</span>
            <div className="brand-strip-items">
              <span>RANDEVU</span>
              <span>MÜŞTERİ</span>
              <span>PERSONEL</span>
              <span>ANALİZ</span>
              <span>ONLINE REZERVASYON</span>
            </div>
          </div>
        </section>

        <section className="section light-section" id="features">
          <div className="landing-container">
            <div className="section-heading">
              <div className="eyebrow">GÜÇLÜ ARAÇLAR</div>
              <h2>
                Sadece bir panel değil.
                <span> İşletmenizin kontrol merkezi.</span>
              </h2>
              <p>
                Günlük operasyonun en çok zaman alan noktalarını sadeleştiren,
                gerçek iş akışlarını merkeze alan bir sistem.
              </p>
            </div>

            <div className="bento-grid">
              <article className="feature-card feature-wide">
                <div className="feature-copy">
                  <span className="feature-number">01</span>
                  <h3>Online Randevu</h3>
                  <p>
                    Müşterileriniz uygun gün ve saati kendileri seçsin. Siz
                    panelden tüm akışı yönetin.
                  </p>
                </div>
                <div className="booking-ui">
                  <div className="booking-header">
                    <span>Randevu Oluştur</span>
                    <b>3 / 4</b>
                  </div>
                  <div className="booking-progress">
                    <span />
                  </div>
                  <div className="booking-content">
                    <small>HİZMET</small>
                    <strong>Saç + Sakal</strong>
                    <div className="booking-time-list">
                      <span>14:30</span>
                      <span className="selected">15:00</span>
                      <span>15:30</span>
                      <span>16:00</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="feature-card">
                <span className="feature-number">02</span>
                <div className="card-icon">♙</div>
                <h3>Müşteri CRM</h3>
                <p>
                  Müşteri geçmişi, notlar ve randevular tek profilde.
                </p>
                <div className="customer-card-mini">
                  <div>AY</div>
                  <section>
                    <strong>Ahmet Yılmaz</strong>
                    <small>12 randevu · VIP</small>
                  </section>
                  <span>→</span>
                </div>
              </article>

              <article className="feature-card">
                <span className="feature-number">03</span>
                <div className="card-icon">↗</div>
                <h3>Canlı Analiz</h3>
                <p>
                  Gelir, randevu ve çalışan performansını net biçimde görün.
                </p>
                <div className="bars">
                  <span style={{ height: "35%" }} />
                  <span style={{ height: "48%" }} />
                  <span style={{ height: "41%" }} />
                  <span style={{ height: "63%" }} />
                  <span style={{ height: "55%" }} />
                  <span style={{ height: "77%" }} />
                  <span style={{ height: "92%" }} />
                </div>
              </article>

              <article className="feature-card feature-dark">
                <div className="feature-dark-top">
                  <span className="feature-number">04</span>
                  <span className="dark-pill">OTOMATİK</span>
                </div>
                <h3>Personel ve çalışma saatleri</h3>
                <p>
                  Çalışanlarınızı, müsaitliklerini ve çalışma saatlerini tek
                  ekrandan yönetin.
                </p>
                <div className="team-stack">
                  <span>AY</span>
                  <span>MK</span>
                  <span>CD</span>
                  <span>+5</span>
                </div>
              </article>

              <article className="feature-card feature-highlight">
                <div>
                  <span className="feature-number">05</span>
                  <h3>Daha düzenli. Daha hızlı.</h3>
                  <p>
                    Karmaşık ekranlar yerine günlük iş akışına göre tasarlanmış
                    sade bir deneyim.
                  </p>
                </div>
                <div className="highlight-ring">
                  <span>∞</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="landing-container">
            <div className="section-heading centered light-heading">
              <div className="eyebrow">TEK YERDE</div>
              <h2>
                İşletmenin tamamı
                <span> aynı sistemde.</span>
              </h2>
              <p>
                En temel operasyonlardan performans analizine kadar her şey aynı
                akışın içinde.
              </p>
            </div>

            <div className="stats-grid">
              {stats.map(([number, title, text]) => (
                <div className="stat-block" key={number}>
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section process-section" id="process">
          <div className="landing-container">
            <div className="section-heading centered">
              <div className="eyebrow">NASIL ÇALIŞIR?</div>
              <h2>
                Başlayın,
                <span> sistem gerisini kolaylaştırsın.</span>
              </h2>
              <p>
                Karmaşık kurulumlarla uğraşmadan işletmenize uygun yapıyı
                oluşturun ve günlük operasyonu tek panelden yönetin.
              </p>
            </div>

            <div className="process-grid">
              <article>
                <span>01</span>
                <div className="process-line" />
                <h3>Sisteminizi kurun</h3>
                <p>
                  Hizmetlerinizi, çalışanlarınızı ve çalışma saatlerinizi
                  tanımlayın.
                </p>
              </article>
              <article>
                <span>02</span>
                <div className="process-line" />
                <h3>Randevularınızı yönetin</h3>
                <p>
                  Online ve panelden gelen randevuları tek akışta kontrol edin.
                </p>
              </article>
              <article>
                <span>03</span>
                <div className="process-line" />
                <h3>Verilerle büyüyün</h3>
                <p>
                  Performansınızı ölçün ve işletmeniz için doğru kararlar alın.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="cta-section" id="demo">
          <div className="landing-container">
            <div className="cta-box">
              <div className="cta-orb" />
              <div className="cta-copy">
                <div className="eyebrow">İLK ADIMI ATIN</div>
                <h2>
                  İşletmenizi
                  <span> daha güçlü bir sisteme taşıyın.</span>
                </h2>
                <p>
                  İşletmenize uygun yönetim yapısını birlikte oluşturalım.
                </p>
              </div>

              <a href="mailto:info@example.com" className="cta-button">
                Demo Talep Et <span>↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">B</span>
            <span className="brand-text">
              <strong>Business</strong>
              <small>System</small>
            </span>
          </Link>

          <div className="footer-links">
            <a href="#platform">Platform</a>
            <a href="#features">Özellikler</a>
            <a href="#process">Nasıl Çalışır?</a>
            <Link to="/login">Giriş</Link>
          </div>

          <p>© 2026 Business System. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
