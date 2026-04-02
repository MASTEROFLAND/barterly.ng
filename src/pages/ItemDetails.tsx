import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Tag, 
  User as UserIcon, 
  MessageCircle, 
  ArrowLeftRight,
  CheckCircle,
  AlertCircle,
  X,
  Package
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

export default function ItemDetails({ user }: { user: User | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [tradeMessage, setTradeMessage] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      const docRef = doc(db, 'items', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setItem({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };

    const fetchUserItems = async () => {
      if (!user) return;
      const q = query(
        collection(db, 'items'),
        where('ownerId', '==', user.uid),
        where('status', '==', 'available')
      );
      const querySnapshot = await getDocs(q);
      setUserItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchItem();
    fetchUserItems();
  }, [id, user]);

  const handleProposeTrade = async () => {
    if (!user || !selectedItemId || !item) return;
    
    setTradeLoading(true);
    try {
      await addDoc(collection(db, 'trades'), {
        senderId: user.uid,
        receiverId: item.ownerId,
        senderItemId: selectedItemId,
        receiverItemId: item.id,
        status: 'pending',
        message: tradeMessage,
        createdAt: serverTimestamp()
      });
      setTradeSuccess(true);
      setTimeout(() => {
        setShowTradeModal(false);
        setTradeSuccess(false);
        navigate('/my-trades');
      }, 2000);
    } catch (error) {
      console.error("Trade proposal failed:", error);
    } finally {
      setTradeLoading(false);
    }
  };

  const handleMessageOwner = () => {
    if (!user) {
      alert("Please sign in to message the owner");
      return;
    }
    navigate(`/messages?itemId=${item.id}&userId=${item.ownerId}`);
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-96 bg-gray-200 rounded-3xl" />
    <div className="h-8 w-1/2 bg-gray-200 rounded" />
    <div className="h-24 bg-gray-200 rounded" />
  </div>;

  if (!item) return <div className="text-center py-20">Item not found</div>;

  const isOwner = user?.uid === item.ownerId;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-brand-green transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Browse
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <img 
              src={item.images?.[0] || 'https://picsum.photos/seed/item/800/800'} 
              alt={item.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {item.images?.slice(1).map((img: string, i: number) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-100">
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {item.category}
              </span>
              <span className="bg-brand-brown/10 text-brand-brown px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {item.condition}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{item.title}</h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {item.location || 'Local'}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {formatDate(item.createdAt)}
              </div>
            </div>
          </div>

          <div className="card p-6 bg-brand-green/5 border-brand-green/10">
            <h3 className="text-brand-green font-bold mb-2 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" /> Looking for:
            </h3>
            <p className="text-lg font-medium text-gray-800">{item.desiredItems}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-xl">Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-green-light">
                  <img src={item.ownerPhoto || ''} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Listed by</p>
                  <p className="font-bold">{item.ownerName}</p>
                </div>
              </div>
              {!isOwner && (
                <button 
                  onClick={handleMessageOwner}
                  className="flex items-center gap-2 text-brand-green font-bold hover:bg-brand-green/5 px-4 py-2 rounded-xl transition-all"
                >
                  <MessageCircle className="w-5 h-5" /> Message Owner
                </button>
              )}
            </div>
            
            {!isOwner && (
              <button 
                onClick={() => setShowTradeModal(true)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
              >
                <ArrowLeftRight className="w-6 h-6" /> Propose Trade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trade Modal */}
      <AnimatePresence>
        {showTradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTradeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {tradeSuccess ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h2 className="text-2xl font-bold">Trade Proposed!</h2>
                  <p className="text-gray-500">We've sent your offer to {item.ownerName}.</p>
                </div>
              ) : (
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Propose a Trade</h2>
                    <button onClick={() => setShowTradeModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {!user ? (
                    <div className="text-center py-8 space-y-4">
                      <AlertCircle className="w-12 h-12 mx-auto text-brand-brown" />
                      <p className="text-gray-600">You need to sign in to propose a trade.</p>
                      <button onClick={() => navigate('/')} className="btn-primary">Sign In Now</button>
                    </div>
                  ) : userItems.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <Package className="w-12 h-12 mx-auto text-gray-300" />
                      <p className="text-gray-600">You don't have any items listed yet.</p>
                      <Link to="/add-item" className="btn-primary inline-block">List an Item First</Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Select your item to trade</label>
                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                          {userItems.map(uItem => (
                            <button
                              key={uItem.id}
                              onClick={() => setSelectedItemId(uItem.id)}
                              className={cn(
                                "flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left",
                                selectedItemId === uItem.id 
                                  ? "border-brand-green bg-brand-green/5" 
                                  : "border-gray-100 hover:border-brand-green-light"
                              )}
                            >
                              <img src={uItem.images?.[0] || ''} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{uItem.title}</p>
                                <p className="text-xs text-gray-500">{uItem.category}</p>
                              </div>
                              {selectedItemId === uItem.id && <CheckCircle className="w-5 h-5 text-brand-green" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Message (Optional)</label>
                        <textarea 
                          rows={3}
                          placeholder="Tell them why you want to trade..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
                          value={tradeMessage}
                          onChange={(e) => setTradeMessage(e.target.value)}
                        />
                      </div>

                      <button 
                        disabled={!selectedItemId || tradeLoading}
                        onClick={handleProposeTrade}
                        className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {tradeLoading ? "Sending..." : <><ArrowLeftRight className="w-5 h-5" /> Send Proposal</>}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
