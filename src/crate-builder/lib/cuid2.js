var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/@noble/hashes/_assert.js
var require_assert = __commonJS({
  "node_modules/@noble/hashes/_assert.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.output = exports.exists = exports.hash = exports.bytes = exports.bool = exports.number = void 0;
    function number(n) {
      if (!Number.isSafeInteger(n) || n < 0)
        throw new Error(`Wrong positive integer: ${n}`);
    }
    exports.number = number;
    function bool(b) {
      if (typeof b !== "boolean")
        throw new Error(`Expected boolean, not ${b}`);
    }
    exports.bool = bool;
    function bytes(b, ...lengths) {
      if (!(b instanceof Uint8Array))
        throw new TypeError("Expected Uint8Array");
      if (lengths.length > 0 && !lengths.includes(b.length))
        throw new TypeError(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
    }
    exports.bytes = bytes;
    function hash(hash2) {
      if (typeof hash2 !== "function" || typeof hash2.create !== "function")
        throw new Error("Hash should be wrapped by utils.wrapConstructor");
      number(hash2.outputLen);
      number(hash2.blockLen);
    }
    exports.hash = hash;
    function exists(instance, checkFinished = true) {
      if (instance.destroyed)
        throw new Error("Hash instance has been destroyed");
      if (checkFinished && instance.finished)
        throw new Error("Hash#digest() has already been called");
    }
    exports.exists = exists;
    function output(out, instance) {
      bytes(out);
      const min = instance.outputLen;
      if (out.length < min) {
        throw new Error(`digestInto() expects output buffer of length at least ${min}`);
      }
    }
    exports.output = output;
    var assert = {
      number,
      bool,
      bytes,
      hash,
      exists,
      output
    };
    exports.default = assert;
  }
});

// node_modules/@noble/hashes/_u64.js
var require_u64 = __commonJS({
  "node_modules/@noble/hashes/_u64.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.add = exports.toBig = exports.split = exports.fromBig = void 0;
    var U32_MASK64 = BigInt(2 ** 32 - 1);
    var _32n = BigInt(32);
    function fromBig(n, le = false) {
      if (le)
        return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
      return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
    }
    exports.fromBig = fromBig;
    function split(lst, le = false) {
      let Ah = new Uint32Array(lst.length);
      let Al = new Uint32Array(lst.length);
      for (let i = 0; i < lst.length; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
      }
      return [Ah, Al];
    }
    exports.split = split;
    var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
    exports.toBig = toBig;
    var shrSH = (h, l, s) => h >>> s;
    var shrSL = (h, l, s) => h << 32 - s | l >>> s;
    var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
    var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
    var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
    var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
    var rotr32H = (h, l) => l;
    var rotr32L = (h, l) => h;
    var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
    function add(Ah, Al, Bh, Bl) {
      const l = (Al >>> 0) + (Bl >>> 0);
      return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
    }
    exports.add = add;
    var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
    var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
    var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
    var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
    var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
    var u64 = {
      fromBig,
      split,
      toBig: exports.toBig,
      shrSH,
      shrSL,
      rotrSH,
      rotrSL,
      rotrBH,
      rotrBL,
      rotr32H,
      rotr32L,
      rotlSH,
      rotlSL,
      rotlBH,
      rotlBL,
      add,
      add3L,
      add3H,
      add4L,
      add4H,
      add5H,
      add5L
    };
    exports.default = u64;
  }
});

// node_modules/@noble/hashes/cryptoBrowser.js
var require_cryptoBrowser = __commonJS({
  "node_modules/@noble/hashes/cryptoBrowser.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.crypto = void 0;
    exports.crypto = {
      node: void 0,
      web: typeof self === "object" && "crypto" in self ? self.crypto : void 0
    };
  }
});

