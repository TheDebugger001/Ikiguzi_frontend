import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Icon from '../components/Icon';
import Pagination from '../components/Pagination';
import DeliveryTracking from '../components/DeliveryTracking';
import NotificationPanel from '../components/NotificationPanel';
import { productsApi } from '../API/products';
import { categoriesApi } from '../API/categories';
import { uploadsApi } from '../API/uploads';
import { ordersApi } from '../API/orders';
import { payoutsApi } from '../API/payouts';
import { extractErrorMessage } from '../API/client';

const money = n => new Intl.NumberFormat('en-RW').format(Number(n) || 0) + ' RWF';
const readJSON = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };

const modules = {
  stores:[['Kigali Tech Store','Electronics','148','4.9','Active'],['Kigali Tech Outlet','Computers','64','4.7','Pending']],
  customers:[['Aline Uwase','12','2,450,000 RWF','26 Aug 2026'],['Jean Paul','7','1,180,000 RWF','26 Aug 2026'],['Mugisha Eric','5','780,000 RWF','27 Aug 2026'],['Claudine Mukamana','3','425,000 RWF','27 Aug 2026'],['Patrick N.','2','214,000 RWF','27 Aug 2026'],['Diane U.','9','1,920,000 RWF','25 Aug 2026'],['Kevin M.','4','530,000 RWF','24 Aug 2026']],
  promotions:[['Back to School','SCHOOL15','15%','Active','10 Sep 2026'],['Weekend Tech Sale','TECH10','10%','Scheduled','05 Sep 2026'],['Free Delivery','FREESHIP','Free shipping','Active','30 Sep 2026']],
  reviews:[['Wireless Headphones','Aline Uwase','5 stars','Great sound and battery','26 Aug 2026'],['Smart Watch Active','Jean Paul','4 stars','Good value','25 Aug 2026'],['Professional Camera Kit','Mugisha Eric','5 stars','Excellent camera','24 Aug 2026']],
  shipping:[['Kigali','2,000 RWF','Same day','Standard / Pickup','Active'],['Outside Kigali','5,000 RWF','1-3 days','Standard','Active'],['Free shipping','Orders over 150,000 RWF','1-3 days','Standard','Active']],
  team:[['Eric M.','Owner','All permissions','Active'],['Sarah K.','Store Manager','Products, Orders, Analytics','Active'],['David N.','Inventory Manager','Inventory, Products','Active'],['Alice R.','Sales Staff','Orders, Customers','Active']],
  reports:[['Sales report','01 Aug - 27 Aug','Live in Analytics','View'],['Product performance','01 Aug - 27 Aug','Live in Products','View'],['Inventory report','Today','Live in Inventory','View']],
  settings:[['Store information','Manage in Store Settings','Active','N/A'],['Business information','Rwanda · Kigali','Complete','N/A'],['Payment & payouts','Configured via Payouts','Configured','N/A'],['Shipping','Kigali / Outside Kigali','Configured','N/A'],['Notifications','Orders · Stock · Payouts','Enabled','N/A'],['Security','Password + sessions','Protected','N/A']],
};

const cfg={
 stores:{title:'My Stores',desc:'Manage your store identity, status and policies.',headers:['Store','Category','Products','Rating','Status'],icon:'shop'},
 customers:{title:'Customers',desc:'Customer records belonging to your store only.',headers:['Customer','Orders','Total spent','Last purchase'],icon:'users'},
 promotions:{title:'Promotions',desc:'Create percentage, fixed, coupon, flash-sale and shipping promotions.',headers:['Promotion','Code','Discount','Status','Ends'],icon:'tag'},
 reviews:{title:'Reviews',desc:'View product ratings and respond professionally; moderation stays with Admin.',headers:['Product','Customer','Rating','Review','Date'],icon:'heart'},
 shipping:{title:'Shipping',desc:'Configure zones, delivery fees, methods and pickup options.',headers:['Zone','Fee','Delivery','Method','Status'],icon:'shop'},
 team:{title:'Team / Staff',desc:'Seller-level RBAC for your employees and store operations.',headers:['Member','Role','Permissions','Status'],icon:'users'},
 reports:{title:'Reports',desc:'Sales, product and inventory reporting.',headers:['Report','Range','Summary','Action'],icon:'chart'},
 settings:{title:'Settings',desc:'Manage store, business, payout, shipping, notification and security settings.',headers:['Setting','Current value','Status','Last updated'],icon:'settings'},
};

