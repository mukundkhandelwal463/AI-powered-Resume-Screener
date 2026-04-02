import React from 'react';
import { Users, FileText, TrendingUp, Award } from 'lucide-react';

const Stats = () => {
  const stats = [
    { icon: <Users size={32} />, value: '500K+', label: 'Active Users' },
    { icon: <FileText size={32} />, value: '2M+', label: 'Resumes Created' },
    { icon: <TrendingUp size={32} />, value: '95%', label: 'Interview Rate' },
    { icon: <Award size={32} />, value: '4.9★', label: 'App Rating' }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                {stat.icon}
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{stat.value}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;