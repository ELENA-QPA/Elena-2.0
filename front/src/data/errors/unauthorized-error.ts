export class  UnauthorizedError  extends Error {
    constructor () {
      super('Usuario no autorizado!')
      this.name = 'Unauthorized'
    }
  }
  