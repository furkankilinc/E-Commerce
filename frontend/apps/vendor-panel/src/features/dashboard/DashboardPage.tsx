import React from 'react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
    const stats = [
        {
            label: 'Total Revenue', value: '$128,430', change: '+12.5%', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V6m0 12v2m4-12H8" /></svg>
            ), color: 'text-emerald-600', bg: 'bg-emerald-50'
        },
        {
            label: 'Active Orders', value: '432', change: '+18.2%', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            ), color: 'text-brand-pink', bg: 'bg-rose-50'
        },
        {
            label: 'Total Products', value: '1,240', change: '+4.1%', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg>
            ), color: 'text-indigo-600', bg: 'bg-indigo-50'
        },
        {
            label: 'Customer Rating', value: '4.9', change: '+0.2%', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            ), color: 'text-amber-500', bg: 'bg-amber-50'
        },
    ];

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 italic">Dashboard</h1>
                <p className="text-slate-400 font-bold text-lg">Welcome back! Here's what's happening with your store today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 cursor-pointer">
                        <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            {stat.icon}
                        </div>
                        <div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">{stat.label}</span>
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-black text-slate-900 leading-none">{stat.value}</span>
                                <span className="text-xs font-black text-emerald-500 mb-1">{stat.change}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Sales Chart Placeholder */}
                <div className="xl:col-span-2 bg-white rounded-[3rem] p-10 shadow-sm border border-white h-[500px] flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sales Overview</h3>
                        <div className="flex gap-2">
                            {['Day', 'Week', 'Month'].map(t => (
                                <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t === 'Week' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-slate-300 font-black uppercase tracking-[0.3em] z-10">Chart Visualization Coming Soon</span>
                    </div>
                </div>

                {/* Recent Orders Side Card */}
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Orders</h3>
                        <Link to="/orders" className="text-brand-pink font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-4">View All</Link>
                    </div>
                    <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                        {[
                            { name: 'Sarah Johnson', date: '2 mins ago', amount: '$129.00', status: 'Processing' },
                            { name: 'Michael Chen', date: '15 mins ago', amount: '$540.20', status: 'Shipped' },
                            { name: 'Emma Wilson', date: '1 hour ago', amount: '$89.00', status: 'Delivered' },
                            { name: 'David Miller', date: '3 hours ago', amount: '$210.00', status: 'Processing' },
                            { name: 'Sofia Rodriguez', date: '5 hours ago', amount: '$75.50', status: 'Delivered' },
                        ].map((order, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-pink group-hover:text-white transition-all font-black italic">
                                    {order.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-black text-slate-900 block truncate leading-tight group-hover:text-brand-pink transition-colors">{order.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.date}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-slate-900 block">{order.amount}</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'Processing' ? 'text-amber-500' : order.status === 'Shipped' ? 'text-indigo-500' : 'text-emerald-500'}`}>{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[3rem] p-12 shadow-2xl shadow-indigo-950/20 relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-6 block relative z-10">Top Selling</span>
                    <h3 className="text-3xl font-black text-white mb-8 relative z-10 leading-none italic">Cyber-Heavy Hoodie</h3>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                            <span className="text-white font-black text-sm">432 Sold</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                            <span className="text-emerald-400 font-black text-sm">+$12,400 Profit</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Stock Alerts</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Minimalist Leather Watch', stock: '2 left', pct: 2 },
                            { name: 'Slim-Fit Chinos', stock: '5 left', pct: 15 },
                        ].map((item, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                    <span className="text-slate-900">{item.name}</span>
                                    <span className="text-rose-500">{item.stock}</span>
                                </div>
                                <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                    <div className="h-full bg-brand-pink rounded-full shadow-lg shadow-brand-pink/30 transition-all duration-1000" style={{ width: `${item.pct}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
