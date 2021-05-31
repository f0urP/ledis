module.exports = class SyntaxError extends Error{
  constructor(message) {
    super(message);
    this.name = 'SyntaxError';
    Error.captureStackTrace(this, SyntaxError);
  }
}