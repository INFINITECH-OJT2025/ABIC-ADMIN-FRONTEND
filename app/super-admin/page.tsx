'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, LogOut, Plus, Users, Trash2, Edit2, Phone, Mail, LogIn, X, Menu, ChevronLeft, ChevronDown, Moon, Sun, Shield, Building2, UserCircle, Landmark, Settings, Archive, RotateCcw, Search, Eye, MoreVertical } from 'lucide-react'
import Logo from '@/components/logo'

interface Accountant {
  id: number
  name: string
  email: string
  phone: string
  role: string
}

interface OwnerAccount {
  id: number
  accountName: string
  accountNumber: string
  bankDetails: string
}

interface BankAccount {
  id: number
  name: string
  bank: 'normal' | 'PMO'
  accountName: string
  accountNumber: string
  phoneNumber?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [accountants, setAccountants] = useState<Accountant[]>([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '+1 (555) 123-4567', role: 'accountant' },
    { id: 2, name: 'Sarah Smith', email: 'sarah.smith@example.com', phone: '+1 (555) 234-5678', role: 'accountant' },
    { id: 3, name: 'Michael Johnson', email: 'michael.j@example.com', phone: '+1 (555) 345-6789', role: 'accountant' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteAccountantConfirm, setShowDeleteAccountantConfirm] = useState(false)
  const [showDeleteOwnerConfirm, setShowDeleteOwnerConfirm] = useState(false)
  const [showDeleteBankConfirm, setShowDeleteBankConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [currentPage, setCurrentPage] = useState<'accountants' | 'assign-roles' | 'owner-accounts' | 'bank-accounts' | 'archive'>('accountants')
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccountantId, setSelectedAccountantId] = useState<number | null>(null)
  const [bankAccess, setBankAccess] = useState<{ [accountantId: number]: number[] }>({
    1: [1, 2],
    2: [1, 3, 4],
    3: [2, 4],
  })
  const [ownerAccounts, setOwnerAccounts] = useState<OwnerAccount[]>([
    { id: 1, accountName: 'Main Owner Account', accountNumber: '1234567890', bankDetails: 'Bank of America' },
  ])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { id: 1, name: 'Operations Account', bank: 'normal', accountName: 'Company Operations', accountNumber: '9876543210' },
    { id: 2, name: 'PMO Account', bank: 'PMO', accountName: 'PMO Finance', accountNumber: '5555444433', phoneNumber: '+1 (555) 999-8888' },
  ])
  const [showOwnerForm, setShowOwnerForm] = useState(false)
  const [showBankForm, setShowBankForm] = useState(false)
  const [ownerFormData, setOwnerFormData] = useState({ accountName: '', accountNumber: '', bankDetails: '' })
  const [bankFormData, setBankFormData] = useState({ name: '', bank: 'normal' as 'normal' | 'PMO', accountName: '', accountNumber: '', phoneNumber: '' })
  const [archivedAccountants, setArchivedAccountants] = useState<Accountant[]>([])
  const [archivedOwnerAccounts, setArchivedOwnerAccounts] = useState<OwnerAccount[]>([])
  const [archivedBankAccounts, setArchivedBankAccounts] = useState<BankAccount[]>([])
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null)
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState<number | null>(null)
  const [bankDropdownOpen, setBankDropdownOpen] = useState<number | null>(null)

  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (res.ok && data.success) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [router])

  // Clear search when changing pages
  useEffect(() => {
    setSearchQuery('')
  }, [currentPage])

  const handleAddAccountant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.phone) {
      setError('All fields are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/accountants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'accountant' }),
      })
      const data = await res.json()
      if (res.ok) {
        if (editingId) {
          setAccountants(accountants.map(acc => acc.id === editingId ? { ...formData, id: editingId, role: 'accountant' } : acc))
          setEditingId(null)
        } else {
          const newAccountant: Accountant = { 
            id: Math.max(...accountants.map(a => a.id), 0) + 1, 
            ...formData,
            role: 'accountant'
          }
          setAccountants([...accountants, newAccountant])
        }
        setFormData({ name: '', email: '', phone: '' })
        setShowAddForm(false)
        setError('')
      } else {
        setError(data.message || 'Failed to add accountant')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAccountant = (accountant: Accountant) => {
    setFormData({ name: accountant.name, email: accountant.email, phone: accountant.phone })
    setEditingId(accountant.id)
    setShowAddForm(true)
  }

  const handleDeleteAccountant = (id: number) => {
    const accountant = accountants.find(acc => acc.id === id)
    if (accountant) {
      setArchivedAccountants([...archivedAccountants, accountant])
      setAccountants(accountants.filter(acc => acc.id !== id))
      setShowDeleteAccountantConfirm(false)
      setDeleteTargetId(null)
    }
  }

  const handleDeleteOwnerAccount = (id: number) => {
    const account = ownerAccounts.find(acc => acc.id === id)
    if (account) {
      setArchivedOwnerAccounts([...archivedOwnerAccounts, account])
      setOwnerAccounts(ownerAccounts.filter(a => a.id !== id))
      setShowDeleteOwnerConfirm(false)
      setDeleteTargetId(null)
    }
  }

  const handleDeleteBankAccount = (id: number) => {
    const account = bankAccounts.find(acc => acc.id === id)
    if (account) {
      setArchivedBankAccounts([...archivedBankAccounts, account])
      setBankAccounts(bankAccounts.filter(a => a.id !== id))
      setShowDeleteBankConfirm(false)
      setDeleteTargetId(null)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Redirect anyway - frontend route clears cookies even if backend request fails.
    } finally {
      setShowLogoutConfirm(false)
      router.replace('/login')
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  const closeModal = () => {
    setShowAddForm(false)
    setFormData({ name: '', email: '', phone: '' })
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center overflow-hidden">
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          .animate-spin-custom {
            animation: spin 1s linear infinite;
          }
          .animate-pulse-glow {
            animation: pulse-glow 3s ease-in-out infinite;
          }
        `}</style>
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 border-4 border-[#FF6B6B] border-t-transparent border-r-transparent rounded-full animate-spin-custom"></div>
          <p className="text-gray-300 font-medium text-lg">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-red-50 via-white to-red-100'
    }`}>
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0px); }
          50% { transform: translate(-30px, -30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0px); }
          50% { transform: translate(30px, -40px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0px); }
          50% { transform: translate(-40px, 30px); }
        }
        .orb-1 { animation: float1 20s ease-in-out infinite; }
        .orb-2 { animation: float2 25s ease-in-out infinite; }
        .orb-3 { animation: float3 30s ease-in-out infinite; }
        .glass-effect {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 107, 107, 0.1);
        }
        .glass-effect-dark {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 107, 107, 0.2);
        }
        .gradient-text {
          background: linear-gradient(135deg, #FF6B6B, #FF8A80);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 107, 107, 0.5);
        }
        .sidebar-transition {
          transition: transform 0.3s ease-in-out, width 0.3s ease-in-out;
        }
      `}</style>

      {/* Animated Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`orb-1 absolute top-20 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl transition-all duration-300 ${
          darkMode ? 'bg-red-600 opacity-20' : 'bg-red-900 opacity-15'
        }`}></div>
        <div className={`orb-2 absolute -bottom-20 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl transition-all duration-300 ${
          darkMode ? 'bg-red-900 opacity-20' : 'bg-red-800 opacity-15'
        }`}></div>
        <div className={`orb-3 absolute top-1/2 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl transition-all duration-300 ${
          darkMode ? 'bg-gray-700 opacity-10' : 'bg-red-950 opacity-10'
        }`}></div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 sidebar-transition ${
          sidebarOpen ? 'w-80' : 'w-0'
        } overflow-hidden`}
      >
        <div className={`h-full border-r flex flex-col transition-colors ${
          darkMode 
            ? 'glass-effect-dark border-[#FF6B6B]/20' 
            : 'bg-white border-red-200 shadow-xl'
        }`}>
          {/* Sidebar Header */}
          <div className={`p-6 border-b transition-colors ${
            darkMode ? 'border-[#FF6B6B]/20' : 'border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B6B] to-[#FF8A80] rounded-lg flex items-center justify-center">
                  <Logo animated={false} className="w-6 h-6" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors ${darkMode ? 'text-white' : 'text-red-950'}`}>Super Admin</h1>
                  {user && (
                    <p className={`text-xs transition-colors ${darkMode ? 'text-gray-400' : 'text-red-800'}`}>{user.email}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`cursor-pointer transition-colors p-2 hover:bg-[#FF6B6B]/10 rounded-lg ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-red-900 hover:text-red-950'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            
            {/* Dark/Light Mode Toggle */}
            <div className="mb-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  darkMode
                    ? 'bg-[#FF6B6B]/10 text-[#FF8A80] hover:bg-[#FF6B6B]/20'
                    : 'bg-red-900 text-red-50 hover:bg-red-800'
                }`}
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className={`p-4 border-b transition-colors ${
            darkMode ? 'border-[#FF6B6B]/20' : 'border-red-200'
          }`}>
            <nav className="space-y-2">
              <button
                onClick={() => setCurrentPage('accountants')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  currentPage === 'accountants'
                    ? darkMode
                      ? 'bg-[#FF6B6B]/20 text-[#FF8A80]'
                      : 'bg-red-900 text-red-50'
                    : darkMode
                      ? 'text-gray-400 hover:bg-[#FF6B6B]/10 hover:text-[#FF8A80]'
                      : 'text-red-900 hover:bg-red-100 hover:text-red-950'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Accountants</span>
              </button>
              <button
                onClick={() => setCurrentPage('assign-roles')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  currentPage === 'assign-roles'
                    ? darkMode
                      ? 'bg-[#FF6B6B]/20 text-[#FF8A80]'
                      : 'bg-red-900 text-red-50'
                    : darkMode
                      ? 'text-gray-400 hover:bg-[#FF6B6B]/10 hover:text-[#FF8A80]'
                      : 'text-red-900 hover:bg-red-100 hover:text-red-950'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Assign Roles</span>
              </button>
              <button
                onClick={() => setCurrentPage('owner-accounts')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  currentPage === 'owner-accounts'
                    ? darkMode
                      ? 'bg-[#FF6B6B]/20 text-[#FF8A80]'
                      : 'bg-red-900 text-red-50'
                    : darkMode
                      ? 'text-gray-400 hover:bg-[#FF6B6B]/10 hover:text-[#FF8A80]'
                      : 'text-red-900 hover:bg-red-100 hover:text-red-950'
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span>Owner Accounts</span>
              </button>
              <button
                onClick={() => setCurrentPage('bank-accounts')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  currentPage === 'bank-accounts'
                    ? darkMode
                      ? 'bg-[#FF6B6B]/20 text-[#FF8A80]'
                      : 'bg-red-900 text-red-50'
                    : darkMode
                      ? 'text-gray-400 hover:bg-[#FF6B6B]/10 hover:text-[#FF8A80]'
                      : 'text-red-900 hover:bg-red-100 hover:text-red-950'
                }`}
              >
                <Landmark className="w-5 h-5" />
                <span>Bank Accounts</span>
              </button>
              <div
                className="relative"
                onMouseEnter={() => setShowSettingsDropdown(true)}
                onMouseLeave={() => setShowSettingsDropdown(false)}
              >
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    currentPage === 'archive'
                      ? darkMode
                        ? 'bg-[#FF6B6B]/20 text-[#FF8A80]'
                        : 'bg-red-900 text-red-50'
                      : darkMode
                        ? 'text-gray-400 hover:bg-[#FF6B6B]/10 hover:text-[#FF8A80]'
                        : 'text-red-900 hover:bg-red-100 hover:text-red-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${
                    showSettingsDropdown ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {/* Dropdown Menu */}
                {showSettingsDropdown && (
                  <div className={`mt-2 ml-4 space-y-1 overflow-hidden transition-all ${
                    darkMode ? 'border-l border-[#FF6B6B]/20' : 'border-l border-red-200'
                  }`}>
                    <button
                      onClick={() => setCurrentPage('archive')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        currentPage === 'archive'
                          ? darkMode
                            ? 'bg-[#FF6B6B]/20 text-[#FF8A80]'
                            : 'bg-red-900 text-red-50'
                          : darkMode
                            ? 'text-gray-400 hover:bg-[#FF6B6B]/10 hover:text-[#FF8A80]'
                            : 'text-red-900 hover:bg-red-100 hover:text-red-950'
                      }`}
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 p-6 overflow-y-auto">
          </div>

          {/* Sidebar Footer */}
          <div className={`p-6 border-t transition-colors ${
            darkMode ? 'border-[#FF6B6B]/20' : 'border-red-200'
          }`}>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`cursor-pointer w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                darkMode
                  ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-900'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}

      {/* Toggle Button (when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={`cursor-pointer fixed top-6 left-6 z-50 p-3 rounded-xl shadow-2xl hover:scale-105 transition-all ${
            darkMode
              ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90'
              : 'bg-red-900 hover:bg-red-800 text-red-50'
          }`}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Main Content */}
      <main
        className={`relative z-20 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-80' : 'ml-0'
        }`}
      >
        <div className={`px-4 py-8 sm:px-6 lg:px-8 ${
          !sidebarOpen ? 'pt-24' : ''
        }`}>
        {/* Error Alert */}
        {error && (
          <div className={`mb-6 border-l-4 border-[#FF6B6B] rounded-lg p-4 flex gap-3 items-start animate-in transition-colors ${
            darkMode ? 'glass-effect-dark' : 'bg-white border border-red-100 shadow-md'
          }`}>
            <AlertCircle className="w-5 h-5 text-[#FF6B6B] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-[#FF8A80] font-semibold">Error</h3>
              <p className={`text-sm transition-colors ${
                darkMode ? 'text-gray-300' : 'text-red-900'
              }`}>{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Content */}
        {currentPage === 'accountants' ? (
          <>
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-3xl sm:text-4xl font-bold mb-2 transition-colors ${
                    darkMode ? 'gradient-text' : 'text-red-900'
                  }`}>Accountants</h2>
                  <p className={`transition-colors ${
                    darkMode ? 'text-gray-400' : 'text-red-900'
                  }`}>Manage your team members and their access</p>
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className={`cursor-pointer px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90 hover:shadow-red-500/20'
                      : 'bg-red-900 hover:bg-red-800 text-red-50'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Accountant</span>
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  darkMode ? 'text-gray-500' : 'text-red-400'
                }`} />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-10 transition-colors ${
                    darkMode
                      ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                      : 'bg-white border-red-200 text-red-950 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400/50'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                      darkMode
                        ? 'hover:bg-[#FF6B6B]/10 text-gray-500 hover:text-gray-300'
                        : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Accountants Grid */}
            <div>
          {accountants.filter(acc => 
            acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.phone.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
            <div className={`rounded-2xl p-12 border flex flex-col items-center justify-center transition-colors ${
              darkMode ? 'glass-effect-dark' : 'bg-white border-red-200 shadow-sm'
            }`}>
              <Users className={`w-16 h-16 mb-4 transition-colors ${
                darkMode ? 'text-gray-600' : 'text-red-300'
              }`} />
              <p className={`text-lg font-semibold transition-colors ${
                darkMode ? 'text-gray-300' : 'text-red-900'
              }`}>{searchQuery ? 'No accountants found' : 'No accountants yet'}</p>
              <p className={`text-sm mt-1 transition-colors ${
                darkMode ? 'text-gray-500' : 'text-red-800'
              }`}>{searchQuery ? 'Try adjusting your search terms' : 'Add your first accountant using the button above'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {accountants.filter(acc => 
                  acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.phone.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((acc) => (
                  <div
                    key={acc.id}
                    className={`rounded-2xl p-6 border card-hover group relative overflow-hidden transition-colors ${
                      darkMode ? 'glass-effect' : 'bg-white border-red-200 shadow-md hover:shadow-xl'
                    }`}
                    onMouseLeave={() => setDropdownOpen(null)}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/0 to-[#FF8A80]/0 group-hover:from-[#FF6B6B]/5 group-hover:to-[#FF8A80]/5 transition-all pointer-events-none"></div>

                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className={`text-lg font-bold transition-colors ${
                            darkMode ? 'text-white' : 'text-red-950'
                          }`}>{acc.name}</h4>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                            darkMode ? 'bg-[#FF6B6B]/20 text-[#FF8A80]' : 'bg-red-900/20 text-red-900'
                          }`}>
                            {acc.role}
                          </span>
                        </div>
                        
                        {/* 3-dot menu */}
                        <div className="relative">
                          <button
                            onMouseEnter={() => setDropdownOpen(acc.id)}
                            onClick={() => setDropdownOpen(dropdownOpen === acc.id ? null : acc.id)}
                            className={`cursor-pointer p-2 rounded-lg transition-all ${
                              darkMode
                                ? 'hover:bg-[#FF6B6B]/10 text-gray-400 hover:text-[#FF8A80]'
                                : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                            }`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {dropdownOpen === acc.id && (
                            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 ${
                              darkMode
                                ? 'bg-[#1E293B] border-[#FF6B6B]/20'
                                : 'bg-white border-red-200'
                            }`}>
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setDropdownOpen(null)
                                    // View functionality - you can implement this
                                    console.log('View accountant:', acc)
                                  }}
                                  className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                    darkMode
                                      ? 'hover:bg-[#FF6B6B]/10 text-gray-300 hover:text-white'
                                      : 'hover:bg-red-50 text-red-950 hover:text-red-900'
                                  }`}
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    setDropdownOpen(null)
                                    handleEditAccountant(acc)
                                  }}
                                  className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                    darkMode
                                      ? 'hover:bg-[#FF6B6B]/10 text-gray-300 hover:text-white'
                                      : 'hover:bg-red-50 text-red-950 hover:text-red-900'
                                  }`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setDropdownOpen(null)
                                    setDeleteTargetId(acc.id)
                                    setShowDeleteAccountantConfirm(true)
                                  }}
                                  className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                    darkMode
                                      ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300'
                                      : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-3 mb-4">
                        <div className={`flex items-center gap-3 transition-colors ${
                          darkMode ? 'text-gray-300' : 'text-red-950'
                        }`}>
                          <Mail className="w-4 h-4 text-[#FF6B6B] flex-shrink-0" />
                          <a href={`mailto:${acc.email}`} className="text-sm hover:text-[#FF8A80] transition-colors break-all">
                            {acc.email}
                          </a>
                        </div>
                        <div className={`flex items-center gap-3 transition-colors ${
                          darkMode ? 'text-gray-300' : 'text-red-950'
                        }`}>
                          <Phone className="w-4 h-4 text-[#FF6B6B] flex-shrink-0" />
                          <a href={`tel:${acc.phone}`} className="text-sm hover:text-[#FF8A80] transition-colors">
                            {acc.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
        ) : currentPage === 'assign-roles' ? (
          <>
            {/* Assign Roles Page */}
            <div className="mb-8">
              <div className="mb-6">
                <h2 className={`text-3xl sm:text-4xl font-bold mb-2 transition-colors ${
                  darkMode ? 'gradient-text' : 'text-red-900'
                }`}>Assign Bank Access</h2>
                <p className={`transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-red-900'
                }`}>Manage which banks each accountant can access</p>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-md mb-6">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  darkMode ? 'text-gray-500' : 'text-red-400'
                }`} />
                <Input
                  placeholder="Search accountants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-10 transition-colors ${
                    darkMode
                      ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                      : 'bg-white border-red-200 text-red-950 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400/50'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                      darkMode
                        ? 'hover:bg-[#FF6B6B]/10 text-gray-500 hover:text-gray-300'
                        : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Accountants List */}
              <div className={`rounded-2xl p-6 border transition-colors ${
                darkMode ? 'glass-effect-dark' : 'bg-white border-red-200 shadow-sm'
              }`}>
                <h3 className={`text-lg font-bold mb-4 transition-colors ${
                  darkMode ? 'text-white' : 'text-red-950'
                }`}>Select Accountant</h3>
                <div className="space-y-2">
                  {accountants.filter(acc => 
                    acc.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccountantId(acc.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedAccountantId === acc.id
                          ? darkMode
                            ? 'bg-[#FF6B6B]/20 text-[#FF8A80] border-2 border-[#FF6B6B]/50'
                            : 'bg-red-900 text-red-50 border-2 border-red-700'
                          : darkMode
                            ? 'bg-[#0F172A]/50 text-gray-300 hover:bg-[#0F172A]/80 border border-[#FF6B6B]/10'
                            : 'bg-red-50 text-red-900 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{acc.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Access */}
              <div className={`lg:col-span-2 rounded-2xl p-6 border transition-colors ${
                darkMode ? 'glass-effect-dark' : 'bg-white border-red-200 shadow-sm'
              }`}>
                {selectedAccountantId ? (
                  <>
                    <div className="mb-6">
                      <h3 className={`text-lg font-bold mb-2 transition-colors ${
                        darkMode ? 'text-white' : 'text-red-950'
                      }`}>
                        Bank Access for {accountants.find(a => a.id === selectedAccountantId)?.name}
                      </h3>
                      <p className={`text-sm transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-red-800'
                      }`}>Select which banks this accountant can access</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((bankId) => {
                        const hasAccess = bankAccess[selectedAccountantId]?.includes(bankId) || false
                        return (
                          <div
                            key={bankId}
                            onClick={() => {
                              const currentAccess = bankAccess[selectedAccountantId] || []
                              if (hasAccess) {
                                setBankAccess({
                                  ...bankAccess,
                                  [selectedAccountantId]: currentAccess.filter(id => id !== bankId)
                                })
                              } else {
                                setBankAccess({
                                  ...bankAccess,
                                  [selectedAccountantId]: [...currentAccess, bankId]
                                })
                              }
                            }}
                            className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${
                              hasAccess
                                ? darkMode
                                  ? 'bg-[#FF6B6B]/10 border-[#FF6B6B] hover:bg-[#FF6B6B]/20'
                                  : 'bg-red-100 border-red-800 hover:border-red-900'
                                : darkMode
                                  ? 'bg-[#0F172A]/30 border-[#FF6B6B]/20 hover:border-[#FF6B6B]/40'
                                  : 'bg-red-50 border-red-200 hover:border-red-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                hasAccess
                                  ? 'bg-[#FF6B6B] border-[#FF6B6B]'
                                  : darkMode
                                    ? 'border-gray-600'
                                    : 'border-slate-300'
                              }`}>
                                {hasAccess && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Building2 className="w-5 h-5 text-[#FF6B6B]" />
                                  <h4 className={`font-bold transition-colors ${
                                    darkMode ? 'text-white' : 'text-red-950'
                                  }`}>Bank {bankId}</h4>
                                </div>
                                <p className={`text-xs transition-colors ${
                                  darkMode ? 'text-gray-400' : 'text-red-800'
                                }`}>
                                  {hasAccess ? 'Access granted' : 'No access'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className={`mt-6 p-4 rounded-lg transition-colors ${
                      darkMode ? 'bg-[#0F172A]/50 border border-[#FF6B6B]/10' : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm transition-colors ${
                        darkMode ? 'text-gray-300' : 'text-red-900'
                      }`}>
                        <span className="font-bold text-[#FF8A80]">
                          {bankAccess[selectedAccountantId]?.length || 0}
                        </span> bank(s) accessible
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Shield className={`w-16 h-16 mb-4 transition-colors ${
                      darkMode ? 'text-gray-600' : 'text-red-300'
                    }`} />
                    <p className={`text-lg font-semibold transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-red-900'
                    }`}>Select an accountant</p>
                    <p className={`text-sm mt-1 transition-colors ${
                      darkMode ? 'text-gray-500' : 'text-red-800'
                    }`}>Choose an accountant to manage their bank access</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : currentPage === 'owner-accounts' ? (
          <>
            {/* Owner Accounts Page */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-3xl sm:text-4xl font-bold mb-2 transition-colors ${
                    darkMode ? 'gradient-text' : 'text-red-900'
                  }`}>Owner Accounts</h2>
                  <p className={`transition-colors ${
                    darkMode ? 'text-gray-400' : 'text-red-900'
                  }`}>Manage owner account information</p>
                </div>
                <button
                  onClick={() => setShowOwnerForm(true)}
                  className={`cursor-pointer px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90 hover:shadow-red-500/20'
                      : 'bg-red-900 hover:bg-red-800 text-red-50'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Owner Account</span>
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  darkMode ? 'text-gray-500' : 'text-red-400'
                }`} />
                <Input
                  placeholder="Search by account name or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-10 transition-colors ${
                    darkMode
                      ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                      : 'bg-white border-red-200 text-red-950 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400/50'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                      darkMode
                        ? 'hover:bg-[#FF6B6B]/10 text-gray-500 hover:text-gray-300'
                        : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {ownerAccounts.filter(account => 
                account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                account.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                account.bankDetails.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((account) => (
                <div
                  key={account.id}
                  className={`rounded-2xl p-6 border transition-colors ${
                    darkMode ? 'glass-effect' : 'bg-white border-gray-200 shadow-md'
                  }`}
                  onMouseLeave={() => setOwnerDropdownOpen(null)}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 bg-[#FF6B6B]/10 rounded-lg">
                      <UserCircle className="w-6 h-6 text-[#FF6B6B]" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg transition-colors ${
                        darkMode ? 'text-white' : 'text-red-950'
                      }`}>{account.accountName}</h3>
                    </div>
                    
                    {/* 3-dot menu */}
                    <div className="relative">
                      <button
                        onMouseEnter={() => setOwnerDropdownOpen(account.id)}
                        onClick={() => setOwnerDropdownOpen(ownerDropdownOpen === account.id ? null : account.id)}
                        className={`cursor-pointer p-2 rounded-lg transition-all ${
                          darkMode
                            ? 'hover:bg-[#FF6B6B]/10 text-gray-400 hover:text-[#FF8A80]'
                            : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                        }`}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {ownerDropdownOpen === account.id && (
                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 ${
                          darkMode
                            ? 'bg-[#1E293B] border-[#FF6B6B]/20'
                            : 'bg-white border-red-200'
                        }`}>
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setOwnerDropdownOpen(null)
                                router.push('/owners')
                              }}
                              className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                darkMode
                                  ? 'hover:bg-[#FF6B6B]/10 text-gray-300 hover:text-white'
                                  : 'hover:bg-red-50 text-red-950 hover:text-red-900'
                              }`}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => {
                                setOwnerDropdownOpen(null)
                                // Edit functionality - you can implement this
                                console.log('Edit owner account:', account)
                              }}
                              className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                darkMode
                                  ? 'hover:bg-[#FF6B6B]/10 text-gray-300 hover:text-white'
                                  : 'hover:bg-red-50 text-red-950 hover:text-red-900'
                              }`}
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setOwnerDropdownOpen(null)
                                setDeleteTargetId(account.id)
                                setShowDeleteOwnerConfirm(true)
                              }}
                              className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                darkMode
                                  ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-red-800'
                      }`}>Account Number</p>
                      <p className={`font-mono transition-colors ${
                        darkMode ? 'text-gray-300' : 'text-red-900'
                      }`}>{account.accountNumber}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-red-800'
                      }`}>Bank Details</p>
                      <p className={`transition-colors ${
                        darkMode ? 'text-gray-300' : 'text-red-900'
                      }`}>{account.bankDetails}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : currentPage === 'bank-accounts' ? (
          <>
            {/* Bank Accounts Page */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-3xl sm:text-4xl font-bold mb-2 transition-colors ${
                    darkMode ? 'gradient-text' : 'text-red-900'
                  }`}>Bank Accounts</h2>
                  <p className={`transition-colors ${
                    darkMode ? 'text-gray-400' : 'text-red-900'
                  }`}>Manage bank account information</p>
                </div>
                <button
                  onClick={() => setShowBankForm(true)}
                  className={`cursor-pointer px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90 hover:shadow-red-500/20'
                      : 'bg-red-900 hover:bg-red-800 text-red-50'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Bank Account</span>
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  darkMode ? 'text-gray-500' : 'text-red-400'
                }`} />
                <Input
                  placeholder="Search by name, account name, or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-10 transition-colors ${
                    darkMode
                      ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                      : 'bg-white border-red-200 text-red-950 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400/50'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                      darkMode
                        ? 'hover:bg-[#FF6B6B]/10 text-gray-500 hover:text-gray-300'
                        : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bankAccounts.filter(account => 
                account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                account.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((account) => (
                <div
                  key={account.id}
                  className={`rounded-2xl p-6 border transition-colors ${
                    darkMode ? 'glass-effect' : 'bg-white border-red-200 shadow-md'
                  }`}
                  onMouseLeave={() => setBankDropdownOpen(null)}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 bg-[#FF6B6B]/10 rounded-lg">
                      <Landmark className="w-6 h-6 text-[#FF6B6B]" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg transition-colors ${
                        darkMode ? 'text-white' : 'text-red-950'
                      }`}>{account.name}</h3>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        account.bank === 'PMO'
                          ? 'bg-purple-500/20 text-purple-400'
                          : darkMode
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-800 text-red-50'
                      }`}>{account.bank}</span>
                    </div>
                    
                    {/* 3-dot menu */}
                    <div className="relative">
                      <button
                        onMouseEnter={() => setBankDropdownOpen(account.id)}
                        onClick={() => setBankDropdownOpen(bankDropdownOpen === account.id ? null : account.id)}
                        className={`cursor-pointer p-2 rounded-lg transition-all ${
                          darkMode
                            ? 'hover:bg-[#FF6B6B]/10 text-gray-400 hover:text-[#FF8A80]'
                            : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                        }`}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {bankDropdownOpen === account.id && (
                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 ${
                          darkMode
                            ? 'bg-[#1E293B] border-[#FF6B6B]/20'
                            : 'bg-white border-red-200'
                        }`}>
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setBankDropdownOpen(null)
                                // Edit functionality - you can implement this
                                console.log('Edit bank account:', account)
                              }}
                              className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                darkMode
                                  ? 'hover:bg-[#FF6B6B]/10 text-gray-300 hover:text-white'
                                  : 'hover:bg-red-50 text-red-950 hover:text-red-900'
                              }`}
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setBankDropdownOpen(null)
                                setDeleteTargetId(account.id)
                                setShowDeleteBankConfirm(true)
                              }}
                              className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                darkMode
                                  ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 min-h-[160px]">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-red-800'
                      }`}>Account Name</p>
                      <p className={`transition-colors ${
                        darkMode ? 'text-gray-300' : 'text-red-900'
                      }`}>{account.accountName}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-red-800'
                      }`}>Account Number</p>
                      <p className={`font-mono transition-colors ${
                        darkMode ? 'text-gray-300' : 'text-red-900'
                      }`}>{account.accountNumber}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-red-800'
                      }`}>Phone Number</p>
                      <p className={`transition-colors ${
                        darkMode ? 'text-gray-300' : 'text-red-900'
                      }`}>{account.phoneNumber || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : currentPage === 'archive' ? (
          <>
            {/* Archive Page */}
            <div className="mb-8">
              <div className="mb-6">
                <h2 className={`text-3xl sm:text-4xl font-bold mb-2 transition-colors ${
                  darkMode ? 'gradient-text' : 'text-red-900'
                }`}>Archive</h2>
                <p className={`transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-red-900'
                }`}>View and manage archived items</p>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  darkMode ? 'text-gray-500' : 'text-red-400'
                }`} />
                <Input
                  placeholder="Search archived items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-10 transition-colors ${
                    darkMode
                      ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                      : 'bg-white border-red-200 text-red-950 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400/50'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                      darkMode
                        ? 'hover:bg-[#FF6B6B]/10 text-gray-500 hover:text-gray-300'
                        : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Archive Section */}
            <div className="space-y-8">
              <div className={`rounded-2xl p-6 border transition-colors ${
                darkMode ? 'glass-effect-dark' : 'bg-white border-red-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <Archive className="w-6 h-6 text-[#FF6B6B]" />
                  <h3 className={`text-xl font-bold transition-colors ${
                    darkMode ? 'text-white' : 'text-red-950'
                  }`}>Archive</h3>
                </div>

                {/* Archived Accountants */}
                {archivedAccountants.filter(acc => 
                  acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.email.toLowerCase().includes(searchQuery.toLowerCase())
                ).length > 0 && (
                  <div className="mb-8">
                    <h4 className={`text-lg font-semibold mb-4 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-red-900'
                    }`}>Archived Accountants ({archivedAccountants.filter(acc => 
                      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      acc.email.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {archivedAccountants.filter(acc => 
                        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        acc.email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((acc) => (
                        <div
                          key={acc.id}
                          className={`rounded-lg p-4 border transition-colors ${
                            darkMode ? 'bg-[#0F172A]/50 border-[#FF6B6B]/10' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className={`font-bold transition-colors ${
                                darkMode ? 'text-white' : 'text-red-950'
                              }`}>{acc.name}</h5>
                              <p className={`text-sm transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-red-900'
                              }`}>{acc.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setAccountants([...accountants, acc])
                                setArchivedAccountants(archivedAccountants.filter(a => a.id !== acc.id))
                              }}
                              className={`cursor-pointer flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                darkMode
                                  ? 'bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF8A80]'
                                  : 'bg-red-900 hover:bg-red-800 text-red-50'
                              }`}
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => setArchivedAccountants(archivedAccountants.filter(a => a.id !== acc.id))}
                              className={`cursor-pointer px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                                darkMode
                                  ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400'
                                  : 'bg-red-900/10 hover:bg-red-900/20 text-red-900'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Archived Owner Accounts */}
                {archivedOwnerAccounts.filter(acc => 
                  acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
                ).length > 0 && (
                  <div className="mb-8">
                    <h4 className={`text-lg font-semibold mb-4 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-red-900'
                    }`}>Archived Owner Accounts ({archivedOwnerAccounts.filter(acc => 
                      acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {archivedOwnerAccounts.filter(acc => 
                        acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((acc) => (
                        <div
                          key={acc.id}
                          className={`rounded-lg p-4 border transition-colors ${
                            darkMode ? 'bg-[#0F172A]/50 border-[#FF6B6B]/10' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className={`font-bold transition-colors ${
                                darkMode ? 'text-white' : 'text-red-950'
                              }`}>{acc.accountName}</h5>
                              <p className={`text-sm font-mono transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-red-900'
                              }`}>{acc.accountNumber}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setOwnerAccounts([...ownerAccounts, acc])
                                setArchivedOwnerAccounts(archivedOwnerAccounts.filter(a => a.id !== acc.id))
                              }}
                              className={`cursor-pointer flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                darkMode
                                  ? 'bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF8A80]'
                                  : 'bg-red-900 hover:bg-red-800 text-red-50'
                              }`}
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => setArchivedOwnerAccounts(archivedOwnerAccounts.filter(a => a.id !== acc.id))}
                              className={`cursor-pointer px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                                darkMode
                                  ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400'
                                  : 'bg-red-900/10 hover:bg-red-900/20 text-red-900'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Archived Bank Accounts */}
                {archivedBankAccounts.filter(acc => 
                  acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
                ).length > 0 && (
                  <div className="mb-8">
                    <h4 className={`text-lg font-semibold mb-4 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-red-900'
                    }`}>Archived Bank Accounts ({archivedBankAccounts.filter(acc => 
                      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {archivedBankAccounts.filter(acc => 
                        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((acc) => (
                        <div
                          key={acc.id}
                          className={`rounded-lg p-4 border transition-colors ${
                            darkMode ? 'bg-[#0F172A]/50 border-[#FF6B6B]/10' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className={`font-bold transition-colors ${
                                  darkMode ? 'text-white' : 'text-red-950'
                                }`}>{acc.name}</h5>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  acc.bank === 'PMO'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : darkMode
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'bg-red-800 text-red-50'
                                }`}>{acc.bank}</span>
                              </div>
                              <p className={`text-sm font-mono transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-red-900'
                              }`}>{acc.accountNumber}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setBankAccounts([...bankAccounts, acc])
                                setArchivedBankAccounts(archivedBankAccounts.filter(a => a.id !== acc.id))
                              }}
                              className={`cursor-pointer flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                darkMode
                                  ? 'bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF8A80]'
                                  : 'bg-red-900 hover:bg-red-800 text-red-50'
                              }`}
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => setArchivedBankAccounts(archivedBankAccounts.filter(a => a.id !== acc.id))}
                              className={`cursor-pointer px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                                darkMode
                                  ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400'
                                  : 'bg-red-900/10 hover:bg-red-900/20 text-red-900'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {archivedAccountants.filter(acc => 
                  acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.email.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && 
                archivedOwnerAccounts.filter(acc => 
                  acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && 
                archivedBankAccounts.filter(acc => 
                  acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Archive className={`w-16 h-16 mb-4 transition-colors ${
                      darkMode ? 'text-gray-600' : 'text-red-300'
                    }`} />
                    <p className={`text-lg font-semibold transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-red-900'
                    }`}>{searchQuery ? 'No archived items found' : 'Archive is empty'}</p>
                    <p className={`text-sm mt-1 transition-colors ${
                      darkMode ? 'text-gray-500' : 'text-red-800'
                    }`}>{searchQuery ? 'Try adjusting your search terms' : 'Deleted items will appear here'}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
        </div>
      </main>

      {/* Add/Edit Accountant Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors shadow-2xl ${
            darkMode ? 'glass-effect-dark' : 'bg-white border-slate-200'
          }`}>
            {/* Modal Header */}
            <div className={`sticky top-0 border-b p-6 sm:p-8 flex items-center justify-between transition-colors ${
              darkMode ? 'glass-effect-dark border-[#FF6B6B]/20' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-2xl font-bold transition-colors ${
                darkMode ? 'text-white' : 'text-red-950'
              }`}>
                {editingId ? 'Edit Accountant' : 'Add New Accountant'}
              </h2>
              <button
                onClick={closeModal}
                className={`cursor-pointer transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-red-800 hover:text-red-950'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              <form onSubmit={handleAddAccountant} className="space-y-5">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>



                {/* Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`cursor-pointer flex-1 px-4 py-2 border rounded-lg font-semibold transition-all ${
                      darkMode
                        ? 'bg-[#0F172A]/80 border-[#FF6B6B]/20 text-gray-300 hover:border-[#FF6B6B]/50 hover:text-white'
                        : 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100 hover:border-red-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode
                        ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90'
                        : 'bg-red-900 hover:bg-red-800 text-red-50'
                    }`}
                  >
                    {submitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update' : 'Add')} Accountant
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Owner Account Modal */}
      {showOwnerForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl border w-full max-w-lg transition-colors shadow-2xl ${
            darkMode ? 'glass-effect-dark' : 'bg-white border-slate-200'
          }`}>
            <div className={`border-b p-6 flex items-center justify-between transition-colors ${
              darkMode ? 'glass-effect-dark border-[#FF6B6B]/20' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-2xl font-bold transition-colors ${
                darkMode ? 'text-white' : 'text-red-950'
              }`}>Add Owner Account</h2>
              <button
                onClick={() => {
                  setShowOwnerForm(false)
                  setOwnerFormData({ accountName: '', accountNumber: '', bankDetails: '' })
                }}
                className={`cursor-pointer transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-red-800 hover:text-red-950'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault()
                if (!ownerFormData.accountName || !ownerFormData.accountNumber || !ownerFormData.bankDetails) {
                  setError('All fields are required')
                  return
                }
                const newAccount: OwnerAccount = {
                  id: Math.max(...ownerAccounts.map(a => a.id), 0) + 1,
                  ...ownerFormData
                }
                setOwnerAccounts([...ownerAccounts, newAccount])
                setOwnerFormData({ accountName: '', accountNumber: '', bankDetails: '' })
                setShowOwnerForm(false)
              }} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="ownerAccountName" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>Account Name</Label>
                  <Input
                    id="ownerAccountName"
                    placeholder="Main Owner Account"
                    value={ownerFormData.accountName}
                    onChange={(e) => setOwnerFormData({ ...ownerFormData, accountName: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerAccountNumber" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>Account Number</Label>
                  <Input
                    id="ownerAccountNumber"
                    placeholder="1234567890"
                    value={ownerFormData.accountNumber}
                    onChange={(e) => setOwnerFormData({ ...ownerFormData, accountNumber: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerBankDetails" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>Bank Details</Label>
                  <Input
                    id="ownerBankDetails"
                    placeholder="Bank of America"
                    value={ownerFormData.bankDetails}
                    onChange={(e) => setOwnerFormData({ ...ownerFormData, bankDetails: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOwnerForm(false)
                      setOwnerFormData({ accountName: '', accountNumber: '', bankDetails: '' })
                    }}
                    className={`cursor-pointer flex-1 px-4 py-2 border rounded-lg font-semibold transition-all ${
                      darkMode
                        ? 'bg-[#0F172A]/80 border-[#FF6B6B]/20 text-gray-300 hover:border-[#FF6B6B]/50 hover:text-white'
                        : 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100 hover:border-red-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      darkMode
                        ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90'
                        : 'bg-red-900 hover:bg-red-800 text-red-50'
                    }`}
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {showBankForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors shadow-2xl ${
            darkMode ? 'glass-effect-dark' : 'bg-white border-slate-200'
          }`}>
            <div className={`sticky top-0 border-b p-6 flex items-center justify-between transition-colors ${
              darkMode ? 'glass-effect-dark border-[#FF6B6B]/20' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-2xl font-bold transition-colors ${
                darkMode ? 'text-white' : 'text-red-950'
              }`}>Add Bank Account</h2>
              <button
                onClick={() => {
                  setShowBankForm(false)
                  setBankFormData({ name: '', bank: 'normal', accountName: '', accountNumber: '', phoneNumber: '' })
                }}
                className={`cursor-pointer transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-red-800 hover:text-red-950'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault()
                if (!bankFormData.name || !bankFormData.accountName || !bankFormData.accountNumber) {
                  setError('Name, Account Name, and Account Number are required')
                  return
                }
                if (bankFormData.bank === 'PMO' && !bankFormData.phoneNumber) {
                  setError('Phone number is required for PMO accounts')
                  return
                }
                const newAccount: BankAccount = {
                  id: Math.max(...bankAccounts.map(a => a.id), 0) + 1,
                  name: bankFormData.name,
                  bank: bankFormData.bank,
                  accountName: bankFormData.accountName,
                  accountNumber: bankFormData.accountNumber,
                  phoneNumber: bankFormData.bank === 'PMO' ? bankFormData.phoneNumber : undefined
                }
                setBankAccounts([...bankAccounts, newAccount])
                setBankFormData({ name: '', bank: 'normal', accountName: '', accountNumber: '', phoneNumber: '' })
                setShowBankForm(false)
              }} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Operations Account"
                    value={bankFormData.name}
                    onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankType" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>Bank Type</Label>
                  <select
                    id="bankType"
                    value={bankFormData.bank}
                    onChange={(e) => setBankFormData({ ...bankFormData, bank: e.target.value as 'normal' | 'PMO' })}
                    className={`w-full h-10 px-3 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50 [&>option]:bg-[#0F172A] [&>option]:text-white'
                        : 'bg-red-50 border-red-200 text-red-950 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50 [&>option]:bg-white [&>option]:text-red-950'
                    }`}
                  >
                    <option value="normal">Normal</option>
                    <option value="PMO">PMO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountName" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>Account Name</Label>
                  <Input
                    id="bankAccountName"
                    placeholder="Company Operations"
                    value={bankFormData.accountName}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber" className={`font-semibold transition-colors ${
                    darkMode ? 'text-gray-300' : 'text-red-900'
                  }`}>Account Number (Unique)</Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="9876543210"
                    value={bankFormData.accountNumber}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                    className={`h-10 transition-colors ${
                      darkMode 
                        ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                        : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                    }`}
                  />
                </div>
                {bankFormData.bank === 'PMO' && (
                  <div className="space-y-2">
                    <Label htmlFor="bankPhoneNumber" className={`font-semibold transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-red-900'
                    }`}>Phone Number</Label>
                    <Input
                      id="bankPhoneNumber"
                      type="tel"
                      placeholder="+1 (555) 999-8888"
                      value={bankFormData.phoneNumber}
                      onChange={(e) => setBankFormData({ ...bankFormData, phoneNumber: e.target.value })}
                      className={`h-10 transition-colors ${
                        darkMode 
                          ? 'bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder:text-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                          : 'bg-red-50 border-red-200 text-red-950 placeholder:text-red-400 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50'
                      }`}
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBankForm(false)
                      setBankFormData({ name: '', bank: 'normal', accountName: '', accountNumber: '', phoneNumber: '' })
                    }}
                    className={`cursor-pointer flex-1 px-4 py-2 border rounded-lg font-semibold transition-all ${
                      darkMode
                        ? 'bg-[#0F172A]/80 border-[#FF6B6B]/20 text-gray-300 hover:border-[#FF6B6B]/50 hover:text-white'
                        : 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100 hover:border-red-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      darkMode
                        ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90'
                        : 'bg-red-900 hover:bg-red-800 text-red-50'
                    }`}
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {/* Delete Accountant Confirmation Modal */}
      {showDeleteAccountantConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl border w-full max-w-sm transition-colors shadow-2xl ${
            darkMode ? 'glass-effect-dark' : 'bg-white border-red-200'
          }`}>
            <div className={`border-b p-6 sm:p-8 transition-colors ${
              darkMode ? 'glass-effect-dark border-[#FF6B6B]/20' : 'bg-white border-red-200'
            }`}>
              <h2 className={`text-2xl font-bold flex items-center gap-2 transition-colors ${
                darkMode ? 'text-white' : 'text-red-950'
              }`}>
                <AlertCircle className="w-6 h-6 text-[#FF6B6B]" />
                Delete Accountant
              </h2>
            </div>

            <div className="p-6 sm:p-8">
              <p className={`mb-8 leading-relaxed transition-colors ${
                darkMode ? 'text-gray-300' : 'text-red-900'
              }`}>
                Are you sure you want to delete this accountant? This action will move them to the archive.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteAccountantConfirm(false)
                    setDeleteTargetId(null)
                  }}
                  className={`cursor-pointer flex-1 px-4 py-2 border rounded-lg font-semibold transition-all ${
                    darkMode
                      ? 'bg-[#0F172A]/80 border-[#FF6B6B]/20 text-gray-300 hover:border-[#FF6B6B]/50 hover:text-white'
                      : 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAccountant(deleteTargetId)}
                  className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90'
                      : 'bg-red-900 hover:bg-red-800 text-red-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Owner Account Confirmation Modal */}
      {showDeleteOwnerConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl border w-full max-w-sm transition-colors shadow-2xl ${
            darkMode ? 'glass-effect-dark' : 'bg-white border-red-200'
          }`}>
            <div className={`border-b p-6 sm:p-8 transition-colors ${
              darkMode ? 'glass-effect-dark border-[#FF6B6B]/20' : 'bg-white border-red-200'
            }`}>
              <h2 className={`text-2xl font-bold flex items-center gap-2 transition-colors ${
                darkMode ? 'text-white' : 'text-red-950'
              }`}>
                <AlertCircle className="w-6 h-6 text-[#FF6B6B]" />
                Delete Owner Account
              </h2>
            </div>

            <div className="p-6 sm:p-8">
              <p className={`mb-8 leading-relaxed transition-colors ${
                darkMode ? 'text-gray-300' : 'text-red-900'
              }`}>
                Are you sure you want to delete this owner account? This action will move it to the archive.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteOwnerConfirm(false)
                    setDeleteTargetId(null)
                  }}
                  className={`cursor-pointer flex-1 px-4 py-2 border rounded-lg font-semibold transition-all ${
                    darkMode
                      ? 'bg-[#0F172A]/80 border-[#FF6B6B]/20 text-gray-300 hover:border-[#FF6B6B]/50 hover:text-white'
                      : 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteOwnerAccount(deleteTargetId)}
                  className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90'
                      : 'bg-red-900 hover:bg-red-800 text-red-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Bank Account Confirmation Modal */}
      {showDeleteBankConfirm && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl border w-full max-w-sm transition-colors shadow-2xl ${
            darkMode ? 'glass-effect-dark' : 'bg-white border-red-200'
          }`}>
            <div className={`border-b p-6 sm:p-8 transition-colors ${
              darkMode ? 'glass-effect-dark border-[#FF6B6B]/20' : 'bg-white border-red-200'
            }`}>
              <h2 className={`text-2xl font-bold flex items-center gap-2 transition-colors ${
                darkMode ? 'text-white' : 'text-red-950'
              }`}>
                <AlertCircle className="w-6 h-6 text-[#FF6B6B]" />
                Delete Bank Account
              </h2>
            </div>

            <div className="p-6 sm:p-8">
              <p className={`mb-8 leading-relaxed transition-colors ${
                darkMode ? 'text-gray-300' : 'text-red-900'
              }`}>
                Are you sure you want to delete this bank account? This action will move it to the archive.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteBankConfirm(false)
                    setDeleteTargetId(null)
                  }}
                  className={`cursor-pointer flex-1 px-4 py-2 border rounded-lg font-semibold transition-all ${
                    darkMode
                      ? 'bg-[#0F172A]/80 border-[#FF6B6B]/20 text-gray-300 hover:border-[#FF6B6B]/50 hover:text-white'
                      : 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBankAccount(deleteTargetId)}
                  className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90'
                      : 'bg-red-900 hover:bg-red-800 text-red-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl border w-full max-w-sm transition-colors shadow-2xl ${
            darkMode ? 'glass-effect-dark' : 'bg-white border-red-200'
          }`}>
            {/* Modal Header */}
            <div className={`border-b p-6 sm:p-8 transition-colors ${
              darkMode ? 'glass-effect-dark border-[#FF6B6B]/20' : 'bg-white border-red-200'
            }`}>
              <h2 className={`text-2xl font-bold flex items-center gap-2 transition-colors ${
                darkMode ? 'text-white' : 'text-red-950'
              }`}>
                <AlertCircle className="w-6 h-6 text-[#FF6B6B]" />
                Confirm Logout
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              <p className={`mb-8 leading-relaxed transition-colors ${
                darkMode ? 'text-gray-300' : 'text-red-900'
              }`}>
                Are you sure you want to logout? You'll need to sign in again to access the dashboard.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className={`cursor-pointer flex-1 px-4 py-2 border rounded-lg font-semibold transition-all ${
                    darkMode
                      ? 'bg-[#0F172A]/80 border-[#FF6B6B]/20 text-gray-300 hover:border-[#FF6B6B]/50 hover:text-white'
                      : 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white hover:opacity-90'
                      : 'bg-red-900 hover:bg-red-800 text-red-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
