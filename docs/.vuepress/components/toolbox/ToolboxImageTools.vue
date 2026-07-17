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

    <div
      ref="editorPasteZone"
      class="image-paste-zone"
      tabindex="0"
      @click="focusPasteZone('editor')"
      @paste.prevent="handlePasteImage('editor', $event)"
    >
      点击这里后按 Ctrl+V 粘贴图片到“图片处理”
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
      <span class="tool-message" :class="{ 'is-error': isErrorMessage(imageMessage) }">{{ imageMessage }}</span>
      <button type="button" class="ghost" :disabled="!resultImageDataUrl" @click="downloadResultImage">下载结果</button>
    </div>

    <div class="tool-divider"></div>

    <div class="tool-subsection">
      <div class="tool-subsection__header">
        <h3 class="tool-subsection__title">图片切割 9 宫格</h3>
        <div class="tool-card__actions">
          <button type="button" @click="generateSplitNineGrid">生成切图</button>
          <button
            type="button"
            class="ghost"
            :disabled="!splitTiles.length || splitZipGenerating"
            @click="downloadSplitZip"
          >
            {{ splitZipGenerating ? '打包中...' : '打包下载' }}
          </button>
          <button type="button" class="ghost" @click="resetSplitCropPosition">重置位置</button>
          <button type="button" class="ghost" @click="clearSplitTool">清空切图</button>
        </div>
      </div>

      <div class="image-split-toolbar">
        <label class="image-toolbar__field">
          <span>上传图片</span>
          <input
            ref="splitFileInput"
            class="tool-input tool-input--file"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
            @change="handleSplitImageFileChange"
          >
        </label>
        <label class="image-toolbar__field">
          <span>输出格式</span>
          <select v-model="splitOutputFormat">
            <option value="keep">保持原格式</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WEBP</option>
          </select>
        </label>
        <label class="image-toolbar__field">
          <span>压缩质量（%）</span>
          <input
            v-model.number="splitQualityPercent"
            class="tool-input"
            type="number"
            min="1"
            max="100"
          >
        </label>
        <label class="image-toolbar__field">
          <span>九宫格边长</span>
          <input
            v-model.number="splitCanvasSize"
            class="tool-input"
            type="number"
            min="180"
            max="6000"
          >
        </label>
        <label class="image-toolbar__field">
          <span>九宫格间隙</span>
          <input
            v-model.number="splitGap"
            class="tool-input"
            type="number"
            min="0"
            max="200"
          >
        </label>
      </div>

      <div
        ref="splitPasteZone"
        class="image-paste-zone"
        tabindex="0"
        @click="focusPasteZone('split')"
        @paste.prevent="handlePasteImage('split', $event)"
      >
        点击这里后按 Ctrl+V 粘贴图片到“9 宫格切图”
      </div>

      <div class="image-file-tip">
        {{ splitFileName || splitSourceTip }}
      </div>

      <div class="image-preview-grid">
        <div class="image-preview-card">
          <div class="image-preview-card__title">裁切预览</div>
          <div class="image-preview image-preview--stitch" :class="{ empty: !splitSourceDataUrl }">
            <div v-if="splitSourceDataUrl" class="image-split-preview">
              <div
                class="image-split-preview__stage"
                :style="splitPreviewStageStyle"
                @mousedown="beginSplitDrag"
              >
                <img
                  :src="splitSourceDataUrl"
                  alt="九宫格裁切预览"
                  :style="splitPreviewImageStyle"
                  draggable="false"
                >
                <div class="image-split-preview__grid" aria-hidden="true"></div>
              </div>
            </div>
            <span v-else>先上传图片，再拖动调整裁切区域</span>
          </div>
          <div class="image-meta">
            <div class="image-meta__item">
              <span>裁切区域</span>
              <strong>{{ splitCanvasSummary }}</strong>
            </div>
            <div class="image-meta__item">
              <span>当前位置</span>
              <strong>{{ splitOffsetText }}</strong>
            </div>
          </div>
        </div>

        <div class="image-preview-card">
          <div class="image-preview-card__title">切图结果</div>
          <div class="image-split-grid" :class="{ empty: !splitTiles.length }">
            <template v-if="splitTiles.length">
              <div
                v-for="tile in splitTiles"
                :key="tile.index"
                class="image-split-tile"
              >
                <img
                  :src="tile.dataUrl"
                  :alt="`九宫格切图 ${tile.index + 1}`"
                >
              </div>
            </template>
            <span v-else>生成后会显示 9 张切图</span>
          </div>
          <div class="image-meta">
            <div class="image-meta__item">
              <span>单张尺寸</span>
              <strong>{{ splitTileSummary }}</strong>
            </div>
            <div class="image-meta__item">
              <span>数量</span>
              <strong>{{ splitTiles.length ? `${splitTiles.length} 张` : '未生成' }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="tool-card__footer">
        <span class="tool-message" :class="{ 'is-error': isErrorMessage(splitMessage) }">{{ splitMessage }}</span>
      </div>
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

      <div
        ref="stitchPasteZone"
        class="image-paste-zone"
        tabindex="0"
        @click="focusPasteZone('stitch')"
        @paste.prevent="handlePasteImage('stitch', $event)"
      >
        点击这里后按 Ctrl+V 追加图片到“图片拼接”
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
              长图模式会按顺序拼接；9 宫格模式最多使用前 9 张，空位会保留。
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
        <span class="tool-message" :class="{ 'is-error': isErrorMessage(stitchMessage) }">{{ stitchMessage }}</span>
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

let jsZipConstructorPromise = null;

function ensureGlobalObject() {
  const runtimeGlobal = typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : null;

  if (runtimeGlobal && typeof runtimeGlobal.global === 'undefined') {
    runtimeGlobal.global = runtimeGlobal;
  }
}

function resolveJSZipConstructor(module) {
  const queue = [module];
  const visited = [];

  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.indexOf(current) !== -1) {
      continue;
    }

    visited.push(current);

    if (typeof current === 'function') {
      return current;
    }

    if (typeof current === 'object') {
      queue.push(current.default);
      queue.push(current['module.exports']);
      queue.push(current.JSZip);
    }
  }

  throw new Error('JSZip 加载失败。');
}

