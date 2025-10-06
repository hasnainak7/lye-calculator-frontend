
// App.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css"; // 🌈 rainbow styles

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000",
});

function numberOrEmpty(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

// ✅ Parse fatty acid values like "55–75%" → 65
function parseFattyAcidValue(val) {
  if (!val) return 0;
  val = val.replace("%", "").replace("–", "-").trim();
  if (val.includes("-")) {
    const [low, high] = val.split("-").map(Number);
    if (!isNaN(low) && !isNaN(high)) return (low + high) / 2;
  }
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

// ✅ Soap qualities calculator
function calculateSoapQualities(acids) {
  if (!acids) return null;
  const get = (name) => Number(acids[name] || 0);

  return {
    hardness:
      get("Lauric Acid") +
      get("Myristic Acid") +
      get("Palmitic Acid") +
      get("Stearic Acid"),
    cleansing: get("Lauric Acid") + get("Myristic Acid"),
    conditioning:
      get("Oleic Acid") +
      get("Linoleic Acid") +
      get("Linolenic Acid") +
      get("Ricinoleic Acid"),
    bubbly: get("Lauric Acid") + get("Myristic Acid") + get("Ricinoleic Acid"),
    creamy: get("Palmitic Acid") + get("Stearic Acid") + get("Ricinoleic Acid"),
  };
}

// ✅ Combine fatty acids across oils using weights
function calculateOverallFattyAcids(rows, fattyAcids, mode, batchSize) {
  let totalWeight = 0;

  if (mode === "grams") {
    totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight_g) || 0), 0);
  } else {
    totalWeight = Number(batchSize) || 1000;
  }

  if (totalWeight === 0) return null;

  const combined = {};

  rows.forEach((r) => {
    const acids = fattyAcids[r.oil];
    if (!acids) return;

    let oilWeight = 0;
    if (mode === "grams") {
      oilWeight = Number(r.weight_g) || 0;
    } else {
      oilWeight = (totalWeight * (Number(r.percent) || 0)) / 100;
    }

    const weightFraction = oilWeight / totalWeight;

    Object.entries(acids).forEach(([acid, val]) => {
      const parsedVal = parseFattyAcidValue(val);
      combined[acid] = (combined[acid] || 0) + parsedVal * weightFraction;
    });
  });

  return combined;
}

