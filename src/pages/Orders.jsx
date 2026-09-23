import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination";
import Storefront from "../components/Storefront";
import { ordersApi } from "../API/orders";
import { extractErrorMessage } from "../API/client";

const money = (n) => new Intl.NumberFormat("en-RW").format(Number(n) || 0) + " RWF";
const fmt = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const CANCEL_WINDOW_MS = 30 * 60 * 1000;
const canCancel = (o) =>
  ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.orderStatus) &&
  (o.paymentStatus !== "PAID" || Date.now() - new Date(o.createdAt).getTime() <= CANCEL_WINDOW_MS);

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const load = () => {
    ordersApi.getMyOrders()
      .then((res) => setOrders(res.orders || []))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const timer = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(
    () => orders.filter((o) => JSON.stringify(o).toLowerCase().includes(q.toLowerCase())),
    [orders, q, tick],
  );
  const shown = filtered.slice((page - 1) * 5, page * 5);

  const cancel = async (id) => {
    setError("");
    try {
      const res = await ordersApi.cancel(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? res.order : o)));
      setMessage(res.message);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (loading) {
    return <Storefront><main className="account-page"><div className="empty-state"><h3>Loading your orders…</h3></div></main></Storefront>;
  }

  return <Storefront><main className="account-page">
    <div className="page-title"><span className="eyebrow">PURCHASES</span><h1>My orders</h1><p>Track payment, delivery and protected settlement from one place.</p></div>
    <div className="dash-toolbar"><div className="dash-filter"><span>⌕</span><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search orders, products, vendors or status…" /></div></div>
    {message && <div className="form-alert success">{message}</div>}
    {error && <div className="form-alert error">{error}</div>}

    {orders.length === 0 && (
      <div className="empty-state"><h3>No orders yet</h3><p>Once you check out, your orders will show up here.</p></div>
    )}

    {orders.length > 0 && (
      <>
        <div className="orders-table">
          <div className="table-head"><span>Order</span><span>Product</span><span>Total</span><span>Payment</span><span>Delivery</span><span>Time left</span></div>
          {shown.map((o) => {
            const remaining = o.paymentStatus === "PAID" ? CANCEL_WINDOW_MS - (Date.now() - new Date(o.createdAt).getTime()) : 0;
            return (
              <div className="table-row" key={o.id}>
                <Link to={"/orders/" + o.id}><b>{o.orderNumber}</b></Link>
                <span>{o.items?.[0]?.name || "Order"}</span>
                <span>{money(o.totalAmount)}</span>
                <span className={`status ${(o.paymentStatus || "").toLowerCase()}`}>{o.paymentStatus}</span>
                <span>{o.orderStatus}</span>
                <span>{o.orderStatus === "CANCELLED" ? "Cancelled" : remaining > 0 ? fmt(remaining) : "N/A"}</span>
                {canCancel(o) && <button className="outline-btn" onClick={() => cancel(o.id)}>Cancel order</button>}
              </div>
            );
          })}
        </div>
        <Pagination page={Math.min(page, Math.max(1, Math.ceil(filtered.length / 5)))} setPage={setPage} total={filtered.length} perPage={5} />
      </>
    )}

    <div className="verified-box"><b>🔒 Protected payment & delivery window</b><p>After successful payment, MVEC records the funds as HELD. You have 30 minutes to cancel. The delivery window is three hours; if delivery is not confirmed before it expires, the order is cancelled and a full refund is recorded.</p></div>
    <Link className="gradient-btn" to="/shop">Continue shopping</Link>
  </main></Storefront>;
}
