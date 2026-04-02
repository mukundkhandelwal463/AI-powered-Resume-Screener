import React from 'react';
import { Check, Star, Crown } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: 'Basic',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '3 Resume Templates',
        'Unlimited Downloads',
        'ATS Compatible',
        'Basic Support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: 'monthly',
      description: 'Most popular choice',
      features: [
        'All Templates',
        'AI Writing Assistant',
        'Custom Branding',
        'Priority Support',
        'Analytics Dashboard'
      ],
      popular: true
    },
    {
      name: 'Premium',
      price: '$19.99',
      period: 'monthly',
      description: 'For professionals',
      features: [
        'Everything in Pro',
        'Cover Letter Builder',
        'Portfolio Website',
        'Expert Review',
        'Career Coaching'
      ],
      popular: false
    }
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include our core features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative rounded-3xl p-8 border ${
                plan.popular 
                  ? 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800 border-blue-200 dark:border-blue-800 shadow-xl transform scale-105 z-10' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <Crown size={16} />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-black text-slate-800 dark:text-white">{plan.price}</span>
                  <span className="text-slate-500 dark:text-slate-400">/{plan.period}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Check size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/20' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;