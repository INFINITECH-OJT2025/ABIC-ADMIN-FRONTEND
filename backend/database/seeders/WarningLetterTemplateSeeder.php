<?php

namespace Database\Seeders;

use App\Models\WarningLetterTemplate;
use Illuminate\Database\Seeder;

class WarningLetterTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'slug' => 'tardiness-regular',
                'title' => 'TARDINESS WARNING LETTER',
                'subject' => 'Written Warning - Frequent Tardiness',
                'header_logo' => 'ABIC Realty',
                'body' => "Dear {{salutation}} {{last_name}},\n\nGood day.\n\nThis letter serves as a Formal Warning regarding your tardiness. Please be reminded that your scheduled time-in is {{shift_time}}, with a five (5)-minute grace period until {{grace_period}}, in accordance with company policy.\n\nDespite this allowance, you have incurred {{instances_text}} ({{instances_count}}) instances of tardiness beyond the allowable grace period within the current cut-off period, which constitutes a violation of the Company's Attendance and Punctuality Policy.\n\nBelow is the recorded instances for this cut-off period:\n{{entries_list}}\n\nConsistent tardiness negatively affects team productivity, disrupts workflow, and fails to meet the company's standards for punctuality and professionalism.\n\nPlease be reminded of the following:\n1. You are expected to immediately correct your attendance behavior and strictly adhere to your scheduled working hours.\n2. Any future occurrences of tardiness may result in stricter disciplinary action, up to and including suspension or termination, in accordance with company policy.\n\nThis notice shall be documented accordingly. Your cooperation and compliance are expected.\n\nThank you.",
                'footer' => 'Admin Supervisor/HR',
                'signatory_name' => 'AIZLE MARIE M. ATIENZA'
            ],
            [
                'slug' => 'tardiness-probee',
                'title' => 'TARDINESS WARNING LETTER',
                'subject' => 'Tardiness Notice',
                'header_logo' => 'ABIC Realty',
                'body' => "Dear {{salutation}} {{last_name}},\n\nThis letter serves as a formal warning regarding your repeated tardiness. It has been recorded that you have reported late to work {{instances_text}} ({{instances_count}}) times, exceeding the company's grace period of five (5) minutes.\n\nPlease be reminded that further instances of tardiness may result in stricter disciplinary action, up to and including suspension, in accordance with company policies.\n\nWe trust that you will take this matter seriously and make the necessary adjustments to improve your attendance and punctuality moving forward.\n\nAdditionally, please note the specific dates of tardiness recorded for this cut-off:\n{{entries_list}}\n\nConsistent tardiness affects team productivity, disrupts workflow, and your evaluation needed for your regularization, which requires all employees to report to work on time and adhere to their scheduled working hours.\n\nThank you.",
                'footer' => 'Admin Assistant',
                'signatory_name' => 'AIZLE MARIE M. ATIENZA'
            ],
            [
                'slug' => 'leave',
                'title' => 'FIRST WARNING LETTER',
                'subject' => 'Record of Extended Leave of Absence',
                'header_logo' => 'ABIC Realty',
                'body' => "Dear {{salutation}} {{last_name}},\n\nThis letter serves as a Formal Warning regarding your attendance record for the current cutoff period.\n\nIt has been noted that you incurred {{instances_text}} ({{instances_count}}) absences within the {{cutoff_text}} of {{month}} {{year}}, specifically on the following dates:\n{{entries_list}}\n\nThese absences negatively affect work operations and your evaluation needed for your regularization. As stated in the company’s Attendance and Punctuality Policy, employees are expected to maintain regular attendance and provide valid justification or prior notice for any absence.\n\nPlease be reminded that repeated absences, especially within a short period, may lead to further disciplinary action in accordance with company rules and regulations.\n\nMoving forward, you are expected to:\n1. Improve your attendance immediately,\n2. Avoid unnecessary or unapproved absences, and\n3. Provide proper documentation or notice for any unavoidable absence.\n\nFailure to comply may result in stricter sanctions, up to and including suspension or termination.\n\nPlease acknowledge receipt of this warning by signing below.",
                'footer' => 'Admin Assistant',
                'signatory_name' => 'AIZLE MARIE M. ATIENZA'
            ],
            [
                'slug' => 'supervisor',
                'title' => 'WARNING LETTER',
                'subject' => 'Employee Attendance Advisory',
                'header_logo' => 'ABIC Realty',
                'body' => "Dear Ma'am Angely,\n\nThis letter serves as a Formal Warning regarding the attendance/tardiness of {{salutation}} {{employee_name}}. {{pronoun_he_she}} has accumulated {{instances_text}} ({{instances_count}}) occurrences/days of issues within the current cut-off period.\n\nIn accordance with company policy, reaching this count within a single cut-off period is subject to appropriate coaching, warning, and/or sanction. We request that you address this matter with the concerned employee and coordinate with the HR/Admin Department for proper documentation and necessary action.\n\nAdditionally, please note the specific dates recorded for this cut-off:\n{{entries_list}}\n\nConsistent attendance issues affect team productivity, disrupts workflow, and violates the company's policy, which requires all employees to report to work on time and adhere to their scheduled working hours.\n\nPlease be reminded of the following:\n1. {{salutation}} {{last_name}} is expected to correct {{pronoun_his_her}} behavior immediately.\n2. Future occurrences may result in stricter disciplinary action, including suspension or termination, in accordance with company policy.\n\nKindly ensure that the employee is informed and that corrective action is enforced appropriately.\n\nThank you.",
                'footer' => 'Admin Assistant',
                'signatory_name' => 'AIZLE MARIE M. ATIENZA'
            ]
        ];

        foreach ($templates as $template) {
            WarningLetterTemplate::updateOrCreate(['slug' => $template['slug']], $template);
        }
    }
}
