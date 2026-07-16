<template>
  <div class="toolbox-panel">
    <p class="toolbox-intro">
      适合做日常编码转换、数据整理和摘要计算。
    </p>

    <div class="toolbox-layout">
      <aside class="toolbox-sidebar">
        <div class="toolbox-sidebar__inner">
          <input
            v-model.trim="searchKeyword"
            class="toolbox-search"
            type="text"
            placeholder="搜索工具，例如 Base64、JSON"
          >
          <div class="toolbox-count">
            共 {{ filteredTools.length }} 个工具
          </div>
          <div v-if="filteredTools.length" class="toolbox-nav">
            <button
              v-for="tool in filteredTools"
              :key="tool.id"
              type="button"
              class="toolbox-nav__item"
              :class="{ active: activeTool === tool.id }"
              @click="scrollToTool(tool.id)"
            >
              <span class="toolbox-nav__title">{{ tool.title }}</span>
              <span class="toolbox-nav__desc">{{ tool.description }}</span>
            </button>
          </div>
          <div v-else class="toolbox-empty">
            没有匹配的工具，换个关键词试试。
          </div>
        </div>
      </aside>

      <div class="toolbox-content">
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

        <section
          v-if="isVisible('idcard')"
          id="tool-idcard"
          ref="idcard"
          class="tool-card tool-section"
        >
        <div class="tool-card__header">
          <h2>身份证号码生成</h2>
          <div class="tool-card__actions">
            <button type="button" @click="generateIdCardNumbers">生成</button>
            <button type="button" class="ghost" @click="generateRandomIdCardNumbers">随机</button>
            <button type="button" class="ghost" @click="clearIdCardGenerator">清空</button>
          </div>
        </div>
        <div class="idcard-workbench">
          <div class="idcard-grid">
            <label class="idcard-field">
              <span>省份</span>
              <select v-model="idCardProvinceCode" @change="handleIdCardProvinceChange">
                <option
                  v-for="province in idCardProvinceOptions"
                  :key="province.value"
                  :value="province.value"
                >
                  {{ province.label }}
                </option>
              </select>
            </label>
            <label class="idcard-field">
              <span>城市</span>
              <select v-model="idCardCityCode" @change="handleIdCardCityChange">
                <option
                  v-for="city in idCardCityOptions"
                  :key="city.value"
                  :value="city.value"
                >
                  {{ city.label }}
                </option>
              </select>
            </label>
            <label class="idcard-field">
              <span>区县</span>
              <select v-model="idCardDistrictCode">
                <option
                  v-for="district in idCardDistrictOptions"
                  :key="district.value"
                  :value="district.value"
                >
                  {{ district.label }}
                </option>
              </select>
            </label>
            <label class="idcard-field">
              <span>性别</span>
              <select v-model="idCardGender">
                <option
                  v-for="gender in idCardGenderOptions"
                  :key="gender.value"
                  :value="gender.value"
                >
                  {{ gender.label }}
                </option>
              </select>
            </label>
            <label class="idcard-field">
              <span>出生日期</span>
              <input
                v-model="idCardBirthDate"
                class="tool-input"
                type="date"
              >
            </label>
            <label class="idcard-field">
              <span>生成数量</span>
              <input
                v-model.number="idCardCount"
                class="tool-input"
                type="number"
                min="1"
                max="50"
              >
            </label>
            <label class="idcard-field">
              <span>年龄限制（随机）</span>
              <select v-model="idCardAgeRuleType">
                <option
                  v-for="rule in idCardAgeRuleOptions"
                  :key="rule.value"
                  :value="rule.value"
                >
                  {{ rule.label }}
                </option>
              </select>
            </label>
            <label class="idcard-field">
              <span>{{ idCardAgeRuleInputLabel }}</span>
              <input
                v-model.trim="idCardAgeRuleValue"
                class="tool-input"
                type="text"
                :disabled="idCardAgeRuleType === 'none'"
                :placeholder="idCardAgeRulePlaceholder"
              >
            </label>
          </div>

          <div class="idcard-summary">
            <div class="idcard-summary__item">
              <span>地区</span>
              <strong>{{ idCardRegionText || '未选择' }}</strong>
            </div>
            <div class="idcard-summary__item">
              <span>性别</span>
              <strong>{{ idCardGenderText }}</strong>
            </div>
            <div class="idcard-summary__item">
              <span>生日</span>
              <strong>{{ idCardBirthText }}</strong>
            </div>
            <div class="idcard-summary__item">
              <span>年龄限制</span>
              <strong>{{ idCardAgeRuleText }}</strong>
            </div>
          </div>
        </div>
        <textarea
          class="idcard-result-output"
          :value="idCardResult"
          rows="8"
          readonly
          placeholder="生成结果会显示在这里，格式：号码 性别 年龄 姓名"
          @copy="handleIdCardCopy"
        />
        <div class="tool-card__footer">
          <span>{{ idCardMessage }}</span>
          <button type="button" class="ghost" @click="copyText(idCardResult, 'idcard')">复制结果</button>
        </div>
      </section>

        <section
          v-if="isVisible('ocr')"
          id="tool-ocr"
          ref="ocr"
          class="tool-card tool-section"
        >
        <div class="tool-card__header">
          <h2>OCR 文字识别</h2>
          <div class="tool-card__actions">
            <button type="button" @click="recognizeOcrText">识别</button>
            <button type="button" class="ghost" @click="clearOcrResult">清空</button>
          </div>
        </div>
        <div class="ocr-toolbar">
          <label class="ocr-toolbar__field">
            <span>识别语言</span>
            <select v-model="ocrLanguage">
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
              @change="handleOcrFileChange"
            >
          </label>
        </div>
        <div class="ocr-file-tip">
          {{ ocrFileName || '未选择文件。支持 png、jpg、webp、bmp、pdf。' }}
        </div>
        <textarea
          :value="ocrResult"
          rows="10"
          readonly
          placeholder="识别结果会显示在这里"
        />
        <div class="tool-card__footer">
          <span>{{ ocrMessage }}</span>
          <button type="button" class="ghost" @click="copyText(ocrResult, 'ocr')">复制结果</button>
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
    </div>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js';
