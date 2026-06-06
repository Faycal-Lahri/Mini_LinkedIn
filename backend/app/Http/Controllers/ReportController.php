<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Report;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reported_id' => 'required|integer',
            'type' => 'required|in:POST,USER,COMMENT',
            'reason' => 'required|string|max:1000',
        ]);

        $report = Report::create([
            'reporter_id' => $request->user()->id,
            'reported_id' => $validated['reported_id'],
            'type' => $validated['type'],
            'reason' => $validated['reason'],
            'status' => 'PENDING',
        ]);

        return response()->json(['message' => 'Signalement envoyé avec succès.', 'report' => $report], 201);
    }
}
