import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DeliveryTracking from "../components/DeliveryTracking";

function Overview() {
  return (
    <>
      <div className="dash-page-head">
        <div>
          <span className="eyebrow">DELIVERY</span>
          <h1>Delivery dashboard</h1>
          <p>Confirm deliveries with the buyer OTP and keep the delivery record accurate.</p>
        </div>
      </div>
      <div className="verified-box">
        <b>Delivery confirmation</b>
        <p>When you reach the buyer, ask for the six-digit OTP shown on their order. Entering the correct OTP marks the order as delivered and releases the protected settlement to the seller.</p>
      </div>
      <DeliveryTracking role="delivery" />
    </>
  );
}

export default function DeliveryDashboard() {
  const path = useLocation().pathname;
  return (
    <DashboardLayout>
      {path.includes("/deliveries") ? <DeliveryTracking role="delivery" /> : <Overview />}
    </DashboardLayout>
  );
}
