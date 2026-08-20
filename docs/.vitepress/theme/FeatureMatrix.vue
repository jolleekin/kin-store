<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ full?: boolean }>(), { full: false });

type Notes = Partial<Record<'zustand' | 'redux' | 'jotai' | 'mobx', string>>;

const rows: Array<{
  label: string;
  kin: string;
  zustand: string;
  redux: string;
  jotai: string;
  mobx: string;
  trimmed?: boolean;
  notes?: Notes;
}> = [
  {
    label: 'Bundle size',
    kin: '2.0 KB',
    zustand: '389 B', redux: '17.5 KB', jotai: '4.0 KB', mobx: '15.6 KB',
    trimmed: true,
  },
  { label: 'Zero dependencies',         kin: '✅', zustand: '✅', redux: '❌', jotai: '✅', mobx: '✅', trimmed: true },
  { label: 'Tiny footprint',            kin: '✅', zustand: '✅', redux: '❌', jotai: '✅', mobx: '❌' },
  {
    label: '100% type-safe',
    kin: '✅', zustand: '⚠️', redux: '⚠️', jotai: '✅', mobx: '✅',
    trimmed: true,
    notes: {
      zustand: 'Requires an explicit type annotation — omit it and state infers as any.',
      redux: 'RootState and AppDispatch must be manually exported for types to flow through.',
    },
  },
  {
    label: 'Low boilerplate',
    kin: '✅', zustand: '⚠️', redux: '❌', jotai: '⚠️', mobx: '⚠️',
    trimmed: true,
    notes: {
      zustand: 'Requires explicit type annotation.',
      jotai: 'App logic must be wrapped in atoms rather than plain functions.',
      mobx: 'Requires classes, makeAutoObservable, runInAction, and observer wrappers.',
    },
  },
  {
    label: 'Linear plugin composition',
    kin: '✅', zustand: '❌', redux: '❌', jotai: '—', mobx: '—',
    notes: {
      jotai: 'Atom-based — no plugin system concept.',
      mobx: 'Class-based — no plugin system concept.',
    },
  },
  {
    label: 'Separate state and logic',
    kin: '✅', zustand: '❌', redux: '✅', jotai: '—', mobx: '✅',
    trimmed: true,
    notes: {
      zustand: 'State and actions must share one type and one object.',
      jotai: 'Logic is wrapped in atoms — not structurally separate from state atoms.',
    },
  },
  {
    label: 'Opt-in complexity',
    kin: '✅', zustand: '✅', redux: '❌', jotai: '⚠️', mobx: '❌',
    trimmed: true,
    notes: {
      jotai: 'Logic must be wrapped in atoms — there is no plain function style even for simple cases.',
    },
  },
  {
    label: 'No hidden magic',
    kin: '✅', zustand: '✅', redux: '✅', jotai: '✅', mobx: '❌',
    trimmed: true,
    notes: {
      mobx: 'makeAutoObservable silently instruments every field and method; async mutations silently break without runInAction.',
    },
  },
  {
    label: 'Reactive composition',
    kin: '✅', zustand: '⚠️', redux: '❌', jotai: '✅', mobx: '✅',
    notes: {
      zustand: 'No built-in derived state primitive — requires 3rd party library.',
    },
  },
];

const visibleRows = computed(() =>
  props.full ? rows : rows.filter((r) => r.trimmed),
);
</script>

<template>
  <div class="feature-matrix">
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
          <td>
            <a v-if="!full" href="/comparison/" class="row-link">{{ row.label }}</a>
            <template v-else>{{ row.label }}</template>
          </td>
          <td class="kin">{{ row.kin }}</td>
          <td :class="{ na: row.zustand === '—', noted: !!row.notes?.zustand }" :title="row.notes?.zustand">{{ row.zustand }}</td>
          <td :class="{ na: row.redux   === '—', noted: !!row.notes?.redux   }" :title="row.notes?.redux">{{ row.redux }}</td>
          <td :class="{ na: row.jotai   === '—', noted: !!row.notes?.jotai   }" :title="row.notes?.jotai">{{ row.jotai }}</td>
          <td :class="{ na: row.mobx    === '—', noted: !!row.notes?.mobx    }" :title="row.notes?.mobx">{{ row.mobx }}</td>
        </tr>
      </tbody>
    </table>
    </div>
    <p class="feature-matrix-legend">✅ full support · ⚠️ partial or conditional · — not applicable (different model)</p>
    <p class="feature-matrix-legend">Bundle sizes are each library's full package import, bundled with rolldown, minified, and gzipped. Tree-shaking down to only the APIs you use will land smaller across the board.</p>
    <p class="feature-matrix-legend">Kin Store is new: this table is accurate today, but Redux, Zustand, Jotai, and MobX all carry years of production use this library doesn't have yet. Try it, and <a href="https://github.com/kintools-dev/store/issues">tell us where it breaks</a>.</p>
  </div>
</template>

<style scoped>
.feature-matrix.is-full {
  padding: 0 0 40px;
}

.matrix-wrapper {
  overflow-x: auto;
}

.matrix-table {
  display: table;
  width: 100%;
  border-collapse: collapse;
  background-color: white;
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
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.matrix-table tbody tr:last-child td {
  border-bottom: none;
}

.na {
  color: var(--vp-c-text-3);
}

.noted {
  cursor: help;
}

.row-link {
  color: inherit;
  text-decoration: none;
}

.row-link:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
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
  padding: 0;
}

.feature-matrix-legend {
  margin: 12px auto;
  max-width: 74ch;
  font-size: 13px;
  line-height: 16px;
  color: var(--vp-c-text-1);
}
</style>
