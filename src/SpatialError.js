export default class SpatialError extends Error {
  constructor (code, message) {
    super(message)
    this.code = code
  }
}
