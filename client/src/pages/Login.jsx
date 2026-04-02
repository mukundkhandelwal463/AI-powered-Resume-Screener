import React from 'react';
import { Mail, Lock, ArrowRight, FileText } from 'lucide-react';

const Login = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
            <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-10 border border-slate-200 dark:border-slate-700">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                            <FileText className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Welcome Back</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your account to continue</p>
                    </div>

                    <form className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all w-full"
                                />
                            </div>
                        </div>

                        <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-100 dark:shadow-blue-900/20">
                            Sign In
                            <ArrowRight size={20} />
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        Don't have an account? <a href="#" className="text-blue-600 font-bold hover:underline">Create one</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;


