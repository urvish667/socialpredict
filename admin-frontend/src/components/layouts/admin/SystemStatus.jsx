import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/api';

function SystemStatus() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const response = await adminFetch(`/v0/admin/system/health`);
            if (response.ok) {
                const data = await response.json();
                setHealth(data);
            }
        } catch (error) {
            console.error('Failed to fetch system health:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading && !health) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-2 border-[#ddff5c]/20 border-t-[#ddff5c] rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ddff5c] animate-pulse">Polling System Metrics...</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Status Card */}
                <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] -mr-16 -mt-16"></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-4">Core Service</label>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        <span className="text-xl font-black text-white uppercase tracking-tight">Healthy</span>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16"></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-4">Total Identities</label>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{health?.stats?.total_users || 0}</span>
                        <span className="text-[10px] font-black text-blue-400/50 uppercase tracking-widest">Profiles</span>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] -mr-16 -mt-16"></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-4">Market Sectors</label>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{health?.stats?.total_markets || 0}</span>
                        <span className="text-[10px] font-black text-purple-400/50 uppercase tracking-widest">Active</span>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] -mr-16 -mt-16"></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-4">Ledger Volume</label>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{health?.stats?.total_bets || 0}</span>
                        <span className="text-[10px] font-black text-orange-400/50 uppercase tracking-widest">Entries</span>
                    </div>
                </div>
            </div>

            {/* Diagnostic Console */}
            <div className="bg-[#0b0f0e] border border-white/5 rounded-none overflow-hidden">
                <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Raw Diagnostic Telemetry</span>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                    </div>
                </div>
                <div className="p-6">
                    <pre className="text-xs font-mono text-[#ddff5c]/60 overflow-auto max-h-96 custom-scrollbar">
                        {JSON.stringify(health, null, 4)}
                    </pre>
                </div>
            </div>
        </div>
    );
}

export default SystemStatus;
