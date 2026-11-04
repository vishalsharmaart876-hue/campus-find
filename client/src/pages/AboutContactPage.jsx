import React, { useState } from 'react';
import { Compass, ShieldCheck, MapPin, Mail, Phone, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';

const AboutContactPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  const faqs = [
    {
      q: 'How does the AI Image Matching feature work?',
      a: 'When you report a lost item with a photo, our modular Python & OpenCV microservice processes the image, extracting color distributions and ORB feature keypoints. It compares them against active found items and calculates a visual similarity percentage.'
    },
    {
      q: 'Why are some item details marked as protected / sensitive?',
      a: 'To prevent fraudulent claims, finders of high-value items (like laptops, watches, or wallets) can conceal distinctive identifiers. True owners must answer specific verification questions before a pickup pass is issued.'
    },
    {
      q: 'What is the QR Code Collection Token?',
      a: 'When a claim is approved, a secure one-time token is generated. You show this pass to the finder or campus desk. Upon scanning/entering the code, the item is marked as returned and karma points are granted to the finder.'
    },
    {
      q: 'Where are the designated Safe Exchange Desks?',
      a: 'Always complete handoffs in public monitored zones: Central Library Ground Floor Reception (24/7) or Campus Main Gate 1 Central Security Post.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          About CampusFind & Community Safety
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          "Lost Something? Find It. Found Something? Return It."
          The centralized, transparent Lost & Found ecosystem designed for university life.
        </p>
      </div>

      {/* Safety Rules */}
      <div className="p-6 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-4">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <span>Campus Safe Handoff Guidelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900">
            <strong>1. Public Desks Only:</strong> Never meet in deserted parking structures or off-campus spots. Always pick library or security desks.
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900">
            <strong>2. QR Code Pass:</strong> Only hand over the item after validating the unique QR pass or entering the pickup token.
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900">
            <strong>3. Protect Numbers:</strong> Use our built-in in-app chat rather than publicly posting your personal phone number.
          </div>
        </div>
      </div>

      {/* FAQ Accordion / List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1"
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {f.q}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Campus Security Desk */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Contact Campus Administration & Security Desk
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Need administrative assistance or reporting suspicious activity? Reach out directly.
          </p>
        </div>

        {formSubmitted && (
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Thank you! Your message has been routed to Campus Security Administration.</span>
          </div>
        )}

        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student / Faculty Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                College Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Inquiry / Report Message
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your inquiry or suspicious post report..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
          >
            Submit Inquiry
          </button>
        </form>
      </div>
    </div>
  );
};

export default AboutContactPage;
