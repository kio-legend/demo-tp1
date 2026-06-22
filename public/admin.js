const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});

const ordersEl = document.querySelector("#orders");
const refreshButton = document.querySelector("#refresh-orders");

async function loadOrders() {
  const response = await fetch("/api/admin/orders");
  const data = await response.json();

  ordersEl.innerHTML = data.orders
    .map(
      (order) => `
        <tr>
          <td>${order.id}</td>
          <td>${order.customer}</td>
          <td>${formatter.format(order.total)}</td>
          <td><span class="status">${order.status}</span></td>
        </tr>
      `
    )
    .join("");
}

refreshButton.addEventListener("click", loadOrders);
loadOrders();
