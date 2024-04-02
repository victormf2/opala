import express = require('express')

export function isExpressApplication(obj: unknown): obj is express.Application {
  return (
    typeof obj === 'function' && 'init' in obj && typeof obj.init === 'function'
  )
}
