import React, { useState } from 'react';
import { UserProfile, TroopType, Language } from '../types';
import { TROOP_TYPES, TIERS } from '../constants';
import { translations } from '../translations';
import { Save, Target } from 'lucide-react';

interface ProfileSetupProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  lang: Language;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ initialProfile, onSave, lang }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const t = translations[lang];

  const handleTierChange = (type: TroopType, tier: number) => {
    setProfile(prev => ({ ...prev, highestTiers: { ...prev.highestTiers, [type]: tier } }));
  };

  return (
    <div className={`max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl`}>
      <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-3"><Target className="text-amber-500" /> {t.initialization}</h2>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">{t.marchSize}</label>
            <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-amber-500 outline-none" value={profile.marchSize || ''} onChange={(e) => setProfile({...profile, marchSize: parseInt(e.target.value) || 0})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">{t.embassyCap}</label>
            <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-amber-500 outline-none" value={profile.embassyCapacity || ''} onChange={(e) => setProfile({...profile, embassyCapacity: parseInt(e.target.value) || 0})} />
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 grid grid-cols-2 gap-4">
          {TROOP_TYPES.map(type => (
            <div key={type} className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-black">{type}</label>
              <select className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" value={profile.highestTiers[type]} onChange={(e) => handleTierChange(type, parseInt(e.target.value))}>
                {TIERS.map(tier => <option key={tier} value={tier}>T{tier}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => onSave({ ...profile, isSetup: true })} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2">
        <Save size={20} /> {t.saveTactics}
      </button>
    </div>
  );
};

export default ProfileSetup;
