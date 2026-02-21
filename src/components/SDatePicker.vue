<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue?: Date | null
  time?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date | null): void
}>()

const currentDate = ref(props.modelValue || new Date())

// Calendar Logic
const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const firstDayOfMonth = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay())

const calendarDays = computed(() => {
  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth.value; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth.value; i++) {
    days.push(i)
  }
  return days
})

const isToday = (day: number | null) => {
  if (!day) return false
  const today = new Date()
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  )
}

const isSelected = (day: number | null) => {
  if (!day || !props.modelValue) return false
  return (
    day === props.modelValue.getDate() &&
    currentMonth.value === props.modelValue.getMonth() &&
    currentYear.value === props.modelValue.getFullYear()
  )
}

const selectDate = (day: number | null) => {
  if (!day) return
  const newDate = new Date(currentYear.value, currentMonth.value, day)
  if (props.modelValue && props.time) {
    newDate.setHours(props.modelValue.getHours())
    newDate.setMinutes(props.modelValue.getMinutes())
  }
  emit('update:modelValue', newDate)
}

const prevMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

// Time Logic
const timeSlots = computed(() => {
  const slots: string[] = []
  for (let h = 8; h <= 18; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
    slots.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return slots
})

const isTimeSelected = (timeStr: string) => {
  if (!props.modelValue) return false
  const [hours, minutes] = timeStr.split(':').map(Number)
  return props.modelValue.getHours() === hours && props.modelValue.getMinutes() === minutes
}

const selectTime = (timeStr: string) => {
  const parts = timeStr.split(':')
  const hours = parseInt(parts[0] || '0', 10)
  const minutes = parseInt(parts[1] || '0', 10)
  const newDate = props.modelValue ? new Date(props.modelValue) : new Date(currentDate.value)
  if (!props.modelValue) {
    newDate.setHours( hours, minutes, 0, 0 )
  } else {
    newDate.setHours( hours, minutes )
  }
  emit('update:modelValue', newDate)
}

const formattedSelectedDate = computed(() => {
  if (!props.modelValue) return 'Select a date'
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][props.modelValue.getDay()]
  const monthName = monthNames[props.modelValue.getMonth()]
  const day = props.modelValue.getDate()
  return `${dayName}, ${monthName} ${day}`
})

</script>

<template>
  <div 
    class="flex h-[453px] items-start rounded-2xl border border-general-border bg-white p-8"
    :class="time ? 'w-[715px] gap-6' : 'w-[426px]'"
  >
    <!-- Calendar Section -->
    <div class="flex w-[351px] shrink-0 flex-col items-start gap-6">
      <h3 class="w-full text-general-black heading-h6">Select a Date {{ time ? '& Time' : '' }}</h3>
      
      <div class="flex w-full flex-col items-start gap-4">
        <!-- Month Navigation -->
        <div class="flex w-full items-center justify-between">
          <button 
            type="button"
            class="flex size-[38px] cursor-pointer items-center justify-center rounded-full text-general-black hover:bg-neutral-50"
            @click="prevMonth"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <span class="text-center text-general-black subheading-s7">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
          <button 
            type="button"
            class="flex size-[38px] cursor-pointer items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100"
            @click="nextMonth"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Days Grid -->
        <div class="flex w-full items-start gap-2">
          <div 
            v-for="dayName in ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']" 
            :key="dayName"
            class="flex flex-1 flex-col items-center justify-center gap-4"
          >
            <div class="w-11 text-center text-general-black body-b8 uppercase">{{ dayName }}</div>
            <div class="flex flex-col items-center justify-center gap-2">
              <template v-for="(day, index) in calendarDays" :key="index">
                <button
                  v-if="index % 7 === ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].indexOf(dayName)"
                  type="button"
                  class="relative flex size-11 items-center justify-center rounded-full text-[16px] leading-[1.5] transition-colors"
                  :class="[
                    !day ? 'invisible' : '',
                    isSelected(day) ? 'bg-blue-50 text-blue-500 font-bold hover:bg-blue-100' : 'text-neutral-600 font-normal hover:bg-neutral-50'
                  ]"
                  @click="selectDate(day)"
                >
                  {{ day }}
                  <div v-if="isToday(day)" class="absolute bottom-1.5 size-1 rounded-sm bg-neutral-600"></div>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Time Section -->
    <div v-if="time" class="flex w-[276px] shrink-0 flex-col items-start gap-[22px] overflow-hidden h-full pb-4">
      <span class="text-neutral-600 body-b7">{{ formattedSelectedDate }}</span>
      <div class="flex w-full flex-1 flex-col items-start overflow-y-auto pr-2 custom-scrollbar">
        <div 
          v-for="timeSlot in timeSlots" 
          :key="timeSlot"
          class="w-full p-1 shrink-0"
        >
          <button
            type="button"
            class="flex w-full items-center justify-center rounded-lg border px-6 py-3 transition-colors subheading-s8"
            :class="isTimeSelected(timeSlot) ? 'border-general-black bg-general-black text-white' : 'border-blue-500 text-blue-500 hover:bg-blue-50'"
            @click="selectTime(timeSlot)"
          >
            {{ timeSlot }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-general-border, #D9D9D9);
  border-radius: 4px;
}
</style>
