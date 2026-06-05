/* ============================================
   HEADER SCROLL BEHAVIOUR
   ============================================ */
const header = document.querySelector('.site-header');

if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ============================================
   MOBILE NAV
   ============================================ */
const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.getElementById('mobile-nav');
const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
const mobileNavClose = document.querySelector('.mobile-nav__close');

function openMobileNav() {
  mobileNav?.classList.add('open');
  mobileNavOverlay?.classList.add('open');
  navToggle?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
  mobileNav?.classList.remove('open');
  mobileNavOverlay?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

navToggle?.addEventListener('click', openMobileNav);
mobileNavClose?.addEventListener('click', closeMobileNav);
mobileNavOverlay?.addEventListener('click', closeMobileNav);

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

cartToggle?.addEventListener('click', () => {
  renderCartDrawer();
  openCart();
});
cartClose?.addEventListener('click', closeCart);
cartOverlay?.addEventListener('click', closeCart);

/* ============================================
   CART RENDERING
   ============================================ */
function formatMoney(cents) {
  const amount = cents / 100;
  return '£' + (Number.isInteger(amount) ? amount.toString() : amount.toFixed(2));
}

async function renderCartDrawer() {
  const itemsEl = document.getElementById('cart-drawer-items');
  const totalEl = document.getElementById('cart-drawer-total');
  const countEl = document.querySelector('.cart-icon__count');

  try {
    const res = await fetch('/cart.js');
    const cart = await res.json();

    // Update count badge
    if (countEl) {
      countEl.textContent = cart.item_count;
      countEl.style.display = cart.item_count > 0 ? 'flex' : 'none';
    }

    // Update total
    if (totalEl) totalEl.textContent = formatMoney(cart.total_price);

    // Render items
    if (!itemsEl) return;

    if (cart.item_count === 0) {
      itemsEl.innerHTML = '<p style="color:var(--color-text-muted);font-size:0.875rem;padding:2rem 0;">Your cart is empty.</p>';
      return;
    }

    itemsEl.innerHTML = cart.items.map(item => {
      const imageUrl = item.image
        ? item.image.replace(/(\.[^.]+)$/, '_160x$1')
        : '';
      const imageHtml = imageUrl
        ? `<img class="cart-item__image" src="${imageUrl}" alt="${item.product_title}" width="72" loading="lazy">`
        : `<div class="cart-item__image cart-item__image--placeholder"></div>`;

      return `
        <div class="cart-item" data-key="${item.key}">
          ${imageHtml}
          <div class="cart-item__info">
            <div>
              <p class="cart-item__name">${item.product_title}</p>
              <p class="cart-item__variant">${item.variant_title !== 'Default Title' ? item.variant_title : ''}</p>
            </div>
            <div class="cart-item__bottom">
              <div class="cart-item__qty">
                <button data-cart-qty-change="-1" data-key="${item.key}" aria-label="Decrease quantity">-</button>
                <span>${item.quantity}</span>
                <button data-cart-qty-change="1" data-key="${item.key}" aria-label="Increase quantity">+</button>
              </div>
              <span class="cart-item__price">${formatMoney(item.line_price)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

renderCartDrawer();

/* ============================================
   CART QTY CONTROLS
   ============================================ */
document.addEventListener('click', async (e) => {
  if (!e.target.matches('[data-cart-qty-change]')) return;
  const key = e.target.dataset.key;
  const delta = parseInt(e.target.dataset.cartQtyChange);

  try {
    const cartRes = await fetch('/cart.js');
    const cart = await cartRes.json();
    const item = cart.items.find(i => i.key === key);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);

    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: newQty }),
    });

    await renderCartDrawer();
  } catch (err) {
    console.error(err);
  }
});

/* ============================================
   PRODUCT IMAGE GALLERY
   ============================================ */
const thumbs = document.querySelectorAll('.gallery-thumb');
const mainImage = document.getElementById('gallery-main-img');

thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    thumbs.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    if (mainImage && thumb.dataset.full) {
      mainImage.style.opacity = '0';
      mainImage.src = thumb.dataset.full;
      mainImage.onload = () => { mainImage.style.opacity = '1'; };
    }
  });
});

/* ============================================
   PRODUCT VARIANT SELECTION + PRICE UPDATE
   ============================================ */
const variantBtns = document.querySelectorAll('.variant-btn');
const variantSelect = document.querySelector('select[name="id"]');
const priceLabelEl = document.getElementById('price-label');
const priceFromEl = document.getElementById('price-from');

if (window.productVariants && variantBtns.length > 0) {
  const variants = window.productVariants;
  const selectedOptions = {};

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
    const priceFormatted = formatMoney(variant.price);
    if (priceLabelEl) {
      if (priceFromEl) priceFromEl.remove();
      priceLabelEl.textContent = priceFormatted;
    }
    if (stickyAtcPrice) stickyAtcPrice.textContent = priceFormatted;
    const available = variant.available;
    [mainAtcBtn, stickyAtcBtn].forEach(btn => {
      if (!btn) return;
      btn.disabled = !available;
      btn.textContent = available ? 'Add to Cart' : 'Sold Out';
    });
    // Switch main image to variant image if available
    if (variant.featured_image && mainImage) {
      const fullSrc = variant.featured_image.src.replace(/_\d+x\d+[^.]*(\.[a-z]+)/, '$1');
      mainImage.style.opacity = '0';
      mainImage.src = fullSrc;
      mainImage.onload = () => { mainImage.style.opacity = '1'; };
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

  applyVariant(findVariant());
}

/* ============================================
   STICKY ADD TO CART
   ============================================ */
const stickyAtc = document.getElementById('sticky-atc');
const mainAtcBtn = document.getElementById('main-atc-btn');
const stickyAtcBtn = document.getElementById('sticky-atc-btn');
const stickyAtcPrice = document.getElementById('sticky-atc-price');

if (stickyAtc && mainAtcBtn) {
  const observer = new IntersectionObserver(
    ([entry]) => { stickyAtc.classList.toggle('visible', !entry.isIntersecting); },
    { threshold: 0, rootMargin: '0px 0px -20px 0px' }
  );
  observer.observe(mainAtcBtn);

  // Sync sticky price when variant changes
  if (stickyAtcPrice && priceLabelEl) {
    new MutationObserver(() => {
      stickyAtcPrice.textContent = priceLabelEl.textContent;
    }).observe(priceLabelEl, { childList: true, subtree: true, characterData: true });
  }

  // Sticky button triggers the main form submit
  stickyAtcBtn?.addEventListener('click', () => {
    mainAtcBtn.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

/* ============================================
   PRODUCT DETAILS ACCORDION
   ============================================ */
document.querySelectorAll('.product-detail').forEach(detail => {
  detail.addEventListener('click', () => {
    const isOpen = detail.classList.contains('open');
    document.querySelectorAll('.product-detail').forEach(d => d.classList.remove('open'));
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
      const res = await fetch('/cart/add.js', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Add to cart failed');
      await renderCartDrawer();
      openCart();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Try again';
    } finally {
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.disabled = false;
      }, 1000);
    }
  });
}

/* ============================================
   SERIES FILTER (collection page)
   ============================================ */
document.querySelectorAll('[data-series-filter]').forEach(filter => {
  filter.addEventListener('click', () => {
    document.querySelectorAll('[data-series-filter]').forEach(f => f.classList.remove('active'));
    filter.classList.add('active');
    const series = filter.dataset.seriesFilter;
    document.querySelectorAll('[data-series]').forEach(card => {
      const show = series === 'all' || card.dataset.series === series;
      card.closest('.product-card').style.display = show ? '' : 'none';
    });
  });
});
