// pragma mark - Actions

/**
 * Base class for every action
 */
class BaseAction {
  constructor({
    email,
    config,
    version = null
  }) {
    this.email = email;
    this.config = config;
    this.version = version || BaseAction.version;
  }
  /**
   * Action version.
   * Try following SemVer or similar if possible.
   * @return {string} the current action version
   */


  static get version() {
    return '0.0.1';
  }

  get name() {
    return 'name';
  }

  run() {
    console.log('Run');
  }

}

const methods = {
  get: 'get',
  post: 'post',
  put: 'put',
  patch: 'patch',
  head: 'head',
  delete: 'delete'
};

class Fetch {
  constructor({
    endpoint,
    config,
    options = {},
    payload = {},
    api = UrlFetchApp,
    muteHttpExceptions = true
  }) {
    this.api = api;
    this.endpoint = endpoint;
    this.config = config;
    this.options = options || {};
    this.payload = payload || {};
    this.muteHttpExceptions = muteHttpExceptions || true;
  }

  fetch() {
    if (!this.options.method) {
      this.options.method = methods.get;
    }

    this.options.muteHttpExceptions = this.muteHttpExceptions;
    console.log('Fetching HTTP', {
      endpoint: this.endpoint,
      options: this.options
    }); // https://developers.google.com/apps-script/reference/url-fetch/http-response

    const response = this.api.fetch(this.endpoint, this.options);
    console.log({
      status: response.getResponseCode(),
      content: response.getContentText()
    });
    return response;
  }

  fetchJSON() {
    this.options.payload = JSON.stringify(this.payload);
    this.options.contentType = 'application/json';
    return this.fetch();
  }

  post() {
    this.options.method = methods.post;
    return this.fetch();
  }

  postJSON() {
    this.options.method = methods.post;
    return this.fetchJSON();
  }

}

const endpoint = '';

class HttpAction extends BaseAction {
  constructor({
    email,
    config,
    Http = Fetch
  }) {
    super({
      email,
      config
    });
    this.endpoint = endpoint;
    this.http = new Http({
      endpoint,
      config
    });
  }

  run() {
    console.log('Executing HTTP Action');
    console.log('Sending Email', this.email.id);
    const element = this.email.element;
    const message = this.email.message;
    const info = this.email.info;
    const date = info.date.formatter;
    const ts = Date.now();
    const payload = {
      id: message.id,
      label: element.label.raw,
      info,
      date: {
        formatted: date.format('YYYY-MM-DD'),
        // iso8601
        time: date.format('HH:mm'),
        message: message.date
      },
      ts
    };
    this.http.payload = payload; // uncomment this to send data to endpoint
    // this.http.postJSON();
  }

}

const sheetURL = 'https://docs.google.com/spreadsheets/d/<spreadsheet id>/edit#gid=0'; // Try to include #grid=0 at the end, to specify the spreadsheet's initial sheet.

/**
 * Save email info to an spreadsheeet
 */

class SpreadSheetAction extends BaseAction {
  constructor({
    email,
    config
  }) {
    super({
      email,
      config
    }); // SpreadsheetApp is defined in Google Scripts API
    // https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app
    // TODO: Find a way to mock this

    this.api = SpreadsheetApp;
    this.file = this.api.openByUrl(sheetURL);
    this.sheet = this.file.getActiveSheet();
    this.email = email;
    this.canSave = true;

    if (!this.file) {
      console.log('No spreadsheet found at', sheetURL);
      this.canSave = false;
    }
  }

  run() {
    console.log('Executing SpreadSheet Action');

    if (!this.canSave) {
      console.log('Could not save');
      return;
    }

    console.log('Saving Email', this.email.id);
    const element = this.email.element;
    const message = this.email.message;
    const info = this.email.info;
    const date = info.date.formatter;
    const ts = Date.now(); // id|email|amount|currency|context|account|day|hour|type|label|entity|comment|created at|sent at|json

    const columns = [message.id, message.from, String(info.amount), info.currency.code, info.context, info.account, date.format('YYYY-MM-DD'), // iso8601
    date.format('HH:mm'), info.type, element.label.raw, info.entity, info.comment, info.createdAt, message.date, JSON.stringify({
      id: message.id,
      label: element.label.raw,
      info,
      date: message.date,
      ts
    }), ts];
    console.log('Saving data', columns);
    this.sheet.appendRow(columns);
  }

}

// should return a flat array of actions

var actions = [SpreadSheetAction, HttpAction];

// Should return a flat array of entities
var entities = [];

class BaseCountry {
  static get id() {
    return '';
  }

  static get name() {
    return '';
  }

  static get entities() {
    return {};
  }

  static get currencies() {
    return {};
  }

  static get timezones() {
    return [];
  }

}

class BaseEntity {
  constructor(emails) {
    this.emails = emails;
  }

  static get id() {
    return '';
  }

  static get name() {
    return '';
  }

  static get actions() {
    return [];
  }

  static get parsers() {
    return [];
  }

  static get labels() {
    const labels = []; // access parsers property in child class
    // we need to avoid calling the class name because it will return empty

    const parsers = this.constructor.parsers;
    parsers.forEach(ParserClass => {
      labels.push(ParserClass.label);
    });
    return labels;
  }

  static actionsForLabels(actions) {
    const actionsForLabels = {};
    const labels = this.constructor.labels;
    labels.forEach(label => {
      actionsForLabels[label] = actions;
    });
    return actionsForLabels;
  }

}

var EntityName = 'Banco Estado';

// export a flat array of actions

class CustomAction extends BaseAction {
  constructor({
    email,
    config
  }) {
    super({
      email,
      config
    });
    console.log('This action will be triggered on emails parsed on this entity only', email.element.entity.name);
  }

}
var actions$1 = [CustomAction];

class BaseCurrency {
  constructor({
    name,
    symbol,
    code,
    country,
    locale,
    symbolPrefix = true,
    separator = '.',
    decimals = 0,
    decimalsSeparator = ','
  }) {
    this.name = name;
    this.symbol = symbol; // determines the position of the symbol
    // prefixed or suffixed.

    this.symbolPrefix = symbolPrefix;
    this.country = country;
    this.locale = locale;
    this.code = String(code).toUpperCase(); // ISO 4217

    this.decimals = Number(decimals);
    this.separator = separator;
    this.decimalsSeparator = decimalsSeparator;
  }

  format({
    value,
    locale = null,
    includeSymbol = true,
    includeCode = true
  }) {
    return `${includeSymbol ? this.symbol : ''} ${Math.round(value).toLocaleString(locale || this.locale)} ${includeCode ? this.code : ''}`;
  }

}

class CLP extends BaseCurrency {
  constructor() {
    super({
      name: 'Peso Chileno',
      symbol: '$',
      code: 'CLP',
      locale: 'es-CL',
      country: 'Chile'
    });
  }

}

var currencies = [CLP];