// node_modules/@noble/hashes/utils.js
var require_utils = __commonJS({
  "node_modules/@noble/hashes/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.randomBytes = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.checkOpts = exports.Hash = exports.concatBytes = exports.toBytes = exports.utf8ToBytes = exports.asyncLoop = exports.nextTick = exports.hexToBytes = exports.bytesToHex = exports.isLE = exports.rotr = exports.createView = exports.u32 = exports.u8 = void 0;
    var crypto_1 = require_cryptoBrowser();
    var u8 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    exports.u8 = u8;
    var u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
    exports.u32 = u32;
    var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    exports.createView = createView;
    var rotr = (word, shift) => word << 32 - shift | word >>> shift;
    exports.rotr = rotr;
    exports.isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
    if (!exports.isLE)
      throw new Error("Non little-endian hardware is not supported");
    var hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, "0"));
    function bytesToHex(uint8a) {
      if (!(uint8a instanceof Uint8Array))
        throw new Error("Uint8Array expected");
      let hex = "";
      for (let i = 0; i < uint8a.length; i++) {
        hex += hexes[uint8a[i]];
      }
      return hex;
    }
    exports.bytesToHex = bytesToHex;
    function hexToBytes(hex) {
      if (typeof hex !== "string") {
        throw new TypeError("hexToBytes: expected string, got " + typeof hex);
      }
      if (hex.length % 2)
        throw new Error("hexToBytes: received invalid unpadded hex");
      const array = new Uint8Array(hex.length / 2);
      for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0)
          throw new Error("Invalid byte sequence");
        array[i] = byte;
      }
      return array;
    }
    exports.hexToBytes = hexToBytes;
    var nextTick = async () => {
    };
    exports.nextTick = nextTick;
    async function asyncLoop(iters, tick, cb) {
      let ts = Date.now();
      for (let i = 0; i < iters; i++) {
        cb(i);
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
          continue;
        await (0, exports.nextTick)();
        ts += diff;
      }
    }
    exports.asyncLoop = asyncLoop;
    function utf8ToBytes(str) {
      if (typeof str !== "string") {
        throw new TypeError(`utf8ToBytes expected string, got ${typeof str}`);
      }
      return new TextEncoder().encode(str);
    }
    exports.utf8ToBytes = utf8ToBytes;
    function toBytes(data) {
      if (typeof data === "string")
        data = utf8ToBytes(data);
      if (!(data instanceof Uint8Array))
        throw new TypeError(`Expected input type is Uint8Array (got ${typeof data})`);
      return data;
    }
    exports.toBytes = toBytes;
    function concatBytes(...arrays) {
      if (!arrays.every((a) => a instanceof Uint8Array))
        throw new Error("Uint8Array list expected");
      if (arrays.length === 1)
        return arrays[0];
      const length = arrays.reduce((a, arr) => a + arr.length, 0);
      const result = new Uint8Array(length);
      for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
      }
      return result;
    }
    exports.concatBytes = concatBytes;
    var Hash = class {
      // Safe version that clones internal state
      clone() {
        return this._cloneInto();
      }
    };
    exports.Hash = Hash;
    var isPlainObject = (obj) => Object.prototype.toString.call(obj) === "[object Object]" && obj.constructor === Object;
    function checkOpts(defaults, opts) {
      if (opts !== void 0 && (typeof opts !== "object" || !isPlainObject(opts)))
        throw new TypeError("Options should be object or undefined");
      const merged = Object.assign(defaults, opts);
      return merged;
    }
    exports.checkOpts = checkOpts;
    function wrapConstructor(hashConstructor) {
      const hashC = (message) => hashConstructor().update(toBytes(message)).digest();
      const tmp = hashConstructor();
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = () => hashConstructor();
      return hashC;
    }
    exports.wrapConstructor = wrapConstructor;
    function wrapConstructorWithOpts(hashCons) {
      const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
      const tmp = hashCons({});
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = (opts) => hashCons(opts);
      return hashC;
    }
    exports.wrapConstructorWithOpts = wrapConstructorWithOpts;
    function randomBytes(bytesLength = 32) {
      if (crypto_1.crypto.web) {
        return crypto_1.crypto.web.getRandomValues(new Uint8Array(bytesLength));
      } else if (crypto_1.crypto.node) {
        return new Uint8Array(crypto_1.crypto.node.randomBytes(bytesLength).buffer);
      } else {
        throw new Error("The environment doesn't have randomBytes function");
      }
    }
    exports.randomBytes = randomBytes;
  }
});

