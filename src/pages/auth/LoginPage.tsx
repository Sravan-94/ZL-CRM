import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface User {
  role: 'ADMIN' | 'BDA';
  [key: string]: any; // Adjust based on your actual user data structure
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post<{ data: User }>('https://147.93.102.131:8080/api/login', {
        email,
        password,
      });

      const user = res.data;
      login(user);
      toast.success('Login successful');
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/bda/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Invalid email or password');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 via-blue-100 to-blue-400">
    <div className="flex flex-col lg:flex-row items-center justify-center w-full max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl py-8 px-6">

        {/* Left Section: Logo, Branding, and Quote */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 text-center lg:text-left ">
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <img
              src="/Logo-removebg-preview.png"
              alt="CRM Pro Logo"
              className="w-20 h-15 mr-4"
            />
            <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Welcome to Zynlogic Technologies</h1>
          </div>
          <p className="text-lg text-gray-600 mb-8 font-medium">
            Unlock the power of seamless customer relationship management to drive your business forward.
          </p>
          <blockquote className="text-xl italic text-gray-500 border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-lg">
            "Success is where preparation and opportunity meet." — Bobby Unser
          </blockquote>
        </div>
        {/* Right Section: Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-white">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <h2 className="text-3xl font-semibold text-center text-blue-900 tracking-tight">
              Sign in to Your Account
            </h2>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300 hover:border-blue-300"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300 hover:border-blue-300"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-sm text-blue-600 hover:text-blue-800 focus:outline-none transition-colors duration-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-300 ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:bg-blue-800'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