function Metric({label,value,icon,sub}){return <div className="metric"><div className="metric-icon"><Icon name={icon}/></div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></div>}

function SellerOverview(){
  const [products,setProducts]=useState([]);
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    Promise.allSettled([productsApi.getVendorProducts(), ordersApi.getVendorOrders()]).then(([pRes,oRes])=>{
      if(!alive) return;
      if(pRes.status==='fulfilled') setProducts(pRes.value.products||[]);
      if(oRes.status==='fulfilled') setOrders((oRes.value.orders||[]).slice(0,5));
    }).finally(()=>alive&&setLoading(false));
    return ()=>{alive=false};
  },[]);

  const lowStock=products.filter(p=>Number(p.stockQuantity)<=Number(p.lowStockThreshold||5));

  return <>
    <div className="dash-page-head"><div><span className="eyebrow">SELLER PLATFORM</span><h1>Good morning, Seller</h1><p>Everything you need to operate your MVEC store.</p></div></div>
    <div className="metric-grid">
      <Metric label="Products" value={loading?'...':products.length} icon="box" sub="Published catalog"/>
      <Metric label="Low-stock items" value={loading?'...':lowStock.length} icon="bell" sub="Needs attention"/>
      <Metric label="Recent orders" value={loading?'...':orders.length} icon="cart" sub="Latest activity"/>
    </div>
    <div className="dash-grid">
      <div className="data-card"><div className="data-card-head"><div><h3>Inventory alerts</h3><span>Reorder soon</span></div><Link to="/vendor/inventory">View all</Link></div>
        {!loading && lowStock.length===0 && <p className="tiny">No low-stock items right now.</p>}
        {lowStock.slice(0,6).map(p=><div className="activity-row" key={p.id}><div><b>{p.name}</b><small>{p.stockQuantity} units remaining</small></div><em className="status warning">Low stock</em></div>)}
      </div>
      <div className="data-card"><div className="data-card-head"><div><h3>Recent orders</h3><span>Latest customer activity</span></div><Link to="/vendor/orders">View all</Link></div>
        {!loading && orders.length===0 && <p className="tiny">No orders yet.</p>}
        {orders.map(o=><div className="activity-row" key={o._id}><div><b>{o.orderNumber}</b><small>{o.user?.fullName||'Buyer'}</small></div><div><strong>{money(o.vendorSubtotal)}</strong><em className={'status '+(o.paymentStatus==='PAID'?'active':'warning')}>{o.orderStatus}</em></div></div>)}
      </div>
    </div>
  </>;
}

const emptyProduct={name:'',sku:'',categoryId:'',brand:'',shortDescription:'',description:'',price:'',discountPrice:'',costPrice:'',stockQuantity:'',lowStockThreshold:5,status:'DRAFT',mainImage:'',gallery:[],color:'',size:'',material:'',weight:'',capacity:'',model:''};

