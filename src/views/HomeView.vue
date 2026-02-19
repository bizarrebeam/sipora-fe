<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import STextField from '@/components/STextField.vue'
import SCard from '@/components/SCard.vue'
import SChip from '@/components/SChip.vue'
import SButton from '@/components/SButton.vue'
import SiporaLogo from '@/assets/sipora-logo.svg'

const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isAuthenticated)

const dropdownValue = ref('Typed')
const textValue = ref('')
</script>

<template>
  <!-- ========== LANDING (not logged in) ========== -->
  <div v-if="!isLoggedIn" class="landing">
    <div class="landing-content">
      <img :src="SiporaLogo" alt="SIPORA" class="landing-logo" />
      <p class="landing-tagline">
        Dukung SMP Desa Putera menjadi lebih baik<br />melalui laporanmu.
      </p>
      <div class="landing-actions">
        <RouterLink to="/login" class="landing-btn landing-btn--login">
          Masuk
        </RouterLink>
        <RouterLink to="/register" class="landing-btn landing-btn--register">
          Daftar Akun
        </RouterLink>
      </div>
    </div>
  </div>

  <!-- ========== DESIGN SYSTEM (logged in) ========== -->
  <div v-else class="min-h-screen bg-general-frame p-8">
    <div class="max-w-5xl mx-auto space-y-12">

      <!-- Page Title -->
      <div>
        <h1 class="heading-h3 text-blue-500">SIPORA Design System</h1>
        <p class="body-b6 text-neutral-600 mt-2">Color palette, typography, dan reusable components.</p>
      </div>

      <!-- ======================
           SECTION: COLOR PALETTE
           ====================== -->
      <section>
        <h2 class="heading-h5 text-general-black mb-6">Color Palette</h2>

        <!-- Blue -->
        <div class="mb-6">
          <p class="subheading-s7 text-general-black mb-3">Blue</p>
          <div class="flex flex-wrap gap-3">
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-50"></div><span class="body-b8 text-neutral-600">50</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-100"></div><span class="body-b8 text-neutral-600">100</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-200"></div><span class="body-b8 text-neutral-600">200</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-300"></div><span class="body-b8 text-neutral-600">300</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-400"></div><span class="body-b8 text-neutral-600">400</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-500"></div><span class="body-b8 text-neutral-600">500</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-600"></div><span class="body-b8 text-neutral-600">600</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-700"></div><span class="body-b8 text-neutral-600">700</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-800"></div><span class="body-b8 text-neutral-600">800</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-blue-900"></div><span class="body-b8 text-neutral-600">900</span></div>
          </div>
        </div>

        <!-- Neutral -->
        <div class="mb-6">
          <p class="subheading-s7 text-general-black mb-3">Neutral</p>
          <div class="flex flex-wrap gap-3">
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-50"></div><span class="body-b8 text-neutral-600">50</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-100"></div><span class="body-b8 text-neutral-600">100</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-200"></div><span class="body-b8 text-neutral-600">200</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-300"></div><span class="body-b8 text-neutral-600">300</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-400"></div><span class="body-b8 text-neutral-600">400</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-500"></div><span class="body-b8 text-neutral-600">500</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-600"></div><span class="body-b8 text-neutral-600">600</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-700"></div><span class="body-b8 text-neutral-600">700</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-800"></div><span class="body-b8 text-neutral-600">800</span></div>
            <div class="flex flex-col items-center gap-1"><div class="w-14 h-14 rounded-lg border border-general-border bg-neutral-900"></div><span class="body-b8 text-neutral-600">900</span></div>
          </div>
        </div>

        <!-- General -->
        <div>
          <p class="subheading-s7 text-general-black mb-3">General</p>
          <div class="flex flex-wrap gap-3">
            <div class="flex flex-col items-center gap-1">
              <div class="w-14 h-14 rounded-lg border border-general-border bg-general-white"></div>
              <span class="body-b8 text-neutral-600">White</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-14 h-14 rounded-lg bg-general-black"></div>
              <span class="body-b8 text-neutral-600">Black</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-14 h-14 rounded-lg border border-general-border bg-general-frame"></div>
              <span class="body-b8 text-neutral-600">Frame</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-14 h-14 rounded-lg bg-general-border"></div>
              <span class="body-b8 text-neutral-600">Border</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-14 h-14 rounded-lg" style="background: var(--color-general-red)"></div>
              <span class="body-b8 text-neutral-600">Red</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ======================
           SECTION: TYPOGRAPHY
           ====================== -->
      <section>
        <h2 class="heading-h5 text-general-black mb-6">Typography</h2>

        <!-- Headings -->
        <div class="mb-8">
          <p class="subheading-s7 text-neutral-500 mb-4">Heading — Be Vietnam Pro 800</p>
          <div class="space-y-3 bg-general-white p-6 rounded-2xl border border-general-border">
            <p class="heading-h1 text-general-black">H1 — 60px</p>
            <p class="heading-h2 text-general-black">H2 — 48px</p>
            <p class="heading-h3 text-general-black">H3 — 36px</p>
            <p class="heading-h4 text-general-black">H4 — 28px</p>
            <p class="heading-h5 text-general-black">H5 — 24px</p>
            <p class="heading-h6 text-general-black">H6 — 20px</p>
            <p class="heading-h7 text-general-black">H7 — 16px</p>
            <p class="heading-h8 text-general-black">H8 — 12px</p>
            <p class="heading-h9 text-general-black">H9 — 8px</p>
          </div>
        </div>

        <!-- Sub-headings -->
        <div class="mb-8">
          <p class="subheading-s7 text-neutral-500 mb-4">Sub-heading — Be Vietnam Pro 600</p>
          <div class="space-y-3 bg-general-white p-6 rounded-2xl border border-general-border">
            <p class="subheading-s1 text-general-black">S1 — 60px</p>
            <p class="subheading-s2 text-general-black">S2 — 48px</p>
            <p class="subheading-s3 text-general-black">S3 — 36px</p>
            <p class="subheading-s4 text-general-black">S4 — 28px</p>
            <p class="subheading-s5 text-general-black">S5 — 24px</p>
            <p class="subheading-s6 text-general-black">S6 — 20px</p>
            <p class="subheading-s7 text-general-black">S7 — 16px</p>
            <p class="subheading-s8 text-general-black">S8 — 12px</p>
            <p class="subheading-s9 text-general-black">S9 — 8px</p>
          </div>
        </div>

        <!-- Body -->
        <div>
          <p class="subheading-s7 text-neutral-500 mb-4">Body — Plus Jakarta Sans 400</p>
          <div class="space-y-3 bg-general-white p-6 rounded-2xl border border-general-border">
            <p class="body-b1 text-general-black">B1 — 60px</p>
            <p class="body-b2 text-general-black">B2 — 48px</p>
            <p class="body-b3 text-general-black">B3 — 36px</p>
            <p class="body-b4 text-general-black">B4 — 28px</p>
            <p class="body-b5 text-general-black">B5 — 24px</p>
            <p class="body-b6 text-general-black">B6 — 20px</p>
            <p class="body-b7 text-general-black">B7 — 16px</p>
            <p class="body-b8 text-general-black">B8 — 12px</p>
            <p class="body-b9 text-general-black">B9 — 8px</p>
          </div>
        </div>
      </section>

      <!-- ======================
           SECTION: COMPONENTS
           ====================== -->
      <section>
        <h2 class="heading-h5 text-general-black mb-6">Components</h2>

        <!-- --- TextField --- -->
        <div class="mb-10">
          <h3 class="subheading-s6 text-blue-500 mb-4">TextField</h3>
          <div class="bg-general-white p-8 rounded-2xl border border-general-border space-y-8">

            <!-- Dropdown with value -->
            <div class="max-w-lg">
              <p class="body-b8 text-neutral-500 mb-2">Dropdown — filled value</p>
              <STextField
                label="Label"
                :required="true"
                variant="dropdown"
                v-model="dropdownValue"
              />
            </div>

            <!-- Dropdown empty / placeholder -->
            <div class="max-w-lg">
              <p class="body-b8 text-neutral-500 mb-2">Dropdown — placeholder</p>
              <STextField
                label="Label"
                :required="true"
                variant="dropdown"
                placeholder="Ketik di sini..."
              />
            </div>

            <!-- Plain text input -->
            <div class="max-w-lg">
              <p class="body-b8 text-neutral-500 mb-2">Text input — plain</p>
              <STextField
                label="Label"
                variant="text"
                placeholder="Ketik di sini..."
                v-model="textValue"
              />
            </div>
          </div>
        </div>

        <!-- --- Card --- -->
        <div class="mb-10">
          <h3 class="subheading-s6 text-blue-500 mb-4">Card</h3>
          <div class="bg-general-white p-8 rounded-2xl border border-general-border">
            <SCard>
              <p class="subheading-s7 text-general-black">Card Title</p>
              <p class="body-b7 text-neutral-600">Ini adalah contoh konten di dalam SCard. Card ini bisa menampung apapun melalui slot.</p>
              <SButton label="Action" variant="primary" />
            </SCard>
          </div>
        </div>

        <!-- --- Chip --- -->
        <div class="mb-10">
          <h3 class="subheading-s6 text-blue-500 mb-4">Chip</h3>
          <div class="bg-general-white p-8 rounded-2xl border border-general-border">
            <div class="flex flex-wrap gap-4 items-center">

              <!-- Outline -->
              <SChip label="Outline" variant="outline">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M7.94886 1.46505C7.27087 1.45705 6.60726 1.68105 6.1362 2.15239L1.5112 6.88106C1.31227 7.0844 1.259 7.37705 1.3862 7.63171L1.99033 8.83972L1.96953 12.6524C1.96947 13.4064 2.57366 14.0064 3.32366 14.0064H6.11533C6.7802 14.0064 7.32353 13.463 7.32353 12.7984V9.92305C7.32353 9.60039 7.5842 9.33972 7.90686 9.33972H8.07353C8.3962 9.33972 8.65686 9.60039 8.65686 9.92305V12.7984C8.65686 13.463 9.2002 14.0064 9.86553 14.0064H12.6569C13.4069 14.0064 14.0109 13.4024 14.0109 12.6524L13.9902 8.83972L14.5942 7.63171C14.7229 7.37505 14.6722 7.06373 14.4695 6.86039C14.2962 6.68706 10.2195 2.61039 9.80286 2.19373C9.31953 1.7104 8.6262 1.47238 7.94886 1.46505ZM7.94886 2.79838C8.2842 2.80505 8.61886 2.92705 8.84419 3.15239C9.23153 3.53905 12.5349 6.84238 13.1775 7.48572L12.7195 8.38106C12.6729 8.47506 12.6562 8.56839 12.6569 8.67305L12.6775 12.6524C12.6775 12.6617 12.6709 12.6731 12.6569 12.6731H9.9902V9.92305C9.9902 8.86372 9.13286 8.00639 8.07353 8.00639H7.90686C6.84753 8.00639 5.99033 8.86372 5.99033 9.92305V12.6731H3.32366C3.31006 12.6731 3.30287 12.6657 3.30287 12.6524L3.32366 8.67305C3.32433 8.56839 3.30807 8.47506 3.2612 8.38106L2.80287 7.46505L7.07353 3.08972C7.27953 2.88372 7.61287 2.79105 7.94886 2.79838Z" fill="#2E3094"/>
                  </svg>
                </template>
              </SChip>

              <!-- Outline Filled -->
              <SChip label="Outline Filled" variant="outline-filled">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M7.94886 1.46505C7.27087 1.45705 6.60726 1.68105 6.1362 2.15239L1.5112 6.88106C1.31227 7.0844 1.259 7.37705 1.3862 7.63171L1.99033 8.83972L1.96953 12.6524C1.96947 13.4064 2.57366 14.0064 3.32366 14.0064H6.11533C6.7802 14.0064 7.32353 13.463 7.32353 12.7984V9.92305C7.32353 9.60039 7.5842 9.33972 7.90686 9.33972H8.07353C8.3962 9.33972 8.65686 9.60039 8.65686 9.92305V12.7984C8.65686 13.463 9.2002 14.0064 9.86553 14.0064H12.6569C13.4069 14.0064 14.0109 13.4024 14.0109 12.6524L13.9902 8.83972L14.5942 7.63171C14.7229 7.37505 14.6722 7.06373 14.4695 6.86039C14.2962 6.68706 10.2195 2.61039 9.80286 2.19373C9.31953 1.7104 8.6262 1.47238 7.94886 1.46505ZM7.94886 2.79838C8.2842 2.80505 8.61886 2.92705 8.84419 3.15239C9.23153 3.53905 12.5349 6.84238 13.1775 7.48572L12.7195 8.38106C12.6729 8.47506 12.6562 8.56839 12.6569 8.67305L12.6775 12.6524C12.6775 12.6617 12.6709 12.6731 12.6569 12.6731H9.9902V9.92305C9.9902 8.86372 9.13286 8.00639 8.07353 8.00639H7.90686C6.84753 8.00639 5.99033 8.86372 5.99033 9.92305V12.6731H3.32366C3.31006 12.6731 3.30287 12.6657 3.30287 12.6524L3.32366 8.67305C3.32433 8.56839 3.30807 8.47506 3.2612 8.38106L2.80287 7.46505L7.07353 3.08972C7.27953 2.88372 7.61287 2.79105 7.94886 2.79838Z" fill="#2E3094"/>
                  </svg>
                </template>
              </SChip>

              <!-- Solid -->
              <SChip label="Solid" variant="solid">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M7.94886 1.46505C7.27087 1.45705 6.60726 1.68105 6.1362 2.15239L1.5112 6.88106C1.31227 7.0844 1.259 7.37705 1.3862 7.63171L1.99033 8.83972L1.96953 12.6524C1.96947 13.4064 2.57366 14.0064 3.32366 14.0064H6.11533C6.7802 14.0064 7.32353 13.463 7.32353 12.7984V9.92305C7.32353 9.60039 7.5842 9.33972 7.90686 9.33972H8.07353C8.3962 9.33972 8.65686 9.60039 8.65686 9.92305V12.7984C8.65686 13.463 9.2002 14.0064 9.86553 14.0064H12.6569C13.4069 14.0064 14.0109 13.4024 14.0109 12.6524L13.9902 8.83972L14.5942 7.63171C14.7229 7.37505 14.6722 7.06373 14.4695 6.86039C14.2962 6.68706 10.2195 2.61039 9.80286 2.19373C9.31953 1.7104 8.6262 1.47238 7.94886 1.46505ZM7.94886 2.79838C8.2842 2.80505 8.61886 2.92705 8.84419 3.15239C9.23153 3.53905 12.5349 6.84238 13.1775 7.48572L12.7195 8.38106C12.6729 8.47506 12.6562 8.56839 12.6569 8.67305L12.6775 12.6524C12.6775 12.6617 12.6709 12.6731 12.6569 12.6731H9.9902V9.92305C9.9902 8.86372 9.13286 8.00639 8.07353 8.00639H7.90686C6.84753 8.00639 5.99033 8.86372 5.99033 9.92305V12.6731H3.32366C3.31006 12.6731 3.30287 12.6657 3.30287 12.6524L3.32366 8.67305C3.32433 8.56839 3.30807 8.47506 3.2612 8.38106L2.80287 7.46505L7.07353 3.08972C7.27953 2.88372 7.61287 2.79105 7.94886 2.79838Z" fill="white"/>
                  </svg>
                </template>
              </SChip>

              <!-- Light -->
              <SChip label="Light" variant="light">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M7.94886 1.46505C7.27087 1.45705 6.60726 1.68105 6.1362 2.15239L1.5112 6.88106C1.31227 7.0844 1.259 7.37705 1.3862 7.63171L1.99033 8.83972L1.96953 12.6524C1.96947 13.4064 2.57366 14.0064 3.32366 14.0064H6.11533C6.7802 14.0064 7.32353 13.463 7.32353 12.7984V9.92305C7.32353 9.60039 7.5842 9.33972 7.90686 9.33972H8.07353C8.3962 9.33972 8.65686 9.60039 8.65686 9.92305V12.7984C8.65686 13.463 9.2002 14.0064 9.86553 14.0064H12.6569C13.4069 14.0064 14.0109 13.4024 14.0109 12.6524L13.9902 8.83972L14.5942 7.63171C14.7229 7.37505 14.6722 7.06373 14.4695 6.86039C14.2962 6.68706 10.2195 2.61039 9.80286 2.19373C9.31953 1.7104 8.6262 1.47238 7.94886 1.46505ZM7.94886 2.79838C8.2842 2.80505 8.61886 2.92705 8.84419 3.15239C9.23153 3.53905 12.5349 6.84238 13.1775 7.48572L12.7195 8.38106C12.6729 8.47506 12.6562 8.56839 12.6569 8.67305L12.6775 12.6524C12.6775 12.6617 12.6709 12.6731 12.6569 12.6731H9.9902V9.92305C9.9902 8.86372 9.13286 8.00639 8.07353 8.00639H7.90686C6.84753 8.00639 5.99033 8.86372 5.99033 9.92305V12.6731H3.32366C3.31006 12.6731 3.30287 12.6657 3.30287 12.6524L3.32366 8.67305C3.32433 8.56839 3.30807 8.47506 3.2612 8.38106L2.80287 7.46505L7.07353 3.08972C7.27953 2.88372 7.61287 2.79105 7.94886 2.79838Z" fill="#2A2C87"/>
                  </svg>
                </template>
              </SChip>
            </div>
          </div>
        </div>

        <!-- --- Button --- -->
        <div class="mb-10">
          <h3 class="subheading-s6 text-blue-500 mb-4">Button</h3>
          <div class="bg-general-white p-8 rounded-2xl border border-general-border">

            <p class="body-b8 text-neutral-500 mb-3">Default states (hover for interaction)</p>
            <div class="flex flex-wrap gap-4 items-center mb-8">

              <!-- Primary -->
              <SButton label="Primary" variant="primary">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5.3163 19.4384C5.92462 18.0052 7.34492 17 9 17H15C16.6551 17 18.0754 18.0052 18.6837 19.4384M16 9.5C16 11.7091 14.2091 13.5 12 13.5C9.79086 13.5 8 11.7091 8 9.5C8 7.29086 9.79086 5.5 12 5.5C14.2091 5.5 16 7.29086 16 9.5ZM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </template>
              </SButton>

              <!-- Secondary -->
              <SButton label="Secondary" variant="secondary">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5.3163 19.4384C5.92462 18.0052 7.34492 17 9 17H15C16.6551 17 18.0754 18.0052 18.6837 19.4384M16 9.5C16 11.7091 14.2091 13.5 12 13.5C9.79086 13.5 8 11.7091 8 9.5C8 7.29086 9.79086 5.5 12 5.5C14.2091 5.5 16 7.29086 16 9.5ZM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#2A2C87" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </template>
              </SButton>

              <!-- Ghost -->
              <SButton label="Ghost" variant="ghost">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5.3163 19.4384C5.92462 18.0052 7.34492 17 9 17H15C16.6551 17 18.0754 18.0052 18.6837 19.4384M16 9.5C16 11.7091 14.2091 13.5 12 13.5C9.79086 13.5 8 11.7091 8 9.5C8 7.29086 9.79086 5.5 12 5.5C14.2091 5.5 16 7.29086 16 9.5ZM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#2A2C87" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </template>
              </SButton>
            </div>

            <p class="body-b8 text-neutral-500 mb-3">Without icon</p>
            <div class="flex flex-wrap gap-4 items-center mb-8">
              <SButton label="Primary" variant="primary" />
              <SButton label="Secondary" variant="secondary" />
              <SButton label="Ghost" variant="ghost" />
            </div>

            <p class="body-b8 text-neutral-500 mb-3">Disabled</p>
            <div class="flex flex-wrap gap-4 items-center">
              <SButton label="Primary" variant="primary" :disabled="true" />
              <SButton label="Secondary" variant="secondary" :disabled="true" />
              <SButton label="Ghost" variant="ghost" :disabled="true" />
            </div>
          </div>
        </div>

      </section>
    </div>
  </div>
