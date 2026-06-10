import createMiddleware from 'next-intl/middleware'
import { locales } from './i18n/request'

export default createMiddleware({
  locales: [...locales],
  defaultLocale: 'en',
  localePrefix: 'never',
})

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc.)
    '/((?!api|_next|_vercel|icon|apple-icon|manifest|robots|sitemap|opengraph-image).*)',
  ],
}
