<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Performance Appraisal</title>
    <style>
        @page { margin: 20px 22px; }
        body { font-family: "Times New Roman", serif; font-size: 10pt; color: #000; line-height: 1.0; margin: 0; padding: 0; }
        .doc, .doc * { font-family: "Times New Roman", serif !important; font-size: 10pt !important; line-height: 1.0 !important; }
        .doc { width: 100%; max-width: 700px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 8px; margin-top: 0; padding: 4px 0; }
        .company { color: #c42020; font-weight: 700; font-size: 19px; letter-spacing: 0.3px; margin-bottom: 5px; }
        .title { font-weight: 700; font-size: 16px; letter-spacing: 0.5px; margin-top: 5px; }
        .meta { margin-bottom: 8px; }
        .meta-row { margin-bottom: 3px; white-space: nowrap; }
        .meta-label { font-weight: 700; display: inline-block; min-width: 145px; font-size: 10px; }
        .meta-value-line { display: inline-block; width: auto; max-width: 78%; border-bottom: 1px solid #000; vertical-align: bottom; padding-right: 4px; }
        .meta-value { color: #c42020; font-weight: 700; font-size: 10px; }
        .eval-tag { color: #708090; font-style: italic; font-size: 8.5px; margin-left: 5px; }

        table.criteria { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.criteria th { font-size: 10px; text-align: center; text-decoration: underline; padding-bottom: 3px; }
        table.criteria td { vertical-align: top; padding: 4px 0; }
        .criterion-title { font-weight: 700; font-size: 10px; margin-bottom: 0; }
        .criterion-desc { margin-left: 8px; font-size: 8.5px; line-height: 1.3; }
        .rating-cell { width: 30%; text-align: center; vertical-align: middle; }
        .rating-line { border-bottom: 1px solid #000; min-height: 14px; line-height: 14px; font-size: 12px; font-weight: 700; }

        .total-block { margin-top: 6px; text-align: right; font-weight: 700; font-size: 11px; }
        .total-value-line { display: inline-block; min-width: 130px; border-bottom: 1px solid #000; text-align: center; margin-left: 6px; font-size: 12px; line-height: 16px; }
        .agreement { margin-top: 8px; margin-bottom: 8px; font-size: 9px; line-height: 1.25; }

        .sign-row { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 10px; }
        .sign-row td { width: 50%; vertical-align: middle; padding-bottom: 2px; }
        .line-label { font-weight: 700; font-size: 10px; }
        .line { border-bottom: 1px solid #000; display: inline-block; width: 65%; margin-left: 5px; min-height: 12px; vertical-align: middle; }
        .date-label { color: #000; font-weight: 700; margin-right: 4px; font-size: 10px; }
        .date-value { color: #c42020; font-weight: 700; font-size: 10px; }

        .subhead { font-weight: 700; margin-top: 8px; margin-bottom: 4px; font-size: 10px; }
        .list { font-size: 9px; margin-left: 20px; line-height: 1.3; margin-top: 2px; margin-bottom: 4px; }
        .recommend { margin-top: 8px; margin-bottom: 8px; font-weight: 700; font-size: 10px; }
        .box { display: inline-block; width: 10px; height: 10px; border: 1px solid #000; text-align: center; line-height: 9px; margin: 0 4px 0 7px; font-size: 8px; }

        .bottom-block { margin-top: 8px; }
        .comments-title { margin-top: 8px; margin-bottom: 4px; font-weight: 700; font-size: 10px; }
        .comments-box { border: 1px solid #000; min-height: 145px; margin-top: 4px; padding: 6px; font-size: 9px; line-height: 1.25; }

        .manager { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 0; }
        .manager td { width: 50%; padding-bottom: 4px; vertical-align: middle; font-size: 8.5px; }
        .manager-label { display: inline-block; min-width: 52px; font-size: 8.5px; }
        .manager-line { border-bottom: 1px solid #000; display: inline-block; width: 65%; margin-left: 4px; min-height: 12px; line-height: 12px; vertical-align: middle; position: relative; padding: 0 2px; }
        .manager-name { color: #c42020; font-weight: 700; font-size: 8.5px; white-space: nowrap; max-width: 145px; overflow: hidden; text-overflow: ellipsis; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
@php
    $fullName = trim(($employee->first_name ?? '') . ' ' . ($employee->last_name ?? ''));
    $deptTitle = trim(($employee->department ?? '-') . ' / ' . ($employee->position ?? '-'));
    $firstResult = $evaluation->remarks_1 ?? 'N/A';
    $secondResult = $evaluation->remarks_2 ?? 'N/A';
@endphp

@if($showFirst)
    <div class="doc">
        <div class="header">
            <div class="company">INFINITECH ADVERTISING CORPORATION</div>
            <div class="title">PERFORMANCE APPRAISAL</div>
        </div>

        <div class="meta">
            <div class="meta-row">
                <span class="meta-label">NAME</span>
                <span class="meta-value-line"><span class="meta-value">{{ $fullName }}</span></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">DEPARTMENT/JOB TITLE</span>
                <span class="meta-value-line"><span class="meta-value">{{ $deptTitle }}</span></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">RATING PERIOD</span>
                <span class="meta-value-line">
                    <span class="meta-value">{{ $firstEvalDate }}</span>
                    <span class="eval-tag">(1st Evaluation)</span>
                </span>
            </div>
        </div>

        <table class="criteria">
            <thead>
                <tr>
                    <th style="width:70%;">CRITERIA</th>
                    <th style="width:30%;">RATING</th>
                </tr>
            </thead>
            <tbody>
                @foreach($criteria as $criterion)
                    <tr>
                        <td>
                            <div class="criterion-title">{{ $criterion['label'] }}</div>
                            <div class="criterion-desc">{{ $criterion['desc'] }}</div>
                        </td>
                        <td class="rating-cell">
                            <div class="rating-line">{{ $firstBreakdown[$criterion['id']] ?? '' }}</div>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="total-block">
            TOTAL SCORE <span class="total-value-line">{{ $evaluation->score_1 ?? '' }}</span>
        </div>

        <div class="agreement">
            The above appraisal was discussed with me by my superior and I
            {{ ($evaluation->agreement_1 ?? '') === 'agree' ? '●' : '○' }} agree
            {{ ($evaluation->agreement_1 ?? '') === 'disagree' ? '●' : '○' }} disagree on the following items:
        </div>

        <table class="sign-row">
            <tr>
                <td>
                    <span class="line-label">SIGNATURE OF EMPLOYEE:</span>
                    <span class="line">&nbsp;</span>
                </td>
                <td>
                    <span style="color:#000; font-weight:700; text-decoration:none;">DATE:</span>
                    <span class="line" style="width:55%;"></span>
                </td>
            </tr>
        </table>

        <div class="subhead">EMPLOYEE SHALL BE RATED AS FOLLOWS:</div>
        <div class="list">
            <div>1 - Poor</div>
            <div>2 - Needs Improvement</div>
            <div>3 - Meets Minimum Requirement</div>
            <div>4 - Very Satisfactory</div>
            <div>5 - Outstanding</div>
        </div>

        <div class="subhead" style="margin-top:6px;">INTERPRETATION OF TOTAL RATING SCORE:</div>
        <div class="list" style="margin-left:0;">
            <div>50 - 41 Highly suitable to the position</div>
            <div>40 - 31 Suitable to the position</div>
            <div>30 - 16 Fails to meet minimum requirements of the job</div>
            <div>15 - 0 Employee advise to resign</div>
        </div>

        <div class="recommend">
            RECOMMENDATION: REGULAR EMPLOYMENT
            <span class="box">{{ $firstResult === 'Passed' ? '✓' : '' }}</span> YES
            <span class="box">{{ $firstResult === 'Failed' ? '✓' : '' }}</span> NO
        </div>

        <div class="bottom-block">
            <div class="comments-title">COMMENTS / REMARKS:</div>
            <div class="comments-box">{{ ($firstResult ?? 'N/A') . ': ' . ($evaluation->comment_1 ?? '-') }}</div>

            <table class="manager">
                <tr>
                    <td><span class="manager-label">Rated by:</span><span class="manager-line"><span class="manager-name">{{ $evaluation->rated_by ? substr($evaluation->rated_by, 0, 25) : '' }}</span></span></td>
                    <td><span class="manager-label">Date:</span><span class="manager-line" style="width:50%;"></span></td>
                </tr>
                <tr>
                    <td><span class="manager-label">Reviewed by:</span><span class="manager-line"><span class="manager-name">{{ $evaluation->reviewed_by ? substr($evaluation->reviewed_by, 0, 25) : '' }}</span></span></td>
                    <td><span class="manager-label">Date:</span><span class="manager-line" style="width:50%;"></span></td>
                </tr>
                <tr>
                    <td><span class="manager-label">Approved by:</span><span class="manager-line"><span class="manager-name">{{ $evaluation->approved_by ? substr($evaluation->approved_by, 0, 25) : '' }}</span></span></td>
                    <td><span class="manager-label">Date:</span><span class="manager-line" style="width:50%;"></span></td>
                </tr>
            </table>
        </div>
    </div>
@endif

@if($showSecond)
    <div class="doc {{ $showFirst ? 'page-break' : '' }}">
        <div class="header">
            <div class="company">INFINITECH ADVERTISING CORPORATION</div>
            <div class="title">PERFORMANCE APPRAISAL</div>
        </div>

        <div class="meta">
            <div class="meta-row">
                <span class="meta-label">NAME</span>
                <span class="meta-value-line"><span class="meta-value">{{ $fullName }}</span></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">DEPARTMENT/JOB TITLE</span>
                <span class="meta-value-line"><span class="meta-value">{{ $deptTitle }}</span></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">RATING PERIOD</span>
                <span class="meta-value-line">
                    <span class="meta-value">{{ $secondEvalDate }}</span>
                    <span class="eval-tag">(2nd Evaluation)</span>
                </span>
            </div>
        </div>

        <table class="criteria">
            <thead>
                <tr>
                    <th style="width:70%;">CRITERIA</th>
                    <th style="width:30%;">RATING</th>
                </tr>
            </thead>
            <tbody>
                @foreach($criteria as $criterion)
                    <tr>
                        <td>
                            <div class="criterion-title">{{ $criterion['label'] }}</div>
                            <div class="criterion-desc">{{ $criterion['desc'] }}</div>
                        </td>
                        <td class="rating-cell">
                            <div class="rating-line">{{ $secondBreakdown[$criterion['id']] ?? '' }}</div>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="total-block">
            TOTAL SCORE <span class="total-value-line">{{ $evaluation->score_2 ?? '' }}</span>
        </div>

        <div class="agreement">
            The above appraisal was discussed with me by my superior and I
            {{ ($evaluation->agreement_2 ?? '') === 'agree' ? '●' : '○' }} agree
            {{ ($evaluation->agreement_2 ?? '') === 'disagree' ? '●' : '○' }} disagree on the following items:
        </div>

        <table class="sign-row">
            <tr>
                <td>
                    <span class="line-label">SIGNATURE OF EMPLOYEE:</span>
                    <span class="line">&nbsp;</span>
                </td>
                <td>
                    <span style="color:#000; font-weight:700; text-decoration:none;">DATE:</span>
                    <span class="line" style="width:55%;"></span>
                </td>
            </tr>
        </table>

        <div class="subhead">EMPLOYEE SHALL BE RATED AS FOLLOWS:</div>
        <div class="list">
            <div>1 - Poor</div>
            <div>2 - Needs Improvement</div>
            <div>3 - Meets Minimum Requirement</div>
            <div>4 - Very Satisfactory</div>
            <div>5 - Outstanding</div>
        </div>

        <div class="subhead" style="margin-top:6px;">INTERPRETATION OF TOTAL RATING SCORE:</div>
        <div class="list" style="margin-left:0;">
            <div>50 - 41 Highly suitable to the position</div>
            <div>40 - 31 Suitable to the position</div>
            <div>30 - 16 Fails to meet minimum requirements of the job</div>
            <div>15 - 0 Employee advise to resign</div>
        </div>

        <div class="recommend">
            RECOMMENDATION: REGULAR EMPLOYMENT
            <span class="box">{{ $secondResult === 'Passed' ? '✓' : '' }}</span> YES
            <span class="box">{{ $secondResult === 'Failed' ? '✓' : '' }}</span> NO
        </div>

        <div class="bottom-block">
            <div class="comments-title">COMMENTS / REMARKS:</div>
            <div class="comments-box">{{ ($secondResult ?? 'N/A') . ': ' . ($evaluation->comment_2 ?? '-') }}</div>

            <table class="manager">
                <tr>
                    <td><span class="manager-label">Rated by:</span><span class="manager-line"><span class="manager-name">{{ $evaluation->rated_by_2 ? substr($evaluation->rated_by_2, 0, 25) : '' }}</span></span></td>
                    <td><span class="manager-label">Date:</span><span class="manager-line" style="width:50%;"></span></td>
                </tr>
                <tr>
                    <td><span class="manager-label">Reviewed by:</span><span class="manager-line"><span class="manager-name">{{ $evaluation->reviewed_by_2 ? substr($evaluation->reviewed_by_2, 0, 25) : '' }}</span></span></td>
                    <td><span class="manager-label">Date:</span><span class="manager-line" style="width:50%;"></span></td>
                </tr>
                <tr>
                    <td><span class="manager-label">Approved by:</span><span class="manager-line"><span class="manager-name">{{ $evaluation->approved_by_2 ? substr($evaluation->approved_by_2, 0, 25) : '' }}</span></span></td>
                    <td><span class="manager-label">Date:</span><span class="manager-line" style="width:50%;"></span></td>
                </tr>
            </table>
        </div>
    </div>
@endif

</body>
</html>