import QRCode from 'qrcode';
import { jsonrepair } from 'jsonrepair';

const IP_LOOKUP_URL = 'https://opendata.baidu.com/api.php';
const OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';
const OCR_SPACE_API_KEY = 'K87557472588957';
const HASH_ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
const HASH_GENERATORS = {
  MD5: (value) => CryptoJS.MD5(value).toString(),
  'SHA-1': (value) => CryptoJS.SHA1(value).toString(),
  'SHA-256': (value) => CryptoJS.SHA256(value).toString(),
  'SHA-384': (value) => CryptoJS.SHA384(value).toString(),
  'SHA-512': (value) => CryptoJS.SHA512(value).toString(),
};
const ID_CARD_REGION_OPTIONS = [
  {
    value: '11',
    label: '北京市',
    children: [
      {
        value: '01',
        label: '市辖区',
        children: [
          {
            value: '05',
            label: '朝阳区',
          },
        ],
      },
    ],
  },
  {
    value: '44',
    label: '广东省',
    children: [
      {
        value: '05',
        label: '汕头市',
        children: [
          {
            value: '24',
            label: '潮阳县',
          },
        ],
      },
    ],
  },
];
const ID_CARD_GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];
const ID_CARD_AGE_RULE_OPTIONS = [
  { value: 'none', label: '不限' },
  { value: 'lt', label: '小于' },
  { value: 'gt', label: '大于' },
  { value: 'range', label: '区间' },
];
const ID_CARD_LEGAL_NOTICE = '《中华人民共和国居民身份证法》第六条 居民身份证式样由国务院公安部门制定。居民身份证由公安机关统一制作、发放。 第十七条 有下列行为之一的，由公安机关处二百元以上一千元以下罚款，或者处十日以下拘留，有违法所得的，没收违法所得： （一）冒用他人居民身份证或者使用骗领的居民身份证的；';
const ID_CARD_MAX_RANDOM_AGE = 120;
const ID_CARD_WEIGHT_FACTORS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_CARD_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
const ID_CARD_SURNAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨', '管', '司马'];
const ID_CARD_MALE_GIVEN_NAMES = [
  '伟', '强', '磊', '鹏', '杰', '涛', '勇', '军', '超', '峰',
  '斌', '波', '健', '明', '亮', '飞', '恒', '博', '宁', '阳',
  '晨', '轩', '瑞', '凯', '洋', '林', '辰', '豪', '宇', '彬',
  '峻', '铭', '诚', '睿', '然', '浩', '子轩', '浩然', '宇轩', '子昂',
  '博文', '天佑', '景行', '嘉佑', '启航', '承泽', '嘉豪', '俊驰', '天铭', '博凯',
  '俊杰', '俊豪', '嘉树', '嘉辰', '嘉瑞', '泽宇', '泽楷', '泽辰', '泽阳', '泽林',
  '梓轩', '梓豪', '梓睿', '梓晨', '梓航', '奕辰', '奕阳', '奕博', '奕帆', '奕豪',
  '皓轩', '皓宇', '皓然', '昊天', '昊宇', '昊然', '逸凡', '逸晨', '逸飞', '逸轩',
  '嘉诚', '嘉铭', '嘉宁', '嘉逸', '亦凡', '亦辰', '亦航', '亦轩', '书豪', '书宇',
  '俊熙', '俊宇', '俊铭', '俊凯', '君浩', '君逸', '乐天', '成宇', '冠霖', '冠宇',
];
const ID_CARD_FEMALE_GIVEN_NAMES = [
  '芳', '娜', '静', '敏', '丽', '艳', '婷', '雪', '颖', '倩',
  '玲', '菲', '娟', '丹', '燕', '萍', '蕾', '琳', '莉', '露',
  '欣怡', '雨桐', '诗涵', '佳宁', '子晴', '子萱', '子涵', '子怡', '可欣', '可馨',
  '一诺', '依诺', '依涵', '依琳', '依彤', '雨涵', '雨欣', '雨萱', '雨菲', '雨薇',
  '欣妍', '欣然', '欣悦', '欣彤', '欣琪', '思涵', '思雨', '思彤', '思妍', '思琪',
  '语桐', '语嫣', '语汐', '语彤', '语晨', '若曦', '若彤', '若涵', '若汐', '若琳',
  '芷晴', '芷涵', '芷若', '芷萱', '芷琳', '梦瑶', '梦涵', '梦琪', '梦洁', '梦妍',
  '婉清', '婉宁', '婉晴', '婉莹', '婉婷', '雅婷', '雅静', '雅琳', '雅萱', '雅琪',
  '佳怡', '佳琪', '佳雯', '佳音', '佳慧', '晨曦', '晨妍', '晨希', '晨语', '晨菲',
  '安然', '安琪', '安宁', '安悦', '安彤', '乐瑶', '乐妍', '乐萱', '清妍', '清雅',
];
const ipLocationCache = {};
let ipLookupCounter = 0;

