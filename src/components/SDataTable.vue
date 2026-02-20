<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { DataTable } from 'simple-datatables'
import 'simple-datatables/dist/style.css'

const props = defineProps<{
  headers: string[]
  data: any[][]
}>()

const tableRef = ref<HTMLTableElement | null>(null)
let dataTableInstance: DataTable | null = null

function initTable() {
  if (tableRef.value) {
    if (dataTableInstance) {
      dataTableInstance.destroy()
    }
    dataTableInstance = new DataTable(tableRef.value, {
      data: {
        headings: props.headers,
        data: props.data
      },
      searchable: false,
      perPage: 10,
      perPageSelect: [5, 10, 25, 50],
      labels: {
        placeholder: "Cari...",
        perPage: "data", // Teks dipersingkat agar muat rapi di dropdown kecil
        noRows: "Tidak ada data ditemukan",
        info: "Menampilkan {start} - {end} dari {rows}", // Format lebih ringkas
      }
    })
  }
}

onMounted(() => {
  initTable()
})

watch(() => props.data, () => {
  initTable()
}, { deep: true })

onBeforeUnmount(() => {
  if (dataTableInstance) {
    dataTableInstance.destroy()
  }
})
</script>

<template>
  <div class="s-datatable-wrapper">
    <table ref="tableRef"></table>
  </div>
</template>

<style scoped>
/* Reset font global wrapper */
.s-datatable-wrapper :deep(.dataTable-wrapper) {
  font-family: var(--font-plus-jakarta);
  font-size: 14px;
}

/* Mengatur jarak (Gap) bagian atas */
.s-datatable-wrapper :deep(.dataTable-top) {
  padding: 0 0 12px 0; /* Hapus padding atas, kurangi padding bawah */
  margin: 0;
}

/* Tabel Header yang berbeda warna */
.s-datatable-wrapper :deep(.dataTable-table thead th) {
  background-color: #F8FAFC; /* Abu-abu sangat muda (Slate-50) */
  color: var(--color-neutral-600);
  font-family: var(--font-be-vietnam);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-general-border);
  border-top: 1px solid var(--color-general-border);
}

/* Tabel Body */
.s-datatable-wrapper :deep(.dataTable-table tbody td) {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-general-border);
  color: var(--color-general-black);
  vertical-align: middle;
}

/* Styling Dropdown (Select) agar kecil dan abu-abu */
.s-datatable-wrapper :deep(.dataTable-dropdown) {
  float: left;
}

.s-datatable-wrapper :deep(.dataTable-dropdown label) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-neutral-400); /* Warna teks label abu-abu */
}

.s-datatable-wrapper :deep(.dataTable-dropdown select) {
  padding: 4px 28px 4px 8px;
  font-size: 12px;
  border: 1px solid var(--color-general-border);
  border-radius: 6px;
  color: var(--color-neutral-500);
  background-color: white;
  cursor: pointer;
  outline: none;
  font-family: var(--font-plus-jakarta);
}

.s-datatable-wrapper :deep(.dataTable-dropdown select:hover) {
  border-color: var(--color-neutral-400);
}

/* Styling Info Teks (Menampilkan x dari y) */
.s-datatable-wrapper :deep(.dataTable-bottom) {
  padding: 16px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.s-datatable-wrapper :deep(.dataTable-info) {
  margin: 0;
  font-size: 12px;
  color: var(--color-neutral-400); /* Warna abu-abu */
}

/* Pagination Styling */
.s-datatable-wrapper :deep(.dataTable-pagination ul) {
  margin: 0;
  padding: 0;
  display: flex;
  gap: 4px;
}

.s-datatable-wrapper :deep(.dataTable-pagination a) {
  border: none;
  background: transparent;
  color: var(--color-neutral-500);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.s-datatable-wrapper :deep(.dataTable-pagination a:hover) {
  background-color: var(--color-neutral-100);
  color: var(--color-general-black);
}

.s-datatable-wrapper :deep(.dataTable-pagination .active a) {
  background-color: var(--color-blue-600);
  color: white;
  font-weight: 600;
}
</style>