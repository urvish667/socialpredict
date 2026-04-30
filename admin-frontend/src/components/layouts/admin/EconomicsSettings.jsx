import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/api';
import SiteButton from '../../buttons/SiteButtons';

function EconomicsSettings() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await adminFetch('/v0/admin/economics');
            if (response.ok) {
                const rawData = await response.json();
                
                // Normalization: Handle both PascalCase (default Go) and camelCase (json tags)
                // This prevents "zero zero" issues if the backend hasn't been restarted yet
                const normalizedData = {
                    economics: {
                        marketcreation: rawData.economics?.marketcreation || rawData.Economics?.MarketCreation || {},
                        marketincentives: rawData.economics?.marketincentives || rawData.Economics?.MarketIncentives || {},
                        user: rawData.economics?.user || rawData.Economics?.User || {},
                        betting: rawData.economics?.betting || rawData.Economics?.Betting || {}
                    },
                    frontend: rawData.frontend || rawData.Frontend || {}
                };
                
                setConfig(normalizedData);
            }
        } catch (error) {
            console.error('Failed to fetch economics config:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const updateNestedConfig = (path, value) => {
        setConfig(prev => {
            const newConfig = JSON.parse(JSON.stringify(prev)); // Deep clone
            let current = newConfig;
            const parts = path.split('.');
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            return newConfig;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await adminFetch('/v0/admin/economics', {
                method: 'PUT',
                body: JSON.stringify(config)
            });
            if (response.ok) {
                setMessage({ type: 'success', text: 'Economics updated successfully' });
                // Re-fetch to ensure we have the absolute latest state from server
                await fetchConfig();
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update economics' });
            }
        } catch (error) {
            console.error('Failed to update economics:', error);
            setMessage({ type: 'error', text: 'A network error occurred' });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !config) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-2 border-[#ddff5c]/20 border-t-[#ddff5c] rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ddff5c]">Accessing Ledger...</p>
        </div>
    );

    if (!config) return <div className="text-white/50 text-center p-20">Failed to load configuration.</div>;

    return (
        <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {message.text && (
                <div className={`p-4 text-[10px] font-black uppercase tracking-widest border ${
                    message.type === 'success' 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Market Creation Criteria */}
            <div className="bg-white/[0.02] border border-white/5 p-8 backdrop-blur-md space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-[#ddff5c] text-sm">construction</span>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Market Genesis Parameters</h3>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Creation Fee (in Cents - 100 = 1 Coin)</label>
                        <input 
                            type="number" 
                            className="bg-[#0b0f0e] border border-white/10 text-white p-4 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all"
                            value={config?.economics?.marketincentives?.createMarketCost ?? 0}
                            onChange={(e) => updateNestedConfig('economics.marketincentives.createMarketCost', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-[9px] text-white/20 uppercase font-bold tracking-wider">Currently: {(config?.economics?.marketincentives?.createMarketCost || 0) / 100} Coins</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Minimum Required Trades</label>
                        <input 
                            type="number" 
                            className="bg-[#0b0f0e] border border-white/10 text-white p-4 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all"
                            value={config?.economics?.marketcreation?.minTradesRequired ?? 0}
                            onChange={(e) => updateNestedConfig('economics.marketcreation.minTradesRequired', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-[9px] text-white/20 uppercase font-bold tracking-wider">Number of bets a user must place before creating a market</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Minimum Account Age (Days)</label>
                        <input 
                            type="number" 
                            className="bg-[#0b0f0e] border border-white/10 text-white p-4 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all"
                            value={config?.economics?.marketcreation?.minAccountAgeDays ?? 0}
                            onChange={(e) => updateNestedConfig('economics.marketcreation.minAccountAgeDays', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-[9px] text-white/20 uppercase font-bold tracking-wider">Minimum days since registration to allow market creation</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Max Markets Per Day</label>
                        <input 
                            type="number" 
                            className="bg-[#0b0f0e] border border-white/10 text-white p-4 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all"
                            value={config?.economics?.marketcreation?.maxMarketsPerDay ?? 0}
                            onChange={(e) => updateNestedConfig('economics.marketcreation.maxMarketsPerDay', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-[9px] text-white/20 uppercase font-bold tracking-wider">Maximum number of markets a user can create in 24 hours</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-10 py-4 bg-[#ddff5c] text-[#0b0f0e] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#e6ff85] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                    {saving ? 'Transmitting...' : 'Commit Changes'}
                </button>
            </div>
        </div>
    );
}

export default EconomicsSettings;
