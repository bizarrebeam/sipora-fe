<script setup lang="ts">
import { useLoadingStore } from '@/stores/loading'
import PriwitanIcon from '@/assets/priwitan-whistle.svg'

const loading = useLoadingStore()
</script>

<template>
  <Transition name="overlay">
    <div v-if="loading.visible" class="loading-overlay">
      <div class="loading-backdrop" />
      <div class="loading-content">
        <div class="loader-container">
          <!-- Circular progress ring -->
          <svg class="loader-ring" viewBox="0 0 100 100">
            <circle class="ring-track" cx="50" cy="50" r="44" />
            <circle class="ring-progress" cx="50" cy="50" r="44" />
          </svg>
          <!-- Priwitan whistle icon -->
          <div class="loader-icon">
            <img :src="PriwitanIcon" alt="" class="whistle-img" />
          </div>
        </div>
        <p v-if="loading.message" class="loader-message">{{ loading.message }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Full-screen overlay ── */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Frosted glass backdrop ── */
.loading-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px) saturate(180%);
  -webkit-backdrop-filter: blur(8px) saturate(180%);
}

/* ── Centered content card ── */
.loading-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  padding: 40px 56px;
  box-shadow:
    0 8px 40px rgba(42, 44, 135, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ── Loader container ── */
.loader-container {
  position: relative;
  width: 120px;
  height: 120px;
  animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* ── Circular ring SVG ── */
.loader-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: var(--color-blue-100);
  stroke-width: 4;
}

.ring-progress {
  fill: none;
  stroke: var(--color-blue-500);
  stroke-width: 4.5;
  stroke-linecap: round;
  stroke-dasharray: 276.46;
  stroke-dashoffset: 207.35;
  animation: ringRotate 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite,
             ringDash 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  transform-origin: 50% 50%;
}

/* ── Whistle icon center ── */
.loader-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: gentleBounce 2s ease-in-out infinite;
}

.whistle-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(88, 89, 169, 0.3));
}

/* ── Message ── */
.loader-message {
  font-family: var(--font-plus-jakarta);
  font-weight: 500;
  font-size: 15px;
  color: var(--color-blue-600);
  animation: fadeIn 0.4s ease 0.3s both;
}

/* ═══════ OVERLAY TRANSITION ═══════ */
.overlay-enter-active {
  transition: opacity 0.3s ease;
}

.overlay-leave-active {
  transition: opacity 0.25s ease 0.05s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.overlay-enter-active .loading-content {
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.overlay-leave-active .loading-content {
  animation: popOut 0.25s ease both;
}

/* ═══════ KEYFRAMES ═══════ */

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes popOut {
  to {
    opacity: 0;
    transform: scale(0.85);
  }
}

@keyframes ringRotate {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes ringDash {
  0%   { stroke-dashoffset: 242; }
  50%  { stroke-dashoffset: 69; }
  100% { stroke-dashoffset: 242; }
}

@keyframes gentleBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  25%      { transform: translateY(-3px) scale(1.03); }
  50%      { transform: translateY(0) scale(1); }
  75%      { transform: translateY(2px) scale(0.97); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