function getOptionChildren(options, value) {
  const target = options.find((option) => option.value === value);
  return target && Array.isArray(target.children) ? target.children : [];
}

function getDefaultIdCardSelection() {
  const province = ID_CARD_REGION_OPTIONS[0] || null;
  const city = province && Array.isArray(province.children) ? province.children[0] : null;
  const district = city && Array.isArray(city.children) ? city.children[0] : null;

  return {
    provinceCode: province ? province.value : '',
    cityCode: city ? city.value : '',
    districtCode: district ? district.value : '',
  };
}

function createDefaultBirthDate() {
  const currentYear = new Date().getFullYear();
  const year = Math.max(1900, currentYear - 25);
  return `${year}-01-01`;
}

function isValidBirthDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return value === [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function findOptionLabel(options, value) {
  const target = options.find((option) => option.value === value);
  return target ? target.label : '';
}

function createIdCardAreaCode(provinceCode, cityCode, districtCode) {
  return `${provinceCode}${cityCode}${districtCode}`;
}

function createIdCardChecksum(prefix) {
  const total = prefix
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * ID_CARD_WEIGHT_FACTORS[index], 0);

  return ID_CARD_CHECK_CODES[total % 11];
}

function createIdCardSequenceCode(gender) {
  let sequence = 0;

  while (sequence === 0) {
    const prefix = Math.floor(Math.random() * 100);
    const suffixBase = Math.floor(Math.random() * 5) * 2;
    const suffix = gender === 'male' ? suffixBase + 1 : suffixBase;
    sequence = prefix * 10 + suffix;
  }

  return String(sequence).padStart(3, '0');
}

function createIdCardNumber(areaCode, birthDate, gender) {
  const sequenceCode = createIdCardSequenceCode(gender);
  const prefix = `${areaCode}${birthDate}${sequenceCode}`;
  return `${prefix}${createIdCardChecksum(prefix)}`;
}

function createRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createRandomChineseName(gender) {
  const surname = createRandomItem(ID_CARD_SURNAMES);
  const givenName = gender === 'female'
    ? createRandomItem(ID_CARD_FEMALE_GIVEN_NAMES)
    : createRandomItem(ID_CARD_MALE_GIVEN_NAMES);

  return `${surname}${givenName}`;
}

function getIdCardRegionSelections() {
  const regions = [];

  ID_CARD_REGION_OPTIONS.forEach((province) => {
    const cities = Array.isArray(province.children) ? province.children : [];
    cities.forEach((city) => {
      const districts = Array.isArray(city.children) ? city.children : [];
      districts.forEach((district) => {
        regions.push({
          provinceCode: province.value,
          cityCode: city.value,
          districtCode: district.value,
        });
      });
    });
  });

  return regions;
}

function createRandomIdCardRegionSelection() {
  const regions = getIdCardRegionSelections();
  return regions.length ? createRandomItem(regions) : null;
}

