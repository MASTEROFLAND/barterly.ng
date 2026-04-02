import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageCircle, ArrowLeft, Package, Clock } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function Messages({ user }: { user: User | null }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemId = searchParams.get('itemId');
  const otherUserId = searchParams.get('userId');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all chats for the user
  useEffect(() => {
    if (!user) return;

    // We fetch all messages where user is sender or receiver
    const q1 = query(collection(db, 'messages'), where('senderId', '==', user.uid));
    const q2 = query(collection(db, 'messages'), where('receiverId', '==', user.uid));

    const processMessages = async (docs: any[]) => {
      const chatMap: Record<string, any> = {};
      
      for (const d of docs) {
        const data = d.data();
        const otherId = data.senderId === user.uid ? data.receiverId : data.senderId;
        const chatKey = `${data.itemId}_${otherId}`;
        
        if (!chatMap[chatKey] || data.createdAt?.seconds > chatMap[chatKey].lastMessageAt?.seconds) {
          chatMap[chatKey] = {
            itemId: data.itemId,
            otherUserId: otherId,
            lastMessage: data.text,
            lastMessageAt: data.createdAt,
            unread: data.receiverId === user.uid && !data.read
          };
        }
      }

      const chatList = await Promise.all(Object.values(chatMap).map(async (chat) => {
        const itemDoc = await getDoc(doc(db, 'items', chat.itemId));
        const userDoc = await getDoc(doc(db, 'users', chat.otherUserId));
        return {
          ...chat,
          item: itemDoc.data(),
          otherUser: userDoc.data()
        };
      }));

      setChats(chatList.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0)));
      setLoading(false);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      // Combine with q2 results manually or just react to changes
    });

    // Actually we need a more robust way to get chats. 
    // For simplicity, let's just use a combined listener or fetch all and filter.
    const qAll = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubAll = onSnapshot(qAll, (snap) => {
      const userMessages = snap.docs.filter(d => d.data().senderId === user.uid || d.data().receiverId === user.uid);
      processMessages(userMessages);
    });

    return () => unsubAll();
  }, [user]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!user || !selectedChat) return;

    const q = query(
      collection(db, 'messages'),
      where('itemId', '==', selectedChat.itemId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((m: any) => 
          (m.senderId === user.uid && m.receiverId === selectedChat.otherUserId) ||
          (m.senderId === selectedChat.otherUserId && m.receiverId === user.uid)
        );
      setMessages(msgs);
      
      // Mark as read
      msgs.forEach(async (m: any) => {
        if (m.receiverId === user.uid && !m.read) {
          await updateDoc(doc(db, 'messages', m.id), { read: true });
        }
      });
    });

    return unsubscribe;
  }, [user, selectedChat]);

  // Auto-select chat from URL params
  useEffect(() => {
    if (itemId && otherUserId && chats.length > 0) {
      const chat = chats.find(c => c.itemId === itemId && c.otherUserId === otherUserId);
      if (chat) setSelectedChat(chat);
    }
  }, [itemId, otherUserId, chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChat || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        itemId: selectedChat.itemId,
        senderId: user.uid,
        receiverId: selectedChat.otherUserId,
        text: newMessage,
        createdAt: serverTimestamp(),
        read: false
      });
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!user) return <div className="text-center py-20">Please sign in to view messages</div>;

  return (
    <div className="h-[calc(100vh-200px)] flex bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-gray-100 flex flex-col",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-brand-green" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : chats.length > 0 ? (
            chats.map(chat => (
              <button
                key={`${chat.itemId}_${chat.otherUserId}`}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50",
                  selectedChat?.itemId === chat.itemId && selectedChat?.otherUserId === chat.otherUserId ? "bg-brand-green/5 border-l-4 border-l-brand-green" : ""
                )}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-gray-100">
                  <img src={chat.otherUser?.photoURL || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-bold truncate">{chat.otherUser?.displayName}</p>
                    {chat.unread && <div className="w-2 h-2 bg-brand-green rounded-full mt-1" />}
                  </div>
                  <p className="text-xs text-brand-green font-medium truncate mb-1">{chat.item?.title}</p>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedChat ? "hidden md:flex" : "flex"
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4">
              <button onClick={() => setSelectedChat(null)} className="md:hidden p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                <img src={selectedChat.otherUser?.photoURL || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold leading-none">{selectedChat.otherUser?.displayName}</h3>
                <p className="text-xs text-brand-green font-medium mt-1">Discussing: {selectedChat.item?.title}</p>
              </div>
              <Link to={`/item/${selectedChat.itemId}`} className="p-2 text-gray-400 hover:text-brand-green">
                <Package className="w-5 h-5" />
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl shadow-sm",
                      isMe ? "bg-brand-green text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none"
                    )}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p className={cn("text-[10px] mt-1 text-right opacity-70")}>
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-4">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="btn-primary p-3 rounded-xl disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
            <MessageCircle className="w-16 h-16 opacity-20" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
