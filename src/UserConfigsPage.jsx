import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";

// Helper: Format bytes as MB/GB
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Helper: Format expiry time (seconds) to readable date
function formatExpiry(seconds) {
  if (!seconds) return "No expiry";
  const date = new Date(seconds * 1000);
  return date.toLocaleString();
}

// Helper: Build config URL
function buildConfigUrl(inbound, client) {
  const protocol = inbound.protocol || "vless";
  const uuid = client.uuid;
  const ip = inbound.ip;
  const port = inbound.port;
  const network = inbound.streamSettings?.network || "tcp";
  const security = inbound.streamSettings?.security || "none";
  const remark = inbound.remark || "";
  const email = client.email || "";
  return `${protocol}://${uuid}@${ip}:${port}?type=${network}&security=${security}#${remark}-${email}`;
}

export default function UserConfigsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchConfigs() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("onwardpath_session_token");
        const res = await fetch("/api/Get-user-configs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.msg || "Error fetching configs.");
          setLoading(false);
          return;
        }
        setConfigs(data.obj.current_config_list || []);
      } catch (e) {
        setError("Network error.");
      }
      setLoading(false);
    }
    fetchConfigs();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: "2em" }}>
      <h2>Your Configs</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {configs.length === 0 && !loading && <div>No configs found.</div>}
      {configs.map(({ inbound, client_config }, idx) => {
        const url = buildConfigUrl(inbound, client_config);
        const up = client_config.up || 0;
        const down = client_config.down || 0;
        const used = up + down;
        const total = client_config.total || 0;
        const remain = Math.max(total - used, 0);
        const expiry = client_config.expiryTime;
        const percentUsed = total > 0 ? Math.min((used / total) * 100, 100) : 0;
        return (
          <div
            key={client_config.id || idx}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              marginBottom: 32,
              padding: 24,
              background: "#fafafd",
              boxShadow: "0 4px 12px 0 #ededed",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Config URL
                </div>
                <div
                  style={{
                    wordBreak: "break-all",
                    background: "#f4f4f4",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                >
                  {url}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                    }}
                    style={{
                      marginLeft: 12,
                      padding: "2px 16px",
                      borderRadius: 6,
                      border: "none",
                      background: "#1277ef",
                      color: "white",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div style={{ minWidth: 120 }}>
                <QRCode value={url} size={110} />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Traffic Usage
              </div>
              <div
                style={{
                  background: "#e8eaf6",
                  borderRadius: 6,
                  height: 24,
                  width: "100%",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    background: "#1277ef",
                    height: "100%",
                    width: `${percentUsed}%`,
                    transition: "width 0.4s",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 0,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 500,
                    color: "#333",
                  }}
                >
                  Used: {formatBytes(used)} / Total: {formatBytes(total)} | Remain: {formatBytes(remain)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 600 }}>
                Expiry Time:{" "}
                <span style={{ fontWeight: 400 }}>
                  {formatExpiry(expiry)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