function createRandomBirthDate() {
  const startDate = new Date(1960, 0, 1);
  const endDate = new Date();
  const randomTime = startDate.getTime()
    + Math.floor(Math.random() * (endDate.getTime() - startDate.getTime() + 1));
  const date = new Date(randomTime);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function formatDateOnly(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseIdCardAgeRule(ruleType, ruleValue) {
  if (ruleType === 'none') {
    return null;
  }

  const value = String(ruleValue || '').trim();
  if (!value) {
    throw new Error('请先输入年龄限制。');
  }

  if (ruleType === 'lt') {
    const age = Number(value);
    if (!Number.isInteger(age) || age < 1) {
      throw new Error('小于年龄必须是大于 0 的整数。');
    }

    return {
      minAge: 0,
      maxAge: age - 1,
    };
  }

  if (ruleType === 'gt') {
    const age = Number(value);
    if (!Number.isInteger(age) || age < 0) {
      throw new Error('大于年龄必须是大于等于 0 的整数。');
    }
    if (age >= ID_CARD_MAX_RANDOM_AGE) {
      throw new Error(`大于年龄必须小于 ${ID_CARD_MAX_RANDOM_AGE}。`);
    }

    return {
      minAge: age + 1,
      maxAge: ID_CARD_MAX_RANDOM_AGE,
    };
  }

  if (ruleType === 'range') {
    const match = value.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) {
      throw new Error('区间格式应为 2-18。');
    }

    const minAge = Number(match[1]);
    const maxAge = Number(match[2]);
    if (minAge > maxAge) {
      throw new Error('年龄区间起始值不能大于结束值。');
    }
    if (maxAge > ID_CARD_MAX_RANDOM_AGE) {
      throw new Error(`年龄区间最大不能超过 ${ID_CARD_MAX_RANDOM_AGE}。`);
    }

    return { minAge, maxAge };
  }

  throw new Error('年龄限制类型不支持。');
}

function createRandomBirthDateByAgeRule(rule) {
  const currentDate = new Date();
  const latestDate = addClampedYears(currentDate, -rule.minAge);
  const earliestDate = addDays(addClampedYears(currentDate, -(rule.maxAge + 1)), 1);
  const earliestTime = new Date(
    earliestDate.getFullYear(),
    earliestDate.getMonth(),
    earliestDate.getDate(),
  ).getTime();
  const latestTime = new Date(
    latestDate.getFullYear(),
    latestDate.getMonth(),
    latestDate.getDate(),
  ).getTime();

  if (earliestTime > latestTime) {
    throw new Error('年龄限制范围无可用生日。');
  }

  return formatDateOnly(new Date(getRandomInteger(earliestTime, latestTime)));
}

function calculateAgeFromBirthDate(birthDate) {
  const normalized = birthDate.replace(/-/g, '');
  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));
  const day = Number(normalized.slice(6, 8));
  const today = new Date();
  let age = today.getFullYear() - year;

  if (
    today.getMonth() + 1 < month
    || ((today.getMonth() + 1) === month && today.getDate() < day)
  ) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function formatIdCardResultLine(idNumber, genderText, birthDate, name) {
  const age = `${calculateAgeFromBirthDate(birthDate)}岁`.padStart(4, ' ');
  return `${idNumber} ${genderText} ${age} ${name}`;
}

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
  name: 'ToolboxPanel',
  data() {
    const defaultIdCardSelection = getDefaultIdCardSelection();
    const defaultBirthDate = createDefaultBirthDate();

    return {
      searchKeyword: '',
      activeTool: 'base64',
      tools: [
        {
          id: 'base64',
          title: 'Base64 编解码',
          description: '文本转 Base64 或反向解码',
        },
        {
          id: 'url',
          title: 'URL 编解码',
          description: '处理 query 参数和路径片段',
        },
        {
          id: 'hex',
          title: '16进制与字符串互转',
          description: '文本与十六进制字符串互相转换',
        },
        {
          id: 'uuid',
          title: 'UUID 生成',
          description: '支持连字符切换与批量生成多个 UUID',
        },
        {
          id: 'idcard',
          title: '身份证号码生成',
          description: '按省市区、性别、生日生成 18 位测试号码',
        },
        {
          id: 'ocr',
          title: 'OCR 文字识别',
          description: '上传图片或 PDF，调用 OCR.Space 提取文字',
        },
        {
          id: 'qrcode',
          title: '二维码生成',
          description: '输入内容生成二维码，支持尺寸设置和下载',
        },
        {
          id: 'json',
          title: 'JSON 格式化',
          description: '格式化或压缩 JSON 字符串',
        },
        {
          id: 'hash',
          title: '摘要计算',
          description: '生成 SHA-256 / 384 / 512 / md5摘要',
        },
        {
          id: 'ip',
          title: 'IP 归属地查询',
          description: '查询 IP 地址归属地并识别内网地址',
        },
        {
          id: 'timestamp',
          title: '时间戳转换',
          description: '时间戳与日期格式互转，并计算时间间隔',
        },
      ],
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
      idCardProvinceOptions: ID_CARD_REGION_OPTIONS,
      idCardCityOptions: getOptionChildren(ID_CARD_REGION_OPTIONS, defaultIdCardSelection.provinceCode),
      idCardDistrictOptions: getOptionChildren(
        getOptionChildren(ID_CARD_REGION_OPTIONS, defaultIdCardSelection.provinceCode),
        defaultIdCardSelection.cityCode,
      ),
      idCardAgeRuleOptions: ID_CARD_AGE_RULE_OPTIONS,
      idCardGenderOptions: ID_CARD_GENDER_OPTIONS,
      idCardProvinceCode: defaultIdCardSelection.provinceCode,
      idCardCityCode: defaultIdCardSelection.cityCode,
      idCardDistrictCode: defaultIdCardSelection.districtCode,
      idCardGender: 'male',
      idCardBirthDate: defaultBirthDate,
      idCardCount: 1,
      idCardAgeRuleType: 'none',
      idCardAgeRuleValue: '',
      idCardResult: '',
      idCardMessage: '按规则生成测试数据，结果格式：号码 性别 年龄 姓名。',
      ocrLanguage: 'chs',
      ocrFile: null,
      ocrFileName: '',
      ocrResult: '',
      ocrMessage: '使用 OCR.Space 免费 API 识别图片或 PDF 文本。',
      qrCodeText: '',
      qrCodeSize: 320,
      qrCodeDataUrl: '',
      qrCodeMessage: '输入内容后可生成二维码并下载 PNG。',
      jsonText: '',
      jsonResult: '',
      jsonMessage: '输入合法 JSON 后即可处理。',
      hashAlgorithms: HASH_ALGORITHMS,
      hashText: '',
      hashResults: createEmptyHashResults(),
      hashResultUppercase: false,
      hashMessage: '使用 crypto-js 算法库。',
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
  computed: {
    filteredTools() {
      const keyword = this.searchKeyword.toLowerCase();
      if (!keyword) {
        return this.tools;
      }

      return this.tools.filter((tool) => {
        const text = `${tool.title} ${tool.description} ${tool.id}`.toLowerCase();
        return text.indexOf(keyword) !== -1;
      });
    },
    hashCaseButtonText() {
      return this.hashResultUppercase ? '转小写' : '转大写';
    },
    idCardRegionText() {
      return [
        findOptionLabel(this.idCardProvinceOptions, this.idCardProvinceCode),
        findOptionLabel(this.idCardCityOptions, this.idCardCityCode),
        findOptionLabel(this.idCardDistrictOptions, this.idCardDistrictCode),
      ].filter(Boolean).join('');
    },
    idCardGenderText() {
      return findOptionLabel(this.idCardGenderOptions, this.idCardGender) || '未选择';
    },
    idCardBirthText() {
      return this.idCardBirthDate || '未选择';
    },
    idCardAgeRuleInputLabel() {
      if (this.idCardAgeRuleType === 'range') {
        return '年龄区间';
      }

      return '年龄值';
    },
    idCardAgeRulePlaceholder() {
      if (this.idCardAgeRuleType === 'lt' || this.idCardAgeRuleType === 'gt') {
        return '例如 18';
      }
      if (this.idCardAgeRuleType === 'range') {
        return '例如 2-18';
      }

      return '随机时不限制年龄';
    },
    idCardAgeRuleText() {
      const value = this.idCardAgeRuleValue.trim();
      if (this.idCardAgeRuleType === 'lt') {
        return value ? `小于 ${value} 岁` : '小于';
      }
      if (this.idCardAgeRuleType === 'gt') {
        return value ? `大于 ${value} 岁` : '大于';
      }
      if (this.idCardAgeRuleType === 'range') {
        return value || '区间';
      }

      return '不限';
    },
    uuidHyphenButtonText() {
      return this.uuidWithHyphen ? '切换为无 -' : '切换为带 -';
    },
    qrCodePreviewSize() {
      return Math.min(this.qrCodeSize || 320, 320);
    },
  },
  watch: {
    filteredTools(tools) {
      if (!tools.length) {
        this.activeTool = '';
        return;
      }

      const currentVisible = tools.some((tool) => tool.id === this.activeTool);
      if (!currentVisible) {
        this.activeTool = tools[0].id;
      }
    },
    hashText() {
      this.generateHashes();
    },
    idCardAgeRuleType(value) {
      if (value === 'none') {
        this.idCardAgeRuleValue = '';
      }
    },
  },
  mounted() {
    if (typeof window === 'undefined') {
      return;
    }

    this.handleIdCardProvinceChange(false);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    this.$nextTick(() => {
      const hash = window.location.hash.replace('#tool-', '');
      if (hash && this.tools.some((tool) => tool.id === hash)) {
        this.scrollToTool(hash, false);
      } else {
        this.handleScroll();
      }
    });
  },
  beforeDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
    }
  },
  methods: {
    isVisible(id) {
      return this.filteredTools.some((tool) => tool.id === id);
    },
    scrollToTool(id, smooth = true) {
      this.activeTool = id;

      this.$nextTick(() => {
        const section = this.$refs[id];
        if (!section || !section.scrollIntoView) {
          return;
        }

        section.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'start',
        });

        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          window.history.replaceState(null, '', `#tool-${id}`);
        }
      });
    },
    handleScroll() {
      if (typeof window === 'undefined') {
        return;
      }

      const offset = 140;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight,
      );
      let current = '';

      if (viewportHeight + scrollTop >= documentHeight - 8 && this.filteredTools.length) {
        this.activeTool = this.filteredTools[this.filteredTools.length - 1].id;
        return;
      }

      this.filteredTools.forEach((tool) => {
        const section = this.$refs[tool.id];
        if (!section) {
          return;
        }

        const rect = section.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom > offset) {
          current = tool.id;
        }
      });

      if (!current) {
        const nextVisibleTool = this.filteredTools.find((tool) => {
          const section = this.$refs[tool.id];
          if (!section) {
            return false;
          }

          return section.getBoundingClientRect().top > offset;
        });

        if (nextVisibleTool) {
          current = nextVisibleTool.id;
        }
      }

      if (!current && this.filteredTools.length) {
        current = this.filteredTools[this.filteredTools.length - 1].id;
      }

      this.activeTool = current;
    },
    handleIdCardProvinceChange(resetDistrict = true) {
      this.idCardCityOptions = getOptionChildren(this.idCardProvinceOptions, this.idCardProvinceCode);

      if (!this.idCardCityOptions.some((city) => city.value === this.idCardCityCode)) {
        this.idCardCityCode = this.idCardCityOptions.length ? this.idCardCityOptions[0].value : '';
      }

      this.handleIdCardCityChange(resetDistrict);
    },
    handleIdCardCityChange(resetDistrict = true) {
      this.idCardDistrictOptions = getOptionChildren(this.idCardCityOptions, this.idCardCityCode);

      if (
        resetDistrict
        || !this.idCardDistrictOptions.some((district) => district.value === this.idCardDistrictCode)
      ) {
        this.idCardDistrictCode = this.idCardDistrictOptions.length ? this.idCardDistrictOptions[0].value : '';
      }
    },
    generateRandomIdCardNumbers() {
      try {
        const randomCount = Number(this.idCardCount);
        if (!Number.isInteger(randomCount) || randomCount < 1) {
          throw new Error('生成数量必须是大于 0 的整数。');
        }
        if (randomCount > 50) {
          throw new Error('单次最多随机生成 50 个号码。');
        }
        if (!getIdCardRegionSelections().length) {
          throw new Error('当前没有可用的随机地区数据。');
        }
        const ageRule = parseIdCardAgeRule(this.idCardAgeRuleType, this.idCardAgeRuleValue);

        const values = Array.from({ length: randomCount }, () => {
          const region = createRandomIdCardRegionSelection();
          const gender = createRandomItem(this.idCardGenderOptions).value;
          const birthDate = ageRule ? createRandomBirthDateByAgeRule(ageRule) : createRandomBirthDate();
          const name = createRandomChineseName(gender);
          const areaCode = createIdCardAreaCode(
            region.provinceCode,
            region.cityCode,
            region.districtCode,
          );
          const idNumber = createIdCardNumber(areaCode, birthDate.replace(/-/g, ''), gender);
          return formatIdCardResultLine(
            idNumber,
            findOptionLabel(this.idCardGenderOptions, gender),
            birthDate,
            name,
          );
        });

        this.idCardResult = values.join('\n');
        this.idCardMessage = `已随机生成 ${randomCount} 条测试数据。${ID_CARD_LEGAL_NOTICE}`;
      } catch (error) {
        this.idCardResult = '';
        this.idCardMessage = error.message || '随机生成失败。';
      }
    },
    generateIdCardNumbers() {
      try {
        if (!this.idCardProvinceCode || !this.idCardCityCode || !this.idCardDistrictCode) {
          throw new Error('请先选择完整的省市区。');
        }
        if (!this.idCardBirthDate) {
          throw new Error('请先选择出生日期。');
        }
        if (!isValidBirthDate(this.idCardBirthDate)) {
          throw new Error('出生日期格式不正确。');
        }

        const count = Number(this.idCardCount);
        if (!Number.isInteger(count) || count < 1) {
          throw new Error('生成数量必须是大于 0 的整数。');
        }
        if (count > 50) {
          throw new Error('单次最多生成 50 个号码。');
        }

        const areaCode = createIdCardAreaCode(
          this.idCardProvinceCode,
          this.idCardCityCode,
          this.idCardDistrictCode,
        );
        const birthDate = this.idCardBirthDate.replace(/-/g, '');
        const genderText = this.idCardGenderText;
        const values = Array.from({ length: count }, () => {
          const idNumber = createIdCardNumber(areaCode, birthDate, this.idCardGender);
          const name = createRandomChineseName(this.idCardGender);
          return formatIdCardResultLine(idNumber, genderText, this.idCardBirthDate, name);
        });

        this.idCardCount = count;
        this.idCardResult = values.join('\n');
        this.idCardMessage = `已生成 ${count} 条测试数据。${ID_CARD_LEGAL_NOTICE}`;
      } catch (error) {
        this.idCardResult = '';
        this.idCardMessage = error.message || '身份证号码生成失败。';
      }
    },
    clearIdCardGenerator() {
      const defaultSelection = getDefaultIdCardSelection();

      this.idCardProvinceCode = defaultSelection.provinceCode;
      this.idCardCityCode = defaultSelection.cityCode;
      this.idCardDistrictCode = defaultSelection.districtCode;
      this.idCardGender = 'male';
      this.idCardBirthDate = createDefaultBirthDate();
      this.idCardCount = 1;
      this.idCardAgeRuleType = 'none';
      this.idCardAgeRuleValue = '';
      this.idCardResult = '';
      this.idCardMessage = '按规则生成测试数据，结果格式：号码 性别 年龄 姓名。';
      this.handleIdCardProvinceChange(false);
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
    handleOcrFileChange(event) {
      const file = event && event.target && event.target.files ? event.target.files[0] : null;
      this.ocrFile = file || null;
      this.ocrFileName = file ? file.name : '';
      this.ocrResult = '';
      this.ocrMessage = file ? '文件已选择，点击识别开始 OCR。' : '使用免费 API 识别图片或 PDF 文本。';
    },
    async recognizeOcrText() {
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
      }
    },
    clearOcrResult() {
      this.ocrLanguage = 'chs';
      this.ocrFile = null;
      this.ocrFileName = '';
      this.ocrResult = '';
      this.ocrMessage = '使用 OCR.Space 免费 API 识别图片或 PDF 文本。';

      if (this.$refs.ocrFileInput) {
        this.$refs.ocrFileInput.value = '';
      }
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
    handleIdCardCopy(event) {
      const target = event && event.target;
      if (!target || typeof target.selectionStart !== 'number' || typeof target.selectionEnd !== 'number') {
        return;
      }

      const clipboardData = event.clipboardData || (typeof window !== 'undefined' ? window.clipboardData : null);
      if (!clipboardData) {
        return;
      }

      const selectedText = target.value.slice(target.selectionStart, target.selectionEnd);
      const trimmedText = selectedText.replace(/^\s+|\s+$/g, '');
      if (!selectedText || trimmedText === selectedText) {
        return;
      }

      event.preventDefault();
      clipboardData.setData('text/plain', trimmedText);
    },
    async copyText(value, type) {
      if (!value) {
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = value;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

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
      } else if (type === 'idcard') {
        this.idCardMessage = message;
      } else if (type === 'ocr') {
        this.ocrMessage = message;
      } else if (type === 'qrcode') {
        this.qrCodeMessage = message;
      } else if (type === 'json') {
        this.jsonMessage = message;
      } else if (type === 'hash') {
        this.hashMessage = message;
      } else if (type === 'ip') {
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

<style scoped>
.toolbox-panel {
  margin: 24px 0 8px;
}

.toolbox-intro {
  margin: 0 0 24px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--textColor);
}

.toolbox-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.toolbox-sidebar {
  position: sticky;
  top: 88px;
}

.toolbox-sidebar__inner {
  padding: 18px;
  border: 1px solid var(--borderColor);
  border-radius: 16px;
  background: var(--mainBg);
  box-shadow: 0 10px 28px rgba(17, 168, 205, 0.08);
}

.toolbox-sidebar__header h2 {
  margin: 0;
  font-size: 20px;
}

.toolbox-sidebar__header p {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--textLightenColor);
}

.toolbox-search {
  width: 100%;
  height: 42px;
  margin-top: 16px;
  padding: 0 14px;
  border: 1px solid var(--borderColor);
  border-radius: 12px;
  box-sizing: border-box;
  background: rgba(17, 168, 205, 0.04);
  color: var(--textColor);
  font-size: 14px;
  font-family: sans-serif;
}

.toolbox-count {
  margin-top: 12px;
  font-size: 13px;
  color: var(--textLightenColor);
}

.toolbox-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.toolbox-nav__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: rgba(17, 168, 205, 0.04);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbox-nav__item:hover,
.toolbox-nav__item.active {
  border-color: #11a8cd;
  background: rgba(17, 168, 205, 0.1);
}

.toolbox-nav__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--textColor);
}

