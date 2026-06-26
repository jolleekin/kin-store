# kin-store

[![JSR @kin-store](https://jsr.io/badges/@kin-store)](https://jsr.io/@kin-store)
![License: MIT](https://img.shields.io/badge/License-MIT-166534?style=flat)
![Framework-agnostic](https://img.shields.io/badge/Framework--agnostic-166534?style=flat)
![Tiny footprint](https://img.shields.io/badge/Tiny%20footprint-166534?style=flat)
![100% type-safe](https://img.shields.io/badge/100%25%20type--safe-166534?style=flat)
![Zero dependencies](https://img.shields.io/badge/Zero%20dependencies-166534?style=flat)

Reactive state you want to use.

## Docs

[→ Documentation website](https://kinstore.dev)

## Feature matrix

|                           |                            **Kin Store**                             | Zustand | Redux / RTK |  Jotai  |  MobX  |
| ------------------------- | :------------------------------------------------------------------: | :-----: | :---------: | :-----: | :----: |
| Bundle size               | 244 B (minimal)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br/>465 B (composition)<br/>1.07 KB (plugin support) | ~1.1 KB |   ~10 KB    | ~3.5 KB | ~16 KB |
| Zero dependencies         |                                  ✅                                  |   ✅    |     ❌      |   ✅    |   ✅   |
| Tiny footprint            |                                  ✅                                  |   ✅    |     ❌      |   ✅    |   ❌   |
| 100% type-safe            |                                  ✅                                  |   ⚠️    |     ⚠️      |   ✅    |   ✅   |
| Low boilerplate           |                                  ✅                                  |   ⚠️    |     ❌      |   ⚠️    |   ⚠️   |
| Linear plugin composition |                                  ✅                                  |   ❌    |     ❌      |    —    |   —    |
| Separate state and logic  |                                  ✅                                  |   ❌    |     ✅      |    —    |   ✅   |
| Opt-in complexity         |                                  ✅                                  |   ⚠️    |     ❌      |   ⚠️    |   ❌   |
| No hidden magic           |                                  ✅                                  |   ✅    |     ✅      |   ⚠️    |   ❌   |
| Reactive composition      |                                  ✅                                  |   ⚠️    |     ❌      |   ✅    |   ✅   |

Kin Store is pay-per-use: import only `createStore` and pay 244 B. Import `withPlugins` and pay 1.07 KB. The plugin bundles (`persist`, `history`, `immer`) add only what you import.
