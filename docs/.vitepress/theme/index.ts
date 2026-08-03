import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { VPNavBarSearch } from "vitepress/theme";
import FeatureMatrix from "./FeatureMatrix.vue";
import Layout from "./Layout.vue";
import SideBySide from "./SideBySide.vue";
import "./style.css";

// Extends DefaultTheme for doc-shaped pages (Guide/Plugins/React/Examples):
// sidebar, TOC, prev/next, mobile nav, and search all come for free there,
// reskinned to this theme's palette purely through the `--vp-c-*` variables
// DefaultTheme's own CSS already reads (see style.css). The homepage is the
// one page that opts out of all of that (Layout.vue renders it bare) since
// its marketing layout doesn't fit DefaultTheme's doc shape at all.
//
// VPNavBarSearch is registered globally so the homepage's own hand-rolled
// nav (in index.md) can drop it in directly; doc pages get search for free
// via DefaultTheme's own nav bar instead.
export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);
    ctx.app.component("VPNavBarSearch", VPNavBarSearch);
    ctx.app.component("SideBySide", SideBySide);
    ctx.app.component("FeatureMatrix", FeatureMatrix);
  },
} satisfies Theme;
