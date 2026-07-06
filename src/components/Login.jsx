import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { User, Lock, Mail, Users, Building } from 'lucide-react';

const PREDEFINED_DESIGNATIONS = [
  "Frontend Engineer",
  "Backend Engineer",
  "Fullstack Developer",
  "UI/UX Designer",
  "QA Engineer",
  "Automation Tester",
  "DevOps Engineer",
  "Cloud Architect",
  "Security Engineer",
  "Database Administrator",
  "Performance Optimizer",
  "Build & Release Engineer",
  "Mobile App Developer",
  "Product Manager",
  "Scrum Master",
  "Tech Lead",
  "Data Engineer",
  "Site Reliability Engineer",
  "Systems Administrator",
  "Documentation Specialist"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-gray-50 to-gray-200">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-xl bg-gradient-to-b from-white to-gray-50/90 p-8 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] border border-gray-200 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            AI Employee Onboarding Portal
          </p>
        </div>

        {error && (
          <div className={`p-4 rounded-xl text-sm border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${error.includes('successful') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="block w-full pl-10 sm:text-sm bg-white border border-gray-300 rounded-xl py-2.5 text-gray-900 shadow-sm focus:ring-yellow-400 focus:border-yellow-400 transition-colors placeholder-gray-400" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="block w-full pl-10 sm:text-sm bg-white border border-gray-300 rounded-xl py-2.5 text-gray-900 shadow-sm focus:ring-yellow-400 focus:border-yellow-400 transition-colors placeholder-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="block w-full pl-10 sm:text-sm bg-white border border-gray-300 rounded-xl py-2.5 text-gray-900 shadow-sm focus:ring-yellow-400 focus:border-yellow-400 transition-colors placeholder-gray-400" />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <select value={role} onChange={e => setRole(e.target.value)} className="block w-full pl-10 sm:text-sm bg-white border border-gray-300 rounded-xl py-2.5 text-gray-900 shadow-sm focus:ring-yellow-400 focus:border-yellow-400 transition-colors">
                      <option value="employee">Employee</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>
                </div>

                {role === 'employee' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Designations / Roles (Select multiple)</label>
                      <div className="bg-white border border-gray-300 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 shadow-sm">
                        {PREDEFINED_DESIGNATIONS.map(d => (
                          <label key={d} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                            <input type="checkbox" checked={designations.includes(d)} onChange={() => handleDesignationChange(d)} className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500/20" />
                            {d}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" className="block w-full pl-10 sm:text-sm bg-white border border-gray-300 rounded-xl py-2.5 text-gray-900 shadow-sm focus:ring-yellow-400 focus:border-yellow-400 transition-colors placeholder-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Group</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="text" value={group} onChange={e => setGroup(e.target.value)} placeholder="e.g. Engineering" className="block w-full pl-10 sm:text-sm bg-white border border-gray-300 rounded-xl py-2.5 text-gray-900 shadow-sm focus:ring-yellow-400 focus:border-yellow-400 transition-colors placeholder-gray-400" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 shadow-[0_4px_10px_rgba(234,179,8,0.3)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all uppercase tracking-wider disabled:opacity-50">
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </div>

          <div className="text-center">
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-gray-500 hover:text-yellow-600 transition-colors">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
