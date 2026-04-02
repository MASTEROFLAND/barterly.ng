import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { motion } from 'motion/react';
import { ArrowLeftRight, Check, X, Clock, Package, MessageCircle } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

export default function MyTrades({ user }: { user: User | null }) {
  const [incomingTrades, setIncomingTrades] = useState<any[]>([]);
  const [outgoingTrades, setOutgoingTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const qIncoming = query(collection(db, 'trades'), where('receiverId', '==', user.uid));
    const qOutgoing = query(collection(db, 'trades'), where('senderId', '==', user.uid));

    const unsubIncoming = onSnapshot(qIncoming, async (snapshot) => {
      const trades = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const senderItem = await getDoc(doc(db, 'items', data.senderItemId));
        const receiverItem = await getDoc(doc(db, 'items', data.receiverItemId));
        const sender = await getDoc(doc(db, 'users', data.senderId));
        return {
          id: d.id,
          ...data,
          senderItem: senderItem.data(),
          receiverItem: receiverItem.data(),
          senderProfile: sender.data()
        };
      }));
      setIncomingTrades(trades.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });

    const unsubOutgoing = onSnapshot(qOutgoing, async (snapshot) => {
      const trades = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const senderItem = await getDoc(doc(db, 'items', data.senderItemId));
        const receiverItem = await getDoc(doc(db, 'items', data.receiverItemId));
        const receiver = await getDoc(doc(db, 'users', data.receiverId));
        return {
          id: d.id,
          ...data,
          senderItem: senderItem.data(),
          receiverItem: receiverItem.data(),
          receiverProfile: receiver.data()
        };
      }));
      setOutgoingTrades(trades.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [user]);

  const handleUpdateStatus = async (tradeId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'trades', tradeId), { status: newStatus });
      // If accepted, we might want to mark items as traded, but let's keep it simple for now
    } catch (error) {
      console.error("Failed to update trade status:", error);
    }
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-40 bg-gray-200 rounded-3xl" />
    <div className="h-40 bg-gray-200 rounded-3xl" />
  </div>;

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-brand-green" /> Incoming Proposals
        </h2>
        {incomingTrades.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {incomingTrades.map(trade => (
              <TradeCard 
                key={trade.id} 
                trade={trade} 
                isIncoming={true} 
                onUpdateStatus={handleUpdateStatus} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <p className="text-gray-400">No incoming trade proposals yet.</p>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-brand-brown" /> Outgoing Proposals
        </h2>
        {outgoingTrades.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {outgoingTrades.map(trade => (
              <TradeCard 
                key={trade.id} 
                trade={trade} 
                isIncoming={false} 
                onUpdateStatus={handleUpdateStatus} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <p className="text-gray-400">You haven't proposed any trades yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function TradeCard({ trade, isIncoming, onUpdateStatus }: any) {
  const statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 flex flex-col md:flex-row gap-8 items-center"
    >
      <div className="flex-1 flex items-center gap-4 w-full">
        <div className="text-center space-y-2 flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase">Your Item</p>
          <div className="aspect-square w-24 mx-auto rounded-xl overflow-hidden border border-gray-100">
            <img src={isIncoming ? trade.receiverItem?.images?.[0] : trade.senderItem?.images?.[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <p className="font-bold text-sm truncate">{isIncoming ? trade.receiverItem?.title : trade.senderItem?.title}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <ArrowLeftRight className="w-8 h-8 text-brand-green" />
          <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", statusColors[trade.status])}>
            {trade.status}
          </span>
        </div>

        <div className="text-center space-y-2 flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase">{isIncoming ? "Their Item" : "Their Item"}</p>
          <div className="aspect-square w-24 mx-auto rounded-xl overflow-hidden border border-gray-100">
            <img src={isIncoming ? trade.senderItem?.images?.[0] : trade.receiverItem?.images?.[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <p className="font-bold text-sm truncate">{isIncoming ? trade.senderItem?.title : trade.receiverItem?.title}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-green-light">
            <img src={isIncoming ? trade.senderProfile?.photoURL : trade.receiverProfile?.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{isIncoming ? "From" : "To"}</p>
            <p className="font-bold">{isIncoming ? trade.senderProfile?.displayName : trade.receiverProfile?.displayName}</p>
          </div>
          <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatDate(trade.createdAt)}
          </div>
        </div>

        {trade.message && (
          <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 flex gap-2 italic">
            <MessageCircle className="w-4 h-4 flex-shrink-0 text-gray-400" />
            "{trade.message}"
          </div>
        )}

        {trade.status === 'pending' && (
          <div className="flex gap-2">
            {isIncoming ? (
              <>
                <button 
                  onClick={() => onUpdateStatus(trade.id, 'accepted')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button 
                  onClick={() => onUpdateStatus(trade.id, 'declined')}
                  className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </>
            ) : (
              <button 
                onClick={() => onUpdateStatus(trade.id, 'cancelled')}
                className="w-full border border-gray-200 text-gray-500 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel Proposal
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