async function getJSZipConstructor() {
  if (!jsZipConstructorPromise) {
    ensureGlobalObject();
    jsZipConstructorPromise = import('jszip/dist/jszip.min.js')
      .then((module) => resolveJSZipConstructor(module))
      .catch((error) => {
        jsZipConstructorPromise = null;
        throw error;
      });
  }

  return jsZipConstructorPromise;
}

function createNamedImageFile(file, baseName, index = 0) {
  if (file && file.name) {
    return file;
  }

  const mimeType = (file && file.type) || 'image/png';
  const extension = getImageExtension(mimeType);
  const timestamp = Date.now();

  if (typeof File === 'function') {
    return new File([file], `${baseName}-${timestamp}-${index + 1}.${extension}`, { type: mimeType });
  }

  file.name = `${baseName}-${timestamp}-${index + 1}.${extension}`;
  return file;
}

function extractImageFilesFromClipboard(event, baseName) {
  const clipboardData = event && event.clipboardData ? event.clipboardData : null;
  if (!clipboardData) {
    return [];
  }

  const imageFiles = [];
  const items = clipboardData.items ? Array.from(clipboardData.items) : [];
  items.forEach((item, index) => {
    if (!item || item.kind !== 'file' || !item.type || item.type.indexOf('image/') !== 0) {
      return;
    }

    const file = item.getAsFile ? item.getAsFile() : null;
    if (file) {
      imageFiles.push(createNamedImageFile(file, baseName, index));
    }
  });

  if (imageFiles.length) {
    return imageFiles;
  }

  const files = clipboardData.files ? Array.from(clipboardData.files) : [];
  return files
    .filter((file) => file && file.type && file.type.indexOf('image/') === 0)
    .map((file, index) => createNamedImageFile(file, baseName, index));
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
      splitFile: null,
      splitFileName: '',
      splitSourceMimeType: '',
      splitSourceDataUrl: '',
      splitSourceImageElement: null,
      splitSourceWidth: 0,
      splitSourceHeight: 0,
      splitSourceFileSize: 0,
      splitOutputFormat: 'keep',
      splitQualityPercent: 92,
      splitCanvasSize: 1080,
      splitGap: 0,
      splitOffsetX: 0,
      splitOffsetY: 0,
      splitCompositeDataUrl: '',
      splitCompositeBlob: null,
      splitCompositeMimeType: '',
      splitTiles: [],
      splitMessage: '支持将当前图片裁切成 9 宫格，可拖拽调整裁切位置。',
      splitZipGenerating: false,
      splitDragging: false,
      splitDragState: null,
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
    splitSourceTip() {
      if (!this.splitSourceImageElement) {
        return '九宫格切图使用这里单独上传的图片，不会和上方图片处理混在一起。';
      }

      return `当前使用 ${this.splitSourceWidth} × ${this.splitSourceHeight} 的图片做九宫格切图。`;
    },
    splitPlacement() {
      if (!this.splitSourceImageElement || !this.splitCanvasSize) {
        return null;
      }

      return getCoverPlacement(
        this.splitSourceWidth,
        this.splitSourceHeight,
        this.splitCanvasSize,
        this.splitCanvasSize,
        this.splitOffsetX,
        this.splitOffsetY,
      );
    },
    splitPreviewScale() {
      if (!this.splitCanvasSize) {
        return 1;
      }

      return Math.min(1, 360 / this.splitCanvasSize);
    },
    splitPreviewStageStyle() {
      const size = Math.round(this.splitCanvasSize * this.splitPreviewScale);
      return {
        width: `${size}px`,
        height: `${size}px`,
      };
    },
    splitPreviewImageStyle() {
      if (!this.splitPlacement) {
        return {};
      }

      return {
        left: `${Math.round(this.splitPlacement.x * this.splitPreviewScale)}px`,
        top: `${Math.round(this.splitPlacement.y * this.splitPreviewScale)}px`,
        width: `${Math.round(this.splitPlacement.drawWidth * this.splitPreviewScale)}px`,
        height: `${Math.round(this.splitPlacement.drawHeight * this.splitPreviewScale)}px`,
      };
    },
    splitCanvasSummary() {
      return this.splitCanvasSize ? `${this.splitCanvasSize} × ${this.splitCanvasSize}` : '未配置';
    },
    splitOffsetText() {
      return `${Math.round(this.splitOffsetX)}, ${Math.round(this.splitOffsetY)}`;
    },
    splitTileSize() {
      return this.splitCanvasSize ? Math.floor(this.splitCanvasSize / 3) : 0;
    },
    splitTileSummary() {
      return this.splitTiles.length ? `${this.splitTileSize} × ${this.splitTileSize}` : '未生成';
    },
    splitGapText() {
      return `${getNonNegativeIntegerOrFallback(this.splitGap, 0)}px`;
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
    this.stopSplitDrag(true);
    this.stopStitchDrag(true);
    this.closeImageLightbox();
  },
  methods: {
    isVisible(id) {
      return this.visibleToolIds.indexOf(id) !== -1;
    },
    isErrorMessage(message) {
      return /(失败|错误|请先|没有|不支持|必须|不能|请选择)/.test(String(message || ''));
    },
    getSectionElement(id) {
      return id === 'image' ? this.$refs.image || null : null;
    },
    focusPasteZone(target) {
      const refMap = {
        editor: 'editorPasteZone',
        split: 'splitPasteZone',
        stitch: 'stitchPasteZone',
      };
      const element = this.$refs[refMap[target]];
      if (element && typeof element.focus === 'function') {
        element.focus();
      }
    },
    async handlePasteImage(target, event) {
      const baseNameMap = {
        editor: 'pasted-image',
        split: 'pasted-split',
        stitch: 'pasted-stitch',
      };
      const imageFiles = extractImageFilesFromClipboard(event, baseNameMap[target] || 'pasted-image');

      if (!imageFiles.length) {
        if (target === 'editor') {
          this.imageMessage = '剪贴板中没有可用图片。';
        } else if (target === 'split') {
          this.splitMessage = '剪贴板中没有可用图片。';
        } else if (target === 'stitch') {
          this.stitchMessage = '剪贴板中没有可用图片。';
        }
        return;
      }

      if (target === 'editor') {
        await this.loadEditorImageFile(imageFiles[0]);
        this.imageMessage = '已通过 Ctrl+V 粘贴图片。';
        return;
      }

      if (target === 'split') {
        await this.loadSplitImageFile(imageFiles[0]);
        this.splitMessage = '已通过 Ctrl+V 粘贴切图图片。';
        return;
      }

      if (target === 'stitch') {
        await this.appendStitchFiles(imageFiles);
        this.stitchMessage = `已通过 Ctrl+V 粘贴 ${imageFiles.length} 张图片。`;
      }
    },
    async loadEditorImageFile(file) {
      if (!file) {
        this.clearImageTool();
        this.imageMessage = '未选择图片。';
        return;
      }

      if (!file.type || file.type.indexOf('image/') !== 0) {
        this.clearImageTool();
        this.imageMessage = '请选择标准图片文件。';
        return;
      }

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

      try {
        await this.loadEditorImageFile(file);
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
    clearSplitResultOnly() {
      this.splitCompositeDataUrl = '';
      this.splitCompositeBlob = null;
      this.splitCompositeMimeType = '';
      this.splitTiles = [];
      this.splitZipGenerating = false;
    },
    resetSplitCropPosition() {
      this.splitOffsetX = 0;
      this.splitOffsetY = 0;
      this.stopSplitDrag(true);
      this.clearSplitResultOnly();
      this.splitMessage = '已重置九宫格裁切位置。';
    },
    beginSplitDrag(event) {
      if (!this.splitSourceImageElement || !event || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
        return;
      }

      event.preventDefault();
      this.stopSplitDrag(true);
      this.splitDragging = true;
      this.splitDragState = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: this.splitOffsetX,
        startOffsetY: this.splitOffsetY,
      };
      window.addEventListener('mousemove', this.handleSplitDrag);
      window.addEventListener('mouseup', this.stopSplitDrag);
    },
    handleSplitDrag(event) {
      if (!this.splitDragState || !this.splitSourceImageElement) {
        return;
      }

      const scale = this.splitPreviewScale || 1;
      const nextOffsetX = this.splitDragState.startOffsetX + (event.clientX - this.splitDragState.startClientX) / scale;
      const nextOffsetY = this.splitDragState.startOffsetY + (event.clientY - this.splitDragState.startClientY) / scale;
      this.updateSplitOffset(nextOffsetX, nextOffsetY);
    },
    stopSplitDrag(silent = false) {
      window.removeEventListener('mousemove', this.handleSplitDrag);
      window.removeEventListener('mouseup', this.stopSplitDrag);

      if (!silent && this.splitDragging) {
        this.splitMessage = '已更新九宫格裁切位置。';
      }

      this.splitDragging = false;
      this.splitDragState = null;
    },
    async loadSplitImageFile(file) {
      if (!file) {
        this.clearSplitTool();
        return;
      }

      if (!file.type || file.type.indexOf('image/') !== 0) {
        this.clearSplitTool();
        this.splitMessage = '请选择标准图片文件。';
        return;
      }

      const dataUrl = await readFileAsDataUrl(file);
      const imageElement = await loadImageFromDataUrl(dataUrl);

      this.stopSplitDrag(true);
      this.splitFile = file;
      this.splitFileName = file.name;
      this.splitSourceMimeType = file.type;
      this.splitSourceDataUrl = dataUrl;
      this.splitSourceImageElement = imageElement;
      this.splitSourceWidth = imageElement.naturalWidth || imageElement.width;
      this.splitSourceHeight = imageElement.naturalHeight || imageElement.height;
      this.splitSourceFileSize = file.size;
      this.splitCanvasSize = Math.max(180, Math.min(this.splitSourceWidth, this.splitSourceHeight, 1080));
      this.splitOffsetX = 0;
      this.splitOffsetY = 0;
      this.clearSplitResultOnly();
    },
    async handleSplitImageFileChange(event) {
      const file = event && event.target && event.target.files ? event.target.files[0] : null;

      if (!file) {
        this.clearSplitTool();
        return;
      }

      try {
        await this.loadSplitImageFile(file);
        this.splitMessage = '切图图片已加载，可拖动调整九宫格裁切位置。';
      } catch (error) {
        this.clearSplitTool();
        this.splitMessage = error.message || '切图图片加载失败。';
      }
    },
    updateSplitOffset(offsetX, offsetY) {
      if (!this.splitSourceImageElement) {
        return;
      }

      const placement = getCoverPlacement(
        this.splitSourceWidth,
        this.splitSourceHeight,
        this.splitCanvasSize,
        this.splitCanvasSize,
        offsetX,
        offsetY,
      );

      this.splitOffsetX = placement.offsetX;
      this.splitOffsetY = placement.offsetY;
      this.clearSplitResultOnly();
    },
    async generateSplitNineGrid() {
      if (!this.splitSourceImageElement) {
        this.splitMessage = '请先上传图片。';
        return;
      }

      try {
        const qualityPercent = Number(this.splitQualityPercent);
        if (!Number.isInteger(qualityPercent) || qualityPercent < 1 || qualityPercent > 100) {
          throw new Error('九宫格压缩质量必须是 1 到 100 之间的整数。');
        }

        const canvasSize = normalizePositiveInteger(this.splitCanvasSize);
        if (canvasSize < 180) {
          throw new Error('九宫格边长不能小于 180。');
        }
        const gap = getNonNegativeIntegerOrFallback(this.splitGap, 0);
        const halfGap = gap / 2;

        const placement = getCoverPlacement(
          this.splitSourceWidth,
          this.splitSourceHeight,
          canvasSize,
          canvasSize,
          this.splitOffsetX,
          this.splitOffsetY,
        );
        const mimeType = resolveOutputMimeType(this.splitOutputFormat, this.splitSourceMimeType);
        const quality = qualityPercent / 100;
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('当前环境不支持九宫格切图。');
        }

        context.clearRect(0, 0, canvasSize, canvasSize);
        if (mimeType === 'image/jpeg') {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvasSize, canvasSize);
        }

        context.drawImage(
          this.splitSourceImageElement,
          placement.x,
          placement.y,
          placement.drawWidth,
          placement.drawHeight,
        );

        const tileSize = Math.floor(canvasSize / 3);
        const tiles = [];
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = tileSize * 3;
        compositeCanvas.height = tileSize * 3;
        const compositeContext = compositeCanvas.getContext('2d');

        if (!compositeContext) {
          throw new Error('当前环境不支持九宫格切图。');
        }

        compositeContext.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);
        if (mimeType === 'image/jpeg') {
          compositeContext.fillStyle = '#ffffff';
          compositeContext.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
        }

        for (let row = 0; row < 3; row += 1) {
          for (let column = 0; column < 3; column += 1) {
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = tileSize;
            tileCanvas.height = tileSize;
            const tileContext = tileCanvas.getContext('2d');

            if (!tileContext) {
              throw new Error('当前环境不支持九宫格切图。');
            }

            if (mimeType === 'image/jpeg') {
              tileContext.fillStyle = '#ffffff';
              tileContext.fillRect(0, 0, tileSize, tileSize);
            }

            const insetLeft = column === 0 ? 0 : halfGap;
            const insetRight = column === 2 ? 0 : halfGap;
            const insetTop = row === 0 ? 0 : halfGap;
            const insetBottom = row === 2 ? 0 : halfGap;
            const drawWidth = Math.max(1, tileSize - insetLeft - insetRight);
            const drawHeight = Math.max(1, tileSize - insetTop - insetBottom);

            tileContext.drawImage(
              canvas,
              column * tileSize,
              row * tileSize,
              tileSize,
              tileSize,
              insetLeft,
              insetTop,
              drawWidth,
              drawHeight,
            );

            const blob = await canvasToBlob(tileCanvas, mimeType, quality);
            compositeContext.drawImage(tileCanvas, column * tileSize, row * tileSize, tileSize, tileSize);
            tiles.push({
              index: row * 3 + column,
              dataUrl: tileCanvas.toDataURL(mimeType, quality),
              blob,
              mimeType: blob.type || mimeType,
            });
          }
        }

        const compositeBlob = await canvasToBlob(compositeCanvas, mimeType, quality);
        this.splitCompositeDataUrl = compositeCanvas.toDataURL(mimeType, quality);
        this.splitCompositeBlob = compositeBlob;
        this.splitCompositeMimeType = compositeBlob.type || mimeType;
        this.splitTiles = tiles;
        this.splitMessage = `九宫格切图已生成，当前间隙 ${gap}px，可直接打包下载 ZIP（含整体图和 9 张单图）。`;
      } catch (error) {
        this.clearSplitResultOnly();
        this.splitMessage = error.message || '九宫格切图失败。';
      }
    },
    async downloadSplitZip() {
      if (!this.splitTiles.length || !this.splitCompositeBlob) {
        this.splitMessage = '请先生成九宫格切图。';
        return;
      }

      this.splitZipGenerating = true;
      this.splitMessage = '正在打包 ZIP，请稍候。';

      try {
        const JSZip = await getJSZipConstructor();
        const zip = new JSZip();
        const baseName = stripFileExtension(this.splitFileName || 'image');
        const compositeExtension = getImageExtension(this.splitCompositeMimeType || 'image/png');

        zip.file(`${baseName}-overall.${compositeExtension}`, this.splitCompositeBlob);
        this.splitTiles.forEach((tile) => {
          const extension = getImageExtension(tile.mimeType || 'image/png');
          zip.file(`${baseName}-tile-${tile.index + 1}.${extension}`, tile.blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const objectUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${baseName}-nine-grid.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        this.splitMessage = '九宫格 ZIP 已开始下载，包含整体图和 9 张单图。';
      } catch (error) {
        console.error('downloadSplitZip failed:', error);
        this.splitMessage = `九宫格 ZIP 打包失败：${error && error.message ? error.message : '未知错误。'}`;
      } finally {
        this.splitZipGenerating = false;
      }
    },
    clearSplitTool() {
      this.stopSplitDrag(true);
      this.splitFile = null;
      this.splitFileName = '';
      this.splitSourceMimeType = '';
      this.splitSourceDataUrl = '';
      this.splitSourceImageElement = null;
      this.splitSourceWidth = 0;
      this.splitSourceHeight = 0;
      this.splitSourceFileSize = 0;
      this.splitOutputFormat = 'keep';
      this.splitQualityPercent = 92;
      this.splitCanvasSize = 1080;
      this.splitGap = 0;
      this.splitOffsetX = 0;
      this.splitOffsetY = 0;
      this.splitDragging = false;
      this.splitDragState = null;
      this.clearSplitResultOnly();
      this.splitMessage = '支持将当前图片裁切成 9 宫格，可拖拽调整裁切位置。';

      if (this.$refs.splitFileInput) {
        this.$refs.splitFileInput.value = '';
      }
    },
    async appendStitchFiles(files) {
      if (!files.length) {
        this.clearStitchTool();
        return;
      }

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
      this.stitchItems = this.stitchItems.concat(stitchItems);
      this.clearStitchResultOnly();
    },
    async handleStitchFilesChange(event) {
      const files = event && event.target && event.target.files ? Array.from(event.target.files) : [];

      if (!files.length) {
        this.clearStitchTool();
        return;
      }

      try {
        this.stitchItems = [];
        await this.appendStitchFiles(files);
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
