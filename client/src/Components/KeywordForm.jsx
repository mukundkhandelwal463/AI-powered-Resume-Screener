import { CheckCircle2, Plus, X, Sparkle } from 'lucide-react';
import React, { useState } from 'react'

const KeywordForm = ({ data, onChange, atsAnalysis }) => {
    const [newKw, setNewKw] = useState('');

    const addKw = (val) => {
        const kw = (val || newKw).trim();
        if (kw && !data.includes(kw)) {
            onChange([...data, kw]);
            if (!val) setNewKw('');
        }
    }

    const removeKw = (kwToRemove) => {
        onChange(data.filter((k) => k !== kwToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addKw();
        }
    }

    return (
        <div className='space-y-4'>
            <div className="">
                <h3 className='text-lg font-semibold text-gray-800'>Industry & ATS Keywords</h3>
                <p className="text-sm text-gray-500">Add generic industry terms or ATS action keywords that aren't technical skills (e.g. "analyzing", "leadership", "operations").</p>
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder='Enter keyword (e.g. Business Strategy)'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    value={newKw}
                    onChange={(e) => setNewKw(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <button
                    onClick={() => addKw()}
                    disabled={!newKw.trim()}
                    className='flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    <Plus className='size-4' />
                    Add
                </button>
            </div>

            {data.length > 0 ? (
                <div className='flex flex-wrap gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[60px]'>
                    {data.map((kw, index) => (
                        <span key={index} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm shadow-sm hover:bg-gray-50 transition-colors">
                            {kw}
                            <button onClick={() => removeKw(kw)} className='text-gray-400 hover:text-red-500 transition-colors ml-1' title="Remove">
                                <X className='size-3' />
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <div className='text-center py-8 border-2 border-dashed border-gray-200 rounded-lg'>
                    <CheckCircle2 className='mx-auto mb-2 size-8 text-gray-300' />
                    <p className="text-sm text-gray-500">No industry keywords added yet.</p>
                </div>
            )}

            {atsAnalysis && (
                <div className="mt-4 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                    <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                        <Sparkle className="size-4" />
                        ATS Analysis Target ({atsAnalysis.ats_score || 0}% Score)
                    </h4>
                    <p className="text-xs text-indigo-600 mt-1 mb-3">Add these missing keywords to boost your ATS compatibility for <strong>{atsAnalysis.category || "General"}</strong> roles:</p>
                    <div className="flex flex-wrap gap-2">
                        {(atsAnalysis.missing_keywords || []).length > 0 ? (
                            atsAnalysis.missing_keywords.map((kw, i) => (
                                <button key={i} onClick={() => { if (!data.includes(kw)) addKw(kw); }} className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded shadow-sm hover:bg-indigo-100 transition">
                                    + {kw}
                                </button>
                            ))
                        ) : (
                            <span className="text-xs text-indigo-700">No missing keywords! You are fully optimized.</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default KeywordForm
