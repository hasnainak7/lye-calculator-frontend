// // App.jsx
// import { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import "./App.css"; // 🌈 import rainbow styles

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE || "https://lye-calculator.onrender.com",
// });

// function numberOrEmpty(v) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : "";
// }

// export default function App() {
//   const [availableOils, setAvailableOils] = useState([]);
//   const [rows, setRows] = useState([{ oil: "", weight_g: "" }]);
//   const [lyeType, setLyeType] = useState("NaOH");
//   const [superfat, setSuperfat] = useState(5);
//   const [waterRatio, setWaterRatio] = useState("");
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState("");

//   // ✅ hold fatty acids per oil
//   const [fattyAcids, setFattyAcids] = useState({});

//   useEffect(() => {
//     api
//       .get("/oils")
//       .then((res) => setAvailableOils(res.data.oils))
//       .catch(() => setAvailableOils([]));
//   }, []);

//   const totalOil = useMemo(
//     () => rows.reduce((sum, r) => sum + (Number(r.weight_g) || 0), 0),
//     [rows]
//   );

//   const addRow = () => setRows([...rows, { oil: "", weight_g: "" }]);
//   const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

//   // ✅ fetch fatty acids for each oil and store by name
//   const fetchFattyAcids = async (oil) => {
//     try {
//       const res = await api.get(`/fatty-acids/${encodeURIComponent(oil)}`);
//       setFattyAcids((prev) => ({
//         ...prev,
//         [oil]: res.data.fatty_acids,
//       }));
//     } catch {
//       setFattyAcids((prev) => ({
//         ...prev,
//         [oil]: null,
//       }));
//     }
//   };

//   const updateRow = (i, key, val) => {
//     const clone = [...rows];
//     clone[i] = { ...clone[i], [key]: val };
//     setRows(clone);

//     if (key === "oil" && val) {
//       fetchFattyAcids(val);
//     }
//   };

//   const calculate = async () => {
//     setErr("");
//     setResult(null);
//     setLoading(true);
//     try {
//       const cleanRows = rows
//         .filter((r) => r.oil && Number(r.weight_g) > 0)
//         .map((r) => ({ oil: r.oil, weight_g: Number(r.weight_g) }));

//       if (!cleanRows.length) {
//         setErr("Add at least one oil with a positive weight.");
//         setLoading(false);
//         return;
//       }

//       const payload = {
//         oils: cleanRows,
//         superfat_percent: Number(superfat),
//         lye_type: lyeType,
//         water_ratio: waterRatio === "" ? null : Number(waterRatio),
//       };

//       const res = await api.post("/calculate", payload);
//       setResult(res.data);
//     } catch (e) {
//       setErr(e?.response?.data?.detail || "Calculation failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       style={{
//         maxWidth: 900,
//         padding: 24,
//         margin: "0 auto",
//         fontFamily: "system-ui, Arial",
//       }}
//     >
//       <h1 className="rainbow-text" style={{ marginBottom: 8 }}>
//         Lye Calculator
//       </h1>
//       <p style={{ marginTop: 0, opacity: 0.7 }}>
//         Enter your oils (grams). Choose lye type, superfat, and (optionally) water:lye ratio.
//       </p>

//       <div className="rainbow-border" style={{ borderRadius: 12, padding: 16 }}>
//         <table width="100%" cellPadding="8">
//           <thead>
//             <tr>
//               <th align="left">Oil</th>
//               <th align="left">Weight (g)</th>
//               <th />
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={i}>
//                 <td>
//                   <input
//                     list="oil-list"
//                     placeholder="e.g., Olive Oil"
//                     value={r.oil}
//                     onChange={(e) => updateRow(i, "oil", e.target.value)}
//                     style={{ width: "100%" }}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     placeholder="0"
//                     value={r.weight_g}
//                     onChange={(e) =>
//                       updateRow(i, "weight_g", numberOrEmpty(e.target.value))
//                     }
//                     style={{ width: "100%" }}
//                   />
//                 </td>
//                 <td align="right">
//                   <button
//                     onClick={() => removeRow(i)}
//                     disabled={rows.length === 1}
//                     className="rainbow-button"
//                   >
//                     Remove
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <datalist id="oil-list">
//           {availableOils.map((o) => (
//             <option value={o} key={o} />
//           ))}
//         </datalist>

