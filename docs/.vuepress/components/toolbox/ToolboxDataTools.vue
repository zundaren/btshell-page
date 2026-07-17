<template>
  <div>
    <section
      v-if="isVisible('ocr')"
      id="tool-ocr"
      ref="ocr"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>OCR 文字识别</h2>
        <div class="tool-card__actions">
          <button type="button" :disabled="ocrLoading" @click="recognizeOcrText">{{ ocrLoading ? '识别中...' : '识别' }}</button>
          <button type="button" class="ghost" :disabled="ocrLoading" @click="clearOcrResult">清空</button>
        </div>
      </div>
      <div class="ocr-toolbar">
        <label class="ocr-toolbar__field">
          <span>识别语言</span>
          <select v-model="ocrLanguage" :disabled="ocrLoading">
            <option value="chs">简体中文</option>
            <option value="eng">英文</option>
            <option value="jpn">日文</option>
            <option value="kor">韩文</option>
            <option value="cht">繁体中文</option>
          </select>
        </label>
        <label class="ocr-toolbar__field">
          <span>上传文件</span>
          <input
            ref="ocrFileInput"
            class="tool-input tool-input--file"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,application/pdf"
            :disabled="ocrLoading"
            @change="handleOcrFileChange"
          >
        </label>
      </div>
      <div class="ocr-file-tip">
        {{ ocrFileName || '未选择文件。支持 png、jpg、webp、bmp、pdf。' }}
      </div>
      <div v-if="ocrLoading" class="ocr-loading">
        <span class="video-preview__spinner" />
        <span>识别中，请稍候...</span>
      </div>
      <textarea
        :value="ocrResult"
        rows="10"
        readonly
        placeholder="识别结果会显示在这里"
      />
      <div class="tool-card__footer">
        <span>{{ ocrMessage }}</span>
        <button type="button" class="ghost" :disabled="ocrLoading || !ocrResult" @click="copyText(ocrResult, 'ocr')">复制结果</button>
      </div>
    </section>

    <section
      v-if="isVisible('qrcode')"
      id="tool-qrcode"
      ref="qrcode"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>二维码生成</h2>
        <div class="tool-card__actions">
          <button type="button" @click="generateQrCode">生成</button>
          <button type="button" class="ghost" @click="clearQrCode">清空</button>
        </div>
      </div>
      <textarea
        v-model="qrCodeText"
        rows="6"
        placeholder="输入要生成二维码的内容，例如链接、文本、联系方式"
      />
      <div class="qr-toolbar">
        <label class="qr-toolbar__field">
          <span>尺寸（像素）</span>
          <input
            v-model.number="qrCodeSize"
            class="tool-input"
            type="number"
            min="128"
            max="2048"
            step="32"
          >
        </label>
      </div>
      <div class="qr-preview" :class="{ empty: !qrCodeDataUrl }">
        <img
          v-if="qrCodeDataUrl"
          :src="qrCodeDataUrl"
          :alt="`二维码预览 ${qrCodeSize}px`"
          :style="{ width: `${qrCodePreviewSize}px`, height: `${qrCodePreviewSize}px` }"
        >
        <span v-else>二维码预览区</span>
      </div>
      <div class="tool-card__footer">
        <span>{{ qrCodeMessage }}</span>
        <button type="button" class="ghost" :disabled="!qrCodeDataUrl" @click="downloadQrCode">下载 PNG</button>
      </div>
    </section>

    <section
      v-if="isVisible('json')"
      id="tool-json"
      ref="json"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>JSON 格式化</h2>
        <div class="tool-card__actions">
          <button type="button" @click="formatJson">格式化</button>
          <button type="button" class="ghost" @click="repairJson">自动修复</button>
          <button type="button" class="ghost" @click="minifyJson">压缩</button>
        </div>
      </div>
      <textarea
        v-model="jsonText"
        rows="9"
        placeholder="输入 JSON 字符串"
      />
      <textarea
        :value="jsonResult"
        rows="9"
        readonly
        placeholder="结果会显示在这里"
      />
      <div class="tool-card__footer">
        <span>{{ jsonMessage }}</span>
        <button type="button" class="ghost" @click="copyText(jsonResult, 'json')">复制结果</button>
      </div>
    </section>

    <section
      v-if="isVisible('config')"
      id="tool-config"
      ref="config"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>JSON / YML / Properties 互转</h2>
        <div class="tool-card__actions">
          <button type="button" class="ghost" @click="clearConfigConverter">清空</button>
        </div>
      </div>
      <div class="config-converter-tip">
        在任意一个输入框中填写合法内容，另外两种格式会自动转换回显。
      </div>
      <div class="config-converter-grid">
        <div class="config-converter-panel">
          <div class="config-converter-panel__header">
            <h3>JSON</h3>
            <button type="button" class="ghost" @click="copyText(configJsonText, 'config')">复制</button>
          </div>
          <textarea
            :value="configJsonText"
            rows="12"
            placeholder="输入 JSON 内容"
            @input="handleConfigInput('json', $event.target.value)"
          />
        </div>
        <div class="config-converter-panel">
          <div class="config-converter-panel__header">
            <h3>YML</h3>
            <button type="button" class="ghost" @click="copyText(configYamlText, 'config')">复制</button>
          </div>
          <textarea
            :value="configYamlText"
            rows="12"
            placeholder="输入 YML 内容"
            @input="handleConfigInput('yaml', $event.target.value)"
          />
        </div>
        <div class="config-converter-panel">
          <div class="config-converter-panel__header">
            <h3>Properties</h3>
            <button type="button" class="ghost" @click="copyText(configPropertiesText, 'config')">复制</button>
          </div>
          <textarea
            :value="configPropertiesText"
            rows="12"
            placeholder="输入 Properties 内容"
            @input="handleConfigInput('properties', $event.target.value)"
          />
        </div>
      </div>
      <div class="tool-card__footer">
        <span>{{ configMessage }}</span>
      </div>
    </section>

    <section
      v-if="isVisible('hash')"
      id="tool-hash"
      ref="hash"
      class="tool-card tool-section"
    >
      <div class="tool-card__header">
        <h2>摘要计算</h2>
        <div class="tool-card__actions">
          <button type="button" class="ghost" @click="toggleHashCase">{{ hashCaseButtonText }}</button>
          <button type="button" class="ghost" @click="clearHashes">清空</button>
        </div>
      </div>
      <div class="hash-workbench">
        <div class="hash-input-panel">
          <div class="hash-panel__title">输入文本</div>
          <textarea
            v-model="hashText"
            rows="12"
            placeholder="输入需要计算摘要的文本"
          />
        </div>
        <div class="hash-results-panel">
          <div
            v-for="algorithm in hashAlgorithms"
            :key="algorithm"
            class="hash-result-item"
          >
            <div class="hash-result-box">
              <textarea
                :value="hashResults[algorithm]"
                rows="4"
                readonly
                :placeholder="`${algorithm} 结果会显示在这里`"
              />
              <button
                type="button"
                class="ghost hash-copy-button"
                @click="copyHashResult(algorithm)"
              >
                {{ algorithm }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="tool-card__footer">
        <span>{{ hashMessage }}</span>
      </div>
    </section>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js';
import QRCode from 'qrcode';
import { jsonrepair } from 'jsonrepair';
import YAML from 'yamljs';
import { writeTextToClipboard } from './clipboard';

const OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';
const OCR_SPACE_API_KEY = 'K87557472588957';
const OCR_SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/bmp',
  'application/pdf',
];
const HASH_ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
const HASH_GENERATORS = {
  MD5: (value) => CryptoJS.MD5(value).toString(),
  'SHA-1': (value) => CryptoJS.SHA1(value).toString(),
  'SHA-256': (value) => CryptoJS.SHA256(value).toString(),
  'SHA-384': (value) => CryptoJS.SHA384(value).toString(),
  'SHA-512': (value) => CryptoJS.SHA512(value).toString(),
};

