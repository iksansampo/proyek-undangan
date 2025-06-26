<?php
// ==========================================================
// === File: api/upload_media.php (dengan Kompresi Cerdas) ===
// ==========================================================

ini_set('display_errors', 1); error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

function send_json_error($statusCode, $message, $details = "") { http_response_code($statusCode); echo json_encode(['status' => 'error', 'message' => $message, 'details' => $details]); exit(); }

/**
 * Mengubah ukuran dan mengompres gambar JIKA DIPERLUKAN.
 * @param string $source Path ke file gambar asli.
 * @param string $destination Path untuk menyimpan gambar baru.
 * @param int $quality Kualitas kompresi (0-100).
 * @param int $maxWidth Lebar maksimal gambar.
 * @param int $maxSizeKB Batas ukuran file dalam KB. Jika di bawah ini, tidak akan dikompres ulang.
 * @return bool True jika berhasil, false jika gagal.
 */
function processImage($source, $destination, $quality = 75, $maxWidth = 1920, $maxSizeKB = 500) {
    if (!extension_loaded('gd') || !function_exists('gd_info')) {
        send_json_error(500, 'Server Error: GD Library tidak aktif di PHP.');
    }
    
    // --- LOGIKA CERDAS: Cek Ukuran Asli ---
    // Jika file asli sudah kecil, jangan kompres ulang, cukup pindahkan.
    if (filesize($source) / 1024 < $maxSizeKB) {
        return move_uploaded_file($source, $destination);
    }
    
    $info = @getimagesize($source);
    if ($info === false) { send_json_error(500, 'Gagal membaca informasi gambar.'); }

    $mime = $info['mime'];
    list($width_orig, $height_orig) = $info;

    $ratio = $width_orig / $height_orig;
    $width = $width_orig > $maxWidth ? $maxWidth : $width_orig;
    $height = $width > $maxWidth ? $maxWidth / $ratio : $height_orig;
    
    $image_p = imagecreatetruecolor($width, $height);
    $image = null;

    switch ($mime) {
        case 'image/jpeg': $image = @imagecreatefromjpeg($source); break;
        case 'image/png': $image = @imagecreatefrompng($source); imagealphablending($image_p, false); imagesavealpha($image_p, true); break;
        case 'image/gif': $image = @imagecreatefromgif($source); break;
        case 'image/webp': if (function_exists('imagecreatefromwebp')) { $image = @imagecreatefromwebp($source); } else { send_json_error(500, 'Dukungan WEBP tidak aktif di GD server ini.'); } break;
        default: send_json_error(400, "Tipe gambar tidak didukung: {$mime}");
    }

    if ($image === false) { send_json_error(500, 'Gagal membuat gambar dari sumber file.'); }

    imagecopyresampled($image_p, $image, 0, 0, 0, 0, $width, $height, $width_orig, $height_orig);

    $success = false;
    switch ($mime) {
        case 'image/jpeg': $success = @imagejpeg($image_p, $destination, $quality); break;
        case 'image/png': $pngQuality = 9 - round(($quality / 100) * 9); $success = @imagepng($image_p, $destination, $pngQuality); break;
        case 'image/gif': $success = @imagegif($image_p, $destination); break;
        case 'image/webp': $success = @imagewebp($image_p, $destination, $quality); break;
    }

    imagedestroy($image);
    imagedestroy($image_p);
    return $success;
}

// --- Proses Upload Utama ---
session_start();
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) { send_json_error(401, 'Akses ditolak.'); }

if (!isset($_FILES['mediaFile'])) { send_json_error(400, 'Request tidak valid.'); }
$file = $_FILES['mediaFile'];

if ($file['error'] !== UPLOAD_ERR_OK) { send_json_error(500, 'Error internal upload PHP.'); }

$max_size = 50 * 1024 * 1024; if ($file['size'] > $max_size) { send_json_error(400, "File terlalu besar."); }
$allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
$file_mime_type = mime_content_type($file['tmp_name']);
if (!in_array($file_mime_type, $allowed_types)) { send_json_error(400, "Tipe file tidak diizinkan."); }

$upload_dir = __DIR__ . '/uploads/';
if (!is_dir($upload_dir) && !mkdir($upload_dir, 0775, true)) { send_json_error(500, 'Gagal membuat direktori upload.'); }
if (!is_writable($upload_dir)) { send_json_error(500, "Direktori /api/uploads/ tidak bisa ditulis."); }

$file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$prefix = 'file_';
if (strpos($file_mime_type, 'image/') === 0) $prefix = 'img_';
if (strpos($file_mime_type, 'video/') === 0) $prefix = 'vid_';
if (strpos($file_mime_type, 'audio/') === 0) $prefix = 'aud_';

$unique_filename = $prefix . uniqid('', true) . '.' . $file_extension;
$destination = $upload_dir . $unique_filename;

$isImage = strpos($file_mime_type, 'image/') === 0;
$processed = false;

if ($isImage) {
    // Ganti pemanggilan ke fungsi baru yang lebih cerdas
    $processed = processImage($file['tmp_name'], $destination);
} else {
    // Jika bukan gambar, langsung pindahkan
    $processed = move_uploaded_file($file['tmp_name'], $destination);
}

if ($processed) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $base_url = "{$protocol}://{$_SERVER['HTTP_HOST']}/proyek_undangan/api/uploads/";
    $file_url = $base_url . $unique_filename;
    echo json_encode(['status' => 'success', 'message' => 'Media berhasil diupload.', 'url' => $file_url]);
} else {
    send_json_error(500, "Gagal memproses file setelah upload.");
}
?>
