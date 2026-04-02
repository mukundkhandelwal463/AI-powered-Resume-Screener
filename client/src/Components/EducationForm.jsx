import { GraduationCap, Plus, Trash } from 'lucide-react';
import React from 'react'

const EducationForm = ({ data, onChange }) => {
    const addEducation = () => {
        const newEducation = {
            institution: '',
            degree: '',
            field: '',
            graduation_date: '',
            gpa: '',
        };
        onChange([...data, newEducation]);
    };

    const removeEducation = (index) => {
        const updatedEducation = data.filter((_, i) => i !== index);
        onChange(updatedEducation);
    };

    const updateEducation = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

  return (
    <div className='space-y-4'>
        <div className='flex items-center justify-between'>
            <div>
                <h3 className='text-lg font-semibold text-gray-800'>Education</h3>
                <p className="text-sm text-gray-500">Add your educational background details here.</p>
            </div>
            <button onClick={addEducation} className='flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all text-sm font-medium'>
                <Plus className='size-4' />
                Add Education
            </button>
        </div>

        {data.length === 0 ? (
            <div className='text-center py-8 border-2 border-dashed border-gray-200 rounded-lg'>
                <GraduationCap className='mx-auto mb-2 size-8 text-gray-300' />
                <p className="text-sm text-gray-500">No education details added yet.</p>
            </div>
        ) : (
            <div className='space-y-4'>
                {data.map((education, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-medium text-gray-700">Education #{index + 1}</h4>
                            <button onClick={() => removeEducation(index)} className='text-gray-400 hover:text-red-500 transition-colors' title="Remove">
                                <Trash className='size-4' />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">Institution</label>
                                <input value={education.institution || ""} onChange={(e) => updateEducation(index, 'institution', e.target.value)} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Harvard University" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">Degree</label>
                                <input value={education.degree || ""} onChange={(e) => updateEducation(index, 'degree', e.target.value)} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Bachelor's" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">Field of Study</label>
                                <input value={education.field || ""} onChange={(e) => updateEducation(index, 'field', e.target.value)} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Computer Science" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">Graduation Date</label>
                                <input value={education.graduation_date || ""} onChange={(e) => updateEducation(index, 'graduation_date', e.target.value)} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase">GPA</label>
                                <input value={education.gpa || ""} onChange={(e) => updateEducation(index, 'gpa', e.target.value)} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. 3.8" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  )
}

export default EducationForm
