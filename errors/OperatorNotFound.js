module.exports = class OperatorNotFound extends Error{
  constructor(message) {
    super(message);
    this.name = 'OperatorNotFound';
    Error.captureStackTrace(this, OperatorNotFound);
  }
}