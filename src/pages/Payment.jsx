import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Storefront from "../components/Storefront";
import { ordersApi } from "../API/orders";
import { paymentsApi } from "../API/payments";
import { extractErrorMessage } from "../API/client";
import { getSocket } from "../services/socket";

const money = (n) => new Intl.NumberFormat("en-RW").format(Number(n) || 0) + " RWF";

export default function Payment() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [method, setMethod] = useState("momo");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState("choose"); // choose | waiting | confirmed | failed
  const [error, setError] = useState("");

  const pollRef = useRef(null);
  const pollAttempts = useRef(0);

  useEffect(() => {
    let alive = true;
    ordersApi.getById(id).then((res) => {
      if (!alive) return;
      setOrder(res.order);
      if (res.order.paymentStatus === "PAID") setStage("confirmed");
    }).catch((err) => alive && setError(extractErrorMessage(err)))
      .finally(() => alive && setLoadingOrder(false));
    return () => { alive = false; };
  }, [id]);

  // Real-time: the moment the payment webhook processes, jump straight to confirmed.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onConfirmed = (payload) => {
      if (String(payload.orderId) === String(id)) {
        clearPolling();
        setStage("confirmed");
        setTimeout(() => navigate(`/orders/${id}`), 900);
      }
    };
    socket.on("payment_confirmed", onConfirmed);
    return () => socket.off("payment_confirmed", onConfirmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function clearPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }
  useEffect(() => () => clearPolling(), []);

  // Fallback in case the socket isn't connected: poll order status for ~2 minutes.
  function startPolling() {
    clearPolling();
    pollAttempts.current = 0;
    pollRef.current = setInterval(async () => {
      pollAttempts.current += 1;
      try {
        const res = await ordersApi.getById(id);
        if (res.order.paymentStatus === "PAID") {
          clearPolling();
          setStage("confirmed");
          setTimeout(() => navigate(`/orders/${id}`), 900);
        }
      } catch { /* keep trying */ }
      if (pollAttempts.current > 40) clearPolling(); // ~2 minutes at 3s intervals
    }, 3000);
  }

  async function pay() {
    setError("");
    if ((method === "momo" || method === "kpay-momo") && !phone.trim()) {
      setError("Please enter your mobile money number.");
      return;
    }

    setStage("waiting");
    try {
      if (method === "momo") {
        await paymentsApi.initiateMoMo({ orderId: id, phoneNumber: phone.trim() });
      } else if (method === "kpay-momo") {
        await paymentsApi.initiateKpayMomo({ orderId: id, phoneNumber: phone.trim() });
      } else if (method === "kpay-card") {
        const res = await paymentsApi.initiateKpayCard({ orderId: id });
        if (res.redirectUrl) {
          window.location.href = res.redirectUrl;
          return;
        }
      }
      startPolling();
    } catch (err) {
      setError(extractErrorMessage(err));
      setStage("choose");
    }
  }

  if (loadingOrder) {
    return <Storefront><main className="payment-page"><div className="empty-state"><h3>Loading…</h3></div></main></Storefront>;
  }
  if (!order) {
    return <Storefront><main className="account-page"><div className="form-alert error">Order not found.</div></main></Storefront>;
  }

  return <Storefront><main className="payment-page">
    <div className="page-title"><span className="eyebrow">PAYMENT</span><h1>Pay for your order</h1><p>Order #{order.orderNumber} · Total {money(order.totalAmount)}</p></div>
    {error && <div className="form-alert error">{error}</div>}
    <div className="payment-layout"><section className="payment-card"><h2>Choose a payment method</h2>
      <label className={`payment-option ${method === "momo" ? "selected" : ""}`}><input type="radio" checked={method === "momo"} onChange={() => setMethod("momo")} /><span className="payment-logo">M</span><div><b>Mobile Money</b><small>MTN MoMo / Airtel Money</small></div></label>
      <label className={`payment-option ${method === "kpay-momo" ? "selected" : ""}`}><input type="radio" checked={method === "kpay-momo"} onChange={() => setMethod("kpay-momo")} /><span className="payment-logo">K</span><div><b>K-Pay Mobile Money</b><small>Alternative MoMo rail via K-Pay Rwanda</small></div></label>
      <label className={`payment-option ${method === "kpay-card" ? "selected" : ""}`}><input type="radio" checked={method === "kpay-card"} onChange={() => setMethod("kpay-card")} /><span className="payment-logo">▣</span><div><b>Visa / Mastercard</b><small>Pay with your bank card via K-Pay</small></div></label>
      {(method === "momo" || method === "kpay-momo") && (
        <div className="payment-fields"><label className="field"><span>Mobile number</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 7xx xxx xxx" disabled={stage === "waiting"} /></label></div>
      )}
      <button className="gradient-btn full" onClick={pay} disabled={stage === "waiting" || stage === "confirmed"}>
        {stage === "confirmed" ? "Payment confirmed ✓" : stage === "waiting" ? "Waiting for confirmation…" : "Pay securely"}
      </button>
      {stage === "waiting" && (
        <p className="tiny">
          {method === "kpay-card"
            ? "Complete the card checkout, we'll confirm automatically."
            : "Approve the USSD prompt on your phone to complete payment. This page updates automatically."}
        </p>
      )}
    </section><aside className="security-panel"><div className="secure-icon">✓</div><h3>How MVEC works</h3><p>Your payment is held by MVEC until delivery is confirmed, then released to the seller. This page updates the moment your payment is confirmed.</p><div className="status-flow"><span>Payment</span><i>→</i><span>MVEC holds</span><i>→</i><span>Delivery</span><i>→</i><span>Release</span></div><p className="tiny">After payment, your delivery OTP is generated and required at the door to confirm receipt.</p></aside></div>
  </main></Storefront>;
}
