import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { ChefHat, Mail, Lock, User, ArrowRight, Store } from 'lucide-react';
import { Restaurant } from '../types';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Restaurant Name for Signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        if (isLogin) {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            const userCred = await auth.createUserWithEmailAndPassword(email, password);
            if (userCred.user) {
                // Initialize Restaurant Node
                const newRestaurant: Partial<Restaurant> = {
                    id: userCred.user.uid,
                    name: name,
                    email: email,
                    phone: '',
                    address: '',
                    cuisine: [],
                    rating: 4.0, // Default start rating
                    deliveryTime: '30-40 min',
                    priceForTwo: 300,
                    imageUrl: '',
                    isApproved: false,
                    isOnline: false,
                    menu: {},
                };
                await db.ref(`restaurants/${userCred.user.uid}`).set(newRestaurant);
            }
        }
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 dark:bg-black p-4 font-sans">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            
            {/* Left Side: Branding (Top on Mobile) */}
            <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10"></div>
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 md:mb-6 border border-white/30">
                        <ChefHat className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-1 md:mb-2">OrderEat</h1>
                    <p className="text-blue-100 font-medium tracking-widest text-[10px] md:text-xs uppercase">Restaurant Partner Dashboard</p>
                </div>
                <div className="relative z-10 hidden md:block">
                    <h2 className="text-2xl font-bold mb-4">Grow your business with us.</h2>
                    <p className="text-blue-100/80 text-sm leading-relaxed">
                        Manage orders, update menus in real-time, and track your revenue all in one place. Join thousands of top restaurants today.
                    </p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="md:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-white dark:bg-gray-900 flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2">{isLogin ? 'Partner Login' : 'Register Restaurant'}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 md:mb-8">
                    {isLogin ? 'Welcome back! Please enter your details.' : 'Enter your restaurant details to get started.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Restaurant Name</label>
                            <div className="relative">
                                <Store className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none transition text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm"
                                    placeholder="e.g. Spicy Tandoor"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="email" 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none transition text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm"
                                placeholder="partner@restaurant.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="password" 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none transition text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-sm rounded-lg font-medium border border-red-100 dark:border-red-900/30">{error}</div>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 md:py-3.5 rounded-xl transition shadow-lg shadow-purple-200 dark:shadow-purple-900/50 flex items-center justify-center gap-2 group text-sm md:text-base"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login to Dashboard' : 'Create Account')}
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />}
                    </button>
                </form>

                <div className="mt-6 md:mt-8 text-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
                    <button 
                        onClick={() => setIsLogin(!isLogin)} 
                        className="font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:underline"
                    >
                        {isLogin ? 'Register Now' : 'Login Here'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};