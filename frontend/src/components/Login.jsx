import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { User, Lock, Mail, Users, Building, BrainCircuit, Sparkles, ArrowRight } from 'lucide-react';

const PREDEFINED_DESIGNATIONS = [
  "Frontend Engineer", "Backend Engineer", "Fullstack Developer",
  "UI/UX Designer", "QA Engineer", "Automation Tester",
  "DevOps Engineer", "Cloud Architect", "Security Engineer",
  "Database Administrator", "Performance Optimizer", "Build & Release Engineer",
  "Mobile App Developer", "Product Manager", "Scrum Master",
  "Tech Lead", "Data Engineer", "Site Reliability Engineer",
  "Systems Administrator", "Documentation Specialist"
];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');
  const [designations, setDesignations] = useState([]);
  const [department, setDepartment] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Simple animation trigger
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleDesignationChange = (d) => {
    if (designations.includes(d)) {
      setDesignations(designations.filter(x => x !== d));
    } else {
      setDesignations([...designations, d]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email, password }
      : { email, password, name, role, designations, department, group };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        login(data.token, data.user);
        navigate(data.user.role === 'hr' ? '/hr' : '/employee');
      } else {
        setIsLogin(true);
        setError('Registration successful. Please login.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-yellow-400 selection:text-black">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950 opacity-80" />
        
        {/* Abstract Grid Pattern */}
        <div className="absolute inset-0" 
             style={{ backgroundImage: 'linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <BrainCircuit className="w-6 h-6 text-zinc-950" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Smart Onboarding</span>
          </div>
        </div>

        <div className={`relative z-10 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl font-bold text-white leading-tight tracking-tight mb-6">
            Intelligent <br />
            <span className="text-yellow-400">Team</span> Orchestration
          </h1>
          <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
            AI-driven role assignment, document analysis, and automated workflows. Build teams faster and smarter.
          </p>
          
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center`}>
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-yellow-400 flex items-center justify-center z-10">
                <Sparkles className="w-4 h-4 text-zinc-950" />
              </div>
            </div>
            <p className="text-sm text-zinc-500 font-medium">+ Seamless AI Integration</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-zinc-950" />
            </div>
            <span className="text-xl font-bold text-zinc-950 tracking-tight">Smart Onboarding</span>
          </div>

          <div className={`transition-all duration-700 delay-100 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-zinc-500 text-sm mb-8">
              {isLogin ? 'Enter your credentials to access the portal' : 'Get started with AI-driven onboarding today.'}
            </p>

            {error && (
              <div className={`p-4 mb-6 rounded-xl text-sm border flex items-center gap-3 ${error.includes('successful') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-yellow-500 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" 
                           className="block w-full pl-11 bg-zinc-50 border-2 border-transparent rounded-xl py-3 text-zinc-900 transition-all hover:bg-zinc-100 focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none placeholder-zinc-400" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-yellow-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" 
                         className="block w-full pl-11 bg-zinc-50 border-2 border-transparent rounded-xl py-3 text-zinc-900 transition-all hover:bg-zinc-100 focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none placeholder-zinc-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-yellow-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" 
                         className="block w-full pl-11 bg-zinc-50 border-2 border-transparent rounded-xl py-3 text-zinc-900 transition-all hover:bg-zinc-100 focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none placeholder-zinc-400" />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-5 animate-in slide-in-from-top-4 duration-500 fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">Account Type</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-yellow-500 transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      <select value={role} onChange={e => setRole(e.target.value)} 
                              className="block w-full pl-11 bg-zinc-50 border-2 border-transparent rounded-xl py-3 text-zinc-900 transition-all hover:bg-zinc-100 focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none appearance-none">
                        <option value="employee">Employee</option>
                        <option value="hr">HR Administrator</option>
                      </select>
                    </div>
                  </div>

                  {role === 'employee' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2 flex justify-between">
                          <span>Designations</span>
                          <span className="text-zinc-400 font-normal normal-case">{designations.length} selected</span>
                        </label>
                        <div className="bg-zinc-50 border-2 border-transparent rounded-xl p-4 max-h-48 overflow-y-auto space-y-3 shadow-inner hover:bg-zinc-100 transition-colors">
                          {PREDEFINED_DESIGNATIONS.map(d => (
                            <label key={d} className="flex items-start gap-3 group cursor-pointer">
                              <div className="relative flex items-center justify-center mt-0.5">
                                <input type="checkbox" checked={designations.includes(d)} onChange={() => handleDesignationChange(d)} 
                                       className="peer appearance-none w-5 h-5 border-2 border-zinc-300 rounded focus:ring-4 focus:ring-yellow-400/20 checked:border-yellow-500 checked:bg-yellow-500 transition-all" />
                                <svg className="absolute w-3 h-3 text-zinc-950 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">{d}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">Department</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                              <Building className="w-4 h-4" />
                            </div>
                            <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Engineering" 
                                   className="block w-full pl-9 bg-zinc-50 border-2 border-transparent rounded-xl py-3 text-zinc-900 transition-all focus:bg-white focus:border-yellow-400 outline-none text-sm placeholder-zinc-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">Group</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                              <Users className="w-4 h-4" />
                            </div>
                            <input type="text" value={group} onChange={e => setGroup(e.target.value)} placeholder="Backend" 
                                   className="block w-full pl-9 bg-zinc-50 border-2 border-transparent rounded-xl py-3 text-zinc-900 transition-all focus:bg-white focus:border-yellow-400 outline-none text-sm placeholder-zinc-400" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <button type="submit" disabled={loading} 
                      className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-zinc-950 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-yellow-400/20">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center pt-4 border-t border-zinc-100">
                <p className="text-sm text-zinc-500">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                          className="font-bold text-zinc-900 hover:text-yellow-600 transition-colors focus:outline-none focus:underline">
                    {isLogin ? "Create one now" : "Sign in instead"}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
