<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=admin_head;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $tables = [
        'agency_contacts' => 'AgencyContactsSeeder',
        'agency_processes' => 'AgencyProcessesSeeder',
        'general_contacts' => 'GeneralContactsSeeder'
    ];

    foreach ($tables as $table => $seederName) {
        $stmt = $pdo->query("SELECT * FROM $table");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $chunks = array_chunk($rows, 50);

        $php = "<?php\n\nnamespace Database\Seeders;\n\nuse Illuminate\Database\Seeder;\nuse Illuminate\Support\Facades\DB;\n\nclass {$seederName} extends Seeder\n{\n    public function run()\n    {\n";
        
        $php .= "        DB::statement('SET FOREIGN_KEY_CHECKS=0;');\n";
        $php .= "        DB::table('{$table}')->truncate();\n";
        $php .= "        DB::statement('SET FOREIGN_KEY_CHECKS=1;');\n\n";

        foreach ($chunks as $chunk) {
            $json = addslashes(json_encode($chunk));
            $php .= "        DB::table('{$table}')->insert(json_decode('{$json}', true));\n";
        }

        $php .= "    }\n}\n";

        $path = __DIR__ . "/database/seeders/{$seederName}.php";
        file_put_contents($path, $php);
        echo "Generated {$seederName}.php with " . count($rows) . " rows.\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
