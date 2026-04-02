import React from 'react'
import ClassicTemplate from './templates/ClassicTemplate.jsx'
import ModernTemplate from './templates/ModernTemplate.jsx'
import MinimalTemplate from './templates/MinimalTemplate.jsx'
import MinimalImageTemplate from './templates/MinimalImageTemplate.jsx'



const ResumePreview = ({ data, template, accentColor, classes = '' }) => {
    const renderTemplate = () => {
        switch (template) {
            case 'modern':
                return <ModernTemplate data={data} accentColor={accentColor} />;
            case 'minimal':
                return <MinimalTemplate data={data} accentColor={accentColor} />;
            case 'minimal-image':
                return <MinimalImageTemplate data={data} accentColor={accentColor} />;

            default:
                return <ClassicTemplate data={data} accentColor={accentColor} />;
        }
    }
    return (
        <div 
            id="resume-preview" 
            className={'bg-white min-h-[600px] print:border-none print:shadow-none print:bg-transparent print:p-0 ' + classes}
            style={{ 
                zoom: data?.font_size === 'sm' ? 0.9 : data?.font_size === 'lg' ? 1.05 : 1,
                transformOrigin: 'top center'
            }}
        >
            {renderTemplate()}
            <style>
                {`
            #resume-preview ::-webkit-scrollbar {
                width: 8px;
            }
            #resume-preview ::-webkit-scrollbar-thumb {
                background-color: rgba(100, 116, 139, 0.5);
                border-radius: 4px;
            }
            #resume-preview ::-webkit-scrollbar-track {
                background-color: transparent;
            }
                @page { size: A4; margin: 0; }
                @media print {
                html, body {
                    width: 210mm;
                    height: 297mm;
                    overflow: hidden;
                    margin: 0;
                    padding: 0;
                }
                #resume-preview {
                    box-shadow: none;
                }
            }
        `}
            </style>
        </div>
    )
}

export default ResumePreview
