import React, { useState, useEffect } from 'react';
import { Award, Trophy, Heart, Medal, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/rewards/leaderboard');
        if (res.data.success) {
          setLeaderboard(res.data.leaderboard || []);
        }
      } catch (err) {
        console.error('Leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Honoring Campus Good Samaritans</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Campus Karma Leaderboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Recognizing college students and faculty members who honestly returned lost belongings to their owners.
        </p>
      </div>

      {/* Rewards System Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-xl font-extrabold text-amber-500 block">+50 Pts</span>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Per Returned Item</h4>
          <p className="text-[11px] text-slate-400">Awarded immediately upon QR handoff verification</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-xl font-extrabold text-indigo-500 block">Badges</span>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Profile Recognition</h4>
          <p className="text-[11px] text-slate-400">Earn "Good Samaritan" and "Campus Hero" honors</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-xl font-extrabold text-emerald-500 block">Certificates</span>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dean's Honor Roll</h4>
          <p className="text-[11px] text-slate-400">Top contributors receive recognition at semester end</p>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-500" />
            <span>Top Contributors</span>
          </h3>
          <span className="text-xs text-slate-400">Semester Standings</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading standings...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No points recorded yet. Be the first to return an item!</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {leaderboard.map((member, idx) => (
              <div
                key={member._id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-700/80 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <img
                    src={
                      member.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=6366f1&color=fff`
                    }
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/20"
                  />

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {member.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {member.department} • {member.role?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <span className="text-sm font-extrabold text-amber-500 block">
                      {member.rewardPoints} pts
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {member.itemsReturnedCount || 1} returned
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <Link
          to="/report-found"
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
        >
          <span>Found Something on Campus? Report & Earn Points</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default LeaderboardPage;
