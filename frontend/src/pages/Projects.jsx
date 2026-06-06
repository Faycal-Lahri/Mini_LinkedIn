import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import { BrandLoader } from '../components/Loader';
import useToastStore from '../store/toastStore';
import useConfirmStore from '../store/confirmStore';

const typeConfig = {
  ACADEMIC:    { label: 'Académique',       icon: 'school', color: 'bg-[#0071e3]/10 text-[#0071e3]' },
  RESEARCH:    { label: 'Recherche',        icon: 'science',  color: 'bg-[#af52de]/10 text-[#af52de]' },
  ENGINEERING: { label: 'Ingénierie',       icon: 'handyman', color: 'bg-[#ff9500]/10 text-[#ff9500]' },
  STUDY_GROUP: { label: "Groupe d'étude",   icon: 'menu_book', color: 'bg-[#34c759]/10 text-[#34c759]' },
};

const STATUS_LABELS = {
  APPROVED: { text: 'Membre',   cls: 'bg-[#34c759]/10 text-[#34c759] border-transparent' },
  PENDING:  { text: 'En attente', cls: 'bg-[#ff9500]/10 text-[#ff9500] border-transparent' },
  INVITED:  { text: 'Invité',   cls: 'bg-[#af52de]/10 text-[#af52de] border-transparent' },
  OWNER:    { text: 'Propriétaire', cls: 'bg-[#0071e3]/10 text-[#0071e3] border-transparent' },
};

const BLANK_FORM = { title: '', description: '', objectives: '', required_skills: '', conditions: '', type: 'ACADEMIC', max_members: '' };

const getRoleLabel = (role) => {
  const labels = {
    STUDENT: 'Étudiant',
    TEACHER: 'Enseignant',
    RESEARCHER: 'Chercheur',
    ADMIN: 'Administrateur',
  };
  return labels[role] || role;
};

const getProjectCover = (type) => {
  switch (type) {
    case 'RESEARCH':
      return "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80";
    case 'ENGINEERING':
      return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80";
    case 'STUDY_GROUP':
      return "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80";
    case 'ACADEMIC':
    default:
      return "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80";
  }
};

