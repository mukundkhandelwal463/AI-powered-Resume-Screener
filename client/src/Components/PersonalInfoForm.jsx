import React from 'react'
import { Camera, User, Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase } from 'lucide-react'

const PersonalInfoForm = ({ data, onChange, removeBackground, setRemoveBackground }) => {
    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value })

    }
    const fields = [
        { key: 'full_name', label: 'Full Name', icon: User, type: 'text', required: true },
        { key: 'email', label: 'Email', icon: Mail, type: 'email', required: true },

        { key: 'phone', label: 'Phone', icon: Phone, type: 'text', required: true },

        { key: 'address', label: 'Address', icon: MapPin, type: 'text', required: true },

        { key: 'city', label: 'City', icon: MapPin, type: 'text', required: true },
        { key: 'state', label: 'State', icon: MapPin, type: 'text', required: true },
        { key: 'zip', label: 'Zip Code', icon: MapPin, type: 'text', required: true },
        { key: 'country', label: 'Country', icon: MapPin, type: 'text', required: true },
        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, type: 'text', required: false },
        { key: 'github', label: 'GitHub', icon: Github, type: 'text', required: false },
        { key: 'website', label: 'Website', icon: Globe, type: 'text', required: false },
        { key: 'professional_title', label: 'Professional Title', icon: Briefcase, type: 'text', required: false }
    ]
    return (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className='text-lg font-semibold mb-2 text-gray-800'>
                Personal Information
            </h3>
            <p className='text-sm text-gray-500 mb-6'>
                Get started by adding your personal information here. This information will be displayed at the top of your resume.
            </p>
            <div className="flex items-center gap-6">
                <label className="relative cursor-pointer group shrink-0">
                    {data.image ? (
                        <div className="relative w-24 h-24">
                            <img src={typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image)} alt="Profile" className='w-full h-full rounded-full object-cover ring-4 ring-white shadow-md transition-all group-hover:ring-indigo-100' />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>

                    ) : (
                        <div className='w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:bg-slate-100 hover:border-indigo-400 transition-all duration-200 group-hover:shadow-sm'>
                            <Camera className="w-8 h-8 text-slate-400 mb-1 group-hover:text-indigo-500 transition-colors" />
                            <span className='text-xs text-slate-500 font-medium group-hover:text-indigo-600'>Add Photo</span>
                        </div>
                    )}
                    <input type="file" accept="image/jpeg , image/png,image/jpg" className='hidden' onChange={(e) => handleChange('image', e.target.files[0])} />
                </label>
                <div className="flex flex-col gap-2">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Profile Picture</p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                    {typeof data.image === 'object' && (
                        <label className='inline-flex items-center cursor-pointer gap-2 mt-1'>
                            <input type="checkbox" className='sr-only peer' checked={removeBackground} onChange={() => setRemoveBackground(prev => !prev)} />
                            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="text-sm text-gray-600 select-none">Remove Background</span>
                        </label>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {fields.map((field) => {
                    const Icon = field.icon;
                    return (
                        <div className="space-y-1" key={field.key}>
                            <label htmlFor={field.key} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Icon className="w-4 h-4 text-gray-400" />
                                {field.label} {field.required && <span className='text-red-500'>*</span>}
                            </label>
                            <input type={field.type} id={field.key} value={data[field.key] || ''} onChange={(e) => handleChange(field.key, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={`Enter your ${field.label.toLowerCase()}`} required={field.required} />

                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default PersonalInfoForm
