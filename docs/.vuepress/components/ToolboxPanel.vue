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
        <ToolboxCodecTools
          ref="codecTools"
          :visible-tool-ids="visibleToolIds"
        />
        <ToolboxIdCardTool
          ref="idCardTool"
          :visible-tool-ids="visibleToolIds"
        />
        <ToolboxImageTools
          ref="imageTools"
          :visible-tool-ids="visibleToolIds"
        />
        <ToolboxVideoTools
          ref="videoTools"
          :visible-tool-ids="visibleToolIds"
        />
        <ToolboxDataTools
          ref="dataTools"
          :visible-tool-ids="visibleToolIds"
        />
        <ToolboxNetworkTimeTools
          ref="networkTimeTools"
          :visible-tool-ids="visibleToolIds"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ToolboxCodecTools from './toolbox/ToolboxCodecTools.vue';
import ToolboxDataTools from './toolbox/ToolboxDataTools.vue';
import ToolboxIdCardTool from './toolbox/ToolboxIdCardTool.vue';
import ToolboxImageTools from './toolbox/ToolboxImageTools.vue';
import ToolboxNetworkTimeTools from './toolbox/ToolboxNetworkTimeTools.vue';
import ToolboxVideoTools from './toolbox/ToolboxVideoTools.vue';

const TOOL_GROUP_REF_MAP = {
  base64: 'codecTools',
  url: 'codecTools',
  hex: 'codecTools',
  uuid: 'codecTools',
  idcard: 'idCardTool',
  image: 'imageTools',
  'video-gif': 'videoTools',
  ocr: 'dataTools',
  qrcode: 'dataTools',
  json: 'dataTools',
  config: 'dataTools',
  hash: 'dataTools',
  ip: 'networkTimeTools',
  timestamp: 'networkTimeTools',
};

function createTool(title, description, options = {}) {
  const searchTokens = Array.isArray(options.searchTokens) ? options.searchTokens.join(' ') : '';

  return {
    id: options.id,
    title,
    description,
    searchText: `${title} ${description} ${options.id} ${searchTokens}`.toLowerCase(),
  };
}

export default {
  name: 'ToolboxPanel',
  components: {
    ToolboxCodecTools,
    ToolboxIdCardTool,
    ToolboxImageTools,
    ToolboxVideoTools,
    ToolboxDataTools,
    ToolboxNetworkTimeTools,
  },
  data() {
    return {
      searchKeyword: '',
      activeTool: 'base64',
      tools: [
        createTool('Base64 编解码', '文本转 Base64 或反向解码', {
          id: 'base64',
          searchTokens: ['base64', 'b64', 'bianjie码', 'bianjiema', 'bjm'],
        }),
        createTool('URL 编解码', '处理 query 参数和路径片段', {
          id: 'url',
          searchTokens: ['url', 'bianjie码', 'bianjiema', 'bjm'],
        }),
        createTool('16进制与字符串互转', '文本与十六进制字符串互相转换', {
          id: 'hex',
          searchTokens: ['hex', 'shiliujinzhi', 'sljz', 'zifuchuan', 'zfc', 'huzhuan'],
        }),
        createTool('UUID 生成', '支持连字符切换与批量生成多个 UUID', {
          id: 'uuid',
          searchTokens: ['uuid', 'shengcheng', 'sc'],
        }),
        createTool('身份证号码生成', '按省市区、性别、生日生成 18 位测试号码', {
          id: 'idcard',
          searchTokens: ['shenfenzhenghaoma', 'sfzhm', 'shenfenzheng', 'sfz', 'haomashengcheng', 'hmsc'],
        }),
        createTool('图片处理', '压缩图片、裁剪尺寸并叠加文字', {
          id: 'image',
          searchTokens: ['tupianchuli', 'tpcl', 'yasuo', 'ys', 'caijian', 'cj', 'wenzi', 'wz'],
        }),
        createTool('视频转 GIF', '设置速度、抽帧、区间和尺寸生成 GIF', {
          id: 'video-gif',
          searchTokens: ['shipinzhuangif', 'spzgif', 'shipinzhuan', 'spz', 'gif', 'chouzhen', 'cz'],
        }),
        createTool('OCR 文字识别', '上传图片或 PDF，调用 OCR.Space 提取文字', {
          id: 'ocr',
          searchTokens: ['ocr', 'wenzishibie', 'wzsb', 'tiquwenzi', 'tqwz'],
        }),
        createTool('二维码生成', '输入内容生成二维码，支持尺寸设置和下载', {
          id: 'qrcode',
          searchTokens: ['erweima', 'ewm', 'shengcheng', 'sc'],
        }),
        createTool('JSON 格式化', '格式化或压缩 JSON 字符串', {
          id: 'json',
          searchTokens: ['json', 'geshihua', 'gsh', 'yasuo', 'ys'],
        }),
        createTool('JSON / YML / Properties 互转', '任一输入自动转换回显另外两种格式', {
          id: 'config',
          searchTokens: ['json', 'yml', 'yaml', 'properties', 'huzhuan', 'hz', 'zidongzhuanhuan', 'zdzh'],
        }),
        createTool('摘要计算', '生成 SHA-256 / 384 / 512 / md5摘要', {
          id: 'hash',
          searchTokens: ['zhaiyaojisuan', 'zyjs', 'hash', 'md5', 'sha'],
        }),
        createTool('IP 归属地查询', '查询 IP 地址归属地并识别内网地址', {
          id: 'ip',
          searchTokens: ['ip', 'guishudichaxun', 'gsdcx', 'neiwang', 'nw'],
        }),
        createTool('时间戳转换', '时间戳与日期格式互转，并计算时间间隔', {
          id: 'timestamp',
          searchTokens: ['shijianchuozhuanhuan', 'sjczh', 'shijianchuo', 'sjc', 'riqi', 'rq', 'jiange', 'jg'],
        }),
      ],
    };
  },
  computed: {
    filteredTools() {
      const keyword = this.searchKeyword.toLowerCase();
      if (!keyword) {
        return this.tools;
      }

      return this.tools.filter((tool) => {
        return tool.searchText.indexOf(keyword) !== -1;
      });
    },
    visibleToolIds() {
      return this.filteredTools.map((tool) => tool.id);
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
  },
  mounted() {
    if (typeof window === 'undefined') {
      return;
    }

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
    getToolSectionElement(id) {
      const refName = TOOL_GROUP_REF_MAP[id];
      if (!refName) {
        return null;
      }

      const component = this.$refs[refName];
      if (!component || typeof component.getSectionElement !== 'function') {
        return null;
      }

      return component.getSectionElement(id);
    },
    scrollToTool(id, smooth = true) {
      this.activeTool = id;

      this.$nextTick(() => {
        const section = this.getToolSectionElement(id);
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
        const section = this.getToolSectionElement(tool.id);
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
          const section = this.getToolSectionElement(tool.id);
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
  },
};
</script>

<style src="./toolbox/toolbox.css"></style>
