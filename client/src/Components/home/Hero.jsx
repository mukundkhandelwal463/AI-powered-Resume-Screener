import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

const Hero = () => {
    return (
        <section className="relative pt-20 pb-32 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-r from-blue-100 to-purple-100 rounded-full blur-[120px] opacity-50"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-r from-purple-100 to-pink-100 rounded-full blur-[120px] opacity-50"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 text-blue-600 text-sm font-bold mb-8 animate-bounce">
                    <Sparkles size={16} />
                    Trusted by 500,000+ Professionals Worldwide
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-slate-800 dark:text-white mb-8 leading-[1.1] tracking-tight">
                    Build a Resume That <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Gets You Hired.</span>
                </h1>

                <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Create a professional, ATS-friendly resume in minutes with our
                    AI-powered builder and expert-crafted templates.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 dark:shadow-blue-900/30 transition-all hover:translate-y-[-2px] active:translate-y-[0px] flex items-center justify-center gap-2">
                        Get Started Free
                        <ArrowRight size={20} />
                    </button>
                    <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold text-lg border border-slate-200 dark:border-slate-700 transition-all">
                        View Templates
                    </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-green-500" size={20} />
                        ATS-Friendly
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-green-500" size={20} />
                        AI Content Suggestions
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-green-500" size={20} />
                        Premium Templates
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
