import { useAuth0 } from "@auth0/auth0-react";
import { useWeatherData } from "../hooks/useWeatherData";
import { useTheme } from "../hooks/useTheme";
import { WeatherCard } from "./WeatherCard";

export function Dashboard() {
  const { user, logout } = useAuth0();
  const { data, loading, error, refetch } = useWeatherData();
  const [theme, toggleTheme] = useTheme();

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span>🌤️</span>
          <span>Weather Hub</span>
        </div>
        <div className="header-user">
          <span className="user-email">{user?.email}</span>
          <button
            id="theme-toggle-btn"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            id="logout-btn"
            className="logout-btn"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="dashboard-main">
        <div className="dashboard-intro">
          <h1>City Comfort Rankings</h1>
          <p>Real-time scores ranked from most to least comfortable.</p>
          <div className="intro-meta">
            <button id="refresh-btn" className="refresh-btn" onClick={refetch} disabled={loading}>
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-screen" style={{ minHeight: "50vh" }}>
            <div className="loading-ring" />
            <p>Fetching live weather data…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="error-banner" role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* Cards grid */}
        {!loading && data && (
          <div className="cards-grid">
            {data.map((city) => (
              <WeatherCard key={city.cityId} city={city} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
