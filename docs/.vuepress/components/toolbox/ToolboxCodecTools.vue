<template>
  <div>
    <section
      v-if="isVisible('base64')"
      id="tool-base64"
      ref="base64"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>Base64 编解码</h2>
        <div class="tool-card__actions">
          <button type="button" @click="encodeBase64">编码</button>
          <button type="button" class="ghost" @click="decodeBase64">解码</button>
        </div>
      </div>
      <textarea
        v-model="base64Text"
        rows="7"
        placeholder="输入需要编码或解码的文本"
      />
      <textarea
        :value="base64Result"
        rows="7"
        readonly
        placeholder="结果会显示在这里"
      />
      <div class="tool-card__footer">
        <span>{{ base64Message }}</span>
        <button type="button" class="ghost" @click="copyText(base64Result, 'base64')">复制结果</button>
      </div>
    </section>

    <section
      v-if="isVisible('url')"
      id="tool-url"
      ref="url"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>URL 编解码</h2>
        <div class="tool-card__actions">
          <button type="button" @click="encodeUrl">编码</button>
          <button type="button" class="ghost" @click="decodeUrl">解码</button>
        </div>
      </div>
      <textarea
        v-model="urlText"
        rows="7"
        placeholder="输入 URL 或参数片段"
      />
      <textarea
        :value="urlResult"
        rows="7"
        readonly
        placeholder="结果会显示在这里"
      />
      <div class="tool-card__footer">
        <span>{{ urlMessage }}</span>
        <button type="button" class="ghost" @click="copyText(urlResult, 'url')">复制结果</button>
      </div>
    </section>

    <section
      v-if="isVisible('hex')"
      id="tool-hex"
      ref="hex"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>16进制与字符串互转</h2>
        <div class="tool-card__actions">
          <button type="button" @click="encodeHex">转16进制</button>
          <button type="button" class="ghost" @click="decodeHex">转字符串</button>
        </div>
      </div>
      <textarea
        v-model="hexText"
        rows="7"
        placeholder="输入普通文本或十六进制字符串"
      />
      <textarea
        :value="hexResult"
        rows="7"
        readonly
        placeholder="结果会显示在这里"
      />
      <div class="tool-card__footer">
        <span>{{ hexMessage }}</span>
        <button type="button" class="ghost" @click="copyText(hexResult, 'hex')">复制结果</button>
      </div>
    </section>

    <section
      v-if="isVisible('uuid')"
      id="tool-uuid"
      ref="uuid"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>UUID 生成</h2>
        <div class="tool-card__actions">
          <button type="button" @click="generateUuidList">生成</button>
          <button type="button" class="ghost" @click="toggleUuidHyphen">{{ uuidHyphenButtonText }}</button>
          <button type="button" class="ghost" @click="clearUuidResult">清空</button>
        </div>
      </div>
      <div class="uuid-toolbar">
        <label class="uuid-toolbar__field">
          <span>生成数量</span>
          <input
            v-model.number="uuidCount"
            class="tool-input"
            type="number"
            min="1"
            max="200"
          >
        </label>
      </div>
      <textarea
        :value="uuidResult"
        rows="8"
        readonly
        placeholder="生成的 UUID 会显示在这里"
      />
      <div class="tool-card__footer">
        <span>{{ uuidMessage }}</span>
        <button type="button" class="ghost" @click="copyText(uuidResult, 'uuid')">复制结果</button>
      </div>
    </section>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js';
import { writeTextToClipboard } from './clipboard';

function getCryptoObject() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }

  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }

  return null;
}

