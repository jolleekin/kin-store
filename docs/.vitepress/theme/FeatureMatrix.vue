<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ full?: boolean }>(), { full: false });

const rows = [
  {
    label: 'Bundle size',
    kin: 'bundle',
    zustand: '~1.1 KB', redux: '~10 KB', jotai: '~3.5 KB', mobx: '~16 KB',
    trimmed: true,
  },
  { label: 'Zero dependencies',         kin: '✅', zustand: '✅', redux: '❌', jotai: '✅', mobx: '✅', trimmed: true },
  { label: 'Tiny footprint',            kin: '✅', zustand: '✅', redux: '❌', jotai: '✅', mobx: '❌' },
  { label: '100% type-safe',            kin: '✅', zustand: '⚠️', redux: '⚠️', jotai: '✅', mobx: '✅', trimmed: true },
  { label: 'Low boilerplate',           kin: '✅', zustand: '⚠️', redux: '❌', jotai: '⚠️', mobx: '⚠️', trimmed: true },
  { label: 'Linear plugin composition', kin: '✅', zustand: '❌', redux: '❌', jotai: '—',  mobx: '—' },
  { label: 'Separate state and logic',  kin: '✅', zustand: '❌', redux: '✅', jotai: '—',  mobx: '✅' },
  { label: 'Opt-in complexity',         kin: '✅', zustand: '⚠️', redux: '❌', jotai: '⚠️', mobx: '❌', trimmed: true },
  { label: 'No hidden magic',           kin: '✅', zustand: '✅', redux: '✅', jotai: '⚠️', mobx: '❌', trimmed: true },
  { label: 'Reactive composition',      kin: '✅', zustand: '⚠️', redux: '❌', jotai: '✅', mobx: '✅' },
];

const visibleRows = computed(() =>
  props.full ? rows : rows.filter((r) => r.trimmed),
);
</script>

<template>
  <section class="feature-matrix" :class="{ 'is-full': full }">
    <div class="feature-matrix-inner">
      <h2 v-if="!full" class="feature-matrix-heading">How it compares</h2>
      <div class="matrix-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th></th>
              <th class="kin">Kin Store</th>
              <th>Zustand</th>
              <th>Redux / RTK</th>
              <th>Jotai</th>
              <th>MobX</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.label">
              <td>{{ row.label }}</td>
              <td v-if="row.kin === 'bundle'" class="kin">
                <div class="size-grid">
                  <span class="size-line">244 B</span><span class="size-label">minimal</span>
                  <span class="size-line">465 B</span><span class="size-label">composition</span>
                  <span class="size-line">1.07 KB</span><span class="size-label">plugin support</span>
                </div>
              </td>
              <td v-else class="kin">{{ row.kin }}</td>
              <td :class="{ na: row.zustand === '—' }">{{ row.zustand }}</td>
              <td :class="{ na: row.redux   === '—' }">{{ row.redux }}</td>
              <td :class="{ na: row.jotai   === '—' }">{{ row.jotai }}</td>
              <td :class="{ na: row.mobx    === '—' }">{{ row.mobx }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!full" class="feature-matrix-cta">
        <a href="/comparison">See full comparison with code examples →</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.feature-matrix {
  padding: 0 24px 80px;
}

.feature-matrix.is-full {
  padding: 0 0 40px;
}

.feature-matrix-inner {
  max-width: 720px;
  margin: 0 auto;
}

.feature-matrix.is-full .feature-matrix-inner {
  max-width: 100%;
}

.feature-matrix-heading {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.matrix-wrapper {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
}

.matrix-table th,
.matrix-table td {
  padding: 9px 16px;
  text-align: center;
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.matrix-table th:first-child,
.matrix-table td:first-child {
  text-align: left;
  white-space: normal;
  color: var(--vp-c-text-2);
}

.matrix-table thead th {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid var(--vp-c-divider);
  padding-bottom: 10px;
}

.matrix-table th.kin,
.matrix-table td.kin {
  color: var(--vp-c-brand-3);
  font-weight: 700;
}

.matrix-table tbody tr:last-child td {
  border-bottom: none;
}

.na {
  color: var(--vp-c-text-3);
}

.size-grid {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0 8px;
}

.size-line {
  text-align: right;
  line-height: 20px;
}

.size-label {
  font-size: 12px;
  font-weight: 400;
  color: var(--vp-c-text-2);
  line-height: 20px;
  text-align: left;
}

.feature-matrix-cta {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.feature-matrix-cta a {
  color: var(--vp-c-brand-3);
  font-weight: 500;
  text-decoration: none;
}

.feature-matrix-cta a:hover {
  text-decoration: underline;
}
</style>
