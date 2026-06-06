<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$messages = App\Models\ChatMessage::latest()->take(5)->get(['id', 'content', 'file_url'])->toArray();
echo json_encode($messages, JSON_PRETTY_PRINT);
