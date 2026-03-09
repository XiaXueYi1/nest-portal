/**
 * @description 解析 Cookie 请求头为键值对象
 */
export const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {}
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split('=')
    if (!key || rest.length === 0) return acc
    acc[key] = decodeURIComponent(rest.join('='))
    return acc
  }, {})
}
