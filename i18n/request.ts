import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'bn'] as const
type AppLocale = (typeof locales)[number]

function isLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale)
}

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !isLocale(locale)) {
    return {
      locale: 'en',
      messages: (await import(`../messages/en.json`)).default,
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
