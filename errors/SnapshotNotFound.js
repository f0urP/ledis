module.exports = class SnapshotNotFound extends Error{
  constructor(message) {
    super(message);
    this.name = 'SnapshotNotFound';
    Error.captureStackTrace(this, SnapshotNotFound);
  }
}