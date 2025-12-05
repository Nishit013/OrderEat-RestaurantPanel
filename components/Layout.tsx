import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, LogOut, Power, MapPin, Moon, Sun, Menu, X, Bell } from 'lucide-react';
import { auth, db } from '../firebase';
import { Restaurant } from '../types';

interface LayoutProps {
  restaurant: Restaurant;
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ restaurant, children, activeTab, onTabChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Real-time Order Notifications ---
  useEffect(() => {
    // 1. Request Browser Notification Permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Sound effect for new orders
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/933/933-preview.mp3");

    const ordersRef = db.ref('orders');
    // Track IDs we have already seen or alerted for to prevent duplicates
    const processedOrders = new Set<string>();
    let isInitialLoad = true;

    const listener = ordersRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            isInitialLoad = false;
            return;
        }

        const data = snapshot.val();
        
        Object.keys(data).forEach((orderId) => {
            const order = data[orderId];
            
            // Client-side Filter: Match Restaurant ID and Status 'PLACED'
            if (order.restaurantId === restaurant.id && order.status === 'PLACED') {
                if (!processedOrders.has(orderId)) {
                    // If this is NOT the initial data load, it means a NEW order just arrived
                    if (!isInitialLoad) {
                        console.log("New Order Detected:", orderId);
                        
                        // A. Play Sound
                        audio.play().catch(e => console.warn("Audio play blocked by browser policy:", e));
                        
                        // B. Show Browser Notification
                        if (Notification.permission === 'granted') {
                            new Notification('New Order Received! 🔔', {
                                body: `Order #${orderId.slice(-6)} • ₹${order.totalAmount}`,
                                icon: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', // Food Icon
                                tag: orderId // Prevent duplicate notifications for same ID
                            });
                        }
                    }
                    // Add to processed set
                    processedOrders.add(orderId);
                }
            }
        });
        
        // After first run, disable initial load flag so future updates trigger alerts
        isInitialLoad = false;
    });

    // Cleanup listener on unmount
    return () => ordersRef.off('value', listener);
  }, [restaurant.id]);

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleOnline = async () => {
      await db.ref(`restaurants/${restaurant.id}`).update({
          isOnline: !restaurant.isOnline
      });
  };

  const menuItems = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'orders', label: 'Live Orders', icon: ShoppingBag },
      { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
      { id: 'profile', label: 'Restaurant Profile', icon: Settings },
  ];

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row font-sans transition-colors duration-300 overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shrink-0 z-30">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pr-2 py-1">OrderEat</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
                <Menu className="w-6 h-6" />
            </button>
        </div>

        {/* Sidebar Overlay (Mobile) */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        {/* Sidebar */}
        <aside className={`
            fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
            flex flex-col h-full transition-transform duration-300 transform 
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xl md:shadow-none
        `}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                        {restaurant.imageUrl ? <img src={restaurant.imageUrl} className="w-full h-full object-cover"/> : <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{restaurant.name[0]}</span>}
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-gray-800 dark:text-white truncate text-sm">{restaurant.name}</h2>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            <MapPin className="w-3 h-3" /> {restaurant.address ? restaurant.address.split(',')[0] : 'No Address'}
                        </div>
                    </div>
                </div>
                {/* Close Button Mobile */}
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className={`p-4 rounded-xl border mb-6 flex flex-col gap-3 transition-colors ${restaurant.isOnline ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'}`}>
                    <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold uppercase tracking-wider ${restaurant.isOnline ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {restaurant.isOnline ? 'Online' : 'Offline'}
                        </span>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${restaurant.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <button 
                        onClick={toggleOnline}
                        className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${restaurant.isOnline ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'}`}
                    >
                        <Power className="w-3 h-3" /> {restaurant.isOnline ? 'Go Offline' : 'Go Live'}
                    </button>
                </div>

                <nav className="space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { onTabChange(item.id); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === item.id ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 mt-auto bg-white dark:bg-gray-800 shrink-0">
                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button 
                    onClick={() => auth.signOut()}
                    className="w-full flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 rounded-xl transition text-sm font-bold"
                >
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full relative scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {children}
        </main>
    </div>
  );
};