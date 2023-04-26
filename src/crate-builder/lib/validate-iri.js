var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/validate-iri/lib/Validate.js
var require_Validate = __commonJS({
  "node_modules/validate-iri/lib/Validate.js"(exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateIri = exports.IriValidationStrategy = void 0;
    function buildAbsoluteIriRfc3987Regex() {
      const sub_delims_raw = `!$&'()*+,;=`;
      const sub_delims = `[${sub_delims_raw}]`;
      const pct_encoded = `%[a-fA-F0-9]{2}`;
      const dec_octet = "([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])";
      const ipv4address = `${dec_octet}\\.${dec_octet}\\.${dec_octet}\\.${dec_octet}`;
      const h16 = `[a-fA-F0-9]{1,4}`;
      const ls32 = `(${h16}:${h16}|${ipv4address})`;
      const ipv6address = `((${h16}:){6}${ls32}|::(${h16}:){5}${ls32}|(${h16})?::(${h16}:){4}${ls32}|((${h16}:){0,1}${h16})?::(${h16}:){3}${ls32}|((${h16}:){0,2}${h16})?::(${h16}:){2}${ls32}|((${h16}:){0,3}${h16})?::${h16}:${ls32}|((${h16}:){0,4}${h16})?::${ls32}|((${h16}:){0,5}${h16})?::${h16}|((${h16}:){0,6}${h16})?::)`;
      const ipvfuture = `v[a-fA-F0-9]+\\.(${sub_delims}|${sub_delims}|":)+`;
      const ip_literal = `\\[(${ipv6address}|${ipvfuture})\\]`;
      const port = `[0-9]*`;
      const scheme = `[a-zA-Z][a-zA-Z0-9+\\-.]*`;
      const iprivate_raw = `\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}`;
      const iprivate = `[${iprivate_raw}]`;
      const ucschar_raw = `\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E1000}-\u{EFFFD}`;
      const iunreserved_raw = `a-zA-Z0-9\\-._~${ucschar_raw}`;
      const iunreserved = `[${iunreserved_raw}]`;
      const ipchar = `(${iunreserved}|${pct_encoded}|${sub_delims}|[:@])*`;
      const ifragment = `(${ipchar}|[\\/?])*`;
      const iquery = `(${ipchar}|${iprivate}|[\\/?])*`;
      const isegment_nz = `(${ipchar})+`;
      const isegment = `(${ipchar})*`;
      const ipath_empty = "";
      const ipath_rootless = `${isegment_nz}(\\/${isegment})*`;
      const ipath_absolute = `\\/(${isegment_nz}(\\/${isegment})*)?`;
      const ipath_abempty = `(\\/${isegment})*`;
      const ireg_name = `(${iunreserved}|${pct_encoded}|${sub_delims})*`;
      const ihost = `(${ip_literal}|${ipv4address}|${ireg_name})`;
      const iuserinfo = `(${iunreserved}|${pct_encoded}|${sub_delims}|:)*`;
      const iauthority = `(${iuserinfo}@)?${ihost}(:${port})?`;
      const ihier_part = `(\\/\\/${iauthority}${ipath_abempty}|${ipath_absolute}|${ipath_rootless}|${ipath_empty})`;
      const iri = `^${scheme}:${ihier_part}(\\?${iquery})?(#${ifragment})?$`;
      return new RegExp(iri, "u");
    }
    var STRICT_IRI_REGEX = buildAbsoluteIriRfc3987Regex();
    var PRAGMATIC_IRI_REGEX = /^[A-Za-z][\d+-.A-Za-z]*:[^\u0000-\u0020"<>\\^`{|}]*$/u;
    var IriValidationStrategy;
    (function(IriValidationStrategy2) {
      IriValidationStrategy2["Strict"] = "strict";
      IriValidationStrategy2["Pragmatic"] = "pragmatic";
      IriValidationStrategy2["None"] = "none";
    })(IriValidationStrategy = exports.IriValidationStrategy || (exports.IriValidationStrategy = {}));
    function validateIri(iri, strategy = IriValidationStrategy.Strict) {
      switch (strategy) {
        case IriValidationStrategy.Strict:
          return STRICT_IRI_REGEX.test(iri) ? void 0 : new Error(`Invalid IRI according to RFC 3987: '${iri}'`);
        case IriValidationStrategy.Pragmatic:
          return PRAGMATIC_IRI_REGEX.test(iri) ? void 0 : new Error(`Invalid IRI according to RDF Turtle: '${iri}'`);
        case IriValidationStrategy.None:
          return void 0;
        default:
          return new Error(`Not supported validation strategy "${strategy}"`);
      }
    }
    exports.validateIri = validateIri;
  }
});
export default require_Validate();
