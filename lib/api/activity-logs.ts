// API client for activity logs
import { getApiUrl } from '@/lib/api';

const getBaseUrl = () => `${getApiUrl()}/api`;

export interface ActivityLog {
    id: number;
    activity_type: 'employee' | 'department' | 'position' | 'attendance' | 'system' | 'auth';
    action: string;
    status: 'success' | 'warning' | 'error' | 'info';
    title: string;
    description: string;
    user_id: number | null;
    user_name: string | null;
    user_email: string | null;
    target_id: number | null;
    target_type: string | null;
    metadata: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface ActivityLogFilters {
    type?: string;
    action?: string;
    status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
}

export interface ActivityLogStats {
    total_activities: number;
    by_type: {
        employee: number;
        department: number;
        position: number;
        attendance: number;
        auth: number;
        system: number;
    };
    by_status: {
        success: number;
        warning: number;
        error: number;
        info: number;
    };
    pending_items: number;
    today_activities: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

/**
 * Fetch activity logs with optional filtering
 */
export async function fetchActivityLogs(
    filters: ActivityLogFilters = {}
): Promise<PaginatedResponse<ActivityLog>> {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', filters.type);
    if (filters.action) params.append('action', filters.action);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const response = await fetch(`${getBaseUrl()}/activity-logs?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
    }

    return response.json();
}

/**
 * Fetch activity log statistics
 */
export async function fetchActivityStats(): Promise<{ success: boolean; data: ActivityLogStats }> {
    const response = await fetch(`${getBaseUrl()}/activity-logs/stats`);

    if (!response.ok) {
        throw new Error('Failed to fetch activity statistics');
    }

    return response.json();
}

/**
 * Fetch a single activity log by ID
 */
export async function fetchActivityDetails(id: number): Promise<{ success: boolean; data: ActivityLog }> {
    const response = await fetch(`${getBaseUrl()}/activity-logs/${id}`);

    if (!response.ok) {
        throw new Error('Failed to fetch activity details');
    }

    return response.json();
}

/**
 * Format relative time from timestamp
 */
export function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
        return date.toLocaleDateString();
    }
}
