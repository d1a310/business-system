import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Giriş yapılırken bir hata oluştu.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
        <div className="login-grid" />
      </div>

      <header className="login-topbar">
        <Link to="/" className="login-brand">
          <span className="login-brand-mark">BS</span>
          <span className="login-brand-copy">
            <strong>Business System</strong>
            <small>İşletme Yönetimi</small>
          </span>
        </Link>

        <Link to="/" className="login-back-link">
          Ana Sayfaya Dön <span>→</span>
        </Link>
      </header>

      <main className="login-main">
        <section className="login-showcase">
          <span className="login-eyebrow">BUSINESS SYSTEM</span>

          <h1>
            İşletmeni
            <br />
            <em>tek yerden yönet.</em>
          </h1>

          <p>
            Müşterilerinden randevularına, hizmetlerinden çalışanlarına kadar
            işletmenin günlük akışını modern ve düzenli bir panelden yönet.
          </p>

          <div className="login-feature-list">
            <div className="login-feature">
              <span className="login-feature-icon">✓</span>
              <div>
                <strong>Randevu yönetimi</strong>
                <span>Günün tüm randevularını tek ekranda kontrol et.</span>
              </div>
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">✦</span>
              <div>
                <strong>Müşteri ve ekip</strong>
                <span>İşletmenin temel verilerine hızlıca ulaş.</span>
              </div>
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">↗</span>
              <div>
                <strong>Online randevu</strong>
                <span>Müşterilerin için kesintisiz bir rezervasyon akışı oluştur.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-card">
            <div className="login-card-top">
              <span className="login-card-badge">YÖNETİM PANELİ</span>
              <div className="login-status">
                <span />
                Güvenli giriş
              </div>
            </div>

            <div className="login-heading">
              <h2>Tekrar hoş geldin.</h2>
              <p>İşletme paneline erişmek için bilgilerini gir.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">E-posta</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">@</span>
                  <input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <div className="login-field-label-row">
                  <label htmlFor="password">Şifre</label>
                </div>

                <div className="login-input-wrap">
                  <span className="login-input-icon">••</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifrenizi girin"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword
                        ? "Şifreyi gizle"
                        : "Şifreyi göster"
                    }
                  >
                    {showPassword ? "Gizle" : "Göster"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error">
                  <span>!</span>
                  <div>
                    <strong>Giriş başarısız</strong>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                <span>{loading ? "Giriş yapılıyor..." : "Panele Giriş Yap"}</span>
                <span className="login-submit-arrow">→</span>
              </button>
            </form>

            <div className="login-card-footer">
              <span>Business System</span>
              <span>•</span>
              <span>İşletme Yönetimi</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="login-page-footer">
        <span>© {new Date().getFullYear()} Business System</span>
        <span>Modern işletme yönetimi</span>
      </footer>
    </div>
  );
}

export default Login;
