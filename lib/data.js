class Database {
  #database = new Map();

  set(key, value) {
    this.#database.set(key, new Data(value))
  }

  get(key) {
    return this.#database.get(key) && this.#database.get(key).value || null;
  }

  keys() {
    return Array.from(this.#database.keys());
  }

  delete(key) {
    return this.#database.delete(key);
  }

  clear() {
    return this.#database.clear();
  }

  size() {
    return this.#database.size;
  }

  setExpire(key, seconds) {
    if (this.#database.get(key)) {
      this.#database.get(key).ttl = + seconds;
      this.#timerHandler(key);
    }
  }

  getExpire(key) {
    return this.#database.get(key) && this.#database.get(key).ttl || 0;
  }

  snapshot() {
    const snapshot = new Map();
    for (const [key, data] of this.#database.entries()) {
      snapshot.set(key, new Data(data.value, data.ttl));
    }
    return snapshot;
  }
  
  restore(bk) {
    if (bk instanceof Map) {
      this.#database = new Map();
      for (const [key, data] of bk.entries()) {
        this.#database.set(key, new Data(data.value, data.ttl));
        this.#timerHandler(key);
      }
    }
  }

  #timerHandler(key) {
    const timer = setInterval(() => {
      if (!this.#database.get(key)) {
        return clearInterval(timer);
      }
      this.#database.get(key).ttl--;
      if (this.#database.get(key).ttl <= 0) {
        this.#database.delete(key);
        return clearInterval(timer);
      }
    }, 1000);
  }
}

class Data {
  value;
  ttl;
  constructor(value, ttl) {
    this.value = value;
    this.ttl = ttl;
  }
}

module.exports = {
  Database,
  Data,
}