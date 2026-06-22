const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});

const productsEl = document.querySelector("#products");

async function loadProducts() {
  const response = await fetch("/api/products");
  const products = await response.json();

  productsEl.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <img src="${product.image}" alt="${product.name}" />
          <div class="product-body">
            <span class="swatch ${product.color}"></span>
            <h3>${product.name}</h3>
            <p>${product.stock} bouquets disponibles</p>
            <div class="card-footer">
              <strong>${formatter.format(product.price)}</strong>
              <button type="button">Ajouter</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

loadProducts();
