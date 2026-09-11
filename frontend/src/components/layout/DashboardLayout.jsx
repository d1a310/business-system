import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import "./DashboardLayout.css";


function DashboardLayout() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [notificationOpen, setNotificationOpen] =
    useState(false);


  const storedUser =
    localStorage.getItem("user");

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;


  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const loadNotifications = async () => {
    try {
      const [
        notificationResponse,
        countResponse,
      ] = await Promise.all([
        api.get("/notifications"),
        api.get(
          "/notifications/unread-count"
        ),
      ]);

      const allNotifications =
        notificationResponse.data || [];

      // Panelde yalnızca okunmamış bildirimleri göster
      const unreadNotifications =
        allNotifications.filter(
          (notification) =>
            !notification.is_read
        );

      setNotifications(
        unreadNotifications
      );

      setUnreadCount(
        countResponse.data?.unread_count || 0
      );
    } catch (error) {
      console.error(
        "Bildirimler alınamadı:",
        error
      );
    }
  };


  useEffect(() => {
    loadNotifications();

    const interval = setInterval(
      loadNotifications,
      15000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);


  // =========================================================
  // READ ONE
  // =========================================================

  const markAsRead = async (
    notification
  ) => {
    try {
      if (!notification.is_read) {
        await api.patch(
          `/notifications/${notification.id}/read`
        );
      }

      // Bildirimi panelden anında kaldır
      setNotifications((prev) =>
        prev.filter(
          (item) =>
            item.id !== notification.id
        )
      );

      setUnreadCount((prev) =>
        Math.max(prev - 1, 0)
      );

      if (
        notification.entity_type ===
          "APPOINTMENT" &&
        notification.entity_id
      ) {
        setNotificationOpen(false);

        navigate(
          `/appointments?appointmentId=${notification.entity_id}`
        );

        return;
      }

      await loadNotifications();
    } catch (error) {
      console.error(
        "Bildirim okunamadı:",
        error
      );
    }
  };


  // =========================================================
  // READ ALL
  // =========================================================

  const markAllAsRead = async () => {
    try {
      await api.patch(
        "/notifications/read-all"
      );

      // Paneli anında boşalt
      setNotifications([]);

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Bildirimler okunamadı:",
        error
      );
    }
  };


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };


  const closeSidebar = () => {
    setSidebarOpen(false);
  };


  // =========================================================
  // NAV
  // =========================================================

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "▣",
    },
    {
      path: "/appointments",
      label: "Randevular",
      icon: "◷",
    },
    {
      path: "/customers",
      label: "Müşteriler",
      icon: "♙",
    },
    {
      path: "/services",
      label: "Hizmetler",
      icon: "✦",
    },
    {
      path: "/employees",
      label: "Çalışanlar",
      icon: "♙",
    },
  ];


  return (
    <div
      className={
        sidebarCollapsed
          ? "dashboard-layout sidebar-is-collapsed"
          : "dashboard-layout"
      }
    >

      {/* OVERLAY */}

      {sidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={closeSidebar}
        />
      )}


      {/* SIDEBAR */}

      <aside
        className={
          sidebarOpen
            ? "dashboard-sidebar open"
            : "dashboard-sidebar"
        }
      >

        <div className="sidebar-brand">

          <div className="sidebar-brand-mark">
            BS
          </div>

          <div className="sidebar-brand-text">

            <strong>
              Business System
            </strong>

            <span>
              İşletme Yönetimi
            </span>

          </div>

        </div>


        <nav className="sidebar-nav">

          <div className="sidebar-nav-label">
            YÖNETİM
          </div>


          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
              onClick={closeSidebar}
              title={item.label}
            >

              <span className="sidebar-link-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </NavLink>
          ))}


          <div className="sidebar-nav-label settings-label">
            SİSTEM
          </div>


          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
            onClick={closeSidebar}
            title="Ayarlar"
          >

            <span className="sidebar-link-icon">
              ⚙
            </span>

            <span>
              Ayarlar
            </span>

          </NavLink>

        </nav>


        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="sidebar-user-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "U"}
            </div>

            <div className="sidebar-user-info">

              <strong>
                {user?.name ||
                  "Kullanıcı"}
              </strong>

              <span>
                {user?.role ||
                  "ADMIN"}
              </span>

            </div>

          </div>


          <button
            type="button"
            className="sidebar-logout"
            onClick={
              handleLogout
            }
          >

            <span>
              ↪
            </span>

            Çıkış Yap

          </button>

        </div>

      </aside>


      {/* MAIN */}

      <div
        className={
          sidebarCollapsed
            ? "dashboard-main sidebar-collapsed"
            : "dashboard-main"
        }
      >

        {/* TOPBAR */}

        <header className="dashboard-topbar">

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          >
            ☰
          </button>


          <div className="topbar-spacer" />


          {/* NOTIFICATIONS */}

          <div className="notification-wrapper">
            <button
              type="button"
              className={
                notificationOpen
                  ? "notification-button active"
                  : "notification-button"
              }
              onClick={() => setNotificationOpen(!notificationOpen)}
              aria-label="Bildirimleri aç"
              title="Bildirimler"
            >
              <span className="notification-button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 21h4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="notification-panel">
                <div className="notification-panel-glow" />

                <div className="notification-header">
                  <div className="notification-header-copy">
                    <div className="notification-title-row">
                      <span className="notification-header-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div>
                        <strong>Bildirimler</strong>
                        <span>
                          {unreadCount > 0
                            ? `${unreadCount} yeni bildirim`
                            : "Her şey güncel"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notification-read-all"
                      onClick={markAllAsRead}
                    >
                      Tümünü okundu yap
                    </button>
                  )}
                </div>

                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">
                      <div className="notification-empty-orb">
                        <span>
                          <svg viewBox="0 0 24 24" fill="none">
                            <path
                              d="m6 12 4 4 8-8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </div>
                      <strong>Her şey güncel</strong>
                      <span>Yeni bildirimler burada görünecek.</span>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className="notification-item unread"
                        onClick={() => markAsRead(notification)}
                      >
                        <div
                          className={`notification-item-icon ${
                            notification.notification_type === "APPOINTMENT"
                              ? "appointment"
                              : "general"
                          }`}
                        >
                          {notification.notification_type === "APPOINTMENT" ? (
                            <svg viewBox="0 0 24 24" fill="none">
                              <rect
                                x="4"
                                y="5"
                                width="16"
                                height="15"
                                rx="3"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              />
                              <path
                                d="M8 3v4M16 3v4M4 10h16"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />
                              <path
                                d="M8 14h2M12 14h2M8 17h2"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 3v18M3 12h18"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="notification-item-content">
                          <div className="notification-item-topline">
                            <strong>{notification.title}</strong>
                            <span className="notification-dot" />
                          </div>

                          <span className="notification-message">
                            {notification.message}
                          </span>

                          <small>
                            {new Date(notification.created_at).toLocaleString(
                              "tr-TR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </small>
                        </div>

                        <span className="notification-item-arrow">›</span>
                      </button>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="notification-footer">
                    <span>Yeni bildirimler otomatik olarak güncellenir</span>
                    <span className="notification-live-dot" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* USER */}

          <div className="topbar-user">

            <div className="topbar-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "U"}
            </div>

            <div className="topbar-user-info">

              <strong>
                {user?.name ||
                  "Kullanıcı"}
              </strong>

              <span>
                Yönetici
              </span>

            </div>

          </div>

        </header>


        {/* CONTENT */}

        <main className="dashboard-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
}


export default DashboardLayout;