//         <div style={{ marginTop: 12 }}>
//           <button onClick={addRow} className="rainbow-button">
//             + Add oil
//           </button>
//         </div>

//         <hr style={{ margin: "16px 0" }} />

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr 1fr 1fr",
//             gap: 12,
//           }}
//         >
//           <div>
//             <label>Lye type</label>
//             <select
//               value={lyeType}
//               onChange={(e) => setLyeType(e.target.value)}
//               style={{ width: "100%" }}
//             >
//               <option>NaOH</option>
//               <option>KOH</option>
//             </select>
//           </div>
//           <div>
//             <label>Superfat (%)</label>
//             <input
//               type="number"
//               min="0"
//               max="20"
//               step="0.5"
//               value={superfat}
//               onChange={(e) => setSuperfat(numberOrEmpty(e.target.value))}
//               style={{ width: "100%" }}
//             />
//           </div>
//           <div>
//             <label>Water : Lye ratio</label>
//             <input
//               type="number"
//               min="0.5"
//               step="0.1"
//               placeholder={lyeType === "NaOH" ? "default 2.5" : "default 3.0"}
//               value={waterRatio}
//               onChange={(e) => setWaterRatio(numberOrEmpty(e.target.value))}
//               style={{ width: "100%" }}
//             />
//           </div>
//           <div>
//             <label>Total oils (g)</label>
//             <input value={totalOil.toFixed(2)} readOnly />
//           </div>
//         </div>

//         <div style={{ marginTop: 16 }}>
//           <button onClick={calculate} disabled={loading} className="rainbow-button">
//             {loading ? "Calculating..." : "Calculate"}
//           </button>
//           {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
//         </div>
//       </div>

//       {result && (
//         <div
//           className="rainbow-border"
//           style={{
//             marginTop: 16,
//             borderRadius: 12,
//             padding: 16,
//           }}
//         >
//           <h2 className="rainbow-text" style={{ marginTop: 0 }}>
//             Results
//           </h2>
//           <p style={{ marginTop: 0 }}>
//             Lye: <strong>{result.total_lye_g} g</strong> ({result.lye_type}) &nbsp; • &nbsp; Water:{" "}
//             <strong>{result.total_water_g} g</strong> &nbsp; • &nbsp; Water:lye used:{" "}
//             <strong>{result.water_ratio_used}</strong>
//           </p>

//           <table width="100%" cellPadding="8">
//             <thead>
//               <tr>
//                 <th align="left">Oil</th>
//                 <th align="left">SAP (NaOH)</th>
//                 <th align="left">Lye (before SF)</th>
//                 <th align="left">Lye (after SF)</th>
//               </tr>
//             </thead>
//             <tbody>
//               {result.per_oil.map((r) => (
//                 <tr key={r.oil}>
//                   <td>{r.oil}</td>
//                   <td>{r.sap_naoh}</td>
//                   <td>{r.lye_g_before_superfat}</td>
//                   <td>{r.lye_g_after_superfat}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* ✅ show fatty acids for all selected oils */}
//       {rows
//         .filter((r) => r.oil)
//         .map((r) => {
//           const acids = fattyAcids[r.oil];
//           return acids ? (
//             <div
//               key={r.oil}
//               className="rainbow-border"
//               style={{ marginTop: 16, borderRadius: 12, padding: 16 }}
//             >
//               <h2 className="rainbow-text" style={{ marginTop: 0 }}>
//                 Fatty Acid Composition: {r.oil}
//               </h2>
//               <table width="100%" cellPadding="8">
//                 <thead>
//                   <tr>
//                     <th align="left">Fatty Acid</th>
//                     <th align="left">Percentage</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {Object.entries(acids).map(([acid, val]) => (
//                     <tr key={acid}>
//                       <td>{acid}</td>
//                       <td>{val}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <p key={r.oil} style={{ color: "crimson" }}>
//               No fatty acid data for {r.oil}
//             </p>
//           );
//         })}

//       <p style={{ fontSize: 12, opacity: 0.7, marginTop: 16 }}>
//         ⚠️ Safety: lye is caustic—use protective gear, label containers, and double-check values for your specific oils.
//       </p>
//     </div>
//   );
// }


// App.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css"; // 🌈 import rainbow styles

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "https://lye-calculator.onrender.com",
});

