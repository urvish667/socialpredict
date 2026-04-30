import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/api';

function AuditLog() {
    const [bets, setBets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBets = async () => {
        setLoading(true);
        try {
            const response = await adminFetch(`/v0/admin/bets`);
            if (response.ok) {
                const data = await response.json();
                setBets(data);
            }
        } catch (error) {
            console.error('Failed to fetch audit log:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBets();
    }, []);

    return (
        <div className="space-y-8">
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-12 h-12 border-2 border-[#ddff5c]/20 border-t-[#ddff5c] rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ddff5c] animate-pulse">Syncing Transaction Ledger...</p>
                </div>
            ) : (
                <div className="bg-white/[0.02] border border-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Market Sector</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Trader</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Action</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Volume</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Position</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {bets.map(bet => (
                                <tr key={bet.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-[#ddff5c] rounded-none rotate-45"></div>
                                            <span className="text-xs font-mono text-white/60">SECTOR_{bet.marketId}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-blue-400">@{bet.username}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${
                                            bet.action === 'buy' 
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                        }`}>
                                            {bet.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-sm font-mono font-bold text-white">
                                            {(bet.amount / 100).toFixed(2)}
                                            <span className="text-[10px] text-white/30 ml-1">ZRC</span>
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-[9px] font-black tracking-widest ${
                                            bet.outcome === 'YES' ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            {bet.outcome}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] font-bold text-white/40">
                                                {new Date(bet.placedAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-[9px] font-mono text-white/20">
                                                {new Date(bet.placedAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {bets.length === 0 && !loading && (
                        <div className="p-20 text-center border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No transaction logs available</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AuditLog;