.toolbox-nav__desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--textLightenColor);
}

.toolbox-empty {
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(17, 168, 205, 0.05);
  font-size: 13px;
  color: var(--textLightenColor);
}

.toolbox-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--borderColor);
  border-radius: 16px;
  background: var(--mainBg);
  box-shadow: 0 10px 28px rgba(17, 168, 205, 0.08);
}

.tool-section {
  scroll-margin-top: 96px;
}

.tool-card__header,
.tool-card__footer,
.tool-card__actions {
  display: flex;
  align-items: center;
}

.tool-card__header,
.tool-card__footer {
  justify-content: space-between;
  gap: 12px;
}

.tool-card__header h2 {
  margin: 0;
  font-size: 20px;
}

.tool-card__actions {
  gap: 10px;
  flex-wrap: wrap;
}

.tool-divider {
  height: 1px;
  background: var(--borderColor);
}

.tool-subsection {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tool-subsection__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tool-subsection__title {
  margin: 0;
  font-size: 16px;
  color: var(--textColor);
}

.time-range-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.time-range-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-range-field span {
  font-size: 13px;
  color: var(--textLightenColor);
}

.uuid-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.uuid-toolbar__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}

.uuid-toolbar__field span {
  font-size: 13px;
  color: var(--textLightenColor);
}

