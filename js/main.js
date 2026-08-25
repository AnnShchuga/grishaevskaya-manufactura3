(() => {
  'use strict';

  /* ---------- hero: interactive kitchen (doors/drawers open on hover) ---------- */
  const heroImg = document.getElementById('heroKitchenImg');
  if (heroImg) {
    const HERO_POS_X = 0.20, HERO_POS_Y = 0.5; // must match .hero-photo img { object-position }
    // Measure the actual rendered text lines and buttons, not their block-level
    // wrappers — those stretch to .hero-copy's max-width regardless of how much
    // of it real content fills, so using their own box would hide hotspots under
    // empty invisible padding to the right of short lines/buttons.
    const heroCopyRects = () => {
      const rects = [];
      document.querySelectorAll('.hero-copy h1, .hero-copy .hero-sub, .hero-copy .hero-hint').forEach(el => {
        const range = document.createRange();
        range.selectNodeContents(el);
        rects.push(...range.getClientRects());
      });
      document.querySelectorAll('.hero-copy .hero-cta a').forEach(el => rects.push(el.getBoundingClientRect()));
      return rects;
    };

    const rectsOverlap = (a, b) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    const layoutHeroHotspots = () => {
      const container = heroImg.parentElement;
      const cw = container.clientWidth, ch = container.clientHeight;
      const iw = heroImg.naturalWidth, ih = heroImg.naturalHeight;
      if (!iw || !ih || !cw || !ch) return;

      const containerRatio = cw / ch, imgRatio = iw / ih;
      let renderW, renderH;
      if (imgRatio > containerRatio) { renderH = ch; renderW = ch * imgRatio; }
      else { renderW = cw; renderH = cw / imgRatio; }
      const offsetX = (cw - renderW) * HERO_POS_X;
      const offsetY = (ch - renderH) * HERO_POS_Y;
      const scale = renderW / iw;

      const containerRect = container.getBoundingClientRect();
      // Small inward inset absorbs line-height slack around the real glyphs so a
      // hotspot isn't hidden just for grazing a text box's empty vertical padding.
      const INSET = 8;
      const copyRectsLocal = heroCopyRects().map(r => ({
        left: r.left - containerRect.left + INSET, right: r.right - containerRect.left - INSET,
        top: r.top - containerRect.top + INSET, bottom: r.bottom - containerRect.top - INSET
      }));

      document.querySelectorAll('.hero-hotspot').forEach(el => {
        const x = parseFloat(el.dataset.x), y = parseFloat(el.dataset.y);
        const w = parseFloat(el.dataset.w), h = parseFloat(el.dataset.h);
        const left = offsetX + x * scale, top = offsetY + y * scale;
        const width = w * scale, height = h * scale;
        const spotRect = { left, right: left + width, top, bottom: top + height };

        if (copyRectsLocal.some(r => rectsOverlap(spotRect, r))) {
          el.style.display = 'none';
          return;
        }
        el.style.display = '';

        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.style.width = width + 'px';
        el.style.height = height + 'px';
      });
    };

    if (heroImg.complete && heroImg.naturalWidth) layoutHeroHotspots();
    heroImg.addEventListener('load', layoutHeroHotspots);
    window.addEventListener('resize', layoutHeroHotspots);
    // Text metrics shift once self-hosted webfonts swap in after the initial
    // (fallback-font) layout — recompute so hotspot collision rects stay accurate.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutHeroHotspots);

    const heroLayers = {};
    document.querySelectorAll('.hero-layer-overlay').forEach(el => { heroLayers[el.dataset.layer] = el; });
    const setActiveHeroLayer = (key) => {
      Object.values(heroLayers).forEach(el => el.classList.remove('is-active'));
      if (key && heroLayers[key]) heroLayers[key].classList.add('is-active');
    };
    document.querySelectorAll('.hero-hotspot').forEach(el => {
      const key = el.dataset.layer;
      el.addEventListener('mouseenter', () => setActiveHeroLayer(key));
      el.addEventListener('mouseleave', () => setActiveHeroLayer(null));
    });
  }

  /* ---------- header scroll state ---------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile nav ---------- */
  const burger = document.getElementById('burgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const open = document.documentElement.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      document.documentElement.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- FAQ accordion (только один открытый пункт за раз) ---------- */
  document.querySelectorAll('.faq-list').forEach(list => {
    const items = Array.from(list.querySelectorAll('.faq-item')).map(item => {
      const btn = item.querySelector('.faq-q');
      const ans = item.querySelector('.faq-a');
      const setState = (open) => {
        item.classList.toggle('is-open', open);
        ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '0px';
      };
      return { item, btn, ans, setState };
    });
    items.forEach(entry => {
      entry.setState(entry.item.classList.contains('is-open'));
      entry.btn.addEventListener('click', () => {
        const willOpen = !entry.item.classList.contains('is-open');
        items.forEach(other => other.setState(other === entry ? willOpen : false));
      });
    });
    window.addEventListener('resize', () => {
      items.forEach(entry => {
        if (entry.item.classList.contains('is-open')) entry.ans.style.maxHeight = entry.ans.scrollHeight + 'px';
      });
    });
  });

  /* ---------- shared project data (использовано на главной и в портфолио) ---------- */
  const CASES = [
    { mono: 'Кх', tag: 'Кухня', cat: 'kitchen', title: 'Угловая кухня со&nbsp;встроенной техникой',
      area: '12–14 м²', material: 'МДФ эмаль, ЛДСП Egger', days: '18 дней', price: 'от 320 000 ₽',
      note: 'Типовой формат для новостройки: угловой гарнитур, встроенная техника, барная стойка по запросу.',
      photo: 'assets/photos/case-kh.jpg' },
    { mono: 'Шк', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Шкаф-купе в прихожую со&nbsp;стеклянными фасадами',
      area: 'до потолка', material: 'ЛДСП, стекло', days: '20 дней', price: 'от 195 000 ₽',
      note: 'Максимум места хранения без визуального утяжеления коридора — фасады в цвет стен или контрастные.',
      photo: 'assets/photos/case-w6.jpg' },
    { mono: 'Гд', tag: 'Гардеробная', cat: 'dressing', title: 'Гардеробная с системой хранения',
      area: 'от 3 м²', material: 'ЛДСП, металл', days: '21 день', price: 'от 260 000 ₽',
      note: 'Открытые и закрытые модули, штанги, выдвижные ящики — наполнение считаем под ваш гардероб.',
      photo: 'assets/photos/case-d5.jpg' },
    { mono: 'Ко', tag: 'Кухня-остров', cat: 'kitchen', title: 'Кухня с полуостровом и обеденной группой',
      area: '18–22 м²', material: 'МДФ эмаль, фурнитура Blum', days: '24 дня', price: 'от 480 000 ₽',
      note: 'Формат для просторных кухонь-гостиных: остров как рабочая зона и место для общения.',
      photo: 'assets/photos/case-ko.jpg' },
    { mono: 'Вк', tag: 'Вся квартира', cat: 'apartment', title: 'Меблировка квартиры целиком',
      area: 'кухня + шкафы + прихожая', material: 'по проекту', days: '30 дней', price: 'от 640 000 ₽',
      note: 'Один подрядчик и единый стиль на всю квартиру — без стыковки разных производителей между собой.',
      photo: 'assets/photos/case-a5.jpg' },
    { mono: 'Км', tag: 'Компакт', cat: 'kitchen', title: 'Компактная кухня для&nbsp;студии',
      area: 'до 8 м²', material: 'МДФ, ЛДСП', days: '12 дней', price: 'от 210 000 ₽',
      note: 'Минимум площади — максимум функции: открытые полки и продуманное хранение для небольшой кухни.',
      photo: 'assets/photos/case-km.jpg' },
    { mono: 'Шс', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Встроенный шкаф-купе в спальню',
      area: 'ниша 2,4 м', material: 'ЛДСП, фурнитура с бронзовым профилем', days: '14 дней', price: 'от 175 000 ₽',
      note: 'Встроенная конструкция без боковых стенок — использует нишу целиком, открытый стеллаж сбоку под мелочи.',
      photo: 'assets/photos/case-shs.jpg' },
    { mono: 'Гм', tag: 'Гардеробная', cat: 'dressing', title: 'Гардеробная в мансарде',
      area: 'скошенный потолок', material: 'ЛДСП, металл', days: '23 дня', price: 'от 290 000 ₽',
      note: 'Наполнение спроектировано под скошенные потолки мансарды — нестандартная геометрия без потери места хранения.',
      photo: 'assets/photos/case-d6.jpg' },
    { mono: 'Кг', tag: 'Кухня-гостиная', cat: 'kitchen', title: 'Кухня-гостиная со&nbsp;встроенной техникой',
      area: '20–26 м²', material: 'МДФ, камень, ДСП под дерево', days: '26 дней', price: 'от 520 000 ₽',
      note: 'Кухня как часть гостиной: встроенная техника, каменная столешница, тёплый акцент дерева в фасадах.',
      photo: 'assets/photos/case-kg.jpg' },
    { mono: 'Пх', tag: 'Прихожая', cat: 'apartment', title: 'Прихожая с системой хранения',
      area: '4–6 м²', material: 'ЛДСП, МДФ', days: '10 дней', price: 'от 150 000 ₽',
      note: 'Встроенные шкафы для входной группы — обувь, верхняя одежда, сезонные вещи в одном модуле.',
      photo: 'assets/photos/case-a6.jpg' },
    { mono: 'Нс', tag: 'Новостройка', cat: 'apartment', title: 'Мебель для новостройки под ключ',
      area: 'кухня + прихожая + шкафы', material: 'по проекту', days: '28 дней', price: 'от 590 000 ₽',
      note: 'Типовой запрос после сдачи ЖК: меблировка сразу после ремонта, один подрядчик на весь объём.',
      photo: 'assets/photos/case-a7.jpg' },
    { mono: 'Шр', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Радиусный шкаф-купе',
      area: 'угловой, радиус 900 мм', material: 'ЛДСП, гнутое стекло', days: '25 дней', price: 'от 310 000 ₽',
      note: 'Скруглённый корпус вместо острого угла — сложнее в производстве, но существенно экономит проходное пространство.',
      photo: 'assets/photos/case-w7.jpg' },
    { mono: 'Кт', tag: 'Кухня', cat: 'kitchen', title: 'Кухня в глубоком бирюзовом цвете',
      area: '10–12 м²', material: 'МДФ эмаль, фурнитура Blum', days: '20 дней', price: 'от 340 000 ₽',
      note: 'Насыщенный цвет фасадов вместо привычного нейтрала — встроенная техника и деревянная столешница держат баланс.',
      photo: 'assets/photos/case-kt.jpg' },
    { mono: 'Кб', tag: 'Кухня', cat: 'kitchen', title: 'Кухня: бетон и дуб',
      area: '9–11 м²', material: 'ЛДСП под бетон, шпон дуба', days: '19 дней', price: 'от 300 000 ₽',
      note: 'Верхний ряд — тёплое дерево, нижний — фактура бетона: контраст фактур вместо контраста цвета.',
      photo: 'assets/photos/case-kb.jpg' },
    { mono: 'Кс', tag: 'Кухня', cat: 'kitchen', title: 'Кухня в тёмно-синем цвете',
      area: '11–13 м²', material: 'МДФ эмаль, ЛДСП', days: '21 день', price: 'от 330 000 ₽',
      note: 'Глубокий синий низ и светлый рифлёный верх — цвет и фактура работают на зонирование маленькой кухни.',
      photo: 'assets/photos/case-ks.jpg' },
    { mono: 'Кл', tag: 'Кухня', cat: 'kitchen', title: 'Кухня: орех и латунь',
      area: '9–11 м²', material: 'МДФ, шпон ореха, латунная фурнитура', days: '23 дня', price: 'от 390 000 ₽',
      note: 'Тёмный ореховый шпон, чёрная мойка и латунные акценты — та самая комбинация фактур, на которой построена вся наша палитра.',
      photo: 'assets/photos/case-kw.jpg' },
    { mono: 'Кн', tag: 'Кухня', cat: 'kitchen', title: 'Кухня с синим нижним рядом',
      area: '8–10 м²', material: 'МДФ, ЛДСП, встроенная техника', days: '18 дней', price: 'от 300 000 ₽',
      note: 'Светлый верх и синий низ, ниша под встроенный холодильник — компактная кухня без ощущения тесноты.',
      photo: 'assets/photos/case-kj.jpg' },
    { mono: 'Кэ', tag: 'Кухня', cat: 'kitchen', title: 'Кухня в изумрудно-бирюзовом цвете',
      area: '10–12 м²', material: 'МДФ эмаль, столешница из массива', days: '21 день', price: 'от 350 000 ₽',
      note: 'Ещё один вариант насыщенного цвета фасадов — деревянная столешница смягчает контраст с тёмной техникой.',
      photo: 'assets/photos/case-kz.jpg' },
    { mono: 'Кд', tag: 'Кухня-остров', cat: 'kitchen', title: 'Кухня с барной стойкой',
      area: '14–16 м²', material: 'МДФ, камень, встроенная техника', days: '26 дней', price: 'от 460 000 ₽',
      note: 'Графитовые фасады, каменная столешница и остров с барной стойкой — формат для кухни-гостиной.',
      photo: 'assets/photos/case-kd.jpg' },
    { mono: 'Кс', tag: 'Кухня', cat: 'kitchen', title: 'Светлая кухня с нишей для&nbsp;техники',
      area: '9–11 м²', material: 'МДФ, ЛДСП', days: '17 дней', price: 'от 270 000 ₽',
      note: 'Открытая ниша вместо верхнего шкафа — место для декора или техники без визуальной тяжести фасадов.',
      photo: 'assets/photos/case-kc.jpg' },
    { mono: 'Кп', tag: 'Кухня', cat: 'kitchen', title: 'Кухня с барной стойкой у&nbsp;окна',
      area: '10–12 м²', material: 'МДФ, ЛДСП', days: '19 дней', price: 'от 310 000 ₽',
      note: 'Дневной свет из окна и барная стойка вместо обеденного стола — решение для кухни-студии.',
      photo: 'assets/photos/case-kp.jpg' },
    { mono: 'Шл', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Шкаф с латунными ручками',
      area: 'до потолка', material: 'ЛДСП, латунная фурнитура, шпон ореха', days: '16 дней', price: 'от 220 000 ₽',
      note: 'Открытый ореховый стеллаж сбоку и латунные ручки на всю высоту дверцы — акцент вместо типовой фурнитуры.',
      photo: 'assets/photos/case-w1.jpg' },
    { mono: 'Шт', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Шкаф-купе со&nbsp;стеклянными фасадами',
      area: 'встроенный, до потолка', material: 'ЛДСП, тонированное стекло', days: '19 дней', price: 'от 230 000 ₽',
      note: 'Тёмное тонированное стекло вместо глухих фасадов — шкаф не давит на небольшую комнату.',
      photo: 'assets/photos/case-w2.jpg' },
    { mono: 'Шз', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Шкаф-купе с зеркальными дверьми',
      area: 'встроенный', material: 'ЛДСП, зеркало', days: '18 дней', price: 'от 210 000 ₽',
      note: 'Зеркальный фасад визуально расширяет узкий коридор и заменяет отдельное зеркало в прихожей.',
      photo: 'assets/photos/case-w3.jpg' },
    { mono: 'Шд', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Шкаф-купе в два тона',
      area: 'до потолка', material: 'ЛДСП', days: '17 дней', price: 'от 200 000 ₽',
      note: 'Светлые дверцы и тёмная боковая панель — простой приём, который разбивает крупный объём шкафа.',
      photo: 'assets/photos/case-w4.jpg' },
    { mono: 'Шм', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Шкаф-купе в цвете марсала',
      area: 'встроенный', material: 'ЛДСП', days: '18 дней', price: 'от 215 000 ₽',
      note: 'Необычный глубокий бордовый цвет вместо привычного белого или венге — собираем в любом декоре ЛДСП.',
      photo: 'assets/photos/case-w5.jpg' },
    { mono: 'Шб', tag: 'Шкаф-купе', cat: 'wardrobe', title: 'Встроенный шкаф в&nbsp;спальне',
      area: 'ниша под потолок', material: 'ЛДСП, латунная фурнитура', days: '16 дней', price: 'от 195 000 ₽',
      note: 'Шкаф спроектирован под конкретную нишу спальни — до потолка, без зазоров и антресоли сверху.',
      photo: 'assets/photos/case-a1.jpg' },
    { mono: 'Гз', tag: 'Гардеробная', cat: 'dressing', title: 'Гардеробная с зеркальной дверью',
      area: 'от 3 м²', material: 'ЛДСП, шпон, зеркало', days: '20 дней', price: 'от 270 000 ₽',
      note: 'Зеркальная раздвижная дверь на входе и открытые деревянные полки внутри — гардеробная, которая не ощущается кладовкой.',
      photo: 'assets/photos/case-d1.jpg' },
    { mono: 'Гк', tag: 'Гардеробная', cat: 'dressing', title: 'Гардеробная в форме коридора',
      area: 'от 4 м²', material: 'ЛДСП, металл', days: '22 дня', price: 'от 280 000 ₽',
      note: 'Стеллажи по обе стороны узкого прохода — весь гардероб виден и достаётся без штанг «в два ряда».',
      photo: 'assets/photos/case-d2.jpg' },
    { mono: 'Гп', tag: 'Гардеробная', cat: 'dressing', title: 'Гардеробная-пенал',
      area: 'от 2 м²', material: 'ЛДСП, металл', days: '15 дней', price: 'от 190 000 ₽',
      note: 'Компактный формат для банок, консервации и хозяйственных мелочей — открытые полки вместо глухих дверей.',
      photo: 'assets/photos/case-d3.jpg' },
    { mono: 'Гш', tag: 'Гардеробная', cat: 'dressing', title: 'Гардеробная с открытой штангой',
      area: 'от 3 м²', material: 'ЛДСП, металл', days: '19 дней', price: 'от 250 000 ₽',
      note: 'Открытая штанга для верхней одежды и закрытые модули для остального — гардероб виден целиком с порога.',
      photo: 'assets/photos/case-d4.jpg' },
    { mono: 'Ро', tag: 'Кабинет', cat: 'apartment', title: 'Рабочее место у&nbsp;окна',
      area: 'по размеру ниши', material: 'ЛДСП, столешница из массива', days: '10 дней', price: 'от 85 000 ₽',
      note: 'Столешница на всю ширину окна вместо отдельного стола — рабочее место, которое не отнимает площадь комнаты.',
      photo: 'assets/photos/case-a2.jpg' },
    { mono: 'Рд', tag: 'Детская', cat: 'apartment', title: 'Рабочий уголок в детской',
      area: 'по размеру ниши', material: 'ЛДСП, столешница', days: '11 дней', price: 'от 90 000 ₽',
      note: 'Встроенный стол под окном в детской — используем нишу, которая иначе осталась бы пустой.',
      photo: 'assets/photos/case-a3.jpg' },
    { mono: 'Пш', tag: 'Гостиная', cat: 'apartment', title: 'Подвесной шкаф без&nbsp;опоры на пол',
      area: 'по проекту', material: 'ЛДСП, МДФ', days: '12 дней', price: 'от 110 000 ₽',
      note: 'Открытая полка без видимых опор — лёгкий силуэт для гостиной или прихожей.',
      photo: 'assets/photos/case-a4.jpg' }
  ];

  const PLACEHOLDER_MARK = 'assets/logo-mono.jpg';

  function caseCardHTML(item, i) {
    const style = item.photo ? ` style="background-image:url('${item.photo}')"` : '';
    const placeholderCls = item.photo ? '' : ' is-placeholder';
    const mark = item.photo ? '' : `<img class="case-placeholder-mark" src="${PLACEHOLDER_MARK}" alt="" loading="lazy">`;
    return `
      <div class="case-swatch${placeholderCls}"${style}>
        <span class="case-tag">${item.tag}</span>
        ${mark}
      </div>
      <div class="case-meta">
        <h4>${item.title}</h4>
        <p>${item.days}</p>
      </div>`;
  }

  /* ---------- portfolio carousel (главная): "Кинопоиск"-приём — активная карточка укрупняется ---------- */
  const track = document.getElementById('carouselTrack');
  const detail = document.getElementById('caseDetail');
  if (track && detail) {
    function renderDetail(item) {
      const photo = item.photo || 'assets/photos/case-kh.jpg';
      detail.innerHTML = `
        <div class="case-detail-media"><img src="${photo}" alt="${item.title}" loading="lazy"></div>
        <div class="case-detail-body">
          <div class="lead">
            <h3>${item.title}</h3>
            <div class="stars">фиксированная цена после замера</div>
          </div>
          <dl class="case-stat"><dt>Формат</dt><dd>${item.area}</dd></dl>
          <dl class="case-stat"><dt>Материал</dt><dd>${item.material}</dd></dl>
          <dl class="case-stat"><dt>Срок</dt><dd>${item.days}</dd></dl>
          <dl class="case-stat"><dt>Стоимость</dt><dd>${item.price}</dd></dl>
          <p class="case-quote">${item.note}</p>
        </div>
      `;
    }
    CASES.slice(0, 6).forEach((item, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'case-card' + (i === 0 ? ' is-active' : '');
      card.setAttribute('aria-label', item.title);
      card.innerHTML = caseCardHTML(item, i);
      card.addEventListener('click', () => {
        track.querySelectorAll('.case-card').forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
        renderDetail(item);
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      track.appendChild(card);
    });
    renderDetail(CASES[0]);
  }

  /* ---------- portfolio grid (portfolio.html): фильтр по категориям + "показать ещё" ---------- */
  const grid = document.getElementById('portfolioGrid');
  if (grid) {
    const PAGE_SIZE = 6;
    let activeCat = 'all';
    let shown = PAGE_SIZE;

    function currentSet() {
      return activeCat === 'all' ? CASES : CASES.filter(c => c.cat === activeCat);
    }

    function render() {
      const set = currentSet();
      grid.innerHTML = set.slice(0, shown).map((item, i) => `<a class="grid-card" href="#cta">${caseCardHTML(item, i)}</a>`).join('');
      const btn = document.getElementById('loadMoreBtn');
      if (btn) btn.hidden = shown >= set.length;
    }

    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activeCat = chip.dataset.filter;
        shown = PAGE_SIZE;
        render();
      });
    });
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => { shown += PAGE_SIZE; render(); });

    render();
  }

  /* ---------- generic media grid (services.html, materials.html) ---------- */
  document.querySelectorAll('[data-media-grid]').forEach(container => {
    let items;
    try { items = JSON.parse(container.getAttribute('data-media-grid')); } catch (e) { items = []; }
    container.innerHTML = items.map((item, i) => `
      <div class="grid-card">
        <div class="case-swatch${item.photo ? '' : ' is-placeholder'}"${item.photo ? ` style="background-image:url('${item.photo}')"` : ''}>
          ${item.photo ? '' : `<img class="case-placeholder-mark" src="${PLACEHOLDER_MARK}" alt="" loading="lazy">`}
        </div>
        <div class="case-meta">
          <h4>${item.title}</h4>
          ${item.meta ? `<p>${item.meta}</p>` : ''}
        </div>
        ${item.desc ? `<p style="margin-top:.5rem;color:var(--walnut-2);font-size:.9rem">${item.desc}</p>` : ''}
      </div>
    `).join('');
  });

  /* ---------- lead form -> WhatsApp deep link ---------- */
  const form = document.getElementById('leadForm');
  const status = document.getElementById('formStatus');
  const WHATSAPP_NUMBER = '79267739777';

  if (form && status) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const phone = (data.get('phone') || '').toString().trim();
      const project = (data.get('project') || '').toString().trim();
      const comment = (data.get('comment') || '').toString().trim();

      if (!name || !phone) {
        status.hidden = false;
        status.textContent = 'Укажите имя и телефон — так мы сможем связаться с вами.';
        status.style.color = '#b5453a';
        return;
      }

      const lines = [
        `Здравствуйте! Меня зовут ${name}.`,
        `Телефон: ${phone}`,
        project ? `Интересует: ${project}` : null,
        comment ? `Комментарий: ${comment}` : null
      ].filter(Boolean);

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
      status.hidden = false;
      status.style.color = '';
      status.textContent = 'Открываем WhatsApp с готовым сообщением…';
      window.open(url, '_blank', 'noopener');
      form.reset();
    });
  }

  /* ---------- map link: open Yandex Maps by address ---------- */
  const mapLink = document.getElementById('mapLink');
  if (mapLink) {
    mapLink.href = 'https://yandex.ru/maps/?text=' + encodeURIComponent('Москва, г. Троицк, Дальняя улица, 6');
    mapLink.target = '_blank';
    mapLink.rel = 'noopener';
  }

  /* ---------- video slot: click-to-load YouTube embed (facade pattern) ---------- */
  const videoSlot = document.getElementById('videoSlot');
  if (videoSlot) {
    videoSlot.addEventListener('click', () => {
      const id = videoSlot.dataset.ytId;
      videoSlot.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Видеоотзыв клиента" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    });
  }

  /* ---------- floating widgets: scroll-to-top + quick callback request ---------- */
  (() => {
    const wrap = document.createElement('div');
    wrap.className = 'floating-widgets';
    wrap.innerHTML = `
      <div class="callback-panel" id="callbackPanel" hidden role="dialog" aria-label="Заказать обратный звонок">
        <button type="button" class="callback-close" id="callbackClose" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
        </button>
        <h3>Закажите звонок</h3>
        <p>Оставьте имя и телефон — перезвоним в течение рабочего дня.</p>
        <form id="callbackForm">
          <div class="field">
            <label for="cb-name">Имя</label>
            <input id="cb-name" name="name" type="text" placeholder="Имя" required>
          </div>
          <div class="field">
            <label for="cb-phone">Телефон</label>
            <input id="cb-phone" name="phone" type="tel" placeholder="+7 900 000-00-00" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">
            Перезвоните мне
            <svg viewBox="0 0 24 24"><use href="#icon-arrow"/></svg>
          </button>
          <p class="form-status" id="callbackStatus" hidden></p>
        </form>
      </div>
      <button type="button" class="fab fab-callback" id="callbackFab" aria-haspopup="dialog" aria-expanded="false">
        <svg viewBox="0 0 24 24"><use href="#icon-phone"/></svg>
        <span>Обратный звонок</span>
      </button>
      <button type="button" class="fab fab-top" id="toTopFab" aria-label="Наверх страницы" hidden>
        <svg viewBox="0 0 24 24"><use href="#icon-arrow"/></svg>
      </button>
    `;
    document.body.appendChild(wrap);

    const fab = document.getElementById('callbackFab');
    const panel = document.getElementById('callbackPanel');
    const closeBtn = document.getElementById('callbackClose');
    const cbForm = document.getElementById('callbackForm');
    const cbStatus = document.getElementById('callbackStatus');
    const toTopFab = document.getElementById('toTopFab');

    const setPanel = (open) => {
      panel.hidden = !open;
      fab.setAttribute('aria-expanded', String(open));
      wrap.classList.toggle('panel-open', open);
    };
    fab.addEventListener('click', () => setPanel(panel.hidden));
    closeBtn.addEventListener('click', () => setPanel(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setPanel(false); });

    if (cbForm && cbStatus) {
      cbForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(cbForm);
        const name = (data.get('name') || '').toString().trim();
        const phone = (data.get('phone') || '').toString().trim();
        if (!name || !phone) {
          cbStatus.hidden = false;
          cbStatus.style.color = '#b5453a';
          cbStatus.textContent = 'Укажите имя и телефон.';
          return;
        }
        const text = `Здравствуйте! Прошу перезвонить.\nИмя: ${name}\nТелефон: ${phone}`;
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
        cbStatus.hidden = false;
        cbStatus.style.color = '';
        cbStatus.textContent = 'Открываем WhatsApp с готовым сообщением…';
        window.open(url, '_blank', 'noopener');
        cbForm.reset();
      });
    }

    toTopFab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    const onScrollTop = () => { toTopFab.hidden = window.scrollY < 480; };
    onScrollTop();
    window.addEventListener('scroll', onScrollTop, { passive: true });
  })();

  /* ---------- cookie consent banner ---------- */
  (() => {
    const STORAGE_KEY = 'gm-cookie-consent';
    let consented = false;
    try { consented = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) {}
    if (consented) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.id = 'cookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Уведомление об использовании файлов cookie');
    banner.innerHTML = `
      <div class="wrap cookie-banner-inner">
        <p>Мы используем файлы cookie, чтобы сайт работал корректно и был вам удобен. Продолжая пользоваться сайтом, вы соглашаетесь с <a href="cookie-policy.html">политикой использования cookie</a>.</p>
        <button type="button" class="btn btn-primary" id="cookieAccept">Хорошо, принимаю</button>
      </div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('is-visible'));

    document.getElementById('cookieAccept').addEventListener('click', () => {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
      banner.classList.remove('is-visible');
      setTimeout(() => banner.remove(), 450);
    });
  })();
})();
