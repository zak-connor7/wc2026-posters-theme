/* ============================================
   HEADER SCROLL BEHAVIOUR
   ============================================ */
const header = document.querySelector('.site-header');

if (header) {
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ============================================
   CART DRAWER
   ============================================ */
const cartDrawer = document.querySelector('.cart-drawer');
const cartOverlay = document.querySelector('.cart-drawer__overlay');
const cartClose = document.querySelector('.cart-drawer__close');
const cartToggle = document.querySelector('[data-cart-toggle]');

function openCart() {
  cartDrawer?.classList.add('open');
  cartOverlay?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer?.classList.remove('open');
  cartOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

cartToggle?.addEventListener('click', openCart);
cartClose?.addEventListener('click', closeCart);
cartOverlay?.addEventListener('click', closeCart);

/* ============================================
   PRODUCT IMAGE GALLERY
   ============================================ */
const thumbs = document.querySelectorAll('.gallery-thumb');
const mainImage = document.querySelector('.product-page__gallery-main');

thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    thumbs.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    if (mainImage) mainImage.src = thumb.src.replace('_80x80', '');
  });
});

/* ============================================
   PRODUCT VARIANT SELECTION
   ============================================ */
const variantBtns = document.querySelectorAll('.variant-btn');

variantBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.closest('.variant-options');
    group?.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

/* ============================================
   PRODUCT DETAILS ACCORDION
   ============================================ */
const productDetails = document.querySelectorAll('.product-detail');

productDetails.forEach(detail => {
  detail.addEventListener('click', () => {
    const isOpen = detail.classList.contains('open');
    productDetails.forEach(d => d.classList.remove('open'));
    if (!isOpen) detail.classList.add('open');
  });
});

/* ============================================
   ADD TO CART
   ============================================ */
const addToCartForm = document.querySelector('[data-add-to-cart-form]');

if (addToCartForm) {
  addToCartForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = addToCartForm.querySelector('.product-page__add');
    const formData = new FormData(addToCartForm);

    btn.textContent = 'Adding...';
    btn.disabled = true;

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
      });
      await res.json();
      await refreshCartCount();
      openCart();
    } catch (err) {
      console.error(err);
    } finally {
      btn.textContent = 'Add to Cart';
      btn.disabled = false;
    }
  });
}

/* ============================================
   CART COUNT + UPDATE
   ============================================ */
async function refreshCartCount() {
  try {
    const res = await fetch('/cart.js');
    const cart = await res.json();
    const countEl = document.querySelector('.cart-icon__count');
    if (countEl) {
      countEl.textContent = cart.item_count;
      countEl.style.display = cart.item_count > 0 ? 'flex' : 'none';
    }
  } catch (err) {
    console.error(err);
  }
}

refreshCartCount();

/* ============================================
   CART QTY CONTROLS
   ============================================ */
document.addEventListener('click', async (e) => {
  if (e.target.matches('[data-cart-qty-change]')) {
    const key = e.target.dataset.key;
    const qty = parseInt(e.target.dataset.cartQtyChange);
    await updateCartItem(key, qty);
  }
});

async function updateCartItem(key, quantityDelta) {
  try {
    const cartRes = await fetch('/cart.js');
    const cart = await cartRes.json();
    const item = cart.items.find(i => i.key === key);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + quantityDelta);

    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: newQty }),
    });

    location.reload();
  } catch (err) {
    console.error(err);
  }
}

/* ============================================
   SERIES FILTER (collection page)
   ============================================ */
const seriesFilters = document.querySelectorAll('[data-series-filter]');

seriesFilters.forEach(filter => {
  filter.addEventListener('click', () => {
    seriesFilters.forEach(f => f.classList.remove('active'));
    filter.classList.add('active');
    const series = filter.dataset.seriesFilter;
    filterProducts(series);
  });
});

function filterProducts(series) {
  const cards = document.querySelectorAll('[data-series]');
  cards.forEach(card => {
    const show = series === 'all' || card.dataset.series === series;
    card.closest('.product-card').style.display = show ? '' : 'none';
  });
}
