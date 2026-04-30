import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/api';
import SiteButton from '../../buttons/SiteButtons';
import AdminCreateMarketModal from '../../modals/market/AdminCreateMarketModal';

function MarketModeration() {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchMarkets = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filter).toString();
            const response = await adminFetch(`/v0/admin/markets?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setMarkets(data);
            }
        } catch (error) {
            console.error('Failed to fetch markets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarkets();
    }, [filter]);

    const deleteMarket = async (id, title) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE "${title}"? This is only for abusive content.`)) return;

        try {
            const response = await adminFetch(`/v0/admin/markets/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchMarkets();
            }
        } catch (error) {
            console.error('Failed to delete market:', error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-[#ddff5c]/5 border border-[#ddff5c]/20 p-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#ddff5c] text-xl">account_balance</span>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Market Governance</h2>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Admin level sector creation and liquidation</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-8 py-3 bg-[#ddff5c] text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#e6ff85] active:scale-95 transition-all shadow-[0_0_20px_rgba(221,255,92,0.2)]"
                >
                    Establish Market
                </button>
            </div>

            <AdminCreateMarketModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onMarketCreated={fetchMarkets}
            />

            {/* Filters Glass Card */}
            <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Market status</label>
                        <select 
                            className="bg-[#0b0f0e] border border-white/10 text-white p-3 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all cursor-pointer"
                            value={filter.status}
                            onChange={(e) => setFilter({...filter, status: e.target.value})}
                        >
                            <option value="">All Markets</option>
                            <option value="ACTIVE">Live / Active</option>
                            <option value="PENDING_RESOLUTION">Pending Resolution</option>
                            <option value="FINALIZED">Closed / Finalized</option>
                        </select>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex-1 text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10">Active Markets: {markets.length}</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-12 h-12 border-2 border-[#ddff5c]/20 border-t-[#ddff5c] rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ddff5c] animate-pulse">Scanning Markets...</p>
                </div>
            ) : (
                <div className="bg-white/[0.02] border border-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Market Question</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Originator</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Creation Date</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {markets.map(market => (
                                <tr key={market.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 max-w-md">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold text-white tracking-tight leading-snug">{market.questionTitle}</span>
                                            <span className="text-[10px] text-white/20 font-mono">ID: {market.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
                                            <span className="text-xs font-bold text-blue-400">@{market.creatorUsername}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${
                                            market.status === 'ACTIVE' 
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                        }`}>
                                            {market.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-mono text-white/40">
                                            {new Date(market.CreatedAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => deleteMarket(market.id, market.questionTitle)}
                                                className="px-4 py-2 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                            >
                                                Liqudate Market
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {markets.length === 0 && !loading && (
                        <div className="p-20 text-center border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No matching market sectors identified</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MarketModeration;
