<template>
  <div>
    <section
      v-if="isVisible('ip')"
      id="tool-ip"
      ref="ip"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>IP 归属地查询</h2>
        <div class="tool-card__actions">
          <button type="button" @click="lookupIpLocation">查询</button>
          <button type="button" class="ghost" @click="clearIpLookup">清空</button>
        </div>
      </div>
      <input
        v-model.trim="ipLookupValue"
        class="tool-input"
        type="text"
        placeholder="输入 IP，例如 8.8.8.8、127.0.0.1、2408:8000::1"
        @keyup.enter="lookupIpLocation"
      >
      <textarea
        :value="ipLookupResult"
        rows="6"
        readonly
        placeholder="查询结果会显示在这里"
      />
      <div class="tool-card__footer">
        <span>{{ ipLookupMessage }}</span>
        <button type="button" class="ghost" @click="copyText(ipLookupResult, 'ip')">复制结果</button>
      </div>
    </section>

    <section
      v-if="isVisible('timestamp')"
      id="tool-timestamp"
      ref="timestamp"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>时间戳转换</h2>
        <div class="tool-card__actions">
          <button type="button" @click="convertTimestamp">转换</button>
          <button type="button" class="ghost" @click="fillCurrentTimestamp">当前时间</button>
        </div>
      </div>
      <textarea
        v-model="timestampValue"
        rows="4"
        placeholder="输入秒级/毫秒级时间戳，或输入 2026-07-16 15:30:00 这类时间"
      />
      <textarea
        :value="timestampResult"
        rows="6"
        readonly
        placeholder="结果会显示在这里"
      />
      <div class="tool-card__footer">
        <span>{{ timestampMessage }}</span>
        <button type="button" class="ghost" @click="copyText(timestampResult, 'timestamp')">复制结果</button>
      </div>

      <div class="tool-divider"></div>

      <div class="tool-subsection">
        <div class="tool-subsection__header">
          <h3 class="tool-subsection__title">时间间隔计算</h3>
          <div class="tool-card__actions">
            <button type="button" @click="calculateTimeInterval">计算间隔</button>
            <button type="button" class="ghost" @click="clearTimeInterval">清空</button>
          </div>
        </div>
        <div class="time-range-grid">
          <div class="time-range-field">
            <span>开始时间</span>
            <textarea
              v-model="intervalStartValue"
              rows="4"
              placeholder="输入开始时间，例如 2026-07-16 08:00:00 或 1784160000"
            />
          </div>
          <div class="time-range-field">
            <span>结束时间</span>
            <textarea
              v-model="intervalEndValue"
              rows="4"
              placeholder="输入结束时间，例如 2027-08-20 18:30:45 或 1818757845000"
            />
          </div>
        </div>
        <textarea
          :value="intervalResult"
          rows="8"
          readonly
          placeholder="时间间隔结果会显示在这里"
        />
        <div class="tool-card__footer">
          <span>{{ intervalMessage }}</span>
          <button type="button" class="ghost" @click="copyText(intervalResult, 'interval')">复制结果</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { writeTextToClipboard } from './clipboard';

const IP_LOOKUP_URL = 'https://opendata.baidu.com/api.php';
const ipLocationCache = {};
let ipLookupCounter = 0;

