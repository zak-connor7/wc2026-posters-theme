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
   PRODUCT VARIANT SELECTION + PRICE UPDATE
   ============================================ */
const variantBtns = document.querySelectorAll('.variant-btn');
const variantSelect = document.querySelector('select[name="id"]');
const priceLabelEl = document.getElementById('price-label');
const priceFromEl = document.getElementById('price-from');

function formatMoney(cents) {
  const amount = cents / 100;
  return '£' + (Number.isInteger(amount) ? amount.toString() : amount.toFixed(2));
}

if (window.productVariants && variantBtns.length > 0) {
  const variants = window.productVariants;
  const selectedOptions = {};

  // Initialise from the first variant's options
  (variants[0]?.options || []).forEach((val, i) => {
    selectedOptions[i + 1] = val;
  });

  function findVariant() {
    return variants.find(v =>
      v.options.every((opt, i) => opt === selectedOptions[i + 1])
    ) || null;
  }

  function applyVariant(variant) {
    if (!variant) return;
    if (variantSelect) variantSelect.value = variant.id;
    if (priceLabelEl) {
      // Once user has made a choice, drop the "From" label
      if (priceFromEl) priceFromEl.remove();
      priceLabelEl.textContent = formatMoney(variant.price);
    }
    const addBtn = document.querySelector('.product-page__add');
    if (addBtn) {
      addBtn.disabled = !variant.available;
      addBtn.textContent = variant.available ? 'Add to Cart' : 'Sold Out';
    }
  }

  variantBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.variant-options');
      group?.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedOptions[parseInt(btn.dataset.option)] = btn.dataset.value;
      applyVariant(findVariant());
    });
  });

  // Sync select to first available variant on load
  applyVariant(findVariant());
}

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
