import DefaultTheme from 'vitepress/theme'
import SideBySide from './SideBySide.vue'
import FeatureMatrix from './FeatureMatrix.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  // deno-lint-ignore no-explicit-any
  enhanceApp({ app }: { app: any }) {
    app.component('SideBySide', SideBySide)
    app.component('FeatureMatrix', FeatureMatrix)
  },
}
