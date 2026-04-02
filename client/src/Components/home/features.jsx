import React from 'react';
import { Zap, Layout, Shield, Target, Brain, Download, Palette, Clock } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: <Zap className="text-yellow-500" size={24} />,
            title: 'Real-time Preview',
            description: 'See your changes instantly as you type with our side-by-side editor.'
        },
        {
            icon: <Layout className="text-blue-500" size={24} />,
            title: 'Modern Templates',
            description: 'Choose from a variety of professionally designed layouts.'
        },
        {
            icon: <Target className="text-purple-500" size={24} />,
            title: 'ATS Optimized',
            description: 'Our resumes are built to pass applicant tracking systems with ease.'
        },
        {
            icon: <Brain className="text-green-500" size={24} />,
            title: 'AI Writing Assistant',
            description: 'Get smart suggestions to enhance your resume content.'
        },
        {
            icon: <Download className="text-indigo-500" size={24} />,
            title: 'Multiple Formats',
            description: 'Download as PDF, DOCX, or TXT with one click.'
        },
        {
            icon: <Palette className="text-pink-500" size={24} />,
            title: 'Custom Colors',
            description: 'Personalize your resume with custom color schemes.'
        },
        {
            icon: <Clock className="text-orange-500" size={24} />,
            title: 'Quick Setup',
            description: 'Create a professional resume in under 10 minutes.'
        },
        {
            icon: <Shield className="text-emerald-500" size={24} />,
            title: 'Secure & Private',
            description: 'Your data is encrypted and secure. We never share your personal information.'
        }
    ];

    return (
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">Everything You Need</h2>
                    <p className="text-slate-500 dark:text-slate-400">Powerful features to help you land your dream job</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-blue-100 group-hover:to-purple-100 dark:group-hover:from-blue-900/30 dark:group-hover:to-purple-900/30 transition-all">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{feature.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
