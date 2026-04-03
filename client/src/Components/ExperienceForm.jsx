import { Briefcase, Plus, Trash, Sparkles } from 'lucide-react';
import React, { useState } from 'react'

const ExperienceForm = ({ data, onChange }) => {
    const addExperience = () => {
        const newExperience = {
            company: '',
            position: '',
            start_date: '',
            end_date: '',
            is_current: false,
            description: '',
        };

        onChange([...data, newExperience]);
    };
    const removeExperience = (index) => {
        const updatedExperience = data.filter((_, i) => i !== index);
        onChange(updatedExperience);
    };
    const updateExperience = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const [enhancingIdx, setEnhancingIdx] = useState(null);

    const handleEnhance = async (index, currentText) => {
        if (!currentText || !currentText.trim()) return;
        setEnhancingIdx(index);
        try {
            const res = await fetch('/api/enhance-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: currentText })
            });
            const result = await res.json();
            if (result.success && result.enhanced_text) {
                updateExperience(index, 'description', result.enhanced_text);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setEnhancingIdx(null);
        }
    };

  return (
    <div className='space-y-4'>
        <div className='flex items-center justify-between'>
            <div>
                <h3 className='text-lg font-semibold text-gray-800'>Professional Experience</h3>
                <p className="text-sm text-gray-500">Add your professional experience details here.</p>
            </div>
            <button onClick={addExperience} className='flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all text-sm font-medium'>
                <Plus className='size-4' />
                Add Experience
            </button>
        </div>

        {data.length === 0 ? (
            <div className='text-center py-8 border-2 border-dashed border-gray-200 rounded-lg'>
                <Briefcase className='mx-auto mb-2 size-8 text-gray-300' />
                <p className="text-sm text-gray-500">No experience details added yet.</p>
            </div>
        ) : (
            <div className='space-y-4'>
                {data.map((experience, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-medium text-gray-700">Experience #{index + 1}</h4>
                            <button onClick={() => removeExperience(index)} className='text-gray-400 hover:text-red-500 transition-colors' title="Remove">
                                <Trash className='size-4' />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">Position</label>
                                <input value={experience.position || ""} onChange={(e) => updateExperience(index, 'position', e.target.value)} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Senior Developer" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">Company</label>
                                <input value={experience.company || ""} onChange={(e) => updateExperience(index, 'company', e.target.value)} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Google" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">Start Date</label>
                                <input value={experience.start_date || ""} onChange={(e) => updateExperience(index, 'start_date', e.target.value)} type="text" placeholder="YYYY-MM" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">End Date</label>
                                <input value={experience.end_date || ""} onChange={(e) => updateExperience(index, 'end_date', e.target.value)} type="text" placeholder="YYYY-MM" disabled={experience.is_current} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                    <input type="checkbox" checked={experience.is_current || false} onChange={(e) => updateExperience(index, 'is_current', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                    <span className="text-sm text-gray-600">I currently work here</span>
                                </label>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs font-medium text-gray-500 uppercase">Key Points (max 4 bullets)</label>
                                {[0, 1, 2, 3].map((bIdx) => {
                                    const bullets = (experience.description || '').split('\n').filter(l => l.trim());
                                    return (
                                        <div key={bIdx} className="flex items-center gap-2">
                                            <span className="text-gray-400 text-sm font-bold flex-shrink-0">•</span>
                                            <input
                                                value={bullets[bIdx] || ''}
                                                onChange={(e) => {
                                                    const newBullets = [0,1,2,3].map(i => i === bIdx ? e.target.value : (bullets[i] || ''));
                                                    updateExperience(index, 'description', newBullets.filter(b => b.trim()).join('\n'));
                                                }}
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder={`Point ${bIdx + 1} (max 2 lines)`}
                                                maxLength={160}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  )
}

export default ExperienceForm
