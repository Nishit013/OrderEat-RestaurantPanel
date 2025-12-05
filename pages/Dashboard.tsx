import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { Restaurant, Order, OrderStatus } from '../types';
import { DollarSign, ShoppingBag, Star, Clock, TrendingUp, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  restaurant: Restaurant;
}

type TimeRange = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'All Time';

export const Dashboard: React.FC<DashboardProps> = ({ restaurant }) => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<TimeRange>('Today');
  
  // Fetch Orders
  useEffect(() => {
    const ref = db.ref('orders');
    const listener = ref.on('value', snap => {
        if(snap.exists()) {
            const data = snap.val();
            const list = Object.keys(data).map(key => ({ ...data[key], id: key })) as Order[];
            const myOrders = list.filter(o => o.restaurantId === restaurant.id && o.status !== OrderStatus.CANCELLED);
            setAllOrders(myOrders);
        }
    });
    return () => ref.off('value', listener);
  }, [restaurant.id]);

  // Filter Orders based on TimeRange
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start = 0;
    let end = now.getTime();

    switch (activeFilter) {
        case 'Today':
            start = new Date(now.setHours(0,0,0,0)).getTime();
            break;
        case 'Yesterday':
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            start = new Date(y.setHours(0,0,0,0)).getTime();
            end = new Date(y.setHours(23,59,59,999)).getTime();
            break;
        case 'Last 7 Days':
            start = new Date(now.setDate(now.getDate() - 7)).getTime();
            break;
        case 'Last 30 Days':
            start = new Date(now.setDate(now.getDate() - 30)).getTime();
            break;
        case 'All Time':
            start = 0;
            break;
    }

    return allOrders.filter(o => o.createdAt >= start && o.createdAt <= end);
  }, [allOrders, activeFilter]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalNetIncome = filteredOrders.reduce((acc, order) => {
        const orderItemTotal = order.items?.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0) || 0;
        // Est. Net Income is 90% of dish value
        return acc + (orderItemTotal * 0.90);
    }, 0);

    // Pending count is always based on LIVE status, irrespective of time filter
    const pendingCount = allOrders.filter(o => o.status === OrderStatus.PLACED || o.status === OrderStatus.CONFIRMED).length;

    return {
        revenue: totalNetIncome,
        count: filteredOrders.length,
        pending: pendingCount,
        rating: restaurant.rating
    };
  }, [filteredOrders, allOrders, restaurant.rating]);

  // Generate Chart Data
  const chartData = useMemo(() => {
      if (activeFilter === 'Today' || activeFilter === 'Yesterday') {
          // Hourly Data
          const data = Array.from({ length: 24 }, (_, i) => ({
              name: `${i}:00`,
              revenue: 0,
              hour: i
          }));

          filteredOrders.forEach(order => {
              const hour = new Date(order.createdAt).getHours();
              const orderItemTotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
              const netIncome = orderItemTotal * 0.90;
              
              if (data[hour]) {
                  data[hour].revenue += netIncome;
              }
          });
          return data;
      } else {
          // Daily Data
          // Determine number of days to show. For 'All Time', we might group differently, but sticking to daily is fine for now.
          const daysMap = new Map<string, number>();
          
          // Pre-fill last 7 or 30 days if applicable to ensure chart looks continuous
          const daysToShow = activeFilter === 'Last 30 Days' ? 30 : activeFilter === 'Last 7 Days' ? 7 : 0;
          if (daysToShow > 0) {
              for (let i = daysToShow - 1; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  daysMap.set(d.toLocaleDateString(), 0);
              }
          }

          filteredOrders.forEach(order => {
              const dateStr = new Date(order.createdAt).toLocaleDateString();
              const orderItemTotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
              const netIncome = orderItemTotal * 0.90;
              
              daysMap.set(dateStr, (daysMap.get(dateStr) || 0) + netIncome);
          });

          // Convert Map to Array and Sort
          return Array.from(daysMap.entries())
              .map(([name, revenue]) => ({ name, revenue }))
              .sort((a, b) => {
                  // Assuming LocaleDateString might vary, converting back to time for sort is safer if format is consistent. 
                  // For simplicity, we trust the insertion order or simple string comparison if format is ISO-like. 
                  // But standard locale string varies. Let's do a simple reverse sort if it came from the pre-fill loop, 
                  // or sort by date object.
                  return new Date(a.name).getTime() - new Date(b.name).getTime();
              });
      }
  }, [filteredOrders, activeFilter]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
      <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
              <div className={`p-2 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
                  <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
              </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">{value}</h3>
      </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Welcome back, {restaurant.name}</p>
            </div>
            
            {/* Time Filters */}
            <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap gap-1">
                {(['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'All Time'] as TimeRange[]).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            activeFilter === filter 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group transition-colors">
                 <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                     <DollarSign className="w-24 h-24 text-green-600 dark:text-green-400" />
                 </div>
                 <div className="relative z-10">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Est. Net Income</p>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">₹{metrics.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-1 bg-green-50 dark:bg-green-900/30 inline-block px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/50">90% of Dish Value</p>
                 </div>
            </div>

            <StatCard title="Total Orders" value={metrics.count} icon={ShoppingBag} color="bg-blue-600" />
            <StatCard title="Live Pending" value={metrics.pending} icon={Clock} color="bg-orange-600" />
            <StatCard title="Rating" value={metrics.rating.toFixed(1)} icon={Star} color="bg-yellow-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" /> Income Trend
                    </h3>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {activeFilter}
                    </span>
                </div>
                <div className="h-56 md:h-64 w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} interval={activeFilter === 'Today' ? 2 : 'preserveStartEnd'} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} tickFormatter={v => `₹${v.toFixed(0)}`}/>
                                <Tooltip 
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg, #fff)'}} 
                                    itemStyle={{color: '#9333ea'}}
                                    formatter={(value: number) => [`₹${value.toFixed(0)}`, 'Net Income']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#9333ea" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Calendar className="w-8 h-8 mb-2 opacity-50"/>
                            <p className="text-sm">No data available for this period</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {allOrders.sort((a,b) => b.createdAt - a.createdAt).slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                            <div>
                                <p className="font-bold text-xs md:text-sm text-gray-800 dark:text-gray-200">#{order.id ? order.id.slice(-6) : 'ID'}</p>
                                <p className="text-[10px] md:text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${order.status === 'DELIVERED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                {order.status}
                            </span>
                        </div>
                    ))}
                    {allOrders.length === 0 && <p className="text-sm text-gray-400 text-center">No recent activity.</p>}
                </div>
            </div>
        </div>
    </div>
  );
};