import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { motion } from 'motion/react';
import { Camera, Package, Info, CheckCircle } from 'lucide-react';

export default function AddItem({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    condition: 'Good',
    desiredItems: '',
    location: '',
    imageUrl: ''
  });

  const categories = ['Electronics', 'Clothing', 'Home Goods', 'Vehicles', 'Other'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'items'), {
        ...formData,
        ownerId: user.uid,
        ownerName: user.displayName,
        ownerPhoto: user.photoURL,
        images: formData.imageUrl ? [formData.imageUrl] : [],
        status: 'available',
        createdAt: serverTimestamp()
      });
      navigate('/my-items');
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-green">List an Item</h1>
        <p className="text-gray-500">Share what you have and tell us what you're looking for.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Item Title</label>
          <input 
            required
            type="text" 
            placeholder="e.g. Vintage Camera, Mountain Bike..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Category</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Condition</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            >
              {conditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Description</label>
          <textarea 
            required
            rows={4}
            placeholder="Tell us more about the item, its condition, and any history..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">What are you looking for in exchange?</label>
          <input 
            required
            type="text" 
            placeholder="e.g. Gardening tools, Books, Anything interesting..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
            value={formData.desiredItems}
            onChange={(e) => setFormData({ ...formData, desiredItems: e.target.value })}
          />
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3" /> Separate items with commas
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Image URL</label>
          <div className="flex gap-4">
            <input 
              type="url" 
              placeholder="https://..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>
          {formData.imageUrl && (
            <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-gray-200">
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Location</label>
          <input 
            type="text" 
            placeholder="e.g. Lagos, Nigeria"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
        >
          {loading ? "Listing..." : <><CheckCircle className="w-5 h-5" /> List Item Now</>}
        </button>
      </form>
    </div>
  );
}
