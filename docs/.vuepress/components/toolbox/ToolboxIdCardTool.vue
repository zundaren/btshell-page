<template>
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
      <button type="button" class="ghost" @click="copyText(idCardResult)">复制结果</button>
    </div>
  </section>
</template>

<script>
import { writeTextToClipboard } from './clipboard';

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

export default {
  name: 'ToolboxIdCardTool',
  props: {
    visibleToolIds: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    const defaultIdCardSelection = getDefaultIdCardSelection();
    const defaultBirthDate = createDefaultBirthDate();

    return {
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
    };
  },
  computed: {
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
  },
  watch: {
    idCardAgeRuleType(value) {
      if (value === 'none') {
        this.idCardAgeRuleValue = '';
      }
    },
  },
  mounted() {
    this.handleIdCardProvinceChange(false);
  },
  methods: {
    isVisible(id) {
      return this.visibleToolIds.indexOf(id) !== -1;
    },
    getSectionElement(id) {
      return id === 'idcard' ? this.$refs.idcard || null : null;
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
    async copyText(value) {
      if (!value) {
        return;
      }

      try {
        await writeTextToClipboard(value);
        this.idCardMessage = '结果已复制。';
      } catch (error) {
        this.idCardMessage = '复制失败，请手动复制。';
      }
    },
  },
};
</script>
