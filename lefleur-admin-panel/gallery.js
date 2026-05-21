const galleryGrid = document.getElementById("galleryGrid");

const galleryProductSelect = document.getElementById("galleryProductSelect");

const backToProducts = document.getElementById("backToProducts");
const uploadGalleryImageBtn = document.getElementById("uploadGalleryImageBtn");

const galleryImageInput = document.getElementById("galleryImageInput");

backToProducts.addEventListener("click", () => {
  window.location.href = "index.html";
});

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

    const products = await response.json();

    galleryProductSelect.innerHTML = `
      <option value="">
        Select Product
      </option>
    `;

    products.forEach((product) => {
      if (!product.product_code) return;

      const option = document.createElement("option");

      option.value = product.product_code;

      option.textContent = `${product.product_name}
        (${product.product_code})`;

      galleryProductSelect.appendChild(option);
    });
  } catch (error) {
    console.error(error);

    alert("Failed to load products");
  }
}

loadProducts();

galleryProductSelect.addEventListener("change", async () => {
  const productCode = galleryProductSelect.value;

  if (!productCode) {
    galleryGrid.innerHTML = `
        <div class="gallery-empty">
          Select a product to view gallery
        </div>
      `;

    return;
  }

  await loadGallery(productCode);
});

async function loadGallery(productCode) {
  try {
    galleryGrid.innerHTML = `
      <div class="gallery-empty">
        Loading gallery...
      </div>
    `;

    const response = await fetch(
      `https://n8n-Yu.onrender.com/webhook/get-products-gallery?product_code=${productCode}`,
      {
        headers: {
          "x-admin-token": localStorage.getItem("admin_token"),
        },
      },
    );

    const gallery = await response.json();

    if (!gallery.length) {
      galleryGrid.innerHTML = `
        <div class="gallery-empty">
          No gallery images yet
        </div>
      `;

      return;
    }

    renderGallery(gallery);
  } catch (error) {
    console.error(error);

    galleryGrid.innerHTML = `
      <div class="gallery-empty">
        Failed to load gallery
      </div>
    `;
  }
}

function renderGallery(images) {
  galleryGrid.innerHTML = "";

  images.forEach((image) => {
    const card = document.createElement("div");

    card.classList.add("gallery-card");

    card.innerHTML = `

        <img
            src="${image.product_list_image_url}"
        />

        <button
            class="gallery-delete-btn"
            data-public-id="${image.product_list_cloudinary_public_id}"
        >
            Delete
        </button>

        `;

    galleryGrid.appendChild(card);
    card.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        document.querySelectorAll(".gallery-card").forEach((item) => {
          item.classList.remove("active");
        });

        card.classList.add("active");
      }
    });
    const deleteBtn = card.querySelector(".gallery-delete-btn");

    deleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();

      const confirmed = confirm("Delete this image?");

      if (!confirmed) return;

      await deleteGalleryImage(image.product_list_cloudinary_public_id);
    });
  });
}

uploadGalleryImageBtn.addEventListener("click", () => {
  if (!galleryProductSelect.value) {
    alert("Please select a product first");

    return;
  }

  galleryImageInput.click();
});
galleryImageInput.addEventListener("change", async () => {
  const file = galleryImageInput.files[0];

  if (!file) return;

  try {
    uploadGalleryImageBtn.disabled = true;

    uploadGalleryImageBtn.textContent = "Uploading...";

    const formData = new FormData();

    formData.append("product_code", galleryProductSelect.value);

    formData.append("image", file);

    const response = await fetch(
      "https://n8n-Yu.onrender.com/webhook/add-product-gallery-image",
      {
        method: "POST",

        headers: {
          "x-admin-token": localStorage.getItem("admin_token"),
        },

        body: formData,
      },
    );

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Upload failed");

      return;
    }

    galleryImageInput.value = "";

    await loadGallery(galleryProductSelect.value);
  } catch (error) {
    console.error(error);

    alert("Failed to upload image");
  } finally {
    uploadGalleryImageBtn.disabled = false;

    uploadGalleryImageBtn.textContent = "+ Upload Image";
  }
});

async function deleteGalleryImage(publicId) {
  try {
    const response = await fetch(
      "https://n8n-Yu.onrender.com/webhook/delete-product-gallery-image",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "x-admin-token": localStorage.getItem("admin_token"),
        },

        body: JSON.stringify({
          public_id: publicId,
        }),
      },
    );

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Delete failed");

      return;
    }

    await loadGallery(galleryProductSelect.value);
  } catch (error) {
    console.error(error);

    alert("Failed to delete image");
  }
}