function createEmptyHashResults() {
  return HASH_ALGORITHMS.reduce((result, algorithm) => {
    result[algorithm] = '';
    return result;
  }, {});
}

function getLineAndColumnByIndex(text, index) {
  const safeIndex = Math.max(0, Math.min(index, text.length));
  const content = text.slice(0, safeIndex);
  const lines = content.split('\n');

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function getJsonErrorDetails(text, error) {
  const message = error && error.message ? error.message : 'JSON 处理失败。';
  const positionMatch = message.match(/position\s+(\d+)/i);

  if (!positionMatch) {
    return message;
  }

  const position = Number(positionMatch[1]);
  const { line, column } = getLineAndColumnByIndex(text, position);
  return `${message} 大致位置：第 ${line} 行，第 ${column} 列。`;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function assertConfigRootValue(value) {
  if (Array.isArray(value) || isPlainObject(value)) {
    return;
  }

  throw new Error('JSON、YML 和 Properties 互转仅支持对象或数组作为顶层结构。');
}

function normalizeYamlText(value) {
  return String(value || '').replace(/^\s+|\s+$/g, '');
}

function stringifyPropertyScalar(value) {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'undefined') {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

function collectPropertiesLines(value, currentPath, lines) {
  if (Array.isArray(value)) {
    if (!value.length) {
      if (!currentPath) {
        lines.push('[]');
      } else {
        lines.push(`${currentPath}=[]`);
      }
      return;
    }

    value.forEach((item, index) => {
      const nextPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
      collectPropertiesLines(item, nextPath, lines);
    });
    return;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (!keys.length) {
      if (!currentPath) {
        lines.push('{}');
      } else {
        lines.push(`${currentPath}={}`);
      }
      return;
    }

    keys.forEach((key) => {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      collectPropertiesLines(value[key], nextPath, lines);
    });
    return;
  }

  lines.push(`${currentPath}=${stringifyPropertyScalar(value)}`);
}

function stringifyProperties(value) {
  const lines = [];
  collectPropertiesLines(value, '', lines);
  return lines.join('\n');
}

function parsePropertiesScalar(value) {
  if (value === 'null') {
    return null;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (value === '{}') {
    return {};
  }
  if (value === '[]') {
    return [];
  }

  return value;
}

function parsePropertyPath(path, lineNumber) {
  const tokens = [];
  const matcher = /([^[.\]]+)|\[(\d+)\]/g;
  let match = null;
  let cursor = 0;

  while ((match = matcher.exec(path))) {
    if (match.index !== cursor) {
      const separator = path.slice(cursor, match.index);
      if (separator !== '' && separator !== '.') {
        throw new Error(`Properties 第 ${lineNumber} 行路径格式不正确。`);
      }
    }

    if (typeof match[1] !== 'undefined') {
      tokens.push(match[1]);
      cursor = match.index + match[1].length;
    } else {
      tokens.push(Number(match[2]));
      cursor = match.index + match[0].length;
    }
  }

  if (cursor !== path.length) {
    throw new Error(`Properties 第 ${lineNumber} 行路径格式不正确。`);
  }

  return tokens;
}

function createNextContainer(token) {
  return typeof token === 'number' ? [] : {};
}

function assignTokensToRoot(rootValue, tokens, value, lineNumber) {
  if (!tokens.length) {
    throw new Error(`Properties 第 ${lineNumber} 行键名为空。`);
  }

  const nextRoot = typeof rootValue === 'undefined' ? createNextContainer(tokens[0]) : rootValue;
  let cursor = nextRoot;

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index];
    const nextToken = tokens[index + 1];

    if (typeof token === 'number') {
      if (!Array.isArray(cursor)) {
        throw new Error(`Properties 第 ${lineNumber} 行数组路径与已有对象结构冲突。`);
      }

      if (typeof cursor[token] === 'undefined') {
        cursor[token] = createNextContainer(nextToken);
      } else if (
        (typeof nextToken === 'number' && !Array.isArray(cursor[token]))
        || (typeof nextToken !== 'number' && !isPlainObject(cursor[token]))
      ) {
        throw new Error(`Properties 第 ${lineNumber} 行路径与已有结构冲突。`);
      }

      cursor = cursor[token];
      continue;
    }

    if (!isPlainObject(cursor)) {
      throw new Error(`Properties 第 ${lineNumber} 行对象路径与已有数组结构冲突。`);
    }

    if (typeof cursor[token] === 'undefined') {
      cursor[token] = createNextContainer(nextToken);
    } else if (
      (typeof nextToken === 'number' && !Array.isArray(cursor[token]))
      || (typeof nextToken !== 'number' && !isPlainObject(cursor[token]))
    ) {
      throw new Error(`Properties 第 ${lineNumber} 行路径与已有结构冲突。`);
    }

    cursor = cursor[token];
  }

  const lastToken = tokens[tokens.length - 1];
  if (typeof lastToken === 'number') {
    if (!Array.isArray(cursor)) {
      throw new Error(`Properties 第 ${lineNumber} 行数组路径与已有对象结构冲突。`);
    }

    cursor[lastToken] = value;
  } else {
    if (!isPlainObject(cursor)) {
      throw new Error(`Properties 第 ${lineNumber} 行对象路径与已有数组结构冲突。`);
    }

    cursor[lastToken] = value;
  }

  return nextRoot;
}

function parseProperties(text) {
  const normalizedText = String(text || '').trim();
  if (!normalizedText) {
    return {};
  }
  if (normalizedText === '{}') {
    return {};
  }
  if (normalizedText === '[]') {
    return [];
  }

  const lines = String(text || '').split(/\r?\n/);
  let rootValue;

  lines.forEach((rawLine, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const trimmedLine = rawLine.trim();

    if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('!')) {
      return;
    }

    const delimiterIndex = rawLine.search(/[:=]/);
    const key = delimiterIndex === -1 ? rawLine.trim() : rawLine.slice(0, delimiterIndex).trim();
    const valueText = delimiterIndex === -1 ? '' : rawLine.slice(delimiterIndex + 1).trim();

    if (!key) {
      throw new Error(`Properties 第 ${lineNumber} 行键名为空。`);
    }

    const tokens = parsePropertyPath(key, lineNumber);
    rootValue = assignTokensToRoot(rootValue, tokens, parsePropertiesScalar(valueText), lineNumber);
  });

  return typeof rootValue === 'undefined' ? {} : rootValue;
}

function isSupportedOcrMimeType(type) {
  return OCR_SUPPORTED_MIME_TYPES.indexOf(String(type || '').toLowerCase()) !== -1;
}

function getClipboardFileFromEvent(event) {
  const clipboardData = event && event.clipboardData;
  if (!clipboardData) {
    return null;
  }

  if (clipboardData.items && clipboardData.items.length) {
    for (const item of clipboardData.items) {
      if (!item || item.kind !== 'file') {
        continue;
      }

      const file = item.getAsFile ? item.getAsFile() : null;
      if (file && isSupportedOcrMimeType(file.type)) {
        return file;
      }
    }
  }

  if (clipboardData.files && clipboardData.files.length) {
    for (const file of clipboardData.files) {
      if (file && isSupportedOcrMimeType(file.type)) {
        return file;
      }
    }
  }

  return null;
}

function createPastedOcrFile(file) {
  if (!file) {
    return null;
  }

  if (file.name) {
    return file;
  }

  const extensionMap = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'application/pdf': 'pdf',
  };
  const extension = extensionMap[String(file.type || '').toLowerCase()] || 'bin';

  return new File([file], `ocr-paste-${Date.now()}.${extension}`, {
    type: file.type || 'application/octet-stream',
    lastModified: Date.now(),
  });
}