function generateUuidValue(withHyphen) {
  const cryptoObject = getCryptoObject();

  if (cryptoObject && typeof cryptoObject.randomUUID === 'function') {
    const uuid = cryptoObject.randomUUID();
    return withHyphen ? uuid : uuid.replace(/-/g, '');
  }

  if (!cryptoObject || typeof cryptoObject.getRandomValues !== 'function') {
    throw new Error('当前环境不支持 UUID 生成。');
  }

  const bytes = new Uint8Array(16);
  cryptoObject.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  if (!withHyphen) {
    return hex;
  }

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export default {
  name: 'ToolboxCodecTools',
  props: {
    visibleToolIds: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      base64Text: '',
      base64Result: '',
      base64Message: '支持 UTF-8 文本。',
      urlText: '',
      urlResult: '',
      urlMessage: '适合处理 query 参数和路径片段。',
      hexText: '',
      hexResult: '',
      hexMessage: '支持 UTF-8 文本与十六进制字符串互转。',
      uuidCount: 1,
      uuidWithHyphen: true,
      uuidResult: '',
      uuidMessage: '支持带 - 和无 - 两种格式，可批量生成。',
    };
  },
  computed: {
    uuidHyphenButtonText() {
      return this.uuidWithHyphen ? '切换为无 -' : '切换为带 -';
    },
  },
  methods: {
    isVisible(id) {
      return this.visibleToolIds.indexOf(id) !== -1;
    },
    getSectionElement(id) {
      return this.$refs[id] || null;
    },
    encodeBase64() {
      try {
        this.base64Result = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(this.base64Text));
        this.base64Message = '编码完成。';
      } catch (error) {
        this.base64Result = '';
        this.base64Message = error.message || 'Base64 编码失败。';
      }
    },
    decodeBase64() {
      try {
        const decoded = CryptoJS.enc.Base64.parse(this.base64Text.trim());
        this.base64Result = CryptoJS.enc.Utf8.stringify(decoded);
        if (!this.base64Result && this.base64Text.trim()) {
          throw new Error('Base64 内容无法按 UTF-8 文本解码。');
        }
        this.base64Message = '解码完成。';
      } catch (error) {
        this.base64Result = '';
        this.base64Message = error.message || 'Base64 解码失败。';
      }
    },
    encodeUrl() {
      try {
        this.urlResult = encodeURIComponent(this.urlText);
        this.urlMessage = '编码完成。';
      } catch (error) {
        this.urlResult = '';
        this.urlMessage = error.message || 'URL 编码失败。';
      }
    },
    decodeUrl() {
      try {
        this.urlResult = decodeURIComponent(this.urlText);
        this.urlMessage = '解码完成。';
      } catch (error) {
        this.urlResult = '';
        this.urlMessage = error.message || 'URL 解码失败。';
      }
    },
    encodeHex() {
      try {
        this.hexResult = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(this.hexText));
        this.hexMessage = '转换完成。';
      } catch (error) {
        this.hexResult = '';
        this.hexMessage = error.message || '16进制编码失败。';
      }
    },
    decodeHex() {
      try {
        const normalized = this.hexText.replace(/\s+/g, '');
        if (!normalized) {
          throw new Error('请先输入十六进制字符串。');
        }
        if (!/^[0-9a-fA-F]+$/.test(normalized)) {
          throw new Error('包含非十六进制字符。');
        }
        if (normalized.length % 2 !== 0) {
          throw new Error('十六进制长度必须为偶数。');
        }

        const decoded = CryptoJS.enc.Hex.parse(normalized);
        this.hexResult = CryptoJS.enc.Utf8.stringify(decoded);
        if (!this.hexResult && normalized) {
          throw new Error('16进制内容无法按 UTF-8 文本解码。');
        }
        this.hexMessage = '转换完成。';
      } catch (error) {
        this.hexResult = '';
        this.hexMessage = error.message || '16进制解码失败。';
      }
    },
    generateUuidList() {
      try {
        const count = Number(this.uuidCount);
        if (!Number.isInteger(count) || count < 1) {
          throw new Error('生成数量必须是大于 0 的整数。');
        }
        if (count > 200) {
          throw new Error('单次最多生成 200 个 UUID。');
        }

        const values = Array.from({ length: count }, () => generateUuidValue(this.uuidWithHyphen));
        this.uuidCount = count;
        this.uuidResult = values.join('\n');
        this.uuidMessage = `已生成 ${count} 个 UUID。`;
      } catch (error) {
        this.uuidResult = '';
        this.uuidMessage = error.message || 'UUID 生成失败。';
      }
    },
    toggleUuidHyphen() {
      this.uuidWithHyphen = !this.uuidWithHyphen;

      if (!this.uuidResult) {
        this.uuidMessage = this.uuidWithHyphen ? '已切换为带 - 格式。' : '已切换为无 - 格式。';
        return;
      }

      const normalized = this.uuidResult
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const compact = item.replace(/-/g, '');
          if (this.uuidWithHyphen) {
            return [
              compact.slice(0, 8),
              compact.slice(8, 12),
              compact.slice(12, 16),
              compact.slice(16, 20),
              compact.slice(20),
            ].join('-');
          }

          return compact;
        });

      this.uuidResult = normalized.join('\n');
      this.uuidMessage = this.uuidWithHyphen ? '结果已切换为带 - 格式。' : '结果已切换为无 - 格式。';
    },
    clearUuidResult() {
      this.uuidCount = 1;
      this.uuidResult = '';
      this.uuidMessage = '支持带 - 和无 - 两种格式，可批量生成。';
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
      if (type === 'base64') {
        this.base64Message = message;
      } else if (type === 'url') {
        this.urlMessage = message;
      } else if (type === 'hex') {
        this.hexMessage = message;
      } else if (type === 'uuid') {
        this.uuidMessage = message;
      }
    },
  },
};
</script>
