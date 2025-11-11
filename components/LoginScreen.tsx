import React, { useState } from 'react';
import { UserRole, Judge } from '../types';
import { AdminIcon, JudgeIcon, LogoIcon } from './icons';

interface LoginScreenProps {
  onLogin: (role: UserRole, judgeId?: string) => void;
  judges: Judge[];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, judges }) => {
  const [selectedJudge, setSelectedJudge] = useState<string>(judges[0]?.id || '');

  const handleJudgeLogin = () => {
      if (selectedJudge) {
          onLogin(UserRole.JUDGE, selectedJudge);
      } else {
          alert("Please select a judge profile.");
      }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50">
        <div className="text-center p-8">
            <div className="flex justify-center items-center mb-6">
                <LogoIcon className="w-16 h-16 rounded-lg" />
            </div>
             <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to the Hedera Africa Hackathon</h2>
             <p className="text-gray-600 mb-10">Evaluation Platform</p>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Admin Card */}
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center">
                    <AdminIcon className="w-16 h-16 text-[#5c11c9] mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Admin</h3>
                    <p className="text-gray-500 mb-6 text-center flex-grow">Manage projects, judges, criteria, and view final rankings.</p>
                    <button
                        onClick={() => onLogin(UserRole.ADMIN)}
                        className="w-full px-6 py-3 rounded-lg bg-[#5c11c9] hover:bg-[#4a0e9f] text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c11c9] focus:ring-offset-2"
                    >
                        Login as Admin
                    </button>
                </div>

                {/* Judge Card */}
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center">
                     <JudgeIcon className="w-16 h-16 text-[#95e000] mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Judge</h3>
                    <p className="text-gray-500 mb-6 text-center flex-grow">Evaluate assigned projects and submit your scores.</p>
                    <div className="w-full space-y-4">
                        <select
                            value={selectedJudge}
                            onChange={(e) => setSelectedJudge(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-3 focus:ring-2 focus:ring-[#95e000] focus:outline-none"
                            disabled={judges.length === 0}
                        >
                            {judges.length > 0 ? (
                                judges.map(j => <option key={j.id} value={j.id}>{j.name}</option>)
                            ) : (
                                <option>No judges available</option>
                            )}
                        </select>
                        <button
                            onClick={handleJudgeLogin}
                            disabled={judges.length === 0}
                            className="w-full px-6 py-3 rounded-lg bg-[#95e000] hover:bg-[#82c400] text-black font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#95e000] focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Login as Judge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;