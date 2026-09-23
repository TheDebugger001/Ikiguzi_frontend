import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Icon from '../components/Icon';
import { ordersApi } from '../API/orders';
import { extractErrorMessage } from '../API/client';

const money = n => new Intl.NumberFormat('en-RW').format(Number(n) || 0) + ' RWF';
const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED'];

export default function SellerOrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ordersApi.getById(id)
      .then(res => setOrder(res.order))
      .catch(err => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <DashboardLayout admin={isAdmin}><div className="empty-state"><h3>Loading order…</h3></div></DashboardLayout>;
  }
  if (error || !order) {
    return <DashboardLayout admin={isAdmin}><div className="form-error">{error || 'Order not found.'}</div></DashboardLayout>;
  }

  const idx = Math.max(0, STEPS.indexOf(order.orderStatus));
  const commission = order.items?.reduce((s, it) => s + it.price * it.quantity, 0) * 0.1 || 0;

  return (
    <DashboardLayout admin={isAdmin}>
      <div className="dash-page-head">
        <div><span className="eyebrow">ORDER / TRANSACTION</span><h1>{order.orderNumber}</h1><p>Full order details, customer details and complete order history.</p></div>
        <Link className="outline-btn" to={isAdmin ? '/admin/orders' : '/vendor/orders'}>← Orders</Link>
      </div>
      <div className="detail-grid">
        <section className="data-card">
          <div className="data-card-head"><div><h3>Order details</h3><span>{new Date(order.createdAt).toLocaleDateString('en-GB')}</span></div><em className="status active">{order.orderStatus}</em></div>
          {order.items?.map(it => (
            <div className="order-product" key={it.id}>
              <div><b>{it.name}</b><small>Quantity: {it.quantity}</small><strong>{money(it.price * it.quantity)}</strong></div>
            </div>
          ))}
          <div className="order-summary-lines">
            <span>Subtotal <b>{money(order.totalAmount)}</b></span>
            <span>MVEC commission <b>-{money(commission)}</b></span>
            <span className="grand">Seller eligible <b>{money(Math.max(0, order.totalAmount - commission))}</b></span>
          </div>
        </section>
        <section className="data-card">
          <h3>Customer details</h3>
          <div className="profile-detail">
            <b>{order.user?.fullName || 'Buyer'}</b>
            <span>{order.user?.email || ''}</span>
            <span>{order.shippingCity}, {order.shippingCountry}</span>
            <span>{order.shippingStreet}</span>
          </div>
          <h3 className="subhead">Payment</h3>
          <span className={`status ${order.paymentStatus === 'PAID' ? 'active' : 'warning'}`}>{order.paymentStatus}</span>
        </section>
      </div>
      <section className="data-card">
        <div className="data-card-head"><div><h3>Order history</h3><span>Track the lifecycle from pending to delivery</span></div></div>
        <div className="timeline">
          {STEPS.map((s, i) => (
            <div className={'timeline-item ' + (i <= idx ? 'done' : '')} key={s}>
              <i /><div><b>{s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')}</b><small>{i === idx ? 'Current status' : 'MVEC workflow event'}</small></div>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
