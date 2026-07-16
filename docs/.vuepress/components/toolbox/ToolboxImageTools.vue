<template>
  <section
    v-if="isVisible('image')"
    id="tool-image"
    ref="image"
    class="tool-card tool-section"
  >
    <div class="tool-card__header">
      <h2>图片处理</h2>
      <div class="tool-card__actions">
        <button type="button" @click="processImage">处理</button>
        <button type="button" class="ghost" @click="clearImageTool">清空</button>
      </div>
    </div>

    <div class="image-toolbar">
      <label class="image-toolbar__field">
        <span>上传图片</span>
        <input
          ref="imageFileInput"
          class="tool-input tool-input--file"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
          @change="handleImageFileChange"
        >
      </label>
      <label class="image-toolbar__field">
        <span>输出格式</span>
        <select v-model="imageOutputFormat">
          <option value="keep">保持原格式</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="webp">WEBP</option>
        </select>
      </label>
      <label class="image-toolbar__field">
        <span>压缩质量（%）</span>
        <input
          v-model.number="imageQualityPercent"
          class="tool-input"
          type="number"
          min="1"
          max="100"
        >
      </label>
    </div>

    <div class="image-file-tip">
      {{ imageFileName || '未选择图片。支持 png、jpg、jpeg、webp、bmp。' }}
    </div>

    <div class="image-config-grid">
      <div class="image-config-card">
        <div class="image-config-card__title">尺寸裁剪</div>
        <div class="image-config-fields">
          <label class="image-config-field">
            <span>目标宽度</span>
            <input
              v-model.number="cropWidth"
              class="tool-input"
              type="number"
              min="1"
              placeholder="例如 800"
            >
          </label>
          <label class="image-config-field">
            <span>目标高度</span>
            <input
              v-model.number="cropHeight"
              class="tool-input"
              type="number"
              min="1"
              placeholder="例如 600"
            >
          </label>
        </div>
        <div class="image-config-tip">
          留空则保持原始尺寸；同时填写宽高时按居中裁剪输出。
        </div>
      </div>

      <div class="image-config-card">
        <div class="image-config-card__title">添加文字</div>
        <div class="image-config-fields">
          <label class="image-config-field image-config-field--full">
            <span>文字内容</span>
            <textarea
              v-model="overlayText"
              rows="4"
              placeholder="输入要叠加到图片上的文字，支持换行"
            />
          </label>
          <label class="image-config-field">
            <span>字号</span>
            <input
              v-model.number="overlayFontSize"
              class="tool-input"
              type="number"
              min="8"
              max="256"
            >
          </label>
          <label class="image-config-field">
            <span>文字颜色</span>
            <input
              v-model="overlayColor"
              class="image-color-input"
              type="color"
            >
          </label>
          <label class="image-config-field">
            <span>X 坐标</span>
            <input
              v-model.number="overlayX"
              class="tool-input"
              type="number"
              min="0"
            >
          </label>
          <label class="image-config-field">
            <span>Y 坐标</span>
            <input
              v-model.number="overlayY"
              class="tool-input"
              type="number"
              min="0"
            >
          </label>
        </div>
        <div class="image-config-tip">
          可在预览图上单击选择文字位置，双击可放大查看。当前坐标：{{ overlayPositionText }}
        </div>
      </div>
    </div>

    <div class="image-preview-grid">
      <div class="image-preview-card">
        <div class="image-preview-card__title">编辑预览</div>
        <div class="image-preview" :class="{ empty: !sourceImageDataUrl }">
          <div
            v-if="sourceImageDataUrl"
            class="image-preview__stage"
          >
            <img
              :src="editorPreviewDataUrl || sourceImageDataUrl"
              alt="编辑预览"
              @click="selectOverlayPosition($event)"
              @dblclick="openImageLightbox(editorPreviewDataUrl || sourceImageDataUrl, '编辑预览')"
            >
            <svg
              v-if="overlayPreviewLines.length && editorPreviewWidth && editorPreviewHeight"
              class="image-preview__overlay"
              :viewBox="`0 0 ${editorPreviewWidth} ${editorPreviewHeight}`"
              aria-hidden="true"
            >
              <text
                class="image-preview__overlay-text"
                :x="overlayX"
                :y="overlayY + overlayFontSize"
                :fill="overlayColor"
                :font-size="overlayFontSize"
              >
                <tspan
                  v-for="(line, index) in overlayPreviewLines"
                  :key="`source-line-${index}`"
                  :x="overlayX"
                  :dy="index === 0 ? 0 : overlayLineHeight"
                >
                  {{ line }}
                </tspan>
              </text>
            </svg>
            <span
              class="image-preview__marker"
              :style="sourceMarkerStyle"
              :title="`文字位置 ${overlayPositionText}`"
            ></span>
          </div>
          <span v-else>原图预览区</span>
        </div>
        <div class="image-meta">
          <div class="image-meta__item">
            <span>尺寸</span>
            <strong>{{ originalImageSummary }}</strong>
          </div>
          <div class="image-meta__item">
            <span>大小</span>
            <strong>{{ originalFileSizeText }}</strong>
          </div>
        </div>
      </div>

      <div class="image-preview-card">
        <div class="image-preview-card__title">处理结果</div>
        <div class="image-preview" :class="{ empty: !resultImageDataUrl }">
          <div
            v-if="resultImageDataUrl"
            class="image-preview__stage"
          >
            <img
              :src="resultImageDataUrl"
              alt="处理结果预览"
              @dblclick="openImageLightbox(resultImageDataUrl, '处理结果预览')"
            >
          </div>
          <span v-else>处理后预览区</span>
        </div>
        <div class="image-meta">
          <div class="image-meta__item">
            <span>尺寸</span>
            <strong>{{ resultImageSummary }}</strong>
          </div>
          <div class="image-meta__item">
            <span>大小</span>
            <strong>{{ resultFileSizeText }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="tool-card__footer">
      <span>{{ imageMessage }}</span>
      <button type="button" class="ghost" :disabled="!resultImageDataUrl" @click="downloadResultImage">下载结果</button>
    </div>

    <div class="tool-divider"></div>

    <div class="tool-subsection">
      <div class="tool-subsection__header">
        <h3 class="tool-subsection__title">图片拼接</h3>
        <div class="tool-card__actions">
          <button type="button" @click="generateStitchImage">生成拼接图</button>
          <button type="button" class="ghost" @click="clearStitchTool">清空拼接</button>
        </div>
      </div>

      <div class="image-stitch-toolbar">
        <label class="image-toolbar__field">
          <span>上传多张图片</span>
          <input
            ref="stitchFileInput"
            class="tool-input tool-input--file"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
            multiple
            @change="handleStitchFilesChange"
          >
        </label>
        <label class="image-toolbar__field">
          <span>拼接模式</span>
          <select v-model="stitchMode">
            <option value="long">长图</option>
            <option value="grid9">9 宫格</option>
          </select>
        </label>
        <label class="image-toolbar__field">
          <span>输出格式</span>
          <select v-model="stitchOutputFormat">
            <option value="keep">保持原格式</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WEBP</option>
          </select>
        </label>
        <label class="image-toolbar__field">
          <span>压缩质量（%）</span>
          <input
            v-model.number="stitchQualityPercent"
            data-label="拼接压缩质量"
            class="tool-input"
            type="number"
            min="1"
            max="100"
          >
        </label>
      </div>

      <div class="image-file-tip">
        {{ stitchFileSummaryText }}
      </div>

      <div class="image-config-grid">
        <div class="image-config-card">
          <div class="image-config-card__title">布局参数</div>
          <div class="image-config-fields">
            <template v-if="stitchMode === 'long'">
              <label class="image-config-field">
                <span>拼接方向</span>
                <select v-model="stitchLongDirection">
                  <option value="vertical">纵向</option>
                  <option value="horizontal">横向</option>
                </select>
              </label>
              <label class="image-config-field">
                <span>长图宽度</span>
                <input
                  v-model.number="stitchLongWidth"
                  data-label="长图宽度"
                  class="tool-input"
                  type="number"
                  min="120"
                  max="4000"
                >
              </label>
              <label class="image-config-field">
                <span>单张高度</span>
                <input
                  v-model.number="stitchLongHeight"
                  data-label="单张高度"
                  class="tool-input"
                  type="number"
                  min="120"
                  max="4000"
                >
              </label>
            </template>
            <template v-else>
              <label class="image-config-field">
                <span>单格尺寸</span>
                <input
                  v-model.number="stitchGridCellSize"
                  data-label="单格尺寸"
                  class="tool-input"
                  type="number"
                  min="120"
                  max="2400"
                >
              </label>
              <label class="image-config-field">
                <span>九宫格间隙</span>
                <input
                  v-model.number="stitchGap"
                  data-label="九宫格间隙"
                  class="tool-input"
                  type="number"
                  min="0"
                  max="200"
                >
              </label>
            </template>
            <label v-if="stitchMode === 'long'" class="image-config-field">
              <span>图片间隙</span>
              <input
                v-model.number="stitchGap"
                data-label="图片间隙"
                class="tool-input"
                type="number"
                min="0"
                max="200"
              >
            </label>
          </div>
          <div class="image-config-tip">
            {{ stitchLayoutTip }}
          </div>
        </div>

        <div class="image-config-card">
          <div class="image-config-card__title">拖拽说明</div>
          <div class="image-stitch-tips">
            <div class="image-stitch-tip">
              在下方拼接预览中按住单张图片拖动，可微调上下左右位置。
            </div>
            <div class="image-stitch-tip">
              长图模式会按顺序纵向拼接；9 宫格模式最多使用前 9 张，空位会保留。
            </div>
            <div class="image-stitch-tip">
              当前输出：{{ stitchCompositionSummary }}
            </div>
          </div>
        </div>
      </div>

      <div class="image-preview-grid">
        <div class="image-preview-card">
          <div class="image-preview-card__title">拼接预览</div>
          <div class="image-preview image-preview--stitch" :class="{ empty: !stitchPreviewCells.length }">
            <div v-if="stitchPreviewCells.length" class="image-stitch-preview">
              <div class="image-stitch-preview__viewport">
                <div class="image-stitch-preview__stage" :style="stitchPreviewStageStyle">
                  <div
                    v-for="cell in stitchPreviewCells"
                    :key="`stitch-cell-${cell.index}`"
                    class="image-stitch-cell"
                    :class="{ 'is-empty': !cell.item, 'is-active': stitchDraggingId === (cell.item && cell.item.id) }"
                    :style="getStitchCellStyle(cell)"
                    @mousedown="beginStitchDrag(cell, $event)"
                  >
                    <img
                      v-if="cell.item"
                      :src="cell.item.dataUrl"
                      :alt="cell.item.name"
                      :style="getStitchCellImageStyle(cell)"
                      draggable="false"
                    >
                    <span v-else>{{ stitchMode === 'grid9' ? '空白格' : '未添加图片' }}</span>
                    <div v-if="cell.item" class="image-stitch-cell__label">
                      {{ cell.index + 1 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <span v-else>拼接预览区</span>
          </div>
          <div class="image-meta">
            <div class="image-meta__item">
              <span>已选图片</span>
              <strong>{{ stitchSelectedCountText }}</strong>
            </div>
            <div class="image-meta__item">
              <span>输出尺寸</span>
              <strong>{{ stitchCompositionSummary }}</strong>
            </div>
          </div>
        </div>

        <div class="image-preview-card">
          <div class="image-preview-card__title">拼接结果</div>
          <div class="image-preview" :class="{ empty: !stitchResultDataUrl }">
            <div
              v-if="stitchResultDataUrl"
              class="image-preview__stage"
            >
              <img
                :src="stitchResultDataUrl"
                alt="拼接结果预览"
                @dblclick="openImageLightbox(stitchResultDataUrl, '拼接结果预览')"
              >
            </div>
            <span v-else>拼接结果预览区</span>
          </div>
          <div class="image-meta">
            <div class="image-meta__item">
              <span>尺寸</span>
              <strong>{{ stitchResultSummary }}</strong>
            </div>
            <div class="image-meta__item">
              <span>大小</span>
              <strong>{{ stitchResultFileSizeText }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="tool-card__footer">
        <span>{{ stitchMessage }}</span>
        <button type="button" class="ghost" :disabled="!stitchResultDataUrl" @click="downloadStitchImage">下载拼接图</button>
      </div>
    </div>

    <div
      v-if="lightboxImageUrl"
      class="image-lightbox"
      @click.self="closeImageLightbox"
    >
      <button
        type="button"
        class="image-lightbox__close"
        @click="closeImageLightbox"
      >
        关闭
      </button>
      <div class="image-lightbox__content">
        <img
          :src="lightboxImageUrl"
          :alt="lightboxImageAlt"
        >
      </div>
    </div>
  </section>
</template>

<script>
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('图片读取失败。'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败。'));
    image.src = dataUrl;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片导出失败。'));
        return;
      }

      resolve(blob);
    }, mimeType, quality);
  });
}

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

