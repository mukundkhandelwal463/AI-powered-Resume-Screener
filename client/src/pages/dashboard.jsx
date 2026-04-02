import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, UploadCloudIcon, TrashIcon, PencilIcon, XIcon, FileText, Settings, LogOut, Edit3, Eye, Download, Share2, Calendar, User, Briefcase, GraduationCap, Sparkles } from 'lucide-react';
import { DummyResumeData } from '../assets/assets.js';

const Dashboard = () => {
  const [allResumes, setAllResumes] = useState([]);
  const [showCreateResume, setshowCreateResume] = useState(false);
  const [showUploadResume, setshowUploadResume] = useState(false);
  const [title, setTitle] = useState('');
  const [resume, setResume] = useState(null);
  const [editResumeId, setEditResumeId] = useState('');
  const navigate = useNavigate();
  
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-green-400 to-green-600',
    'from-orange-400 to-orange-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
  ];

  const loadAllResumes = async () => {
    // DummyResumeData is an object, but we need an array to map over it.
    // For now, we'll wrap it in an array.
    setAllResumes([DummyResumeData]);
  }

  const createResume = async (event) => {
    event.preventDefault();
    // Logic to create a new resume
    setshowCreateResume(false);
    navigate('/app/builder/res123');
  }

  const uploadResume = async (event) => {
    event.preventDefault();
    // Logic to upload a resume
    setshowUploadResume(false);
    navigate('/app/builder/res123');
  }
  const editTitle = async (event) => {
    event.preventDefault();
    // Logic to edit the title of a resume
  }

  const deleteResume = async (resumeId) => {
    // Logic to delete a resume
    const confirm = window.confirm('Are you sure you want to delete this resume?');
    if (confirm) {
      setAllResumes(prev => prev.filter(resume => resume._id !== resumeId));
    }
  }



  useEffect(() => {
    loadAllResumes();
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className="mb-10">
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>Resume Dashboard</h1>
          <p className='text-slate-600 dark:text-slate-400 text-lg'>Manage and create stunning professional resumes</p>
          <div className="mt-4 flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><FileText className="size-4" /> {allResumes.length} Resume{allResumes.length !== 1 && 's'}</span>
            <span className="flex items-center gap-1"><Calendar className="size-4" /> Last updated today</span>
            <span className="flex items-center gap-1"><User className="size-4" /> Welcome back!</span>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
          <button onClick={() => setshowCreateResume(true)} className='group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 h-48 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-8 text-left'>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <PlusIcon className='size-10' />
              </div>
              <h3 className='text-xl font-bold text-slate-800 dark:text-white mb-2'>Create New Resume</h3>
              <p className='text-slate-600 dark:text-slate-400 text-center'>Start from scratch with our professional templates</p>
            </div>
          </button>
          
          <button onClick={() => setshowUploadResume(true)} className='group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 h-48 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-8 text-left'>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="p-4 bg-gradient-to-br from-green-500 to-teal-500 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <UploadCloudIcon className='size-10' />
              </div>
              <h3 className='text-xl font-bold text-slate-800 dark:text-white mb-2'>Upload Existing</h3>
              <p className='text-slate-600 dark:text-slate-400 text-center'>Import a resume to enhance with our tools</p>
            </div>
          </button>
        </div>
        
        <div className='mb-6'>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="size-6 text-blue-600" />
              Your Resumes
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium">
              {allResumes.length} total
            </span>
          </div>
        </div>
        
        {allResumes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <FileText className="size-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No resumes yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Get started by creating your first professional resume</p>
            <button 
              onClick={() => setshowCreateResume(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Create Resume
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {allResumes.map((resume, index) => {
              const baseColor = colors[index % colors.length];
              return (
                <div key={resume._id} className='group relative bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700'>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${baseColor}`}></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className='text-lg font-bold text-gray-800 dark:text-white transition-all group-hover:text-blue-600'>{resume.title}</h3>
                        <p className='text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1'>
                          <Calendar className="size-3" />
                          Last updated: {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : 'Today'}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/view/${resume._id}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 hover:text-blue-600 transition-colors" title="View Resume">
                          <Eye className="size-4" />
                        </Link>
                        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 hover:text-green-600 transition-colors" title="Export">
                          <Download className="size-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditResumeId(resume._id); setTitle(resume.title) }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 hover:text-yellow-600 transition-colors" title="Edit Title">
                          <Edit3 className="size-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteResume(resume._id) }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 hover:text-red-600 transition-colors" title="Delete">
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <span className="flex items-center gap-1"><Briefcase className="size-4" /> {resume.experience?.length || 0} jobs</span>
                        <span className="flex items-center gap-1"><GraduationCap className="size-4" /> {resume.education?.length || 0} schools</span>
                        <span className="flex items-center gap-1"><Sparkles className="size-4" /> {resume.skills?.length || 0} skills</span>
                      </div>
                      
                      <Link to={`/app/builder/${resume._id}`} className="block w-full py-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-center hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/50 dark:hover:to-blue-800/50 hover:text-blue-600 transition-all">
                        Continue Editing
                      </Link>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Template:</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">{resume.template}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Visibility:</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resume.public ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                          {resume.public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {showCreateResume && (
          <form onSubmit={createResume} onClick={() => setshowCreateResume(false)}
            className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-50
            flex items-center justify-center p-4'>
            <div onClick={e => e.stopPropagation()} className='relative bg-white dark:bg-slate-800
            border dark:border-slate-700 shadow-2xl rounded-2xl w-full max-w-md p-8'>
              <h2 className='text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2'>
                <PlusIcon className="size-6 text-blue-600" />
                Create a New Resume
              </h2>
              <input value={title} type="text" onChange={(e) => setTitle(e.target.value)} placeholder='e.g., "Software Engineer Resume"' className='w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent' required />
              <button type="submit" className='w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'>Create Resume</button>
              <XIcon className='absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors' onClick={() => { setshowCreateResume(false); setTitle('') }} />
            </div>
          </form>
        )}
        
        {showUploadResume && (
          <form onSubmit={uploadResume} onClick={() => setshowUploadResume(false)}
            className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-50
            flex items-center justify-center p-4'>
            <div onClick={e => e.stopPropagation()} className='relative bg-white dark:bg-slate-800
            border dark:border-slate-700 shadow-2xl rounded-2xl w-full max-w-md p-8'>
              <h2 className='text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2'>
                <UploadCloudIcon className='size-6 text-green-600' />
                Upload an Existing Resume
              </h2>
              <input value={title} type="text" onChange={(e) => setTitle(e.target.value)} placeholder='e.g., "My Imported Resume"' className='w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent' required />
              <div className="mb-6">
                <label htmlFor='resume-input' className="cursor-pointer">
                  <div className='flex flex-col items-center justify-center w-full h-40 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors'>
                    {
                      resume ? (
                        <p className='font-medium text-green-600'>
                          {resume.name}
                        </p>
                      ) : (
                        <>
                          <UploadCloudIcon className='size-10 mb-3 stroke-1' />
                          <p className="font-semibold mb-1">Click to upload a file</p>
                          <p className="text-xs text-slate-400">PDF, DOCX up to 10MB</p>
                        </>
                      )
                    }
                  </div>
                </label>

                <input type='file' id='resume-input' className='hidden' accept='.pdf,.doc,.docx' onChange={(e) => setResume(e.target.files[0])} />
              </div>
              <button type="submit" className='w-full py-3.5 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'>Upload Resume</button>
              <XIcon className='absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors' onClick={() => { setshowUploadResume(false); setTitle('') }} />
            </div>
          </form>
        )
        }

        {editResumeId && (
          <form onSubmit={editTitle} onClick={() => setEditResumeId('')}
            className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-50
            flex items-center justify-center p-4'>
            <div onClick={e => e.stopPropagation()} className='relative bg-white dark:bg-slate-800
            border dark:border-slate-700 shadow-2xl rounded-2xl w-full max-w-md p-8'>
              <h2 className='text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2'>
                <Edit3 className='size-6 text-yellow-600' />
                Edit Resume Title
              </h2>
              <input value={title} type="text" onChange={(e) => setTitle(e.target.value)} placeholder='e.g., "Software Engineer Resume"' className='w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent' required />
              <div className="flex gap-3">
                <button type="submit" className='flex-1 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'>Update Title</button>
                <button type="button" onClick={() => setEditResumeId('')} className='flex-1 py-3.5 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold rounded-xl shadow hover:shadow-md transition-all'>Cancel</button>
              </div>
              <XIcon className='absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors' onClick={() => { setEditResumeId(''); setTitle('') }} />
            </div>
          </form>
        )}

      </div>
    </div>
  )
}

export default Dashboard;