</template>

<style scoped>
/* ── Landing Page Styles ── */
.landing {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  background: linear-gradient(160deg, var(--color-blue-50) 0%, var(--color-general-frame) 40%, white 100%);
  padding: 32px 24px;
}

.landing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 360px;
  animation: fadeUp 0.6s ease-out;
}

.landing-logo {
  height: 48px;
  width: auto;
  margin-bottom: 20px;
}

.landing-tagline {
  font-family: var(--font-plus-jakarta);
  font-weight: 400;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-neutral-500);
  margin-bottom: 28px;
}

.landing-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.landing-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-be-vietnam);
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.25s ease;
  cursor: pointer;
}

.landing-btn--login {
  background: var(--color-blue-500);
  color: white;
  box-shadow: 0 4px 16px rgba(46, 48, 148, 0.25);
}

.landing-btn--login:hover {
  background: var(--color-blue-600);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(46, 48, 148, 0.35);
}

.landing-btn--register {
  background: white;
  color: var(--color-blue-600);
  border: 1.5px solid var(--color-blue-300);
}

.landing-btn--register:hover {
  background: var(--color-blue-50);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(46, 48, 148, 0.1);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 480px) {
  .landing-logo {
    height: 60px;
  }

  .landing-tagline {
    font-size: 15px;
  }

  .landing-actions {
    flex-direction: row;
    justify-content: center;
    width: auto;
  }
}
</style>