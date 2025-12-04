export class CustomError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomError'
    this.message
  }
}


// export class UnexpectedError extends Error {
//   readonly type = "UnexpectedError" as const;
// }