function numberOrEmpty(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

export default function App() {
  const [availableOils, setAvailableOils] = useState([]);
  const [rows, setRows] = useState([{ oil: "", weight_g: "" }]);
  const [lyeType, setLyeType] = useState("NaOH");
  const [superfat, setSuperfat] = useState(5);
  const [waterRatio, setWaterRatio] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ hold fatty acids for multiple oils
  const [fattyAcids, setFattyAcids] = useState({});

  useEffect(() => {
    api
      .get("/oils")
      .then((res) => setAvailableOils(res.data.oils))
      .catch(() => setAvailableOils([]));
  }, []);

  const totalOil = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.weight_g) || 0), 0),
    [rows]
  );

  const addRow = () => setRows([...rows, { oil: "", weight_g: "" }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  // ✅ automatically fetch fatty acids for all oils in rows
  useEffect(() => {
    rows.forEach((r) => {
      if (r.oil && !(r.oil in fattyAcids)) {
        api
          .get(`/fatty-acids/${encodeURIComponent(r.oil)}`)
          .then((res) => {
            setFattyAcids((prev) => ({
              ...prev,
              [r.oil]: res.data.fatty_acids,
            }));
          })
          .catch(() => {
            setFattyAcids((prev) => ({
              ...prev,
              [r.oil]: null,
            }));
          });
      }
    });
  }, [rows, fattyAcids]);

  const updateRow = (i, key, val) => {
    const clone = [...rows];
    clone[i] = { ...clone[i], [key]: val };
    setRows(clone);
  };

  const calculate = async () => {
    setErr("");
    setResult(null);
    setLoading(true);
    try {
      const cleanRows = rows
        .filter((r) => r.oil && Number(r.weight_g) > 0)
        .map((r) => ({ oil: r.oil, weight_g: Number(r.weight_g) }));

      if (!cleanRows.length) {
        setErr("Add at least one oil with a positive weight.");
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
    <div
      style={{
        maxWidth: 900,
        padding: 24,
        margin: "0 auto",
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1 className="rainbow-text" style={{ marginBottom: 8 }}>
        Lye Calculator
      </h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>
        Enter your oils (grams). Choose lye type, superfat, and (optionally) water:lye ratio.
      </p>

      <div className="rainbow-border" style={{ borderRadius: 12, padding: 16 }}>
        <table width="100%" cellPadding="8">
          <thead>
            <tr>
              <th align="left">Oil</th>
              <th align="left">Weight (g)</th>
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
              placeholder={lyeType === "NaOH" ? "default 2.5" : "default 3.0"}
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
          <button onClick={calculate} disabled={loading} className="rainbow-button">
            {loading ? "Calculating..." : "Calculate"}
          </button>
          {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
        </div>
      </div>

      {result && (
        <div
          className="rainbow-border"
          style={{
            marginTop: 16,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h2 className="rainbow-text" style={{ marginTop: 0 }}>
            Results
          </h2>
          <p style={{ marginTop: 0 }}>
            Lye: <strong>{result.total_lye_g} g</strong> ({result.lye_type}) &nbsp; • &nbsp; Water:{" "}
            <strong>{result.total_water_g} g</strong> &nbsp; • &nbsp; Water:lye used:{" "}
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

      {/* ✅ show fatty acids for ALL oils selected */}
      {rows.map((r) =>
        r.oil && fattyAcids[r.oil] ? (
          <div
            key={r.oil}
            className="rainbow-border"
            style={{ marginTop: 16, borderRadius: 12, padding: 16 }}
          >
            <h2 className="rainbow-text" style={{ marginTop: 0 }}>
              Fatty Acid Composition: {r.oil}
            </h2>
            <table width="100%" cellPadding="8">
              <thead>
                <tr>
                  <th align="left">Fatty Acid</th>
                  <th align="left">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(fattyAcids[r.oil]).map(([acid, val]) => (
                  <tr key={acid}>
                    <td>{acid}</td>
                    <td>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : r.oil ? (
          <p key={r.oil} style={{ color: "crimson" }}>
            No fatty acid data for {r.oil}
          </p>
        ) : null
      )}

      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 16 }}>
        ⚠️ Safety: lye is caustic—use protective gear, label containers, and double-check values for your specific oils.
      </p>
    </div>
  );
}