/**
 * Defines the available operation types.
 * normally "expense" (money out) and "deposit" (money in).
 * additional "alert" could be to notify an incomming payment
 * but that is not paid yet.
 */
class Types {
  static get expense() {
    return 'expense';
  }

  static get deposit() {
    return 'deposit';
  }

  static get alert() {
    return 'alert';
  }

  static get other() {
    return 'other';
  }

}

class Validators {
  static isEmptyString(value) {
    return String(value).trim() === '';
  }

}

const SECONDS_A_MINUTE = 60;
const SECONDS_A_HOUR = SECONDS_A_MINUTE * 60;
const SECONDS_A_DAY = SECONDS_A_HOUR * 24;
const SECONDS_A_WEEK = SECONDS_A_DAY * 7;
const MILLISECONDS_A_SECOND = 1e3;
const MILLISECONDS_A_MINUTE = SECONDS_A_MINUTE * MILLISECONDS_A_SECOND;
const MILLISECONDS_A_HOUR = SECONDS_A_HOUR * MILLISECONDS_A_SECOND;
const MILLISECONDS_A_DAY = SECONDS_A_DAY * MILLISECONDS_A_SECOND;
const MILLISECONDS_A_WEEK = SECONDS_A_WEEK * MILLISECONDS_A_SECOND; // English locales

const MS = 'millisecond';
const S = 'second';
const MIN = 'minute';
const H = 'hour';
const D = 'day';
const W = 'week';
const M = 'month';
const Q = 'quarter';
const Y = 'year';
const DATE = 'date';
const FORMAT_DEFAULT = 'YYYY-MM-DDTHH:mm:ssZ';
const INVALID_DATE_STRING = 'Invalid Date'; // regex

const REGEX_PARSE = /^(\d{4})-?(\d{1,2})-?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?.?(\d{1,3})?$/;
const REGEX_FORMAT = /\[([^\]]+)]|Y{2,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g;

const functions = {}; // avoid polluting main context

functions.main = () => {
  const padStart = (string, length, pad) => {
    const s = String(string);
    if (!s || s.length >= length) return string;
    return `${Array(length + 1 - s.length).join(pad)}${string}`;
  };

  const padZoneStr = instance => {
    const negMinuts = -instance.utcOffset();
    const minutes = Math.abs(negMinuts);
    const hourOffset = Math.floor(minutes / 60);
    const minuteOffset = minutes % 60;
    return `${negMinuts <= 0 ? '+' : '-'}${padStart(hourOffset, 2, '0')}:${padStart(minuteOffset, 2, '0')}`;
  };

  const monthDiff = (a, b) => {
    // function from moment.js in order to keep the same result
    const wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month());
    const anchor = a.clone().add(wholeMonthDiff, M);
    const c = b - anchor < 0;
    const anchor2 = a.clone().add(wholeMonthDiff + (c ? -1 : 1), M);
    return Number(-(wholeMonthDiff + (b - anchor) / (c ? anchor - anchor2 : anchor2 - anchor)) || 0);
  };

  const absFloor = n => n < 0 ? Math.ceil(n) || 0 : Math.floor(n);

  const prettyUnit = u => {
    const special = {
      M: M,
      y: Y,
      w: W,
      d: D,
      D: DATE,
      h: H,
      m: MIN,
      s: S,
      ms: MS,
      Q: Q
    };
    return special[u] || String(u || '').toLowerCase().replace(/s$/, '');
  };

  const isUndefined = s => s === undefined;

  return {
    s: padStart,
    z: padZoneStr,
    m: monthDiff,
    a: absFloor,
    p: prettyUnit,
    u: isUndefined
  };
};

var U = functions.main();

// We don't need weekdaysShort, weekdaysMin, monthsShort in en.js locale
var en = {
  name: 'en',
  weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
  months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_')
};

// Spanish [es]
const locale = {
  name: 'es',
  monthsShort: 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
  weekdays: 'domingo_lunes_martes_miércoles_jueves_viernes_sábado'.split('_'),
  weekdaysShort: 'dom._lun._mar._mié._jue._vie._sáb.'.split('_'),
  weekdaysMin: 'do_lu_ma_mi_ju_vi_sá'.split('_'),
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  weekStart: 1,
  formats: {
    LT: 'H:mm',
    LTS: 'H:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D [de] MMMM [de] YYYY',
    LLL: 'D [de] MMMM [de] YYYY H:mm',
    LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm'
  },
  relativeTime: {
    future: 'en %s',
    past: 'hace %s',
    s: 'unos segundos',
    m: 'un minuto',
    mm: '%d minutos',
    h: 'una hora',
    hh: '%d horas',
    d: 'un día',
    dd: '%d días',
    M: 'un mes',
    MM: '%d meses',
    y: 'un año',
    yy: '%d años'
  },
  ordinal: n => `${n}º`
};

/* eslint-disable */
// and avoid polluting it

const functions$1 = {};

