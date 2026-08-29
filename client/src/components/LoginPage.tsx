import { useAuth0 } from "@auth0/auth0-react";

export function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-emoji">🌤️</span>
        <h1>Weather Hub</h1>
        <p>
          Real-time comfort scores and weather insights
          <br />
          for cities worldwide.
        </p>
        <button
          className="login-btn"
          onClick={() => loginWithRedirect()}
        >
          Sign In to Continue
        </button>
      </div>
    </div>
  );
}
