/* ==========================================================================
   VitaCure Pharmacy — site scripts
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const money = n => '$' + Number(n).toFixed(2);

  /* ---------- toast ---------- */
  function toast(msg, icon) {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.innerHTML = '<i class="fa-solid ' + (icon || 'fa-circle-check') + '"></i>' + msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2600);
  }
  window.vcToast = toast;

  /* ---------- mobile nav ---------- */
  const navToggle = $('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const ul = $('.main-nav ul');
      ul.classList.toggle('open');
      navToggle.innerHTML = ul.classList.contains('open')
        ? '<i class="fa-solid fa-xmark"></i> Close Menu'
        : '<i class="fa-solid fa-bars"></i> Browse All Categories';
    });
  }
  $$('.has-drop > a.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      if (window.innerWidth <= 980) {
        e.preventDefault();
        a.parentElement.classList.toggle('open');
      }
    });
  });

  /* ---------- header search ---------- */
  const searchForm = $('.searchbar');
  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const q = $('input', searchForm).value.trim();
      if (!q) { toast('Type a medicine or product name to search.', 'fa-magnifying-glass'); return; }
      toast('Showing results for "' + q + '"', 'fa-magnifying-glass');
      setTimeout(() => { window.location.href = 'shop.html'; }, 500);
    });
  }

  /* ---------- hero slider ---------- */
  const slides = $$('.hero .slide');
  const dots = $$('.hero-dots button');
  if (slides.length > 1) {
    let i = 0, timer;
    const go = n => {
      slides[i].classList.remove('active');
      if (dots[i]) dots[i].classList.remove('active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('active');
      if (dots[i]) dots[i].classList.add('active');
    };
    const play = () => { timer = setInterval(() => go(i + 1), 6500); };
    dots.forEach((d, n) => d.addEventListener('click', () => {
      clearInterval(timer); go(n); play();
    }));
    play();
  }

  /* ---------- product / content tabs ---------- */
  $$('[data-tabs]').forEach(group => {
    const btns = $$('.tabs button', group);
    btns.forEach(btn => btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.tab;
      $$('.product-grid', group).forEach(g => {
        g.hidden = g.dataset.panel !== key;
      });
    }));
  });

  /* ---------- product detail tabs ---------- */
  const pdTabs = $$('.pd-tabs button');
  if (pdTabs.length) {
    pdTabs.forEach(btn => btn.addEventListener('click', () => {
      pdTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      $('#panel-' + btn.dataset.tab).classList.add('active');
    }));
  }

  /* ---------- gallery ---------- */
  const thumbs = $$('.pd-thumbs img');
  if (thumbs.length) {
    thumbs.forEach(t => t.addEventListener('click', () => {
      thumbs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      $('.pd-gallery .main img').src = t.dataset.big || t.src;
    }));
  }

  /* ---------- quantity steppers ---------- */
  $$('.qty').forEach(box => {
    const input = $('input', box);
    $$('button', box).forEach(b => b.addEventListener('click', () => {
      let v = parseInt(input.value, 10) || 1;
      v += b.dataset.step === 'up' ? 1 : -1;
      if (v < 1) v = 1;
      if (v > 99) v = 99;
      input.value = v;
    }));
  });

  /* ---------- CART (localStorage) ---------- */
  const KEY = 'vitacure_cart_v1';

  function readCart() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function writeCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    paintCount();
    if ($('#cart-body')) renderCart();
  }
  function paintCount() {
    const n = readCart().reduce((s, it) => s + it.qty, 0);
    $$('.js-cart-count').forEach(el => { el.textContent = n; el.style.display = n ? '' : 'none'; });
  }
  function addToCart(item) {
    const items = readCart();
    const found = items.filter(x => x.id === item.id)[0];
    if (found) found.qty += item.qty;
    else items.push(item);
    writeCart(items);
    toast('<strong>' + item.name + '</strong> was added to your cart.', 'fa-cart-plus');
  }
  function removeFromCart(id) {
    writeCart(readCart().filter(x => x.id !== id));
    toast('Item removed from cart.', 'fa-trash-can');
  }
  function setQty(id, qty) {
    const items = readCart();
    items.forEach(x => { if (x.id === id) x.qty = Math.max(1, qty); });
    writeCart(items);
  }

  window.vcCart = { add: addToCart, remove: removeFromCart, setQty: setQty, read: readCart };

  /* add-to-cart buttons: any element with data-add */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    e.preventDefault();
    let qty = 1;
    const qtyInput = $('.qty input');
    if (btn.dataset.qtyFrom && qtyInput) qty = parseInt(qtyInput.value, 10) || 1;
    addToCart({
      id: btn.dataset.add,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      img: btn.dataset.img,
      qty: qty
    });
  });

  /* wishlist + compare feedback */
  document.addEventListener('click', e => {
    const w = e.target.closest('[data-wish]');
    if (w) { e.preventDefault(); toast('Saved to your wishlist.', 'fa-heart'); }
    const c = e.target.closest('[data-compare]');
    if (c) { e.preventDefault(); toast('Added to the compare list.', 'fa-code-compare'); }
  });

  /* ---------- render cart page ---------- */
  function renderCart() {
    const body = $('#cart-body');
    if (!body) return;
    const items = readCart();
    const layout = $('#cart-layout');
    const emptyBox = $('#empty-cart');

    if (!items.length) {
      if (layout) layout.style.display = 'none';
      if (emptyBox) emptyBox.style.display = '';
      return;
    }
    if (layout) layout.style.display = '';
    if (emptyBox) emptyBox.style.display = 'none';

    body.innerHTML = items.map(it => (
      '<tr>' +
        '<td><div class="cart-prod"><img src="' + it.img + '" alt="' + it.name + '">' +
        '<div><strong>' + it.name + '</strong><br><span style="color:#7b8794;font-size:13px">In stock — ships in 24h</span></div></div></td>' +
        '<td>' + money(it.price) + '</td>' +
        '<td><div class="qty"><button data-cart-down="' + it.id + '">&minus;</button>' +
        '<input type="text" value="' + it.qty + '" data-cart-qty="' + it.id + '">' +
        '<button data-cart-up="' + it.id + '">+</button></div></td>' +
        '<td><strong style="color:#10263a">' + money(it.price * it.qty) + '</strong></td>' +
        '<td><button class="remove" data-cart-del="' + it.id + '" title="Remove"><i class="fa-regular fa-trash-can"></i></button></td>' +
      '</tr>'
    )).join('');

    const sub = items.reduce((s, it) => s + it.price * it.qty, 0);
    const ship = sub > 49 ? 0 : 6.5;
    const tax = sub * 0.05;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#sum-sub', money(sub));
    set('#sum-ship', ship ? money(ship) : 'Free');
    set('#sum-tax', money(tax));
    set('#sum-total', money(sub + ship + tax));
    set('#sum-total-2', money(sub + ship + tax));
  }

  document.addEventListener('click', e => {
    const up = e.target.closest('[data-cart-up]');
    const down = e.target.closest('[data-cart-down]');
    const del = e.target.closest('[data-cart-del]');
    if (up) {
      const id = up.dataset.cartUp;
      const it = readCart().filter(x => x.id === id)[0];
      setQty(id, it.qty + 1);
    }
    if (down) {
      const id = down.dataset.cartDown;
      const it = readCart().filter(x => x.id === id)[0];
      setQty(id, it.qty - 1);
    }
    if (del) removeFromCart(del.dataset.cartDel);
  });
  document.addEventListener('change', e => {
    const q = e.target.closest('[data-cart-qty]');
    if (q) setQty(q.dataset.cartQty, parseInt(q.value, 10) || 1);
  });

  /* ---------- checkout / forms ---------- */
  const checkoutBtn = $('#checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!readCart().length) { toast('Your cart is empty.', 'fa-circle-exclamation'); return; }
      toast('Order placed — a pharmacist will confirm by phone.', 'fa-circle-check');
      localStorage.removeItem(KEY);
      paintCount();
      renderCart();
    });
  }
  $$('form.js-form').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      toast('Thank you — your message has been sent.', 'fa-paper-plane');
      f.reset();
    });
  });
  const newsForm = $('.news-form');
  if (newsForm) {
    newsForm.addEventListener('submit', e => {
      e.preventDefault();
      toast('You are subscribed to VitaCure health tips.', 'fa-envelope-circle-check');
      newsForm.reset();
    });
  }

  /* ---------- counters ---------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = parseFloat(el.dataset.count);
        let cur = 0;
        const step = target / 60;
        const tick = setInterval(() => {
          cur += step;
          if (cur >= target) { cur = target; clearInterval(tick); }
          el.textContent = el.dataset.decimals ? cur.toFixed(1) : Math.floor(cur);
        }, 22);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => io.observe(c));
  }

  /* ---------- price range label ---------- */
  const range = $('#price-range');
  if (range) {
    const out = $('#price-out');
    const upd = () => { out.textContent = '$0 — $' + range.value; };
    range.addEventListener('input', upd); upd();
  }

  /* ---------- init ---------- */
  paintCount();
  renderCart();
})();
