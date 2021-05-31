module.exports = class WrongType extends Error{
  constructor(message) {
    super(message || 'Operation against a key holding the wrong kind of value');
    this.name = 'WrongType';
    Error.captureStackTrace(this, WrongType);
  }
}