import React, { useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import { toast } from 'react-toastify';
import Pagination from '../../shared/components/Pagination';

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const baseUrl = search ? `/api/admin/users?search=${search}` : '/api/admin/users';
            const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}&limit=10`;
            const res = await apiClient.get(url);
            const data = await apiClient.handleResponse(res);
            if (data.success) {
                setUsers(data.users);
                setTotalPages(data.pages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [search, page]);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await apiClient.patch(`/api/admin/users/${id}/status`, { isActive: !currentStatus });
            if (res.ok) {
                toast.success('Kullanıcı durumu güncellendi.');
                fetchUsers();
            }
        } catch (err) {
            toast.error('Guncelleme başarısız.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz?')) return;
        try {
            const res = await apiClient.delete(`/api/admin/users/${id}`);
            if (res.ok) {
                toast.success('Kullanıcı silindi.');
                fetchUsers();
            }
        } catch (err) {
            toast.error('Silme işlemi başarısız.');
        }
    };

    return (
        <div className="p-10 space-y-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-[1000] text-admin-navy  italic  leading-none mb-4">KULLANICI <span className="text-brand-pink">YÖNETİMİ</span></h1>
                    <p className="text-10px font-semibold text-slate-400   italic opacity-70">Sistemdeki tüm kayıtlı kullanıcıları yönet</p>
                </div>

                <div className="w-80 relative group">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="İsim veya e-posta ara..."
                        className="w-full h-14 pl-12 pr-6 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-pink transition-all shadow-sm"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/50">
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400   italic">Kullanıcı</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400   italic">İletişim</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400   italic text-center">Durum</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400   italic text-center">Kayıt Tarihi</th>
                            <th className="px-10 py-8 text-10px font-semibold text-slate-400   italic text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic  ">Yükleniyor...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic  ">Kullanıcı bulunamadı.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-semibold text-xl ">
                                                {user.name?.substring(0, 1) || 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-slate-900 italic ">{user.name || 'İsimsiz'}</span>
                                                <span className="text-nano font-bold text-slate-400   italic">{user.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-slate-900 italic ">{user.email}</span>
                                            <span className="text-nano font-bold text-slate-400   italic">{user.phone || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <button
                                            onClick={() => toggleStatus(user.id, user.isActive)}
                                            className={`px-4 py-1.5 rounded-full text-nano font-semibold   italic transition-all ${user.isActive ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                                }`}
                                        >
                                            {user.isActive ? 'AKTİF' : 'PASİF'}
                                        </button>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className="text-10px font-semibold text-slate-400   italic">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
};

export default UsersPage;
