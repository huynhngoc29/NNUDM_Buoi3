// API URL
const API_URL = "https://api.escuelajs.co/api/v1/products";

// Biến global để lưu trữ danh sách sản phẩm
let allProducts = [];
let filteredProducts = []; // Sản phẩm sau khi tìm kiếm
let currentPage = 1;
let pageSize = 10;
let currentSort = { column: null, order: null }; // Lưu trạng thái sắp xếp

// Hàm getAll để lấy danh sách sản phẩm từ API
async function getAll() {
  try {
    // Hiển thị loading
    document.getElementById("productTable").innerHTML =
      '<div class="loading">Đang tải dữ liệu...</div>';

    // Gọi API
    const response = await fetch(API_URL);

    // Kiểm tra response
    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu từ API");
    }

    // Chuyển đổi response sang JSON
    const products = await response.json();

    // Lưu vào biến global
    allProducts = products;
    filteredProducts = products;
    currentPage = 1;

    // Hiển thị phân trang
    document.getElementById("paginationContainer").style.display = "flex";

    // Hiển thị dữ liệu lên bảng với phân trang
    displayProductsWithPagination();

    return products;
  } catch (error) {
    console.error("Lỗi:", error);
    document.getElementById("productTable").innerHTML =
      `<div class="error">Lỗi: ${error.message}</div>`;
  }
}

