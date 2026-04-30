import { DOMAIN_URL } from '../../../config';
import React, { useState } from 'react';
import SiteButton from '../../buttons/SiteButtons';
import { RegularInput } from '../../inputs/InputBar'
import { adminFetch } from '../../../utils/api';

function AdminAddUser() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        try {
            const response = await adminFetch(`/v0/admin/createuser`, {
                method: 'POST',
                body: JSON.stringify({ username })
            });
            if (!response.ok) {
                const errMessage = await response.text()
                throw new Error(`HTTP error! Status: ${response.status} Reason: ${errMessage}`);
            }
            const data = await response.json();
            setPassword(data.password);
        } catch (err) {
            console.error('Failed to create user:', err);
            setError(err.message || 'Failed to create user');
        }
    };

    const handleCopyCredentials = () => {
        const credentials = `${DOMAIN_URL} \n Username: ${username}\nPassword: ${password}`;
        navigator.clipboard.writeText(credentials).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);  // Notification timeout
        });
    };

    const handleReset = () => {
        setUsername('');
        setPassword('');
        setError('');
        setCopied(false);
    };

    return (
        <div className="max-w-2xl">
            {/* Form Glass Card */}
            <div className="bg-white/[0.02] border border-white/5 p-10 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ddff5c]/5 blur-[80px] -mr-32 -mt-32"></div>
                
                {!password ? (
                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ddff5c]">Identity Specification</label>
                            <p className="text-xs text-white/40">Provide a unique identifier for the new administrative or user entity.</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={username}
                                onChange={handleUsernameChange}
                                placeholder="E.g. admin_pro_2026"
                                className="w-full bg-[#0b0f0e] border border-white/10 p-4 text-white font-bold tracking-tight focus:border-[#ddff5c] outline-none transition-all placeholder:text-white/10"
                                required
                            />
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                    Error: {error}
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 bg-[#ddff5c] text-[#0b0f0e] text-[11px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(221,255,92,0.2)]"
                        >
                            Provision Identity
                        </button>
                    </form>
                ) : (
                    <div className="space-y-8 relative z-10 animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-[#ddff5c]/10 border border-[#ddff5c]/20 flex items-center justify-center mb-2">
                                <svg className="w-8 h-8 text-[#ddff5c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Identity Provisioned</h3>
                            <p className="text-xs text-white/40 max-w-xs">Credentials successfully generated. Secure these details immediately; they will not be displayed again.</p>
                        </div>

                        <div 
                            onClick={handleCopyCredentials}
                            className="group cursor-pointer bg-[#0b0f0e] border border-[#ddff5c]/30 p-6 space-y-4 hover:border-[#ddff5c] transition-all relative overflow-hidden"
                        >
                            {copied && (
                                <div className="absolute inset-0 bg-[#ddff5c] flex items-center justify-center z-20 animate-in fade-in duration-300">
                                    <span className="text-[#0b0f0e] font-black text-xs uppercase tracking-[0.4em]">Credentials Copied</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Username</span>
                                        <p className="text-lg font-black text-white">{username}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Temporary Password</span>
                                        <p className="text-lg font-mono font-black text-[#ddff5c]">{password}</p>
                                    </div>
                                </div>
                                <div className="text-white/20 group-hover:text-[#ddff5c] transition-colors">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleReset}
                            className="w-full py-4 bg-white/5 border border-white/10 text-white/60 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                        >
                            Return to Registry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminAddUser;