function normalizePositiveInteger(value) {
  if (value === '' || value === null || typeof value === 'undefined') {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1) {
    throw new Error('尺寸必须是大于 0 的整数。');
  }

  return numericValue;
}

function normalizeNonNegativeInteger(value) {
  if (value === '' || value === null || typeof value === 'undefined') {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw new Error('文字坐标必须是大于等于 0 的整数。');
  }

  return numericValue;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPositiveIntegerOrZero(value) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : 0;
}

function getPositiveIntegerOrFallback(value, fallback) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function getNonNegativeIntegerOrFallback(value, fallback) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue >= 0 ? numericValue : fallback;
}

function resolveOutputMimeType(format, originalType) {
  if (format === 'jpeg') {
    return 'image/jpeg';
  }
  if (format === 'png') {
    return 'image/png';
  }
  if (format === 'webp') {
    return 'image/webp';
  }

  return originalType || 'image/png';
}

function getImageExtension(mimeType) {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }
  if (mimeType === 'image/webp') {
    return 'webp';
  }
  if (mimeType === 'image/bmp') {
    return 'bmp';
  }

  return 'png';
}

function stripFileExtension(fileName) {
  return fileName.replace(/\.[^.]+$/, '') || 'image';
}

function drawProcessedImage(context, image, width, height) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawOverlayText(context, text, fontSize, color, x, y) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return;
  }

  const lineHeight = Math.round(fontSize * 1.4);
  context.font = `${fontSize}px sans-serif`;
  context.fillStyle = color;
  context.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  context.lineWidth = Math.max(2, Math.round(fontSize * 0.08));
  context.textBaseline = 'top';

  lines.forEach((line, index) => {
    const lineY = y + index * lineHeight;
    context.strokeText(line, x, lineY);
    context.fillText(line, x, lineY);
  });
}

