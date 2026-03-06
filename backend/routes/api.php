<?php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\EmployeeAdditionalFieldController;
use App\Http\Controllers\Api\PositionController;
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

// Positions API Routes
Route::apiResource('positions', PositionController::class);
Route::post('/positions/bulk', [PositionController::class, 'bulkCreate']);

// Departments API Routes
Route::apiResource('departments', DepartmentController::class);
Route::post('/departments/bulk', [DepartmentController::class, 'bulkCreate']);

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
