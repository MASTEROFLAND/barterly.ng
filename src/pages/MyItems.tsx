import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { motion } from 'motion/react';
import { Package, Trash2, Edit2, Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function MyItems({ user }: { user: User | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'items'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await deleteDoc(doc(db, 'items', id));
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'hidden' : 'available';
    try {
      await updateDoc(doc(db, 'items', id), { status: newStatus });
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-3xl animate-pulse" />)}
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-green">My Listings</h1>
        <Link to="/add-item" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> List New Item
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <motion.div 
              key={item.id}
              layout
              className="card flex flex-col"
            >
              <div className="aspect-video relative overflow-hidden">
                <img src={item.images?.[0] || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className={cn(
                  "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase",
                  item.status === 'available' ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                )}>
                  {item.status}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.description}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2">
                  <Link to={`/item/${item.id}`} className="p-2 text-gray-400 hover:text-brand-green transition-colors" title="View">
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button 
                    onClick={() => toggleStatus(item.id, item.status)}
                    className="p-2 text-gray-400 hover:text-brand-brown transition-colors" 
                    title={item.status === 'available' ? "Hide" : "Show"}
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-auto" 
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-600">You haven't listed any items yet</h3>
          <p className="text-gray-400 mb-8">Start trading by listing your first item!</p>
          <Link to="/add-item" className="btn-primary">List Item Now</Link>
        </div>
      )}
    </div>
  );
}
