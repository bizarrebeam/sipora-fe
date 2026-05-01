<script setup lang="ts">
export interface FlowStep {
  id: string
  label: string
  type: 'default' | 'success' | 'cancel'
}

export interface FlowBranch {
  arrowLabel: string
  steps: FlowStep[]
}

export type FlowItem =
  | { kind: 'step'; step: FlowStep }
  | { kind: 'branches'; branches: FlowBranch[]; merge?: boolean }

defineProps<{ flow: FlowItem[] }>()
</script>

<template>
  <div class="s-flowchart">
    <template v-for="(item, idx) in flow" :key="idx">
      
      <template v-if="item.kind === 'step'">
        <div v-if="idx > 0" class="fc-arrow-down">
          <div class="fc-arrow-line"></div>
          <div class="fc-arrow-head"></div>
        </div>
        <div class="fc-node" :class="`fc-node-${item.step.type}`">
          {{ item.step.label }}
        </div>
      </template>

      <template v-else-if="item.kind === 'branches'">
        <div v-if="idx > 0" class="fc-line-vertical"></div>
        
        <div class="fc-split-container">
           <div class="fc-split-spacer"></div>
           <template v-if="item.branches.length === 2">
              <div class="fc-bridge-wrapper">
                 <div class="fc-bridge-full-inner"></div>
              </div>
           </template>
           <template v-else-if="item.branches.length === 3">
              <div class="fc-bridge-wrapper">
                 <div class="fc-bridge-left-inner"></div>
              </div>
              <div class="fc-bridge-wrapper">
                 <div class="fc-bridge-right-inner"></div>
              </div>
           </template>
           <div class="fc-split-spacer"></div>
        </div>

        <div class="fc-branches-row">
          <div v-for="(branch, bi) in item.branches" :key="bi" class="fc-branch-col">
            <div class="fc-arrow-down fc-arrow-branch">
              <div class="fc-arrow-line fc-arrow-line-long"></div>
              <div class="fc-arrow-head"></div>
              <div class="fc-branch-arrow-label">{{ branch.arrowLabel }}</div>
            </div>
            
            <template v-for="(bStep, si) in branch.steps" :key="si">
              <div v-if="si > 0" class="fc-arrow-down">
                <div class="fc-arrow-line"></div>
                <div class="fc-arrow-head"></div>
              </div>
              <div class="fc-node" :class="`fc-node-${bStep.type}`">
                {{ bStep.label }}
              </div>
            </template>
            
            <div v-if="item.merge" class="fc-line-vertical"></div>
          </div>
        </div>

        <div v-if="item.merge" class="fc-merge-container">
           <div class="fc-merge-spacer"></div>
           <template v-if="item.branches.length === 2">
              <div class="fc-bridge-wrapper">
                 <div class="fc-merge-full-inner"></div>
              </div>
           </template>
           <template v-else-if="item.branches.length === 3">
              <div class="fc-bridge-wrapper">
                 <div class="fc-merge-left-inner"></div>
              </div>
              <div class="fc-bridge-wrapper">
                 <div class="fc-merge-right-inner"></div>
              </div>
           </template>
           <div class="fc-merge-spacer"></div>
        </div>
        
      </template>

    </template>
  </div>
</template>

<style scoped>
.s-flowchart {
  display: flex;
  flex-direction: column;
  width: 100%;
  animation: fadeUp 0.35s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fc-arrow-down {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
}
.fc-arrow-line { width: 2px; height: 24px; background: #bebfde; }
.fc-arrow-line-long { height: 42px; }
.fc-arrow-head { width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #bebfde; }
.fc-line-vertical { width: 2px; height: 24px; background: #bebfde; margin: 0 auto; }

.fc-node {
  width: 180px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 0 16px;
  text-align: center;
  margin: 0 auto;
  line-height: 1.35;
  border: none; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); 
}
.fc-node-default { background: #eaeaf4; color: #2e3094; }
.fc-node-success { background: #2e3094; color: white; }
.fc-node-cancel { background: #2e3094; color: white; }

.fc-split-container, .fc-merge-container {
  display: flex;
  width: 100%;
  height: 24px;
  font-size: 0;
  line-height: 0;
}
.fc-split-spacer, .fc-merge-spacer { flex: 0.5; }

.fc-bridge-wrapper {
  flex: 1;
  position: relative;
  height: 100%;
}

.fc-bridge-full-inner {
  position: absolute; top: 0; bottom: 0; left: -1px; right: -1px;
  border-top: 2px solid #bebfde;
  border-left: 2px solid #bebfde;
  border-right: 2px solid #bebfde;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.fc-bridge-left-inner {
  position: absolute; top: 0; bottom: 0; left: -1px; right: 0;
  border-top: 2px solid #bebfde;
  border-left: 2px solid #bebfde;
  border-right: 1px solid #bebfde;
  border-top-left-radius: 12px;
}
.fc-bridge-right-inner {
  position: absolute; top: 0; bottom: 0; left: 0; right: -1px;
  border-top: 2px solid #bebfde;
  border-right: 2px solid #bebfde;
  border-left: 1px solid #bebfde;
  border-top-right-radius: 12px;
}

.fc-merge-full-inner {
  position: absolute; top: 0; bottom: 0; left: -1px; right: -1px;
  border-bottom: 2px solid #bebfde;
  border-left: 2px solid #bebfde;
  border-right: 2px solid #bebfde;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
.fc-merge-left-inner {
  position: absolute; top: 0; bottom: 0; left: -1px; right: 0;
  border-bottom: 2px solid #bebfde;
  border-left: 2px solid #bebfde;
  border-right: 1px solid #bebfde;
  border-bottom-left-radius: 12px;
}
.fc-merge-right-inner {
  position: absolute; top: 0; bottom: 0; left: 0; right: -1px;
  border-bottom: 2px solid #bebfde;
  border-right: 2px solid #bebfde;
  border-left: 1px solid #bebfde;
  border-bottom-right-radius: 12px;
}

.fc-branches-row {
  display: flex;
  width: 100%;
}
.fc-branch-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.fc-arrow-branch {
  position: relative;
}
.fc-branch-arrow-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 4px 8px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #5859a9;
  white-space: nowrap;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .s-flowchart {
    min-width: 600px;
  }
}
</style>
