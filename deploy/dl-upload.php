<?php
/**
 * AiMelody HTTP upload receiver for dl.aimelody.ir
 *
 * نصب:
 * 1) این فایل را از File Manager هاست (نه FTP از ویندوز) در روت دامنه dl آپلود کن
 *    مثلاً: public_html/upload.php  →  https://dl.aimelody.ir/upload.php
 * 2) مقدار $SECRET را با DL_HTTP_UPLOAD_SECRET در .env.local یکی کن
 * 3) پوشه‌های audio / video / covers / avatars باید قابل نوشتن باشند (۷۵۵ یا ۷۷۵)
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// همین مقدار را در .env.local به‌عنوان DL_HTTP_UPLOAD_SECRET بگذار
$SECRET = 'aimelody-dl-http-upload-change-me';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'method not allowed']);
  exit;
}

$given = $_POST['secret'] ?? ($_SERVER['HTTP_X_UPLOAD_SECRET'] ?? '');
if (!hash_equals($SECRET, (string) $given)) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

$path = (string) ($_POST['path'] ?? '');
$path = str_replace('\\', '/', $path);
$path = ltrim($path, '/');

if (!preg_match('#^(audio|video|covers|avatars)/\d{4}/\d{2}/[A-Za-z0-9._-]+$#', $path)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'invalid path']);
  exit;
}

if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'file missing']);
  exit;
}

if (($_FILES['file']['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'upload error ' . ($_FILES['file']['error'] ?? '?')]);
  exit;
}

$maxBytes = 200 * 1024 * 1024;
if (($_FILES['file']['size'] ?? 0) > $maxBytes) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'file too large']);
  exit;
}

$dir = dirname($path);
if ($dir !== '.' && !is_dir($dir)) {
  if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mkdir failed']);
    exit;
  }
}

if (!move_uploaded_file($_FILES['file']['tmp_name'], $path)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'move failed']);
  exit;
}

echo json_encode([
  'ok' => true,
  'path' => $path,
  'bytes' => filesize($path) ?: 0,
]);