// node_modules/@noble/hashes/sha3.js
var require_sha3 = __commonJS({
  "node_modules/@noble/hashes/sha3.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shake256 = exports.shake128 = exports.keccak_512 = exports.keccak_384 = exports.keccak_256 = exports.keccak_224 = exports.sha3_512 = exports.sha3_384 = exports.sha3_256 = exports.sha3_224 = exports.Keccak = exports.keccakP = void 0;
    var _assert_js_1 = require_assert();
    var _u64_js_1 = require_u64();
    var utils_js_1 = require_utils();
    var [SHA3_PI, SHA3_ROTL, _SHA3_IOTA] = [[], [], []];
    var _0n = BigInt(0);
    var _1n = BigInt(1);
    var _2n = BigInt(2);
    var _7n = BigInt(7);
    var _256n = BigInt(256);
    var _0x71n = BigInt(113);
    for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
      [x, y] = [y, (2 * x + 3 * y) % 5];
      SHA3_PI.push(2 * (5 * y + x));
      SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
      let t = _0n;
      for (let j = 0; j < 7; j++) {
        R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
        if (R & _2n)
          t ^= _1n << (_1n << BigInt(j)) - _1n;
      }
      _SHA3_IOTA.push(t);
    }
    var [SHA3_IOTA_H, SHA3_IOTA_L] = _u64_js_1.default.split(_SHA3_IOTA, true);
    var rotlH = (h, l, s) => s > 32 ? _u64_js_1.default.rotlBH(h, l, s) : _u64_js_1.default.rotlSH(h, l, s);
    var rotlL = (h, l, s) => s > 32 ? _u64_js_1.default.rotlBL(h, l, s) : _u64_js_1.default.rotlSL(h, l, s);
    function keccakP(s, rounds = 24) {
      const B = new Uint32Array(5 * 2);
      for (let round = 24 - rounds; round < 24; round++) {
        for (let x = 0; x < 10; x++)
          B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
          const idx1 = (x + 8) % 10;
          const idx0 = (x + 2) % 10;
          const B0 = B[idx0];
          const B1 = B[idx0 + 1];
          const Th = rotlH(B0, B1, 1) ^ B[idx1];
          const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
          for (let y = 0; y < 50; y += 10) {
            s[x + y] ^= Th;
            s[x + y + 1] ^= Tl;
          }
        }
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
          const shift = SHA3_ROTL[t];
          const Th = rotlH(curH, curL, shift);
          const Tl = rotlL(curH, curL, shift);
          const PI = SHA3_PI[t];
          curH = s[PI];
          curL = s[PI + 1];
          s[PI] = Th;
          s[PI + 1] = Tl;
        }
        for (let y = 0; y < 50; y += 10) {
          for (let x = 0; x < 10; x++)
            B[x] = s[y + x];
          for (let x = 0; x < 10; x++)
            s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        }
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
      }
      B.fill(0);
    }
    exports.keccakP = keccakP;
    var Keccak = class extends utils_js_1.Hash {
      // NOTE: we accept arguments in bytes instead of bits here.
      constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        _assert_js_1.default.number(outputLen);
        if (0 >= this.blockLen || this.blockLen >= 200)
          throw new Error("Sha3 supports only keccak-f1600 function");
        this.state = new Uint8Array(200);
        this.state32 = (0, utils_js_1.u32)(this.state);
      }
      keccak() {
        keccakP(this.state32, this.rounds);
        this.posOut = 0;
        this.pos = 0;
      }
      update(data) {
        _assert_js_1.default.exists(this);
        const { blockLen, state } = this;
        data = (0, utils_js_1.toBytes)(data);
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          for (let i = 0; i < take; i++)
            state[this.pos++] ^= data[pos++];
          if (this.pos === blockLen)
            this.keccak();
        }
        return this;
      }
      finish() {
        if (this.finished)
          return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        state[pos] ^= suffix;
        if ((suffix & 128) !== 0 && pos === blockLen - 1)
          this.keccak();
        state[blockLen - 1] ^= 128;
        this.keccak();
      }
      writeInto(out) {
        _assert_js_1.default.exists(this, false);
        _assert_js_1.default.bytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len; ) {
          if (this.posOut >= blockLen)
            this.keccak();
          const take = Math.min(blockLen - this.posOut, len - pos);
          out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
          this.posOut += take;
          pos += take;
        }
        return out;
      }
      xofInto(out) {
        if (!this.enableXOF)
          throw new Error("XOF is not possible for this instance");
        return this.writeInto(out);
      }
      xof(bytes) {
        _assert_js_1.default.number(bytes);
        return this.xofInto(new Uint8Array(bytes));
      }
      digestInto(out) {
        _assert_js_1.default.output(out, this);
        if (this.finished)
          throw new Error("digest() was already called");
        this.writeInto(out);
        this.destroy();
        return out;
      }
      digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
      }
      destroy() {
        this.destroyed = true;
        this.state.fill(0);
      }
      _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
      }
    };
    exports.Keccak = Keccak;
    var gen = (suffix, blockLen, outputLen) => (0, utils_js_1.wrapConstructor)(() => new Keccak(blockLen, suffix, outputLen));
    exports.sha3_224 = gen(6, 144, 224 / 8);
    exports.sha3_256 = gen(6, 136, 256 / 8);
    exports.sha3_384 = gen(6, 104, 384 / 8);
    exports.sha3_512 = gen(6, 72, 512 / 8);
    exports.keccak_224 = gen(1, 144, 224 / 8);
    exports.keccak_256 = gen(1, 136, 256 / 8);
    exports.keccak_384 = gen(1, 104, 384 / 8);
    exports.keccak_512 = gen(1, 72, 512 / 8);
    var genShake = (suffix, blockLen, outputLen) => (0, utils_js_1.wrapConstructorWithOpts)((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === void 0 ? outputLen : opts.dkLen, true));
    exports.shake128 = genShake(31, 168, 128 / 8);
    exports.shake256 = genShake(31, 136, 256 / 8);
  }
});

