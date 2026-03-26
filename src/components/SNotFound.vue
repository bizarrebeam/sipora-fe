<script setup lang="ts">
import { useNotFoundStore } from '@/stores/notFound'
import PriwitanIcon from '@/assets/priwitan-whistle.svg'

const notFoundStore = useNotFoundStore()

function handleNotFoundClose() {
  notFoundStore.hide()
}
</script>

<template>
  <Transition name="overlay-404">
    <div v-if="notFoundStore.visible" class="not-found-overlay" @click.self="handleNotFoundClose">
      <div class="not-found-card">
        <div class="not-found-icon-wrapper">
          <img :src="PriwitanIcon" alt="" class="not-found-whistle" />
        </div>
        <h2 class="not-found-title">Oops, 404!</h2>
        <p class="not-found-message">
          {{ notFoundStore.message || 'Halaman yang kamu cari tidak ditemukan.' }}
        </p>
        <p class="not-found-sub">Sepertinya kamu tersesat, yuk balik ke halaman sebelumnya!</p>
        <button class="not-found-btn" @click="handleNotFoundClose">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Kembali
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── 404 Not Found Overlay ── */
.not-found-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
}

.not-found-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 28px;
  padding: 48px 40px 36px;
  max-width: 420px;
  width: calc(100% - 32px);
  box-shadow:
    0 12px 48px rgba(42, 44, 135, 0.14),
    0 4px 12px rgba(0, 0, 0, 0.06);
}

.not-found-icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-blue-50, #eef0fb);
  border-radius: 50%;
  margin-bottom: 16px;
  animation: floatPriwitan 2.5s ease-in-out infinite;
}

.not-found-whistle {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(88, 89, 169, 0.25));
}

.not-found-title {
  font-family: "Space Grotesk", "Be Vietnam Pro", sans-serif;
  font-weight: 800;
  font-size: 56px;
  color: var(--color-blue-500, #2E3094);
  margin: 0 0 8px;
  line-height: 1;
  letter-spacing: -2px;
}

.not-found-message {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: var(--color-general-black, #333);
  line-height: 1.6;
  margin: 0 0 6px;
}

.not-found-sub {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;
  font-size: 13px;
  color: var(--color-neutral-400, #999);
  margin: 0 0 24px;
}

.not-found-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  background: var(--color-blue-500, #2E3094);
  color: white;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.not-found-btn:hover {
  background: var(--color-blue-600, #252783);
  transform: translateY(-1px);
}

.not-found-btn:active {
  transform: translateY(0);
}

/* 404 Transitions (Matching SDialog) */
.overlay-404-enter-active,
.overlay-404-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-404-enter-from,
.overlay-404-leave-to {
  opacity: 0;
}

.overlay-404-enter-active .not-found-card,
.overlay-404-leave-active .not-found-card {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.overlay-404-enter-from .not-found-card {
  transform: scale(0.8) translateY(20px);
  opacity: 0;
}

.overlay-404-leave-to .not-found-card {
  transform: scale(0.95) translateY(0);
  opacity: 0;
  transition: all 0.2s ease-in;
}

@keyframes floatPriwitan {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
