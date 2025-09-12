import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();
  // You can fetch/display more user info here if desired

  return (
    <div style={{ maxWidth: 480, margin: "auto" }}>
      <h2>Welcome to your Profile!</h2>
      {/* Display user info here if available */}
      <button
        style={{ padding: "10px 24px", marginTop: 32 }}
        onClick={() => navigate("/buy-config")}
      >
        Buy Config
      </button>
      <button
        style={{ padding: "10px 24px", marginTop: 32 }}
        onClick={() => navigate("/user-configs")}
      >
        My Configs
      </button>
    </div>
  );
}
