<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pack;
use Illuminate\Http\Request;

class PackAdminController extends Controller
{
    public function index()
    {
        return response()->json(Pack::withCount('packOpenings')->orderBy('price')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'price'      => 'required|integer|min:0',
            'card_count' => 'required|integer|min:1|max:20',
            'set_name'   => 'required|string|max:100',
        ]);

        return response()->json(Pack::create($data), 201);
    }

    public function update(Request $request, Pack $pack)
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'price'      => 'sometimes|integer|min:0',
            'card_count' => 'sometimes|integer|min:1|max:20',
            'set_name'   => 'sometimes|string|max:100',
        ]);

        $pack->update($data);
        return response()->json($pack);
    }

    public function destroy(Pack $pack)
    {
        $pack->delete();
        return response()->json(['message' => 'Pack deleted']);
    }
}
