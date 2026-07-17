import 'mavon-editor/dist/css/index.css';

const TOOLBOX_PATH = '/toolbox/';

function withBase(base, path) {
  if (!base || base === '/') {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
}

function mountToolboxButton(router) {
  if (typeof document === 'undefined') {
    return;
  }

  const actions = document.querySelector('.home-wrapper .banner .hero .actions');
  if (!actions) {
    return;
  }

  actions.classList.add('hero-actions-double');

  if (actions.querySelector('.toolbox-entry')) {
    return;
  }

  const link = document.createElement('a');
  link.className = 'action-button secondary toolbox-entry';
  link.href = withBase(router && router.options ? router.options.base : '/', TOOLBOX_PATH);
  link.innerText = '工具箱 →';
  actions.insertBefore(link, actions.firstChild);
}

export default ({ Vue, router }) => {
  if (typeof window !== 'undefined' && Vue && !Vue.__linuxCommandMavonInstalled) {
    const mavonEditor = require('mavon-editor');
    Vue.use(mavonEditor);
    Vue.__linuxCommandMavonInstalled = true;
  }

  if (typeof window === 'undefined') {
    return;
  }

  const run = () => {
    window.requestAnimationFrame(() => mountToolboxButton(router));
  };

  router.afterEach(() => {
    run();
  });

  window.addEventListener('load', run);
  run();
};
