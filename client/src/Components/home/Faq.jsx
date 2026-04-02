import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Is my resume ATS-friendly?",
      answer: "Yes, all our templates are designed to be compatible with Applicant Tracking Systems (ATS) used by employers to screen resumes."
    },
    {
      question: "Can I download my resume in multiple formats?",
      answer: "Absolutely! You can download your resume as PDF, Word, or plain text files."
    },
    {
      question: "How many templates do you offer?",
      answer: "We offer over 50 professionally designed templates across various industries and experience levels."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes, we offer 24/7 customer support via chat and email for all our users."
    },
    {
      question: "Can I collaborate with others on my resume?",
      answer: "Yes, you can invite team members to review and provide feedback on your resume."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes, you can create and download unlimited resumes for free with our basic plan."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Everything you need to know about our platform and services.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center p-6 text-left"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="text-slate-500 dark:text-slate-400" size={24} />
                ) : (
                  <ChevronDown className="text-slate-500 dark:text-slate-400" size={24} />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6 text-slate-600 dark:text-slate-300">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;