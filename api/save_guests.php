<?php
// ========== File: api/save_guests.php (Perbaikan Final) ==========

// Atur error reporting untuk debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- Pengaturan Header CORS ---
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Fungsi Helper untuk Respon Error ---
function send_json_error($statusCode, $message, $details = "") {
    http_response_code($statusCode);
    echo json_encode(['status' => 'error', 'message' => $message, 'details' => $details]);
    exit();
}

// --- Proses Utama ---
session_start();
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    send_json_error(401, 'Akses ditolak. Silakan login kembali.');
}

$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    send_json_error(500, 'Koneksi database gagal.', $conn->connect_error);
}

$data = json_decode(file_get_contents("php://input"));
if (json_last_error() !== JSON_ERROR_NONE || !isset($data->invitation_id) || !isset($data->guests) || !is_array($data->guests)) {
    send_json_error(400, 'Data yang dikirim tidak valid.');
}

$invitation_id = intval($data->invitation_id);
$guests = $data->guests;

// Mulai transaksi untuk memastikan semua data masuk atau tidak sama sekali
$conn->begin_transaction();

try {
    // Hapus dulu daftar tamu lama untuk undangan ini agar tidak duplikat
    $stmt_delete = $conn->prepare("DELETE FROM guests WHERE invitation_id = ?");
    if ($stmt_delete === false) { throw new Exception('Gagal menyiapkan statement DELETE: ' . $conn->error); }
    $stmt_delete->bind_param("i", $invitation_id);
    $stmt_delete->execute();
    $stmt_delete->close();
    
    // Masukkan daftar tamu yang baru
    // Hanya proses jika ada tamu yang akan dimasukkan
    if (count($guests) > 0) {
        $stmt_insert = $conn->prepare("INSERT INTO guests (invitation_id, guest_name) VALUES (?, ?)");
        if ($stmt_insert === false) { throw new Exception('Gagal menyiapkan statement INSERT: ' . $conn->error); }
        
        foreach ($guests as $guest_name) {
            $trimmed_name = trim($guest_name);
            if (!empty($trimmed_name)) {
                $stmt_insert->bind_param("is", $invitation_id, $trimmed_name);
                $stmt_insert->execute();
            }
        }
        $stmt_insert->close();
    }
    
    // Jika semua berhasil, commit transaksi
    $conn->commit();
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => count($guests) . ' tamu berhasil diimpor.']);
    
} catch (Exception $e) {
    // Jika ada error, batalkan semua perubahan
    $conn->rollback();
    send_json_error(500, 'Gagal menyimpan daftar tamu ke database.', $e->getMessage());
}

$conn->close();
?>
