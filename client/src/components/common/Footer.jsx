import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart, MapPin, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Campus<span className="text-indigo-600 dark:text-indigo-400">Find</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              "Lost Something? Find It. Found Something? Return It."
              A trusted, secure Lost & Found system for the entire university community.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Security Verified</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Explore Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/browse" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Browse Lost & Found Items
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Interactive Campus Map
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Report a Lost Belonging
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Report a Found Item
                </Link>
              </li>
              <li>
                <Link to="/emergency-id" className="text-rose-600 dark:text-rose-400 font-semibold hover:underline">
                  Emergency Lost ID Card
                </Link>
              </li>
            </ul>
          </div>

          {/* Safe Exchange Desks */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Designated Safe Zones
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <span>Central Library - Reception Desk (24/7)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <span>Campus Gate 1 - Central Security Post</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <span>Student Activity Center (SAC) Drop Box</span>
              </li>
            </ul>
          </div>

          {/* Help & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Support & Security
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Community Rules & Safe Handoff Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} CampusFind. Built for University Campus Community.</p>
          <div className="flex items-center gap-1">
            <span>Encouraging honesty with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>Campus Karma</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
