import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { OrdersPage } from './pages/Orders';
import { MenuPage } from './pages/Menu';
import { Profile } from './pages/Profile';
import { Restaurant } from './types';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
          // Listen for Restaurant Data
          const ref = db.ref(`restaurants/${u.uid}`);
          ref.on('value', snap => {
              if (snap.exists()) {
                  setRestaurant({ ...snap.val(), id: u.uid });
              }
              setLoading(false);
          });
      } else {
          setRestaurant(null);
          setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-orange-600 font-bold">Loading OrderEat Partner...</div>;

  if (!user || !restaurant) return <Auth />;

  const renderContent = () => {
      switch(activeTab) {
          case 'dashboard': return <Dashboard restaurant={restaurant} />;
          case 'orders': return <OrdersPage restaurantId={restaurant.id} />;
          case 'menu': return <MenuPage restaurant={restaurant} />;
          case 'profile': return <Profile restaurant={restaurant} />;
          default: return <Dashboard restaurant={restaurant} />;
      }
  };

  return (
    <Layout restaurant={restaurant} activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
    </Layout>
  );
}