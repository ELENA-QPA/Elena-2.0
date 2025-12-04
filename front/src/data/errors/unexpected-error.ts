export class UnexpectedError extends Error {
  constructor () {
    super('Ha ocurrido un error inesperado. Intente nuevamente')
    this.name = 'UnexpectedError'
  }
}


// export class UnexpectedError extends Error {
//   readonly type = "UnexpectedError" as const;
// }