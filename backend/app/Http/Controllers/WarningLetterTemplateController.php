<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\WarningLetterTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WarningLetterTemplateController extends Controller
{
    public function index()
    {
        $templates = WarningLetterTemplate::all();
        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    public function show($slug)
    {
        $template = WarningLetterTemplate::where('slug', $slug)->first();
        if (!$template) {
            return response()->json(['success' => false, 'message' => 'Template not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $template]);
    }

    public function bulkUpdate(Request $request)
    {
        $data = $request->all();
        
        DB::beginTransaction();
        try {
            foreach ($data as $slug => $content) {
                WarningLetterTemplate::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'title' => $content['title'] ?? '',
                        'subject' => $content['subject'] ?? '',
                        'body' => $content['body'] ?? '',
                        'footer' => $content['footer'] ?? null,
                        'signatory_name' => $content['signatoryName'] ?? ($content['signatory_name'] ?? null),
                        'header_logo_image' => $content['headerLogoImage'] ?? ($content['header_logo_image'] ?? null),
                        'header_details' => $content['headerDetails'] ?? ($content['header_details'] ?? null),
                    ]
                );
            }
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Templates updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to update templates', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $slug)
    {
        $template = WarningLetterTemplate::where('slug', $slug)->first();
        if (!$template) {
            return response()->json(['success' => false, 'message' => 'Template not found'], 404);
        }

        $template->update([
            'title' => $request->title,
            'subject' => $request->subject,
            'body' => $request->body,
            'footer' => $request->footer,
            'signatory_name' => $request->signatoryName ?? $request->signatory_name,
            'header_logo_image' => $request->headerLogoImage ?? $request->header_logo_image,
            'header_details' => $request->headerDetails ?? $request->header_details,
        ]);

        return response()->json(['success' => true, 'data' => $template]);
    }
}
