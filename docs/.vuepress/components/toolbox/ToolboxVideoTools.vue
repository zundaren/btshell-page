<template>
  <section
    v-if="isVisible('video-gif')"
    id="tool-video-gif"
    ref="videoGif"
    class="tool-card tool-section"
  >
    <div class="tool-card__header">
      <h2>视频转 GIF</h2>
      <div class="tool-card__actions">
        <button type="button" :disabled="videoGifRendering" @click="generateGif">
          {{ videoGifRendering ? '生成中...' : '生成 GIF' }}
        </button>
        <button type="button" class="ghost" :disabled="!videoGifRendering" @click="cancelGifRender">取消</button>
        <button type="button" class="ghost" @click="clearVideoGifTool">清空</button>
      </div>
    </div>

    <div class="video-toolbar">
      <label class="video-toolbar__field">
        <span>上传视频</span>
        <input
          ref="videoFileInput"
          data-label="上传视频"
          class="tool-input tool-input--file"
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
          @change="handleVideoFileChange"
        >
      </label>
      <label class="video-toolbar__field">
        <span>GIF 宽度</span>
        <input
          v-model.number="gifWidth"
          data-label="GIF 宽度"
          class="tool-input"
          type="number"
          min="32"
          max="1920"
        >
      </label>
      <label class="video-toolbar__field">
        <span>每秒帧数</span>
        <input
          v-model.number="gifFps"
          data-label="每秒帧数"
          class="tool-input"
          type="number"
          min="1"
          max="30"
        >
      </label>
      <label class="video-toolbar__field">
        <span>速度倍率</span>
        <input
          v-model.number="gifSpeed"
          data-label="速度倍率"
          class="tool-input"
          type="number"
          min="0.25"
          max="8"
          step="0.25"
        >
      </label>
    </div>

    <div class="video-file-tip">
      {{ videoFileName || '未选择视频。建议使用较短片段以减少浏览器内存占用。' }}
    </div>

    <div class="video-settings-grid">
      <div class="video-settings-card">
        <div class="video-settings-card__title">截取区间</div>
        <div class="video-settings-fields">
          <label class="video-settings-field">
            <span>开始时间（秒）</span>
            <input
              v-model.number="gifStartTime"
              data-label="开始时间"
              class="tool-input"
              type="number"
              min="0"
              step="0.1"
            >
          </label>
          <label class="video-settings-field">
            <span>结束时间（秒）</span>
            <input
              v-model.number="gifEndTime"
              data-label="结束时间"
              class="tool-input"
              type="number"
              min="0"
              step="0.1"
            >
          </label>
        </div>
        <div class="video-settings-tip">
          默认取完整视频。处理时会自动按视频总时长做范围校验。
        </div>
      </div>

      <div class="video-settings-card">
        <div class="video-settings-card__title">抽帧与编码</div>
        <div class="video-settings-fields">
          <label class="video-settings-field">
            <span>编码质量</span>
            <input
              v-model.number="gifQuality"
              data-label="编码质量"
              class="tool-input"
              type="number"
              min="1"
              max="20"
            >
          </label>
          <label class="video-settings-field">
            <span>循环次数</span>
            <input
              v-model.number="gifRepeat"
              data-label="循环次数"
              class="tool-input"
              type="number"
              min="-1"
              max="100"
            >
          </label>
        </div>
        <div class="video-settings-tip">
          每秒帧数越大，GIF 越流畅也越大；速度倍率越大，生成的 GIF 播放越快。
        </div>
      </div>
    </div>

    <div class="video-preview-grid">
      <div class="video-preview-card">
        <div class="video-preview-card__title">原视频</div>
        <div class="video-preview" :class="{ empty: !videoPreviewUrl }">
          <video
            v-if="videoPreviewUrl"
            controls
            playsinline
            preload="metadata"
            :src="videoPreviewUrl"
          ></video>
          <span v-else>视频预览区</span>
        </div>
        <div class="video-meta">
          <div class="video-meta__item">
            <span>时长</span>
            <strong>{{ videoDurationText }}</strong>
          </div>
          <div class="video-meta__item">
            <span>尺寸</span>
            <strong>{{ videoResolutionText }}</strong>
          </div>
          <div class="video-meta__item">
            <span>大小</span>
            <strong>{{ videoFileSizeText }}</strong>
          </div>
          <div class="video-meta__item">
            <span>预估抽帧</span>
            <strong>{{ estimatedFrameCountText }}</strong>
          </div>
        </div>
      </div>

      <div class="video-preview-card">
        <div class="video-preview-card__title">GIF 结果</div>
        <div class="video-preview" :class="{ empty: !resultGifUrl }">
          <div v-if="videoGifRendering" class="video-preview__loading">
            <span class="video-preview__spinner"></span>
            <strong>GIF 生成中</strong>
            <span>{{ videoGifProgressText }}</span>
          </div>
          <img
            v-if="resultGifUrl"
            :src="resultGifUrl"
            alt="GIF 结果预览"
          >
          <span v-else>GIF 预览区</span>
        </div>
        <div class="video-meta">
          <div class="video-meta__item">
            <span>GIF 尺寸</span>
            <strong>{{ resultGifResolutionText }}</strong>
          </div>
          <div class="video-meta__item">
            <span>GIF 大小</span>
            <strong>{{ resultGifSizeText }}</strong>
          </div>
          <div class="video-meta__item">
            <span>状态</span>
            <strong>{{ videoGifStatusText }}</strong>
          </div>
          <div class="video-meta__item">
            <span>进度</span>
            <strong>{{ videoGifProgressText }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="tool-card__footer">
      <span>{{ videoGifMessage }}</span>
      <button type="button" class="ghost" :disabled="!resultGifBlob" @click="downloadGif">下载 GIF</button>
    </div>
  </section>
</template>

<script>
import GIF from 'gif.js.optimized';

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 2).replace(/\.?0+$/, '')} ${units[unitIndex]}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '未加载';
  }

  return `${seconds.toFixed(seconds >= 10 ? 1 : 2).replace(/\.?0+$/, '')} 秒`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeInteger(value, min, max, label) {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < min || numericValue > max) {
    throw new Error(`${label}必须是 ${min} 到 ${max} 之间的整数。`);
  }

  return numericValue;
}

