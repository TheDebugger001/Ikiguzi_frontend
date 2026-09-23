import { Navigate,useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function RequireAuth({children,roles}){const {user,loading}=useAuth();const loc=useLocation();if(loading)return <div className="loading-screen">Loading MVEC…</div>;if(!user)return <Navigate to="/login" state={{from:loc.pathname}} replace/>;
// A super_admin who has completed the "Become a Seller" onboarding can also
// open any vendor-only route (their own dashboard, products, orders, etc.)
// without losing their super_admin role or permissions elsewhere.
const isAdminActingAsSeller=user.role==='super_admin'&&user.isSellerEnabled&&roles&&roles.includes('vendor');
if(roles&&!roles.includes(user.role)&&!isAdminActingAsSeller){const home={vendor:'/vendor',supplier:'/supplier',affiliate:'/affiliate',delivery:'/delivery',super_admin:'/admin'}[user.role]||'/';return <Navigate to={home} replace/>;}return children;}
