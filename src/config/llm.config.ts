import { registerAs } from '@nestjs/config'

export default registerAs('llm', () => ({
  model: process.env.AI_MODEL || 'deepseek',
  deepseek: {
    apiUrl: process.env.DEEPSEEK_API_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
}))
