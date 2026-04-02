import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { motion } from 'motion/react';
import { User as UserIcon, MapPin, Mail, Info, CheckCircle } from 'lucide-react';

export default function Profile({ user }: { user: User | null }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        bio: profile.bio || '',
        location: profile.location || ''
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Profile update failed:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-200 rounded-3xl" />;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand-green-light shadow-lg">
          <img src={user?.photoURL || ''} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{profile?.displayName}</h1>
          <p className="text-gray-500 flex items-center gap-1">
            <Mail className="w-4 h-4" /> {user?.email}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card p-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Display Name</label>
          <input 
            required
            type="text" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
            value={profile?.displayName || ''}
            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Bio</label>
          <textarea 
            rows={4}
            placeholder="Tell other traders about yourself..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
            value={profile?.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Location</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="City, Country"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
              value={profile?.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            />
          </div>
        </div>

        <button 
          disabled={saving}
          type="submit" 
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
        >
          {saving ? "Saving..." : success ? <><CheckCircle className="w-5 h-5" /> Profile Updated</> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
