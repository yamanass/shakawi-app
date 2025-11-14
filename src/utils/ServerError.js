// src/utils/ServerError.js
export default class ServerError extends Error {
  constructor(message = 'Server error', status = null, data = null) {
    super(message);
    this.name = 'ServerError';
    this.status = status;
    this.data = data;
  }
}
