<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $brand = $_GET['brand'] ?? null;
  $category = $_GET['category'] ?? null;
  $isActive = isset($_GET['isActive']) ? $_GET['isActive'] : null;

  $sql = 'SELECT * FROM products WHERE 1=1';
  $params = [];
  if ($brand !== null && $brand !== '') {
    $sql .= ' AND brand = ?';
    $params[] = $brand;
  }
  if ($category !== null && $category !== '') {
    $sql .= ' AND category = ?';
    $params[] = $category;
  }
  if ($isActive !== null && $isActive !== '') {
    $sql .= ' AND is_active = ?';
    $params[] = ($isActive === 'true' || $isActive === '1') ? 1 : 0;
  }
  $sql .= ' ORDER BY name ASC';

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll();

  $products = array_map(function ($row) {
    return [
      'id' => $row['id'],
      'brand' => $row['brand'],
      'category' => $row['category'],
      'subCategory' => $row['sub_category'] ?: null,
      'folderName' => $row['folder_name'] ?: null,
      'name' => $row['name'],
      'sku' => $row['sku'],
      'description' => $row['description'],
      'price' => $row['price'] !== null ? (float)$row['price'] : null,
      'unitsPerPackage' => $row['units_per_package'] !== null ? (int)$row['units_per_package'] : null,
      'imageReference' => $row['image_reference'] ?? '',
      'galleryImageReferences' => $row['gallery_image_references'] ? (json_decode($row['gallery_image_references'], true) ?: []) : [],
      'isActive' => (bool)$row['is_active'],
      'createdAt' => $row['created_at'],
      'updatedAt' => $row['updated_at'],
    ];
  }, $rows);

  api_response(['ok' => true, 'products' => $products]);
}

$payload = api_read_json();
$action = $payload['action'] ?? '';

if ($action === 'upsertMany') {
  $products = $payload['products'] ?? [];
  $stmt = $pdo->prepare(
    'INSERT INTO products (id, brand, category, sub_category, folder_name, name, sku, description, price, units_per_package, image_reference, gallery_image_references, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       brand = VALUES(brand),
       category = VALUES(category),
       sub_category = VALUES(sub_category),
       folder_name = VALUES(folder_name),
       name = VALUES(name),
       sku = VALUES(sku),
       description = VALUES(description),
       price = VALUES(price),
       units_per_package = VALUES(units_per_package),
       image_reference = VALUES(image_reference),
       gallery_image_references = VALUES(gallery_image_references),
       is_active = VALUES(is_active),
       created_at = VALUES(created_at),
       updated_at = VALUES(updated_at)'
  );

  foreach ($products as $product) {
    $stmt->execute([
      $product['id'] ?? '',
      $product['brand'] ?? 'piaa',
      $product['category'] ?? '',
      $product['subCategory'] ?? null,
      $product['folderName'] ?? null,
      $product['name'] ?? '',
      $product['sku'] ?? '',
      $product['description'] ?? '',
      isset($product['price']) ? $product['price'] : null,
      isset($product['unitsPerPackage']) ? $product['unitsPerPackage'] : null,
      $product['imageReference'] ?? '',
      json_encode($product['galleryImageReferences'] ?? []),
      !empty($product['isActive']) ? 1 : 0,
      $product['createdAt'] ?? date('c'),
      $product['updatedAt'] ?? date('c'),
    ]);
  }

  api_response(['ok' => true, 'updated' => count($products)]);
}

if ($action === 'remove') {
  $id = $payload['productId'] ?? '';
  $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
  $stmt->execute([$id]);
  api_response(['ok' => true]);
}

if ($action === 'clear') {
  $pdo->exec('DELETE FROM products');
  api_response(['ok' => true]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
