import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import Icon from "../components/Icon";
import Pagination from "../components/Pagination";
import { suppliersApi } from "../API/suppliers";
import { conversationsApi } from "../API/conversations";
import { extractErrorMessage } from "../API/client";

export default function VendorNetwork() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [contacting, setContacting] = useState("");
  const perPage = 6;

  useEffect(() => {
    suppliersApi.getAll({ pageSize: 100 })
      .then(res => setSuppliers(res.data || []))
      .catch(err => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => suppliers.filter(s => `${s.businessName} ${s.locationId || ""}`.toLowerCase().includes(q.trim().toLowerCase())),
    [suppliers, q],
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / perPage)));
  const rows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const contactSupplier = async (s) => {
    setError("");
    setContacting(s.id);
    try {
      await conversationsApi.create({ recipientId: s.userId });
      navigate("/vendor/messages");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setContacting("");
    }
  };

  return (
    <DashboardLayout>
      <div className="dash-page-head">
        <div><span className="eyebrow">B2B MARKETPLACE</span><h1>Find suppliers</h1><p>Discover verified suppliers on MVEC and start a conversation to source wholesale stock.</p></div>
      </div>
      <div className="dash-toolbar">
        <div className="dash-filter"><Icon name="search" /><input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search suppliers or location…" /></div>
        <span className="table-count">{filtered.length} supplier{filtered.length === 1 ? "" : "s"}</span>
      </div>
      {error && <div className="form-error">{error}</div>}
      {loading && <div className="empty-state"><h3>Loading suppliers…</h3></div>}
      {!loading && rows.length === 0 && <div className="data-card table-empty">No suppliers match your search yet.</div>}
      {!loading && rows.length > 0 && (
        <div className="dash-grid supplier-search-grid">
          {rows.map(s => (
            <div className="data-card" key={s.id}>
              <div className="data-card-head">
                <div><h3>{s.businessName}</h3><span>{s.locationId || "Rwanda"}</span></div>
                {s.verificationStatus === "VERIFIED" && <em className="status active">Verified ✓</em>}
              </div>
              <div className="profile-detail">
                <span>Rating: <b>{Number(s.ratingAvg || 0).toFixed(1)}/5</b></span>
                <span>Contact: <b>{s.phone}</b></span>
              </div>
              <button className="gradient-btn" onClick={() => contactSupplier(s)} disabled={contacting === s.id}>
                {contacting === s.id ? "Starting chat…" : "Message supplier"}
              </button>
            </div>
          ))}
        </div>
      )}
      <Pagination page={safePage} setPage={setPage} total={filtered.length} perPage={perPage} />
      <div className="verified-box"><b>✓ B2B trust</b><p>MVEC verifies suppliers and tracks messages, orders, delivery proof and disputes. Message a supplier to discuss stock, pricing and minimum order quantities before placing a wholesale order.</p></div>
    </DashboardLayout>
  );
}
