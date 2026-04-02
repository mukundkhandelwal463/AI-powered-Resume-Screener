import React from 'react';
import { Star } from 'lucide-react';

const Testimonial = () => {
    const reviews = [
        {
            name: 'Ravi Ranjan',
            role: 'Full Stack Developer',
            content: 'The best resume builder I have ever used. Simple, fast, and the templates are stunning.',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
        },
        {
            name: 'Lakshya Giri',
            role: 'Product Designer',
            content: 'I got hired at a top tech company thanks to the ATS-optimized templates from this builder.',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
        },
        {
            name: 'Prudvi',
            role: 'Software Engineer',
            content: 'The AI suggestions helped me articulate my experience much better than I could on my own.',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
        },
        {
            name: 'Sarah Johnson',
            role: 'Marketing Manager',
            content: 'I created my resume in under 15 minutes and got called for an interview the same day!',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
        },
        {
            name: 'Michael Chen',
            role: 'Data Scientist',
            content: 'The analytics dashboard helped me optimize my resume for better response rates.',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
        },
        {
            name: 'Emma Rodriguez',
            role: 'UX Designer',
            content: 'The collaboration features made it easy to get feedback from my mentors.',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
        }
    ];

    return (
        <section className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-center text-slate-800 dark:text-white mb-4 tracking-tight">Loved by Thousands</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Join over 500,000 professionals who have built successful careers with our platform</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((review, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full -mt-16 -mr-16"></div>
                            <div className="flex gap-1 mb-6 relative z-10">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-8 italic leading-relaxed relative z-10">"{review.content}"</p>
                            <div className="flex items-center gap-4 relative z-10">
                                <img src={review.image} alt={review.name} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow" />
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{review.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonial;
