const { Database } = require("./data");
const { InvalidValue, OperatorNotFound, WrongType, SyntaxError, SnapshotNotFound } = require('../errors');

class Ledis {
  #snapshot;
  constructor(database) {
    this.database = database;
  }

  store(body) {
    const { operator, args = [] } = body;
    if (typeof operator !== 'string') {
      throw new Error();
    }
    switch (operator.toUpperCase()) {
      //#region string
      case 'SET':
        return this.#set(args);
      case 'GET':
        return this.#get(args);
      //#endregion
      //#region list
      case 'LLEN':
        return this.#llen(args);
      case 'RPUSH':
        return this.#rpush(args);
      case 'LPOP':
        return this.#lpop(args);
      case 'RPOP':
        return this.#rpop(args);
      case 'LRANGE':
        return this.#lrange(args);
      //#endregion
      //#region set
      case 'SADD':
        return this.#sadd(args);
      case 'SCARD':
        return this.#scard(args);
      case 'SMEMBERS':
        return this.#smembers(args);
      case 'SREM':
        return this.#srem(args);
      case 'SINTER':
        return this.#sinter(args);
      //#endregion
      //#region data
      case 'KEYS':
        return this.#keys();
      case 'DEL':
        return this.#del(args);
      case 'FLUSHDB':
        return this.#flushDB();
      case 'EXPIRE':
        return this.#expire(args);
      case 'TTL':
        return this.#ttl(args);
      //#endregion
      //#region snapshot
      case 'SAVE':
        return this.#save();
      case 'RESTORE':
        return this.#restore();
      //#endregion

      default:
        throw new OperatorNotFound(`The operator "${operator}" is not defined`)
    }
  }