functions$1.main = () => {
  let L = 'en'; // global locale

  const Ls = {
    es: locale,
    en
  }; // global loaded locale

  Ls[L] = en;

  const isDayjs = d => d instanceof Dayjs; // eslint-disable-line no-use-before-define


  const parseLocale = (preset, object, isLocal) => {
    let l;
    if (!preset) return L;

    if (typeof preset === 'string') {
      if (Ls[preset]) {
        l = preset;
      }

      if (object) {
        Ls[preset] = object;
        l = preset;
      }
    } else {
      const {
        name
      } = preset;
      Ls[name] = preset;
      l = name;
    }

    if (!isLocal && l) L = l;
    return l || !isLocal && L;
  };

  const dayjs = function (date, c) {
    if (isDayjs(date)) {
      return date.clone();
    } // eslint-disable-next-line no-nested-ternary


    const cfg = typeof c === 'object' ? c : {};
    cfg.date = date;
    cfg.args = arguments; // eslint-disable-line prefer-rest-params

    return new Dayjs(cfg); // eslint-disable-line no-use-before-define
  };

  const wrapper = (date, instance) => dayjs(date, {
    locale: instance.$L,
    utc: instance.$u,
    $offset: instance.$offset // todo: refactor; do not use this.$offset in you code

  });

  const Utils = U; // for plugin use

  Utils.l = parseLocale;
  Utils.i = isDayjs;
  Utils.w = wrapper;

  const parseDate = cfg => {
    const {
      date,
      utc
    } = cfg;
    if (date === null) return new Date(NaN); // null is invalid

    if (Utils.u(date)) return new Date(); // today

    if (date instanceof Date) return new Date(date);

    if (typeof date === 'string' && !/Z$/i.test(date)) {
      const d = date.match(REGEX_PARSE);

      if (d) {
        if (utc) {
          return new Date(Date.UTC(d[1], d[2] - 1, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, d[7] || 0));
        }

        return new Date(d[1], d[2] - 1, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, d[7] || 0);
      }
    }

    return new Date(date); // everything else
  };

  class Dayjs {
    constructor(cfg) {
      this.$L = this.$L || parseLocale(cfg.locale, null, true);
      this.parse(cfg); // for plugin
    }

    parse(cfg) {
      this.$d = parseDate(cfg);
      this.init();
    }

    init() {
      const {
        $d
      } = this;
      this.$y = $d.getFullYear();
      this.$M = $d.getMonth();
      this.$D = $d.getDate();
      this.$W = $d.getDay();
      this.$H = $d.getHours();
      this.$m = $d.getMinutes();
      this.$s = $d.getSeconds();
      this.$ms = $d.getMilliseconds();
    } // eslint-disable-next-line class-methods-use-this


    $utils() {
      return Utils;
    }

    isValid() {
      return !(this.$d.toString() === INVALID_DATE_STRING);
    }

    isSame(that, units) {
      const other = dayjs(that);
      return this.startOf(units) <= other && other <= this.endOf(units);
    }

    isAfter(that, units) {
      return dayjs(that) < this.startOf(units);
    }

    isBefore(that, units) {
      return this.endOf(units) < dayjs(that);
    }

    $g(input, get, set) {
      if (Utils.u(input)) return this[get];
      return this.set(set, input);
    }

    year(input) {
      return this.$g(input, '$y', Y);
    }

    month(input) {
      return this.$g(input, '$M', M);
    }

    day(input) {
      return this.$g(input, '$W', D);
    }

    date(input) {
      return this.$g(input, '$D', DATE);
    }

    hour(input) {
      return this.$g(input, '$H', H);
    }

    minute(input) {
      return this.$g(input, '$m', MIN);
    }

    second(input) {
      return this.$g(input, '$s', S);
    }

    millisecond(input) {
      return this.$g(input, '$ms', MS);
    }

    unix() {
      return Math.floor(this.valueOf() / 1000);
    }

    valueOf() {
      // timezone(hour) * 60 * 60 * 1000 => ms
      return this.$d.getTime();
    }

    startOf(units, startOf) {
      // startOf -> endOf
      const isStartOf = !Utils.u(startOf) ? startOf : true;
      const unit = Utils.p(units);

      const instanceFactory = (d, m) => {
        const ins = Utils.w(this.$u ? Date.UTC(this.$y, m, d) : new Date(this.$y, m, d), this);
        return isStartOf ? ins : ins.endOf(D);
      };

      const instanceFactorySet = (method, slice) => {
        const argumentStart = [0, 0, 0, 0];
        const argumentEnd = [23, 59, 59, 999];
        return Utils.w(this.toDate()[method].apply( // eslint-disable-line prefer-spread
        this.toDate('s'), (isStartOf ? argumentStart : argumentEnd).slice(slice)), this);
      };

      const {
        $W,
        $M,
        $D
      } = this;
      const utcPad = `set${this.$u ? 'UTC' : ''}`;

      switch (unit) {
        case Y:
          return isStartOf ? instanceFactory(1, 0) : instanceFactory(31, 11);

        case M:
          return isStartOf ? instanceFactory(1, $M) : instanceFactory(0, $M + 1);

        case W:
          {
            const weekStart = this.$locale().weekStart || 0;
            const gap = ($W < weekStart ? $W + 7 : $W) - weekStart;
            return instanceFactory(isStartOf ? $D - gap : $D + (6 - gap), $M);
          }

        case D:
        case DATE:
          return instanceFactorySet(`${utcPad}Hours`, 0);

        case H:
          return instanceFactorySet(`${utcPad}Minutes`, 1);

        case MIN:
          return instanceFactorySet(`${utcPad}Seconds`, 2);

        case S:
          return instanceFactorySet(`${utcPad}Milliseconds`, 3);

        default:
          return this.clone();
      }
    }

    endOf(arg) {
      return this.startOf(arg, false);
    }

    $set(units, int) {
      // private set
      const unit = Utils.p(units);
      const utcPad = `set${this.$u ? 'UTC' : ''}`;
      const name = {
        [D]: `${utcPad}Date`,
        [DATE]: `${utcPad}Date`,
        [M]: `${utcPad}Month`,
        [Y]: `${utcPad}FullYear`,
        [H]: `${utcPad}Hours`,
        [MIN]: `${utcPad}Minutes`,
        [S]: `${utcPad}Seconds`,
        [MS]: `${utcPad}Milliseconds`
      }[unit];
      const arg = unit === D ? this.$D + (int - this.$W) : int;

      if (unit === M || unit === Y) {
        // clone is for badMutable plugin
        const date = this.clone().set(DATE, 1);
        date.$d[name](arg);
        date.init();
        this.$d = date.set(DATE, Math.min(this.$D, date.daysInMonth())).$d;
      } else if (name) this.$d[name](arg);

      this.init();
      return this;
    }

    set(string, int) {
      return this.clone().$set(string, int);
    }

    get(unit) {
      return this[Utils.p(unit)]();
    }

    add(number, units) {
      number = Number(number); // eslint-disable-line no-param-reassign

      const unit = Utils.p(units);

      const instanceFactorySet = n => {
        const d = dayjs(this);
        return Utils.w(d.date(d.date() + Math.round(n * number)), this);
      };

      if (unit === M) {
        return this.set(M, this.$M + number);
      }

      if (unit === Y) {
        return this.set(Y, this.$y + number);
      }

      if (unit === D) {
        return instanceFactorySet(1);
      }

      if (unit === W) {
        return instanceFactorySet(7);
      }

      const step = {
        [MIN]: MILLISECONDS_A_MINUTE,
        [H]: MILLISECONDS_A_HOUR,
        [S]: MILLISECONDS_A_SECOND
      }[unit] || 1; // ms

      const nextTimeStamp = this.$d.getTime() + number * step;
      return Utils.w(nextTimeStamp, this);
    }

    subtract(number, string) {
      return this.add(number * -1, string);
    }

    format(formatStr) {
      if (!this.isValid()) return INVALID_DATE_STRING;
      const str = formatStr || FORMAT_DEFAULT;
      const zoneStr = Utils.z(this);
      const locale = this.$locale();
      const {
        $H,
        $m,
        $M
      } = this;
      const {
        weekdays,
        months,
        meridiem
      } = locale;

      const getShort = (arr, index, full, length) => arr && (arr[index] || arr(this, str)) || full[index].substr(0, length);

      const get$H = num => Utils.s($H % 12 || 12, num, '0');

      const meridiemFunc = meridiem || ((hour, minute, isLowercase) => {
        const m = hour < 12 ? 'AM' : 'PM';
        return isLowercase ? m.toLowerCase() : m;
      });

      const matches = {
        YY: String(this.$y).slice(-2),
        YYYY: this.$y,
        M: $M + 1,
        MM: Utils.s($M + 1, 2, '0'),
        MMM: getShort(locale.monthsShort, $M, months, 3),
        MMMM: getShort(months, $M),
        D: this.$D,
        DD: Utils.s(this.$D, 2, '0'),
        d: String(this.$W),
        dd: getShort(locale.weekdaysMin, this.$W, weekdays, 2),
        ddd: getShort(locale.weekdaysShort, this.$W, weekdays, 3),
        dddd: weekdays[this.$W],
        H: String($H),
        HH: Utils.s($H, 2, '0'),
        h: get$H(1),
        hh: get$H(2),
        a: meridiemFunc($H, $m, true),
        A: meridiemFunc($H, $m, false),
        m: String($m),
        mm: Utils.s($m, 2, '0'),
        s: String(this.$s),
        ss: Utils.s(this.$s, 2, '0'),
        SSS: Utils.s(this.$ms, 3, '0'),
        Z: zoneStr // 'ZZ' logic below

      };
      return str.replace(REGEX_FORMAT, (match, $1) => $1 || matches[match] || zoneStr.replace(':', '')); // 'ZZ'
    }

    utcOffset() {
      // Because a bug at FF24, we're rounding the timezone offset around 15 minutes
      // https://github.com/moment/moment/pull/1871
      return -Math.round(this.$d.getTimezoneOffset() / 15) * 15;
    }

    diff(input, units, float) {
      const unit = Utils.p(units);
      const that = dayjs(input);
      const zoneDelta = (that.utcOffset() - this.utcOffset()) * MILLISECONDS_A_MINUTE;
      const diff = this - that;
      let result = Utils.m(this, that);
      result = {
        [Y]: result / 12,
        [M]: result,
        [Q]: result / 3,
        [W]: (diff - zoneDelta) / MILLISECONDS_A_WEEK,
        [D]: (diff - zoneDelta) / MILLISECONDS_A_DAY,
        [H]: diff / MILLISECONDS_A_HOUR,
        [MIN]: diff / MILLISECONDS_A_MINUTE,
        [S]: diff / MILLISECONDS_A_SECOND
      }[unit] || diff; // milliseconds

      return float ? result : Utils.a(result);
    }

    daysInMonth() {
      return this.endOf(M).$D;
    }

    $locale() {
      // get locale object
      return Ls[this.$L];
    }

    locale(preset, object) {
      if (!preset) return this.$L;
      const that = this.clone();
      const nextLocaleName = parseLocale(preset, object, true);
      if (nextLocaleName) that.$L = nextLocaleName;
      return that;
    }

    clone() {
      return Utils.w(this.$d, this);
    }

    toDate() {
      return new Date(this.valueOf());
    }

    toJSON() {
      return this.isValid() ? this.toISOString() : null;
    }

    toISOString() {
      // ie 8 return
      // new Dayjs(this.valueOf() + this.$d.getTimezoneOffset() * 60000)
      // .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
      return this.$d.toISOString();
    }

    toString() {
      return this.$d.toUTCString();
    }

  }

  dayjs.prototype = Dayjs.prototype;

  dayjs.extend = (plugin, option) => {
    plugin(option, Dayjs, dayjs);
    return dayjs;
  };

  dayjs.locale = parseLocale;
  dayjs.isDayjs = isDayjs;

  dayjs.unix = timestamp => dayjs(timestamp * 1e3);

  dayjs.en = Ls[L];
  dayjs.Ls = Ls;
  return dayjs;
};