// Hàm hiển thị sản phẩm lên bảng
function displayProducts(products) {
  console.log("Displaying products:", products.length); // Debug

  // Tạo HTML cho bảng
  let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th class="sortable-header" onclick="sortProducts('title')">
                        Tên sản phẩm
                        <span class="sort-icon ${currentSort.column === "title" ? (currentSort.order === "asc" ? "asc active" : "desc active") : "default"}"></span>
                    </th>
                    <th class="sortable-header" onclick="sortProducts('price')">
                        Giá
                        <span class="sort-icon ${currentSort.column === "price" ? (currentSort.order === "asc" ? "asc active" : "desc active") : "default"}"></span>
                    </th>
                    <th>Danh mục</th>
                    <th>Hình ảnh</th>
                </tr>
            </thead>
            <tbody>
    `;

  // Thêm dữ liệu sản phẩm vào bảng
  products.forEach((product) => {
    // Xử lý hình ảnh - hiển thị tất cả hình
    let imagesHTML = '<div class="image-gallery">';
    let imageCount = 0;

    if (product.images && product.images.length > 0) {
      product.images.forEach((image, index) => {
        // Xử lý URL hình ảnh
        let cleanImage = image;
        if (typeof image === "string") {
          cleanImage = image.replace(/[\[\]"]/g, "").trim();
        }

        // Kiểm tra URL hợp lệ
        if (
          cleanImage &&
          (cleanImage.startsWith("http://") ||
            cleanImage.startsWith("https://"))
        ) {
          // Ưu tiên dùng ảnh category nếu ảnh sản phẩm là placeholder
          let imageUrl = cleanImage;
          if (
            cleanImage.includes("placehold.co") &&
            product.category &&
            product.category.image
          ) {
            imageUrl = product.category.image;
          }

          // Thêm referrerPolicy để bypass restrictions
          imagesHTML += `<img src="${imageUrl}" 
            alt="${product.title}" 
            class="product-image" 
            referrerpolicy="no-referrer"
            crossorigin="anonymous"
            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect fill=%22%23ddd%22 width=%2280%22 height=%2280%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%23666%22%3E📷 ${index + 1}%3C/text%3E%3C/svg%3E';" 
            onload="this.style.opacity='1';">`;
          imageCount++;
        }
      });
    }

    // Nếu không có hình nào, hiển thị ảnh category
    if (imageCount === 0 && product.category && product.category.image) {
      imagesHTML += `<img src="${product.category.image}" 
        alt="${product.title}" 
        class="product-image" 
        referrerpolicy="no-referrer"
        crossorigin="anonymous"
        onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect fill=%22%23ddd%22 width=%2280%22 height=%2280%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%23666%22%3ENo Image%3C/text%3E%3C/svg%3E';" 
        onload="this.style.opacity='1';">`;
      imageCount++;
    }

    // Nếu vẫn không có hình, hiển thị placeholder
    if (imageCount === 0) {
      imagesHTML += `<div class="no-image-text">📷 Không có ảnh</div>`;
    }
    imagesHTML += "</div>";

    // Tạo row cho mỗi sản phẩm
    const description = product.description || "Không có mô tả";
    tableHTML += `
            <tr>
                <td>${product.id}</td>
                <td class="description-cell">
                    ${product.title}
                    <span class="description-indicator" title="Hover để xem mô tả">ⓘ</span>
                    <div class="description-tooltip">
                        <strong>Mô tả:</strong><br>
                        ${description}
                    </div>
                </td>
                <td>$${product.price}</td>
                <td>${product.category ? product.category.name : "N/A"}</td>
                <td>${imagesHTML}</td>
            </tr>
        `;
  });

  tableHTML += `
            </tbody>
        </table>
    `;

  // Hiển thị bảng
  document.getElementById("productTable").innerHTML = tableHTML;
}

// Hàm hiển thị sản phẩm với phân trang
function displayProductsWithPagination() {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

  displayProducts(productsToDisplay);
  updatePaginationUI();
  updateSearchResults(filteredProducts.length, allProducts.length);
}

// Hàm cập nhật giao diện phân trang
function updatePaginationUI() {
  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  // Cập nhật thông tin trang
  const pageInfo = document.getElementById("pageInfo");
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredProducts.length);
  pageInfo.textContent = `Hiển thị ${startItem}-${endItem} trong ${filteredProducts.length} sản phẩm`;

  // Cập nhật nút Previous/Next
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;

  // Tạo số trang
  const pageNumbers = document.getElementById("pageNumbers");
  pageNumbers.innerHTML = "";

  // Hiển thị tối đa 5 số trang
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    pageBtn.className = i === currentPage ? "active" : "";
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      displayProductsWithPagination();
    });
    pageNumbers.appendChild(pageBtn);
  }
}

// Hàm sắp xếp sản phẩm
function sortProducts(column) {
  // Xác định thứ tự sắp xếp
  if (currentSort.column === column) {
    // Nếu đang sắp xếp cột này, đổi thứ tự
    if (currentSort.order === "asc") {
      currentSort.order = "desc";
    } else if (currentSort.order === "desc") {
      // Reset về mặc định
      currentSort.column = null;
      currentSort.order = null;
      currentPage = 1;
      displayProductsWithPagination();
      return;
    }
  } else {
    // Sắp xếp cột mới, bắt đầu với tăng dần
    currentSort.column = column;
    currentSort.order = "asc";
  }

  // Thực hiện sắp xếp
  filteredProducts.sort((a, b) => {
    let valueA, valueB;

    if (column === "title") {
      valueA = a.title.toLowerCase();
      valueB = b.title.toLowerCase();
    } else if (column === "price") {
      valueA = a.price;
      valueB = b.price;
    }

    if (currentSort.order === "asc") {
      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
      return 0;
    } else {
      if (valueA > valueB) return -1;
      if (valueA < valueB) return 1;
      return 0;
    }
  });

  // Reset về trang 1 và hiển thị lại
  currentPage = 1;
  displayProductsWithPagination();
}

// Hàm tìm kiếm sản phẩm theo title
function searchProducts(searchText) {
  const keyword = searchText.toLowerCase().trim();

  if (keyword === "") {
    // Nếu không có từ khóa, hiển thị tất cả
    filteredProducts = [...allProducts];
  } else {
    // Lọc sản phẩm theo title
    filteredProducts = allProducts.filter((product) =>
      product.title.toLowerCase().includes(keyword),
    );
  }

  // Áp dụng lại sắp xếp nếu đang có
  if (currentSort.column) {
    const tempSort = { ...currentSort };
    currentSort = { column: null, order: null };
    sortProducts(tempSort.column);
    if (tempSort.order === "desc") {
      sortProducts(tempSort.column);
    }
  } else {
    // Reset về trang 1 khi tìm kiếm
    currentPage = 1;
    displayProductsWithPagination();
  }
}

// Hàm cập nhật thông tin kết quả tìm kiếm
function updateSearchResults(found, total) {
  const resultsDiv = document.getElementById("searchResults");
  if (found === total) {
    resultsDiv.textContent = `Hiển thị tất cả ${total} sản phẩm`;
  } else {
    resultsDiv.textContent = `Tìm thấy ${found} sản phẩm (trong tổng số ${total} sản phẩm)`;
  }
}

// Event listener cho nút tải sản phẩm
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("loadProducts").addEventListener("click", getAll);

  // Event listener cho input tìm kiếm (onChange)
  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      searchProducts(e.target.value);
    });

  // Event listener cho page size selector
  document.getElementById("pageSize").addEventListener("change", function (e) {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    displayProductsWithPagination();
  });

  // Event listener cho nút Previous
  document.getElementById("prevPage").addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      displayProductsWithPagination();
    }
  });

  // Event listener cho nút Next
  document.getElementById("nextPage").addEventListener("click", function () {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      displayProductsWithPagination();
    }
  });

  // Tự động tải sản phẩm khi trang load
  getAll();
});
