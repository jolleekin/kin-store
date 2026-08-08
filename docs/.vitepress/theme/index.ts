import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import FeatureMatrix from "./FeatureMatrix.vue";
import Layout from "./Layout.vue";
import SideBySide from "./SideBySide.vue";
import "./style.css";

// Extends DefaultTheme for every page, including the homepage: sidebar,
// TOC, prev/next, mobile nav, and search all come for free there, reskinned
// to this theme's palette purely through the `--vp-c-*` variables
// DefaultTheme's own CSS already reads (see style.css).
export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);
    ctx.app.component("SideBySide", SideBySide);
    ctx.app.component("FeatureMatrix", FeatureMatrix);
  },
} satisfies Theme;
