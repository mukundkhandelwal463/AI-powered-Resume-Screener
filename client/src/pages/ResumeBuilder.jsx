import React, { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DummyResumeData } from '../assets/assets'
import { 
  ArrowLeftIcon, Briefcase, ChevronLeft, ChevronRight, EyeIcon, 
  EyeOffIcon, FileText, FolderIcon, GraduationCap, Share2Icon, 
  Sparkle, User, Save, Download, Layout, Target
} from 'lucide-react'
import PersonalInfoForm from '../Components/PersonalInfoForm.jsx'
import ResumePreview from '../Components/ResumePreview.jsx'
import ColorPicker from '../Components/ColorPicker.jsx'
import TemplateSelector from '../Components/TemplateSelector.jsx'
import EducationForm from '../Components/EducationForm.jsx'
import ProjectForm from '../Components/ProjectForm.jsx'
import ProfessionalSummaryForm from '../Components/ProfessionalSummaryForm.jsx'

import FontSizePicker from '../Components/FontSizePicker.jsx'
import KeywordForm from '../Components/KeywordForm.jsx'
import SkillForm from '../Components/SkillForm.jsx'
import ExperienceForm from '../Components/ExperienceForm.jsx'

const ResumeBuilder = () => {
  const { resumeId } = useParams()

  const [resumeData, setResumeData] = useState({
    _id: '',
    title: '',
    personal_info: {},
    professional_summary: '',
    experience: [],
    education: [],
    project: [],
    skills: [],
    keywords: [],
    template: 'classic',
    accent_color: 'grey',
    font_size: 'base',
    public: false,
  })

  const loadExistingResume = useCallback(() => {
    if (DummyResumeData && DummyResumeData._id === resumeId && resumeId !== 'default') {
      setResumeData(DummyResumeData);
      document.title = DummyResumeData.title;
      return;
    }
    
    // Check if the user came from ATS Analyzer with auto-fill data
    try {
      const raw = localStorage.getItem('resume_analysis_result');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.prefill_data) {
          setResumeData(prev => ({
            ...prev,
            ...parsed.prefill_data,
            public: false
          }));
          return;
        }
      }
    } catch(err) {
      console.error('Error loading prefill data from ATS analyzer', err);
    }
  }, [resumeId]);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [removeBackground, setRemoveBackground] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const sections = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'summary', name: 'Summary', icon: FileText },
    { id: 'experience', name: 'Experience', icon: Briefcase },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'project', name: 'Project', icon: FolderIcon },
    { id: 'skills', name: 'Skills', icon: Sparkle },
    { id: 'keywords', name: 'ATS Keywords', icon: Target },
  ]

  const activeSection = sections[activeSectionIndex];

  useEffect(() => {
    loadExistingResume();
  }, [loadExistingResume]);

  const getAtsCategoryFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem('resume_analysis_result');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return String(parsed?.analysis?.category || '').trim();
    } catch (_err) {
      return '';
    }
  }, []);

  const normalizeSkills = (skills) => {
    if (!Array.isArray(skills)) return '';
    return skills
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.name || item.skill || item.title || '';
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const normalizeExperience = (experience) => {
    if (!Array.isArray(experience)) return '';
    return experience
      .map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return '';
        const parts = [
          item.position,
          item.company,
          item.description,
          item.start_date && item.end_date ? `${item.start_date} - ${item.end_date}` : '',
        ].filter(Boolean);
        return parts.join(' | ');
      })
      .filter(Boolean)
      .join('\n');
  };

  const handleGenerateSummary = useCallback(async () => {
    if (isGeneratingSummary) return;

    const professionalTitle = String(resumeData?.personal_info?.professional_title || '').trim();
    const streamOrCategory = getAtsCategoryFromStorage();
    const skillsText = normalizeSkills(resumeData?.skills);
    const experienceText = normalizeExperience(resumeData?.experience);

    if (!professionalTitle && !streamOrCategory) {
      window.alert('Add Professional Title or run ATS analysis first so AI can use Category/Stream.');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_title: professionalTitle,
          stream_or_category: streamOrCategory,
          skills: skillsText,
          experience: experienceText,
          current_summary: resumeData?.professional_summary || '',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to generate summary.');
      }

      const summary = String(result?.summary || '').trim();
      if (summary) {
        setResumeData((prev) => ({ ...prev, professional_summary: summary }));
      } else {
        throw new Error('AI returned empty summary.');
      }
    } catch (err) {
      window.alert(err?.message || 'Could not generate summary right now.');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [getAtsCategoryFromStorage, isGeneratingSummary, resumeData]);

  const changeResumeVisibility = async() => {
    setResumeData({...resumeData, public: !resumeData.public})
  }

  const handleShare = async () => {
    const frontendUrl = window.location.href.split('/app')[0];
    const resumeUrl = frontendUrl + '/view/' + resumeData._id;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Check out my resume', url: resumeUrl });
      } catch (error) { console.log('Error sharing', error); }
    } else {
      alert('Link copied: ' + resumeUrl)
    }
  }

  const downloadResume = () => window.print();

  return (
    <div className="min-h-screen pb-20 print:bg-none print:pb-0" style={{ background: 'linear-gradient(180deg, #fffaf4 0%, #f5efe6 44%, #efe8dd 100%)' }}>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full print:hidden" style={{ background: 'rgba(255,253,249,0.75)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,0.55)', boxShadow: '0 12px 40px rgba(40,25,13,0.08)' }}>
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <a href='/' className='flex items-center gap-2 text-stone-600 hover:text-orange-600 transition-colors font-medium'>
            <ArrowLeftIcon className='size-5' />
            <span className="hidden sm:inline">Back</span>
          </a>

          <div className="flex items-center gap-3">
             <a href="/upload" className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border" style={{ background: 'rgba(255,225,217,0.4)', color: '#e14b29', borderColor: 'rgba(225,75,41,0.15)' }}>
              <Target className="size-4" />
              Check ATS Score
            </a>
            <a href="/jobs" className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border" style={{ background: 'rgba(124,214,199,0.15)', color: '#1e6e63', borderColor: 'rgba(124,214,199,0.3)' }}>
              <Briefcase className="size-4" />
              Find Jobs
            </a>
            <div className="flex p-1 rounded-full" style={{ background: 'rgba(24,35,38,0.06)' }}>
               <button onClick={changeResumeVisibility} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${resumeData.public ? 'bg-white shadow-sm text-orange-600 font-bold' : 'text-stone-500'}`}>
                {resumeData.public ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                {resumeData.public ? 'Public' : 'Private'}
              </button>
            </div>
            {resumeData.public && (
              <button onClick={handleShare} className="p-2 text-stone-600 hover:bg-white/60 rounded-full transition-all">
                <Share2Icon className="size-5" />
              </button>
            )}
            <button onClick={downloadResume} className="flex items-center gap-2 px-4 py-2 text-white rounded-full font-bold text-sm transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #ff6b4a, #e14b29)', boxShadow: '0 10px 24px rgba(225,75,41,0.22)' }}>
              <Download className="size-4" />
              Download
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ background: 'rgba(24,35,38,0.06)' }}>
            <div 
              className="h-full transition-all duration-500 ease-out"
              style={{ width: `${((activeSectionIndex + 1) / sections.length) * 100}%`, background: 'linear-gradient(90deg, #ff6b4a, #e14b29)' }}
            />
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-8 print:p-0 print:m-0 print:max-w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 print:block print:gap-0">
          
          {/* Left Side: Form Controls (Col-5) */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            <div className="rounded-3xl" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', boxShadow: '0 24px 60px rgba(38,28,20,0.12)' }}>
              
              {/* Form Header with Tab-like Navigation */}
              <div className="p-4 rounded-t-3xl" style={{ borderBottom: '1px solid rgba(24,35,38,0.06)', background: 'rgba(255,253,249,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #ff6b4a, #ff8f57)', boxShadow: '0 8px 20px rgba(255,107,74,0.25)' }}>
                      {React.createElement(activeSection.icon, { size: 20 })}
                    </div>
                    <h2 className="text-lg font-bold text-stone-800">{activeSection.name}</h2>
                  </div>
                  <div className="flex gap-2">
                     <TemplateSelector selectedTemplate={resumeData.template} onChange={(t) => setResumeData(p => ({ ...p, template: t }))} />
                     <ColorPicker selectedColor={resumeData.accent_color} onChange={(c)=>setResumeData(p =>({...p, accent_color:c}))}/>
                     <FontSizePicker selectedSize={resumeData.font_size} onChange={(s) => setResumeData(p => ({ ...p, font_size: s }))} />
                  </div>
                </div>

                {/* Section Bubbles */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {sections.map((sec, idx) => (
                    <button 
                      key={sec.id}
                      onClick={() => setActiveSectionIndex(idx)}
                      className={`p-2 rounded-xl transition-all flex-shrink-0 ${activeSectionIndex === idx ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'text-stone-400 hover:bg-white/60'}`}
                    >
                      <sec.icon size={18} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Body */}
              <div className="p-6 min-h-[400px]">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {activeSection.id === 'personal' && <PersonalInfoForm data={resumeData.personal_info || {}} onChange={(d) => setResumeData(p => ({ ...p, personal_info: d }))} removeBackground={removeBackground} setRemoveBackground={setRemoveBackground} />}
                  {activeSection.id === 'summary' && (
                    <ProfessionalSummaryForm
                      data={resumeData.professional_summary || ''}
                      onChange={(d) => setResumeData(p => ({ ...p, professional_summary: d }))}
                      onGenerateSummary={handleGenerateSummary}
                      isGenerating={isGeneratingSummary}
                      professionalTitle={resumeData?.personal_info?.professional_title || ''}
                      streamCategory={getAtsCategoryFromStorage()}
                    />
                  )}
                  {activeSection.id === 'experience' && <ExperienceForm data={resumeData.experience || []} onChange={(d) => setResumeData(p => ({ ...p, experience: d }))} />}
                  {activeSection.id === 'education' && <EducationForm data={resumeData.education || []} onChange={(d) => setResumeData(p => ({ ...p, education: d }))} />}
                  {activeSection.id === 'project' && <ProjectForm data={resumeData.project || []} onChange={(d) => setResumeData(p => ({ ...p, project: d }))} />}
                  {activeSection.id === 'skills' && <SkillForm data={resumeData.skills || []} onChange={(d) => setResumeData(p => ({ ...p, skills: d }))} />}
                  {activeSection.id === 'keywords' && <KeywordForm atsAnalysis={JSON.parse(localStorage.getItem('resume_analysis_result') || '{}')?.analysis} data={resumeData.keywords || []} onChange={(d) => setResumeData(p => ({ ...p, keywords: d }))} />}
                </div>
              </div>

              {/* Form Footer */}
              <div className="p-4 flex justify-between items-center rounded-b-3xl" style={{ borderTop: '1px solid rgba(24,35,38,0.06)', background: 'rgba(255,253,249,0.5)' }}>
                <button 
                  onClick={() => setActiveSectionIndex(p => Math.max(p - 1, 0))}
                  disabled={activeSectionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-stone-600 disabled:opacity-30 font-medium"
                >
                  <ChevronLeft size={18} /> Previous
                </button>
                
                <div className="flex gap-3">
                   <button className="flex items-center gap-2 px-5 py-2 text-white rounded-full font-bold transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #ff6b4a, #e14b29)', boxShadow: '0 10px 24px rgba(225,75,41,0.22)' }}>
                    <Save size={18} />
                    Save
                  </button>
                  <button 
                    onClick={() => setActiveSectionIndex(p => Math.min(p + 1, sections.length - 1))}
                    disabled={activeSectionIndex === sections.length - 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-stone-700 disabled:opacity-30 font-medium" style={{ background: 'rgba(24,35,38,0.06)' }}
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Preview (Col-7) */}
          <div className="lg:col-span-7 print:w-[210mm] print:mx-auto">
            <div className="sticky top-24 print:static print:top-0">
              <div className="flex items-center justify-between mb-4 px-2 print:hidden">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#536266', letterSpacing: '0.08em' }}>
                  <Layout size={16} /> Live Preview
                </h3>
                <div className="text-xs" style={{ color: '#536266' }}>Autosaved just now</div>
              </div>

              <div className="group relative rounded-3xl bg-white p-4 transition-all print:p-0 print:border-none print:shadow-none print:bg-transparent" style={{ border: '1px solid rgba(255,255,255,0.55)', boxShadow: '0 24px 60px rgba(38,28,20,0.12)' }}>
                <ResumePreview 
                  data={resumeData} 
                  template={resumeData.template} 
                  accentColor={resumeData.accent_color} 
                  classes={`${removeBackground ? 'bg-transparent border-none shadow-none' : ''} max-h-[80vh] overflow-y-auto no-scrollbar print:max-h-none print:overflow-visible`} 
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default ResumeBuilder
