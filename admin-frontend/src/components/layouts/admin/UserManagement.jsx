import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../../utils/api';
import SiteButton from '../../buttons/SiteButtons';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: '', verified: '', banned: '' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filter).toString();
            const response = await adminFetch(`/v0/admin/users?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const toggleBan = async (username, currentBanStatus) => {
        try {
            const response = await adminFetch(`/v0/admin/users/${username}/ban`, {
                method: 'PUT',
                body: JSON.stringify({ isBanned: !currentBanStatus })
            });
            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Failed to update ban status:', error);
        }
    };

    const updateRole = async (username, currentRole) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        if (!window.confirm(`Are you sure you want to change ${username} to ${newRole}?`)) return;

        try {
            const response = await adminFetch(`/v0/admin/users/${username}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            });
            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Filters Glass Card */}
            <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Role filter</label>
                        <select 
                            className="bg-[#0b0f0e] border border-white/10 text-white p-3 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all cursor-pointer"
                            value={filter.role}
                            onChange={(e) => setFilter({...filter, role: e.target.value})}
                        >
                            <option value="">All Roles</option>
                            <option value="ADMIN">Administrators</option>
                            <option value="USER">Standard Users</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Verification</label>
                        <select 
                            className="bg-[#0b0f0e] border border-white/10 text-white p-3 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all cursor-pointer"
                            value={filter.verified}
                            onChange={(e) => setFilter({...filter, verified: e.target.value})}
                        >
                            <option value="">All Statuses</option>
                            <option value="true">Verified Only</option>
                            <option value="false">Unverified</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Access status</label>
                        <select 
                            className="bg-[#0b0f0e] border border-white/10 text-white p-3 text-xs font-bold focus:border-[#ddff5c] outline-none transition-all cursor-pointer"
                            value={filter.banned}
                            onChange={(e) => setFilter({...filter, banned: e.target.value})}
                        >
                            <option value="">Any Access</option>
                            <option value="true">Banned Users</option>
                            <option value="false">Active Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-12 h-12 border-2 border-[#ddff5c]/20 border-t-[#ddff5c] rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ddff5c] animate-pulse">Syncing User Data...</p>
                </div>
            ) : (
                <div className="bg-white/[0.02] border border-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Identity</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Privileges</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Verified</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Balance</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">System Status</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(user => (
                                <tr key={user.username} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-[#ddff5c]">
                                                {user.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-white tracking-tight">{user.username}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${
                                            user.role === 'ADMIN' 
                                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {user.isVerified ? (
                                            <span className="text-[#ddff5c] text-sm">●</span>
                                        ) : (
                                            <span className="text-white/10 text-sm">○</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-sm font-mono font-bold text-white">
                                            {(user.virtualBalance / 100).toFixed(2)}
                                            <span className="text-[10px] text-white/30 ml-1">ZRC</span>
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.isBanned ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Banned</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Active</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => toggleBan(user.username, user.isBanned)}
                                                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    user.isBanned 
                                                    ? 'bg-green-500 text-[#0b0f0e] hover:brightness-110' 
                                                    : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
                                                }`}
                                            >
                                                {user.isBanned ? 'Unban User' : 'Ban Account'}
                                            </button>
                                            <button 
                                                onClick={() => updateRole(user.username, user.role)}
                                                className="px-3 py-1.5 bg-white/5 text-white/60 text-[9px] font-black uppercase tracking-widest border border-white/10 hover:border-white/30 transition-all"
                                            >
                                                Change Role
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && !loading && (
                        <div className="p-20 text-center border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No matching user records found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default UserManagement;
