<?php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\EmployeeAdditionalFieldController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\ClearanceChecklistController;
use App\Http\Controllers\Api\DirectoryController;
use App\Http\Controllers\Api\OnboardingChecklistController;
use App\Http\Controllers\Api\DepartmentChecklistTemplateController;
use App\Http\Controllers\EvaluationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Employee API Routes
Route::get('/employees/check-email', [EmployeeController::class, 'checkEmail']);
Route::get('/employees/check-name', [EmployeeController::class, 'checkName']);
Route::apiResource('employees', EmployeeController::class);

// Hierarchies API Routes
use App\Http\Controllers\HierarchyController;
Route::apiResource('hierarchies', HierarchyController::class);

// Departments API Routes
Route::apiResource('departments', DepartmentController::class);
Route::post('/departments/bulk', [DepartmentController::class, 'bulkCreate']);

// Office API Routes
use App\Http\Controllers\Api\OfficeController;
Route::get('/offices', [OfficeController::class, 'index']);
Route::post('/offices', [OfficeController::class, 'store']);

// Onboarding routes
Route::post('/employees/{id}/onboard', [EmployeeController::class, 'onboard']);

// CHECKLIST ROUTES
Route::get('/onboarding-checklist', [OnboardingChecklistController::class, 'index']);
Route::post('/onboarding-checklist', [OnboardingChecklistController::class, 'store']);
Route::put('/onboarding-checklist/{id}', [OnboardingChecklistController::class, 'update']);

// CLEARANCE ROUTES
Route::get('/clearance-checklist', [ClearanceChecklistController::class, 'index']);
Route::post('/clearance-checklist', [ClearanceChecklistController::class, 'store']);
Route::put('/clearance-checklist/{id}', [ClearanceChecklistController::class, 'update']);

// Department Checklist Template Routes
Route::get('/department-checklist-templates', [DepartmentChecklistTemplateController::class, 'index']);
Route::put('/department-checklist-templates', [DepartmentChecklistTemplateController::class, 'upsert']);

// Termination routes
Route::post('/employees/{id}/terminate', [EmployeeController::class, 'terminate']);
Route::post('/employees/{id}/rehire', [EmployeeController::class, 'rehire']);
Route::get('/terminations', [EmployeeController::class, 'getTerminations']);
Route::get('/resigned', [EmployeeController::class, 'getResigned']);
Route::get('/rehired', [EmployeeController::class, 'getRehired']);

// Additional Fields API Routes
Route::get('/employee-additional-fields', [EmployeeAdditionalFieldController::class, 'index']);
Route::post('/employee-additional-fields', [EmployeeAdditionalFieldController::class, 'store']);
Route::delete('/employee-additional-fields/{id}', [EmployeeAdditionalFieldController::class, 'destroy']);
Route::get('/employees/{id}/additional-values', [EmployeeAdditionalFieldController::class, 'getEmployeeValues']);
Route::post('/employees/{id}/additional-values', [EmployeeAdditionalFieldController::class, 'saveEmployeeValues']);

// Activity Log API Routes
Route::get('/activity-logs', [ActivityLogController::class, 'index']);
Route::get('/activity-logs/stats', [ActivityLogController::class, 'stats']);
Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show']);

// Evaluation API Routes
Route::get('/evaluations', [EvaluationController::class, 'index']);
Route::post('/evaluations', [EvaluationController::class, 'store']);
Route::get('/evaluations/{employeeId}/pdf', [EvaluationController::class, 'downloadPdf']);
Route::post('/evaluations/{employeeId}/email-pdf', [EvaluationController::class, 'emailPdf']);




// Directory API Routes
Route::get('/directory/agencies', [DirectoryController::class, 'index']);
Route::put('/directory/agencies/{code}', [DirectoryController::class, 'update']);
Route::put('/directory/agencies/{code}/image', [DirectoryController::class, 'updateImage']);
Route::get('/directory/general-contacts', [DirectoryController::class, 'listGeneralContacts']);
Route::put('/directory/general-contacts', [DirectoryController::class, 'updateGeneralContacts']);
Route::post('/directory/images/upload', [DirectoryController::class, 'uploadImage']);
Route::get('/directory/images', [DirectoryController::class, 'listImages']);
Route::delete('/directory/images', [DirectoryController::class, 'deleteImage']);
Route::get('/directory/images/file/{path}', [DirectoryController::class, 'showImageFile'])->where('path', '.*');

// Backward-compatible aliases for old Cloudinary route names.
Route::get('/directory/cloudinary-images', [DirectoryController::class, 'listCloudinaryImages']);
Route::delete('/directory/cloudinary-images', [DirectoryController::class, 'deleteCloudinaryImage']);

// Office Shift Schedule Routes
use App\Http\Controllers\Api\OfficeShiftScheduleController;
Route::get('/office-shift-schedules', [OfficeShiftScheduleController::class, 'index']);
Route::post('/office-shift-schedules', [OfficeShiftScheduleController::class, 'upsert']);

// Tardiness API Routes
use App\Http\Controllers\Api\TardinessEntryController;
Route::get('/admin-head/attendance/tardiness', [TardinessEntryController::class, 'index']);
Route::post('/admin-head/attendance/tardiness', [TardinessEntryController::class, 'store']);
Route::patch('/admin-head/attendance/tardiness/{id}', [TardinessEntryController::class, 'update']);
Route::get('/admin-head/attendance/tardiness/years', [TardinessEntryController::class, 'years']);

// Leave Routes
use App\Http\Controllers\Api\LeaveController;
Route::apiResource('leaves', LeaveController::class);

// Warning Letter Template Routes
use App\Http\Controllers\WarningLetterTemplateController;
Route::get('/warning-letter-templates', [WarningLetterTemplateController::class, 'index']);
Route::post('/warning-letter-templates/bulk', [WarningLetterTemplateController::class, 'bulkUpdate']);
Route::get('/warning-letter-templates/{slug}', [WarningLetterTemplateController::class, 'show']);
Route::put('/warning-letter-templates/{slug}', [WarningLetterTemplateController::class, 'update']);
