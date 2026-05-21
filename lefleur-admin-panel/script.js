const INACTIVITY_LIMIT = 15 * 60 * 1000;
const adminToken = localStorage.getItem("admin_token");

function updateActivity() {
  localStorage.setItem("last_activity", Date.now());
}

["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(
  (eventType) => {
    document.addEventListener(eventType, updateActivity);
  },
);

updateActivity();

if (adminToken !== "lefleur_secure_admin_token") {
  window.location.href = "login.html";
}

const modal = document.getElementById("productModal");

let isEditMode = false;

const deleteModal = document.getElementById("deleteModal");

const closeDeleteModal = document.getElementById("closeDeleteModal");

const cancelDelete = document.getElementById("cancelDelete");

const confirmDelete = document.getElementById("confirmDelete");

let editingProductCode = null;

let deletingProduct = null;

let allProducts = [];

const openModalBtn = document.getElementById("openModal");

const closeModalBtn = document.getElementById("closeModal");

const cancelModalBtn = document.getElementById("cancelModal");

openModalBtn.addEventListener("click", () => {
  document.getElementById("productImage").required = true;

  modal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  isEditMode = false;

  document.getElementById("productCode").readOnly = false;

  editingProductCode = null;

  productForm.reset();

  imagePreview.src = "";

  imagePreview.style.display = "none";

  document.getElementById("modalTitle").textContent = "Add Product";

  submitButton.textContent = "Create Product";
});

cancelModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");

  isEditMode = false;

  document.getElementById("productCode").readOnly = false;

  editingProductCode = null;

  productForm.reset();

  imagePreview.src = "";

  imagePreview.style.display = "none";

  imagePreview.classList.add("hidden");

  document.getElementById("modalTitle").textContent = "Add Product";

  submitButton.textContent = "Create Product";
});

closeDeleteModal.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
});

cancelDelete.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
});

const imageInput = document.getElementById("productImage");

const imagePreview = document.getElementById("imagePreview");

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const imageUrl = URL.createObjectURL(file);

  imagePreview.src = imageUrl;

  imagePreview.style.display = "block";
});

const toast = document.getElementById("toast");

const toastMessage = document.getElementById("toastMessage");

function showToast(message) {
  toastMessage.textContent = message;

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

const productForm = document.getElementById("productForm");

const submitButton = document.getElementById("submitButton");

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitButton.disabled = true;

  submitButton.textContent = isEditMode ? "Updating..." : "Creating...";

  const productCode = document.getElementById("productCode").value;

  const productName = document.getElementById("productName").value;

  const productCategory = document.getElementById("productCategory").value;

  const productDescription =
    document.getElementById("productDescription").value;

  const productPrice = document.getElementById("productPrice").value;

  const productImage = document.getElementById("productImage").files[0];

  const formData = new FormData();

  formData.append("product_code", productCode);

  formData.append("product_name", productName);

  formData.append("product_category", productCategory);

  formData.append("product_description", productDescription);

  formData.append("price", productPrice);

  if (productImage) {
    formData.append("image", productImage);
  }

  try {
    const apiUrl = isEditMode
      ? "https://n8n-Yu.onrender.com/webhook/update-product"
      : "https://n8n-Yu.onrender.com/webhook/add-product";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "x-admin-token": localStorage.getItem("admin_token"),
      },
      body: formData,
    });

    let result = {};

    const responseText = await response.text();

    if (responseText) {
      result = JSON.parse(responseText);
    }

    showToast(result.message);

    await loadProducts();

    modal.classList.add("hidden");

    submitButton.disabled = false;

    submitButton.textContent = "Create Product";

    isEditMode = false;

    editingProductCode = null;

    document.getElementById("modalTitle").textContent = "Add Product";

    productForm.reset();

    document.getElementById("productCode").readOnly = false;

    imagePreview.src = "";

    imagePreview.style.display = "none";

    imagePreview.classList.add("hidden");
  } catch (error) {
    console.error(error);

    showToast("Something went wrong.");

    submitButton.disabled = false;

    submitButton.textContent = "Create Product";
  }
});

const productTableBody = document.getElementById("productTableBody");

const searchInput = document.querySelector(".search-input");

