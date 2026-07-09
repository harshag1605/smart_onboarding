import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Clock, PlayCircle, CheckCircle2, LayoutDashboard, Users, Trophy, ChevronRight, ChevronDown, Award, Briefcase, Star, User } from 'lucide-react';

const COLUMNS = ['Open', 'Todo', 'In Progress', 'Done'];

const PREDEFINED_DESIGNATIONS = [
  "Frontend Engineer", "Backend Engineer", "Fullstack Developer",
  "UI/UX Designer", "QA Engineer", "Automation Tester",
  "DevOps Engineer", "Cloud Architect", "Security Engineer",
  "Database Administrator", "Performance Optimizer", "Build & Release Engineer",
  "Mobile App Developer", "Product Manager", "Scrum Master",
  "Tech Lead", "Data Engineer", "Site Reliability Engineer",
  "Systems Administrator", "Documentation Specialist"
];

const PREDEFINED_DEPARTMENTS = [
  "Engineering", "Design", "Quality Assurance", 
  "Product", "Operations", "Information Technology"
];
const PREDEFINED_GROUPS = [
  "Frontend Squad", "Backend API Team", "Mobile App Group", 
  "QA & Automation", "DevOps & Cloud", "Data & Analytics", 
  "Product Management", "Security Team", "IT Support"
];