export default {
  name: 'ToolboxDataTools',
  props: {
    visibleToolIds: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      ocrLanguage: 'chs',
      ocrFile: null,
      ocrFileName: '',
      ocrLoading: false,
      ocrResult: '',
      ocrMessage: '使用 OCR.Space 免费 API 识别图片或 PDF 文本。',
      qrCodeText: '',
      qrCodeSize: 320,
      qrCodeDataUrl: '',
      qrCodeMessage: '输入内容后可生成二维码并下载 PNG。',
      jsonText: '',
      jsonResult: '',
      jsonMessage: '输入合法 JSON 后即可处理。',
      configJsonText: '',
      configYamlText: '',
      configPropertiesText: '',
      configMessage: '输入 JSON、YML 或 Properties 后会自动转换另外两种格式。',
      hashAlgorithms: HASH_ALGORITHMS,
      hashText: '',
      hashResults: createEmptyHashResults(),
      hashResultUppercase: false,
      hashMessage: '使用 crypto-js 算法库。',
    };
  },
  computed: {
    hashCaseButtonText() {
      return this.hashResultUppercase ? '转小写' : '转大写';
    },
    qrCodePreviewSize() {
      return Math.min(this.qrCodeSize || 320, 320);
    },
  },
  watch: {
    hashText() {
      this.generateHashes();
    },
  },
  mounted() {
    if (typeof window !== 'undefined') {
      window.addEventListener('paste', this.handleWindowPaste);
    }
  },
  beforeDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('paste', this.handleWindowPaste);
    }
  },
  methods: {
    isVisible(id) {
      return this.visibleToolIds.indexOf(id) !== -1;
    },
    getSectionElement(id) {
      return this.$refs[id] || null;
    },
    updateOcrFile(file, message) {
      const normalizedFile = createPastedOcrFile(file);

      this.ocrFile = normalizedFile || null;
      this.ocrFileName = normalizedFile ? normalizedFile.name : '';
      this.ocrResult = '';
      this.ocrMessage = normalizedFile
        ? message || '文件已选择，点击识别开始 OCR。'
        : '使用 OCR.Space 免费 API 识别图片或 PDF 文本。';

      if (this.$refs.ocrFileInput && !normalizedFile) {
        this.$refs.ocrFileInput.value = '';
      }
    },
    handleOcrFileChange(event) {
      const file = event && event.target && event.target.files ? event.target.files[0] : null;
      this.updateOcrFile(file, '文件已选择，点击识别开始 OCR。');
    },
    handleWindowPaste(event) {
      if (!this.isVisible('ocr')) {
        return;
      }
      if (this.ocrLoading) {
        return;
      }

      const file = getClipboardFileFromEvent(event);
      if (!file) {
        return;
      }

      const ocrSection = this.$refs.ocr;
      const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
      const activeInsideOcr = !!(
        ocrSection
        && activeElement
        && typeof ocrSection.contains === 'function'
        && ocrSection.contains(activeElement)
      );
      const activeIsEditableOutsideOcr = !!(
        activeElement
        && !activeInsideOcr
        && (
          activeElement.tagName === 'INPUT'
          || activeElement.tagName === 'TEXTAREA'
          || activeElement.isContentEditable
        )
      );

      if (activeIsEditableOutsideOcr) {
        return;
      }

      event.preventDefault();
      this.updateOcrFile(file, '已从剪贴板读取文件，点击识别开始 OCR。');
    },
    async recognizeOcrText() {
      if (this.ocrLoading) {
        return;
      }
      if (!this.ocrFile) {
        this.ocrResult = '';
        this.ocrMessage = '请先选择要识别的文件。';
        return;
      }

      const formData = new FormData();
      formData.append('file', this.ocrFile, this.ocrFile.name);
      formData.append('language', this.ocrLanguage);
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

      this.ocrResult = '';
      this.ocrLoading = true;
      this.ocrMessage = '识别中...';

      try {
        const response = await fetch(OCR_SPACE_API_URL, {
          method: 'POST',
          headers: {
            apikey: OCR_SPACE_API_KEY,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`OCR 请求失败，状态码 ${response.status}。`);
        }

        const data = await response.json();
        const errorMessage = Array.isArray(data.ErrorMessage)
          ? data.ErrorMessage.join(' ')
          : data.ErrorMessage;

        if (data.IsErroredOnProcessing) {
          throw new Error(errorMessage || data.ErrorDetails || 'OCR 识别失败。');
        }

        const parsedTexts = Array.isArray(data.ParsedResults)
          ? data.ParsedResults
            .map((item) => (item && item.ParsedText ? item.ParsedText.trim() : ''))
            .filter(Boolean)
          : [];

        if (!parsedTexts.length) {
          throw new Error(errorMessage || data.ErrorDetails || '未识别到可用文本。');
        }

        this.ocrResult = parsedTexts.join('\n\n');
        this.ocrMessage = 'OCR 识别完成。';
      } catch (error) {
        this.ocrResult = '';
        this.ocrMessage = error.message || 'OCR 识别失败。';
      } finally {
        this.ocrLoading = false;
      }
    },
    clearOcrResult() {
      if (this.ocrLoading) {
        return;
      }
      this.ocrLanguage = 'chs';
      this.updateOcrFile(null);
    },
    async generateQrCode() {
      const text = this.qrCodeText.trim();
      const size = Number(this.qrCodeSize);

      if (!text) {
        this.qrCodeDataUrl = '';
        this.qrCodeMessage = '请先输入要生成二维码的内容。';
        return;
      }

      if (!Number.isInteger(size) || size < 128 || size > 2048) {
        this.qrCodeDataUrl = '';
        this.qrCodeMessage = '二维码尺寸必须是 128 到 2048 之间的整数。';
        return;
      }

      try {
        this.qrCodeDataUrl = await QRCode.toDataURL(text, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        this.qrCodeSize = size;
        this.qrCodeMessage = '二维码生成完成。';
      } catch (error) {
        this.qrCodeDataUrl = '';
        this.qrCodeMessage = error.message || '二维码生成失败。';
      }
    },
    downloadQrCode() {
      if (!this.qrCodeDataUrl) {
        this.qrCodeMessage = '请先生成二维码。';
        return;
      }

      const link = document.createElement('a');
      link.href = this.qrCodeDataUrl;
      link.download = `qrcode-${this.qrCodeSize}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.qrCodeMessage = '二维码已开始下载。';
    },
    clearQrCode() {
      this.qrCodeText = '';
      this.qrCodeSize = 320;
      this.qrCodeDataUrl = '';
      this.qrCodeMessage = '输入内容后可生成二维码并下载 PNG。';
    },
    formatJson() {
      try {
        this.jsonResult = JSON.stringify(JSON.parse(this.jsonText), null, 2);
        this.jsonMessage = '格式化完成。';
      } catch (error) {
        this.jsonResult = '';
        this.jsonMessage = getJsonErrorDetails(this.jsonText, error);
      }
    },
    repairJson() {
      try {
        const parsed = JSON.parse(this.jsonText);
        this.jsonResult = JSON.stringify(parsed, null, 2);
        this.jsonMessage = '原始输入已是合法 JSON，无需修复。';
      } catch (error) {
        try {
          const repaired = jsonrepair(this.jsonText);
          const parsed = JSON.parse(repaired);
          const formatted = JSON.stringify(parsed, null, 2);
          this.jsonText = formatted;
          this.jsonResult = formatted;
          this.jsonMessage = '检测到原始输入有问题，已自动修复并替换输入内容。';
        } catch (repairError) {
          this.jsonResult = '';
          this.jsonMessage = getJsonErrorDetails(this.jsonText, repairError);
        }
      }
    },
    minifyJson() {
      try {
        this.jsonResult = JSON.stringify(JSON.parse(this.jsonText));
        this.jsonMessage = '压缩完成。';
      } catch (error) {
        this.jsonResult = '';
        this.jsonMessage = getJsonErrorDetails(this.jsonText, error);
      }
    },
    parseConfigSource(type, value) {
      if (type === 'json') {
        return JSON.parse(value);
      }
      if (type === 'yaml') {
        return YAML.parse(value);
      }
      if (type === 'properties') {
        return parseProperties(value);
      }

      throw new Error('不支持的配置格式。');
    },
    createConfigOutputs(value) {
      assertConfigRootValue(value);

      return {
        json: JSON.stringify(value, null, 2),
        yaml: normalizeYamlText(YAML.stringify(value, 4, 2)),
        properties: stringifyProperties(value),
      };
    },
    clearConfigTargets(sourceType) {
      if (sourceType !== 'json') {
        this.configJsonText = '';
      }
      if (sourceType !== 'yaml') {
        this.configYamlText = '';
      }
      if (sourceType !== 'properties') {
        this.configPropertiesText = '';
      }
    },
    handleConfigInput(sourceType, value) {
      if (sourceType === 'json') {
        this.configJsonText = value;
      } else if (sourceType === 'yaml') {
        this.configYamlText = value;
      } else if (sourceType === 'properties') {
        this.configPropertiesText = value;
      }

      if (!String(value || '').trim()) {
        this.clearConfigTargets(sourceType);
        this.configMessage = '输入 JSON、YML 或 Properties 后会自动转换另外两种格式。';
        return;
      }

      try {
        const parsedValue = this.parseConfigSource(sourceType, value);
        const outputs = this.createConfigOutputs(parsedValue);

        if (sourceType !== 'json') {
          this.configJsonText = outputs.json;
        }
        if (sourceType !== 'yaml') {
          this.configYamlText = outputs.yaml;
        }
        if (sourceType !== 'properties') {
          this.configPropertiesText = outputs.properties;
        }

        this.configMessage = '互转完成。';
      } catch (error) {
        this.clearConfigTargets(sourceType);
        this.configMessage = error.message || '配置互转失败。';
      }
    },
    clearConfigConverter() {
      this.configJsonText = '';
      this.configYamlText = '';
      this.configPropertiesText = '';
      this.configMessage = '输入 JSON、YML 或 Properties 后会自动转换另外两种格式。';
    },
    generateHashes() {
      if (!this.hashText) {
        this.hashResults = createEmptyHashResults();
        this.hashMessage = '使用 crypto-js 算法库。';
        return;
      }

      try {
        const results = {};

        for (const algorithm of this.hashAlgorithms) {
          results[algorithm] = this.formatHashResult(HASH_GENERATORS[algorithm](this.hashText));
        }

        this.hashResults = results;
        this.hashMessage = '全部摘要计算完成。';
      } catch (error) {
        this.hashResults = createEmptyHashResults();
        this.hashMessage = error.message || '摘要计算失败。';
      }
    },
    clearHashes() {
      this.hashText = '';
      this.hashResults = createEmptyHashResults();
      this.hashMessage = '使用 crypto-js 算法库。';
    },
    toggleHashCase() {
      this.hashResultUppercase = !this.hashResultUppercase;
      const converted = {};

      this.hashAlgorithms.forEach((algorithm) => {
        converted[algorithm] = this.formatHashResult(this.hashResults[algorithm]);
      });

      this.hashResults = converted;
      this.hashMessage = this.hashResultUppercase ? '结果已切换为大写。' : '结果已切换为小写。';
    },
    copyHashResult(algorithm) {
      this.copyText(this.hashResults[algorithm], 'hash');
    },
    formatHashResult(value) {
      if (!value) {
        return '';
      }

      return this.hashResultUppercase ? value.toUpperCase() : value.toLowerCase();
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
      if (type === 'ocr') {
        this.ocrMessage = message;
      } else if (type === 'json') {
        this.jsonMessage = message;
      } else if (type === 'config') {
        this.configMessage = message;
      } else if (type === 'hash') {
        this.hashMessage = message;
      }
    },
  },
};
</script>