function renderProducts(products) {
  productTableBody.innerHTML = "";

  products.forEach((product) => {
    if (!product) return;

    const row = document.createElement("tr");

    row.classList.add("product-row");

    row.innerHTML = `

      <td>
        <img
          src="${product.image_url || "placeholder.jpg"}"
          class="product-image"
        />
      </td>

      <td>
        <span class="mobile-label">Code:</span>
        ${product.product_code}
      </td>

      <td>
        <span class="mobile-label">Product:</span>
        ${product.product_name}
      </td>

      <td>
        <span class="mobile-label">Category:</span>
        ${product.product_category || "-"}
      </td>

      <td>
        <span class="mobile-label">Description:</span>
        ${product.product_description || "-"}
      </td>

      <td>
        <span class="mobile-label">Price:</span>
        ₱${product.price}
      </td>

      <td class="actions">

        <button
          class="edit-btn"
          data-product='${JSON.stringify(product)}'
        >
          Edit
        </button>

        <button
          class="delete-btn"
          data-code="${product.product_code}"
        >
          Delete
        </button>

      </td>
      `;
    productTableBody.appendChild(row);
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const product = JSON.parse(button.dataset.product);

      openEditModal(product);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const productCode = button.dataset.code;

      deletingProduct = allProducts.find(
        (product) => product.product_code === productCode,
      );

      deleteModal.classList.remove("hidden");
    });
  });
}

async function loadProducts() {
  try {
    const response = await fetch(
      "https://n8n-Yu.onrender.com/webhook/get-products",
      {
        headers: {
          "x-admin-token": localStorage.getItem("admin_token"),
        },
      },
    );

    if (!response.ok) {
      localStorage.removeItem("admin_token");

      window.location.href = "login.html";

      return;
    }

    let products = [];

    const responseText = await response.text();

    if (responseText) {
      products = JSON.parse(responseText);
    }

    console.log("PRODUCTS:", products);

    allProducts = products;

    renderProducts(products);
  } catch (error) {
    console.error(error);

    showToast("Failed to load products.");
  }
}

confirmDelete.addEventListener("click", async () => {
  if (!deletingProduct) return;

  try {
    confirmDelete.disabled = true;

    confirmDelete.textContent = "Deleting...";

    const response = await fetch(
      "https://n8n-Yu.onrender.com/webhook/delete-product",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token"),
        },

        body: JSON.stringify({
          product_code: deletingProduct.product_code,
        }),
      },
    );

    let result = {};

    const responseText = await response.text();

    if (responseText) {
      result = JSON.parse(responseText);
    }

    showToast(result.message || "Product deleted successfully");

    deleteModal.classList.add("hidden");

    deletingProduct = null;

    await loadProducts();
  } catch (error) {
    console.error(error);

    showToast("Failed to delete product.");
  } finally {
    confirmDelete.disabled = false;

    confirmDelete.textContent = "Delete";
  }
});

loadProducts();

setInterval(() => {
  const token = localStorage.getItem("admin_token");

  if (token !== "lefleur_secure_admin_token") {
    window.location.href = "login.html";
  }
}, 1000);

setInterval(() => {
  const lastActivity = localStorage.getItem("last_activity");

  if (!lastActivity) return;

  const inactiveTime = Date.now() - Number(lastActivity);

  if (inactiveTime > INACTIVITY_LIMIT) {
    localStorage.removeItem("admin_token");

    localStorage.removeItem("last_activity");

    showToast("Session expired due to inactivity.");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
}, 5000);

searchInput.addEventListener("input", () => {
  const searchValue = searchInput.value.toLowerCase();

  const filteredProducts = allProducts.filter((product) => {
    return (
      (product.product_name || "").toLowerCase().includes(searchValue) ||
      (product.product_code || "").toLowerCase().includes(searchValue)
    );
  });

  renderProducts(filteredProducts);
});

function openEditModal(product) {
  isEditMode = true;

  editingProductCode = product.product_code;

  document.getElementById("productCode").value = product.product_code;
  document.getElementById("productCode").readOnly = true;

  document.getElementById("productName").value = product.product_name;

  document.getElementById("productCategory").value =
    product.product_category || "";

  document.getElementById("productDescription").value =
    product.product_description;

  document.getElementById("productPrice").value = product.price;

  if (product.image_url) {
    imagePreview.src = product.image_url;

    imagePreview.style.display = "block";
  } else {
    imagePreview.style.display = "none";
  }

  imagePreview.classList.remove("hidden");

  document.getElementById("modalTitle").textContent = "Edit Product";

  submitButton.textContent = "Update Product";

  document.getElementById("productImage").required = false;

  modal.classList.remove("hidden");

  document.getElementById("productCode").readOnly = true;
}

const openGalleryPage = document.getElementById("openGalleryPage");

if (openGalleryPage) {
  openGalleryPage.addEventListener("click", () => {
    window.location.href = "gallery.html";
  });
}
