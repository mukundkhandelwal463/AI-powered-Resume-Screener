import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const CallToAction = () => {
    return (
        <section className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-200/30 dark:shadow-blue-900/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold mb-8">
                        <Sparkles size={16} />
                        Join 500,000+ Professionals
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight tracking-tight">
                        Ready to Land Your <br className="hidden md:block" />
                        Dream Job?
                    </h2>

                    <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto opacity-90">
                        Join 500,000+ professionals who have built successful careers
                        using our platform. Build your resume today.
                    </p>

                    <button className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2 mx-auto shadow-xl hover:shadow-2xl">
                        Get Started Now
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