function parseFlexibleDate(value) {
  const text = value.trim();
  if (!text) {
    throw new Error('请输入时间或时间戳。');
  }

  let date;
  if (/^-?\d+$/.test(text)) {
    const numericValue = Number(text);
    const digits = text.replace('-', '').length;
    const millisecondValue = digits <= 10 ? numericValue * 1000 : numericValue;
    date = new Date(millisecondValue);
  } else {
    date = new Date(text);
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error('无法识别该时间格式。');
  }

  return date;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addClampedYears(date, years) {
  const year = date.getFullYear() + years;
  const month = date.getMonth();
  const day = Math.min(date.getDate(), getDaysInMonth(year, month));
  return new Date(
    year,
    month,
    day,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function addClampedMonths(date, months) {
  const totalMonths = date.getMonth() + months;
  const year = date.getFullYear() + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const day = Math.min(date.getDate(), getDaysInMonth(year, month));
  return new Date(
    year,
    month,
    day,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function formatDurationParts(parts) {
  const labels = [
    ['years', '年'],
    ['months', '个月'],
    ['weeks', '周'],
    ['days', '天'],
    ['hours', '小时'],
    ['minutes', '分钟'],
    ['seconds', '秒'],
  ];
  const text = labels
    .filter(([key]) => parts[key] > 0)
    .map(([key, label]) => `${parts[key]}${label}`)
    .join('');

  return text || '0秒';
}

function calculateReadableDuration(firstDate, secondDate) {
  const startDate = firstDate <= secondDate ? firstDate : secondDate;
  const endDate = firstDate <= secondDate ? secondDate : firstDate;
  const reversed = firstDate > secondDate;

  let cursor = new Date(startDate);
  let years = endDate.getFullYear() - cursor.getFullYear();
  while (years > 0 && addClampedYears(cursor, years) > endDate) {
    years -= 1;
  }
  cursor = addClampedYears(cursor, years);

  let months = (endDate.getFullYear() - cursor.getFullYear()) * 12 + (endDate.getMonth() - cursor.getMonth());
  while (months > 0 && addClampedMonths(cursor, months) > endDate) {
    months -= 1;
  }
  cursor = addClampedMonths(cursor, months);

  let remainingMs = endDate.getTime() - cursor.getTime();
  const totalSeconds = Math.floor(remainingMs / 1000);
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;

  const totalDays = Math.floor(remainingMs / dayMs);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  remainingMs -= totalDays * dayMs;

  const hours = Math.floor(remainingMs / hourMs);
  remainingMs -= hours * hourMs;

  const minutes = Math.floor(remainingMs / minuteMs);
  remainingMs -= minutes * minuteMs;

  const seconds = Math.floor(remainingMs / 1000);

  return {
    reversed,
    parts: {
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
    },
    readable: formatDurationParts({
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
    }),
    totalSeconds,
    totalMinutes: Number((totalSeconds / 60).toFixed(6)),
    totalHours: Number((totalSeconds / 3600).toFixed(6)),
    totalDays: Number((totalSeconds / 86400).toFixed(6)),
  };
}

function isIPv4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}

function isIPv6(ip) {
  if (!ip || ip.indexOf(':') === -1) {
    return false;
  }

  return /^[0-9a-fA-F:]+$/.test(ip);
}

function isInternalIP(ip) {
  if (!ip) {
    return false;
  }

  const normalized = ip.trim().toLowerCase();
  if (normalized === '::1') {
    return true;
  }

  if (isIPv4(normalized)) {
    const parts = normalized.split('.');
    const first = Number(parts[0]);
    const second = Number(parts[1]);

    if (first === 127 || first === 10) {
      return true;
    }

    if (first === 172 && second >= 16 && second <= 31) {
      return true;
    }

    if (first === 169 && second === 254) {
      return true;
    }

    if (first === 192 && second === 168) {
      return true;
    }

    return false;
  }

  if (isIPv6(normalized)) {
    if (normalized.startsWith('fd')) {
      return true;
    }

    if (/^fe[89ab]/i.test(normalized)) {
      return true;
    }
  }

  return false;
}

function isValidIp(ip) {
  return isIPv4(ip) || isIPv6(ip);
}

function jsonpLookupIp(ip) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      reject(new Error('当前环境不支持 IP 查询。'));
      return;
    }

    const callbackName = `__toolboxIpLookup_${Date.now()}_${ipLookupCounter++}`;
    const script = document.createElement('script');
    let timer = null;

    const cleanup = () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
    };

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('IP 查询接口调用失败。'));
    };

    const params = new URLSearchParams({
      query: ip,
      resource_id: '6006',
      oe: 'utf8',
      cb: callbackName,
    });

    script.src = `${IP_LOOKUP_URL}?${params.toString()}`;
    script.async = true;
    document.body.appendChild(script);

    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('IP 查询超时，请稍后重试。'));
    }, 10000);
  });
}