.idcard-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(240px, 0.65fr);
  gap: 18px;
  align-items: stretch;
}

.idcard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.idcard-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.idcard-field span {
  font-size: 13px;
  color: var(--textLightenColor);
}

.idcard-summary {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  height: 100%;
  padding: 16px;
  border: 1px solid var(--borderColor);
  border-radius: 14px;
  box-sizing: border-box;
  background: rgba(17, 168, 205, 0.04);
}

.idcard-summary__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.idcard-summary__item span {
  font-size: 12px;
  color: var(--textLightenColor);
}

.idcard-summary__item strong {
  font-size: 14px;
  line-height: 1.6;
  color: var(--textColor);
  word-break: break-all;
}

.ocr-toolbar {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  gap: 14px;
}

.ocr-toolbar__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ocr-toolbar__field span {
  font-size: 13px;
  color: var(--textLightenColor);
}

.ocr-file-tip {
  font-size: 13px;
  color: var(--textLightenColor);
  word-break: break-all;
}

.qr-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.qr-toolbar__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}

.qr-toolbar__field span {
  font-size: 13px;
  color: var(--textLightenColor);
}

.qr-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 16px;
  border: 1px dashed var(--borderColor);
  border-radius: 14px;
  background: rgba(17, 168, 205, 0.03);
}