var dayjs = functions$1.main();

/* eslint-disable */

/* https://raw.githubusercontent.com/iamkun/dayjs/dev/src/plugin/customParseFormat/index.js */
const functions$2 = {}; // avoid polluting main context

functions$2.main = () => {
  const formattingTokens = /(\[[^[]*\])|([-:/.()\s]+)|(A|a|YYYY|YY?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g;
  const match1 = /\d/; // 0 - 9

  const match2 = /\d\d/; // 00 - 99

  const match3 = /\d{3}/; // 000 - 999

  const match4 = /\d{4}/; // 0000 - 9999

  const match1to2 = /\d\d?/; // 0 - 99

  const matchUpperCaseAMPM = /[AP]M/;
  const matchLowerCaseAMPM = /[ap]m/;
  const matchSigned = /[+-]?\d+/; // -inf - inf

  const matchOffset = /[+-]\d\d:?\d\d/; // +00:00 -00:00 +0000 or -0000

  const matchWord = /\d*[^\s\d-:/()]+/; // Word

  let locale;

  function offsetFromString(string) {
    const parts = string.match(/([+-]|\d\d)/g);
    const minutes = +(parts[1] * 60) + +parts[2];
    return minutes === 0 ? 0 : parts[0] === '+' ? -minutes : minutes; // eslint-disable-line no-nested-ternary
  }

  const addInput = function (property) {
    return function (input) {
      this[property] = +input;
    };
  };

  const zoneExpressions = [matchOffset, function (input) {
    const zone = this.zone || (this.zone = {});
    zone.offset = offsetFromString(input);
  }];

  const getLocalePart = name => {
    const part = locale[name];
    return part && (part.indexOf ? part : part.s.concat(part.f));
  };

  const expressions = {
    A: [matchUpperCaseAMPM, function (input) {
      this.afternoon = input === 'PM';
    }],
    a: [matchLowerCaseAMPM, function (input) {
      this.afternoon = input === 'pm';
    }],
    S: [match1, function (input) {
      this.milliseconds = +input * 100;
    }],
    SS: [match2, function (input) {
      this.milliseconds = +input * 10;
    }],
    SSS: [match3, function (input) {
      this.milliseconds = +input;
    }],
    s: [match1to2, addInput('seconds')],
    ss: [match1to2, addInput('seconds')],
    m: [match1to2, addInput('minutes')],
    mm: [match1to2, addInput('minutes')],
    H: [match1to2, addInput('hours')],
    h: [match1to2, addInput('hours')],
    HH: [match1to2, addInput('hours')],
    hh: [match1to2, addInput('hours')],
    D: [match1to2, addInput('day')],
    DD: [match2, addInput('day')],
    Do: [matchWord, function (input) {
      const {
        ordinal
      } = locale;
      [this.day] = input.match(/\d+/);
      if (!ordinal) return;

      for (let i = 1; i <= 31; i += 1) {
        if (ordinal(i).replace(/\[|\]/g, '') === input) {
          this.day = i;
        }
      }
    }],
    M: [match1to2, addInput('month')],
    MM: [match2, addInput('month')],
    MMM: [matchWord, function (input) {
      const months = getLocalePart('months');
      const monthsShort = getLocalePart('monthsShort');
      const matchIndex = (monthsShort || months.map(_ => _.substr(0, 3))).indexOf(input) + 1;

      if (matchIndex < 1) {
        throw new Error();
      }

      this.month = matchIndex % 12 || matchIndex;
    }],
    MMMM: [matchWord, function (input) {
      const months = getLocalePart('months');
      const matchIndex = months.indexOf(input) + 1;

      if (matchIndex < 1) {
        throw new Error();
      }

      this.month = matchIndex % 12 || matchIndex;
    }],
    Y: [matchSigned, addInput('year')],
    YY: [match2, function (input) {
      input = +input;
      this.year = input + (input > 68 ? 1900 : 2000);
    }],
    YYYY: [match4, addInput('year')],
    Z: zoneExpressions,
    ZZ: zoneExpressions
  };

  function correctHours(time) {
    const {
      afternoon
    } = time;

    if (afternoon !== undefined) {
      const {
        hours
      } = time;

      if (afternoon) {
        if (hours < 12) {
          time.hours += 12;
        }
      } else if (hours === 12) {
        time.hours = 0;
      }

      delete time.afternoon;
    }
  }

  function makeParser(format) {
    const array = format.match(formattingTokens);
    const {
      length
    } = array;

    for (let i = 0; i < length; i += 1) {
      const token = array[i];
      const parseTo = expressions[token];
      const regex = parseTo && parseTo[0];
      const parser = parseTo && parseTo[1];

      if (parser) {
        array[i] = {
          regex,
          parser
        };
      } else {
        array[i] = token.replace(/^\[|\]$/g, '');
      }
    }

    return function (input) {
      const time = {};

      for (let i = 0, start = 0; i < length; i += 1) {
        const token = array[i];

        if (typeof token === 'string') {
          start += token.length;
        } else {
          const {
            regex,
            parser
          } = token;
          const part = input.substr(start);
          const match = regex.exec(part);
          const value = match[0];
          parser.call(time, value);
          input = input.replace(value, '');
        }
      }

      correctHours(time);
      return time;
    };
  }

  const parseFormattedInput = (input, format, utc) => {
    try {
      const parser = makeParser(format);
      const {
        year,
        month,
        day,
        hours,
        minutes,
        seconds,
        milliseconds,
        zone
      } = parser(input);
      const now = new Date();
      const d = day || (!year && !month ? now.getDate() : 1);
      const y = year || now.getFullYear();
      let M = 0;

      if (!(year && !month)) {
        M = month > 0 ? month - 1 : now.getMonth();
      }

      const h = hours || 0;
      const m = minutes || 0;
      const s = seconds || 0;
      const ms = milliseconds || 0;

      if (zone) {
        return new Date(Date.UTC(y, M, d, h, m, s, ms + zone.offset * 60 * 1000));
      }

      if (utc) {
        return new Date(Date.UTC(y, M, d, h, m, s, ms));
      }

      return new Date(y, M, d, h, m, s, ms);
    } catch (e) {
      return new Date(''); // Invalid Date
    }
  };

  return (o, C, d) => {
    const proto = C.prototype;
    const oldParse = proto.parse;

    proto.parse = function (cfg) {
      const {
        date,
        utc,
        args
      } = cfg;
      this.$u = utc;
      const format = args[1];

      if (typeof format === 'string') {
        const isStrictWithoutLocale = args[2] === true;
        const isStrictWithLocale = args[3] === true;
        const isStrict = isStrictWithoutLocale || isStrictWithLocale;
        let pl = args[2];
        if (isStrictWithLocale) [,, pl] = args;

        if (!isStrictWithoutLocale) {
          locale = pl ? d.Ls[pl] : this.$locale();
        }

        this.$d = parseFormattedInput(date, format, utc);
        this.init();
        if (pl && pl !== true) this.$L = this.locale(pl).$L;

        if (isStrict && date !== this.format(format)) {
          this.$d = new Date('');
        }
      } else if (format instanceof Array) {
        const len = format.length;

        for (let i = 1; i <= len; i += 1) {
          args[1] = format[i - 1];
          const result = d.apply(this, args);

          if (result.isValid()) {
            this.$d = result.$d;
            this.$L = result.$L;
            this.init();
            break;
          }

          if (i === len) this.$d = new Date('');
        }
      } else {
        oldParse.call(this, cfg);
      }
    };
  };
};

var customParseFormat = functions$2.main();

/*
We did this instead of importing from npm
because it will generate an easier to use code
with micronbundler. Avoid polluting main function context.
https://github.com/iamkun/dayjs
*/
dayjs.extend(customParseFormat);

class Formatters {
  static numeric(value, separator = '.') {
    // replace separator to have a clean number to cast properly
    return Number(Formatters.string(value).replace(separator, ''));
  }

  static string(value) {
    return String(value).trim();
  }

  static date({
    raw,
    format = '',
    strict = false
  } = {}) {
    // see https://github.com/iamkun/dayjs
    console.log('Formatting Date', {
      raw,
      format
    });
    return dayjs(Formatters.string(raw), format, strict);
  }

}

/**
 * Defines the base class for parsers
 */

class BaseParser {
  constructor({
    email,
    config,
    name,
    entity,
    label,
    type,
    currency,
    version,
    createdAt = null
  }) {
    this.email = email;
    this.config = config;
    this.validators = Validators;
    this.types = Types;
    this.formatters = Formatters;
    this.type = type;
    this.entity = entity;
    this.name = name;
    this.label = label;
    this.currency = currency;
    this.version = version;
    this._result = {
      amount: 0,
      // The amount inside the email content.
      context: '',
      // Normally the store, the person, or similar info to give context to the transaction.
      account: '',
      // Associated card number, user account or any other info from wich the transaction took place.
      date: {
        formatter: {},
        // DayJS object or similar date formatter
        raw: '' // Raw date string

      },
      name: this.name,
      // Parser Name.
      type: this.type,
      // Parser type expense, deposit, alert, other.
      label: this.label,
      // Parser label.
      entity: this.entity,
      // Which bank or entity processed the email.
      currency: this.currency,
      // Currency associated with the ammount.
      meta: {},
      // Any other info not fit in the previous properties.
      comment: '',
      // Additional comment.
      createdAt: createdAt || new Date(),
      // When this was processed.
      version: this.version,
      parsed: false // tells if the parse was successful

    };
  }
  /**
   * @return {string} is this an expense or a deposit?
   */


  static get type() {
    return Types.expense;
  }
  /**
   * @return {string} name of the parser
   */


  static get name() {
    return 'My Custom Parser';
  }
  /**
   * Label associated with the email
   * must follow the format {type}:{countrycode}-{entity}:{context}
   * override in child
   * @return {string} the label associated with the email
   */


  static get label() {
    return '{type}:{countrycode}-{entity}:{context}';
  }

  static get labels() {
    return {};
  }

  static labelForQuery(label) {
    // label query format
    console.log('Label For Query', {
      label
    });
    const prefix = 'biyete'; // Gmail in search needs + signs to differentiate spaces

    const formatted = label.replace(' ', '+').toLowerCase(); // Example: biyete/expense:cl-bancoestado:purchase-notifications

    const key = prefix + '/' + formatted; // Example: biyete-expense:cl-bancoestado:purchase-notifications

    const query = prefix + '-' + formatted;
    return {
      raw: label,
      formatted,
      key,
      query
    };
  }
  /**
   * @return {string} wich company is related to this parser
   */


  static get entity() {
    return 'My Custom Company';
  }
  /**
   * Parser version.
   * Try following SemVer or similar if possible.
   * @return {string} the current parser version
   */


  static get version() {
    return '0.0.1';
  }

  static get types() {
    return Types;
  }

  static get validators() {
    return Validators;
  }

  static get formatters() {
    return Formatters;
  }

  static getGroups(regex, text) {
    const matches = text.matchAll(regex); // convert from iterable object to simple array

    let groups = [];

    for (const match of matches) {
      groups = [...groups, ...match];
    }

    return groups;
  } // Instance Methods


  get result() {
    return this._result;
  }

  setResult(data) {
    this._result = { ...this._result,
      ...data
    };
    console.log('Parser Result', this._result);
    return this.result;
  }

  groups(regex, text) {
    return BaseParser.getGroups(regex, text);
  } // Implement in Child Class


  parse() {
    console.log('Init Parsing');
    return {};
  }

}

const donation = 'deposit:cl-bancoestado:donation-notifications';
const transfer = 'deposit:cl-bancoestado:transfer-notifications';
const purchase = 'expense:cl-bancoestado:purchase-notifications';
var Labels = {
  donation,
  purchase,
  transfer
};

class BaseBancoEstadoParser extends BaseParser {
  constructor({
    email,
    config,
    type,
    name,
    label,
    version
  }) {
    super({
      email,
      config,
      entity: EntityName,
      type,
      name,
      label,
      version,
      currency: new CLP()
    });
  }

  static get entity() {
    return EntityName;
  }

  static get labels() {
    return Labels;
  }

}

class BancoEstadoExpensePurchaseParser extends BaseBancoEstadoParser {
  constructor({
    email,
    config
  }) {
    super({
      email,
      config,
      type: BancoEstadoExpensePurchaseParser.type,
      name: BancoEstadoExpensePurchaseParser.name,
      label: BancoEstadoExpensePurchaseParser.label,
      version: BancoEstadoExpensePurchaseParser.version
    });
  }

  static get type() {
    return BaseBancoEstadoParser.types.expense;
  }

  static get name() {
    const entity = BaseBancoEstadoParser.entity;
    return `${entity} Purchase Notification Parser`;
  }

  static get label() {
    return BaseBancoEstadoParser.labels.purchase;
  }

  static get version() {
    return '1.0.0';
  }

  parse() {
    const email = this.email.message;
    console.log('Parsing Email', email.id, 'With', this.name);
    const body = email.body.toLowerCase();

    if (this.validators.isEmptyString(body)) {
      console.warn('Empty body, nothing to parse.');
      return this.result;
    }

    console.log('Body', email.body);

    const getAmount = () => {
      const regex = /se\s*ha\s*realizado\s*una\s*compra\s*por\s*\$\s*([\S]+)/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.numeric(groups[1]);
      console.log('Amount', value);
      return value;
    };

    const getContext = () => {
      const regex = /se\s*ha\s*realizado\s*una\s*compra\s*por\s*[$\w.]*\s*en\s*([\s\S]+)\s*asociado\s*a\s*su\s*tarjeta\s*terminada/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      console.log('Context', value);
      return value;
    };

    const getAccount = () => {
      const regex = /[\s\S]*tarjeta\s*terminada\s*en\s*([\s\S]+)\s*el/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      console.log('Account', value);
      return value;
    };

    const getDate = () => {
      const getDay = () => {
        const regex = /[\s\S]*el\s*dia\s*([\s\S]+)\s*a\s*las/gim;
        const groups = this.groups(regex, body);
        const value = this.formatters.string(groups[1]);
        console.log('Day', value);
        return value;
      };

      const getHour = () => {
        const regex = /[\s\S]*el\s*dia\s*[\s\S]+\s*a\s*las\s*([\S\s]+)hrs.*/gim;
        const groups = this.groups(regex, body);
        const value = this.formatters.string(groups[1]);
        console.log('Hour', value);
        return value;
      };

      const raw = getDay() + ' ' + getHour(); // 27/06/2020 13:08

      const format = 'DD/MM/YYYY HH:mm';
      const formatter = this.formatters.date({
        raw,
        format
      });
      return {
        raw,
        formatter
      };
    };

    return this.setResult({
      amount: getAmount(),
      context: getContext(),
      account: getAccount(),
      date: getDate(),
      parsed: true
    });
  }

}

class BancoEstadoDepositDonationParser extends BaseBancoEstadoParser {
  constructor({
    email,
    config
  }) {
    super({
      email,
      config,
      type: BancoEstadoDepositDonationParser.type,
      name: BancoEstadoDepositDonationParser.name,
      label: BancoEstadoDepositDonationParser.label,
      version: BancoEstadoDepositDonationParser.version
    });
  }

  static get type() {
    return BaseBancoEstadoParser.types.deposit;
  }

  static get name() {
    const entity = BaseBancoEstadoParser.entity;
    return `${entity} Donation Notification Parser`;
  }

  static get label() {
    return BaseBancoEstadoParser.labels.donation;
  }

  static get version() {
    return '1.0.0';
  }

  parse() {
    const email = this.email.message;
    console.log('Parsing Email', email.id, 'With', this.name, this.version);
    const body = email.body.toLowerCase();
    console.log('Body', email.body);

    if (this.validators.isEmptyString(body)) {
      console.warn('Empty body, nothing to parse.');
      return this.result;
    }

    const getDate = () => {
      const regex = /Te informamos que hoy[ *]*([\w ]+)/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]); // 13 de julio 2020

      const data = value.split(' '); // TODO: Test parsing numbers

      if (data[2]) {
        const months = {
          enero: '01',
          febrero: '02',
          marzo: '03',
          abril: '04',
          mayo: '05',
          junio: '06',
          julio: '07',
          agosto: '08',
          septiembre: '09',
          octubre: '10',
          noviembre: '11',
          diciembre: '12'
        };
        const dayNumber = Number(data[0]);
        const day = dayNumber < 10 ? '0' + dayNumber : dayNumber;
        const month = months[data[2].toLowerCase().trim()];
        const year = data[3];
        const date = day + '/' + month + '/' + year;
        const format = 'DD/MM/YYYY';
        return {
          formatter: this.formatters.date({
            raw: date,
            format
          }),
          raw: value
        };
      }

      console.warn('Could not format date', value);
      return {
        formatter: this.formatters.date({
          raw: value
        }),
        raw: value
      };
    };

    const getAmount = () => {
      const regex = /recibida:[ *$]*([\w. ]+)/gim;
      const groups = this.groups(regex, body);
      return this.formatters.numeric(groups[1]);
    };

    const getName = () => {
      const regex = /Nombre[\r\n:]*([\w ]+)/gim;
      const groups = this.groups(regex, body);
      return this.formatters.string(groups[1]);
    };

    const getId = () => {
      const regex = /RUT[\r\n:]*([\w ]+)/gim;
      const groups = this.groups(regex, body);
      return this.formatters.string(groups[1]);
    };

    const getContext = () => {
      const regex = /Banco[\r\n:]*([\w ]+)/gim;
      const groups = this.groups(regex, body);
      return this.formatters.string(groups[1]);
    };

    const result = {
      date: getDate(),
      amount: getAmount(),
      comment: getName(),
      account: getId(),
      context: getContext(),
      parsed: true
    };
    return this.setResult(result);
  }

}

