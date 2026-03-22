<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Translation;
use Illuminate\Http\Request;

class TranslationAdminController extends Controller
{
    /** GET /api/admin/translations?locale=en */
    public function index(Request $request)
    {
        $locale = $request->query('locale', 'en');

        $translations = Translation::where('locale', $locale)
            ->where('group', 'app')
            ->orderBy('key')
            ->get(['id', 'locale', 'key', 'value']);

        return response()->json($translations);
    }

    /** PUT /api/admin/translations/{translation} */
    public function update(Request $request, Translation $translation)
    {
        $data = $request->validate(['value' => 'required|string']);

        $translation->update($data);
        Translation::clearCache($translation->locale, $translation->group);

        return response()->json($translation);
    }

    /** POST /api/admin/translations */
    public function store(Request $request)
    {
        $data = $request->validate([
            'locale' => 'required|string|max:10',
            'key'    => 'required|string|max:200',
            'value'  => 'required|string',
            'group'  => 'sometimes|string|max:100',
        ]);

        $data['group'] = $data['group'] ?? 'app';

        $translation = Translation::updateOrCreate(
            ['locale' => $data['locale'], 'group' => $data['group'], 'key' => $data['key']],
            ['value'  => $data['value']]
        );

        Translation::clearCache($data['locale'], $data['group']);

        return response()->json($translation, 201);
    }

    /** DELETE /api/admin/translations/{translation} */
    public function destroy(Translation $translation)
    {
        $locale = $translation->locale;
        $group  = $translation->group;
        $translation->delete();
        Translation::clearCache($locale, $group);

        return response()->json(['deleted' => true]);
    }

    /** GET /api/admin/translations/locales */
    public function locales()
    {
        $locales = Translation::distinct()->orderBy('locale')->pluck('locale');
        return response()->json($locales);
    }
}