function normalizeNumber(value, min, max, label) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
    throw new Error(`${label}必须是 ${min} 到 ${max} 之间的数字。`);
  }

  return numericValue;
}

function createObjectUrl(file) {
  return URL.createObjectURL(file);
}

function createVideoElement(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const cleanup = () => {
      video.onloadeddata = null;
      video.onerror = null;
    };

    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => {
      cleanup();
      resolve(video);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('视频加载失败，当前浏览器可能不支持该格式。'));
    };
    video.src = url;
    video.load();
  });
}

function seekVideo(video, currentTime) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
    const handleSeeked = () => {
      cleanup();
      requestAnimationFrame(() => resolve());
    };
    const handleError = () => {
      cleanup();
      reject(new Error('视频抽帧失败，无法定位到目标时间点。'));
    };

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.addEventListener('error', handleError, { once: true });
    video.currentTime = currentTime;
  });
}

function buildFrameTimes(startTime, endTime, fps) {
  const interval = 1 / fps;
  const duration = Math.max(endTime - startTime, 0);
  const estimatedCount = Math.max(1, Math.floor(duration / interval) + 1);

  const frameTimes = [];
  for (let index = 0; index < estimatedCount; index += 1) {
    const nextTime = Math.min(startTime + index * interval, endTime);
    if (!frameTimes.length || Math.abs(nextTime - frameTimes[frameTimes.length - 1]) > 0.001) {
      frameTimes.push(nextTime);
    }
  }

  return {
    frameTimes,
    interval,
  };
}

