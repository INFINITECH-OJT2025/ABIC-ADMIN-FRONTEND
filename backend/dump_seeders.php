<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=admin_head;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $tables = ['agency_contacts', 'agency_processes', 'general_contacts'];
    $data = [];

    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT * FROM $table");
        $data[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($data, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
