<script setup lang="ts">
import { computed } from 'vue'
import { useTanggapanStore } from '@/stores/tanggapan'
import { useAuthStore } from '@/stores/auth'

/**
 * Component for displaying a thread of responses/messages to a damage report.
 * 
 * Shows all responses ordered chronologically with sender info and timestamps.
 */

interface Props {
    laporanId: string
}

defineProps<Props>()

const tanggapanStore = useTanggapanStore()
const authStore = useAuthStore()

const isLoading = computed(() => !tanggapanStore.isLoaded)
const isEmpty = computed(() => tanggapanStore.daftarTanggapan.length === 0)
const hasError = computed(() => tanggapanStore.errorMessage !== '')

/**
 * Format timestamp to relative time (e.g., "2 menit yang lalu").
 */
function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return 'Baru saja'
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`
    if (diffHours < 24) return `${diffHours} jam yang lalu`
    if (diffDays < 7) return `${diffDays} hari yang lalu`
    
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Get role display label (e.g., "Guru" → "Guru").
 */
function getRoleLabel(role: string | null): string {
    if (!role) return 'Pengguna'
    const roleMap: Record<string, string> = {
        'siswa': 'Siswa',
        'guru': 'Guru',
        'kemahasiswaan': 'Kemahasiswaan',
        'guru_bk': 'Guru BK',
    }
    return roleMap[role] || role
}

/**
 * Determine if message should align right (current user) or left (others).
 */
function isCurrentUser(pengirimId: number | null): boolean {
    return pengirimId === authStore.user?.id
}
</script>

<template>
    <div class="tanggapan-thread">
        <!-- Loading state -->
        <div v-if="isLoading" class="thread-loading">
            <p>Memuat tanggapan...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="hasError" class="thread-error">
            <p>{{ tanggapanStore.errorMessage }}</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="isEmpty" class="thread-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                class="empty-icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Belum ada tanggapan pada laporan ini</p>
        </div>

        <!-- Messages thread -->
        <div v-else class="thread-container">
            <div v-for="tanggapan in tanggapanStore.daftarTanggapan" :key="tanggapan.id"
                class="message-item" :class="{ 'message-item--current': isCurrentUser(tanggapan.pengirim_id) }">
                
                <!-- Avatar (left) -->
                <div class="message-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>

                <!-- Message content (right) -->
                <div class="message-content">
                    <!-- Header: Name and Role -->
                    <div class="message-header">
                        <span class="message-name">{{ tanggapan.nama_pengirim }}</span>
                        <span v-if="tanggapan.pengirim_role" class="message-role">
                            {{ getRoleLabel(tanggapan.pengirim_role) }}
                        </span>
                    </div>

                    <!-- Message text -->
                    <p class="message-text">{{ tanggapan.pesan }}</p>

                    <!-- Timestamp -->
                    <span class="message-time">{{ formatRelativeTime(tanggapan.created_at) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tanggapan-thread {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Loading/Error/Empty states */
.thread-loading,
.thread-error,
.thread-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 16px;
    text-align: center;
    background: #f9fafb;
    border: 1px dashed #e5e7eb;
    border-radius: 8px;
    min-height: 200px;
}

.thread-loading p,
.thread-error p {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
}

.thread-error {
    background: #fef2f2;
    border-color: #fecaca;
}

.thread-error p {
    color: #dc2626;
}

.thread-empty {
    background: #f9fafb;
}

.empty-icon {
    color: #d1d5db;
}

.thread-empty p {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
}

/* Message container */
.thread-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 500px;
    overflow-y: auto;
    padding: 8px 0;
}

/* Message item layout */
.message-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
}

.message-item--current {
    flex-direction: row-reverse;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Avatar */
.message-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-blue-100);
    color: var(--color-blue-600);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-blue-200);
}

.message-item--current .message-avatar {
    background: var(--color-neutral-100);
    color: var(--color-neutral-600);
    border-color: var(--color-neutral-200);
}

/* Message content */
.message-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
    max-width: 75%;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
}

.message-item--current .message-content {
    background: var(--color-blue-50);
    border-color: var(--color-blue-200);
}

/* Header: Name + Role */
.message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.message-name {
    font-weight: 600;
    font-size: 13px;
    color: var(--color-general-black);
}

.message-role {
    font-size: 11px;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
}

/* Message text */
.message-text {
    font-size: 13px;
    color: var(--color-general-black);
    margin: 0;
    line-height: 1.5;
    word-break: break-word;
}

/* Timestamp */
.message-time {
    font-size: 11px;
    color: #9ca3af;
}

/* Scrollbar styling */
.thread-container::-webkit-scrollbar {
    width: 6px;
}

.thread-container::-webkit-scrollbar-track {
    background: transparent;
}

.thread-container::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

.thread-container::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Responsive */
@media (max-width: 600px) {
    .message-content {
        max-width: 85%;
    }

    .message-text {
        font-size: 12px;
    }

    .message-name {
        font-size: 12px;
    }

    .thread-container {
        max-height: 400px;
    }
}
</style>
