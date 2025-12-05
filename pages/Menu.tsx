import React, { useState } from 'react';
import { db } from '../firebase';
import { Restaurant, MenuItem, Variant } from '../types';
import { Plus, Edit2, Trash2, X, Image, Search } from 'lucide-react';

interface MenuPageProps {
  restaurant: Restaurant;
}

export const MenuPage: React.FC<MenuPageProps> = ({ restaurant }) => {
  const [items, setItems] = useState<MenuItem[]>(Object.values(restaurant.menu || {}));
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<Partial<MenuItem>>({
      isVeg: true,
      variants: []
  });

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
      if (!editItem.name || !editItem.price || !editItem.category) {
          alert("Name, Price and Category are required");
          return;
      }

      const itemId = editItem.id || Date.now().toString();
      const newItem: MenuItem = {
          id: itemId,
          name: editItem.name,
          description: editItem.description || '',
          price: Number(editItem.price),
          category: editItem.category,
          isVeg: editItem.isVeg || false,
          imageUrl: editItem.imageUrl || '',
          variants: editItem.variants || [],
          rating: editItem.rating || 0,
          votes: editItem.votes || 0
      };

      try {
          await db.ref(`restaurants/${restaurant.id}/menu/${itemId}`).set(newItem);
          // Update local state to reflect changes immediately or rely on parent re-render if real-time
          // Since we initialized state from props, we should update it manually or rely on parent. 
          // Ideally parent passes updated props. But for smoother UX here:
          const updatedItems = [...items];
          const idx = updatedItems.findIndex(i => i.id === itemId);
          if (idx > -1) updatedItems[idx] = newItem;
          else updatedItems.push(newItem);
          setItems(updatedItems);
          
          setIsEditing(false);
          setEditItem({ isVeg: true, variants: [] });
      } catch(e) {
          console.error("Error saving item", e);
          alert("Failed to save item");
      }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Delete this item?")) {
          await db.ref(`restaurants/${restaurant.id}/menu/${id}`).remove();
          setItems(items.filter(i => i.id !== id));
      }
  };

  const addVariant = () => {
      const current = editItem.variants || [];
      setEditItem({ ...editItem, variants: [...current, { name: '', price: 0 }] });
  };

  const updateVariant = (idx: number, field: keyof Variant, value: string | number) => {
      const current = [...(editItem.variants || [])];
      current[idx] = { ...current[idx], [field]: value };
      setEditItem({ ...editItem, variants: current });
  };

  const removeVariant = (idx: number) => {
      const current = [...(editItem.variants || [])];
      current.splice(idx, 1);
      setEditItem({ ...editItem, variants: current });
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Menu Management</h2>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search items..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-colors"
                    />
                </div>
                <button 
                    onClick={() => { setEditItem({ isVeg: true, variants: [] }); setIsEditing(true); }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 md:px-4 text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-200 dark:shadow-purple-900/50 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" /> Add Item
                </button>
            </div>
        </div>

        {isEditing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 w-full md:max-w-2xl md:rounded-2xl shadow-2xl overflow-hidden h-full md:h-auto md:max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{editItem.id ? 'Edit Item' : 'Create New Item'}</h3>
                        <button onClick={() => setIsEditing(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400"/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-4 bg-white dark:bg-gray-800 flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Item Name</label>
                                <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-purple-500 outline-none" value={editItem.name || ''} onChange={e => setEditItem({...editItem, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Category</label>
                                <input type="text" placeholder="e.g. Starters" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-purple-500 outline-none" value={editItem.category || ''} onChange={e => setEditItem({...editItem, category: e.target.value})} />
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Description</label>
                            <textarea className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 h-20 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-purple-500 outline-none" value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Base Price (₹)</label>
                                <input type="number" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-purple-500 outline-none" value={editItem.price || ''} onChange={e => setEditItem({...editItem, price: parseFloat(e.target.value)})} />
                            </div>
                            <div className="flex items-center gap-4 mt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={editItem.isVeg} onChange={() => setEditItem({...editItem, isVeg: true})} className="text-green-600 focus:ring-green-500" />
                                    <span className="text-sm font-bold text-green-700 dark:text-green-500">Veg</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={!editItem.isVeg} onChange={() => setEditItem({...editItem, isVeg: false})} className="text-red-600 focus:ring-red-500" />
                                    <span className="text-sm font-bold text-red-700 dark:text-red-500">Non-Veg</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Image URL</label>
                            <div className="flex gap-2">
                                <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-purple-500 outline-none" value={editItem.imageUrl || ''} onChange={e => setEditItem({...editItem, imageUrl: e.target.value})} />
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 mt-1 shrink-0 overflow-hidden">
                                    {editItem.imageUrl && <img src={editItem.imageUrl} className="w-full h-full object-cover"/>}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Variants (Optional)</label>
                                <button onClick={addVariant} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">+ Add Variant</button>
                             </div>
                             {editItem.variants?.map((v, idx) => (
                                 <div key={idx} className="flex gap-2 mb-2">
                                     <input type="text" placeholder="Name (e.g. Half)" className="flex-1 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-purple-500 outline-none" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} />
                                     <input type="number" placeholder="Price" className="w-24 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:border-purple-500 outline-none" value={v.price} onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value))} />
                                     <button onClick={() => removeVariant(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded"><Trash2 className="w-4 h-4"/></button>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-md">Save Item</button>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                        <tr>
                            <th className="p-4">Item Details</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                        {filteredItems.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">{searchQuery ? 'No items match your search.' : 'No items added. Add your first dish!'}</td></tr>
                        )}
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <td className="p-4">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover"/> : <Image className="w-6 h-6 m-auto mt-3 text-gray-400"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{item.name}</p>
                                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block border ${item.isVeg ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'}`}>
                                                {item.isVeg ? 'VEG' : 'NON-VEG'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{item.category}</td>
                                <td className="p-4 font-bold text-gray-800 dark:text-white">
                                    ₹{item.price}
                                    {item.variants && item.variants.length > 0 && <span className="text-xs font-normal text-gray-500 dark:text-gray-400 block">{item.variants.length} variants</span>}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => { setEditItem(item); setIsEditing(true); }} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};