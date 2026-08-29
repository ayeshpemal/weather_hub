import { useAuth0 } from "@auth0/auth0-react";
import { LoginPage } from "./components/LoginPage";

function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-ring" />
        <p>Loading Weather Hub…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="dashboard">
      <p style={{ color: "white", padding: "2rem" }}>Authenticated!.</p>
    </div>
  );
}

export default App;
