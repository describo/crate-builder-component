import i18next from 'i18next';
import en from "./locales/en.js"
import hu from "./locales/hu.js"

i18next.init({
  debug: true,
  resources: {
    en, hu
  }
});

const $t = i18next.t

export {
  $t,
  i18next
}