function ProductForm({product,onSave,onCancel,saving}){
  const [form,setForm]=useState(()=>{
    if(!product) return {...emptyProduct};
    return {
      ...emptyProduct,...product,
      categoryId: product.category?.id || product.categoryId || '',
      gallery: Array.isArray(product.gallery)?product.gallery:[],
    };
  });
  const [categories,setCategories]=useState([]);
  const [newCategory,setNewCategory]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  useEffect(()=>{ categoriesApi.getAll().then(res=>setCategories(res.categories||[])).catch(()=>{}); },[]);

  const update=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const addCategory=async()=>{
    const name=newCategory.trim();
    if(!name) return;
    setNotice('');
    try{
      const res=await categoriesApi.create({name});
      if(res.alreadyExisted){
        setNotice(res.message);
        setCategories(c=>c.some(x=>x.id===res.category.id)?c:[...c,res.category]);
      }else{
        setCategories(c=>[...c,res.category]);
      }
      setForm(f=>({...f,categoryId:res.category.id}));
      setNewCategory('');
    }catch(err){ setError(extractErrorMessage(err)); }
  };
  const [uploading,setUploading]=useState(false);
  const addImages=async(e)=>{
    const files=[...e.target.files||[]];
    e.target.value='';
    if(!files.length) return;
    setUploading(true);
    setError('');
    try{
      const res=await uploadsApi.uploadImages(files);
      const urls=res.urls||[];
      setForm(f=>({...f,mainImage:f.mainImage||urls[0]||'',gallery:[...f.gallery,...urls]}));
    }catch(err){ setError(extractErrorMessage(err)); }
    finally{ setUploading(false); }
  };
  const removeImage=i=>setForm(f=>{
    const nextGallery=f.gallery.filter((_,x)=>x!==i);
    return {...f,gallery:nextGallery,mainImage:nextGallery[0]||''};
  });

  const submit=e=>{
    e.preventDefault();
    setError('');
    if(!form.name||!form.categoryId||form.price===''||form.stockQuantity===''||!form.mainImage){
      setError('Please complete the required fields and add at least one image.');
      return;
    }
    onSave({
      ...form,
      price:Number(form.price),
      discountPrice:form.discountPrice===''?null:Number(form.discountPrice),
      costPrice:form.costPrice===''?null:Number(form.costPrice),
      stockQuantity:Number(form.stockQuantity),
      lowStockThreshold:Number(form.lowStockThreshold||5),
    });
  };

  return <div className="product-editor"><div className="editor-head"><div><span className="eyebrow">PRODUCT CATALOG</span><h2>{product?'Edit product':'Add product'}</h2><p>Complete product information before publishing it to the MVEC marketplace.</p></div><button className="outline-btn" type="button" onClick={onCancel}>Cancel</button></div>
    {error&&<div className="form-error">{error}</div>}
    {notice&&<div className="form-alert success">{notice}</div>}
    <form onSubmit={submit} className="product-form">
      <section className="editor-section"><h3>Basic information</h3>
        <div className="two-col"><label className="field"><span>Product name *</span><input name="name" value={form.name} onChange={update} required placeholder="e.g. Samsung Galaxy S25"/></label><label className="field"><span>SKU</span><input name="sku" value={form.sku||''} onChange={update} placeholder="Auto-generated if left blank"/></label></div>
        <div className="two-col"><label className="field"><span>Category *</span><select name="categoryId" value={form.categoryId} onChange={update} required><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="field"><span>Brand</span><input name="brand" value={form.brand||''} onChange={update} placeholder="Brand name"/></label></div>
        <div className="inline-add-category"><input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="New category name"/><button type="button" className="outline-btn" onClick={addCategory}>+ Add category</button></div>
        <label className="field"><span>Short description</span><input name="shortDescription" value={form.shortDescription||''} onChange={update} maxLength="180" placeholder="A short summary shown on product cards"/></label>
        <label className="field"><span>Description *</span><textarea name="description" value={form.description||''} onChange={update} rows="5" required placeholder="Describe the product, benefits and important information"/></label>
      </section>
      <section className="editor-section"><h3>Pricing & inventory</h3>
        <div className="three-col"><label className="field"><span>Selling price (RWF) *</span><input type="number" min="0" name="price" value={form.price} onChange={update} required/></label><label className="field"><span>Discount price</span><input type="number" min="0" name="discountPrice" value={form.discountPrice||''} onChange={update}/></label><label className="field"><span>Cost price</span><input type="number" min="0" name="costPrice" value={form.costPrice||''} onChange={update}/></label></div>
        <div className="three-col"><label className="field"><span>Stock quantity *</span><input type="number" min="0" name="stockQuantity" value={form.stockQuantity} onChange={update} required/></label><label className="field"><span>Low stock threshold</span><input type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={update}/></label><label className="field"><span>Status</span><select name="status" value={form.status} onChange={update}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div>
      </section>
      <section className="editor-section"><h3>Product attributes</h3>
        <div className="three-col">{[['color','Color'],['size','Size'],['material','Material'],['weight','Weight'],['capacity','Capacity'],['model','Model']].map(([name,label])=><label className="field" key={name}><span>{label}</span><input name={name} value={form[name]||''} onChange={update} placeholder={label}/></label>)}</div>
      </section>
      <section className="editor-section"><h3>Media</h3><p className="editor-help">Upload product images. The first image becomes the main product image.</p>
        <label className="upload-zone"><Icon name="box"/><b>{uploading?'Uploading…':'Upload product images'}</b><small>PNG, JPG or WEBP, multiple files supported (max 8MB each)</small><input type="file" accept="image/*" multiple onChange={addImages} disabled={uploading}/></label>
        {form.gallery.length>0&&<div className="media-grid">{form.gallery.map((src,i)=><div className="media-thumb" key={i}><img src={src} alt={`Product ${i+1}`}/><button type="button" onClick={()=>removeImage(i)}>×</button>{i===0&&<span>Main image</span>}</div>)}</div>}
      </section>
      <div className="editor-actions"><button type="button" className="outline-btn" onClick={onCancel}>Cancel</button><button className="gradient-btn" type="submit" disabled={saving||uploading}>{saving?'Saving...':product?'Save changes':'Create product'}</button></div>
    </form>
  </div>;
}

