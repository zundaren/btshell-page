<template>
  <div class="linux-command-panel">
    <div class="linux-command-layout">
      <aside class="linux-command-sidebar">
        <div class="linux-command-sidebar__inner">
          <input
            v-model.trim="searchKeyword"
            class="linux-command-search"
            type="text"
            placeholder="搜索命令，例如 ls、grep、systemctl"
          >
          <div class="linux-command-count">
            命中 {{ filteredCommands.length }} / {{ commandIndex.length }} 条
          </div>
          <div v-if="sourceSummary" class="linux-command-source">
            {{ sourceSummary }}
          </div>
          <div v-if="loadingIndex" class="linux-command-state linux-command-state--sidebar">
            正在加载命令索引...
          </div>
          <div v-else-if="indexError" class="linux-command-state linux-command-state--error">
            {{ indexError }}
          </div>
          <div v-else-if="filteredCommands.length" class="linux-command-nav">
            <button
              v-for="command in filteredCommands"
              :key="command.slug"
              type="button"
              class="linux-command-nav__item"
              :class="{ active: activeCommandSlug === command.slug }"
              @click="selectCommand(command.slug)"
            >
              <span class="linux-command-nav__title">{{ command.title }}</span>
              <span class="linux-command-nav__desc">{{ command.description }}</span>
            </button>
          </div>
          <div v-else class="linux-command-state linux-command-state--sidebar">
            没有匹配的命令，换个关键词试试。
          </div>
        </div>
      </aside>

      <section class="linux-command-content">
        <div v-if="loadingIndex" class="linux-command-empty">
          正在准备命令文档...
        </div>
        <div v-else-if="indexError" class="linux-command-empty linux-command-empty--error">
          {{ indexError }}
        </div>
        <template v-else-if="activeCommandSummary">
          <header class="linux-command-header">
            <div>
              <div class="linux-command-header__eyebrow">Linux Command</div>
              <h2 class="linux-command-header__title">{{ activeCommandSummary.title }}</h2>
              <p class="linux-command-header__desc">{{ activeCommandSummary.description }}</p>
            </div>
            <div class="linux-command-header__meta">
              <code>{{ activeCommandSummary.slug }}</code>
              <span>{{ detailStateText }}</span>
            </div>
          </header>

          <div v-if="loadingDetail" class="linux-command-empty">
            正在加载 {{ activeCommandSummary.title }} 的详情...
          </div>
          <div v-else-if="detailError" class="linux-command-empty linux-command-empty--error">
            {{ detailError }}
          </div>
          <ClientOnly v-else-if="activeCommandDetail">
            <mavon-editor
              class="linux-command-preview"
              :value="activeCommandDetail.markdown"
              language="zh-CN"
              :toolbars-flag="false"
              :subfield="false"
              default-open="preview"
              :editable="false"
              :navigation="false"
              :box-shadow="false"
              :scroll-style="true"
              preview-background="#ffffff"
              code-style="github"
            />
          </ClientOnly>
        </template>
        <div v-else class="linux-command-empty">
          选择左侧命令查看详情。
        </div>
      </section>
    </div>
  </div>
</template>

<script>
function normalizeSearchKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

function getCommandScore(command, keyword) {
  if (!keyword) {
    return 0;
  }

  if (command.slug === keyword || command.title.toLowerCase() === keyword) {
    return 400;
  }

  if (command.title.toLowerCase().indexOf(keyword) === 0) {
    return 300;
  }

  if (command.slug.indexOf(keyword) === 0) {
    return 250;
  }

  if (command.title.toLowerCase().indexOf(keyword) !== -1) {
    return 200;
  }

  if (command.slug.indexOf(keyword) !== -1) {
    return 150;
  }

  if (command.description.toLowerCase().indexOf(keyword) !== -1) {
    return 100;
  }

  return 0;
}

