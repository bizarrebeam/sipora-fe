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
        perPage: "data",
        noRows: "Tidak ada data ditemukan",
        info: "Menampilkan {start} - {end} dari {rows}",
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
.s-datatable-wrapper :deep(.datatable-wrapper),
.s-datatable-wrapper :deep(.dataTable-wrapper) {
  font-family: "Be Vietnam Pro", sans-serif;
}

.s-datatable-wrapper :deep(.datatable-top),
.s-datatable-wrapper :deep(.dataTable-top) {
  padding: 0 0 8px 0 !important;
  margin: 0 !important;
}

.s-datatable-wrapper :deep(.datatable-table thead th),
.s-datatable-wrapper :deep(.dataTable-table thead th) {
  background-color: #F1F5F9 !important;
  color: #64748B !important;
  font-family: var(--font-be-vietnam);
  font-weight: 700 !important;
  font-size: 12px !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 16px !important;
  border: none !important;
  border-bottom: 2px solid #E2E8F0 !important;
}

.s-datatable-wrapper :deep(.datatable-table tbody td),
.s-datatable-wrapper :deep(.dataTable-table tbody td) {
  padding: 12px 16px !important;
  border-bottom: 1px solid #F1F5F9 !important;
  color: var(--color-general-black) !important;
  font-size: 14px !important;
}

.s-datatable-wrapper :deep(.datatable-dropdown),
.s-datatable-wrapper :deep(.dataTable-dropdown) {
  float: left;
}

.s-datatable-wrapper :deep(.datatable-dropdown label),
.s-datatable-wrapper :deep(.dataTable-dropdown label) {
  color: #94A3B8 !important;
  font-size: 12px !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.s-datatable-wrapper :deep(.datatable-dropdown select),
.s-datatable-wrapper :deep(.dataTable-dropdown select) {
  padding: 2px 24px 2px 8px !important;
  font-size: 12px !important;
  color: #64748B !important;
  border: 1px solid #E2E8F0 !important;
  border-radius: 4px !important;
  background-color: white !important;
  cursor: pointer;
  outline: none;
}

.s-datatable-wrapper :deep(.datatable-bottom),
.s-datatable-wrapper :deep(.dataTable-bottom) {
  padding: 16px 0 0 0 !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.s-datatable-wrapper :deep(.datatable-info),
.s-datatable-wrapper :deep(.dataTable-info) {
  margin: 0 !important;
  font-size: 12px !important;
  color: #94A3B8 !important;
}

.s-datatable-wrapper :deep(.datatable-pagination ul),
.s-datatable-wrapper :deep(.dataTable-pagination ul) {
  margin: 0 !important;
  padding: 0 !important;
  display: flex;
  gap: 4px;
}

.s-datatable-wrapper :deep(.datatable-pagination a),
.s-datatable-wrapper :deep(.dataTable-pagination a) {
  border: none !important;
  background: transparent !important;
  color: #64748B !important;
  font-size: 12px !important;
  padding: 4px 10px !important;
  border-radius: 4px !important;
  cursor: pointer;
}

.s-datatable-wrapper :deep(.datatable-pagination a:hover),
.s-datatable-wrapper :deep(.dataTable-pagination a:hover) {
  background-color: #F1F5F9 !important;
  color: var(--color-general-black) !important;
}

.s-datatable-wrapper :deep(.datatable-pagination .active a),
.s-datatable-wrapper :deep(.dataTable-pagination .active a) {
  background-color: var(--color-blue-600) !important;
  color: white !important;
  font-weight: 600 !important;
}
</style>