function ProductModule(){
  const location=useLocation();
  const navigate=useNavigate();
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);
  const [page,setPage]=useState(1);
  const [q,setQ]=useState('');
  const [statusFilter,setStatusFilter]=useState('');
  const per=6;

  const load=()=>{
    setLoading(true);
    productsApi.getVendorProducts()
      .then(res=>setRows(res.products||[]))
      .catch(err=>setError(extractErrorMessage(err)))
      .finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  useEffect(()=>{
    const params=new URLSearchParams(location.search);
    if(params.get('add')==='1'){ setEditing({mode:'create'}); navigate('/vendor/products',{replace:true}); }
  },[location.search,navigate]);

  useEffect(()=>{
    if(!editing) return;
    const onKeyDown=e=>{if(e.key==='Escape') setEditing(null);};
    document.addEventListener('keydown',onKeyDown);
    return()=>document.removeEventListener('keydown',onKeyDown);
  },[editing]);

  const filtered=useMemo(()=>rows.filter(p=>JSON.stringify(p).toLowerCase().includes(q.toLowerCase())&&(!statusFilter||p.status===statusFilter)),[rows,q,statusFilter]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/per));
  const current=Math.min(page,totalPages);
  const shown=filtered.slice((current-1)*per,current*per);

  const closeEditor=()=>{
    setEditing(null);
    if(new URLSearchParams(location.search).get('add')==='1') navigate('/vendor/products',{replace:true});
  };

  const saveProduct=async(payload)=>{
    setSaving(true);
    setError('');
    try{
      if(editing?.mode==='create') await productsApi.create(payload);
      else await productsApi.update(editing.product.id,payload);
      setEditing(null);
      load();
      navigate('/vendor/products',{replace:true});
    }catch(err){ setError(extractErrorMessage(err)); }
    finally{ setSaving(false); }
  };

  const toggleArchive=async(p)=>{
    try{
      await productsApi.update(p.id,{status:p.status==='INACTIVE'?'ACTIVE':'INACTIVE'});
      load();
    }catch(err){ setError(extractErrorMessage(err)); }
  };

  const removeProduct=async(p)=>{
    if(!window.confirm(`Delete ${p.name}?`)) return;
    try{ await productsApi.delete(p.id); load(); }
    catch(err){ setError(extractErrorMessage(err)); }
  };

  return <>
    <div className="dash-page-head">
      <div><span className="eyebrow">SELLER PLATFORM</span><h1>Products</h1><p>Manage product details, pricing, stock, media and publishing status.</p></div>
      <button type="button" className="gradient-btn" onClick={()=>setEditing({mode:'create'})}><Icon name="plus"/> Add product</button>
    </div>
    {error&&<div className="form-error">{error}</div>}
    <div className="dash-toolbar">
      <div className="dash-filter"><Icon name="search"/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search products, SKU, brand or category"/></div>
      <select className="table-filter-select" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}}><option value="">All statuses</option>{[...new Set(rows.map(p=>p.status).filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select>
    </div>
    <div className="data-card">
      <div className="data-card-head"><div><h3>Product catalog</h3><span>{filtered.length} products</span></div><span className="muted">Create, edit, archive, delete</span></div>
      {loading && <div className="empty-state"><h3>Loading products…</h3></div>}
      {!loading && shown.length===0 && <div className="empty-state"><h3>No products yet</h3><p>Add your first product to start selling.</p></div>}
      {!loading && <div className="product-admin-list">
        {shown.map(p=><div className="product-admin-row" key={p.id}>
          <div className="admin-product-main">{p.mainImage?<img src={p.mainImage} alt=""/>:<div className="product-placeholder"><Icon name="box"/></div>}<div><b>{p.name}</b><small>{p.sku} · {p.brand||'No brand'} · {p.category?.name||''}</small></div></div>
          <div><b>{money(p.price)}</b><small>Stock: {p.stockQuantity}</small></div>
          <em className={'status '+(p.status==='ACTIVE'?'active':'warning')}>{p.status}</em>
          <div className="row-actions"><button type="button" title="Edit product" onClick={()=>setEditing({mode:'edit',product:p})}><Icon name="edit"/></button><button type="button" title={p.status==='INACTIVE'?'Restore product':'Archive product'} onClick={()=>toggleArchive(p)}><Icon name={p.status==='INACTIVE'?'check':'box'}/></button><button type="button" title="Delete product" onClick={()=>removeProduct(p)}><Icon name="trash"/></button></div>
        </div>)}
      </div>}
      <Pagination page={current} setPage={setPage} total={filtered.length} perPage={per}/>
    </div>
    {editing&&typeof document!=='undefined'&&createPortal(
      <div className="product-editor-backdrop" role="dialog" aria-modal="true" aria-label={editing.mode==='create'?'Add product':'Edit product'} onMouseDown={e=>{if(e.target===e.currentTarget) closeEditor();}}>
        <div className="product-editor-modal" onMouseDown={e=>e.stopPropagation()}>
          <ProductForm product={editing.mode==='edit'?editing.product:null} onCancel={closeEditor} onSave={saveProduct} saving={saving}/>
        </div>
      </div>,
      document.body
    )}
  </>;
}

function InventoryModule(){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState('');
  const [page,setPage]=useState(1);
  const per=8;
  useEffect(()=>{ productsApi.getVendorProducts().then(res=>setRows(res.products||[])).finally(()=>setLoading(false)); },[]);
  const filtered=useMemo(()=>rows.filter(p=>JSON.stringify(p).toLowerCase().includes(q.toLowerCase())),[rows,q]);
  const shown=filtered.slice((page-1)*per,page*per);
  return <>
    <div className="dash-page-head"><div><span className="eyebrow">SELLER PLATFORM</span><h1>Inventory</h1><p>Monitor stock levels across your published catalog.</p></div></div>
    <div className="dash-toolbar"><div className="dash-filter"><Icon name="search"/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search products"/></div></div>
    <div className="data-card"><div className="data-table">
      <div className="data-row module-row"><span className="table-label">Product</span><span className="table-label">SKU</span><span className="table-label">On hand</span><span className="table-label">Threshold</span><span className="table-label">Status</span></div>
      {loading && <div className="empty-state"><h3>Loading…</h3></div>}
      {!loading && shown.map(p=><div className="data-row module-row" key={p.id}><span><b>{p.name}</b></span><span>{p.sku}</span><span>{p.stockQuantity}</span><span>{p.lowStockThreshold}</span><span><em className={'status '+(p.stockQuantity<=p.lowStockThreshold?'warning':'active')}>{p.stockQuantity<=p.lowStockThreshold?'Low stock':p.status}</em></span></div>)}
    </div><Pagination page={page} setPage={setPage} total={filtered.length} perPage={per}/></div>
  </>;
}

function VendorOrders(){
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [q,setQ]=useState('');
  const [page,setPage]=useState(1);
  const per=6;

  const load=()=>{
    ordersApi.getVendorOrders().then(res=>setOrders(res.orders||[])).catch(err=>setError(extractErrorMessage(err))).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const filtered=useMemo(()=>orders.filter(o=>JSON.stringify(o).toLowerCase().includes(q.toLowerCase())),[orders,q]);
  const shown=filtered.slice((page-1)*per,page*per);

  const updateStatus=async(orderId,status)=>{
    try{
      await ordersApi.updateVendorOrderStatus({orderId,status});
      load();
    }catch(err){ setError(extractErrorMessage(err)); }
  };

  return <>
    <div className="dash-page-head"><div><span className="eyebrow">SELLER PLATFORM</span><h1>Orders</h1><p>Manage orders containing your products.</p></div></div>
    {error&&<div className="form-error">{error}</div>}
    <div className="dash-toolbar"><div className="dash-filter"><Icon name="search"/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search orders, buyers"/></div></div>
    <div className="data-card">
      {loading && <div className="empty-state"><h3>Loading orders…</h3></div>}
      {!loading && shown.length===0 && <div className="empty-state"><h3>No orders yet</h3><p>Orders containing your products will appear here.</p></div>}
      {!loading && <div className="data-table">
        <div className="data-row module-row"><span className="table-label">Order</span><span className="table-label">Buyer</span><span className="table-label">Total</span><span className="table-label">Payment</span><span className="table-label">Status</span><span className="table-label">Update</span></div>
        {shown.map(o=><div className="data-row module-row" key={o._id}>
          <span><b>{o.orderNumber}</b></span>
          <span>{o.user?.fullName||'Buyer'}</span>
          <span>{money(o.vendorSubtotal)}</span>
          <span><em className={'status '+(o.paymentStatus==='PAID'?'active':'warning')}>{o.paymentStatus}</em></span>
          <span>{o.orderStatus}</span>
          <span><select className="inline-table-input" value={o.orderStatus} onChange={e=>updateStatus(o._id,e.target.value)}>{['PENDING','CONFIRMED','PROCESSING','READY_FOR_SHIPMENT','SHIPPED','DELIVERED','CANCELLED'].map(s=><option key={s} value={s}>{s}</option>)}</select></span>
        </div>)}
      </div>}
      <Pagination page={page} setPage={setPage} total={filtered.length} perPage={per}/>
    </div>
  </>;
}

function VendorPayouts(){
  const [balance,setBalance]=useState(null);
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);
  const [amount,setAmount]=useState('');
  const [accountName,setAccountName]=useState('');
  const [accountNumber,setAccountNumber]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  const load=()=>{
    Promise.allSettled([payoutsApi.getBalance(),payoutsApi.getHistory()]).then(([bRes,hRes])=>{
      if(bRes.status==='fulfilled') setBalance(bRes.value.balance);
      if(hRes.status==='fulfilled') setHistory(hRes.value.payouts||[]);
    }).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const requestPayout=async(e)=>{
    e.preventDefault();
    setError(''); setMessage('');
    if(!amount||!accountName||!accountNumber){ setError('Please complete amount, account name and phone number.'); return; }
    setBusy(true);
    try{
      const res=await payoutsApi.requestPayout({amount:Number(amount),payoutDetails:{accountName,accountNumber}});
      setMessage(res.message);
      setAmount(''); setAccountName(''); setAccountNumber('');
      load();
    }catch(err){ setError(extractErrorMessage(err)); }
    finally{ setBusy(false); }
  };

  return <>
    <div className="dash-page-head"><div><span className="eyebrow">SELLER PLATFORM</span><h1>Payouts</h1><p>Track available balance and request withdrawals.</p></div></div>
    {loading && <div className="empty-state"><h3>Loading…</h3></div>}
    {!loading && <>
      <div className="metric-grid">
        <Metric label="Available" value={money(balance?.availableBalance)} icon="wallet" sub="Ready to withdraw"/>
        <Metric label="Pending" value={money(balance?.pendingBalance)} icon="wallet" sub="Held until delivery"/>
        <Metric label="Total earned" value={money(balance?.totalEarned)} icon="chart" sub="All-time"/>
      </div>
      <div className="dash-grid">
        <div className="data-card"><h3>Request payout</h3>
          {message&&<div className="form-alert success">{message}</div>}
          {error&&<div className="form-error">{error}</div>}
          <form onSubmit={requestPayout}>
            <label className="field"><span>Amount (RWF)</span><input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
            <label className="field"><span>Account name</span><input value={accountName} onChange={e=>setAccountName(e.target.value)}/></label>
            <label className="field"><span>Mobile money number</span><input value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} placeholder="+250 7xx xxx xxx"/></label>
            <button className="gradient-btn" type="submit" disabled={busy}>{busy?'Requesting…':'Request payout'}</button>
          </form>
        </div>
        <div className="data-card"><h3>Payout history</h3>
          {history.length===0&&<p className="tiny">No payouts yet.</p>}
          {history.map(p=><div className="activity-row" key={p.id}><div><b>{p.payoutNumber}</b><small>{p.bankName}</small></div><div><strong>{money(p.amount)}</strong><em className={'status '+(p.status==='PAID'?'active':'warning')}>{p.status}</em></div></div>)}
        </div>
      </div>
    </>}
  </>;
}

function ModulePage({type}){const c=cfg[type],initial=modules[type]||[];const storageKey=`mvec_vendor_${type}`;const [rows,setRows]=useState(()=>readJSON(storageKey,initial));const [page,setPage]=useState(1);const [q,setQ]=useState('');const [statusFilter,setStatusFilter]=useState('');const [editing,setEditing]=useState(null);const filtered=useMemo(()=>rows.filter(r=>(Array.isArray(r)?r.join(' '):JSON.stringify(r)).toLowerCase().includes(q.toLowerCase())&&(!statusFilter||String(r[r.length-1])===statusFilter)),[rows,q,statusFilter]);const per=6;const totalPages=Math.max(1,Math.ceil(filtered.length/per));const current=Math.min(page,totalPages);const shown=filtered.slice((current-1)*per,current*per);const editable=['stores','promotions','team','shipping'].includes(type);const add=()=>{if(type==='team')setEditing({row:['New staff member','Sales Staff','Orders, Customers','Active'],new:true});else if(type==='stores')setEditing({row:['New Store','Electronics','0','New','Pending'],new:true});else if(type==='promotions')setEditing({row:['New promotion','CODE','10%','Draft','30 Sep 2026'],new:true});else if(type==='shipping')setEditing({row:['New zone','0 RWF','1-3 days','Standard','Active'],new:true});};const saveEdit=(nextRow,isNew,original)=>{const next=isNew?[nextRow,...rows]:rows.map(r=>r===original?nextRow:r);setRows(next);localStorage.setItem(storageKey,JSON.stringify(next));setEditing(null);setPage(1)};const statuses=[...new Set(rows.map(r=>String(r[r.length-1]??'')).filter(Boolean))];return <><div className="dash-page-head"><div><span className="eyebrow">SELLER PLATFORM</span><h1>{c.title}</h1><p>{c.desc}</p></div>{editable&&<button className="gradient-btn" onClick={add}><Icon name="plus"/> Add {type==='team'?'staff member':type==='stores'?'store':type.slice(0,-1)}</button>}</div><div className="dash-toolbar"><div className="dash-filter"><Icon name="search"/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder={`Search ${c.title.toLowerCase()}`}/></div>{statuses.length>1&&<select className="table-filter-select" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}}><option value="">All statuses</option>{statuses.map(x=><option key={x}>{x}</option>)}</select>}</div><div className="data-card"><div className="data-card-head"><div><h3>{c.title}</h3><span>{filtered.length} records</span></div></div><div className="data-table"><div className={'data-row module-row '+(c.headers.length===4?'four':'')}>{c.headers.map(h=><span className="table-label" key={h}>{h}</span>)}{editable&&<span className="table-label">Actions</span>}</div>{shown.map((r,i)=><div className={'data-row module-row '+(c.headers.length===4?'four':'')} key={`${r[0]}-${i}`}>{r.map((v,j)=><span key={j}>{j===0?<b>{v}</b>:j===c.headers.length-1&&['Active','Completed','Processing','Pending','Scheduled','Unread','Read','Low stock','In stock','Out of stock'].includes(v)?<em className={'status '+(['Active','Completed','Read','In stock'].includes(v)?'active':'warning')}>{v}</em>:v}</span>)}{editable&&<span className="row-actions"><button title={`Edit ${c.title.toLowerCase()}`} onClick={()=>setEditing({row:[...r],original:r})}><Icon name="edit"/></button><button title="Delete record" onClick={()=>{const next=rows.filter(x=>x!==r);setRows(next);localStorage.setItem(storageKey,JSON.stringify(next))}}><Icon name="trash"/></button></span>}</div>)}</div><Pagination page={current} setPage={setPage} total={filtered.length} perPage={per}/></div>{editing&&<EditRows type={type} headers={c.headers} value={editing.row} isNew={editing.new} onCancel={()=>setEditing(null)} onSave={row=>saveEdit(row,editing.new,editing.original)}/>}</>}