let stitchItemSeed = 0;

function createStitchItemId() {
  stitchItemSeed += 1;
  return `stitch-${stitchItemSeed}`;
}

function getCoverPlacement(imageWidth, imageHeight, frameWidth, frameHeight, offsetX = 0, offsetY = 0) {
  const safeImageWidth = Math.max(1, imageWidth);
  const safeImageHeight = Math.max(1, imageHeight);
  const safeFrameWidth = Math.max(1, frameWidth);
  const safeFrameHeight = Math.max(1, frameHeight);
  const scale = Math.max(safeFrameWidth / safeImageWidth, safeFrameHeight / safeImageHeight);
  const drawWidth = safeImageWidth * scale;
  const drawHeight = safeImageHeight * scale;
  const baseX = (safeFrameWidth - drawWidth) / 2;
  const baseY = (safeFrameHeight - drawHeight) / 2;
  const limitX = Math.max(0, (drawWidth - safeFrameWidth) / 2);
  const limitY = Math.max(0, (drawHeight - safeFrameHeight) / 2);
  const clampedOffsetX = clamp(Number(offsetX) || 0, -limitX, limitX);
  const clampedOffsetY = clamp(Number(offsetY) || 0, -limitY, limitY);

  return {
    x: baseX + clampedOffsetX,
    y: baseY + clampedOffsetY,
    drawWidth,
    drawHeight,
    offsetX: clampedOffsetX,
    offsetY: clampedOffsetY,
    limitX,
    limitY,
  };
}

