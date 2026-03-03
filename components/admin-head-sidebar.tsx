//sidebar

"use client"




import React, { useState } from 'react'
import Image from 'next/image'
import {
  ChevronDown,
  Menu,
  User,
  FileText,
  BookOpen,
  Calendar,
  Users,
  UserPlus,
  UserMinus,
  CheckSquare,
  ClipboardCheck,
  FilePlus,
  LogOut,
  Clock,
  CalendarDays,
  AlertCircle,
  X,
  PanelLeft,
  Activity,
  GitBranch
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"




export default function AdminHeadSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isFormsOpen, setIsFormsOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const router = useRouter()






  const toggleSidebar = () => setIsCollapsed(!isCollapsed)


  const handleLogout = () => {
    // Perform any logout logic here (e.g., clearing tokens)
    router.push('/logout')
  }




  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white h-screen sticky top-0 p-4 flex flex-col transition-all duration-300 ease-in-out z-50`}>


      <button
        onClick={toggleSidebar}
        className={cn(
          "mb-4 p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center",
          !isCollapsed && "absolute top-4 right-4 z-50"
        )}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <PanelLeft size={24} /> : <X size={24} />}
      </button>








      {/* Logo */}
      {!isCollapsed ? (
        <div className="flex justify-center mb-4 mt-8 px-2">
          <Image
            src="/logo.webp"
            alt="ABIC Logo"
            width={160}
            height={160}
            className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="flex justify-center mb-3 mt-8 px-1">
          <Image
            src="/logo.webp"
            alt="ABIC Logo"
            width={60}
            height={60}
            className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] hover:scale-110 transition-transform duration-300"
          />
        </div>
      )}

      {/* Profile Summary - Minimal */}
      {!isCollapsed ? (
        <div className="mb-4 mx-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/15 bg-white/[0.07]">
            <div className="w-7 h-7 rounded-full bg-white/10 ring-1 ring-white/25 flex items-center justify-center shrink-0">
              <User size={14} className="text-white/70" />
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <span className="text-[9px] font-medium text-white/40 uppercase tracking-widest leading-none mb-0.5">
                Admin Head
              </span>
              <h2 className="text-sm font-semibold text-white/90 truncate leading-tight">
                Sachi
              </h2>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          <div className="w-7 h-7 rounded-full bg-white/10 ring-1 ring-white/25 flex items-center justify-center">
            <User size={14} className="text-white/70" />
          </div>
        </div>
      )}










      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar py-2">
        {/* EMPLOYEE with Dropdown */}
        <div className="group relative">
          <button
            onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}
            className={cn(
              "w-full flex items-center px-4 py-3.5 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-base group",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-3">
              <Users size={22} className="shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">EMPLOYEE</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform shrink-0 ${isEmployeeOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
              />
            )}


          </button>


          {/* Employee Dropdown Menu (Hover + Click) */}
          <div className={`${isCollapsed ? 'fixed left-20 top-auto w-56 z-50' : 'ml-10 mt-1'} space-y-1 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md transition-all duration-200 ${isEmployeeOpen ? 'block' : 'hidden'} group-hover:block`}>
            {isCollapsed && <div className="px-3 py-2 text-xs font-bold text-white/50 border-b border-white/10 mb-1 leading-none uppercase tracking-widest">EMPLOYEE</div>}
            <Link
              href="/admin-head/employee/masterfile"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <BookOpen size={18} />
              <span>Masterfile</span>
            </Link>
            <Link
              href="/admin-head/employee/onboard"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <UserPlus size={18} />
              <span>Onboard Employee</span>
            </Link>
            <Link
              href="/admin-head/employee/terminate"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <UserMinus size={18} />
              <span>Terminate Employee</span>
            </Link>
            <Link
              href="/admin-head/employee/evaluation"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <CheckSquare size={18} />
              <span>Evaluation</span>
            </Link>
          </div>
        </div>




        {/* FORMS with Dropdown */}
        <div className="group relative">
          <button
            onClick={() => setIsFormsOpen(!isFormsOpen)}
            className={cn(
              "w-full flex items-center px-4 py-3.5 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-base group",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-3">
              <FileText size={22} className="shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">FORMS</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform shrink-0 ${isFormsOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
              />
            )}
          </button>




          {/* Forms Dropdown Menu (Hover + Click) */}
          <div className={`${isCollapsed ? 'fixed left-20 top-auto w-56 z-50' : 'ml-10 mt-1'} space-y-1 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md transition-all duration-200 ${isFormsOpen ? 'block' : 'hidden'} group-hover:block`}>
            {isCollapsed && <div className="px-3 py-2 text-xs font-bold text-white/50 border-b border-white/10 mb-1 leading-none uppercase tracking-widest">FORMS</div>}
            <Link
              href="/admin-head/forms/clearance-checklist"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <ClipboardCheck size={18} />
              <span>Clearance</span>
            </Link>
            <Link
              href="/admin-head/forms/onboarding"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <FilePlus size={18} />
              <span>Onboarding</span>
            </Link>
          </div>
        </div>




        {/* DIRECTORY */}
        <div className="group relative">
          <Link
            href="/admin-head/directory"
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-base",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <BookOpen size={22} className="shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">DIRECTORY</span>}
          </Link>
          {isCollapsed && (
            <div className="fixed left-20 top-auto w-52 z-50 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md hidden group-hover:block">
              <div className="px-3 py-2 text-xs font-bold text-white/50 border-b border-white/10 mb-1 leading-none uppercase tracking-widest">DIRECTORY</div>
              <Link
                href="/admin-head/directory"
                className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
              >
                <BookOpen size={18} />
                <span>Directory</span>
              </Link>
            </div>
          )}
        </div>

        {/* HIERARCHY */}
        <div className="group relative">
          <Link
            href="/admin-head/hierarchy"
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-base",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <GitBranch size={22} className="shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">HIERARCHY</span>}
          </Link>
          {isCollapsed && (
            <div className="fixed left-20 top-auto w-52 z-50 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md hidden group-hover:block">
              <div className="px-3 py-2 text-xs font-bold text-white/50 border-b border-white/10 mb-1 leading-none uppercase tracking-widest">HIERARCHY</div>
              <Link
                href="/admin-head/hierarchy"
                className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
              >
                <GitBranch size={18} />
                <span>Hierarchy</span>
              </Link>
            </div>
          )}
        </div>








        {/* ATTENDANCE with Dropdown */}
        <div className="group relative">
          <button
            onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
            className={cn(
              "w-full flex items-center px-4 py-3.5 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-base group",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-3">
              <Calendar size={22} className="shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">ATTENDANCE</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform shrink-0 ${isAttendanceOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
              />
            )}
          </button>




          {/* Attendance Dropdown Menu (Hover + Click) */}
          <div className={`${isCollapsed ? 'fixed left-20 top-auto w-56 z-50' : 'ml-10 mt-1'} space-y-1 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md transition-all duration-200 ${isAttendanceOpen ? 'block' : 'hidden'} group-hover:block`}>
            {isCollapsed && <div className="px-3 py-2 text-xs font-bold text-white/50 border-b border-white/10 mb-1 leading-none uppercase tracking-widest">ATTENDANCE</div>}
            <Link
              href="/admin-head/attendance/leave"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <LogOut size={18} />
              <span>Leave</span>
            </Link>
            <Link
              href="/admin-head/attendance/leave-credits"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <CalendarDays size={18} />
              <span>Leave Credits</span>
            </Link>
            <Link
              href="/admin-head/attendance/tardiness"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <Clock size={18} />
              <span>Tardiness</span>
            </Link>
            <Link
              href="/admin-head/attendance/warning-letter"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              <FileText size={18} />
              <span>Letter</span>
            </Link>

          </div>
        </div>


        {/* ACTIVITY LOGS */}
        <div className="group relative">
          <Link
            href="/admin-head"
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-base",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <Activity size={22} className="shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">ACTIVITY LOGS</span>}
          </Link>
          {isCollapsed && (
            <div className="fixed left-20 top-auto w-52 z-50 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md hidden group-hover:block">
              <div className="px-3 py-2 text-xs font-bold text-white/50 border-b border-white/10 mb-1 leading-none uppercase tracking-widest">ACTIVITY LOGS</div>
              <Link
                href="/admin-head"
                className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-white/10 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
              >
                <Activity size={18} />
                <span>Activity Logs</span>
              </Link>
            </div>
          )}
        </div>


      </nav>


      <div className="mx-6 mb-4 border-t border-white/10" />


      <div className="flex justify-center mb-4 w-full px-4">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={cn(
            "flex items-center gap-3 rounded-xl transition-all duration-300 font-bold text-sm tracking-widest w-full justify-center",
            "bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white shadow-lg shadow-black/20",
            "group active:scale-95 py-3.5 uppercase border border-white/20 hover:border-white/40 hover:shadow-white/5",
            isCollapsed ? "px-0 w-12 h-12" : ""
          )}
          title="Log Out"
        >
          <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
          {!isCollapsed && <span>LOGOUT</span>}
        </button>
      </div>


      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="bg-white border-2 border-[#FFE5EC] rounded-2xl max-w-sm">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <LogOut className="w-8 h-8 text-[#4A081A]" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-[#4A081A]">Confirm Logout</DialogTitle>
              <DialogDescription className="text-stone-500 font-medium">
                Are you sure you want to sign out? You will need to log back in to access your dashboard.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-gradient-to-r from-[#4A081A] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E] text-white font-bold h-12 rounded-xl shadow-md transition-all active:scale-95"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>






    </div >
  )
}