function EditRows({type,headers,value,isNew,onCancel,onSave}){const [row,setRow]=useState(value);return <div className="modal-backdrop" onMouseDown={onCancel}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={onCancel}>×</button><h2>{isNew?'Add':'Edit'} {cfg[type].title.slice(0,-1)}</h2><p>Update the fields below and save your changes.</p>{headers.map((h,i)=><label className="field" key={h}><span>{h}</span><input value={row[i]||''} onChange={e=>setRow(r=>r.map((x,j)=>j===i?e.target.value:x))}/></label>)}<div className="modal-actions"><button className="outline-btn" onClick={onCancel}>Cancel</button><button className="gradient-btn" onClick={()=>onSave(row)}>Save changes</button></div></div></div>}

function Analytics(){
  const [products,setProducts]=useState([]);
  useEffect(()=>{ productsApi.getVendorProducts().then(res=>setProducts(res.products||[])).catch(()=>{}); },[]);
  return <>
    <div className="dash-page-head"><div><span className="eyebrow">SELLER PLATFORM</span><h1>Analytics</h1><p>Product catalog performance. Full sales analytics are coming soon.</p></div></div>
    <div className="metric-grid">
      <Metric label="Total products" value={products.length} icon="box" sub="Published catalog"/>
      <Metric label="Active" value={products.filter(p=>p.status==='ACTIVE').length} icon="check" sub="Visible to buyers"/>
      <Metric label="Low stock" value={products.filter(p=>p.stockQuantity<=(p.lowStockThreshold||5)).length} icon="bell" sub="Needs restock"/>
    </div>
    <div className="data-card"><h3>Products</h3>
      {products.slice(0,8).map(p=><div className="activity-row" key={p.id}><div><b>{p.name}</b><small>Stock: {p.stockQuantity}</small></div><strong>{money(p.price)}</strong></div>)}
    </div>
  </>;
}

export default function VendorDashboard(){
  const path=useLocation().pathname;
  if(path.includes('/delivery'))return <DashboardLayout><DeliveryTracking role="vendor"/></DashboardLayout>;
  if(path.includes('/notifications'))return <DashboardLayout><NotificationPanel/></DashboardLayout>;
  if(path==='/vendor')return <DashboardLayout><SellerOverview/></DashboardLayout>;
  if(path.includes('/products'))return <DashboardLayout><ProductModule/></DashboardLayout>;
  if(path.includes('/inventory'))return <DashboardLayout><InventoryModule/></DashboardLayout>;
  if(path.includes('/orders'))return <DashboardLayout><VendorOrders/></DashboardLayout>;
  if(path.includes('/analytics'))return <DashboardLayout><Analytics/></DashboardLayout>;
  if(path.includes('/payouts')||path.includes('/transactions'))return <DashboardLayout><VendorPayouts/></DashboardLayout>;
  const type=Object.keys(cfg).find(k=>path.includes('/'+k))||'products';
  return <DashboardLayout><ModulePage type={type}/></DashboardLayout>;
}
