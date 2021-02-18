import VueCompositionApi from '@vue/composition-api'
import { boot } from 'quasar/wrappers'

export default boot(({ app, Vue }) => {
  Vue.use(VueCompositionApi)
})