export default {
  name: 'LinuxCommandPanel',
  data() {
    return {
      searchKeyword: '',
      loadingIndex: true,
      loadingDetail: false,
      indexError: '',
      detailError: '',
      commandIndex: [],
      metadata: null,
      activeCommandSlug: '',
      activeCommandDetail: null,
      detailCache: {},
      currentDetailRequestKey: '',
    };
  },
  computed: {
    filteredCommands() {
      const keyword = normalizeSearchKeyword(this.searchKeyword);
      if (!keyword) {
        return this.commandIndex;
      }

      return this.commandIndex
        .filter((command) => command.searchText.indexOf(keyword) !== -1)
        .slice()
        .sort((left, right) => {
          const scoreDelta = getCommandScore(right, keyword) - getCommandScore(left, keyword);
          if (scoreDelta !== 0) {
            return scoreDelta;
          }

          return left.title.localeCompare(right.title, 'en');
        });
    },
    activeCommandSummary() {
      return this.commandIndex.find((command) => command.slug === this.activeCommandSlug) || null;
    },
    detailStateText() {
      if (!this.metadata || !this.metadata.commandCount) {
        return '本地文档';
      }

      return `本地 ${this.metadata.commandCount} 条命令`;
    },
    sourceSummary() {
      if (!this.metadata || !this.metadata.sourceCommit) {
        return '';
      }

      const commitHash = String(this.metadata.sourceCommit.hash || '').slice(0, 7);
      const commitDate = this.metadata.sourceCommit.date || '';
      if (!commitHash && !commitDate) {
        return '';
      }

      return `来源 jaywcjlove/linux-command · ${commitHash} · ${commitDate}`;
    },
  },
  watch: {
    filteredCommands(commands) {
      if (!commands.length) {
        this.activeCommandSlug = '';
        this.activeCommandDetail = null;
        this.detailError = '';
        this.loadingDetail = false;
        return;
      }

      const isCurrentVisible = commands.some((command) => command.slug === this.activeCommandSlug);
      if (!isCurrentVisible) {
        this.selectCommand(commands[0].slug, false);
      }
    },
  },
  mounted() {
    this.loadCommandIndex();
  },
  methods: {
    getIndexUrl() {
      return this.$withBase('/linux-command/index.json');
    },
    getDetailUrl(slug) {
      return this.$withBase(`/linux-command/commands/${encodeURIComponent(slug)}.json`);
    },
    getHashSlug() {
      if (typeof window === 'undefined') {
        return '';
      }

      return window.location.hash.replace('#cmd-', '').trim();
    },
    updateHash(slug) {
      if (
        !slug
        || typeof window === 'undefined'
        || !window.history
        || typeof window.history.replaceState !== 'function'
      ) {
        return;
      }

      window.history.replaceState(null, '', `#cmd-${slug}`);
    },
    async loadCommandIndex() {
      this.loadingIndex = true;
      this.indexError = '';

      try {
        const response = await fetch(this.getIndexUrl());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        this.commandIndex = Array.isArray(payload.commands) ? payload.commands : [];
        this.metadata = payload.metadata || null;

        const hashSlug = this.getHashSlug();
        const initialCommand = this.commandIndex.find((command) => command.slug === hashSlug);
        const fallbackCommand = this.commandIndex[0];
        if (initialCommand) {
          this.selectCommand(initialCommand.slug, false);
        } else if (fallbackCommand) {
          this.selectCommand(fallbackCommand.slug, false);
        }
      } catch (error) {
        this.indexError = `命令索引加载失败：${error && error.message ? error.message : '未知错误'}`;
      } finally {
        this.loadingIndex = false;
      }
    },
    async selectCommand(slug, updateHash = true) {
      if (!slug) {
        return;
      }

      this.activeCommandSlug = slug;
      this.detailError = '';
      if (updateHash) {
        this.updateHash(slug);
      }

      if (this.detailCache[slug]) {
        this.currentDetailRequestKey = '';
        this.loadingDetail = false;
        this.activeCommandDetail = this.detailCache[slug];
        return;
      }

      this.loadingDetail = true;
      this.activeCommandDetail = null;
      const requestKey = `${slug}-${Date.now()}`;
      this.currentDetailRequestKey = requestKey;

      try {
        const response = await fetch(this.getDetailUrl(slug));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        this.$set(this.detailCache, slug, payload);

        if (this.currentDetailRequestKey === requestKey && this.activeCommandSlug === slug) {
          this.activeCommandDetail = payload;
        }
      } catch (error) {
        if (this.currentDetailRequestKey === requestKey && this.activeCommandSlug === slug) {
          this.detailError = `命令详情加载失败：${error && error.message ? error.message : '未知错误'}`;
        }
      } finally {
        if (this.currentDetailRequestKey === requestKey) {
          this.loadingDetail = false;
        }
      }
    },
  },
};
</script>

<style src="./linux-command/linux-command.css"></style>
