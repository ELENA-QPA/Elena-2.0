export class TimeOutError extends Error {
    constructor () {
      super('Timeout')
      this.name = 'TimeoutError'
    }
  }
  