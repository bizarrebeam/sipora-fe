import { ref, onMounted, onUnmounted, nextTick } from 'vue'

export function useRevealOnScroll() {
    const el = ref<HTMLElement | null>(null)
    const isVisible = ref(false)

    let observer: IntersectionObserver | null = null

    onMounted(async () => {
        await nextTick() // ⬅️ tunggu DOM benar-benar siap

        observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    isVisible.value = true
                } else {
                    isVisible.value = false
                }
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -80px 0px'
            }
        )

        if (el.value) {
            observer.observe(el.value)
        }
    })

    onUnmounted(() => {
        observer?.disconnect()
    })

    return { el, isVisible }
}