import React from 'react';
import { FileText, Github, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-t from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                                <FileText size={20} fill="currentColor" />
                            </div>
                            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ResumeBuilder</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
                            Empowering professionals to build their future with modern,
                            impactful resumes that stand out.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                <Linkedin size={20} />
                            </a>
                            <a href="#" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                <Github size={20} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white mb-6">Product</h4>
                        <ul className="space-y-4 text-slate-600 dark:text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><span>•</span> Templates</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><span>•</span> AI Builder</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><span>•</span> Pricing</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><span>•</span> Examples</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white mb-6">Company</h4>
                        <ul className="space-y-4 text-slate-600 dark:text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><span>•</span> About Us</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><span>•</span> Careers</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><span>•</span> Blog</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><span>•</span> Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white mb-6">Contact</h4>
                        <ul className="space-y-4 text-slate-600 dark:text-slate-400 text-sm">
                            <li className="flex items-center gap-3">
                                <Mail className="text-blue-500" size={16} />
                                contact@resumebuilder.com
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="text-blue-500" size={16} />
                                +1 (555) 123-4567
                            </li>
                            <li className="flex items-center gap-3">
                                <MapPin className="text-blue-500" size={16} />
                                San Francisco, CA
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 md:mb-0">© 2026 ResumeBuilder Inc. All rights reserved.</p>
                    <div className="flex gap-8 text-slate-500 dark:text-slate-400 text-sm">
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
