import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * @description 使用 scrypt + 随机盐加密明文密码
 */
export const hashPassword = (plainTextPassword: string): string => {
  const salt = randomBytes(16)
  const hashed = scryptSync(plainTextPassword, salt, 64)
  return `scrypt$${salt.toString('hex')}$${hashed.toString('hex')}`
}

/**
 * @description 校验明文密码与加密密码是否匹配
 */
export const verifyPassword = (plainTextPassword: string, storedPasswordHash: string): boolean => {
  const [algorithm, saltHex, hashHex] = storedPasswordHash.split('$')
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) {
    return false
  }

  const computedHash = scryptSync(plainTextPassword, Buffer.from(saltHex, 'hex'), 64)
  const storedHash = Buffer.from(hashHex, 'hex')

  if (computedHash.length !== storedHash.length) {
    return false
  }

  return timingSafeEqual(computedHash, storedHash)
}