export default {
  name: 'ToolboxNetworkTimeTools',
  props: {
    visibleToolIds: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      ipLookupValue: '',
      ipLookupResult: '',
      ipLookupMessage: '支持 IPv4 和 IPv6，浏览器端基于百度 IP 接口查询。',
      timestampValue: '',
      timestampResult: '',
      timestampMessage: '支持秒级、毫秒级时间戳和可解析的日期字符串。',
      intervalStartValue: '',
      intervalEndValue: '',
      intervalResult: '',
      intervalMessage: '支持两个时间点之间的可读性间隔计算。',
    };
  },
  methods: {
    isVisible(id) {
      return this.visibleToolIds.indexOf(id) !== -1;
    },
    getSectionElement(id) {
      return this.$refs[id] || null;
    },
    async lookupIpLocation() {
      const ip = this.ipLookupValue.trim();
      if (!ip) {
        this.ipLookupResult = '';
        this.ipLookupMessage = '请先输入 IP 地址。';
        return;
      }

      if (!isValidIp(ip)) {
        this.ipLookupResult = '';
        this.ipLookupMessage = 'IP 格式不合法，请输入标准 IPv4 或 IPv6。';
        return;
      }

      if (ip === '0.0.0.0') {
        this.ipLookupResult = [
          `查询 IP: ${ip}`,
          '地址类型: 特殊地址',
          '归属地: 未分配地址',
        ].join('\n');
        this.ipLookupMessage = '该地址不做远程归属地查询。';
        return;
      }

      if (ip === '127.0.0.1' || ip === '::1') {
        this.ipLookupResult = [
          `查询 IP: ${ip}`,
          '地址类型: 本机回环地址',
          '归属地: 本机IP',
        ].join('\n');
        this.ipLookupMessage = '已识别为本机回环地址。';
        return;
      }

      if (isInternalIP(ip)) {
        this.ipLookupResult = [
          `查询 IP: ${ip}`,
          '地址类型: 内网地址',
          '归属地: 内网IP',
        ].join('\n');
        this.ipLookupMessage = '已识别为内网地址，不发起公网归属地查询。';
        return;
      }

      const cachedLocation = ipLocationCache[ip];
      if (cachedLocation) {
        this.ipLookupResult = [
          `查询 IP: ${ip}`,
          '地址类型: 公网地址',
          `归属地: ${cachedLocation}`,
          '来源: 本地缓存',
        ].join('\n');
        this.ipLookupMessage = '命中缓存。';
        return;
      }

      this.ipLookupResult = '';
      this.ipLookupMessage = '查询中...';

      try {
        const response = await jsonpLookupIp(ip);
        const location = response && response.status === '0' && response.data && response.data.length
          ? response.data[0].location || ''
          : '';

        if (!location) {
          this.ipLookupMessage = '未查到该 IP 的归属地。';
          return;
        }

        ipLocationCache[ip] = location;
        this.ipLookupResult = [
          `查询 IP: ${ip}`,
          '地址类型: 公网地址',
          `归属地: ${location}`,
          '来源: 百度 IP 接口',
        ].join('\n');
        this.ipLookupMessage = '查询完成。';
      } catch (error) {
        this.ipLookupResult = '';
        this.ipLookupMessage = error.message || 'IP 归属地查询失败。';
      }
    },
    clearIpLookup() {
      this.ipLookupValue = '';
      this.ipLookupResult = '';
      this.ipLookupMessage = '支持 IPv4 和 IPv6，浏览器端基于百度 IP 接口查询。';
    },
    convertTimestamp() {
      try {
        const date = parseFlexibleDate(this.timestampValue);

        this.timestampResult = [
          `本地时间: ${this.formatDate(date)}`,
          `ISO 时间: ${date.toISOString()}`,
          `秒级时间戳: ${Math.floor(date.getTime() / 1000)}`,
          `毫秒级时间戳: ${date.getTime()}`,
        ].join('\n');
        this.timestampMessage = '转换完成。';
      } catch (error) {
        this.timestampResult = '';
        this.timestampMessage = error.message || '时间戳转换失败。';
      }
    },
    fillCurrentTimestamp() {
      this.timestampValue = String(Date.now());
      this.convertTimestamp();
    },
    calculateTimeInterval() {
      try {
        if (!this.intervalStartValue.trim() || !this.intervalEndValue.trim()) {
          throw new Error('请同时输入开始时间和结束时间。');
        }

        const startDate = parseFlexibleDate(this.intervalStartValue);
        const endDate = parseFlexibleDate(this.intervalEndValue);
        const duration = calculateReadableDuration(startDate, endDate);

        this.intervalResult = [
          `可读间隔: （${duration.readable}）`,
          `总天数: ${this.formatSummaryNumber(duration.totalDays)}`,
          `总小时数: ${this.formatSummaryNumber(duration.totalHours)}`,
          `总分钟数: ${this.formatSummaryNumber(duration.totalMinutes)}`,
          `总秒数: ${duration.totalSeconds}`,
        ].join('\n');
        this.intervalMessage = '时间间隔计算完成。';
      } catch (error) {
        this.intervalResult = '';
        this.intervalMessage = error.message || '时间间隔计算失败。';
      }
    },
    clearTimeInterval() {
      this.intervalStartValue = '';
      this.intervalEndValue = '';
      this.intervalResult = '';
      this.intervalMessage = '支持两个时间点之间的可读性间隔计算。';
    },
    formatDate(date) {
      const pad = (value) => String(value).padStart(2, '0');
      return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
      ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    formatSummaryNumber(value) {
      return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '');
    },
    async copyText(value, type) {
      if (!value) {
        return;
      }

      try {
        await writeTextToClipboard(value);
        this.setStatusMessage(type, '结果已复制。');
      } catch (error) {
        this.setStatusMessage(type, '复制失败，请手动复制。');
      }
    },
    setStatusMessage(type, message) {
      if (type === 'ip') {
        this.ipLookupMessage = message;
      } else if (type === 'timestamp') {
        this.timestampMessage = message;
      } else if (type === 'interval') {
        this.intervalMessage = message;
      }
    },
  },
};
</script>
