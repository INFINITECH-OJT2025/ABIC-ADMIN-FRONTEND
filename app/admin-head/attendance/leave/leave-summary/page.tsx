'use client'


import { useState, useEffect, useMemo } from 'react'
import { Calendar, ChevronLeft, Search, Download, ChevronDown, Check } from 'lucide-react'
import * as XLSX from "xlsx-js-style";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'


import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'


interface Employee {
    id: string
    name: string
    department?: string
}


interface LeaveEntry {
    id: number
    employee_id: string
    employee_name: string
    start_date: string
    number_of_days: number
    approved_by: string
}


export default function LeaveSummaryPage() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


    useEffect(() => {
        Promise.all([
            fetch(`${getApiUrl()}/api/employees`).then(r => r.json()),
            fetch(`${getApiUrl()}/api/leaves`).then(r => r.json())
        ]).then(([empData, leaveData]) => {
            if (empData.success) {
                setEmployees(empData.data.map((e: any) => ({
                    id: e.id,
                    name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
                    department: e.department
                })));
            }
            if (leaveData.success) {
                setLeaves(leaveData.data ?? []);
            }
        }).catch(console.error).finally(() => setIsLoading(false));
    }, []);


    const summaryData = useMemo(() => {
        const stats: Record<string, { employee: Employee, months: number[], total: number }> = {};


        employees.forEach(emp => {
            stats[emp.id] = { employee: emp, months: Array(12).fill(0), total: 0 };
        });


        leaves.forEach(leave => {
            // Include only Approved leaves (not Pending, not Declined)
            const isApproved = !['Pending', 'Declined'].includes(leave.approved_by);
            if (!isApproved) return;


            if (!leave.start_date) return;
            const date = new Date(leave.start_date);
            if (date.getFullYear() !== selectedYear) return;


            const month = date.getMonth(); // 0-11
            const empId = leave.employee_id;


            if (!stats[empId]) {
                stats[empId] = { employee: { id: empId, name: leave.employee_name }, months: Array(12).fill(0), total: 0 };
            }


            const days = Number(leave.number_of_days) || 0;
            stats[empId].months[month] += days;
            stats[empId].total += days;
        });


        let result = Object.values(stats);


        // Sort by ID to match the image sorting (e.g. 19-0015, 22-0016, 24-0045...)
        result.sort((a, b) => {
            return String(a.employee.id).localeCompare(String(b.employee.id));
        });


        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.employee.name.toLowerCase().includes(query) ||
                r.employee.id.toLowerCase().includes(query)
            );
        }


        return result;
    }, [employees, leaves, selectedYear, searchQuery]);


    const yearOptions = useMemo(() => {
        const years = new Set<number>();
        leaves.forEach(leave => {
            if (leave.start_date) {
                const year = new Date(leave.start_date).getFullYear();
                if (!isNaN(year)) {
                    years.add(year);
                }
            }
        });


        const sortedYears = Array.from(years).sort((a, b) => b - a);
        // Fallback to current year if no data is found yet
        return sortedYears.length > 0 ? sortedYears : [currentYear];
    }, [leaves, currentYear]);


    const handleExport = () => {
        const now = new Date()
        const generatedLabel = `Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
        const periodLabel = `Leave Monitoring Summary for Year: ${selectedYear}`


        // ── Formatting Helper ──────────────────────────────────────────────────────
        const formatExcelValue = (val: number) => {
            if (val === 0) return '-';
            if (val % 1 !== 0) {
                const days = Math.floor(val);
                const hours = (val % 1) * 8;
                return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
            }
            return val; // Whole number
        };


        // ── Maroon Gradient Palette ────────────────────────────────────────────────
        const NAVY = '4A081A'
        const INDIGO = '7B0F2B'
        const INDIGO_LIGHT = 'FCE8ED'
        const SLATE_ALT = 'FDF4F6'
        const BORDER_CLR = 'E2A0B0'
        const WHITE = 'FFFFFF'
        const BLACK = '1A0008'
        const GRAY = '6B2033'


        const thin = (c = BORDER_CLR) => ({ style: 'thin' as const, color: { rgb: c } })
        const border = (c = BORDER_CLR) => ({ top: thin(c), bottom: thin(c), left: thin(c), right: thin(c) })


        // ── AOA construction ───────────────────────────────────────────────────────
        const AOA: any[][] = []


        // R0 – Company banner
        AOA.push(['ABIC REALTY AND CONSULTANCY', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
        // R1 – Report type
        AOA.push(['Yearly Leave Monitoring Summary', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
        // R2 – Period | Generated on
        AOA.push([periodLabel, '', '', '', '', '', '', '', '', '', '', '', '', '', generatedLabel])
        // R3 – blank spacer
        AOA.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
        // R4 – Table column headings
        AOA.push(['ID NUMBER', 'EMPLOYEE NAME', ...MONTHS, 'TOTAL'])


        // R5… – Employee data rows
        summaryData.forEach(record => {
            const row = [
                record.employee.id,
                record.employee.name,
                ...record.months.map(v => formatExcelValue(v)),
                formatExcelValue(record.total)
            ]
            AOA.push(row)
        })


        // Summary Statistics
        AOA.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
        const summaryHeaderRow = AOA.length
        AOA.push(['Report Summary', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
        AOA.push(['Total Employees Listed', '', '', '', '', '', '', '', formatExcelValue(summaryData.length), '', '', '', '', '', ''])
        AOA.push(['Total Leave Days Taken (Company-wide)', '', '', '', '', '', '', '', formatExcelValue(summaryData.reduce((s, r) => s + r.total, 0)), '', '', '', '', '', ''])


        // Signatory
        AOA.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
        const sigRowIndex = AOA.length
        AOA.push(['', '', '', '', '', '', '', '', '', '', 'Prepared by:', '', '', '', ''])
        AOA.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
        AOA.push(['', '', '', '', '', '', '', '', '', '', '________________________________', '', '', '', ''])
        AOA.push(['', '', '', '', '', '', '', '', '', '', 'Admin Head', '', '', '', ''])


        // ── Sheet creation ─────────────────────────────────────────────────────────
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet(AOA)


        // Column widths
        ws['!cols'] = [
            { wch: 15 }, // ID
            { wch: 45 }, // Name
            ...Array(12).fill({ wch: 10 }), // Months (wider for d/h format)
            { wch: 12 }, // Total
        ]


        // Row heights
        ws['!rows'] = AOA.map((_, i) => {
            if (i === 0) return { hpt: 35 }
            if (i === 1) return { hpt: 25 }
            if (i === 4) return { hpt: 30 }
            return { hpt: 22 }
        })


        // Merges
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
            { s: { r: 2, c: 12 }, e: { r: 2, c: 14 } },
            { s: { r: summaryHeaderRow, c: 0 }, e: { r: summaryHeaderRow, c: 14 } },
            // Summary merges
            { s: { r: summaryHeaderRow + 1, c: 0 }, e: { r: summaryHeaderRow + 1, c: 6 } },
            { s: { r: summaryHeaderRow + 2, c: 0 }, e: { r: summaryHeaderRow + 2, c: 6 } },
            { s: { r: summaryHeaderRow + 1, c: 8 }, e: { r: summaryHeaderRow + 1, c: 10 } },
            { s: { r: summaryHeaderRow + 2, c: 8 }, e: { r: summaryHeaderRow + 2, c: 10 } },
            // Signatory merges
            { s: { r: sigRowIndex, c: 10 }, e: { r: sigRowIndex, c: 14 } },
            { s: { r: sigRowIndex + 2, c: 10 }, e: { r: sigRowIndex + 2, c: 14 } },
            { s: { r: sigRowIndex + 3, c: 10 }, e: { r: sigRowIndex + 3, c: 14 } },
        ]


        // ── Style applier ──────────────────────────────────────────────────────────
        const S = (r: number, c: number, style: object) => {
            const addr = XLSX.utils.encode_cell({ r, c })
            if (!ws[addr]) ws[addr] = { t: 's', v: '' }
            ws[addr].s = style
        }


        // Header styles
        S(0, 0, {
            font: { bold: true, sz: 18, color: { rgb: WHITE } },
            fill: { patternType: 'solid', fgColor: { rgb: NAVY } },
            alignment: { horizontal: 'center', vertical: 'center' }
        })
        S(1, 0, {
            font: { bold: true, sz: 14, color: { rgb: WHITE } },
            fill: { patternType: 'solid', fgColor: { rgb: INDIGO } },
            alignment: { horizontal: 'center', vertical: 'center' }
        })
        S(2, 0, {
            font: { bold: true, sz: 11, color: { rgb: INDIGO } },
            fill: { patternType: 'solid', fgColor: { rgb: INDIGO_LIGHT } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: { bottom: thin() }
        })
        S(2, 14, {
            font: { sz: 10, color: { rgb: GRAY }, italic: true },
            fill: { patternType: 'solid', fgColor: { rgb: INDIGO_LIGHT } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: { bottom: thin() }
        })


            // Table Headings
            ;[...Array(15).keys()].forEach(c => {
                S(4, c, {
                    font: { bold: true, sz: 11, color: { rgb: WHITE } },
                    fill: { patternType: 'solid', fgColor: { rgb: INDIGO } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: border('9B1535')
                })
            })


        // Data Rows
        summaryData.forEach((record, i) => {
            const r = 5 + i
            const rowFill = i % 2 === 0 ? WHITE : SLATE_ALT
                ;[...Array(15).keys()].forEach(c => {
                    // Determine if we should highlight based on actual value
                    const rawVal = c >= 2 && c <= 13 ? record.months[c - 2] : (c === 14 ? record.total : 0);
                    const isHighlight = c >= 2 && c <= 13 && rawVal >= 3;


                    S(r, c, {
                        font: {
                            sz: 10,
                            color: { rgb: isHighlight ? '800020' : BLACK },
                            bold: c === 1 || c === 14 || isHighlight
                        },
                        fill: { patternType: 'solid', fgColor: { rgb: isHighlight ? 'FDE2E4' : rowFill } },
                        alignment: { horizontal: c === 1 ? 'left' : 'center', vertical: 'center' },
                        border: border()
                    })
                })
        })


        // Summary Statistics Styling
        S(summaryHeaderRow, 0, {
            font: { bold: true, sz: 12, color: { rgb: WHITE } },
            fill: { patternType: 'solid', fgColor: { rgb: INDIGO } },
            alignment: { horizontal: 'left', vertical: 'center' }
        })


            // Record Summary labels and values
            ;[1, 2].forEach(offset => {
                const r = summaryHeaderRow + offset;
                S(r, 0, { font: { bold: true, sz: 10, color: { rgb: GRAY } }, alignment: { horizontal: 'left' } });
                S(r, 8, { font: { bold: true, sz: 11, color: { rgb: INDIGO } }, alignment: { horizontal: 'center' } });
            })


        // Signatory Styling
        S(sigRowIndex, 10, { font: { sz: 11, italic: true }, alignment: { horizontal: 'center' } });
        S(sigRowIndex + 2, 10, { font: { bold: true }, alignment: { horizontal: 'center' } });
        S(sigRowIndex + 3, 10, { font: { bold: true, sz: 12, color: { rgb: INDIGO } }, alignment: { horizontal: 'center' } });


        // ── Print Configuration ────────────────────────────────────────────────────
        ws['!pageSetup'] = {
            paperSize: 1, // Letter (8.5 x 11 in)
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
        }
        ws['!margins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }


        XLSX.utils.book_append_sheet(wb, ws, `Leave_Summary_${selectedYear}`)
        XLSX.writeFile(wb, `Leave_Monitoring_Summary_${selectedYear}.xlsx`)
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f0f2] via-white to-[#fff0f3]">
            {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
            <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6 sticky top-0 z-50">
                {/* Main Header Row */}
                <div className="w-full px-4 md:px-8 py-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">Yearly Leave Summary</h1>
                            <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Leave Monitoring {selectedYear}
                            </p>
                        </div>


                        <div className="flex items-center gap-3">
                            <Link href="/admin-head/attendance/leave">
                                <Button
                                    variant="outline"
                                    className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" /><span>Back to leave entry</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>


                {/* Secondary Toolbar */}
                <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="w-full px-4 md:px-8 py-3">
                        <div className="flex flex-wrap items-center gap-3 md:gap-4">


                            {/* Year Selection */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Year</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[120px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                                            <span>{selectedYear}</span>
                                            <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[150px] bg-white border-rose-100 shadow-xl rounded-xl p-1.5" align="start">
                                        {yearOptions.map(year => (
                                            <DropdownMenuItem
                                                key={year}
                                                onClick={() => setSelectedYear(year)}
                                                className={cn(
                                                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                                                    selectedYear === year ? "bg-red-50 text-red-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                {year}
                                                {selectedYear === year && <Check className="w-4 h-4 text-red-600" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>


                            {/* Export Button */}
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /><span>Export</span>
                            </Button>


                            {/* Search Bar */}
                            <div className="flex items-center gap-3 ml-auto">
                                <span className="text-sm font-bold text-white/70 uppercase tracking-wider hidden xl:block">Search</span>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search Employee..."
                                        className="pl-9 h-10 w-[300px] lg:w-[400px] bg-white border-2 border-[#FFE5EC] text-[#800020] placeholder:text-slate-400 font-medium rounded-lg shadow-sm focus-visible:ring-rose-200 transition-all duration-200 focus:w-[320px] lg:focus:w-[440px]"
                                    />
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </div>


            {/* ----- CONTENT ----- */}
            <div className="px-6 py-6 md:px-8">
                <div className="bg-white rounded-xl shadow-sm border border-rose-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#FDF2F4] to-[#FFF5F6] border-b border-rose-200 px-8 py-6 flex items-center justify-between">
                        <h2 className="text-[#7B0F2B] text-xl font-bold tracking-wide uppercase">
                            Leave Monitoring Summary {selectedYear}
                        </h2>
                    </div>


                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-12 text-center text-[#7B0F2B]/50 font-medium text-lg animate-pulse">
                                Loading leave data...
                            </div>
                        ) : (
                            <table className="w-full text-base border-collapse">
                                <thead>
                                    <tr className="bg-[#FFF1F3] text-[#7B0F2B] border-b border-rose-200">
                                        <th className="px-6 py-4 font-bold uppercase text-center whitespace-nowrap border-r border-rose-200/50">ID Number</th>
                                        <th className="px-6 py-4 font-bold uppercase text-center min-w-[250px] border-r border-rose-200/50">Name</th>
                                        {MONTHS.map(m => (
                                            <th key={m} className="px-2 py-4 font-bold text-sm uppercase text-center w-14 border-r border-rose-200/50">{m}</th>
                                        ))}
                                        <th className="px-6 py-4 font-bold uppercase text-center whitespace-nowrap">Total Leave Taken</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryData.map((record, idx) => (
                                        <tr
                                            key={record.employee.id}
                                            className={cn('border-b border-rose-100 hover:bg-rose-50/80 transition-colors', idx % 2 === 0 ? 'bg-white' : 'bg-[#FFF9FA]')}
                                        >
                                            <td className="px-6 py-4 text-center text-slate-700 font-semibold border-r border-rose-100">{record.employee.id}</td>
                                            <td className="px-6 py-4 text-left font-bold text-lg text-slate-800 border-r border-rose-100">{record.employee.name}</td>


                                            {record.months.map((val, mIdx) => (
                                                <td
                                                    key={mIdx}
                                                    className={cn(
                                                        "px-2 py-4 text-center border-r border-rose-100",
                                                        val >= 3 ? "bg-rose-200 text-rose-900 font-black text-lg shadow-[inset_0_0_8px_rgba(225,29,72,0.2)]" : "text-slate-600 font-semibold"
                                                    )}
                                                >
                                                    {val > 0
                                                        ? (val % 1 !== 0
                                                            ? (Math.floor(val) > 0 ? `${Math.floor(val)}d ${(val % 1) * 8}hrs` : `${val * 8}hrs`)
                                                            : val)
                                                        : <span className="text-slate-300">-</span>}
                                                </td>
                                            ))}


                                            <td className="px-6 py-4 text-center text-[#4A081A] font-bold text-xl bg-[#FFF5F6]">
                                                {record.total > 0
                                                    ? (record.total % 1 !== 0
                                                        ? (Math.floor(record.total) > 0 ? `${Math.floor(record.total)}d ${(record.total % 1) * 8}hrs` : `${record.total * 8}hrs`)
                                                        : record.total)
                                                    : <span className="text-slate-300">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {summaryData.length === 0 && (
                                        <tr>
                                            <td colSpan={15} className="px-4 py-8 text-center text-slate-400 italic">
                                                No employee records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

