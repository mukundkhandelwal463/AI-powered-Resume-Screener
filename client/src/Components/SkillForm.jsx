import { Sparkle, Plus, X } from 'lucide-react';
import React, { useState } from 'react'

const SkillForm = ({ data, onChange }) => {
    const [newSkill, setNewSkill] = useState('');

    const addSkill = () => {
        const skill = newSkill.trim();
        if (skill && !data.includes(skill)) {
            onChange([...data, skill]);
            setNewSkill('');
        }
    }

    const removeSkill = (skillToRemove) => {
        onChange(data.filter((skill) => skill !== skillToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    }

    const [atsAnalysis, setAtsAnalysis] = useState(null);
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem('resume_analysis_result');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.analysis) setAtsAnalysis(parsed.analysis);
            }
        } catch(e) {}
    }, []);

    return (
        <div className='space-y-4'>
            <div className="">
                <h3 className='text-lg font-semibold text-gray-800'>Skills</h3>
                <p className="text-sm text-gray-500">Add your relevant skills here.</p>
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder='Enter your skill (e.g. Python, React, JavaScript)'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <button
                    onClick={addSkill}
                    disabled={!newSkill.trim()}
                    className='flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    <Plus className='size-4' />
                    Add Skill
                </button>
            </div>

            {data.length > 0 ? (
                <div className='flex flex-wrap gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[60px]'>
                    {data.map((skill, index) => (
                        <span key={index} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm shadow-sm hover:bg-gray-50 transition-colors">
                            {skill}
                            <button onClick={() => removeSkill(skill)} className='text-gray-400 hover:text-red-500 transition-colors ml-1' title="Remove">
                                <X className='size-3' />
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <div className='text-center py-8 border-2 border-dashed border-gray-200 rounded-lg'>
                    <Sparkle className='mx-auto mb-2 size-8 text-gray-300' />
                    <p className="text-sm text-gray-500">No skills added yet.</p>
                    <p className="text-xs text-gray-500 mt-1 text-center">Try to add at least 5-10 relevant skills to showcase your expertise.</p>
                </div>
            )}

            <div className="text-sm text-gray-500 mt-2">
                <p>Tip: Use specific skill names (e.g., "React" instead of "Web Development") to make your resume stand out.</p>
                <div className="text-xs text-gray-400 mt-1">You can add both technical skills (e.g., programming languages, tools) and soft skills (e.g., communication, teamwork).</div>
            </div>
        </div>
    )
}

export default SkillForm
