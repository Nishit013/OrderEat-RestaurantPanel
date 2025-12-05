import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Order, OrderStatus } from '../types';
import { MapPin, Bike, Phone, User } from 'lucide-react';

interface OrdersPageProps {
  restaurantId: string;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ restaurantId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<'LIVE' | 'PAST'>('LIVE');

  useEffect(() => {
    const ref = db.ref('orders');
    const listener = ref.on('value', snap => {
        if(snap.exists()) {
            const data = snap.val();
            const all = Object.keys(data).map(key => ({ ...data[key], id: key })) as Order[];
            const myOrders = all.filter(o => o.restaurantId === restaurantId);
            setOrders(myOrders.sort((a,b) => b.createdAt - a.createdAt));
        } else {
            setOrders([]);
        }
    });
    return () => ref.off('value', listener);
  }, [restaurantId]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
      await db.ref(`orders/${orderId}`).update({ status });
  };

  const filteredOrders = orders.filter(o => {
      if (activeFilter === 'LIVE') {
          return [OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY].includes(o.status);
      } else {
          return [OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status);
      }
  });

  const getStatusColor = (status: OrderStatus) => {
      switch(status) {
          case OrderStatus.PLACED: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
          case OrderStatus.CONFIRMED: return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
          case OrderStatus.PREPARING: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
          case OrderStatus.READY_FOR_PICKUP: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
          case OrderStatus.OUT_FOR_DELIVERY: return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50';
          case OrderStatus.DELIVERED: return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50';
          default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Order Management</h2>
            <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700 flex gap-1 w-full sm:w-auto">
                <button 
                    onClick={() => setActiveFilter('LIVE')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition ${activeFilter === 'LIVE' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    Live
                </button>
                <button 
                     onClick={() => setActiveFilter('PAST')}
                     className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition ${activeFilter === 'PAST' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    Past
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-400 font-medium">No orders found.</p>
                </div>
            )}
            {filteredOrders.map(order => (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-colors">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                        <div>
                            <span className="font-bold text-gray-800 dark:text-white block">#{order.id ? order.id.slice(-6) : 'ID'}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getStatusColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                    
                    <div className="p-4 flex-1 space-y-4">
                        <div className="space-y-2">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-start text-sm">
                                    <div className="flex items-start gap-2">
                                        <div className={`w-4 h-4 mt-0.5 border flex items-center justify-center rounded-sm shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                            <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700 dark:text-gray-300">
                                                {item.quantity} x {item.name}
                                            </p>
                                            {item.selectedVariant && <p className="text-xs text-gray-400">{item.selectedVariant.name}</p>}
                                        </div>
                                    </div>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between font-bold text-gray-800 dark:text-white">
                                <span>Total Amount</span>
                                <span>₹{order.totalAmount}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 uppercase font-bold">{order.paymentMethod === 'ONLINE' ? 'Paid Online' : 'Cash on Delivery'}</p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl text-xs space-y-1 text-gray-600 dark:text-gray-400">
                            <p className="font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> Delivery Address</p>
                            <p className="pl-4">{order.deliveryAddress}</p>
                        </div>

                        {/* Delivery Partner Details */}
                        {order.deliveryPartner && (
                             <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                        <Bike className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Delivery Partner</p>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm leading-tight">{order.deliveryPartner.name}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase mt-0.5">{order.deliveryPartner.vehicleNumber}</p>
                                    </div>
                                </div>
                                <a 
                                    href={`tel:${order.deliveryPartner.phone}`} 
                                    className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full text-green-600 hover:bg-green-50 shadow-sm border border-gray-100 dark:border-gray-700 transition"
                                    title="Call Partner"
                                >
                                    <Phone className="w-4 h-4" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons based on Status */}
                    {activeFilter === 'LIVE' && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                            {order.status === OrderStatus.PLACED && (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => updateStatus(order.id, OrderStatus.CANCELLED)}
                                        className="flex-1 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(order.id, OrderStatus.CONFIRMED)}
                                        className="flex-1 py-2.5 bg-green-600 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-green-700 transition"
                                    >
                                        Accept
                                    </button>
                                </div>
                            )}
                            
                            {order.status === OrderStatus.CONFIRMED && (
                                <button 
                                    onClick={() => updateStatus(order.id, OrderStatus.PREPARING)}
                                    className="w-full py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl shadow-md hover:bg-orange-600 transition"
                                >
                                    Start Preparing
                                </button>
                            )}

                            {order.status === OrderStatus.PREPARING && (
                                <button 
                                    onClick={() => updateStatus(order.id, OrderStatus.READY_FOR_PICKUP)}
                                    className="w-full py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-700 transition"
                                >
                                    Mark Ready
                                </button>
                            )}

                            {order.status === OrderStatus.READY_FOR_PICKUP && (
                                <div className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 animate-pulse bg-yellow-50 dark:bg-yellow-900/10 py-2 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                                    Waiting for Delivery Partner...
                                </div>
                            )}
                             {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                                <div className="text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                    Order is out for delivery
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};