// node_modules/@paralleldrive/cuid2/src/index.js
var require_src = __commonJS({
  "node_modules/@paralleldrive/cuid2/src/index.js"(exports, module) {
    var { sha3_512: sha3 } = require_sha3();
    var defaultLength = 24;
    var bigLength = 32;
    var createEntropy = (length = 4, random = Math.random) => {
      let entropy = "";
      while (entropy.length < length) {
        entropy = entropy + Math.floor(random() * 36).toString(36);
      }
      return entropy;
    };
    function bufToBigInt(buf) {
      let bits = 8n;
      let value = 0n;
      for (const i of buf.values()) {
        const bi = BigInt(i);
        value = (value << bits) + bi;
      }
      return value;
    }
    var hash = (input = "") => {
      return bufToBigInt(sha3(input)).toString(36).slice(1);
    };
    var alphabet = Array.from(
      { length: 26 },
      (x, i) => String.fromCharCode(i + 97)
    );
    var randomLetter = (random) => alphabet[Math.floor(random() * alphabet.length)];
    var createFingerprint = ({
      globalObj = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : {}
    } = {}) => {
      const globals = Object.keys(globalObj).toString();
      const sourceString = globals.length ? globals + createEntropy(bigLength) : createEntropy(bigLength);
      return hash(sourceString).substring(0, bigLength);
    };
    var createCounter = (count) => () => {
      return count++;
    };
    var initialCountMax = 476782367;
    var init = ({
      // Fallback if the user does not pass in a CSPRNG. This should be OK
      // because we don't rely solely on the random number generator for entropy.
      // We also use the host fingerprint, current time, and a session counter.
      random = Math.random,
      counter = createCounter(Math.floor(random() * initialCountMax)),
      length = defaultLength,
      fingerprint = createFingerprint()
    } = {}) => {
      return function cuid2() {
        const firstLetter = randomLetter(random);
        const time = Date.now().toString(36);
        const count = counter().toString(36);
        const salt = createEntropy(length, random);
        const hashInput = `${time + salt + count + fingerprint}`;
        return `${firstLetter + hash(hashInput).substring(1, length)}`;
      };
    };
    var createId = init();
    var isCuid = (id, { minLength = 2, maxLength = bigLength } = {}) => {
      const length = id.length;
      const regex = /^[0-9a-z]+$/;
      try {
        if (typeof id === "string" && length >= minLength && length <= maxLength && regex.test(id))
          return true;
      } finally {
      }
      return false;
    };
    module.exports.getConstants = () => ({ defaultLength, bigLength });
    module.exports.init = init;
    module.exports.createId = createId;
    module.exports.bufToBigInt = bufToBigInt;
    module.exports.createCounter = createCounter;
    module.exports.createFingerprint = createFingerprint;
    module.exports.isCuid = isCuid;
  }
});

// node_modules/@paralleldrive/cuid2/index.js
var require_cuid2 = __commonJS({
  "node_modules/@paralleldrive/cuid2/index.js"(exports, module) {
    var { createId, init, getConstants, isCuid } = require_src();
    module.exports.createId = createId;
    module.exports.init = init;
    module.exports.getConstants = getConstants;
    module.exports.isCuid = isCuid;
  }
});
export default require_cuid2();
/*! Bundled license information:

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
