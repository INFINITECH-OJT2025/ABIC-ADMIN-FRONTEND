<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; }
        .container { max-width: 680px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
        .header { background: #7f1d1d; color: #fff; padding: 18px 22px; }
        .body { padding: 22px; }
        .meta { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-top: 16px; }
        .meta p { margin: 6px 0; }
        .label { font-weight: 700; color: #7f1d1d; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <h2 style="margin:0;">Notice of Termination</h2>
            </div>
            <div class="body">
                <p>Dear <strong><?php echo e($employee->first_name); ?> <?php echo e($employee->last_name); ?></strong>,</p>
                <p>
                    This serves as formal notice regarding the termination of your employment with ABIC Accounting.
                    Please see details below.
                </p>

                <div class="meta">
                    <p><span class="label">Employee:</span> <?php echo e($employee->first_name); ?> <?php echo e($employee->last_name); ?></p>
                    <p><span class="label">Position:</span> <?php echo e($employee->position ?? 'N/A'); ?></p>
                    <p><span class="label">Termination Date:</span> <?php echo e(optional($termination->termination_date)->format('F d, Y h:i A')); ?></p>
                    <p><span class="label">Reason:</span> <?php echo e($termination->reason); ?></p>
                    <p><span class="label">Recommended By:</span> <?php echo e($termination->recommended_by ?? 'N/A'); ?></p>
                    <p><span class="label">Reviewed By:</span> <?php echo e($termination->reviewed_by ?? 'N/A'); ?></p>
                    <p><span class="label">Approved By:</span> <?php echo e($termination->approved_by ?? 'N/A'); ?></p>
                    <p><span class="label">Date of Approval:</span> <?php echo e(optional($termination->approval_date)->format('F d, Y h:i A') ?? 'N/A'); ?></p>
                    <?php if(!empty($termination->notes)): ?>
                        <p><span class="label">Notes:</span> <?php echo e($termination->notes); ?></p>
                    <?php endif; ?>
                </div>

                <p style="margin-top:16px;">
                    For any concerns, please coordinate with HR or the Admin Head office.
                </p>

                <p>Sincerely,<br><strong>ABIC Accounting Management</strong></p>
                <p class="footer">This is a system-generated notice.</p>
            </div>
        </div>
    </div>
</body>
</html>
<?php /**PATH C:\MY PROJECTS\ABIC-ACCOUNTING-FRONTEND\backend\resources\views/emails/termination-notice.blade.php ENDPATH**/ ?>