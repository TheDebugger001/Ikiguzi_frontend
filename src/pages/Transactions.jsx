import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Icon from '../components/Icon';
import SmartTable from '../components/SmartTable';
import { adminApi } from '../API/admin';
import { extractErrorMessage } from '../API/client';

const money = n => new Intl.NumberFormat('en-RW').format(Number(n) || 0) + ' RWF';

export default function Transactions() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getPayments({ pageSize: 100 })
      .then(res => setPayments(res.data || []))
      .catch(err => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const rows = payments.map(p => ({
    id: p.id,
    reference: p.transactionReference,
    order: p.parentOrder?.orderNumber || p.parentOrderId,
    buyer: p.parentOrder?.user?.fullName || 'Unknown buyer',
    method: p.method,
    amount: p.amount,
    status: p.status,
    date: new Date(p.createdAt).toLocaleString('en-GB'),
  }));

  const totalVolume = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const successVolume = rows.filter(r => r.status === 'SUCCESS').reduce((s, r) => s + Number(r.amount || 0), 0);
  const pendingVolume = rows.filter(r => r.status === 'PENDING').reduce((s, r) => s + Number(r.amount || 0), 0);
  const failedCount = rows.filter(r => r.status === 'FAILED').length;

  return (
    <DashboardLayout admin>
      <div className="dash-page-head">
        <div><span className="eyebrow">FINANCE</span><h1>Transactions</h1><p>All marketplace payment transactions and their current state.</p></div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="metric-grid">
        <div className="metric"><div className="metric-icon"><Icon name="wallet" /></div><div><span>Total volume</span><strong>{loading ? '...' : money(totalVolume)}</strong><small>Across all transactions</small></div></div>
        <div className="metric"><div className="metric-icon"><Icon name="chart" /></div><div><span>Successful</span><strong>{loading ? '...' : money(successVolume)}</strong><small>Confirmed payments</small></div></div>
        <div className="metric"><div className="metric-icon"><Icon name="cart" /></div><div><span>Pending</span><strong>{loading ? '...' : money(pendingVolume)}</strong><small>Awaiting confirmation</small></div></div>
        <div className="metric"><div className="metric-icon"><Icon name="shield" /></div><div><span>Failed</span><strong>{loading ? '...' : failedCount}</strong><small>Needs attention</small></div></div>
      </div>
      <div className="data-card">
        {loading && <div className="empty-state"><h3>Loading transactions…</h3></div>}
        {!loading && rows.length === 0 && <div className="empty-state"><h3>No transactions yet</h3><p>Payment attempts will appear here as buyers check out.</p></div>}
        {!loading && rows.length > 0 && <SmartTable
          columns={[
            { key: 'reference', label: 'Reference' },
            { key: 'order', label: 'Order', render: r => <Link to={`/admin/orders/${r.order}`}>{r.order}</Link> },
            { key: 'buyer', label: 'Customer' },
            { key: 'method', label: 'Method' },
            { key: 'amount', label: 'Amount', render: r => money(r.amount) },
            { key: 'status', label: 'Status', render: r => <em className={`status ${r.status === 'SUCCESS' ? 'active' : r.status === 'FAILED' ? 'danger' : 'warning'}`}>{r.status}</em> },
            { key: 'date', label: 'Date' },
          ]}
          rows={rows}
          rowKey={r => r.id}
          searchPlaceholder="Search transaction, order or customer…"
          exportName="admin-transactions"
        />}
      </div>
    </DashboardLayout>
  );
}
