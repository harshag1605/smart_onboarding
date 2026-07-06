import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Upload, Users, Briefcase, Plus, AlertCircle, FileText, CheckCircle2, ListTodo, UserPlus, Trash2, Edit3, X, FolderOpen, Play, ChevronDown, ChevronRight, Award, BarChart, Settings } from 'lucide-react';

const PREDEFINED_DESIGNATIONS = [
  "Frontend Engineer", "Backend Engineer", "Fullstack Developer", "UI/UX Designer",
  "QA Engineer", "Automation Tester", "DevOps Engineer", "Cloud Architect",
  "Security Engineer", "Database Administrator", "Performance Optimizer", "Build & Release Engineer",
  "Mobile App Developer", "Product Manager", "Scrum Master", "Tech Lead",
  "Data Engineer", "Site Reliability Engineer", "Systems Administrator", "Documentation Specialist"
];

export default function HRDashboard() {
  const { token, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const [docTitle, setDocTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const [newTeamName, setNewTeamName] = useState('');
  
  const [tab, setTab] = useState('dashboard');

  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empDesignations, setEmpDesignations] = useState([]);
  const [empDepartment, setEmpDepartment] = useState('');

  const [selectedTeamForDraft, setSelectedTeamForDraft] = useState({});
  const [expandedDocs, setExpandedDocs] = useState({});
  const [teamAddTabs, setTeamAddTabs] = useState({});
  const [editingRolesId, setEditingRolesId] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboardData = async () => {
    try {
      const opts = { headers };
      const [empRes, teamRes, taskRes, docRes, perfRes] = await Promise.all([
        fetch('/api/hr/employees', opts),
        fetch('/api/hr/teams', opts),
        fetch('/api/hr/tasks', opts),
        fetch('/api/hr/documents', opts),
        fetch('/api/hr/analytics/performers', opts)
      ]);
      setEmployees(await empRes.json());
      setTeams(await teamRes.json());
      setAllTasks(await taskRes.json());
      
      const docs = await docRes.json();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0]._id);
      }
      setPerformers(await perfRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !docTitle) return;
    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', docTitle);

    try {
      const res = await fetch('/api/hr/upload', { method: 'POST', headers, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setFile(null);
      setDocTitle('');
      fetchDashboardData();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMakeLive = async (docId) => {
    const teamId = selectedTeamForDraft[docId];
    if (!teamId) {
      alert('Please select a team before making the project Live.');
      return;
    }
    try {
      const res = await fetch(`/api/hr/documents/${docId}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ teamId })
      });
      const data = await res.json();
      setMessage(data.message);
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/hr/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: newTeamName })
      });
      setNewTeamName('');
      fetchDashboardData();
    } catch (e) { console.error(e); }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: empName, email: empEmail, password: empPassword,
          role: 'employee', designations: empDesignations, department: empDepartment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setEmpName(''); setEmpEmail(''); setEmpPassword('');
      setEmpDesignations([]); setEmpDepartment('');
      fetchDashboardData();
    } catch (err) { setMessage(`Error: ${err.message}`); }
  };

  const handleAddMemberToTeam = async (teamId, employeeId) => {
    if(!employeeId) return;
    try {
      await fetch(`/api/hr/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ employeeId })
      });
      fetchDashboardData();
    } catch (e) { console.error(e); }
  };

  const handleUpdateOverrideRole = async (teamId, memberId, newRolesArray) => {
    try {
      await fetch(`/api/hr/teams/${teamId}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ overrideRole: newRolesArray })
      });
      fetchDashboardData();
    } catch (e) { console.error(e); }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    if (!window.confirm("Remove member from team?")) return;
    try {
      await fetch(`/api/hr/teams/${teamId}/members/${memberId}`, { method: 'DELETE', headers });
      fetchDashboardData();
    } catch (e) { console.error(e); }
  };
  
  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Delete this team completely?")) return;
    try {
      await fetch(`/api/hr/teams/${teamId}`, { method: 'DELETE', headers });
      fetchDashboardData();
    } catch (e) { console.error(e); }
  }

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document and ALL its tasks?")) return;
    try {
      const res = await fetch(`/api/hr/documents/${docId}`, { method: 'DELETE', headers });
      const data = await res.json();
      setMessage(data.message);
      if (selectedDocId === docId) setSelectedDocId(null);
      fetchDashboardData();
    } catch (e) { console.error(e); }
  };

  const toggleDocExpand = (docId) => {
    setExpandedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const draftDocs = documents.filter(d => d.status === 'Draft');
  const liveDocs = documents.filter(d => d.status === 'Live');

  const inputClass = "w-full bg-gray-50/50 border border-gray-200 p-2.5 rounded-xl text-sm text-gray-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:ring-yellow-400 focus:border-yellow-400 outline-none backdrop-blur-sm transition-colors placeholder-zinc-600";
  const cardClass = "bg-white/80 backdrop-blur-xl bg-gradient-to-b from-white/60 to-gray-100/80 p-6 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] border border-gray-200 relative overflow-hidden";
  const highlight = "absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-gray-50 to-gray-100">
      <nav className="bg-white/50 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="text-yellow-500" />
          HR Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {['dashboard', 'teams', 'tasks'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all ${tab === t ? 'bg-yellow-400 text-gray-900' : 'bg-gray-50 text-gray-500 hover:text-gray-900'}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-yellow-500 font-medium transition-colors">Logout</button>
        </div>
      </nav>

      {message && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="text-sm text-yellow-500 bg-yellow-400/10 border border-yellow-200 p-3 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} />{message}</span>
            <button onClick={() => setMessage('')} className="text-xs text-yellow-500 hover:text-yellow-300 font-bold">Dismiss</button>
          </div>
        </div>
      )}

      {tab === 'dashboard' && (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className={cardClass}>
              <div className={highlight}></div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
                <Upload size={18} className="text-yellow-500" /> New Project
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <input type="text" placeholder="Project Title" value={docTitle} onChange={e => setDocTitle(e.target.value)} required className={inputClass} />
                <input type="file" accept=".pdf,.txt,.docx" onChange={e => setFile(e.target.files?.[0] || null)} required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 cursor-pointer" />
                <button disabled={!file || !docTitle || uploading} type="submit" className="w-full bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_10px_rgba(234,179,8,0.2)] text-black font-bold py-2.5 rounded-xl hover:from-yellow-200 hover:to-yellow-400 disabled:opacity-50 transition-all flex justify-center items-center gap-2 uppercase tracking-wider">
                  {uploading ? 'Processing...' : 'Create Draft'}
                </button>
              </form>
            </div>
            
            <div className={cardClass}>
              <div className={highlight}></div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
                <FolderOpen size={18} className="text-yellow-500" /> Assign Team
              </h2>
              {draftDocs.length === 0 ? <p className="text-sm text-gray-400">No draft projects.</p> : (
                <div className="space-y-4">
                  {draftDocs.map(doc => (
                    <div key={doc._id} className="p-3 border rounded-xl border-gray-200 bg-gray-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-sm">{doc.title}</div>
                        <button onClick={() => handleDeleteDocument(doc._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                      
                      <div className="mb-3 max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-lg p-2 space-y-1 shadow-sm">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Select a Team</div>
                        {teams.length === 0 ? <div className="text-xs text-gray-400">No teams available</div> : teams.map(t => (
                          <label key={t._id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900 hover:bg-gray-50 p-1.5 rounded-md transition-colors">
                            <input 
                              type="radio" 
                              name={`team-${doc._id}`}
                              value={t._id}
                              checked={selectedTeamForDraft[doc._id] === t._id}
                              onChange={e => setSelectedTeamForDraft(prev => ({ ...prev, [doc._id]: e.target.value }))}
                              className="text-yellow-500 focus:ring-yellow-500/20"
                            />
                            {t.name}
                          </label>
                        ))}
                      </div>

                      <button onClick={() => handleMakeLive(doc._id)} className="w-full text-xs bg-gray-900 text-white py-2 rounded-lg font-bold uppercase tracking-wider flex justify-center items-center gap-1 hover:bg-gray-800 transition-colors shadow-sm">
                        <Play size={12}/> Make Live
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className={cardClass}>
              <div className={highlight}></div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
                <Play size={18} className="text-green-500" /> Live Projects
              </h2>
              {liveDocs.length === 0 ? <p className="text-sm text-gray-400">No live projects.</p> : (
                <div className="space-y-4">
                  {liveDocs.map(doc => {
                    const docTasks = allTasks.filter(t => t.documentId === doc._id);
                    const doneTasks = docTasks.filter(t => t.status === 'Done').length;
                    const progress = docTasks.length === 0 ? 0 : Math.round((doneTasks / docTasks.length) * 100);

                    return (
                      <div key={doc._id} className="p-4 border rounded-xl border-gray-200 bg-white shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{doc.title}</h3>
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md uppercase">Live</span>
                          </div>
                          <p className="text-xs text-gray-500">Assigned Team: <span className="font-bold text-gray-700">{doc.teamId?.name || 'Unknown'}</span></p>
                          <div className="mt-3 flex items-center gap-3 w-full">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-gray-500">{progress}%</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleDeleteDocument(doc._id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {tab === 'teams' && (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className={cardClass}>
              <div className={highlight}></div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
                <Users size={18} className="text-yellow-500" /> Team Management
              </h2>
              <form onSubmit={handleCreateTeam} className="flex gap-2 mb-6">
                <input type="text" placeholder="New Team Name" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required className={inputClass} />
                <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 whitespace-nowrap">Create Team</button>
              </form>
              
              <div className="space-y-6">
                {teams.length === 0 ? <p className="text-sm text-gray-400">No teams created yet.</p> : teams.map(team => (
                  <div key={team._id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-gray-900">{team.name}</h3>
                        {(() => {
                          let best = null;
                          let maxScore = -1;
                          team.members.forEach(m => {
                            if (m.employee) {
                              const p = performers.find(pf => pf.employee?._id === m.employee._id);
                              if (p && p.score > maxScore) {
                                maxScore = p.score;
                                best = p.employee;
                              }
                            }
                          });
                          return best && maxScore > 0 ? (
                            <div className="text-[10px] text-yellow-600 font-bold mt-0.5 flex items-center gap-1"><Award size={12}/> MVP: {best.name} ({maxScore} tasks)</div>
                          ) : null;
                        })()}
                      </div>
                      <button onClick={() => handleDeleteTeam(team._id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                    <div className="p-4">
                      {team.members.length === 0 ? <p className="text-xs text-gray-400 mb-4">No members in this team.</p> : (
                        <div className="space-y-3 mb-4">
                          {team.members.map(m => {
                            const emp = m.employee;
                            if(!emp) return null;
                            return (
                              <div key={m._id} className="flex flex-col gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start md:items-center">
                                  <div>
                                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                      {emp.name}
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${emp.workingStatus === 'Available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{emp.workingStatus}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Base: {emp.designations?.join(', ') || 'None'}
                                    </div>
                                    <div className="text-xs font-semibold text-yellow-600 mt-0.5">
                                      Project Roles: {m.overrideRole?.length > 0 ? m.overrideRole.join(', ') : 'Default'}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => setEditingRolesId(editingRolesId === m._id ? null : m._id)} className="text-xs flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-lg text-gray-600 hover:bg-gray-50">
                                      <Settings size={12}/> {editingRolesId === m._id ? 'Done' : 'Edit Roles'}
                                    </button>
                                    <button onClick={() => handleRemoveMember(team._id, m._id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg"><X size={14}/></button>
                                  </div>
                                </div>
                                
                                {editingRolesId === m._id && (
                                  <div className="mt-2 p-3 bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Select Project Roles</div>
                                    <div className="space-y-2">
                                      {PREDEFINED_DESIGNATIONS.map(d => {
                                        const currentRoles = m.overrideRole?.length > 0 ? m.overrideRole : (emp.designations || []);
                                        const isChecked = currentRoles.includes(d);
                                        return (
                                          <label key={d} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                                            <input 
                                              type="checkbox" 
                                              checked={isChecked}
                                              onChange={(e) => {
                                                const newRoles = e.target.checked 
                                                  ? [...currentRoles, d] 
                                                  : currentRoles.filter(r => r !== d);
                                                handleUpdateOverrideRole(team._id, m._id, newRoles);
                                              }}
                                              className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500/20"
                                            />
                                            {d}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <div className="text-xs font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Add Employees</div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {employees.filter(e => !team.members.some(m => m.employee?._id === e._id)).map(e => (
                            <div key={e._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                              <div>
                                <div className="text-xs font-bold text-gray-900">{e.name}</div>
                                <div className="text-[10px] text-gray-500">{e.designations?.join(', ') || 'No Role'}</div>
                              </div>
                              <button onClick={() => handleAddMemberToTeam(team._id, e._id)} className="text-xs bg-yellow-400 hover:bg-yellow-300 text-black px-2 py-1 rounded font-bold flex items-center gap-1"><Plus size={12}/> Add</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={cardClass}>
              <div className={highlight}></div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
                <Award size={18} className="text-yellow-500" /> Best Performers
              </h2>
              <div className="space-y-3">
                {performers.length === 0 ? <p className="text-sm text-gray-400">No completed tasks yet.</p> : performers.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-500'}`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-900">{p.employee?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{p.score} Tasks Completed</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardClass}>
              <div className={highlight}></div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
                <UserPlus size={18} className="text-yellow-500" /> Add Employee Directory
              </h2>
              <form onSubmit={handleAddEmployee} className="space-y-3">
                <input type="text" placeholder="Name" value={empName} onChange={e => setEmpName(e.target.value)} required className={inputClass} />
                <input type="email" placeholder="Email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} required className={inputClass} />
                <input type="password" placeholder="Password" value={empPassword} onChange={e => setEmpPassword(e.target.value)} required className={inputClass} />
                <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                  {PREDEFINED_DESIGNATIONS.map(d => (
                    <label key={d} className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={empDesignations.includes(d)} onChange={() => {
                        setEmpDesignations(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
                      }} className="rounded border-gray-300 text-yellow-500" />
                      {d}
                    </label>
                  ))}
                </div>
                <button type="submit" className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 text-sm">Create Employee</button>
              </form>
            </div>

            <div className={cardClass}>
              <div className={highlight}></div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
                <Users size={18} className="text-yellow-500" /> Global Directory
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {employees.length === 0 ? <p className="text-sm text-gray-400">No employees found.</p> : employees.map(emp => (
                  <div key={emp._id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                      {emp.name.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-2 truncate">
                        {emp.name}
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md uppercase font-black tracking-widest ${emp.workingStatus === 'Available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{emp.workingStatus}</span>
                      </div>
                      <div className="text-[10px] font-semibold text-gray-500 mt-0.5 truncate">{emp.designations?.join(', ') || 'No Role Assigned'}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate">{emp.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {tab === 'tasks' && (
        <main className="max-w-7xl mx-auto p-6">
          <div className={cardClass}>
            <div className={highlight}></div>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 tracking-tight">
              <BarChart size={18} className="text-yellow-500" /> DOM Tree Project Overview
            </h2>
            
            <div className="space-y-4">
              {documents.length === 0 ? <p className="text-sm text-gray-400">No projects to display.</p> : documents.map(doc => {
                const docTasks = allTasks.filter(t => t.documentId === doc._id);
                const isExpanded = expandedDocs[doc._id];
                const doneCount = docTasks.filter(t => t.status === 'Done').length;
                const assignedCount = docTasks.filter(t => t.assignedEmployee !== null).length;
                const totalCount = docTasks.length;

                return (
                  <div key={doc._id} className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                    <div onClick={() => toggleDocExpand(doc._id)} className="bg-gray-50 hover:bg-gray-100 cursor-pointer p-4 flex items-center justify-between border-b border-gray-200 transition-colors">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={20} className="text-gray-400"/> : <ChevronRight size={20} className="text-gray-400"/>}
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            {doc.title}
                            <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase ${doc.status === 'Live' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{doc.status}</span>
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Total Tasks: {totalCount} | Assigned: {assignedCount} | Done: {doneCount}</p>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-6 bg-gray-50/30">
                        {docTasks.length === 0 ? <p className="text-xs text-gray-400 italic">No tasks generated for this project.</p> : (
                          <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-4 relative">
                            {docTasks.map((task, idx) => {
                              const isCompleted = task.status === 'Done';
                              const isUnassigned = task.assignedEmployee === null;
                              const isPending = !isCompleted && !isUnassigned;

                              const statusColor = isCompleted ? 'border-green-400 bg-green-50' : isUnassigned ? 'border-red-400 bg-red-50' : 'border-yellow-400 bg-yellow-50';
                              const dotColor = isCompleted ? 'bg-green-400' : isUnassigned ? 'bg-red-400' : 'bg-yellow-400';

                              return (
                                <div key={task._id} className="relative">
                                  <div className="absolute -left-[21px] top-4 w-4 h-0.5 bg-gray-200"></div>
                                  <div className={`absolute -left-[25px] top-3 w-2 h-2 rounded-full ${dotColor} border-2 border-white box-content`}></div>
                                  
                                  <div className={`p-4 border rounded-xl shadow-sm ${statusColor}`}>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-bold text-sm text-gray-900">{task.title}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isCompleted ? 'text-green-700 bg-green-200' : isUnassigned ? 'text-red-700 bg-red-200' : 'text-yellow-700 bg-yellow-200'}`}>
                                        {isCompleted ? 'Completed' : isUnassigned ? 'Not Assigned' : 'Pending'}
                                      </span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-black/5 text-[10px] uppercase tracking-wider flex items-center gap-4 text-gray-600 font-semibold">
                                      <span>Role: {task.requiredDesignation}</span>
                                      <span>Assigned to: {task.assignedEmployee?.name || '---'}</span>
                                      <span>Time: {task.estimatedTime}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