export default {
  name: 'ToolboxImageTools',
  props: {
    visibleToolIds: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      imageFile: null,
      imageFileName: '',
      imageMimeType: '',
      sourceImageDataUrl: '',
      sourceImageElement: null,
      originalWidth: 0,
      originalHeight: 0,
      originalFileSize: 0,
      imageOutputFormat: 'keep',
      imageQualityPercent: 80,
      cropWidth: '',
      cropHeight: '',
      overlayText: '',
      overlayFontSize: 32,
      overlayColor: '#ffffff',
      overlayX: 24,
      overlayY: 24,
      resultImageDataUrl: '',
      resultImageBlob: null,
      resultWidth: 0,
      resultHeight: 0,
      resultFileSize: 0,
      resultMimeType: '',
      lightboxImageUrl: '',
      lightboxImageAlt: '',
      editorPreviewDataUrl: '',
      editorPreviewWidth: 0,
      editorPreviewHeight: 0,
      imageMessage: '支持压缩质量、居中裁剪和文字叠加，处理在浏览器本地完成。',
      stitchItems: [],
      stitchMode: 'long',
      stitchOutputFormat: 'keep',
      stitchQualityPercent: 92,
      stitchLongDirection: 'vertical',
      stitchLongWidth: 720,
      stitchLongHeight: 360,
      stitchGridCellSize: 360,
      stitchGap: 12,
      stitchResultDataUrl: '',
      stitchResultBlob: null,
      stitchResultWidth: 0,
      stitchResultHeight: 0,
      stitchResultFileSize: 0,
      stitchResultMimeType: '',
      stitchMessage: '支持长图和 9 宫格拼接，可在预览中拖拽微调每张图片的位置。',
      stitchDraggingId: '',
      stitchDragState: null,
    };
  },
  computed: {
    currentTargetWidth() {
      return getPositiveIntegerOrZero(this.cropWidth) || this.originalWidth || 0;
    },
    currentTargetHeight() {
      return getPositiveIntegerOrZero(this.cropHeight) || this.originalHeight || 0;
    },
    overlayPreviewLines() {
      return String(this.overlayText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    },
    overlayLineHeight() {
      return Math.round(this.overlayFontSize * 1.4);
    },
    overlayPositionText() {
      return `${this.overlayX}, ${this.overlayY}`;
    },
    originalImageSummary() {
      if (!this.originalWidth || !this.originalHeight) {
        return '未加载';
      }

      return `${this.originalWidth} × ${this.originalHeight}`;
    },
    resultImageSummary() {
      if (!this.resultWidth || !this.resultHeight) {
        return '未生成';
      }

      return `${this.resultWidth} × ${this.resultHeight}`;
    },
    originalFileSizeText() {
      return this.originalFileSize ? formatFileSize(this.originalFileSize) : '未加载';
    },
    resultFileSizeText() {
      return this.resultFileSize ? formatFileSize(this.resultFileSize) : '未生成';
    },
    sourceMarkerStyle() {
      if (!this.editorPreviewDataUrl || !this.editorPreviewWidth || !this.editorPreviewHeight) {
        return { display: 'none' };
      }

      return {
        left: `${(this.overlayX / this.editorPreviewWidth) * 100}%`,
        top: `${(this.overlayY / this.editorPreviewHeight) * 100}%`,
      };
    },
    stitchVisibleItems() {
      return this.stitchMode === 'grid9' ? this.stitchItems.slice(0, 9) : this.stitchItems;
    },
    stitchSlotWidth() {
      return this.stitchMode === 'grid9'
        ? getPositiveIntegerOrFallback(this.stitchGridCellSize, 360)
        : getPositiveIntegerOrFallback(this.stitchLongWidth, 720);
    },
    stitchSlotHeight() {
      return this.stitchMode === 'grid9'
        ? getPositiveIntegerOrFallback(this.stitchGridCellSize, 360)
        : getPositiveIntegerOrFallback(this.stitchLongHeight, 360);
    },
    stitchGapValue() {
      return getNonNegativeIntegerOrFallback(this.stitchGap, 0);
    },
    stitchColumns() {
      if (this.stitchMode === 'grid9') {
        return 3;
      }

      return this.stitchLongDirection === 'horizontal' ? this.stitchVisibleItems.length : 1;
    },
    stitchRows() {
      if (this.stitchMode === 'grid9') {
        return 3;
      }

      return this.stitchLongDirection === 'horizontal' ? 1 : this.stitchVisibleItems.length;
    },
    stitchCanvasWidth() {
      if (!this.stitchSlotWidth || !this.stitchColumns) {
        return 0;
      }

      return this.stitchSlotWidth * this.stitchColumns + this.stitchGapValue * Math.max(0, this.stitchColumns - 1);
    },
    stitchCanvasHeight() {
      if (!this.stitchSlotHeight || !this.stitchRows) {
        return 0;
      }

      return this.stitchSlotHeight * this.stitchRows + this.stitchGapValue * Math.max(0, this.stitchRows - 1);
    },
    stitchPreviewScale() {
      if (!this.stitchCanvasWidth) {
        return 1;
      }

      return Math.min(1, 420 / this.stitchCanvasWidth);
    },
    stitchPreviewCells() {
      const cellCount = this.stitchMode === 'grid9' ? 9 : this.stitchVisibleItems.length;

      return Array.from({ length: cellCount }, (_, index) => {
        let column = 0;
        let row = 0;

        if (this.stitchMode === 'grid9') {
          column = index % 3;
          row = Math.floor(index / 3);
        } else if (this.stitchLongDirection === 'horizontal') {
          column = index;
        } else {
          row = index;
        }

        return {
          index,
          item: this.stitchVisibleItems[index] || null,
          left: column * (this.stitchSlotWidth + this.stitchGapValue),
          top: row * (this.stitchSlotHeight + this.stitchGapValue),
          width: this.stitchSlotWidth,
          height: this.stitchSlotHeight,
        };
      });
    },
    stitchPreviewStageStyle() {
      return {
        width: `${Math.round(this.stitchCanvasWidth * this.stitchPreviewScale)}px`,
        height: `${Math.round(this.stitchCanvasHeight * this.stitchPreviewScale)}px`,
      };
    },
    stitchFileSummaryText() {
      if (!this.stitchItems.length) {
        return '未选择拼接图片。支持一次上传多张图片，并在预览中拖拽调整每张图的位置。';
      }

      const totalSize = this.stitchItems.reduce((sum, item) => sum + (item.fileSize || 0), 0);
      const limitText = this.stitchMode === 'grid9' && this.stitchItems.length > 9 ? '，当前仅使用前 9 张' : '';
      return `已选择 ${this.stitchItems.length} 张图片，总大小 ${formatFileSize(totalSize)}${limitText}。`;
    },
    stitchSelectedCountText() {
      if (!this.stitchItems.length) {
        return '0 张';
      }

      if (this.stitchMode === 'grid9' && this.stitchItems.length > 9) {
        return `${this.stitchVisibleItems.length} / ${this.stitchItems.length} 张`;
      }

      return `${this.stitchVisibleItems.length} 张`;
    },
    stitchCompositionSummary() {
      if (!this.stitchCanvasWidth || !this.stitchCanvasHeight) {
        return '未配置';
      }

      return `${this.stitchCanvasWidth} × ${this.stitchCanvasHeight}`;
    },
    stitchLayoutTip() {
      return this.stitchMode === 'grid9'
        ? '9 宫格固定为 3 × 3，可设置单格尺寸和格子间隙，超出的图片只取前 9 张。'
        : this.stitchLongDirection === 'horizontal'
          ? '长图会按上传顺序从左到右拼接，可统一设置单张宽高和每张之间的间隙。'
          : '长图会按上传顺序从上到下拼接，可统一设置单张宽高和每张之间的间隙。';
    },
    stitchResultSummary() {
      if (!this.stitchResultWidth || !this.stitchResultHeight) {
        return '未生成';
      }

      return `${this.stitchResultWidth} × ${this.stitchResultHeight}`;
    },
    stitchResultFileSizeText() {
      return this.stitchResultFileSize ? formatFileSize(this.stitchResultFileSize) : '未生成';
    },
  },
  watch: {
    cropWidth() {
      this.refreshEditorPreview();
    },
    cropHeight() {
      this.refreshEditorPreview();
    },
  },
  beforeDestroy() {
    this.stopStitchDrag(true);
    this.closeImageLightbox();
  },
  methods: {
    isVisible(id) {
      return this.visibleToolIds.indexOf(id) !== -1;
    },
    getSectionElement(id) {
      return id === 'image' ? this.$refs.image || null : null;
    },
    async handleImageFileChange(event) {
      const file = event && event.target && event.target.files ? event.target.files[0] : null;

      if (!file) {
        this.imageFile = null;
        this.imageFileName = '';
        this.sourceImageDataUrl = '';
        this.sourceImageElement = null;
        this.originalWidth = 0;
        this.originalHeight = 0;
        this.originalFileSize = 0;
        this.clearResultOnly();
        this.imageMessage = '未选择图片。';
        return;
      }

      if (!file.type || file.type.indexOf('image/') !== 0) {
        this.clearImageTool();
        this.imageMessage = '请选择标准图片文件。';
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const imageElement = await loadImageFromDataUrl(dataUrl);

        this.imageFile = file;
        this.imageFileName = file.name;
        this.imageMimeType = file.type;
        this.sourceImageDataUrl = dataUrl;
        this.sourceImageElement = imageElement;
        this.originalWidth = imageElement.naturalWidth || imageElement.width;
        this.originalHeight = imageElement.naturalHeight || imageElement.height;
        this.originalFileSize = file.size;
        this.refreshEditorPreview();
        this.clearResultOnly();
        this.imageMessage = '图片已加载，调整参数后点击处理。';
      } catch (error) {
        this.clearImageTool();
        this.imageMessage = error.message || '图片加载失败。';
      }
    },
    async processImage() {
      if (!this.sourceImageElement) {
        this.imageMessage = '请先上传图片。';
        return;
      }

      try {
        const qualityPercent = Number(this.imageQualityPercent);
        if (!Number.isInteger(qualityPercent) || qualityPercent < 1 || qualityPercent > 100) {
          throw new Error('压缩质量必须是 1 到 100 之间的整数。');
        }

        const cropWidth = normalizePositiveInteger(this.cropWidth);
        const cropHeight = normalizePositiveInteger(this.cropHeight);
        if ((cropWidth && !cropHeight) || (!cropWidth && cropHeight)) {
          throw new Error('裁剪宽度和高度需要同时填写。');
        }

        const overlayFontSize = normalizePositiveInteger(this.overlayFontSize);
        const overlayX = normalizeNonNegativeInteger(this.overlayX);
        const overlayY = normalizeNonNegativeInteger(this.overlayY);
        const targetWidth = cropWidth || this.originalWidth;
        const targetHeight = cropHeight || this.originalHeight;
        const mimeType = resolveOutputMimeType(this.imageOutputFormat, this.imageMimeType);
        const quality = qualityPercent / 100;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('当前环境不支持图片处理。');
        }

        context.clearRect(0, 0, targetWidth, targetHeight);
        drawProcessedImage(context, this.sourceImageElement, targetWidth, targetHeight);

        if (this.overlayText.trim()) {
          drawOverlayText(
            context,
            this.overlayText,
            overlayFontSize,
            this.overlayColor,
            overlayX - 1,
            overlayY - 1,
          );
        }

        const blob = await canvasToBlob(canvas, mimeType, quality);
        this.resultImageDataUrl = canvas.toDataURL(mimeType, quality);
        this.resultImageBlob = blob;
        this.resultWidth = targetWidth;
        this.resultHeight = targetHeight;
        this.resultFileSize = blob.size;
        this.resultMimeType = blob.type || mimeType;
        this.imageMessage = '图片处理完成。';
      } catch (error) {
        this.clearResultOnly();
        this.imageMessage = error.message || '图片处理失败。';
      }
    },
    downloadResultImage() {
      if (!this.resultImageBlob) {
        this.imageMessage = '请先生成处理结果。';
        return;
      }

      const extension = getImageExtension(this.resultMimeType || 'image/png');
      const fileName = `${stripFileExtension(this.imageFileName || 'image')}-processed.${extension}`;
      const objectUrl = URL.createObjectURL(this.resultImageBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      this.imageMessage = '处理结果已开始下载。';
    },
    refreshEditorPreview() {
      if (!this.sourceImageElement || !this.currentTargetWidth || !this.currentTargetHeight) {
        this.editorPreviewDataUrl = '';
        this.editorPreviewWidth = 0;
        this.editorPreviewHeight = 0;
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = this.currentTargetWidth;
      canvas.height = this.currentTargetHeight;
      const context = canvas.getContext('2d');

      if (!context) {
        this.editorPreviewDataUrl = '';
        this.editorPreviewWidth = 0;
        this.editorPreviewHeight = 0;
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      drawProcessedImage(context, this.sourceImageElement, canvas.width, canvas.height);
      this.editorPreviewDataUrl = canvas.toDataURL('image/png');
      this.editorPreviewWidth = canvas.width;
      this.editorPreviewHeight = canvas.height;
    },
    selectOverlayPosition(event) {
      const target = event && event.currentTarget ? event.currentTarget : null;
      if (!target || typeof target.getBoundingClientRect !== 'function') {
        return;
      }

      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      const ratioX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const ratioY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      const width = this.editorPreviewWidth || this.currentTargetWidth;
      const height = this.editorPreviewHeight || this.currentTargetHeight;

      if (!width || !height) {
        return;
      }

      this.overlayX = Math.round(ratioX * width);
      this.overlayY = Math.round(ratioY * height);
      this.imageMessage = '已通过预览图更新文字位置。';
    },
    openImageLightbox(imageUrl, imageAlt) {
      if (!imageUrl) {
        return;
      }

      this.lightboxImageUrl = imageUrl;
      this.lightboxImageAlt = imageAlt || '图片预览';
    },
    closeImageLightbox() {
      this.lightboxImageUrl = '';
      this.lightboxImageAlt = '';
    },
    async handleStitchFilesChange(event) {
      const files = event && event.target && event.target.files ? Array.from(event.target.files) : [];

      if (!files.length) {
        this.clearStitchTool();
        return;
      }

      try {
        const stitchItems = await Promise.all(files.map(async (file) => {
          if (!file.type || file.type.indexOf('image/') !== 0) {
            throw new Error('拼接仅支持标准图片文件。');
          }

          const dataUrl = await readFileAsDataUrl(file);
          const imageElement = await loadImageFromDataUrl(dataUrl);

          return {
            id: createStitchItemId(),
            name: file.name,
            dataUrl,
            imageElement,
            mimeType: file.type,
            fileSize: file.size,
            width: imageElement.naturalWidth || imageElement.width,
            height: imageElement.naturalHeight || imageElement.height,
            offsetX: 0,
            offsetY: 0,
          };
        }));

        this.stopStitchDrag(true);
        this.stitchItems = stitchItems;
        this.clearStitchResultOnly();
        this.stitchMessage = '拼接图片已加载，可在预览中拖拽调整每张图的位置。';
      } catch (error) {
        this.clearStitchTool();
        this.stitchMessage = error.message || '拼接图片加载失败。';
      }
    },
    getStitchCellStyle(cell) {
      return {
        left: `${Math.round(cell.left * this.stitchPreviewScale)}px`,
        top: `${Math.round(cell.top * this.stitchPreviewScale)}px`,
        width: `${Math.round(cell.width * this.stitchPreviewScale)}px`,
        height: `${Math.round(cell.height * this.stitchPreviewScale)}px`,
      };
    },
    getStitchPlacementForCell(cell) {
      if (!cell || !cell.item) {
        return null;
      }

      return getCoverPlacement(
        cell.item.width,
        cell.item.height,
        cell.width,
        cell.height,
        cell.item.offsetX,
        cell.item.offsetY,
      );
    },
    getStitchCellImageStyle(cell) {
      const placement = this.getStitchPlacementForCell(cell);
      if (!placement) {
        return {};
      }

      return {
        left: `${Math.round(placement.x * this.stitchPreviewScale)}px`,
        top: `${Math.round(placement.y * this.stitchPreviewScale)}px`,
        width: `${Math.round(placement.drawWidth * this.stitchPreviewScale)}px`,
        height: `${Math.round(placement.drawHeight * this.stitchPreviewScale)}px`,
      };
    },
    beginStitchDrag(cell, event) {
      if (!cell || !cell.item || !event || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
        return;
      }

      event.preventDefault();
      this.stopStitchDrag(true);
      this.stitchDraggingId = cell.item.id;
      this.stitchDragState = {
        itemId: cell.item.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: cell.item.offsetX || 0,
        startOffsetY: cell.item.offsetY || 0,
        slotWidth: cell.width,
        slotHeight: cell.height,
      };
      window.addEventListener('mousemove', this.handleStitchDrag);
      window.addEventListener('mouseup', this.stopStitchDrag);
    },
    handleStitchDrag(event) {
      if (!this.stitchDragState || !event) {
        return;
      }

      const scale = this.stitchPreviewScale || 1;
      const deltaX = (event.clientX - this.stitchDragState.startClientX) / scale;
      const deltaY = (event.clientY - this.stitchDragState.startClientY) / scale;

      this.updateStitchItemOffset(
        this.stitchDragState.itemId,
        this.stitchDragState.startOffsetX + deltaX,
        this.stitchDragState.startOffsetY + deltaY,
      );
    },
    stopStitchDrag(silent = false) {
      window.removeEventListener('mousemove', this.handleStitchDrag);
      window.removeEventListener('mouseup', this.stopStitchDrag);

      if (!silent && this.stitchDraggingId) {
        this.stitchMessage = '已更新拼接图片位置。';
      }

      this.stitchDraggingId = '';
      this.stitchDragState = null;
    },
    updateStitchItemOffset(itemId, nextOffsetX, nextOffsetY) {
      this.stitchItems = this.stitchItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const placement = getCoverPlacement(
          item.width,
          item.height,
          this.stitchSlotWidth,
          this.stitchSlotHeight,
          nextOffsetX,
          nextOffsetY,
        );

        return {
          ...item,
          offsetX: placement.offsetX,
          offsetY: placement.offsetY,
        };
      });
    },
    clearStitchResultOnly() {
      this.stitchResultDataUrl = '';
      this.stitchResultBlob = null;
      this.stitchResultWidth = 0;
      this.stitchResultHeight = 0;
      this.stitchResultFileSize = 0;
      this.stitchResultMimeType = '';
    },
    async generateStitchImage() {
      if (!this.stitchVisibleItems.length) {
        this.stitchMessage = '请先上传要拼接的图片。';
        return;
      }

      try {
        const qualityPercent = Number(this.stitchQualityPercent);
        if (!Number.isInteger(qualityPercent) || qualityPercent < 1 || qualityPercent > 100) {
          throw new Error('拼接压缩质量必须是 1 到 100 之间的整数。');
        }

        if (this.stitchMode === 'long') {
          normalizePositiveInteger(this.stitchLongWidth);
          normalizePositiveInteger(this.stitchLongHeight);
        } else {
          normalizePositiveInteger(this.stitchGridCellSize);
        }

        const gap = getNonNegativeIntegerOrFallback(this.stitchGap, 0);
        const mimeType = resolveOutputMimeType(this.stitchOutputFormat, this.stitchVisibleItems[0].mimeType);
        const quality = qualityPercent / 100;
        const canvas = document.createElement('canvas');
        canvas.width = this.stitchCanvasWidth;
        canvas.height = this.stitchCanvasHeight;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('当前环境不支持图片拼接。');
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        if (mimeType === 'image/jpeg') {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }

        this.stitchPreviewCells.forEach((cell) => {
          if (!cell.item) {
            return;
          }

          const placement = getCoverPlacement(
            cell.item.width,
            cell.item.height,
            cell.width,
            cell.height,
            cell.item.offsetX,
            cell.item.offsetY,
          );

          context.save();
          context.beginPath();
          context.rect(cell.left, cell.top, cell.width, cell.height);
          context.clip();
          context.drawImage(
            cell.item.imageElement,
            cell.left + placement.x,
            cell.top + placement.y,
            placement.drawWidth,
            placement.drawHeight,
          );
          context.restore();
        });

        const blob = await canvasToBlob(canvas, mimeType, quality);
        this.stitchResultDataUrl = canvas.toDataURL(mimeType, quality);
        this.stitchResultBlob = blob;
        this.stitchResultWidth = canvas.width;
        this.stitchResultHeight = canvas.height;
        this.stitchResultFileSize = blob.size;
        this.stitchResultMimeType = blob.type || mimeType;
        this.stitchMessage = `拼接完成，共使用 ${this.stitchVisibleItems.length} 张图片，间隙 ${gap}px。`;
      } catch (error) {
        this.clearStitchResultOnly();
        this.stitchMessage = error.message || '图片拼接失败。';
      }
    },
    downloadStitchImage() {
      if (!this.stitchResultBlob) {
        this.stitchMessage = '请先生成拼接结果。';
        return;
      }

      const extension = getImageExtension(this.stitchResultMimeType || 'image/png');
      const directionSuffix = this.stitchMode === 'long'
        ? `-${this.stitchLongDirection === 'horizontal' ? 'horizontal' : 'vertical'}`
        : '';
      const fileName = `image-stitch-${this.stitchMode}${directionSuffix}.${extension}`;
      const objectUrl = URL.createObjectURL(this.stitchResultBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      this.stitchMessage = '拼接结果已开始下载。';
    },
    clearResultOnly() {
      this.resultImageDataUrl = '';
      this.resultImageBlob = null;
      this.resultWidth = 0;
      this.resultHeight = 0;
      this.resultFileSize = 0;
      this.resultMimeType = '';
    },
    clearStitchTool() {
      this.stopStitchDrag(true);
      this.stitchItems = [];
      this.stitchMode = 'long';
      this.stitchOutputFormat = 'keep';
      this.stitchQualityPercent = 92;
      this.stitchLongDirection = 'vertical';
      this.stitchLongWidth = 720;
      this.stitchLongHeight = 360;
      this.stitchGridCellSize = 360;
      this.stitchGap = 12;
      this.clearStitchResultOnly();
      this.stitchMessage = '支持长图和 9 宫格拼接，可在预览中拖拽微调每张图片的位置。';

      if (this.$refs.stitchFileInput) {
        this.$refs.stitchFileInput.value = '';
      }
    },
    clearImageTool() {
      this.imageFile = null;
      this.imageFileName = '';
      this.imageMimeType = '';
      this.sourceImageDataUrl = '';
      this.sourceImageElement = null;
      this.originalWidth = 0;
      this.originalHeight = 0;
      this.originalFileSize = 0;
      this.editorPreviewDataUrl = '';
      this.editorPreviewWidth = 0;
      this.editorPreviewHeight = 0;
      this.imageOutputFormat = 'keep';
      this.imageQualityPercent = 80;
      this.cropWidth = '';
      this.cropHeight = '';
      this.overlayText = '';
      this.overlayFontSize = 32;
      this.overlayColor = '#ffffff';
      this.overlayX = 24;
      this.overlayY = 24;
      this.closeImageLightbox();
      this.clearResultOnly();
      this.imageMessage = '支持压缩质量、居中裁剪和文字叠加，处理在浏览器本地完成。';

      if (this.$refs.imageFileInput) {
        this.$refs.imageFileInput.value = '';
      }
    },
  },
};
</script>
