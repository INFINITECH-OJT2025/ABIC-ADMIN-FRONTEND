import {
    Users,
    ShieldCheck,
    Briefcase,
} from "lucide-react"

import { NavEntry } from "@/components/admin-head/HeadHeader"

export const adminHeadNav: NavEntry[] = [
    { type: "link", label: "ADMINS", href: "/admin/admins", icon: ShieldCheck },
]