.qr-preview.empty {
  color: var(--textLightenColor);
  font-size: 14px;
}

.qr-preview img {
  display: block;
  max-width: 100%;
  border-radius: 8px;
  background: #fff;
}

.hash-workbench {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.25fr);
  gap: 18px;
  align-items: start;
}

.hash-input-panel,
.hash-result-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hash-results-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hash-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--textColor);
}

.hash-result-box {
  position: relative;
}

.hash-copy-button {
  min-width: 72px;
  height: 30px !important;
  padding: 0 10px !important;
  border-radius: 8px !important;
  font-size: 12px !important;
  line-height: 30px;
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1;
  background: rgba(17, 168, 205, 0.08) !important;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.hash-copy-button:hover {
  color: #fff !important;
  background: #11a8cd !important;
  border-color: #11a8cd !important;
}

.tool-card textarea {
  width: 100%;
  resize: vertical;
  min-height: 120px;
  padding: 12px 14px;
  border: 1px solid var(--borderColor);
  border-radius: 12px;
  box-sizing: border-box;
  background: rgba(17, 168, 205, 0.04);
  color: var(--textColor);
  font-size: 14px;
  line-height: 1.7;
  font-family: sans-serif;
}

.hash-result-box textarea {
  padding-bottom: 58px;
}

.tool-input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid var(--borderColor);
  border-radius: 12px;
  box-sizing: border-box;
  background: rgba(17, 168, 205, 0.04);
  color: var(--textColor);
  font-size: 14px;
  font-family: sans-serif;
}

