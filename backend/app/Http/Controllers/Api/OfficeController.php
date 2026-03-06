<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Office::all()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:offices']);
        $office = Office::create($request->all());
        return response()->json(['success' => true, 'data' => $office]);
    }
}