function buildInputValidationMessage(input) {
  if (!input || !input.validity) {
    return '参数输入不合法，请检查后重试。';
  }

  const label = input.dataset.label || '当前参数';
  const { validity } = input;

  if (validity.valueMissing) {
    return `请填写${label}。`;
  }

  if (validity.badInput) {
    return `${label}格式不正确。`;
  }

  if (validity.rangeUnderflow) {
    return `${label}不能小于 ${input.min}。`;
  }

  if (validity.rangeOverflow) {
    return `${label}不能大于 ${input.max}。`;
  }

  if (validity.stepMismatch) {
    return `${label}格式不正确，请按步进 ${input.step || 1} 调整。`;
  }

  return `${label}输入不合法，请检查后重试。`;
}

export default {
  name: 'ToolboxVideoTools',
  props: {
    visibleToolIds: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      videoFile: null,
      videoFileName: '',
      videoFileSize: 0,
      videoPreviewUrl: '',
      sourceVideoElement: null,
      videoDuration: 0,
      videoWidth: 0,
      videoHeight: 0,
      gifWidth: 480,
      gifStartTime: 0,
      gifEndTime: 0,
      gifFps: 8,
      gifSpeed: 1,
      gifQuality: 10,
      gifRepeat: 0,
      videoGifRendering: false,
      videoGifProgress: 0,
      videoGifMessage: '支持本地视频转 GIF，可设置区间、每秒帧数和播放速度。',
      gifRenderer: null,
      resultGifBlob: null,
      resultGifUrl: '',
      resultGifWidth: 0,
      resultGifHeight: 0,
    };
  },
  computed: {
    videoDurationText() {
      return this.videoDuration ? formatDuration(this.videoDuration) : '未加载';
    },
    videoResolutionText() {
      if (!this.videoWidth || !this.videoHeight) {
        return '未加载';
      }

      return `${this.videoWidth} × ${this.videoHeight}`;
    },
    videoFileSizeText() {
      return this.videoFileSize ? formatFileSize(this.videoFileSize) : '未加载';
    },
    estimatedFrameCountText() {
      if (!this.videoDuration || !this.gifFps) {
        return '未计算';
      }

      try {
        const startTime = clamp(Number(this.gifStartTime) || 0, 0, this.videoDuration);
        const endTime = clamp(Number(this.gifEndTime) || this.videoDuration, startTime, this.videoDuration);
        const fps = Math.max(1, Number(this.gifFps) || 1);
        const { frameTimes } = buildFrameTimes(startTime, endTime, fps);
        return `${frameTimes.length} 帧`;
      } catch (error) {
        return '参数无效';
      }
    },
    resultGifResolutionText() {
      if (!this.resultGifWidth || !this.resultGifHeight) {
        return '未生成';
      }

      return `${this.resultGifWidth} × ${this.resultGifHeight}`;
    },
    resultGifSizeText() {
      return this.resultGifBlob ? formatFileSize(this.resultGifBlob.size) : '未生成';
    },
    videoGifStatusText() {
      if (this.videoGifRendering) {
        return '处理中';
      }

      return this.resultGifBlob ? '已生成' : '待生成';
    },
    videoGifProgressText() {
      if (!this.videoGifRendering) {
        return this.resultGifBlob ? '100%' : '0%';
      }

      return `${Math.round(this.videoGifProgress * 100)}%`;
    },
  },
  beforeDestroy() {
    this.cancelGifRender();
    this.revokePreviewUrl();
    this.revokeResultUrl();
  },
  methods: {
    isVisible(id) {
      return this.visibleToolIds.indexOf(id) !== -1;
    },
    getSectionElement(id) {
      return id === 'video-gif' ? this.$refs.videoGif || null : null;
    },
    revokePreviewUrl() {
      if (this.videoPreviewUrl) {
        URL.revokeObjectURL(this.videoPreviewUrl);
        this.videoPreviewUrl = '';
      }
    },
    revokeResultUrl() {
      if (this.resultGifUrl) {
        URL.revokeObjectURL(this.resultGifUrl);
        this.resultGifUrl = '';
      }
    },
    resetResultState() {
      this.cancelGifRender();
      this.revokeResultUrl();
      this.resultGifBlob = null;
      this.resultGifWidth = 0;
      this.resultGifHeight = 0;
      this.videoGifProgress = 0;
    },
    async handleVideoFileChange(event) {
      const file = event && event.target && event.target.files ? event.target.files[0] : null;

      if (!file) {
        this.clearVideoGifTool();
        return;
      }

      try {
        this.clearVideoGifTool(false);
        const previewUrl = createObjectUrl(file);
        const sourceVideo = await createVideoElement(previewUrl);

        this.videoFile = file;
        this.videoFileName = file.name;
        this.videoFileSize = file.size;
        this.videoPreviewUrl = previewUrl;
        this.sourceVideoElement = sourceVideo;
        this.videoDuration = sourceVideo.duration || 0;
        this.videoWidth = sourceVideo.videoWidth || 0;
        this.videoHeight = sourceVideo.videoHeight || 0;
        this.gifWidth = Math.min(this.videoWidth || 480, 480);
        this.gifStartTime = 0;
        this.gifEndTime = Number((this.videoDuration || 0).toFixed(2));
        this.gifFps = 8;
        this.videoGifMessage = '视频已加载，调整参数后点击生成 GIF。';
      } catch (error) {
        this.clearVideoGifTool();
        this.videoGifMessage = error.message || '视频加载失败。';
      }
    },
    cancelGifRender() {
      if (this.gifRenderer) {
        try {
          this.gifRenderer.abort();
        } catch (error) {
          // ignore abort errors from stale renderers
        }
        this.gifRenderer = null;
      }

      this.videoGifRendering = false;
      this.videoGifProgress = 0;
    },
    reportFirstInvalidInput() {
      const section = this.$refs.videoGif;
      if (!section || typeof section.querySelectorAll !== 'function') {
        return false;
      }

      const inputs = Array.from(section.querySelectorAll('input'));
      const invalidInput = inputs.find((input) => typeof input.checkValidity === 'function' && !input.checkValidity());

      if (!invalidInput) {
        return false;
      }

      this.videoGifMessage = buildInputValidationMessage(invalidInput);

      if (typeof invalidInput.reportValidity === 'function') {
        invalidInput.reportValidity();
      }

      if (typeof invalidInput.focus === 'function') {
        invalidInput.focus();
      }

      return true;
    },
    async generateGif() {
      if (!this.sourceVideoElement || !this.videoDuration) {
        this.videoGifMessage = '请先上传视频文件。';
        return;
      }

      if (this.reportFirstInvalidInput()) {
        return;
      }

      this.resetResultState();

      try {
        const gifWidth = normalizeInteger(this.gifWidth, 32, 1920, 'GIF 宽度');
        const fps = normalizeInteger(this.gifFps, 1, 30, '每秒帧数');
        const quality = normalizeInteger(this.gifQuality, 1, 20, '编码质量');
        const repeat = normalizeInteger(this.gifRepeat, -1, 100, '循环次数');
        const speed = normalizeNumber(this.gifSpeed, 0.25, 8, '速度倍率');
        const startTime = clamp(Number(this.gifStartTime) || 0, 0, this.videoDuration);
        const endTime = clamp(Number(this.gifEndTime) || this.videoDuration, startTime, this.videoDuration);

        if (endTime <= startTime) {
          throw new Error('结束时间必须大于开始时间。');
        }

        const { frameTimes, interval } = buildFrameTimes(startTime, endTime, fps);
        const gifHeight = Math.max(1, Math.round((gifWidth / this.videoWidth) * this.videoHeight));
        const frameDelay = Math.max(20, Math.round((interval * 1000) / speed));
        const workerScript = this.$withBase('/toolbox/gif.worker.js');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('当前浏览器不支持 Canvas，无法生成 GIF。');
        }

        canvas.width = gifWidth;
        canvas.height = gifHeight;
        context.fillStyle = '#ffffff';

        const gif = new GIF({
          workers: 2,
          quality,
          repeat,
          width: gifWidth,
          height: gifHeight,
          background: '#ffffff',
          workerScript,
        });

        this.gifRenderer = gif;
        this.videoGifRendering = true;
        this.videoGifProgress = 0;

        const renderPromise = new Promise((resolve, reject) => {
          gif.on('progress', (progress) => {
            this.videoGifProgress = progress;
            this.videoGifMessage = `GIF 编码中：${Math.round(progress * 100)}%`;
          });
          gif.on('finished', (blob) => resolve(blob));
          gif.on('abort', () => reject(new Error('GIF 生成已取消。')));
        });

        this.videoGifMessage = `抽帧中：0 / ${frameTimes.length}`;
        for (let index = 0; index < frameTimes.length; index += 1) {
          const currentTime = frameTimes[index];
          await seekVideo(this.sourceVideoElement, currentTime);
          context.fillRect(0, 0, gifWidth, gifHeight);
          context.drawImage(this.sourceVideoElement, 0, 0, gifWidth, gifHeight);
          gif.addFrame(canvas, { copy: true, delay: frameDelay });
          this.videoGifMessage = `抽帧中：${index + 1} / ${frameTimes.length}`;
          this.videoGifProgress = ((index + 1) / frameTimes.length) * 0.3;
        }

        this.videoGifMessage = '开始编码 GIF...';
        gif.render();
        const blob = await renderPromise;

        if (this.gifRenderer !== gif) {
          return;
        }

        this.revokeResultUrl();
        this.resultGifBlob = blob;
        this.resultGifUrl = createObjectUrl(blob);
        this.resultGifWidth = gifWidth;
        this.resultGifHeight = gifHeight;
        this.videoGifRendering = false;
        this.videoGifProgress = 1;
        this.videoGifMessage = `GIF 生成完成，共 ${frameTimes.length} 帧，大小 ${formatFileSize(blob.size)}。`;
        this.gifRenderer = null;
      } catch (error) {
        this.cancelGifRender();
        this.resultGifBlob = null;
        this.revokeResultUrl();
        this.videoGifMessage = error.message || 'GIF 生成失败。';
      }
    },
    downloadGif() {
      if (!this.resultGifBlob || !this.resultGifUrl) {
        this.videoGifMessage = '请先生成 GIF。';
        return;
      }

      const baseName = (this.videoFileName || 'video').replace(/\.[^.]+$/, '');
      const link = document.createElement('a');
      link.href = this.resultGifUrl;
      link.download = `${baseName}.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.videoGifMessage = 'GIF 已开始下载。';
    },
    clearVideoGifTool(resetMessage = true) {
      this.cancelGifRender();
      this.revokePreviewUrl();
      this.revokeResultUrl();
      this.videoFile = null;
      this.videoFileName = '';
      this.videoFileSize = 0;
      this.sourceVideoElement = null;
      this.videoDuration = 0;
      this.videoWidth = 0;
      this.videoHeight = 0;
      this.gifWidth = 480;
      this.gifStartTime = 0;
      this.gifEndTime = 0;
      this.gifFps = 8;
      this.gifSpeed = 1;
      this.gifQuality = 10;
      this.gifRepeat = 0;
      this.resultGifBlob = null;
      this.resultGifWidth = 0;
      this.resultGifHeight = 0;
      this.videoGifProgress = 0;

      if (resetMessage) {
        this.videoGifMessage = '支持本地视频转 GIF，可设置区间、每秒帧数和播放速度。';
      }

      if (this.$refs.videoFileInput) {
        this.$refs.videoFileInput.value = '';
      }
    },
  },
};
</script>