.tool-card textarea[readonly] {
  background: rgba(17, 168, 205, 0.02);
}

.idcard-result-output {
  font-family: Consolas, 'Courier New', monospace !important;
  font-variant-numeric: tabular-nums;
  tab-size: 2;
}

.tool-card button,
.tool-card select {
  height: 38px;
  border-radius: 10px;
  border: 1px solid #11a8cd;
  font-size: 14px;
}

.tool-card button {
  min-width: 88px;
  padding: 0 14px;
  background: #11a8cd;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.tool-card button.ghost {
  background: transparent;
  color: #11a8cd;
}

.tool-card button:hover:not([disabled]) {
  border-color: #0d8fad;
  background: #0d8fad;
  box-shadow: 0 8px 20px rgba(17, 168, 205, 0.18);
}

.tool-card button.ghost:hover:not([disabled]) {
  color: #fff;
  background: #11a8cd;
  border-color: #11a8cd;
}

.tool-card button[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

.tool-input--file {
  padding: 8px 10px;
}

.tool-card select {
  min-width: 120px;
  padding: 0 12px;
  background: var(--mainBg);
  color: var(--textColor);
  font-family: sans-serif;
}

.tool-card__footer span {
  font-size: 13px;
  color: var(--textLightenColor);
}

@media (max-width: 960px) {
  .idcard-workbench,
  .ocr-toolbar,
  .time-range-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .idcard-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
