import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp, getDocFromServer, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  User as UserIcon, 
  LogOut, 
  Package, 
  ArrowLeftRight, 
  Home as HomeIcon,
  Menu,
  X,
  ChevronRight,
  MapPin,
  Clock,
  Tag,
  MessageCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import ItemDetails from './pages/ItemDetails';
import MyItems from './pages/MyItems';
import MyTrades from './pages/MyTrades';
import Profile from './pages/Profile';
import AddItem from './pages/AddItem';
import Messages from './pages/Messages';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingTradesCount, setPendingTradesCount] = useState(0);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'message' | 'trade' } | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous',
            email: user.email,
            photoURL: user.photoURL,
            bio: '',
            location: '',
            createdAt: serverTimestamp()
          });
        }
        setUser(user);

        // Listen for unread messages
        const qMessages = query(
          collection(db, 'messages'),
          where('receiverId', '==', user.uid),
          where('read', '==', false)
        );
        const unsubMessages = onSnapshot(qMessages, (snap) => {
          const newCount = snap.size;
          if (newCount > unreadCount && unreadCount !== 0) {
            setNotification({
              title: 'New Message',
              message: 'You have received a new message.',
              type: 'message'
            });
          }
          setUnreadCount(newCount);
        });

        // Listen for pending trades
        const qTrades = query(
          collection(db, 'trades'),
          where('receiverId', '==', user.uid),
          where('status', '==', 'pending')
        );
        const unsubTrades = onSnapshot(qTrades, (snap) => {
          const newCount = snap.size;
          if (newCount > pendingTradesCount && pendingTradesCount !== 0) {
            setNotification({
              title: 'New Trade Proposal',
              message: 'Someone wants to trade with you!',
              type: 'trade'
            });
          }
          setPendingTradesCount(newCount);
        });

        return () => {
          unsubMessages();
          unsubTrades();
        };
      } else {
        setUser(null);
        setUnreadCount(0);
        setPendingTradesCount(0);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [unreadCount, pendingTradesCount]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-green">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col">
          {/* Navbar */}
          <nav className="glass sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-brand-green">
              <ArrowLeftRight className="w-8 h-8" />
              <span>Barterly</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="hover:text-brand-green transition-colors font-medium">Browse</Link>
              {user && (
                <>
                  <Link to="/my-items" className="hover:text-brand-green transition-colors font-medium">My Items</Link>
                  <Link to="/my-trades" className="hover:text-brand-green transition-colors font-medium relative">
                    Trades
                    {pendingTradesCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-brand-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingTradesCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/messages" className="hover:text-brand-green transition-colors font-medium relative">
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/add-item" className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> List Item
                  </Link>
                  <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-green-light hover:border-brand-green transition-all">
                    <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button onClick={handleLogin} className="btn-primary">Sign In</button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </nav>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md:hidden fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col gap-6"
              >
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-semibold">Browse</Link>
                {user && (
                  <>
                    <Link to="/my-items" onClick={() => setIsMenuOpen(false)} className="text-xl font-semibold">My Items</Link>
                    <Link to="/my-trades" onClick={() => setIsMenuOpen(false)} className="text-xl font-semibold flex items-center gap-2">
                      Trades
                      {pendingTradesCount > 0 && (
                        <span className="bg-brand-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {pendingTradesCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/messages" onClick={() => setIsMenuOpen(false)} className="text-xl font-semibold flex items-center gap-2">
                      Messages
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="text-xl font-semibold">Profile</Link>
                    <Link to="/add-item" onClick={() => setIsMenuOpen(false)} className="btn-primary text-center">List Item</Link>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-red-500 font-semibold text-left">Logout</button>
                  </>
                )}
                {!user && (
                  <button onClick={() => { handleLogin(); setIsMenuOpen(false); }} className="btn-primary">Sign In</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/item/:id" element={<ItemDetails user={user} />} />
              <Route path="/my-items" element={user ? <MyItems user={user} /> : <div className="text-center py-20">Please sign in</div>} />
              <Route path="/my-trades" element={user ? <MyTrades user={user} /> : <div className="text-center py-20">Please sign in</div>} />
              <Route path="/messages" element={user ? <Messages user={user} /> : <div className="text-center py-20">Please sign in</div>} />
              <Route path="/profile" element={user ? <Profile user={user} /> : <div className="text-center py-20">Please sign in</div>} />
              <Route path="/add-item" element={user ? <AddItem user={user} /> : <div className="text-center py-20">Please sign in</div>} />
            </Routes>
          </main>

          {/* Notification Toast */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="fixed bottom-8 right-8 z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-4 min-w-[300px]"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  notification.type === 'message' ? "bg-red-100 text-red-600" : "bg-brand-green/10 text-brand-green"
                )}>
                  {notification.type === 'message' ? <MessageCircle className="w-6 h-6" /> : <ArrowLeftRight className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <footer className="bg-brand-brown text-white py-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <div className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <ArrowLeftRight className="w-8 h-8" />
                  <span>Barterly</span>
                </div>
                <p className="text-brand-brown-light">The modern way to trade what you have for what you need. Sustainable, community-driven, and simple.</p>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-brand-brown-light">
                  <li><Link to="/" className="hover:text-white transition-colors">Browse Items</Link></li>
                  <li><Link to="/how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
                  <li><Link to="/safety" className="hover:text-white transition-colors">Safety Tips</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Connect</h4>
                <p className="text-brand-brown-light mb-4">Join our community of over 10,000 traders.</p>
                <div className="flex gap-4">
                  {/* Social icons would go here */}
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-brand-brown-light text-sm">
              &copy; {new Date().getFullYear()} Barterly. All rights reserved.
            </div>
          </footer>
        </div>
      </Router>
    </ErrorBoundary>
  );
}
