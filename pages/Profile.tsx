import React, { useState } from 'react';
import { db } from '../firebase';
import { Restaurant } from '../types';
import { MapPicker } from '../components/MapPicker';
import { Save, AlertCircle } from 'lucide-react';

interface ProfileProps {
  restaurant: Restaurant;
}

export const Profile: React.FC<ProfileProps> = ({ restaurant }) => {
  const [formData, setFormData] = useState<Partial<Restaurant>>(restaurant);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof Restaurant, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
      setLoading(true);
      try {
          await db.ref(`restaurants/${restaurant.id}`).update(formData);
          alert("Profile updated successfully!");
      } catch (e) {
          console.error("Error updating profile", e);
          alert("Failed to update profile.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Restaurant Profile</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage your listing details and settlements.</p>
        </div>

        {!restaurant.isApproved && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-purple-800 dark:text-purple-300">Pending Approval</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-400">Your restaurant is currently under review. Please ensure all details below are accurate to speed up the approval process.</p>
                </div>
            </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 space-y-6 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Restaurant Name</label>
                    <input 
                        type="text" 
                        className="w-full border dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.name || ''}
                        onChange={e => handleChange('name', e.target.value)}
                    />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Contact Number</label>
                    <input 
                        type="tel" 
                        className="w-full border dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.phone || ''}
                        onChange={e => handleChange('phone', e.target.value)}
                        placeholder="+91 9876543210"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Cuisines (Comma separated)</label>
                    <input 
                        type="text" 
                        className="w-full border dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.cuisine?.join(', ') || ''}
                        onChange={e => handleChange('cuisine', e.target.value.split(',').map((s: string) => s.trim()))}
                        placeholder="North Indian, Chinese, Italian"
                    />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Price for Two (₹)</label>
                    <input 
                        type="number" 
                        className="w-full border dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.priceForTwo || ''}
                        onChange={e => handleChange('priceForTwo', parseFloat(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Banner Image URL</label>
                    <input 
                        type="text" 
                        className="w-full border dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.imageUrl || ''}
                        onChange={e => handleChange('imageUrl', e.target.value)}
                    />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">UPI ID (For Settlements)</label>
                    <input 
                        type="text" 
                        className="w-full border dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.upiId || ''}
                        onChange={e => handleChange('upiId', e.target.value)}
                        placeholder="restaurant@upi"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Full Address</label>
                <textarea 
                    className="w-full border dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 h-24 mb-4 text-gray-900 dark:text-white"
                    value={formData.address || ''}
                    onChange={e => handleChange('address', e.target.value)}
                />
                
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Locate on Map</label>
                <MapPicker 
                    initialLat={restaurant.lat} 
                    initialLng={restaurant.lng}
                    onLocationSelect={(lat, lng) => {
                        setFormData(prev => ({ ...prev, lat, lng }));
                    }}
                />
                {formData.lat && <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-bold flex items-center gap-1"><Save className="w-3 h-3"/> Location Coordinates Captured</p>}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50 transition flex items-center justify-center gap-2"
                >
                    {loading ? 'Saving...' : <><Save className="w-4 h-4"/> Save Profile</>}
                </button>
            </div>
        </div>
    </div>
  );
};