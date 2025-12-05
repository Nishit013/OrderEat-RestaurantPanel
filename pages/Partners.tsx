import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { DeliveryPartner } from '../types';
import { Check, X, Bike, Car, Truck } from 'lucide-react';

export const Partners: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);

  useEffect(() => {
    const ref = db.ref('deliveryPartners');
    ref.on('value', snap => {
        if(snap.exists()) {
            setPartners(Object.keys(snap.val()).map(k => ({...snap.val()[k], id: k})));
        } else {
            setPartners([]);
        }
    });
    return () => ref.off();
  }, []);

  const toggleStatus = (id: string, current: boolean) => {
      db.ref(`deliveryPartners/${id}`).update({ isApproved: !current });
  };

  const getVehicleIcon = (type: string) => {
      if (type === 'Bike' || type === 'Scooter') return <Bike className="w-4 h-4"/>;
      return <Car className="w-4 h-4"/>;
  };

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Delivery Fleet Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.length === 0 && <p className="text-gray-400">No delivery partners registered.</p>}
            {partners.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full rounded-full object-cover"/> : <Bike className="w-6 h-6 text-gray-400"/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{p.name}</h3>
                                <p className="text-xs text-gray-500">{p.phone}</p>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {p.isApproved ? 'Approved' : 'Pending'}
                        </span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-xl mb-4 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Vehicle</span>
                            <span className="font-bold text-gray-700 flex items-center gap-1">
                                {getVehicleIcon(p.vehicleType)} {p.vehicleType}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">License Plate</span>
                            <span className="font-bold text-gray-700 uppercase">{p.vehicleNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Joined</span>
                            <span className="font-bold text-gray-700">{new Date(p.joinedAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {p.isApproved ? (
                            <button onClick={() => toggleStatus(p.id, true)} className="w-full py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 text-sm">
                                Revoke Access
                            </button>
                        ) : (
                            <div className="flex gap-2 w-full">
                                <button onClick={() => toggleStatus(p.id, false)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 text-sm">
                                    Approve
                                </button>
                                <button className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 text-sm">
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};