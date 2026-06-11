import { describe, expect, it } from 'vitest'
import { createServer } from '../src/server.js'

describe('createServer', () => {
  it('builds a server without starting a transport', () => {
    const server = createServer()
    expect(server).toBeInstanceOf(Object)
  })
})
