import EmitterManager from './EmitterManager';
import RouterManager from './RouterManager';
import { Device } from '../helpers/Device';
// import WebFont from 'webfontloader';
import DATA from '../../datas/data.json';
import SceneManager from './SceneManager';
import Menu from '../components/Menu';
import Cursor from '../components/Cursor';
import bean from 'bean';
import Handlebars from 'handlebars';
import PreloadManager from './PreloadManager';
import { loadJSON } from '../helpers/utils-three';
import { TextureLoader } from 'three';


global.OVERLAY;
global.MODELS;


class AppManager {

	constructor() {

		this.start = this.start.bind(this);
		this.resizeHandler = this.resizeHandler.bind(this);
		this.raf = this.raf.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.preload = this.preload.bind(this);

	}

	preload() {

		this.startLoad = 0;
		this.maxDash = 635;

		// Animation
		const tl = new TimelineMax({repeat: -1});
		TweenMax.killTweensOf(['.preload__symbol .close-up','.preload__symbol .close-down']);

		tl.to('.preload__symbol .close-up', 1, {strokeDashoffset: -this.maxDash * 2, ease: window.Expo.easeOut}, 0);
		tl.to('.preload__symbol .close-down', 1.2, {strokeDashoffset: this.maxDash * 3 + 205, ease: window.Expo.easeOut}, 0);
		tl.set(['.preload__symbol .close-up','.preload__symbol .close-down'], {clearProps: 'all'});

		const tl2 = new TimelineMax({repeat: -1});
		tl2.to('.preload__txt', 1, {opacity: 1});
		tl2.to('.preload__txt', 1, {opacity: 0});


		// First preload Three.js models
		Promise.all([
			loadJSON('datas/models/triangle.json'),
			loadJSON('datas/models/triangles_y.json'),
			loadJSON('datas/models/triangles_y6.json'),
			loadJSON('datas/models/iceberg-1.json'),
			loadJSON('datas/models/iceberg-2.json'),
			loadJSON('datas/models/iceberg-3.json')
		]).then(results => {
			global.MODELS = results;

			// Preload all assets
			PreloadManager.loadManifest([
				// template hbs
				{ id: 'tpl-project-title', src: `${global.BASE}/templates/projectTitle.hbs` },
				{ id: 'tpl-project-content', src: `${global.BASE}/templates/projectContent.hbs` },
				{ id: 'tpl-project-prev', src: `${global.BASE}/templates/projectPrev.hbs` },
				{ id: 'tpl-project-next', src: `${global.BASE}/templates/projectNext.hbs` },
				{ id: 'tpl-menu', src: `${global.BASE}/templates/menu.hbs` },
				{ id: 'tpl-about-content', src: `${global.BASE}/templates/aboutContent.hbs` },
				{ id: 'tpl-intro-content', src: `${global.BASE}/templates/introContent.hbs` },
				// textures
				{ id: 'introTxt', src: `${global.BASE}/images/textures/name.png` },
				{ id: 'glitchTex', src: `${global.BASE}/images/textures/glitch-1.png` },
				{ id: 'skyTex', src: `${global.BASE}/images/textures/intro2_up.jpg` },
			]);
			// SkyTex
			global.skyTex = new TextureLoader().load( `${global.BASE}/images/textures/intro2_up.jpg` );

			// Preload all img projects
			for (let i = 0; i < DATA.projects.length; i++) {

				for (let y = 0; y < DATA.projects[i].imgs.length; y++) {
					PreloadManager.loadFile(`${global.BASE}/images/projects/${DATA.projects[i].imgs[y]}`);
				}

			}

			PreloadManager.on('progress', (e) => {

				// console.log(e.progress);
				let percent = `${e.progress * 100}%`;
				TweenMax.to('.preload__bar', 0.2, {width: percent});

				if (this.startLoad === 0) {
					this.startLoad = 1;

				}

			});
			// TweenMax.set('.preload', {display: 'none'});

			PreloadManager.on('complete', () => {
				console.log('complete');
				this.start();
				PreloadManager.off('progress');
				const tl = new TimelineMax();
				tl.to('.preload', 1, {autoAlpha: 0}, 2);
				tl.add(() => {

					TweenMax.killTweensOf(['.preload__symbol .close-up','.preload__symbol .close-down', '.preload__txt']);

				});
			}, this, true);


		});



	}

	start() {
		console.log('start');

		this.events(true);

		// HandlebarRegisters
		Handlebars.registerHelper('math', (lvalue, operator, rvalue, options) => {
			lvalue = parseFloat(lvalue);
			rvalue = parseFloat(rvalue);

			return {
				'+': lvalue + rvalue,
				'-': lvalue - rvalue,
				'*': lvalue * rvalue,
				'/': lvalue / rvalue,
				'%': lvalue % rvalue
			}[operator];
		});

		// SoundManager

		// this.graphicBars = new GraphicBars();
		this.menu = global.MENU = new Menu();
		this.cursor = global.CURSOR = new Cursor();

		// Set up scene
		SceneManager.start(); // scene already set up ?

		this.ui = {
			preloadSymbol: document.querySelector('.preload__symbol'),
			xp: document.querySelector('.xp'),
			webGl: document.querySelector('.webGl'),
			overlay: document.querySelector('.overlay'),
			body: document.getElementsByTagName('body')[0] // not sure needed
		};

		global.OVERLAY = this.ui.overlay;

		RouterManager.start(); // start
	}

	events(method) {

		this.resizeHandler();

		let listen = method === false ? 'removeEventListener' : 'addEventListener';

		// raf
		TweenMax.ticker[listen]('tick', this.raf);
		if (Device.touch === false) {
			// move camera
			document[listen]( 'mousemove', this.onMouseMove, false );
		}

		listen = method === false ? 'off' : 'on';

		bean[listen](window, 'resize', this.resizeHandler);

	}

	raf() {

		EmitterManager.emit('raf');
	}

	onMouseMove(e) {
		const eventX = e.clientX || e.touches && e.touches[0].clientX || 0;
		const eventY = e.clientY || e.touches && e.touches[0].clientY || 0;

		EmitterManager.emit('mousemove', eventX, eventY);
	}

	resizeHandler() {

		const touch = document.querySelector('html').classList.contains('touchevents');
		Device.touch = touch;


		// // Device.browser = Detect.browser();

		// // if (/Edge/.test(Device.browser) || /IE/.test(Device.browser)) {

		// //     document.body.classList.add('ie');
		// // }



		Device.size = 'mobile';

		if (window.innerWidth >= 768) {
			Device.size = 'tablet';
		}

		if (window.innerWidth > 1024) {
			Device.size = 'desktop';
		}

		EmitterManager.emit('resize', window.innerWidth, window.innerHeight);

	}
}

export default new AppManager();
