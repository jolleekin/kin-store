# kin-store

[![JSR @kin-store](https://jsr.io/badges/@kin-store)](https://jsr.io/@kin-store)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat-square)
![Tiny footprint](https://img.shields.io/badge/Tiny%20footprint-166534?style=flat-square)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat-square)
![Zero dependencies](https://img.shields.io/badge/Zero%20dependencies-166534?style=flat-square)

Reactive state you want to use.

## Docs

[→ Documentation website](https://kin-store.pages.dev)

## Feature matrix

|                           | **Kin Store** | Zustand | Redux / RTK | Jotai | MobX |
| ------------------------- | :-----------: | :-----: | :---------: | :---: | :--: |
| Zero dependencies         |      ✅       |   ✅    |     ❌      |  ✅   |  ❌  |
| Tiny footprint            |      ✅       |   ✅    |     ❌      |  ✅   |  ❌  |
| 100% type-safe            |      ✅       |   ⚠️    |     ⚠️      |  ✅   |  ⚠️  |
| Linear plugin composition |      ✅       |   ❌    |     ❌      |   —   |  —   |
| Separate state and logic  |      ✅       |   ❌    |     ✅      |   —   |  ✅  |
| Opt-in complexity         |      ✅       |   ❌    |     ❌      |  ✅   |  ❌  |
| No hidden magic           |      ✅       |   ✅    |     ✅      |  ⚠️   |  ❌  |
| Reactive composition      |      ✅       |   ❌    |     ❌      |  ✅   |  ✅  |

## Bundle size

| Package                                                    | Minified + gzip |
| ---------------------------------------------------------- | --------------- |
| **`@kin-store/core`**                                      | —               |
| &nbsp;&nbsp;↳ `createStore` alone                          | **244 B**       |
| &nbsp;&nbsp;↳ `derive` alone                               | **465 B**       |
| &nbsp;&nbsp;↳ `withPlugins` (full plugin system)           | **1.07 KB**     |
| `zustand` core                                             | ~1.2 KB         |
| `jotai` core                                               | ~3.5 KB         |
| `@reduxjs/toolkit`                                         | ~11 KB          |
| `mobx`                                                     | ~16 KB          |

Kin Store is pay-per-use: import only `createStore` and pay 244 B. Import `withPlugins` and pay 1.07 KB. The plugin bundles (`persist`, `history`, `immer`) add only what you import.

