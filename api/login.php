<?php
// Tampilkan semua error PHP untuk membantu debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Izinkan akses dari server development React (penting untuk mengatasi 'Failed to fetch')
// 'Access-Control-Allow-Credentials' diperlukan untuk mengizinkan cookie session
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true"); // PENTING untuk session
header("Content-Type: application/json; charset=UTF-8");

// ==========================================================
// MEMULAI SESSION
// Ini harus dipanggil di bagian paling atas sebelum output apa pun.
// Session digunakan untuk "mengingat" status login pengguna di sisi server.
// ==========================================================
session_start();

// Handle preflight request (OPTIONS) dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal.']);
    exit();
}

// Ambil data JSON yang dikirim dari React
$data = json_decode(file_get_contents("php://input"));

// Validasi data input
if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Username dan password harus diisi.']);
    exit();
}

$username = $data->username;
$password = $data->password;

// Siapkan query SQL untuk mencari pengguna berdasarkan username
$sql = "SELECT * FROM users WHERE username = ? LIMIT 1";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyiapkan statement SQL.']);
    exit();
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    // Jika username ditemukan
    $user = $result->fetch_assoc();

    // Verifikasi password yang diinput dengan hash yang ada di database
    // password_verify() adalah fungsi keamanan bawaan PHP
    if (password_verify($password, $user['password'])) {
        // Jika password cocok
        
        // Simpan informasi ke dalam session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['is_logged_in'] = true;

        http_response_code(200); // OK
        echo json_encode([
            'status' => 'success',
            'message' => 'Login berhasil!',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username']
            ]
        ]);
    } else {
        // Jika password tidak cocok
        http_response_code(401); // Unauthorized
        echo json_encode(['status' => 'error', 'message' => 'Password salah.']);
    }
} else {
    // Jika username tidak ditemukan
    http_response_code(404); // Not Found
    echo json_encode(['status' => 'error', 'message' => 'Username tidak ditemukan.']);
}

$stmt->close();
$conn->close();
?>