export default function Projects() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { showConfirm } = useConfirmStore();

  const [projects, setProjects]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [formType, setFormType]           = useState('ACADEMIC');
  const [newProject, setNewProject]       = useState(BLANK_FORM);
  const [managingProject, setManagingProject] = useState(null);
  const [activeTab, setActiveTab]         = useState('tasks'); // 'tasks' or 'members'
  
  const [members, setMembers]             = useState([]);
  const [tasks, setTasks]                 = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [tasksLoading, setTasksLoading]   = useState(false);
  
  const [inviteSearch, setInviteSearch]   = useState('');
  const [connections, setConnections]     = useState([]);
  const [showInvite, setShowInvite]       = useState(false);
  const [expandedId, setExpandedId]       = useState(null);
  
  const [newTaskTitle, setNewTaskTitle]   = useState('');
  const [filterType, setFilterType]       = useState('ALL');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const [projectChannel, setProjectChannel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatAttachedFile, setChatAttachedFile] = useState(null);
  const [newChatMessageText, setNewChatMessageText] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [addTaskDescription, setAddTaskDescription] = useState('');
  const [addTaskSubtasks, setAddTaskSubtasks] = useState([]);
  const [newSubtaskDraftText, setNewSubtaskDraftText] = useState('');
  const [newSubtaskTexts, setNewSubtaskTexts] = useState({});
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [editingTaskDescription, setEditingTaskDescription] = useState('');
  
  const chatEndRef = useRef(null);
  const chatFileInputRef = useRef(null);

  const isResearcher = ['TEACHER', 'RESEARCHER'].includes(user?.role);
  const isReadOnly = managingProject && 
    managingProject.user_membership_status !== 'OWNER' && 
    managingProject.user_membership_status !== 'APPROVED' && 
    user?.role !== 'ADMIN';

  const fetchProjects = useCallback(() => {
    setLoading(true);
    api.get('/projects')
      .then(r => setProjects(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  /* ── Create project ── */
  const openForm = (type) => { 
    setFormType(type); 
    setNewProject({ ...BLANK_FORM, type }); 
    setShowForm(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closeForm = () => { setShowForm(false); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/projects', { ...newProject, type: formType });
      setProjects(p => [res.data, ...p]);
      closeForm();
      addToast('Projet créé avec succès !', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Erreur lors de la création.', 'error');
    }
  };

  /* ── Join / Leave / Delete ── */
  const handleJoin = async (id) => {
    try {
      await api.post(`/projects/${id}/join`);
      addToast('Demande envoyée au propriétaire !', 'success');
      fetchProjects();
    } catch (err) { addToast(err.response?.data?.message || 'Erreur.', 'error'); }
  };

  const handleLeave = (id) => showConfirm('Quitter ce projet ?', async () => {
    try { 
      await api.post(`/projects/${id}/leave`); 
      fetchProjects(); 
      addToast('Vous avez quitté le projet.', 'info'); 
    } catch { addToast("Erreur lors de l'action.", 'error'); }
  });

  const handleDelete = (id) => showConfirm('Supprimer ce projet ?', async () => {
    try { 
      await api.delete(`/projects/${id}`); 
      setProjects(p => p.filter(x => x.id !== id)); 
      addToast('Projet supprimé.', 'info'); 
    } catch { addToast('Erreur.', 'error'); }
  });

  /* ── Accept/Decline invitation ── */
  const handleAcceptInvitation = async (projectId) => {
    try {
      await api.post(`/projects/${projectId}/invite/accept`);
      addToast('Invitation acceptée !', 'success');
      fetchProjects();
    } catch (err) { addToast(err.response?.data?.message || 'Erreur.', 'error'); }
  };

  const handleDeclineInvitation = async (projectId) => {
    try {
      await api.post(`/projects/${projectId}/invite/decline`);
      addToast('Invitation refusée.', 'info');
      fetchProjects();
    } catch (err) { addToast(err.response?.data?.message || 'Erreur.', 'error'); }
  };

  /* ── Manage Project modal ── */
  const openManage = async (project) => {
    setManagingProject(project);
    const status = project.user_membership_status;
    const isOwner = status === 'OWNER';
    const isApproved = status === 'APPROVED';
    const isAdmin = user?.role === 'ADMIN';

    // Reset workspace states
    setProjectChannel(null);
    setChatMessages([]);
    setNewChatMessageText('');
    setExpandedTaskId(null);
    setShowAddTaskForm(false);
    setAddTaskDescription('');
    setAddTaskSubtasks([]);
    setNewSubtaskDraftText('');
    setNewSubtaskTexts({});
    setEditingTaskId(null);

    if (isOwner || isAdmin) {
      setActiveTab('members');
    } else if (isApproved) {
      setActiveTab('tasks');
    } else {
      setActiveTab('info');
    }
    setShowInvite(false);
    setInviteSearch('');
    
    setMembersLoading(true);
    setTasksLoading(true);
    setMembers([]);
    setTasks([]);
    
    try {
      const [mRes, cRes, tRes, channelsRes] = await Promise.all([
        api.get(`/projects/${project.id}/members`),
        api.get('/network/connections'),
        api.get(`/projects/${project.id}/tasks`),
        api.get('/chat/channels').catch(() => ({ data: { project: [] } }))
      ]);
      setMembers(mRes.data);
      setConnections(cRes.data?.connections || cRes.data || []);
      setTasks(tRes.data);

      const projectChan = (channelsRes.data?.project || []).find(c => c.project_id === project.id);
      setProjectChannel(projectChan);
    } catch (err) { 
      console.error(err);
      addToast('Erreur lors du chargement des données.', 'error'); 
    } finally { 
      setMembersLoading(false); 
      setTasksLoading(false); 
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.post(`/projects/${managingProject.id}/members/${userId}/approve`);
      setMembers(m => m.map(x => x.user.id === userId ? { ...x, status: 'APPROVED' } : x));
      addToast('Membre approuvé !', 'success');
    } catch (err) { addToast(err.response?.data?.message || 'Erreur.', 'error'); }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/projects/${managingProject.id}/members/${userId}/reject`);
      setMembers(m => m.filter(x => x.user.id !== userId));
      addToast('Demande refusée.', 'info');
    } catch (err) { addToast(err.response?.data?.message || 'Erreur.', 'error'); }
  };

  const handleInvite = async (userId) => {
    try {
      await api.post(`/projects/${managingProject.id}/invite/${userId}`);
      addToast('Invitation envoyée !', 'success');
      const mRes = await api.get(`/projects/${managingProject.id}/members`);
      setMembers(mRes.data);
    } catch (err) { addToast(err.response?.data?.message || 'Erreur.', 'error'); }
  };

  /* ── Chat Messaging ── */
  const fetchChatMessages = useCallback(async () => {
    if (!projectChannel) return;
    try {
      const res = await api.get(`/chat/channels/${projectChannel.id}/messages`);
      setChatMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [projectChannel]);

  useEffect(() => {
    if (projectChannel) {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [projectChannel, fetchChatMessages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChatMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const content = textOverride !== null ? textOverride : newChatMessageText;
    if ((!content.trim() && !chatAttachedFile) || !projectChannel) return;

    setSendingMessage(true);
    const tempId = Date.now();
    const localFileUrl = chatAttachedFile ? URL.createObjectURL(chatAttachedFile) : null;
    const tempMessage = {
      id: tempId,
      content: content,
      sender: user,
      created_at: new Date().toISOString(),
      file_url: localFileUrl,
      isOptimistic: true
    };
    setChatMessages(prev => [...prev, tempMessage]);
    setNewChatMessageText('');
    setChatAttachedFile(null);

    try {
      let res;
      if (chatAttachedFile) {
        const formData = new FormData();
        formData.append('content', content || ' ');
        formData.append('file', chatAttachedFile);
        res = await api.post(`/chat/channels/${projectChannel.id}/messages`, formData);
      } else {
        res = await api.post(`/chat/channels/${projectChannel.id}/messages`, { content });
      }
      setChatMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
      if (localFileUrl) URL.revokeObjectURL(localFileUrl);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSendingMessage(false);
    }
  };

  /* ── Task Management ── */
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await api.post(`/projects/${managingProject.id}/tasks`, { 
        title: newTaskTitle,
        description: addTaskDescription,
        sub_tasks: addTaskSubtasks
      });
      setTasks(prev => [res.data, ...prev]);
      setNewTaskTitle('');
      setAddTaskDescription('');
      setAddTaskSubtasks([]);
      setShowAddTaskForm(false);
      addToast('Tâche ajoutée.', 'success');
      
      // Update local projects count for progress bar
      setProjects(prev => prev.map(p => p.id === managingProject.id ? { ...p, tasks_count: (p.tasks_count || 0) + 1 } : p));
    } catch (err) { addToast('Erreur lors de l\'ajout.', 'error'); }
  };

  const toggleTaskStatus = async (task) => {
    const isOwner = managingProject.user_membership_status === 'OWNER';
    const isAdmin = user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      addToast("Seul l'administrateur du projet peut modifier les tâches.", 'error');
      return;
    }

    const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      const res = await api.patch(`/projects/${managingProject.id}/tasks/${task.id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
      
      // Update local projects count for progress bar
      setProjects(prev => prev.map(p => {
        if (p.id === managingProject.id) {
          const change = newStatus === 'COMPLETED' ? 1 : -1;
          return { ...p, completed_tasks_count: (p.completed_tasks_count || 0) + change };
        }
        return p;
      }));
    } catch (err) { addToast('Erreur lors de la modification.', 'error'); }
  };

  const handleDeleteTask = async (taskId) => {
    const isOwner = managingProject.user_membership_status === 'OWNER';
    const isAdmin = user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      addToast("Seul l'administrateur du projet peut supprimer des tâches.", 'error');
      return;
    }

    showConfirm("Êtes-vous sûr de vouloir supprimer cette tâche ?", async () => {
      try {
        const taskToDelete = tasks.find(t => t.id === taskId);
        await api.delete(`/projects/${managingProject.id}/tasks/${taskId}`);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        addToast('Tâche supprimée.', 'info');
        
        // Update local projects count
        setProjects(prev => prev.map(p => {
          if (p.id === managingProject.id) {
            const wasCompleted = taskToDelete.status === 'COMPLETED';
            return { 
              ...p, 
              tasks_count: Math.max(0, (p.tasks_count || 0) - 1),
              completed_tasks_count: wasCompleted ? Math.max(0, (p.completed_tasks_count || 0) - 1) : (p.completed_tasks_count || 0)
            };
          }
          return p;
        }));
      } catch (err) { addToast('Erreur.', 'error'); }
    });
  };

  const handleToggleSubtask = async (task, subtaskId) => {
    const isOwner = managingProject.user_membership_status === 'OWNER';
    const isAdmin = user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      addToast("Seul l'administrateur du projet peut modifier les tâches.", 'error');
      return;
    }

    const updatedSubtasks = (task.sub_tasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    try {
      const res = await api.patch(`/projects/${managingProject.id}/tasks/${task.id}`, {
        sub_tasks: updatedSubtasks
      });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } catch (err) {
      addToast('Erreur lors de la mise à jour de la sous-tâche.', 'error');
    }
  };

  const handleAddSubtaskToTask = async (task) => {
    const text = newSubtaskTexts[task.id];
    if (!text || !text.trim()) return;

    const isOwner = managingProject.user_membership_status === 'OWNER';
    const isAdmin = user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      addToast("Seul l'administrateur du projet peut modifier les tâches.", 'error');
      return;
    }

    const newSubtask = {
      id: Date.now(),
      title: text.trim(),
      completed: false
    };

    const updatedSubtasks = [...(task.sub_tasks || []), newSubtask];

    try {
      const res = await api.patch(`/projects/${managingProject.id}/tasks/${task.id}`, {
        sub_tasks: updatedSubtasks
      });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
      setNewSubtaskTexts(prev => ({ ...prev, [task.id]: '' }));
      addToast('Sous-tâche ajoutée.', 'success');
    } catch (err) {
      addToast('Erreur lors de l\'ajout de la sous-tâche.', 'error');
    }
  };

  const handleDeleteSubtask = async (task, subtaskId) => {
    const isOwner = managingProject.user_membership_status === 'OWNER';
    const isAdmin = user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) return;

    const updatedSubtasks = (task.sub_tasks || []).filter(st => st.id !== subtaskId);

    try {
      const res = await api.patch(`/projects/${managingProject.id}/tasks/${task.id}`, {
        sub_tasks: updatedSubtasks
      });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
      addToast('Sous-tâche supprimée.', 'info');
    } catch (err) {
      addToast('Erreur.', 'error');
    }
  };

  const handleUpdateTaskDetails = async (task) => {
    const title = editingTaskTitle.trim();
    if (!title) return;

    try {
      const res = await api.patch(`/projects/${managingProject.id}/tasks/${task.id}`, {
        title,
        description: editingTaskDescription
      });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
      setEditingTaskId(null);
      addToast('Tâche mise à jour.', 'success');
    } catch (err) {
      addToast('Erreur lors de la modification.', 'error');
    }
  };

  /* ── Helpers ── */
  const alreadyInProject = (userId) => members.some(m => m.user?.id === userId);
  const filteredConnections = connections.filter(c => {
    const name = `${c?.first_name || ''} ${c?.last_name || ''}`.toLowerCase();
    return name.includes(inviteSearch.toLowerCase()) && !alreadyInProject(c?.id);
  });

  const filteredProjects = filterType === 'ALL' 
    ? projects 
    : projects.filter(p => p.type === filterType);

  if (loading) return <BrandLoader />;

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[1128px] mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Sidebar (Desktop: col-span-3) - Flat macOS Sonata panel */}
          <aside className="lg:col-span-3 space-y-5 animate-fadeInUp sticky top-[80px] self-start">
            {/* User collaboration status card */}
            <div className="bg-white border border-black/5 rounded-[20px] overflow-hidden shadow-apple-sm animate-fadeIn">
              {/* Cover Banner */}
              <div className="h-20 bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] relative overflow-hidden">
                {user?.profile?.website_url ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${user.profile.website_url}`} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 opacity-90 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/10 text-[64px] absolute -right-2 -bottom-2 select-none">
                      hub
                    </span>
                  </div>
                )}
              </div>
              {/* Profile Photo & Name */}
              <div className="p-5 text-center border-b border-black/[0.04] relative">
                <div className="w-20 h-20 rounded-full border-4 border-white bg-[#f5f5f7] flex items-center justify-center mx-auto -mt-10 overflow-hidden shadow-apple-md relative z-10 transition-transform duration-300 hover:scale-105">
                  {user?.profile?.photo_url ? (
                    <img 
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${user.profile.photo_url}`} 
                      className="w-full h-full object-cover" 
                      alt="" 
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                    />
                  ) : (
                    <span className="text-[#86868b] font-bold text-2xl">{user?.first_name?.[0]}</span>
                  )}
                </div>
                <h3 className="font-bold text-[16px] text-[#1d1d1f] mt-3 truncate capitalize">
                  {user?.first_name} {user?.last_name}
                </h3>
                <p className="text-[11px] text-[#86868b] font-semibold uppercase tracking-wider mt-1 truncate max-w-full px-1" title={user?.profile?.biography?.split('\n')[0] || getRoleLabel(user?.role)}>
                  {user?.profile?.biography?.split('\n')[0] || getRoleLabel(user?.role)}
                </p>
              </div>

              {/* Statistics */}
              <div className="p-4 bg-[#f5f5f7]/50 space-y-2.5 text-[12px]">
                <div className="flex justify-between items-center text-[#6e6e73] font-medium">
                  <span>Projets actifs</span>
                  <span className="font-bold text-[#1d1d1f]">
                    {projects.filter(p => p.user_membership_status === 'OWNER' || p.user_membership_status === 'APPROVED').length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#6e6e73] font-medium">
                  <span>Collaborations</span>
                  <span className="font-bold text-[#0071e3]">
                    {projects.filter(p => p.user_membership_status === 'APPROVED').length}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Middle Main Panel (Desktop: col-span-6) */}
          <section className="lg:col-span-6 space-y-6">
            
            {/* Hub Header Card (App Store Banner Layout) */}
            <div className="bg-white border border-black/5 rounded-[24px] p-6 shadow-apple-sm flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden animate-fadeInUp">
              <div className="w-14 h-14 rounded-[16px] bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center flex-shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-[32px]">folder_special</span>
              </div>
              <div className="flex-1 text-center sm:text-left z-10">
                <h1 className="text-[22px] font-bold text-[#1d1d1f] tracking-tight">Hub de Collaboration</h1>
                <p className="text-[13px] text-[#6e6e73] mt-0.5">
                  L'espace d'innovation académique. Rejoignez des initiatives existantes ou lancez votre projet académique.
                </p>
              </div>
              {/* Graphic background */}
              <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-[#0071e3]/5 to-transparent pointer-events-none" />
            </div>

            {/* Form to Create New Project (macOS Sheet Vibe) */}
            {showForm && (
              <div className="bg-white border border-black/5 rounded-[24px] p-6 shadow-apple-lg animate-fadeInUp relative">
                <button 
                  onClick={closeForm} 
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] flex items-center justify-center text-gray-500 transition-all press-effect"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>

                <h3 className="text-base font-bold text-[#1d1d1f] flex items-center gap-2 mb-5">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${formType === 'RESEARCH' ? 'bg-[#af52de]/10 text-[#af52de]' : 'bg-[#0071e3]/10 text-[#0071e3]'}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {formType === 'RESEARCH' ? 'science' : 'school'}
                    </span>
                  </span>
                  {formType === 'RESEARCH' ? 'Lancer un appel à collaboration (Recherche)' : 'Créer un projet académique'}
                </h3>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Titre du projet *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Analyse Prédictive avec Python" 
                        className="w-full h-[38px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white px-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all font-medium" 
                        value={newProject.title} 
                        onChange={e => setNewProject({ ...newProject, title: e.target.value })} 
                        required 
                      />
                    </div>

                    {formType !== 'RESEARCH' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Catégorie</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="w-full h-[38px] px-3.5 bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:border-[#0071e3] rounded-[10px] text-xs outline-none transition-all cursor-pointer shadow-sm font-semibold flex items-center justify-between text-[#1d1d1f]"
                          >
                            <span>
                              {newProject.type === 'ACADEMIC' && 'Académique'}
                              {newProject.type === 'ENGINEERING' && 'Ingénierie'}
                              {newProject.type === 'STUDY_GROUP' && "Groupe d'étude"}
                            </span>
                            <span className="material-symbols-outlined text-[15px] text-gray-400 transition-transform duration-200" style={{ transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                              expand_more
                            </span>
                          </button>

                          {isCategoryDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)} />
                              <div className="absolute left-0 right-0 mt-1 bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-xs text-left">
                                {[
                                  { value: 'ACADEMIC', label: 'Académique' },
                                  { value: 'ENGINEERING', label: 'Ingénierie' },
                                  { value: 'STUDY_GROUP', label: "Groupe d'étude" }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setNewProject({ ...newProject, type: opt.value });
                                      setIsCategoryDropdownOpen(false);
                                    }}
                                    className={`w-full px-3.5 py-2.5 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                      newProject.type === opt.value ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {newProject.type === opt.value && (
                                      <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Membres maximum</label>
                        <input 
                          type="number" 
                          placeholder="Illimité si vide" 
                          className="w-full h-[38px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white px-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all font-medium" 
                          value={newProject.max_members} 
                          onChange={e => setNewProject({ ...newProject, max_members: e.target.value })} 
                          min="2" 
                        />
                      </div>
                    )}
                  </div>

                  {formType !== 'RESEARCH' && (
                    <div>
                      <label className="block text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Membres maximum</label>
                      <input 
                        type="number" 
                        placeholder="Illimité si vide" 
                        className="w-full h-[38px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white px-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all font-medium" 
                        value={newProject.max_members} 
                        onChange={e => setNewProject({ ...newProject, max_members: e.target.value })} 
                        min="2" 
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Description détaillée *</label>
                    <textarea 
                      placeholder="Décrivez les thématiques, buts et exigences de votre projet..." 
                      className="w-full min-h-[90px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white p-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all resize-none font-medium" 
                      value={newProject.description} 
                      onChange={e => setNewProject({ ...newProject, description: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Objectifs et livrables</label>
                      <textarea 
                        placeholder="Ex: Soutenance, rapport final..." 
                        className="w-full min-h-[70px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white p-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all resize-none font-medium" 
                        value={newProject.objectives} 
                        onChange={e => setNewProject({ ...newProject, objectives: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Compétences recherchées</label>
                      <textarea 
                        placeholder="Ex: React, NodeJS, Statistiques..." 
                        className="w-full min-h-[70px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white p-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all resize-none font-medium" 
                        value={newProject.required_skills} 
                        onChange={e => setNewProject({ ...newProject, required_skills: e.target.value })} 
                      />
                    </div>
                  </div>

                  {formType === 'RESEARCH' && (
                    <div>
                      <label className="block text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Conditions de collaboration</label>
                      <textarea 
                        placeholder="Spécifiez les conditions d'admissibilité ou de co-création..." 
                        className="w-full min-h-[70px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white p-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all resize-none font-medium" 
                        value={newProject.conditions} 
                        onChange={e => setNewProject({ ...newProject, conditions: e.target.value })} 
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={closeForm}
                      className="h-[36px] px-5 rounded-full border border-black/10 text-[#48484a] hover:bg-[#f5f5f7] text-xs font-semibold transition-all press-effect"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="h-[36px] px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all press-effect shadow-apple-xs"
                    >
                      Créer le projet
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Grid of Projects */}
            <div className="grid grid-cols-1 gap-6">
              {filteredProjects.length === 0 ? (
                <div className="bg-white border border-black/5 rounded-[24px] py-20 text-center shadow-apple-sm animate-fadeInUp">
                  <span className="material-symbols-outlined text-[64px] text-gray-200 select-none">
                    folder_off
                  </span>
                  <p className="font-bold text-[#1d1d1f] text-[15px] mt-3">Aucun projet trouvé</p>
                  <p className="text-xs text-[#86868b] mt-1">Soyez le premier à en initier un dans votre réseau !</p>
                </div>
              ) : (
                filteredProjects.map((project, index) => {
                  const cfg = typeConfig[project.type] || typeConfig.ACADEMIC;
                  const isOwner = project.user_membership_status === 'OWNER';
                  const status = project.user_membership_status;
                  const approvedCount = project.members?.filter(m => m.pivot?.status === 'APPROVED' || m.pivot?.role === 'OWNER').length || 0;
                  const expanded = expandedId === project.id;

                  const totalTasks = project.tasks_count || 0;
                  const doneTasks = project.completed_tasks_count || 0;
                  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                  return (
                    <div 
                      key={project.id} 
                      onClick={() => openManage(project)}
                      className="bg-white border border-black/[0.08] hover:border-[#0071e3]/30 rounded-[24px] overflow-hidden shadow-apple-xs hover:shadow-apple-md hover:-translate-y-1 transition-all duration-300 apple-fade-up group flex flex-col justify-between cursor-pointer border-t border-t-black/[0.04]"
                      style={{ animationDelay: `${index * 55}ms` }}
                    >
                      {/* Top Unsplash Cover Photo */}
                      <div className="h-40 relative overflow-hidden bg-[#e8e8ed] flex-shrink-0">
                        <img 
                          src={getProjectCover(project.type)} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-[1.1]" 
                          alt="" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                        
                        {/* Type Tag glass overlay */}
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/90 text-[#1d1d1f] shadow-apple-xs">
                            <span className="material-symbols-outlined text-[13px] font-bold text-[#0071e3]">{cfg.icon}</span>
                            {cfg.label}
                          </span>
                        </div>

                        {/* Delete button (Owner) */}
                        {(isOwner || user?.role === 'ADMIN') && (
                          <div className="absolute top-4 right-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} 
                              className="w-8 h-8 bg-white/90 hover:bg-red-500 hover:text-white text-[#86868b] rounded-full transition-all press-effect flex items-center justify-center shadow-apple-xs"
                              title="Supprimer le projet"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        )}

                        {/* Title overlapping cover */}
                        <div className="absolute bottom-4 left-5 right-5 z-10">
                          <h3 className="text-[17px] font-bold text-white leading-snug tracking-tight drop-shadow-sm truncate">
                            {project.title}
                          </h3>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-6 flex-grow flex flex-col justify-between bg-white">
                        <div>
                          {/* Description */}
                          <p className="text-[13px] text-[#515154] leading-relaxed mb-5 line-clamp-3">
                            {project.description}
                          </p>

                          {/* Elegant segment-based status tracker */}
                          {totalTasks > 0 && (
                            <div className="bg-[#f8f9fa] rounded-[16px] p-3.5 mb-5 border border-black/[0.03]">
                              <div className="flex justify-between items-center mb-2.5 text-[11px] font-bold">
                                <span className="text-[#86868b] tracking-wider uppercase flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[15px] text-[#0071e3] font-semibold">checklist</span>
                                  Tâches complétées
                                </span>
                                <span className="text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full text-[10px]">
                                  {doneTasks}/{totalTasks} ({progress}%)
                                </span>
                              </div>
                              
                              {/* Segmented Progress Track */}
                              <div className="flex gap-1.5 w-full mt-1.5">
                                {Array.from({ length: totalTasks }).map((_, i) => {
                                  const isDone = i < doneTasks;
                                  return (
                                    <div 
                                      key={i} 
                                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                        isDone 
                                          ? 'bg-gradient-to-r from-[#0071e3] to-[#0077ed] shadow-[0_0_8px_rgba(0,113,227,0.25)]' 
                                          : 'bg-[#e8e8ed]'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Milestone Status Message */}
                              <p className="text-[11px] text-[#86868b] mt-2.5 font-medium flex items-center gap-1.5">
                                {progress === 100 ? (
                                  <>
                                    <span className="material-symbols-outlined text-[14px] text-[#34c759] font-bold">check_circle</span>
                                    <span className="text-[#34c759] font-semibold">Félicitations ! Toutes les tâches sont terminées.</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[14px] text-[#0071e3] animate-pulse">hourglass_empty</span>
                                    <span>Workspace actif • En cours de réalisation</span>
                                  </>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Expandable Extra Academics Details */}
                          {(project.objectives || project.required_skills || project.conditions) && (
                            <div className="mb-5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setExpandedId(expanded ? null : project.id); }} 
                                className="text-[11px] font-bold text-[#0071e3] hover:text-[#0077ed] hover:underline flex items-center gap-1 press-effect"
                              >
                                <span>{expanded ? 'Masquer les détails académiques' : 'Voir les détails académiques'}</span>
                                <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
                                  expand_more
                                </span>
                              </button>

                              {expanded && (
                                <div className="mt-3 bg-[#f5f5f7] border border-black/[0.05] rounded-[16px] p-4 space-y-2.5 text-xs animate-fadeIn">
                                  {project.objectives && (
                                    <div className="text-[#48484a] leading-relaxed">
                                      <p className="font-bold text-[#1d1d1f] text-[10px] uppercase tracking-wider mb-0.5">Objectifs & Livrables</p>
                                      <p className="font-medium text-[#515154]">{project.objectives}</p>
                                    </div>
                                  )}
                                  {project.required_skills && (
                                    <div className="text-[#48484a] leading-relaxed">
                                      <p className="font-bold text-[#1d1d1f] text-[10px] uppercase tracking-wider mb-0.5">Compétences requises</p>
                                      <p className="font-medium text-[#515154]">{project.required_skills}</p>
                                    </div>
                                  )}
                                  {project.conditions && (
                                    <div className="text-[#48484a] leading-relaxed">
                                      <p className="font-bold text-[#1d1d1f] text-[10px] uppercase tracking-wider mb-0.5">Conditions</p>
                                      <p className="font-medium text-[#515154]">{project.conditions}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer & Actions */}
                        <div className="border-t border-black/[0.05] pt-4 mt-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          {/* Member indicators */}
                          <div className="flex items-center gap-2 text-xs text-[#6e6e73] font-semibold">
                            <div className="flex items-center gap-1 text-[#86868b]">
                              <span className="material-symbols-outlined text-[18px]">group</span>
                              <span>
                                {approvedCount}{project.max_members ? ` / ${project.max_members}` : ''}
                              </span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <span className="text-[11px] text-[#86868b] font-bold uppercase tracking-wider">
                              Proprio : {project.owner?.first_name} {project.owner?.last_name?.[0]}.
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="w-full sm:w-auto flex items-center gap-2">
                            {/* Details button for non-members */}
                            {(status === 'NONE' || status === 'PENDING' || status === 'INVITED') && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); openManage(project); }} 
                                className="h-[32px] px-4 rounded-full border border-black/10 hover:border-[#0071e3]/45 hover:bg-[#0071e3]/5 hover:text-[#0071e3] text-[#48484a] text-xs font-bold transition-all press-effect flex items-center justify-center gap-1 shadow-sm shrink-0"
                              >
                                <span className="material-symbols-outlined text-[16px]">info</span>
                                Détails
                              </button>
                            )}

                            {status === 'NONE' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleJoin(project.id); }} 
                                className="h-[32px] px-4 rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] text-xs font-bold transition-all press-effect flex items-center justify-center gap-1.5 shadow-apple-xs shrink-0"
                              >
                                <span className="material-symbols-outlined text-[16px] font-bold">person_add</span>
                                Rejoindre
                              </button>
                            )}
                            {status === 'PENDING' && (
                              <span className="inline-flex h-[32px] px-4 rounded-full bg-[#ff9500]/10 text-[#ff9500] text-xs font-bold items-center justify-center select-none whitespace-nowrap">
                                En attente
                              </span>
                            )}
                            {status === 'INVITED' && (
                              <div className="flex gap-1.5 shrink-0">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleAcceptInvitation(project.id); }} 
                                  className="h-[32px] px-3.5 rounded-full bg-[#34c759] text-white hover:bg-[#30b350] text-xs font-bold transition-all press-effect flex items-center gap-1 shadow-apple-xs"
                                >
                                  Accepter
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeclineInvitation(project.id); }} 
                                  className="h-[32px] px-3.5 rounded-full bg-[#f5f5f7] hover:bg-red-500 hover:text-white text-[#86868b] text-xs font-bold transition-all press-effect flex items-center gap-1"
                                >
                                  Refuser
                                </button>
                              </div>
                            )}
                            {(status === 'APPROVED' || status === 'OWNER') && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); openManage(project); }} 
                                className="w-full sm:w-auto h-[32px] px-5 rounded-full bg-[#1d1d1f] hover:bg-[#0071e3] text-white text-xs font-bold transition-all press-effect flex items-center justify-center gap-1.5 shadow-apple-xs"
                              >
                                <span className="material-symbols-outlined text-[16px] font-bold">
                                  {isOwner ? 'tune' : 'dashboard'}
                                </span>
                                {isOwner ? 'Gérer' : 'Workspace'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </section>

          {/* Right Sidebar (Desktop: col-span-3) - Actions & Filters */}
          <aside className="lg:col-span-3 space-y-5 animate-fadeInUp sticky top-[80px] self-start">
            {/* Creation quick access */}
            <div className="bg-white border border-black/5 rounded-[20px] p-5 shadow-apple-sm space-y-3">
              <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest px-1">Nouveau projet</h4>
              <button 
                onClick={() => openForm('ACADEMIC')} 
                className="w-full h-[36px] bg-[#f5f5f7] hover:bg-[#0071e3]/10 hover:text-[#0071e3] text-[#1d1d1f] rounded-full text-xs font-semibold transition-all press-effect flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                Projet Académique
              </button>
              {isResearcher && (
                <button 
                  onClick={() => openForm('RESEARCH')} 
                  className="w-full h-[36px] bg-[#f5f5f7] hover:bg-[#af52de]/10 hover:text-[#af52de] text-[#1d1d1f] rounded-full text-xs font-semibold transition-all press-effect flex items-center justify-center gap-1.5 border border-transparent"
                >
                  <span className="material-symbols-outlined text-[18px]">science</span>
                  Appel à Recherche
                </button>
              )}
            </div>

            {/* Type Filters */}
            <div className="bg-white border border-black/5 rounded-[20px] p-4 shadow-apple-sm space-y-1">
              <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest px-2 mb-2">Filtrer par type</h4>
              <button 
                onClick={() => setFilterType('ALL')}
                className={`w-full text-left px-3 py-2 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-between ${filterType === 'ALL' ? 'bg-[#0071e3] text-white shadow-apple-xs' : 'text-[#48484a] hover:bg-[#f5f5f7]'}`}
              >
                <span>Tous les projets</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#e8e8ed] text-gray-500'}`}>{projects.length}</span>
              </button>
              {Object.keys(typeConfig).map(typeKey => {
                const cfg = typeConfig[typeKey];
                const count = projects.filter(p => p.type === typeKey).length;
                return (
                  <button 
                    key={typeKey}
                    onClick={() => setFilterType(typeKey)}
                    className={`w-full text-left px-3 py-2 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-between ${filterType === typeKey ? 'bg-[#0071e3] text-white shadow-apple-xs' : 'text-[#48484a] hover:bg-[#f5f5f7]'}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === typeKey ? 'bg-white/20 text-white' : 'bg-[#e8e8ed] text-gray-500'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

        </div>
      </main>

      {/* Project Management Modal (macOS sheet design overlay) */}
      {managingProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn" onClick={() => { setManagingProject(null); fetchProjects(); }}>
          <div 
            className="bg-white border-l border-black/[0.08] shadow-apple-2xl w-full max-w-2xl h-full flex flex-col overflow-hidden anim-slide-left text-left border-t border-t-black/[0.04]"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header (Glassmorphic vibe) */}
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-[12px] bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center flex-shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-[22px] font-bold">rocket_launch</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-[#1d1d1f] truncate max-w-md tracking-tight">{managingProject.title}</h2>
                  <p className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isReadOnly ? 'bg-[#ff9500]' : 'bg-[#34c759]'} animate-pulse`}></span>
                    {isReadOnly ? 'Détails du projet (Lecture seule)' : 'Workspace Collaboratif Actif'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setManagingProject(null);
                  fetchProjects(); // refresh count stats
                }} 
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-gray-500 transition-all press-effect flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px] font-medium">close</span>
              </button>
            </div>

            {/* Modal Navigation Tabs (iOS style segmented controls) */}
            <div className="bg-[#f5f5f7] px-6 py-3 border-b border-black/[0.05]">
              <div className="bg-[#e8e8ed] p-0.5 rounded-[10px] flex items-center max-w-md shadow-inner">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-white text-[#1d1d1f] shadow-apple-xs' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                >
                  <span className="material-symbols-outlined text-[17px] font-semibold">info</span>
                  Détails
                </button>
                <button 
                  onClick={() => setActiveTab('tasks')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 ${activeTab === 'tasks' ? 'bg-white text-[#1d1d1f] shadow-apple-xs' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                >
                  <span className="material-symbols-outlined text-[17px] font-semibold">checklist</span>
                  Tâches
                </button>
                <button 
                  onClick={() => setActiveTab('members')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 ${activeTab === 'members' ? 'bg-white text-[#1d1d1f] shadow-apple-xs' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                >
                  <span className="material-symbols-outlined text-[17px] font-semibold">group</span>
                  Équipe ({members.length})
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-[#f5f5f7]/40">
              
              {/* Tab 3: Description & Infos */}
              {activeTab === 'info' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Project Cover Photo Banner */}
                  <div className="h-44 w-full rounded-[20px] overflow-hidden border border-black/5 relative shadow-apple-xs flex-shrink-0">
                    <img 
                      src={getProjectCover(managingProject.type)} 
                      alt="" 
                      className="w-full h-full object-cover filter saturate-[1.1]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#1d1d1f] shadow-apple-xs">
                        <span className="material-symbols-outlined text-[13px] font-bold text-[#0071e3]">{(typeConfig[managingProject.type] || typeConfig.ACADEMIC).icon}</span>
                        {(typeConfig[managingProject.type] || typeConfig.ACADEMIC).label}
                      </span>
                    </div>
                  </div>
                  {/* Description Card */}
                  <div className="bg-white border border-black/[0.06] rounded-[20px] p-5 shadow-apple-xs">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="material-symbols-outlined text-[#0071e3] text-[20px]">description</span>
                      <h4 className="text-[13px] font-bold text-[#1d1d1f] uppercase tracking-wider">Description</h4>
                    </div>
                    <p className="text-[13px] text-[#48484a] leading-relaxed whitespace-pre-wrap font-medium">
                      {managingProject.description}
                    </p>
                  </div>

                  {/* Objectives Card */}
                  {managingProject.objectives && (
                    <div className="bg-white border border-black/[0.06] rounded-[20px] p-5 shadow-apple-xs">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="material-symbols-outlined text-[#af52de] text-[20px]">explore</span>
                        <h4 className="text-[13px] font-bold text-[#1d1d1f] uppercase tracking-wider">Objectifs & Livrables</h4>
                      </div>
                      <p className="text-[13px] text-[#48484a] leading-relaxed whitespace-pre-wrap font-medium">
                        {managingProject.objectives}
                      </p>
                    </div>
                  )}

                  {/* Skills Card */}
                  {managingProject.required_skills && (
                    <div className="bg-white border border-black/[0.06] rounded-[20px] p-5 shadow-apple-xs">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="material-symbols-outlined text-[#ff9500] text-[20px]">psychology</span>
                        <h4 className="text-[13px] font-bold text-[#1d1d1f] uppercase tracking-wider">Compétences recherchées</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {managingProject.required_skills.split(/,|\n/).filter(s => s.trim()).map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-[#f5f5f7] border border-black/5 rounded-full text-xs font-semibold text-[#1d1d1f]">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conditions Card */}
                  {managingProject.conditions && (
                    <div className="bg-white border border-black/[0.06] rounded-[20px] p-5 shadow-apple-xs">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="material-symbols-outlined text-[#ff3b30] text-[20px]">gavel</span>
                        <h4 className="text-[13px] font-bold text-[#1d1d1f] uppercase tracking-wider">Conditions de collaboration</h4>
                      </div>
                      <p className="text-[13px] text-[#48484a] leading-relaxed whitespace-pre-wrap font-medium">
                        {managingProject.conditions}
                      </p>
                    </div>
                  )}

                  {/* Owner & Porteur Card */}
                  <div className="bg-white border border-black/[0.06] rounded-[20px] p-5 shadow-apple-xs">
                    <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-4">Porteur du projet</h4>
                    <Link 
                      to={`/profile/${managingProject.owner?.id}`}
                      onClick={() => setManagingProject(null)}
                      className="flex items-center gap-3.5 hover:opacity-85 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full border border-black/5 bg-[#f5f5f7] flex items-center justify-center overflow-hidden flex-shrink-0 text-sm font-bold text-gray-500 shadow-apple-sm">
                        {managingProject.owner?.profile?.photo_url ? (
                          <img 
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${managingProject.owner.profile.photo_url}`} 
                            className="w-full h-full object-cover" 
                            alt="" 
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                          />
                        ) : (
                          `${managingProject.owner?.first_name?.[0] || ''}${managingProject.owner?.last_name?.[0] || ''}`
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1d1d1f] leading-none mb-1">
                          {managingProject.owner?.first_name} {managingProject.owner?.last_name}
                        </p>
                        <p className="text-[11px] text-[#86868b] font-semibold truncate uppercase tracking-wide">
                          {managingProject.owner?.profile?.biography?.split('\n')[0] || getRoleLabel(managingProject.owner?.role) || 'Membre'}
                        </p>
                        {managingProject.owner?.profile?.institution && (
                          <p className="text-[10.5px] text-gray-400 font-medium truncate mt-0.5">
                            {managingProject.owner.profile.institution}
                            {managingProject.owner.profile.department ? ` • ${managingProject.owner.profile.department}` : ''}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* General Participation Details Card */}
                  <div className="bg-white border border-black/[0.06] rounded-[20px] p-5 shadow-apple-xs space-y-3">
                    <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest">Informations Générales</h4>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="p-3 bg-[#f5f5f7] rounded-[12px] border border-black/[0.02]">
                        <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider block">Catégorie</span>
                        <span className="text-xs font-bold text-[#1d1d1f] mt-1 block">
                          {(typeConfig[managingProject.type] || typeConfig.ACADEMIC).label}
                        </span>
                      </div>
                      <div className="p-3 bg-[#f5f5f7] rounded-[12px] border border-black/[0.02]">
                        <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider block">Membres</span>
                        <span className="text-xs font-bold text-[#1d1d1f] mt-1 block">
                          {members.length} {managingProject.max_members ? `/ ${managingProject.max_members}` : '(Sans limite)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Tasks / Kanban checklist */}
              {activeTab === 'tasks' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Task Addition (Owner only & Not ReadOnly) */}
                  {!isReadOnly && managingProject.user_membership_status === 'OWNER' && (
                    <form onSubmit={handleAddTask} className="flex gap-2.5 bg-white p-2 rounded-[16px] border border-black/[0.06] shadow-apple-xs focus-within:ring-4 focus-within:ring-[#0071e3]/10 focus-within:border-[#0071e3]/30 transition-all">
                      <input 
                        type="text" 
                        placeholder="Ajouter une tâche (ex: Préparer la soutenance...)" 
                        className="flex-grow h-[36px] bg-transparent border-none px-3.5 text-sm focus:outline-none font-medium placeholder-gray-400" 
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        className="h-[36px] px-5 rounded-[12px] bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold transition-all press-effect flex items-center gap-1 shadow-apple-xs shrink-0"
                      >
                        <span className="material-symbols-outlined text-[17px] font-bold">add</span>
                        Ajouter
                      </button>
                    </form>
                  )}

                  {/* Tasks List */}
                  <div className="space-y-2.5">
                    {tasksLoading ? (
                      <div className="text-center py-10 text-xs text-[#86868b] font-bold uppercase tracking-wider animate-pulse flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
                        Chargement du workspace...
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center py-14 border border-dashed border-black/10 rounded-[20px] bg-white p-6 shadow-apple-xs">
                        <span className="material-symbols-outlined text-[42px] text-[#c1c6d4] select-none">
                          task
                        </span>
                        <p className="text-xs font-bold text-[#86868b] uppercase tracking-widest mt-2.5">Aucune tâche enregistrée</p>
                        <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">Créez des tâches pour suivre en direct l'avancement de votre équipe sur le hub.</p>
                      </div>
                    ) : (
                      tasks.map(task => (
                        <div 
                          key={task.id} 
                          className="flex items-center justify-between gap-3.5 bg-white border border-black/[0.05] p-4 rounded-[16px] shadow-apple-xs group hover:border-black/[0.1] hover:shadow-apple-sm transition-all"
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            {/* Checkbox Icon */}
                            <button 
                              onClick={() => toggleTaskStatus(task)}
                              disabled={isReadOnly}
                              className={`p-0.5 rounded-full transition-all shrink-0 ${
                                task.status === 'COMPLETED' 
                                  ? 'text-[#34c759]' 
                                  : isReadOnly 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-300 hover:text-[#0071e3] press-effect'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[24px]">
                                {task.status === 'COMPLETED' ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                            </button>

                            {/* Task Title */}
                            <div className="min-w-0">
                              <p className={`text-[13.5px] font-bold truncate transition-all ${task.status === 'COMPLETED' ? 'text-[#86868b] line-through italic' : 'text-[#1d1d1f]'}`}>
                                {task.title}
                              </p>
                              <span className={`inline-flex text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] mt-1 ${task.status === 'COMPLETED' ? 'bg-[#34c759]/10 text-[#34c759]' : 'bg-[#e8e8ed] text-gray-500'}`}>
                                {task.status === 'COMPLETED' ? 'Terminée' : 'À faire'}
                              </span>
                            </div>
                          </div>

                          {/* Delete Task (Owner only & Not ReadOnly) */}
                          {!isReadOnly && managingProject.user_membership_status === 'OWNER' && (
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="w-8 h-8 text-[#86868b] hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center press-effect shrink-0"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Members Group & Recruitment */}
              {activeTab === 'members' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Recruitment Section (Owner only & Not ReadOnly) */}
                  {!isReadOnly && managingProject.user_membership_status === 'OWNER' && (
                    <div className="bg-white border border-black/[0.06] rounded-[20px] p-5 shadow-apple-xs space-y-4">
                      <div className="flex justify-between items-center border-b border-black/[0.04] pb-3">
                        <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider flex items-center gap-2">
                          <span className="material-symbols-outlined text-[17px] text-[#0071e3]">person_search</span>
                          Recrutement réseau académique
                        </h4>
                        <button 
                          onClick={() => setShowInvite(!showInvite)} 
                          className="text-xs font-bold text-[#0071e3] hover:text-[#0077ed] hover:underline"
                        >
                          {showInvite ? 'Masquer le panneau' : 'Inviter des connexions'}
                        </button>
                      </div>

                      {showInvite && (
                        <div className="space-y-3.5 pt-1 animate-fadeIn">
                          <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-[18px]">
                              search
                            </span>
                            <input 
                              type="text" 
                              placeholder="Rechercher une connexion par nom..." 
                              className="w-full h-[38px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all font-medium placeholder-gray-400" 
                              value={inviteSearch} 
                              onChange={e => setInviteSearch(e.target.value)} 
                            />
                          </div>

                          <div className="max-h-[180px] overflow-y-auto pr-1 no-scrollbar space-y-1.5">
                            {filteredConnections.length === 0 ? (
                              <p className="text-[10px] text-[#86868b] text-center py-5 font-bold uppercase tracking-wider">
                                Aucun membre disponible à inviter
                              </p>
                            ) : (
                              filteredConnections.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-[#f5f5f7]/60 border border-black/[0.02] rounded-[12px] p-2.5 hover:bg-white transition-all shadow-apple-xs">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full border border-black/5 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold text-[#86868b]">
                                      {c?.profile?.photo_url ? (
                                        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${c.profile.photo_url}`} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} />
                                      ) : (c?.first_name?.[0] || '?')}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[#1d1d1f] truncate leading-none">{c?.first_name || ''} {c?.last_name || ''}</p>
                                      <p className="text-[9.5px] text-[#86868b] font-bold truncate uppercase tracking-wide mt-1">{c?.profile?.headline || 'Connexion'}</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleInvite(c.id)}
                                    className="h-[28px] px-4 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-[10px] font-bold text-white transition-all press-effect shadow-apple-xs shrink-0"
                                  >
                                    Inviter
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Members List */}
                  <div className="space-y-4">
                    {membersLoading ? (
                      <div className="text-center py-8 text-xs text-[#86868b] font-bold uppercase tracking-wider animate-pulse flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
                        Chargement de l'équipe...
                      </div>
                    ) : members.length === 0 ? (
                      <p className="text-xs text-[#86868b] font-bold uppercase text-center py-4">Aucun membre dans le projet.</p>
                    ) : (
                      <>
                        {['OWNER', 'APPROVED', 'INVITED', 'PENDING'].map(statusKey => {
                          const group = members.filter(m => m.status === statusKey);
                          if (group.length === 0) return null;
                          return (
                            <div key={statusKey} className="space-y-2">
                              <h5 className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest ml-1 mt-2">
                                {STATUS_LABELS[statusKey]?.text || statusKey} ({group.length})
                              </h5>
                              
                              <div className="space-y-2">
                                {group.map(member => (
                                  <div 
                                    key={member.id} 
                                    className="flex items-center justify-between bg-white border border-black/[0.05] rounded-[16px] p-3.5 shadow-apple-xs hover:border-black/[0.1] transition-all"
                                  >
                                                                    <Link 
                                      to={`/profile/${member.user?.id}`}
                                      onClick={() => setManagingProject(null)}
                                      className="flex items-center gap-3.5 min-w-0 hover:opacity-85 transition-opacity"
                                    >
                                      <div className="w-10 h-10 rounded-full border border-black/5 bg-[#f5f5f7] flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold text-[#86868b]">
                                        {member.user?.profile?.photo_url ? (
                                          <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${member.user.profile.photo_url}`} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} />
                                        ) : (
                                          `${member.user?.first_name?.[0] || ''}${member.user?.last_name?.[0] || ''}`
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-[#1d1d1f] truncate leading-tight">
                                          {member.user?.first_name} {member.user?.last_name}
                                        </p>
                                        <p className="text-[10px] text-[#86868b] font-bold truncate uppercase tracking-wide mt-0.5">
                                          {member.user?.profile?.headline || getRoleLabel(member.user?.role)}
                                        </p>
                                        {member.user?.email && (
                                          <p className="text-[10px] text-[#0071e3] font-medium truncate mt-0.5">
                                            {member.user.email}
                                          </p>
                                        )}
                                      </div>
                                    </Link>

                                    {/* Action approval buttons (For Pending requests and Owner only & Not ReadOnly) */}
                                    {statusKey === 'PENDING' && managingProject.user_membership_status === 'OWNER' && !isReadOnly ? (
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleApprove(member.user.id)}
                                          className="w-8 h-8 rounded-full bg-[#34c759]/10 hover:bg-[#34c759] text-[#34c759] hover:text-white flex items-center justify-center transition-all press-effect shadow-apple-xs"
                                          title="Approuver l'adhésion"
                                        >
                                          <span className="material-symbols-outlined text-[17px] font-bold">check</span>
                                        </button>
                                        <button 
                                          onClick={() => handleReject(member.user.id)}
                                          className="w-8 h-8 rounded-full bg-[#ff3b30]/10 hover:bg-[#ff3b30] text-[#ff3b30] hover:text-white flex items-center justify-center transition-all press-effect shadow-apple-xs"
                                          title="Refuser"
                                        >
                                          <span className="material-symbols-outlined text-[17px] font-bold">close</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${STATUS_LABELS[statusKey]?.cls || ''}`}>
                                        {STATUS_LABELS[statusKey]?.text || statusKey}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
