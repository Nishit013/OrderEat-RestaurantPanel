import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Order, OrderStatus, Restaurant, AdminSettings } from '../types';
import { DollarSign, Percent, TrendingUp, Calendar, Filter, ArrowUpRight, ArrowDownRight, Download, Bike, Wallet, CreditCard, Banknote } from 'lucide-react';

interface FinancialMetrics {
  totalIncludingGST: number; // GMV
  totalExcludingGST: number; // Base Food Value
  totalGST: number;
  totalCommission: number;
  totalDeliveryFees: number;
  totalRestaurantPayable: number; // Final Payout to Restaurant
  totalCashRevenue: number;
  totalOnlineRevenue: number;
}

interface RestaurantAnalytics extends FinancialMetrics {
  id: string;
  name: string;
  orderCount: number;
}

interface PartnerAnalytics {
    id: string;
    name: string;
    deliveriesCount: number;
    totalFees: number;
}

export const Analytics: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('all');
  
  // Data States
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({ taxRate: 5, platformCommission: 20, deliveryBaseFee: 40, deliveryPerKm: 10 });
  
  // Metrics States
  const [globalMetrics, setGlobalMetrics] = useState<FinancialMetrics>({
    totalIncludingGST: 0,
    totalExcludingGST: 0,
    totalGST: 0,
    totalCommission: 0,
    totalDeliveryFees: 0,
    totalRestaurantPayable: 0,
    totalCashRevenue: 0,
    totalOnlineRevenue: 0
  });
  const [restaurantBreakdown, setRestaurantBreakdown] = useState<RestaurantAnalytics[]>([]);
  const [partnerBreakdown, setPartnerBreakdown] = useState<PartnerAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Real-time Listeners
  useEffect(() => {
    setLoading(true);
    const ordersRef = db.ref('orders');
    const restRef = db.ref('restaurants');
    const settingsRef = db.ref('adminSettings');

    const handleOrders = (snap: any) => {
        if (snap.exists()) setRawOrders(Object.values(snap.val()) as Order[]);
        else setRawOrders([]);
    };

    const handleRestaurants = (snap: any) => {
        if (snap.exists()) setRestaurants(Object.values(snap.val()));
        else setRestaurants([]);
    };

    const handleSettings = (snap: any) => {
        if (snap.exists()) setSettings(snap.val());
    };

    ordersRef.on('value', handleOrders);
    restRef.on('value', handleRestaurants);
    settingsRef.on('value', handleSettings);

    return () => {
        ordersRef.off();
        restRef.off();
        settingsRef.off();
    };
  }, []);

  // 2. Calculation Logic
  useEffect(() => {
    calculateMetrics();
  }, [rawOrders, restaurants, settings, dateFilter]);

  const calculateMetrics = () => {
    // A. Filter Orders
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
    const yesterdayStart = new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0,0,0,0);
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7)).getTime();
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).getTime();

    const filteredOrders = rawOrders.filter(o => {
        if (o.status === OrderStatus.CANCELLED) return false;
        
        if (dateFilter === 'today') return o.createdAt >= todayStart;
        if (dateFilter === 'yesterday') return o.createdAt >= yesterdayStart && o.createdAt < todayStart;
        if (dateFilter === '7days') return o.createdAt >= sevenDaysAgo;
        if (dateFilter === '30days') return o.createdAt >= thirtyDaysAgo;
        return true;
    });

    // B. Initialize Maps
    const breakdownMap: Record<string, RestaurantAnalytics> = {};
    const partnerMap: Record<string, PartnerAnalytics> = {};
    
    restaurants.forEach((r: any) => {
        breakdownMap[r.id] = {
            id: r.id,
            name: r.name,
            orderCount: 0,
            totalIncludingGST: 0,
            totalExcludingGST: 0,
            totalGST: 0,
            totalCommission: 0,
            totalDeliveryFees: 0,
            totalRestaurantPayable: 0,
            totalCashRevenue: 0,
            totalOnlineRevenue: 0
        };
    });

    // C. Process each order
    let gTotal = 0;
    let gExcl = 0;
    let gTax = 0;
    let gComm = 0;
    let gDel = 0;
    let gPayable = 0;
    let gCash = 0;
    let gOnline = 0;

    filteredOrders.forEach(order => {
        const restId = order.restaurantId;
        const rest = restaurants.find(r => r.id === restId);
        
        // 1. Determine Settings
        const taxRate = rest?.customTaxRate ?? settings.taxRate ?? 5;
        const commRate = rest?.commissionRate ?? settings.platformCommission ?? 20;
        const deliveryFee = rest?.customDeliveryFee ?? settings.deliveryBaseFee ?? 40;

        const totalAmount = order.totalAmount || 0; // Gross Revenue

        // Payment Method Split
        if (order.paymentMethod === 'ONLINE') {
            gOnline += totalAmount;
        } else {
            gCash += totalAmount;
        }
        
        // 2. Math Logic
        // Formula: Food + GST = Total - Delivery
        const foodPortionWithTax = Math.max(0, totalAmount - deliveryFee);
        
        // Base Food Value = (Food+GST) / (1 + Tax%)
        const baseAmount = foodPortionWithTax / (1 + (taxRate / 100));
        
        const taxAmount = foodPortionWithTax - baseAmount;
        
        // Commission is charged on Net Sales (Base Food Value)
        const commission = baseAmount * (commRate / 100);

        // Payable Amount = Gross - Delivery - GST - Commission
        // Which mathematically equals: BaseAmount - Commission
        const restaurantPayable = baseAmount - commission;

        // Accumulate Global
        gTotal += totalAmount;
        gExcl += baseAmount;
        gTax += taxAmount;
        gComm += commission;
        gDel += deliveryFee;
        gPayable += restaurantPayable;

        // Accumulate Restaurant Specific
        if (!breakdownMap[restId]) {
             breakdownMap[restId] = {
                id: restId,
                name: order.restaurantName || 'Unknown',
                orderCount: 0,
                totalIncludingGST: 0,
                totalExcludingGST: 0,
                totalGST: 0,
                totalCommission: 0,
                totalDeliveryFees: 0,
                totalRestaurantPayable: 0,
                totalCashRevenue: 0,
                totalOnlineRevenue: 0
            };
        }
        
        breakdownMap[restId].orderCount += 1;
        breakdownMap[restId].totalIncludingGST += totalAmount;
        breakdownMap[restId].totalExcludingGST += baseAmount;
        breakdownMap[restId].totalGST += taxAmount;
        breakdownMap[restId].totalCommission += commission;
        breakdownMap[restId].totalDeliveryFees += deliveryFee;
        breakdownMap[restId].totalRestaurantPayable += restaurantPayable;

        // Accumulate Partner Specific
        if (order.deliveryPartner) {
            const pId = order.deliveryPartner.id;
            const pName = order.deliveryPartner.name;
            
            if (!partnerMap[pId]) {
                partnerMap[pId] = { id: pId, name: pName, deliveriesCount: 0, totalFees: 0 };
            }
            partnerMap[pId].deliveriesCount += 1;
            partnerMap[pId].totalFees += deliveryFee;
        }
    });

    setGlobalMetrics({
        totalIncludingGST: gTotal,
        totalExcludingGST: gExcl,
        totalGST: gTax,
        totalCommission: gComm,
        totalDeliveryFees: gDel,
        totalRestaurantPayable: gPayable,
        totalCashRevenue: gCash,
        totalOnlineRevenue: gOnline
    });

    setRestaurantBreakdown(Object.values(breakdownMap).filter(r => r.orderCount > 0));
    setPartnerBreakdown(Object.values(partnerMap));
    setLoading(false);
  };

  const StatCard = ({ title, value, sub, color, icon: Icon }: any) => (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">₹{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
              </div>
              <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                  <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
              </div>
          </div>
          {sub && <p className="text-xs text-gray-400 font-medium">{sub}</p>}
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Financial Analytics <TrendingUp className="w-6 h-6 text-purple-600"/>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Detailed revenue breakdown including Taxes, Commissions & Delivery Fees</p>
            </div>
            
            <div className="flex items-center gap-3">
                 <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl flex text-sm font-medium shadow-sm">
                    {[
                        { id: 'today', label: 'Today' },
                        { id: '7days', label: '7 Days' },
                        { id: '30days', label: '30 Days' },
                        { id: 'all', label: 'All Time' },
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setDateFilter(opt.id as any)}
                            className={`px-3 py-1.5 rounded-lg transition-all text-xs ${dateFilter === opt.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <button className="p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl shadow-lg hover:opacity-90 transition" title="Export CSV">
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard 
                title="Gross Revenue" 
                value={globalMetrics.totalIncludingGST} 
                sub="Total Paid by Customers"
                color="bg-blue-500 text-blue-600"
                icon={DollarSign}
            />
            <StatCard 
                title="Platform Earnings" 
                value={globalMetrics.totalCommission} 
                sub="Commission from Sales"
                color="bg-purple-500 text-purple-600"
                icon={Wallet}
            />
            <StatCard 
                title="Restaurant Payable" 
                value={globalMetrics.totalRestaurantPayable} 
                sub="Net Payout to Partners"
                color="bg-green-600 text-green-600"
                icon={TrendingUp}
            />
             <StatCard 
                title="GST Collected" 
                value={globalMetrics.totalGST} 
                sub="Payable to Govt"
                color="bg-orange-500 text-orange-600"
                icon={Percent}
            />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
                title="Online Revenue" 
                value={globalMetrics.totalOnlineRevenue} 
                sub="Paid Online"
                color="bg-indigo-500 text-indigo-600"
                icon={CreditCard}
            />
             <StatCard 
                title="Cash Revenue" 
                value={globalMetrics.totalCashRevenue} 
                sub="Collected via COD/UPI"
                color="bg-emerald-500 text-emerald-600"
                icon={Banknote}
            />
             <StatCard 
                title="Delivery Fees" 
                value={globalMetrics.totalDeliveryFees} 
                sub="Collected from Customers"
                color="bg-teal-500 text-teal-600"
                icon={Bike}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Restaurant Performance */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white">Restaurant Financials</h3>
                    <span className="text-xs font-bold text-gray-500 uppercase">Settlement Breakdown</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Restaurant</th>
                                <th className="p-4 text-center">Orders</th>
                                <th className="p-4 text-right">Net Sales</th>
                                <th className="p-4 text-right text-orange-600">GST</th>
                                <th className="p-4 text-right text-purple-600">Comm.</th>
                                <th className="p-4 text-right text-green-600">Payable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Crunching numbers...</td></tr>
                            ) : restaurantBreakdown.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No data for selected period.</td></tr>
                            ) : (
                                restaurantBreakdown
                                    .sort((a,b) => b.totalRestaurantPayable - a.totalRestaurantPayable)
                                    .map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="p-4 font-bold text-gray-800 dark:text-white">{r.name}</td>
                                        <td className="p-4 text-center text-gray-500">{r.orderCount}</td>
                                        <td className="p-4 text-right font-medium text-gray-600 dark:text-gray-400" title="Base Food Value">₹{r.totalExcludingGST.toFixed(0)}</td>
                                        <td className="p-4 text-right font-bold text-orange-600 dark:text-orange-400">₹{r.totalGST.toFixed(0)}</td>
                                        <td className="p-4 text-right font-bold text-purple-600 dark:text-purple-400">₹{r.totalCommission.toFixed(0)}</td>
                                        <td className="p-4 text-right font-black text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/10">₹{r.totalRestaurantPayable.toFixed(0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delivery Partner Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                     <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Bike className="w-5 h-5 text-teal-600" /> Delivery Fleet
                     </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Partner</th>
                                <th className="p-4 text-center">Runs</th>
                                <th className="p-4 text-right">Fee Generated</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {partnerBreakdown.length === 0 ? (
                                <tr><td colSpan={3} className="p-8 text-center text-gray-400">No active partner data.</td></tr>
                            ) : (
                                partnerBreakdown.sort((a,b) => b.totalFees - a.totalFees).map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="p-4 font-bold text-gray-800 dark:text-white">{p.name}</td>
                                        <td className="p-4 text-center text-gray-500">{p.deliveriesCount}</td>
                                        <td className="p-4 text-right font-bold text-teal-600 dark:text-teal-400">₹{p.totalFees.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                         </tbody>
                         <tfoot className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 font-bold text-xs">
                             <tr>
                                 <td className="p-4 text-gray-500 uppercase">Total</td>
                                 <td className="p-4 text-center">{partnerBreakdown.reduce((acc, p) => acc + p.deliveriesCount, 0)}</td>
                                 <td className="p-4 text-right text-teal-600 dark:text-teal-400">₹{partnerBreakdown.reduce((acc, p) => acc + p.totalFees, 0).toLocaleString()}</td>
                             </tr>
                         </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};