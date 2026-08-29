import type { WeatherCity } from "../types/weather";

interface Props {
  city: WeatherCity;
}

const RANK_LABELS: Record<number, string> = {
  1: "🥇 #1",
  2: "🥈 #2",
  3: "🥉 #3",
};

function getRankClass(rank: number): string {
  if (rank === 1) return "rank-gold";
  if (rank === 2) return "rank-silver";
  if (rank === 3) return "rank-bronze";
  return "";
}

function getScoreColor(score: number): string {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}

export function WeatherCard({ city }: Props) {
  const scoreColor = getScoreColor(city.comfortScore);
  const rankLabel = RANK_LABELS[city.rank] ?? `#${city.rank}`;

  return (
    <article
      className={`weather-card ${getRankClass(city.rank)}`}
      style={{ animationDelay: `${(city.rank - 1) * 40}ms` }}
    >
      {/* Rank badge */}
      <span className="card-rank">{rankLabel}</span>

      {/* City header */}
      <div className="card-top">
        <img
          src={`https://openweathermap.org/img/wn/${city.icon}@2x.png`}
          alt={city.description}
          className="weather-icon"
          width={60}
          height={60}
        />
        <div>
          <h2 className="city-name">{city.cityName}</h2>
          <p className="weather-desc">{city.description}</p>
        </div>
      </div>

      {/* Temperature */}
      <div className="card-temp">{city.tempC.toFixed(1)}°C</div>

      {/* Comfort score */}
      <div className="comfort-section">
        <div className="comfort-header">
          <span className="comfort-label">Comfort Score</span>
          <span className="comfort-value" style={{ color: scoreColor }}>
            {city.comfortScore}
          </span>
        </div>
        <div className="score-bar-bg">
          <div
            className="score-bar-fill"
            style={{ width: `${city.comfortScore}%`, background: scoreColor }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="card-stats">
        <div className="stat-item">
          <span className="stat-label">Humidity</span>
          <span className="stat-value">{city.humidity}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Wind</span>
          <span className="stat-value">{city.windSpeed} m/s</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Cloud</span>
          <span className="stat-value">{city.cloudiness}%</span>
        </div>
      </div>
    </article>
  );
}