class BancoEstadoDepositTransferParser extends BaseBancoEstadoParser {
  constructor({
    email,
    config
  }) {
    super({
      email,
      config,
      type: BancoEstadoDepositTransferParser.type,
      name: BancoEstadoDepositTransferParser.name,
      label: BancoEstadoDepositTransferParser.label,
      version: BancoEstadoDepositTransferParser.version
    });
  }

  static get type() {
    return BaseBancoEstadoParser.types.deposit;
  }

  static get name() {
    const entity = BaseBancoEstadoParser.entity;
    return `${entity} Transfer Notification Parser`;
  }

  static get label() {
    return BaseBancoEstadoParser.labels.transfer;
  }

  static get version() {
    return '1.0.0';
  }

  parse() {
    const email = this.email.message;
    console.log('Parsing Email', email, 'With', this.name);
    const body = email.body.toLowerCase();

    if (this.validators.isEmptyString(body)) {
      console.warn('Empty body, nothing to parse.');
      return this.result;
    }

    console.log('Body', email.body);

    const getDate = () => {
      const regex = /[[\s\S]*\(tef\)[\s\S]*te\s*informamos\s*que\s*hoy\s*\*([\s\S]+)\*,\s*has\s*recibido\s*una\s*transferencia/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      console.log('Got Date', value); // Example 13 de julio de 2020

      const data = value.split(' ');
      console.log('Date components', data);
      const months = {
        enero: '01',
        febrero: '02',
        marzo: '03',
        abril: '04',
        mayo: '05',
        junio: '06',
        julio: '07',
        agosto: '08',
        septiembre: '09',
        octubre: '10',
        noviembre: '11',
        diciembre: '12'
      }; // TODO: Improve this, move it to a better place

      const dayNumber = Number(data[0]);
      const day = dayNumber < 10 ? '0' + dayNumber : dayNumber;

      if (data[2]) {
        const month = months[data[2].toLowerCase().trim()];
        const year = data[4];
        const date = day + '/' + month + '/' + year;
        const format = 'DD/MM/YYYY';
        return {
          formatter: this.formatters.date({
            raw: date,
            format
          }),
          raw: value
        };
      } // we have the other date format
      // 21/07/2020 11:39:20


      return {
        formatter: this.formatters.date({
          raw: value,
          format: 'DD/MM/YYYY HH:mm:ss'
        }),
        raw: value
      };
    };

    const getFrom = () => {
      const regex = /[\S\s]*,\s*de\s*nuestro\(a\)\s*cliente\s*\*([\s\S]+)\*,/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      return value;
    };

    const getTo = () => {
      const regex = /[\s\S]*nombre\*\s*\*:\*([\s\S]+)\s*\*rut/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      return value;
    };

    const getAmount = () => {
      const regex = /[\s\S]*monto\s*transferido:\s*\*\$([\w.]+)/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.numeric(groups[1]);
      return value;
    };

    const getRut = () => {
      const regex = /[\s\S]*rut\*\s*\*:\*\s*(\S+)\s*\*banco\*/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      return value;
    };

    const getEntity = () => {
      const regex = /[\s\S]*\*banco\*\s*\*:\*\s*([\s\S]+)\*n[\s\S]*de\s*cuenta\*/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      return value;
    };

    const getAccount = () => {
      const regex = /[\s\S]*\*n[\s\S]*de\s*cuenta\*\s*\*:\*\s*([\s\S]+)\s*\*n\S+\s*de\s*operaci/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      return value;
    };

    const getTransactionId = () => {
      const regex = /[\s\S]*\*n\S+\s*de\s*operaci\S+\s*\*:\*\s*([\s\S]+)\s*\*comentario\*/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      return value;
    };

    const getComment = () => {
      const regex = /[\s\S]*\*comentario\*\s*\*:\*([\s\S]*)\[image:/gim;
      const groups = this.groups(regex, body);
      const value = this.formatters.string(groups[1]);
      return value;
    };

    return this.setResult({
      amount: getAmount(),
      context: getRut(),
      account: getAccount(),
      comment: getComment(),
      date: getDate(),
      meta: {
        from: getFrom(),
        to: getTo(),
        rut: getRut(),
        entity: getEntity(),
        transaction: getTransactionId()
      },
      parsed: true
    });
  }

}

var parsers = [BancoEstadoExpensePurchaseParser, BancoEstadoDepositDonationParser, BancoEstadoDepositTransferParser];

class BancoEstadoEntity extends BaseEntity {
  static get id() {
    return 'cl.bancoestado';
  }

  static get name() {
    return EntityName;
  }

  static get actions() {
    return actions$1;
  }

  static get parsers() {
    return parsers;
  }

}

const entities$1 = [BancoEstadoEntity];

var timezones = ['America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter'];

class ChileCountry extends BaseCountry {
  static get id() {
    return 'cl';
  }

  static get name() {
    return 'Chile';
  }

  static get entities() {
    return entities$1;
  }

  static get currencies() {
    return currencies;
  }

  static get timezones() {
    return timezones;
  }

}

// Configure here your plugins and actions
const countries = [ChileCountry];
var Plugins = {
  actions,
  entities,
  countries
};

/* Global Configuration Start */
// Maximum number of unread threads to fetch on each label.
// Keep this number low.
// Normally you can have 100 messages per thread
const maxThreads = 1;

// For Developer's Eyes Only
/**
 * Provides access to application configuration
 */

class Config {
  constructor({
    entities,
    actions,
    countries
  }) {
    this._actions = actions;
    this._entities = entities;
    this._countries = countries;
  }

  get maxThreads() {
    return maxThreads;
  }

  get actions() {
    return this._actions;
  }

  get entities() {
    return this._entities;
  }

  get countries() {
    return this._countries;
  }

}

/**
 * Gmail API Wrapper
 */
class Mailer {
  constructor(api = GmailApp) {
    this.api = api;
  }

  labelExists(label) {
    // https://developers.google.com/apps-script/reference/gmail/gmail-app#getUserLabelByName(String)
    const labelinstance = this.api.getUserLabelByName(label);

    if (!labelinstance) {
      console.log('No label named', label);
      return false;
    }

    return true;
  }

  formatMessage(message, query) {
    // https://developers.google.com/apps-script/reference/gmail/gmail-message
    const value = {
      subject: message.getSubject(),
      body: message.getPlainBody(),
      from: message.getFrom(),
      date: message.getDate(),
      id: message.getId(),
      isUnread: message.isUnread(),
      thread: message.getThread(),
      message,
      query
    };
    value.labels = value.thread.getLabels().map(label => this.formatLabel(label, query));
    console.log('Got Message', value);
    return value;
  }

  formatLabel(label, query) {
    // https://developers.google.com/apps-script/reference/gmail/gmail-label
    return {
      name: label.getName(),
      label,
      query
    };
  }

  search({
    query,
    start,
    max
  }) {
    // https://developers.google.com/apps-script/reference/gmail/gmail-app#searchquery,-start,-max
    const results = []; // TODO: Improve this for more perfomance

    for (const item of query.queries) {
      const threads = this.api.search(item, start, max);
      console.log('Searching Emails With: ', item);
      console.log(threads.length, 'Threads found');
      let messages = [];
      let labels = []; // https://developers.google.com/apps-script/reference/gmail/gmail-thread

      threads.forEach(thread => {
        messages = [...messages, ...thread.getMessages().map(message => this.formatMessage(message, query))];
        labels = [...labels, ...thread.getLabels().map(label => this.formatLabel(label, query))];
      });
      results.push({
        threads,
        messages,
        labels,
        query,
        start,
        max,
        item
      });
    }

    return results;
  }

  markAsRead(email) {
    console.log('Marking', email.message, 'As Read'); // https://developers.google.com/apps-script/reference/gmail/gmail-app#markmessagesreadmessages

    this.api.markMessageRead(email.message.message);
  }

}

class QueryBuilder {
  constructor({
    entities,
    config
  }) {
    this._entities = entities;
    this._elements = {};
    this._query = null;
    this._labels = [];
    this._queries = [];
    this.config = config;
    this.init();
  }

  init() {
    this._entities.forEach(entity => {
      entity.parsers.forEach((ParserClass, index) => {
        const label = ParserClass.labelForQuery(ParserClass.label);

        if (label) {
          const element = {
            name: index,
            entity,
            parser: ParserClass,
            label
          };
          this._elements[label.key] = element;
          this._elements[label.raw] = element;
          this._elements[label.formatted] = element;
          this._elements[label.query] = element;

          this._labels.push(label.query);
        }
      });
    });

    this.build();
  }
  /**
   * Will create a Query for Gmail
   * example: in:unread (label:my-label1 | label:my-label2)
   * @returns {Object} this;
   */


  build() {
    let query = 'in:unread (';
    this.labels.forEach((label, index) => {
      const element = this.elementForLabel({
        label
      });
      query += `label:${element.label.query}`; // for making individual queries

      this.queries.push(`in:unread (label:${element.label.query})`);

      if (index < this.labels.length - 1) {
        query += ' | ';
      }
    });
    query = query.trim() + ')';
    this._query = query;
    return this;
  }

  get labels() {
    if (!this._labels) {
      this._labels = [];
      this.init();
    }

    return this._labels;
  }

  get query() {
    if (!this._query) {
      this.init();
    }

    return this._query;
  }

  get queries() {
    if (!this._queries) {
      this._queries = [];
      this.init();
    }

    return this._queries;
  }

  get elements() {
    if (!this._elements) {
      this.init();
    }

    return this._elements;
  }

  get entities() {
    return this._entities;
  }

  get data() {
    return {
      elements: this.elements,
      labels: this.labels,
      query: this.query,
      entities: this.entities
    };
  }

  get json() {
    return JSON.stringify(this.data);
  }

  elementForLabel({
    label
  }) {
    const key = String(label.name || label).toLowerCase();
    console.log('Getting Element For Label', key);
    const element = this._elements[key];

    if (element) {
      console.log('Element found', element);
    }

    return element;
  }

  elementForLabels({
    labels
  }) {
    // One email can have multiple labels
    // return the first element that have a known label
    let element = null;

    for (const label of labels) {
      element = this.elementForLabel({
        label
      });

      if (element) {
        console.log('Element Found', {
          element,
          label: label.name
        });
        break;
      }
    }

    return element;
  }

  parserForLabels({
    labels
  }) {
    const element = this.elementForLabels({
      labels
    });
    return element.parser;
  }

}

class Email {
  constructor({
    entities,
    config,
    mailer = null,
    queryBuilder = null
  }) {
    this.api = mailer || new Mailer();
    this.queryBuilder = queryBuilder || new QueryBuilder({
      entities,
      config
    });
    this.entities = entities;
    this.max = config.maxThreads;
    this.config = config;
  }

  getEmails() {
    const results = this.api.search({
      query: this.queryBuilder,
      start: 0,
      max: this.max
    });
    console.log('Results', results);
    const emails = [];

    for (const threads of results) {
      for (const thread of threads.threads) {
        const {
          messages,
          labels
        } = threads;

        for (const message of messages) {
          if (message.isUnread) {
            const email = {
              labels,
              message,
              element: {},
              info: {},
              thread
            };

            email.markAsRead = () => {
              this.api.markAsRead(email);
            };

            const element = this.queryBuilder.elementForLabels({
              labels
            });

            if (element) {
              console.log('Parsing Element', element);
              const Parser = element.parser;

              if (Parser) {
                const parser = new Parser({
                  email,
                  config: this.config
                });

                if (parser) {
                  console.log('Parser Found', {
                    parser,
                    labels
                  });

                  try {
                    const info = parser.parse();
                    console.log('Info', info);

                    if (info && info.parsed) {
                      email.info = info;
                      email.element = element;
                      console.log('Email was parsed. Saving to list');
                      emails.push(email);
                    } else {
                      console.warn('Could not parse Email', email);
                      email.markAsRead();
                    }
                  } catch (ex) {
                    console.warn(ex);
                    email.markAsRead();
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log(emails.length, 'Unread Emails found');
    return emails;
  }

}

const main = () => {
  console.log('Init');
  const config = new Config({
    entities: Plugins.entities,
    actions: Plugins.actions,
    countries: Plugins.countries
  });
  let emails = [];
  let total = 0;
  config.countries.forEach(CountryClass => {
    const entities = [...CountryClass.entities, ...config.entities];
    const finder = new Email({
      entities,
      config
    });
    const items = finder.getEmails();
    emails = [...emails, ...items];
    total += items.length;
  });
  emails.forEach(email => {
    console.log('Running Entity Actions');
    email.element.entity.actions.forEach(ActionClass => {
      // Apply specific action to email
      const action = new ActionClass({
        email,
        config
      });
      action.run();
    });
    console.log('Running Global Actions');
    config.actions.forEach(ActionClass => {
      // Apply global action to every email
      const action = new ActionClass({
        email,
        config
      });
      action.run();
    });
    email.markAsRead();
  });
  console.log('Done. Processed', total, 'items');
}; // Google Action do not supports exports.

export default main;
