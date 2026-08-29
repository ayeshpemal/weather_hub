import { useAuth0 } from "@auth0/auth0-react";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";

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
      <Dashboard />
    </div>
  );
}

export default App;
