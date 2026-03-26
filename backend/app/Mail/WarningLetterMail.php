<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WarningLetterMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $employeeName;
    public string $letterType;
    public string $pdfContent;   // raw PDF binary
    public string $mailSubject;  // renamed to avoid Mailable::$subject conflict
    public string $bodyHtml;
    public ?string $pdfFilename;

    public function __construct(
        string $employeeName,
        string $letterType,
        string $pdfContent,
        string $mailSubject,
        string $bodyHtml,
        ?string $pdfFilename = null,
    ) {
        $this->employeeName = $employeeName;
        $this->letterType   = $letterType;
        $this->pdfContent   = $pdfContent;
        $this->mailSubject  = $mailSubject;
        $this->bodyHtml     = $bodyHtml;
        $this->pdfFilename  = $pdfFilename;
    }

    public function build(): static
    {
        $fallback = 'Warning_Letter_' . str_replace(' ', '_', $this->employeeName) . '.pdf';
        $filename = $this->sanitizePdfFilename($this->pdfFilename ?: $fallback);

        return $this
            ->subject($this->mailSubject)
            ->html($this->bodyHtml)
            ->attachData($this->pdfContent, $filename, [
                'mime' => 'application/pdf',
            ]);
    }

    private function sanitizePdfFilename(string $filename): string
    {
        $safe = preg_replace('/[^\w\s,\.-]+/u', '', $filename) ?? 'warning_letter.pdf';
        $safe = trim($safe);
        if ($safe === '') {
            $safe = 'warning_letter';
        }
        if (!str_ends_with(strtolower($safe), '.pdf')) {
            $safe .= '.pdf';
        }
        return $safe;
    }
}