export default function EmployeeDashboard() {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [workingStatus, setWorkingStatus] = useState(user?.workingStatus || 'Available');
  const [activeTab, setActiveTab] = useState('tasks');
  const [expandedTeams, setExpandedTeams] = useState({});

  const toggleTeamExpand = (teamId) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileDepartment, setProfileDepartment] = useState(user?.department || '');
  const [profileGroup, setProfileGroup] = useState(user?.group || '');
  const [profileDesignations, setProfileDesignations] = useState(user?.designations || []);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, teamsRes, perfRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/employee/tasks`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/employee/teams`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/employee/analytics/performers`, { headers })
      ]);
      setTasks(await tasksRes.json());
      setTeams(await teamsRes.json());
      setPerformers(await perfRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleStatusChange = async (newStatus) => {
    setWorkingStatus(newStatus);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/employee/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ workingStatus: newStatus })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/employee/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ status: newStatus })
      });
      fetchDashboardData(); 
    } catch (e) {
      fetchDashboardData();
    }
  };

  const onDrop = async (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    await handleUpdateTaskStatus(taskId, status);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const completionPercentage = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.status === 'Done').length / tasks.length) * 100);
  
  // Find my rank
  const myRankIndex = performers.findIndex(p => p.employee?._id === user?.id);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : '-';

  const handleProfileDesignationChange = (d) => {
    if (profileDesignations.includes(d)) {
      setProfileDesignations(profileDesignations.filter(x => x !== d));
    } else {
      setProfileDesignations([...profileDesignations, d]);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ 
          name: profileName, 
          department: profileDepartment, 
          group: profileGroup, 
          designations: profileDesignations 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setProfileMessage('Profile updated successfully! Refresh to see changes globally.');
    } catch (err) {
      setProfileMessage(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-gray-50 to-gray-200">
      <nav className="bg-white/50 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] sticky top-0 z-10 gap-4 md:gap-0">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="text-yellow-500" />
          Employee Dashboard
        </h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex gap-1 overflow-x-auto">
            <button onClick={() => setActiveTab('tasks')} className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'tasks' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-50 text-gray-500 hover:text-gray-900'}`}>My Tasks</button>
            <button onClick={() => setActiveTab('teams')} className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'teams' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-50 text-gray-500 hover:text-gray-900'}`}>My Teams</button>
            <button onClick={() => setActiveTab('leaderboard')} className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'leaderboard' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-50 text-gray-500 hover:text-gray-900'}`}>Leaderboard</button>
            <button onClick={() => setActiveTab('profile')} className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'profile' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-50 text-gray-500 hover:text-gray-900'}`}>My Profile</button>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <select 
              value={workingStatus} 
              onChange={e => handleStatusChange(e.target.value)}
              className="appearance-none text-xs font-bold bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-yellow-500 py-1.5 pl-3 pr-6 uppercase tracking-wider outline-none cursor-pointer"
            >
              <option value="Available">🟢 AVAILABLE</option>
              <option value="Busy">🔴 BUSY</option>
              <option value="On Leave">⚪ ON LEAVE</option>
            </select>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-yellow-500 font-medium transition-colors">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* Professional Header Section */}
        <div className="bg-white/80 backdrop-blur-xl bg-gradient-to-b from-white/60 to-gray-100/80 p-6 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] border border-gray-200 relative overflow-hidden mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          
          <div className="relative z-10 w-full md:w-auto">
            <div className="mb-3">
              <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-yellow-200">
                {(user?.designations && user.designations[0]) || 'Employee'}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-1">
              Welcome back, <span className="text-yellow-600">{user?.name}</span>
            </h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Here is a summary of your workspace and tasks.</p>
          </div>
          
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <div className="bg-white border border-gray-200 p-4 rounded-xl flex-1 md:w-32 text-center shadow-sm">
              <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Total Tasks</div>
            </div>
            {myRank === 1 && (
              <div className="bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 p-4 rounded-xl flex-1 md:w-32 text-center shadow-sm flex flex-col justify-center items-center">
                <div className="text-2xl mb-1">👑</div>
                <div className="text-[10px] text-yellow-700 uppercase tracking-widest font-bold leading-tight">Top Performer</div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {COLUMNS.map(col => (
              <div 
                key={col} 
                onDrop={(e) => onDrop(e, col)} 
                onDragOver={onDragOver}
                className="bg-gray-100/50 rounded-3xl p-4 min-h-[500px] border border-gray-200/60 shadow-inner relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-6 px-2">
                  {col === 'Open' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  {col === 'Todo' && <div className="w-2 h-2 rounded-full bg-gray-400"></div>}
                  {col === 'In Progress' && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
                  {col === 'Done' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                  <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">{col === 'Open' ? 'TEAM BACKLOG' : col}</h3>
                  <span className="ml-auto bg-white border border-gray-200 text-gray-600 text-[10px] py-1 px-2.5 rounded-full font-black shadow-sm">
                    {tasks.filter(t => t.status === col).length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {tasks.filter(t => t.status === col).map(task => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task._id)}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-yellow-400 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1"><Clock size={12}/>{task.estimatedTime}</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 leading-snug group-hover:text-yellow-600 transition-colors">{task.title}</h4>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{task.description}</p>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-3">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                          <span className="flex items-center gap-1"><Briefcase size={12}/> {task.requiredDesignation}</span>
                          {col === 'Open' ? <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded">UNASSIGNED</span> : <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">MINE</span>}
                        </div>
                        {col === 'Todo' && (
                          <button 
                            onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')}
                            className="w-full text-xs font-bold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <PlayCircle size={14}/> Move to In Progress
                          </button>
                        )}
                        {col === 'In Progress' && (
                          <button 
                            onClick={() => handleUpdateTaskStatus(task._id, 'Done')}
                            className="w-full text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={14}/> Mark as Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-200">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Not assigned to any teams yet</h3>
                <p className="text-gray-500 text-sm mt-1">When HR adds you to a team, it will appear here.</p>
              </div>
            ) : teams.map(team => (
              <div key={team._id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div 
                  className="flex items-center gap-4 mb-6 cursor-pointer group"
                  onClick={() => toggleTeamExpand(team._id)}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white font-black text-xl shadow-inner group-hover:bg-yellow-500 transition-colors">
                    {team.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-lg text-gray-900 group-hover:text-yellow-600 transition-colors">{team.name}</h3>
                    <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider">My Role: {team.myRole || 'Default Base'}</p>
                  </div>
                  <div>
                    {expandedTeams[team._id] ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                  </div>
                </div>
                
                {expandedTeams[team._id] && (
                  <div className="space-y-6 mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">Active Projects & Tasks</h4>
                      {team.projects && team.projects.length > 0 ? team.projects.map(p => {
                        const projectTasks = tasks.filter(t => t.documentId === p._id);
                        return (
                          <div key={p._id} className="mb-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 mb-2">
                              <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><PlayCircle size={14} className="text-green-500"/> {p.title}</span>
                              <span className="text-[9px] bg-green-100 text-green-700 font-black px-2 py-1 uppercase rounded-md">Live</span>
                            </div>
                            
                            {projectTasks.length > 0 ? (
                              <div className="pl-4 ml-2 border-l-2 border-gray-100 space-y-3 mt-3">
                                {projectTasks.map(task => (
                                  <div key={task._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
                                    <div className="absolute -left-[25px] top-5 w-2 h-2 rounded-full bg-yellow-400 border-2 border-white box-content"></div>
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-sm text-gray-900">{task.title}</h4>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                        task.status === 'Done' ? 'text-green-700 bg-green-100' : 
                                        task.status === 'Todo' ? 'text-gray-700 bg-gray-100' :
                                        task.status === 'Open' ? 'text-blue-700 bg-blue-100' :
                                        'text-yellow-700 bg-yellow-100'
                                      }`}>
                                        {task.status}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{task.description}</p>
                                    
                                    <div className="flex gap-2 border-t border-gray-50 pt-3">
                                      {task.status === 'Todo' && (
                                        <button 
                                          onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')}
                                          className="flex-1 text-[10px] font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                        >
                                          <PlayCircle size={12}/> Start
                                        </button>
                                      )}
                                      {task.status === 'In Progress' && (
                                        <button 
                                          onClick={() => handleUpdateTaskStatus(task._id, 'Done')}
                                          className="flex-1 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                        >
                                          <CheckCircle2 size={12}/> Done
                                        </button>
                                      )}
                                      {task.status !== 'Todo' && task.status !== 'In Progress' && (
                                        <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mx-auto">
                                          {task.status === 'Done' ? <CheckCircle2 size={12} className="text-green-500"/> : <Briefcase size={12}/>}
                                          {task.status === 'Done' ? 'Completed' : 'Waiting'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic pl-4">No tasks assigned to you for this project yet.</p>
                            )}
                          </div>
                        );
                      }) : <p className="text-xs text-gray-400 italic">No live projects for this team.</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><Award className="text-yellow-500"/> Company Leaderboard</h2>
                <p className="text-xs text-gray-500 mt-1">Ranked by total tasks completed</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {performers.map((p, idx) => {
                const isMe = p.employee?._id === user?.id;
                return (
                  <div key={idx} className={`p-4 flex items-center gap-6 transition-colors ${isMe ? 'bg-yellow-50/50' : 'hover:bg-gray-50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 
                      idx === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800' : 
                      idx === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-900' : 
                      'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold ${isMe ? 'text-yellow-700' : 'text-gray-900'}`}>{p.employee?.name || 'Unknown'}</h4>
                        {isMe && <span className="text-[9px] bg-yellow-400 text-yellow-900 font-black px-2 py-0.5 rounded-full uppercase">You</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{p.employee?.designations?.join(', ') || 'No Role'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-gray-900">{p.score}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tasks</div>
                    </div>
                  </div>
                );
              })}
              {performers.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No tasks completed yet globally.</div>}
            </div>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-8 max-w-3xl mx-auto">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <User className="text-yellow-500"/> Edit My Profile
            </h2>
            
            {profileMessage && (
              <div className={`p-4 mb-6 rounded-xl text-sm font-bold ${profileMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {profileMessage}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" required value={profileName} onChange={e => setProfileName(e.target.value)}
                       className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 transition-all focus:bg-white focus:border-yellow-400 outline-none text-sm" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Department</label>
                  <select required value={profileDepartment} onChange={e => setProfileDepartment(e.target.value)}
                         className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 transition-all focus:bg-white focus:border-yellow-400 outline-none text-sm appearance-none">
                    <option value="" disabled>Select Department</option>
                    {PREDEFINED_DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Group</label>
                  <select required value={profileGroup} onChange={e => setProfileGroup(e.target.value)}
                         className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 transition-all focus:bg-white focus:border-yellow-400 outline-none text-sm appearance-none">
                    <option value="" disabled>Select Group</option>
                    {PREDEFINED_GROUPS.map(grp => <option key={grp} value={grp}>{grp}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Designations</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto space-y-3">
                  {PREDEFINED_DESIGNATIONS.map(d => (
                    <label key={d} className="flex items-start gap-3 group cursor-pointer">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input type="checkbox" checked={profileDesignations.includes(d)} onChange={() => handleProfileDesignationChange(d)} 
                               className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded focus:ring-4 focus:ring-yellow-400/20 checked:border-yellow-500 checked:bg-yellow-500 transition-all" />
                        <svg className="absolute w-3 h-3 text-gray-900 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={profileLoading} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2">
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