export default function App() {
  const [availableOils, setAvailableOils] = useState([]);
  const [rows, setRows] = useState([{ oil: "", weight_g: "", percent: "" }]);
  const [mode, setMode] = useState("grams"); // grams | percent
  const [batchSize, setBatchSize] = useState(1000);
  const [lyeType, setLyeType] = useState("NaOH");
  const [superfat, setSuperfat] = useState(0);
  const [waterRatio, setWaterRatio] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [fattyAcids, setFattyAcids] = useState({});

  useEffect(() => {
    api
      .get("/oils")
      .then((res) => setAvailableOils(res.data.oils))
      .catch(() => setAvailableOils([]));
  }, []);

  const totalOil = useMemo(() => {
    if (mode === "grams") {
      return rows.reduce((sum, r) => sum + (Number(r.weight_g) || 0), 0);
    } else {
      return Number(batchSize) || 0;
    }
  }, [rows, mode, batchSize]);

  const addRow = () =>
    setRows([...rows, { oil: "", weight_g: "", percent: "" }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const fetchFattyAcids = async (oil) => {
    try {
      const res = await api.get(`/fatty-acids/${encodeURIComponent(oil)}`);
      setFattyAcids((prev) => ({
        ...prev,
        [oil]: res.data.fatty_acids,
      }));
    } catch {
      setFattyAcids((prev) => ({
        ...prev,
        [oil]: null,
      }));
    }
  };

  const updateRow = (i, key, val) => {
    const clone = [...rows];
    clone[i] = { ...clone[i], [key]: val };
    setRows(clone);
    if (key === "oil" && val) fetchFattyAcids(val);
  };

  const calculate = async () => {
    setErr("");
    setResult(null);
    setLoading(true);
    try {
      let cleanRows;
      if (mode === "grams") {
        cleanRows = rows
          .filter((r) => r.oil && Number(r.weight_g) > 0)
          .map((r) => ({ oil: r.oil, weight_g: Number(r.weight_g) }));
      } else {
        cleanRows = rows
          .filter((r) => r.oil && Number(r.percent) > 0)
          .map((r) => ({
            oil: r.oil,
            weight_g: ((Number(batchSize) || 1000) * Number(r.percent)) / 100,
          }));
      }

      if (!cleanRows.length) {
        setErr("Add at least one oil with a positive amount.");
        setLoading(false);
        return;
      }

      const payload = {
        oils: cleanRows,
        superfat_percent: Number(superfat),
        lye_type: lyeType,
        water_ratio: waterRatio === "" ? null : Number(waterRatio),
      };

      const res = await api.post("/calculate", payload);
      setResult(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">

    
      <h1 className="rainbow-text" style={{ marginBottom: 8 }}>
        Lye Calculator
      </h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>
        Enter your oils in grams or percentages. Choose lye type, superfat, and
        water:lye ratio.
      </p>

      {/* Mode Switch + Batch Size */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Mode:{" "}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ marginRight: 12 }}
          >
            <option value="grams">Grams</option>
            <option value="percent">Percent</option>
          </select>
        </label>
        {mode === "percent" && (
          <label>
            Batch Size (g):{" "}
            <input
              type="number"
              min="1"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value.replace(/^0+/, ""))}
              style={{ width: 100 }}
            />
          </label>
        )}
      </div>

      {/* Oils Table */}
      <div className="rainbow-border" style={{ borderRadius: 12, padding: 16 }}>
        <table width="100%" cellPadding="8">
          <thead>
            <tr>
              <th align="left">Oil</th>
              {mode === "grams" ? (
                <th align="left">Weight (g)</th>
              ) : (
                <th align="left">Percentage (%)</th>
              )}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <input
                    list="oil-list"
                    placeholder="e.g., Olive Oil"
                    value={r.oil}
                    onChange={(e) => updateRow(i, "oil", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td>
                  {mode === "grams" ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={r.weight_g}
                      onChange={(e) =>
                        updateRow(i, "weight_g", numberOrEmpty(e.target.value))
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={r.percent}
                      onChange={(e) =>
                        updateRow(i, "percent", numberOrEmpty(e.target.value))
                      }
                      style={{ width: "100%" }}
                    />
                  )}
                </td>
                <td align="right">
                  <button
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="rainbow-button"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <datalist id="oil-list">
          {availableOils.map((o) => (
            <option value={o} key={o} />
          ))}
        </datalist>

        <div style={{ marginTop: 12 }}>
          <button onClick={addRow} className="rainbow-button">
            + Add oil
          </button>
        </div>

        <hr style={{ margin: "16px 0" }} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <label>Lye type</label>
            <select
              value={lyeType}
              onChange={(e) => setLyeType(e.target.value)}
              style={{ width: "100%" }}
            >
              <option>NaOH</option>
              <option>KOH</option>
            </select>
          </div>
          <div>
            <label>Superfat (%)</label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={superfat}
              onChange={(e) => setSuperfat(numberOrEmpty(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label>Water : Lye ratio</label>
            <input
              type="number"
              min="0.5"
              step="0.1"
              placeholder={lyeType === "NaOH" ? "default 1.0" : "default 1.0"}
              value={waterRatio}
              onChange={(e) => setWaterRatio(numberOrEmpty(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label>Total oils (g)</label>
            <input value={totalOil.toFixed(2)} readOnly />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={calculate}
            disabled={loading}
            className="rainbow-button"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
          {err && <div className="error">{err}</div>}
        </div>
      </div>

      {/* Print Section */}
      {(result || Object.keys(fattyAcids).length > 0) && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => window.print()} className="rainbow-button">
            🖨️ Print Report
          </button>
        </div>
      )}

      <div id="print-section">
        {/* Results */}


        {result && (
          <div
            className="rainbow-border"
            style={{ marginTop: 16, borderRadius: 12, padding: 16 }}
          >
            <h2 className="rainbow-text">Results</h2>
            <p>
              Lye: <strong>{result.total_lye_g} g</strong> ({result.lye_type}) •
              Water: <strong>{result.total_water_g} g</strong> • Water:lye used:{" "}
              <strong>{result.water_ratio_used}</strong>
            </p>
            <table width="100%" cellPadding="8">
              <thead>
                <tr>
                  <th align="left">Oil</th>
                  <th align="left">SAP (NaOH)</th>
                  <th align="left">Lye (before SF)</th>
                  <th align="left">Lye (after SF)</th>
                </tr>
              </thead>
              <tbody>
                {result.per_oil.map((r) => (
                  <tr key={r.oil}>
                    <td>{r.oil}</td>
                    <td>{r.sap_naoh}</td>
                    <td>{r.lye_g_before_superfat}</td>
                    <td>{r.lye_g_after_superfat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recipe Oils */}
        <div
          className="rainbow-border"
          style={{ marginTop: 16, borderRadius: 12, padding: 16 }}
        >
          <h2 className="rainbow-text">Recipe Oils</h2>
          <table width="100%" cellPadding="8">
            <thead>
              <tr>
                <th align="left">Oil</th>
                {mode === "grams" ? (
                  <th align="left">Weight (g)</th>
                ) : (
                  <>
                    <th align="left">Percentage (%)</th>
                    <th align="left">Weight (g)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const oilName = r.oil || "-";
                if (mode === "grams") {
                  return (
                    <tr key={i}>
                      <td>{oilName}</td>
                      <td>{r.weight_g || 0}</td>
                    </tr>
                  );
                } else {
                  const percent = Number(r.percent) || 0;
                  const grams =
                    ((Number(batchSize) || 1000) * percent) / 100;
                  return (
                    <tr key={i}>
                      <td>{oilName}</td>
                      <td>{percent}</td>
                      <td>{grams.toFixed(2)}</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>

        {/* Fatty Acids */}
        {Object.entries(fattyAcids).map(([oil, acids]) =>
          acids ? (
            <div
              key={oil}
              className="rainbow-border"
              style={{ marginTop: 16, borderRadius: 12, padding: 16 }}
            >
              <h2 className="rainbow-text">Fatty Acid Composition: {oil}</h2>
              <table width="100%" cellPadding="8">
                <thead>
                  <tr>
                    <th align="left">Fatty Acid</th>
                    <th align="left">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(acids).map(([acid, val]) => (
                    <tr key={acid}>
                      <td>{acid}</td>
                      <td>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p key={oil} style={{ color: "crimson" }}>
              No fatty acid data for {oil}
            </p>
          )
        )}

        {/* Soap Qualities */}
        {(() => {
          const overallAcids = calculateOverallFattyAcids(
            rows,
            fattyAcids,
            mode,
            batchSize
          );
          if (!overallAcids) return null;
          const overallQualities = calculateSoapQualities(overallAcids);
          return (
            <div
              className="rainbow-border"
              style={{ marginTop: 24, borderRadius: 12, padding: 16 }}
            >
              <h2 className="rainbow-text">Overall Recipe Soap Qualities %</h2>
              <ul>
                <li>Hardness: {overallQualities.hardness.toFixed(2)}%</li>
                <li>Cleansing: {overallQualities.cleansing.toFixed(2)}%</li>
                <li>
                  Conditioning: {overallQualities.conditioning.toFixed(2)}
                %</li>
                <li>Bubbly: {overallQualities.bubbly.toFixed(2)}%</li>
                <li>Creamy: {overallQualities.creamy.toFixed(2)}%</li>
              </ul>
            </div>
          );
        })()}
      </div>

      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 16 }}>
        ⚠️ Safety: lye is caustic—use protective gear, label containers, and
        double-check values for your specific oils.
      </p>
    </div>
  );
}
