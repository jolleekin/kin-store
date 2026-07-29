TODO list

1. [x] **Production**: Make persist() SSR-safe: resolve localStorage lazily
       (e.g. inside the method that uses it, not as a default parameter) or
       require an explicit storage adapter; document that today's Next.js
       example only works because its store is created client-side.

2. [x] **Lifecycle**: await onActivated/onDestroy in withPlugins.use()
       (currently fire-and-forget at with-plugins.ts:956); define what happens
       when async activation throws — right now a failed persist hydration is an
       unhandled rejection, not an observable error. Add tests for plugin
       ordering/races (e.g. persist + history activating concurrently).

3. [x] **React**: Harden useSelector for selectors returning new object/array
       references; add React Strict Mode and snapshot-stability tests; document
       the equality/memoization contract explicitly (today it's implied by
       useSelectorWithEquality's existence, not stated as a rule).

4. [ ] **GitHub**: Add LICENSE (deno.json says MIT, GitHub shows none),
       CONTRIBUTING.md, SECURITY.md, Code of Conduct, issue/PR templates, a
       support policy, a public roadmap, enable Discussions, and add
       dependency-update automation (Dependabot/Renovate).

5. [ ] **Testing**: CI on every PR/push, not just release tags: deno lint, deno
       test -A, docs build, Next.js production build, and browser-level
       SSR/hydration tests. Put the resulting badge in the README.

6. [x] **API**: Decide and document the set vs dispatch policy explicitly —
       today "two tiers of mutation" is a philosophy note, not an enforced
       contract. Consider a strict/audited store mode that disallows set
       bypassing middleware for teams that want dispatch to be the only door.

7. [ ] **TypeScript**: Simplify the plugin-author-facing generics or ship helper
       types/templates so writing a plugin doesn't require reading
       MergeReducers/Flatten/UnionToIntersection; soften "100% type-safe / no
       casts" marketing to something like "strong inference for application
       authors" — true for store consumers, not yet demonstrated for plugin
       authors at scale.

8. [ ] **Performance**: Publish reproducible benchmarks vs. Zustand, Redux
       Toolkit, Jotai, and TanStack Store: update fan-out, selector cost,
       derived-store recompute behavior, memory, and persist/history overhead —
       bundle size is proven, runtime performance currently isn't.

9. [ ] **Documentation**: Production guides: SSR/RSC, React Native, testing,
       error handling, plugin lifecycle, persistence, multi-store design, code
       splitting, framework compatibility matrix.

10. [ ] **Documentation**: Fair migration guides from Zustand, Redux Toolkit,
        Jotai, and TanStack Store — including honest "when Kin Store is the
        wrong choice" guidance, not just comparison tables.

11. [ ] **Positioning**: The existing comparisons are unusually fact-checked
        (verified several claims by hand against real Zustand/RTK APIs), so this
        isn't a credibility problem — but the framing still centers on
        competitor critique. Lead pages with Kin Store's actual wedge (flat,
        typed plugin composition) and push the competitor call-outs to a
        secondary "trade-offs" reference.

12. [ ] **Distribution**: Make npm installation first-class alongside JSR.
        (Import-path friction is addressed: each package's `deno.json` now
        exports a bare `.` specifier, e.g. `@kin-store/core`, alongside
        `./index.ts`, and every doc/example import uses the bare form.)

13. [ ] **Ecosystem**: First-party integrations: reset/audit/logger middleware,
        cross-tab persistence, testing utilities, and a real TanStack Query +
        Next.js guide.

14. [ ] **GitHub**: Upgrade the README: a one-minute React example, install
        commands per package manager, a live demo link, explicit
        package-maturity status, compatibility/support policy, production
        caveats, benchmark numbers, and verified adopters once they exist.

15. [ ] **Metadata**: Add a lightweight release-time check that JSR metadata,
        docs, examples, and CHANGELOG entries agree with the published API
        surface (the current CHANGELOG discipline is good; make sure it stays
        load-bearing as the surface grows).

16. [ ] **SEO**: Focused landing pages: "React state management," "Zustand
        alternative," "Redux Toolkit alternative," SSR state, persistence,
        TypeScript state management.

17. [ ] **AI Discovery**: Publish llms.txt/llms-full.txt, a concise canonical
        API reference, an FAQ/non-goals page, versioned examples, and benchmark
        methodology once benchmarks exist (item 8).
