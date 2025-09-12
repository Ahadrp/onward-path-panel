import { useState } from "react";

const SERVER_OPTIONS = [
  { value: 0, name: "Main Server" }
];

const DURATION_PRESETS = [
  { label: "5 Minutes", value: 5 * 60},
  { label: "1 Hour", value: 60 * 60},
  { label: "1 Day", value: 24 * 60 * 60},
  { label: "1 Week", value: 7 * 24 * 60 * 60},
  { label: "1 Month", value: 30 * 24 * 60 * 60},
  { label: "3 Months", value: 90 * 24 * 60 * 60},
  { label: "6 Months", value: 180 * 24 * 60 * 60},
  { label: "1 Year", value: 365 * 24 * 60 * 60},
];

const TRAFFIC_PRESETS_MB = [
  500,           // 500 MB
  1024,          // 1 GB
  5120,          // 5 GB
  10240,         // 10 GB
  51200,         // 50 GB
  102400,        // 100 GB
];

export default function BuyConfigPage() {
  // Server selection (only one)
  const [server, setServer] = useState(1);

  // Duration selection
  const [durationType, setDurationType] = useState("preset"); // or "custom"
  const [durationPreset, setDurationPreset] = useState(DURATION_PRESETS[0].value);
  const [durationCustom, setDurationCustom] = useState(""); // in minutes

  // Traffic selection
  const [trafficType, setTrafficType] = useState("preset"); // or "custom"
  const [trafficPreset, setTrafficPreset] = useState(TRAFFIC_PRESETS_MB[0]); // MB
  const [trafficCustom, setTrafficCustom] = useState(""); // MB

  // Submission status
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Calculate duration in seconds
  const durationSeconds =
    durationType === "preset"
      ? durationPreset
      : parseInt(durationCustom, 10) > 0
        ? parseInt(durationCustom, 10) * 60 * 1000 // in milisecond
        : 0;

  // Calculate traffic in bytes
  const trafficMB =
    trafficType === "preset"
      ? trafficPreset
      : parseFloat(trafficCustom) > 0
        ? parseFloat(trafficCustom)
        : 0;
  const totalBytes = Math.round(trafficMB * 1024 * 1024);

  // Calculate expiry time (now + duration)
  const expiryTime = (Math.floor(Date.now() / 1000) + durationSeconds) * 1000;

  // Helper to format MB/GB for display
  function formatTraffic(mb) {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb} MB`;
  }

  // Handle buy
  async function handleBuy(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const token = localStorage.getItem("onwardpath_session_token");
    if (!token) {
      setResult({ error: "Not authenticated. Please log in." });
      setSubmitting(false);
      return;
    }

    const payload = {
      server: server,
      total: totalBytes,
      flow: "", // always empty for now
      expiry_time: expiryTime,
    };

    try {
      const res = await fetch("/api/BuyConfig", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "auto" }}>
      <h2>Buy Config</h2>
      <form onSubmit={handleBuy}>
        {/* Server Selection */}
        <div>
          <label>Server:</label>
          <select value={server} onChange={e => setServer(Number(e.target.value))} disabled>
            {SERVER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
        </div>

        {/* Duration Selection */}
        <div style={{ marginTop: 16 }}>
          <label>Duration:</label>
          <div>
            <input
              type="radio"
              id="duration-preset"
              name="duration-type"
              value="preset"
              checked={durationType === "preset"}
              onChange={() => setDurationType("preset")}
            />
            <label htmlFor="duration-preset">Preset</label>
            <input
              type="radio"
              id="duration-custom"
              name="duration-type"
              value="custom"
              checked={durationType === "custom"}
              onChange={() => setDurationType("custom")}
              style={{ marginLeft: 16 }}
            />
            <label htmlFor="duration-custom">Custom</label>
          </div>
          {durationType === "preset" ? (
            <select
              value={durationPreset}
              onChange={e => setDurationPreset(Number(e.target.value))}
            >
              {DURATION_PRESETS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <div>
              <input
                type="number"
                min="1"
                value={durationCustom}
                onChange={e => setDurationCustom(e.target.value)}
                placeholder="Enter minutes"
              />{" "}
              Minutes
            </div>
          )}
        </div>

        {/* Traffic Selection */}
        <div style={{ marginTop: 16 }}>
          <label>Traffic:</label>
          <div>
            <input
              type="radio"
              id="traffic-preset"
              name="traffic-type"
              value="preset"
              checked={trafficType === "preset"}
              onChange={() => setTrafficType("preset")}
            />
            <label htmlFor="traffic-preset">Preset</label>
            <input
              type="radio"
              id="traffic-custom"
              name="traffic-type"
              value="custom"
              checked={trafficType === "custom"}
              onChange={() => setTrafficType("custom")}
              style={{ marginLeft: 16 }}
            />
            <label htmlFor="traffic-custom">Custom</label>
          </div>
          {trafficType === "preset" ? (
            <select
              value={trafficPreset}
              onChange={e => setTrafficPreset(Number(e.target.value))}
            >
              {TRAFFIC_PRESETS_MB.map(mb => (
                <option key={mb} value={mb}>{formatTraffic(mb)}</option>
              ))}
            </select>
          ) : (
            <div>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={trafficCustom}
                onChange={e => setTrafficCustom(e.target.value)}
                placeholder="Enter traffic (MB or GB)"
              />{" "}
              MB
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{ marginTop: 16, fontSize: "0.95em", color: "#555" }}>
          <strong>Selected:</strong><br />
          Server: {SERVER_OPTIONS.find(s => s.value === server)?.name}<br />
          Duration: {durationSeconds
            ? ((durationSeconds / 60) < 60
                ? `${Math.round(durationSeconds / 60)} minutes`
                : `${(durationSeconds / 3600).toFixed(2)} hours`)
            : "None"}<br />
          Traffic: {trafficMB >= 1024
            ? `${(trafficMB / 1024).toFixed(2)} GB`
            : `${trafficMB} MB`}
        </div>

        <button type="submit" disabled={submitting || !durationSeconds || !trafficMB}
          style={{ marginTop: 24, padding: "10px 20px" }}>
          {submitting ? "Buying..." : "Buy Config"}
        </button>
      </form>

      {/* Result message */}
      {result && (
        <div style={{ marginTop: 24, color: result.success ? "green" : "red" }}>
          {result.success
            ? "Config purchased successfully!"
            : (result.error || "Failed to buy config.")}
        </div>
      )}
    </div>
  );
}
