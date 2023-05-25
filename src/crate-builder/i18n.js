import { createI18n } from "vue-i18n";

export default createI18n({
  locale: "en", // import.meta.env.VITE_DEFAULT_LOCALE, // <--- 1
  fallbackLocale: "ru", // <--- 2
  legacy: false, // <--- 3
})