  #validateArgs(args) {
    if (!args || !Array.isArray(args)) {
      throw new InvalidValue(`args must be an array string`);
    } 
  }

  #validateValues(values, type) {
    if (values.findIndex(element => typeof element !== type) >= 0) {
      throw new InvalidValue(`Value must be a ${type}!`);
    }
  }

  //#region string
  #set(args) {
    this.#validateArgs(args);
    if (args.length !== 2) {
      throw new SyntaxError(`wrong number of arguments for 'SET' command`);
    }
    const [key, value] = args;
    if (this.database.get(key) && typeof this.database.get(key) !== 'string') {
      throw new WrongType();
    }
    if (typeof value !== 'string') {
      throw new InvalidValue('Value must be a string!');
    }
    this.database.set(key, value);
    return 'OK';
  }

  #get(args) {
    this.#validateArgs(args);
    if (args.length !== 1) {
      throw new SyntaxError(`wrong number of arguments for 'GET' command`);
    }
    const [key] = args;
    if (this.database.get(key) && typeof this.database.get(key) !== 'string') {
      throw new WrongType();
    }
    return this.database.get(key);
  }
  //#endregion

  //#region list
  #llen(args) {
    this.#validateArgs(args);
    if (args.length !== 1) {
      throw new SyntaxError(`wrong number of arguments for 'LLEN' command`);
    }
    const [key] = args;
    if (this.database.get(key) && !Array.isArray(this.database.get(key))) {
      throw new WrongType();
    }
    return this.database.get(key) && this.database.get(key).length || 0;
  }

  #rpush(args) {
    this.#validateArgs(args);
    if (args.length < 2) {
      throw new SyntaxError(`wrong number of arguments for 'RPUSH' command`);
    }
    const [key, ...value] = args;
    if (this.database.get(key) && !Array.isArray(this.database.get(key))) {
      throw new WrongType();
    }
    this.#validateValues(value, 'string');
    if (this.database.get(key) === undefined || this.database.get(key) === null) {
      this.database.set(key, []);
    }
    if (typeof value === 'string') {
      return this.database.get(key).push(value);
    }
    return Array.prototype.push.apply(this.database.get(key), value);
  }

  #lpop(args) {
    this.#validateArgs(args);
    if (args.length !== 1) {
      throw new SyntaxError(`wrong number of arguments for 'LPOP' command`);
    }
    const [key, numbersOfElement = 1] = args;
    if (!this.database.get(key) || !Array.isArray(this.database.get(key))) {
      throw new WrongType();
    }
    if (isNaN(numbersOfElement)) {
      throw new InvalidValue('Value must be a number');
    }
    return this.database.get(key).splice(0, numbersOfElement)
  }

  #rpop(args) {
    this.#validateArgs(args);
    if (args.length !== 1) {
      throw new SyntaxError(`wrong number of arguments for 'RPOP' command`);
    }
    const [key, numbersOfElement = 1] = args;
    if (!this.database.get(key) || !Array.isArray(this.database.get(key))) {
      throw new WrongType();
    }
    if (isNaN(numbersOfElement)) {
      throw new InvalidValue('Value must be a number');
    }
    return this.database.get(key).splice(-1, numbersOfElement)
  }

  #lrange(args) {
    this.#validateArgs(args);
    if (args.length !== 3) {
      throw new SyntaxError(`wrong number of arguments for 'LRANGE' command`);
    }
    const [key, start, stop] = args;
    if (!this.database.get(key) || !Array.isArray(this.database.get(key))) {
      throw new WrongType();
    }
    if (isNaN(start) || isNaN(stop)) {
      throw new InvalidValue('Value must be a number');
    }
    if (start < 0 || stop < 0) {
      throw new InvalidValue('Value must be a non-negative number');
    }
    return this.database.get(key).slice(start, stop)
  }
  //#endregion

  //#region set
  #sadd(args) {
    this.#validateArgs(args);
    if (args.length < 2) {
      throw new SyntaxError(`wrong number of arguments for 'SADD' command`);
    }
    const [key, ...value] = args;
    if (this.database.get(key) && !(this.database.get(key) instanceof Set)) {
      throw new WrongType();
    }
    this.#validateValues(value, 'string');

    if (this.database.get(key) === undefined || this.database.get(key) === null) {
      this.database.set(key, new Set());
    }
    const currentSize = this.database.get(key).size;
    if (typeof value === 'string') {
      this.database.get(key).add(value);
    } else {
      value.forEach(element => {
        this.database.get(key).add(element);
      })
    }
    return this.database.get(key).size - currentSize;
  }

  #scard(args) {
    this.#validateArgs(args);
    if (args.length !== 1) {
      throw new SyntaxError(`wrong number of arguments for 'SCARD' command`);
    }
    const [key] = args;
    if (this.database.get(key) && !(this.database.get(key) instanceof Set)) {
      throw new WrongType();
    }
    return this.database.get(key) && this.database.get(key).size || 0;
  }

  #smembers(args) {
    this.#validateArgs(args);
    if (args.length !== 1) {
      throw new SyntaxError(`wrong number of arguments for 'SMEMBERS' command`);
    }
    const [key] = args;
    if (this.database.get(key) && !(this.database.get(key) instanceof Set)) {
      throw new WrongType();
    }
    return this.database.get(key) && Array.from(this.database.get(key)) || null;
  }

  #srem(args) {
    this.#validateArgs(args);
    if (args.length < 2) {
      throw new SyntaxError(`wrong number of arguments for 'SREM' command`);
    }
    const [key, ...value] = args;
    if (this.database.get(key) && !(this.database.get(key) instanceof Set)) {
      throw new WrongType();
    }
    this.#validateValues(value, 'string');

    if (this.database.get(key) === undefined) {
      return 0;
    }
    const currentSize = this.database.get(key).size;
    value.forEach(element => {
      this.database.get(key).delete(element);
    })
    return currentSize - this.database.get(key).size;
  }

  #sinter(args) {
    this.#validateArgs(args);
    if (args.length < 2) {
      throw new SyntaxError(`wrong number of arguments for 'SINTER' command`);
    }
    const [...keys] = args;
    const arraySet = keys
      .map(key => this.database.get(key))
      .filter(value => value && value instanceof Set);
    if (arraySet.length === 0) {
      return [];
    }
    return Array.from(arraySet
      .reduce((result, _set) => {
        result.forEach(element => !_set.has(element) && result.delete(element));
        return result;
      }));
  }
  //#endregion

  //#region data
  #keys() {
    return this.database.keys();
  }

  #del(args) {
    this.#validateArgs(args);
    if (args.length !== 1) {
      throw new SyntaxError(`wrong number of arguments for 'DEL' command`);
    }
    const [key] = args;
    const currentDatabaseSize = this.database.size();
    this.database.delete(key);
    return currentDatabaseSize - this.database.size();
  }

  #flushDB() {
    this.database.clear();
    return 'OK';
  }

  #expire(args) {
    this.#validateArgs(args);
    if (args.length !== 2) {
      throw new SyntaxError(`wrong number of arguments for 'EXPIRE' command`);
    }
    const [key, seconds] = args;
    if (isNaN(seconds)) {
      throw new InvalidValue('Seconds must be a number');
    }
    this.database.setExpire(key, seconds);
    return 'OK';
  }

  #ttl(args) {
    this.#validateArgs(args);
    if (args.length !== 1) {
      throw new SyntaxError(`wrong number of arguments for 'TTL' command`);
    }
    const [key] = args;
    return this.database.getExpire(key);
  }
  //#endregion

  //#region snapshot
  #save() {
    this.#snapshot = this.database.snapshot();
  }

  #restore() {
    if (!this.#snapshot) {
      throw new SnapshotNotFound();
    }
    this.database.restore(this.#snapshot);
  }
  //#endregion
}

module.exports = Ledis;