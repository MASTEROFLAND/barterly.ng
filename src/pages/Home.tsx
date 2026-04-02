import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, MapPin, Tag, Package } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';

export default function Home({ user }: { user: User | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  const categories = ['All', 'Electronics', 'Clothing', 'Home Goods', 'Vehicles', 'Other'];

  useEffect(() => {
    const q = query(
      collection(db, 'items'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'All' || item.category === category;
    const matchesLocation = !locationFilter || (item.location && item.location.toLowerCase().includes(locationFilter.toLowerCase()));
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-brand-green text-white p-8 md:p-16">
        <div className="relative z-10 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Trade What You Have, <br />
            <span className="text-brand-green-light">Get What You Need.</span>
          </motion.h1>
          <p className="text-lg md:text-xl text-brand-green-light mb-8">
            Join the community of thousands trading items directly. No money, just pure barter.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/add-item" className="bg-white text-brand-green px-8 py-3 rounded-xl font-bold hover:bg-brand-green-light transition-all">
              Start Trading
            </Link>
            <button className="border border-white/30 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-all">
              How it Works
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
          <img 
            src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1000" 
            alt="Barter" 
            className="w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-brand-green" />
        </div>
      </section>

      {/* Search and Filter */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Filter by location..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap transition-all font-medium",
                category === cat 
                  ? "bg-brand-green text-white" 
                  : "bg-white text-gray-600 hover:bg-brand-green-light hover:text-brand-green"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Items Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="card animate-pulse h-80 bg-gray-100" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/item/${item.id}`} className="card group block h-full">
                  <div className="aspect-square overflow-hidden relative">
                    <img 
                      src={item.images?.[0] || 'https://picsum.photos/seed/item/400/400'} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-brand-green">
                      {item.condition}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1 text-xs text-brand-brown font-medium uppercase tracking-wider">
                      <Tag className="w-3 h-3" />
                      {item.category}
                    </div>
                    <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {item.location || 'Local'}
                      </div>
                      <div className="text-xs font-bold text-brand-brown">
                        Wants: <span className="text-brand-green">{item.desiredItems.split(',')[0]}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-600">No items found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </section>
    </div>
  );
}
