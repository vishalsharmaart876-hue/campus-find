import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Tag,
  Calendar,
  Grid,
  List,
  RefreshCw,
  PlusCircle,
  X
} from 'lucide-react';
import ItemCard from '../components/items/ItemCard';
import api from '../services/api';

const categories = [
  'All',
  'Electronics',
  'ID & Cards',
  'Books & Notebooks',
  'Bags & Wallets',
  'Keys',
  'Clothing & Accessories',
  'Eyewear',
  'Documents',
  'Sports Equipment',
  'Jewelry',
  'Others'
];

const campusBuildings = [
  'All',
  'Central Library',
  'Science & Technology Block',
  'Student Activity Center & Food Court',
  'Sports Complex & Gymnasium',
  'Hostel Block 3 (Vindhya)',
  'Campus Main Gate 1 & Security HQ'
];

const BrowseItemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state initialized from query params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [campusBuilding, setCampusBuilding] = useState('All');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Load items from API
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sortBy
      };

      if (searchTerm) params.search = searchTerm;
      if (type !== 'all') params.type = type;
      if (category !== 'All') params.category = category;
      if (campusBuilding !== 'All') params.campusBuilding = campusBuilding;
      if (status !== 'all') params.status = status;

      const res = await api.get('/items', { params });
      if (res.data.success) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch items error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type, category, campusBuilding, status, sortBy, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setType('all');
    setCategory('All');
    setCampusBuilding('All');
    setStatus('all');
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Browse Lost & Found Belongings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Showing {total} reported item(s) on campus. Filter by category, location, or search keyword.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/report-lost"
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Report Lost
          </Link>
          <Link
            to="/report-found"
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Report Found
          </Link>
        </div>
      </div>

      {/* Main Filter Bar & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Input and Type Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Type Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
            <button
              onClick={() => { setType('all'); setPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => { setType('lost'); setPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'lost'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Lost Only
            </button>
            <button
              onClick={() => { setType('found'); setPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'found'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Found Only
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description, or landmark..."
              className="w-full pl-10 pr-20 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm"
            >
              Search
            </button>
          </form>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dropdowns Row: Campus Building, Status, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3">
            {/* Campus Building */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Location:</span>
              <select
                value={campusBuilding}
                onChange={(e) => { setCampusBuilding(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {campusBuildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All (Active & Pending)</option>
                <option value="active">Active Only</option>
                <option value="claim_pending">Claim Pending</option>
                <option value="returned">Returned Items</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="newest">Newest Reports</option>
                <option value="oldest">Oldest Reports</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {(searchTerm || type !== 'all' || category !== 'All' || campusBuilding !== 'All' || status !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl h-80"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching items found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Try modifying your search keywords, clearing filters, or report the item if it hasn't been listed yet.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseItemsPage;
