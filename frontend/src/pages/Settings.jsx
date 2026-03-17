import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Moon, Sun, User, Bell, CreditCard, Shield, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useThemeStore } from '../hooks/useTheme'
import { useAuthStore } from '../hooks/useAuth'
import { billingApi } from '../utils/api'
import { PageLoader } from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import clsx from 'clsx'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['5 training jobs/month', '100MB storage', 'Basic models', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    features: ['50 training jobs/month', '5GB storage', 'All algorithms', 'Priority support', 'API access'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    features: ['Unlimited training', '50GB storage', 'Custom models', 'Dedicated support', 'SLA guarantee'],
  },
]

export default function Settings() {
  const { theme, setTheme } = useThemeStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('account')
  
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.subscription(),
  })
  
  const subscription = subscriptionData?.data
  
  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-dark-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-200 dark:border-dark-700">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-dark-500 hover:text-dark-900 dark:hover:text-dark-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
      
      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.full_name || ''}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  className="input"
                  disabled
                />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input max-w-md" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input max-w-md" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input max-w-md" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      )}
      
      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold">Theme</h2>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {['light', 'dark', 'system'].map((t) => (
              <label
                key={t}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors",
                  theme === t
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                    : "border-dark-200 dark:border-dark-700 hover:border-primary-300"
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={(e) => setTheme(e.target.value)}
                  className="sr-only"
                />
                {t === 'light' && <Sun className="w-6 h-6" />}
                {t === 'dark' && <Moon className="w-6 h-6" />}
                {t === 'system' && (
                  <div className="flex">
                    <Sun className="w-4 h-4" />
                    <Moon className="w-4 h-4" />
                  </div>
                )}
                <span className="text-sm capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
            {subscriptionLoading ? (
              <div className="animate-pulse h-20 bg-dark-100 dark:bg-dark-800 rounded-lg" />
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary-50 dark:bg-primary-950">
                <div>
                  <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                    {subscription?.tier?.toUpperCase() || 'FREE'}
                  </p>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    {subscription?.training_jobs_used || 0} / {subscription?.is_unlimited ? '∞' : subscription?.training_jobs_limit || 5} training jobs used
                  </p>
                </div>
                {subscription?.end_date && (
                  <div className="text-right">
                    <p className="text-sm text-dark-500">Next billing date</p>
                    <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Available Plans */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={clsx(
                    "p-6 rounded-lg border",
                    subscription?.tier === plan.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                      : "border-dark-200 dark:border-dark-700"
                  )}
                >
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-3xl font-bold mt-2">
                    ${plan.price}<span className="text-sm font-normal text-dark-500">/month</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={clsx(
                      "w-full mt-4",
                      subscription?.tier === plan.id
                        ? "btn-secondary"
                        : "btn-primary"
                    )}
                    disabled={subscription?.tier === plan.id}
                  >
                    {subscription?.tier === plan.id ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold">Email Notifications</h2>
          <div className="space-y-4">
            {[
              { id: 'training_complete', label: 'Training Complete', desc: 'Get notified when model training finishes' },
              { id: 'training_failed', label: 'Training Failed', desc: 'Get notified if training fails' },
              { id: 'weekly_summary', label: 'Weekly Summary', desc: 'Receive weekly usage summary' },
              { id: 'product_updates', label: 'Product Updates', desc: 'News about new features and improvements' },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-dark-200 dark:border-dark-700 cursor-pointer hover:border-primary-300"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-dark-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={item.id !== 'product_updates'}
                  className="rounded"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
