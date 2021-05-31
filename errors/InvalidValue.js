module.exports = class InvalidValue extends Error{
  constructor(message) {
    super(message);
    this.name = 'InvalidValue';
    Error.captureStackTrace(this, InvalidValue);
  }
}