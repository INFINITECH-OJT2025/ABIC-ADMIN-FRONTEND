<?php

namespace App\Http\Controllers;

use App\Models\WarningLetterTemplate;
use Illuminate\Http\Request;

class WarningLetterTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(WarningLetterTemplate::all()->keyBy('slug'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|string|unique:warning_letter_templates,slug',
            'title' => 'required|string',
            'subject' => 'required|string',
            'header_logo' => 'nullable|string',
            'body' => 'required|string',
            'footer' => 'nullable|string',
            'signatory_name' => 'nullable|string',
        ]);

        $template = WarningLetterTemplate::create($validated);
        return response()->json($template, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $slug)
    {
        $template = WarningLetterTemplate::where('slug', $slug)->firstOrFail();
        return response()->json($template);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $slug)
    {
        $template = WarningLetterTemplate::where('slug', $slug)->first();
        
        $validated = $request->validate([
            'title' => 'required|string',
            'subject' => 'required|string',
            'header_logo' => 'nullable|string',
            'body' => 'required|string',
            'footer' => 'nullable|string',
            'signatory_name' => 'nullable|string',
        ]);

        if ($template) {
            $template->update($validated);
        } else {
            $template = WarningLetterTemplate::create(array_merge($validated, ['slug' => $slug]));
        }

        return response()->json($template);
    }

    /**
     * Bulk update or create templates.
     */
    public function bulkUpdate(Request $request)
    {
        $templatesData = $request->all();
        $updatedTemplates = [];

        foreach ($templatesData as $slug => $data) {
            $template = WarningLetterTemplate::updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $data['title'],
                    'subject' => $data['subject'],
                    'header_logo' => $data['headerLogo'] ?? $data['header_logo'] ?? 'ABIC Realty',
                    'body' => $data['body'],
                    'footer' => $data['footer'],
                    'signatory_name' => $data['signatoryName'] ?? $data['signatory_name'] ?? 'AIZLE MARIE M. ATIENZA',
                ]
            );
            $updatedTemplates[$slug] = $template;
        }

        return response()->json($updatedTemplates);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $slug)
    {
        $template = WarningLetterTemplate::where('slug', $slug)->firstOrFail();
        $template->delete();
        return response()->json(null, 204);
    }
}
