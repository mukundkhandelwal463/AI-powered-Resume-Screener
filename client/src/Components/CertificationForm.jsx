import { Award, Plus, Trash } from 'lucide-react';
import React from 'react';

const CertificationForm = ({ data, onChange }) => {
    const MAX = 4;

    const addCert = () => {
        if (data.length >= MAX) return;
        onChange([...data, { name: '', date: '', link: '' }]);
    };

    const removeCert = (i) => onChange(data.filter((_, idx) => idx !== i));

    const update = (i, field, value) => {
        const updated = [...data];
        updated[i] = { ...updated[i], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Certifications</h3>
                    <p className="text-sm text-gray-500">Add up to {MAX} certifications (name, date, link).</p>
                </div>
                <button
                    onClick={addCert}
                    disabled={data.length >= MAX}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="size-4" />
                    Add
                </button>
            </div>

            {data.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Award className="mx-auto mb-2 size-8 text-gray-300" />
                    <p className="text-sm text-gray-500">No certifications added yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.map((cert, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                            {/* Name */}
                            <input
                                value={cert.name || ''}
                                onChange={(e) => update(i, 'name', e.target.value)}
                                type="text"
                                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Certification name"
                            />
                            {/* Date */}
                            <input
                                value={cert.date || ''}
                                onChange={(e) => update(i, 'date', e.target.value)}
                                type="text"
                                className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Mar 2024"
                            />
                            {/* Link */}
                            <input
                                value={cert.link || ''}
                                onChange={(e) => update(i, 'link', e.target.value)}
                                type="text"
                                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Link (optional)"
                            />
                            <button onClick={() => removeCert(i)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                                <Trash className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CertificationForm;
