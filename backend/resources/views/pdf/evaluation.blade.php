<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Performance Appraisal</title>
    <style>
        @page { margin: 14px 16px; }
        body { font-family: "Times New Roman", serif; font-size: 10pt; color: #000; line-height: 1.1; margin: 0; padding: 0; }
        .doc, .doc * { font-family: "Times New Roman", serif !important; font-size: 10pt !important; line-height: 1.1 !important; }
        .doc { width: 100%; max-width: 700px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 8px; margin-top: 0; padding: 4px 0; }
        .logo-wrap { margin-bottom: 4px; }
        .logo-image { max-height: 56px; max-width: 140px; object-fit: contain; }
        .address { font-size: 9px; line-height: 1.2; margin-bottom: 4px; white-space: pre-line; }
        .company { color: #000; font-weight: 700; font-size: 19px; letter-spacing: 0.3px; margin-bottom: 5px; }
        .title { font-weight: 700; font-size: 16px; letter-spacing: 0.5px; margin-top: 5px; }
        .meta { margin-bottom: 8px; }
        .meta-row { margin-bottom: 3px; white-space: nowrap; }
        .meta-label { font-weight: 700; display: inline-block; width: 170px; font-size: 10px; padding-right: 8px; box-sizing: border-box; }
        .meta-value-line { display: inline-block; width: auto; max-width: 72%; border-bottom: 1px solid #000; vertical-align: bottom; padding: 0 4px 1px 2px; box-sizing: border-box; }
        .meta-value { color: #000; font-weight: 700; font-size: 10px; }
        .eval-tag { color: #708090; font-style: italic; font-size: 8.5px; margin-left: 5px; }

        table.criteria { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
        table.criteria th { font-size: 10px; text-align: center; text-decoration: underline; padding-bottom: 4px; }
        table.criteria td { vertical-align: top; padding: 4px 0; }
        .criterion-title { font-weight: 700; font-size: 10px; margin-bottom: 1px; text-indent: 0; }
        .criterion-desc { margin-left: 12px; font-size: 8.5px; line-height: 1.2; text-align: left; }
        .rating-cell { width: 26%; text-align: center; vertical-align: middle; }
        .rating-line { border-bottom: 1px solid #000; min-height: 14px; line-height: 14px; font-size: 12px; font-weight: 700; width: 78%; margin: 0 auto; }

        .total-row { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 6px; }
        .total-label-cell { width: 74%; text-align: right; font-weight: 700; font-size: 11px; padding-right: 6px; vertical-align: middle; }
        .total-score-cell { width: 26%; text-align: center; vertical-align: middle; }
        .total-value-line { display: block; width: 78%; border-bottom: 1px solid #000; text-align: center; margin: 0 auto; font-size: 12px; line-height: 16px; min-height: 14px; }
        .agreement { margin-top: 10px; margin-bottom: 10px; font-size: 9px; line-height: 1.28; }

        .sign-row { width: 100%; border-collapse: collapse; margin-top: 9px; margin-bottom: 12px; }
        .sign-row td { width: 50%; vertical-align: middle; padding-bottom: 2px; white-space: nowrap; }
        .line-label { font-weight: 700; font-size: 10px; display: inline-block; white-space: nowrap; }
        .line { border-bottom: 1px solid #000; display: inline-block; width: 55%; margin-left: 5px; min-height: 12px; vertical-align: middle; }
        .signature-line { width: 36%; margin-left: 4px; }
        .date-label { color: #000; font-weight: 700; margin-right: 4px; font-size: 10px; }
        .date-value { color: #000; font-weight: 700; font-size: 10px; }

        .subhead { font-weight: 700; margin-top: 8px; margin-bottom: 4px; font-size: 10px; }
        .list { font-size: 9px; margin-left: 20px; line-height: 1.3; margin-top: 2px; margin-bottom: 5px; }
        .recommend { margin-top: 9px; margin-bottom: 9px; font-weight: 700; font-size: 10px; }
        .box { display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin: 0 4px 0 7px; position: relative; vertical-align: middle; }
        .box.checked::after {
            content: '';
            position: absolute;
            left: 2px;
            top: 0px;
            width: 3px;
            height: 6px;
            border-right: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            transform: rotate(45deg);
        }

        .bottom-block { margin-top: 11px; }
        .comments-title { margin-top: 9px; margin-bottom: 5px; font-weight: 700; font-size: 10px; }
        .comments-line { border-bottom: 1px solid #000; min-height: 14px; line-height: 14px; margin-top: 2px; padding: 0 2px; font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .manager { width: 100%; border-collapse: collapse; margin-top: 11px; margin-bottom: 0; }
        .manager td { width: 50%; padding-bottom: 6px; vertical-align: middle; font-size: 8.5px; }
        .manager-field { white-space: nowrap; }
        .manager-label { display: inline-block; width: 64px; font-size: 8.5px; }
        .manager-date-label { display: inline-block; width: 36px; font-size: 8.5px; }
        .manager-line { border-bottom: 1px solid #000; display: inline-block; width: 74%; margin-left: 4px; min-height: 12px; line-height: 12px; vertical-align: middle; position: relative; padding: 0 2px; }
        .manager-date-line { width: 70%; }
        .manager-name { color: #000; font-weight: 700; font-size: 8.5px; white-space: nowrap; max-width: 145px; overflow: hidden; text-overflow: ellipsis; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
@php
    $fullName = trim(($employee->first_name ?? '') . ' ' . ($employee->last_name ?? ''));
    $deptTitle = trim(($employee->department ?? '-') . ' / ' . ($employee->position ?? '-'));
    $firstResult = $evaluation->remarks_1 ?? 'N/A';
    $secondResult = $evaluation->remarks_2 ?? 'N/A';
    $template = $template ?? [];
@endphp

@if($showFirst)
    <div class="doc">
        <div class="header">
            @if(!empty($template['evaluationLogoImage']))
                <div class="logo-wrap">
                    <img class="logo-image" src="{{ $template['evaluationLogoImage'] }}" alt="Office Logo">
                </div>
            @endif
            @if(!empty($template['headerDetails']))
                <div class="address">{{ $template['headerDetails'] }}</div>
            @endif
            <div class="company">{{ $template['companyName'] ?? 'Company Name' }}</div>
            <div class="title">{{ $template['title'] ?? 'PERFORMANCE APPRAISAL' }}</div>
        </div>

        <div class="meta">
            <div class="meta-row">
                <span class="meta-label">{{ $template['metaNameLabel'] ?? 'NAME' }}</span>
                <span class="meta-value-line"><span class="meta-value">{{ $fullName }}</span></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">{{ $template['metaDepartmentLabel'] ?? 'DEPARTMENT/JOB TITLE' }}</span>
                <span class="meta-value-line"><span class="meta-value">{{ $deptTitle }}</span></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">{{ $template['metaRatingPeriodLabel'] ?? 'RATING PERIOD' }}</span>
                <span class="meta-value-line">
                    <span class="meta-value">{{ $firstEvalDate }}</span>
                    <span class="eval-tag">(1st Evaluation)</span>
                </span>
            </div>
        </div>

        <table class="criteria">
            <thead>
                <tr>
                    <th style="width:70%;">{{ $template['criteriaHeader'] ?? 'CRITERIA' }}</th>
                    <th style="width:30%;">{{ $template['ratingHeader'] ?? 'RATING' }}</th>
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

        <table class="total-row">
            <tr>
                <td class="total-label-cell">TOTAL SCORE</td>
                <td class="total-score-cell"><span class="total-value-line">{{ $evaluation->score_1 ?? '' }}</span></td>
            </tr>
        </table>

        <div class="agreement">
            {{ $template['agreementText'] ?? 'The above appraisal was discussed with me by my superior and I' }}
            <span class="{{ ($evaluation->agreement_1 ?? '') === 'agree' ? 'box checked' : 'box' }}"></span> agree
            <span class="{{ ($evaluation->agreement_1 ?? '') === 'disagree' ? 'box checked' : 'box' }}"></span> disagree on the following items:
        </div>

        <table class="sign-row">
            <tr>
                <td>
                    <span class="line-label">SIGNATURE OF EMPLOYEE:</span>
                    <span class="line signature-line">&nbsp;</span>
                </td>
                <td>
                    <span style="color:#000; font-weight:700; text-decoration:none;">DATE:</span>
                    <span class="line" style="width:55%;"></span>
                </td>
            </tr>
        </table>

        <div class="subhead">{{ $template['ratingScaleTitle'] ?? 'EMPLOYEE SHALL BE RATED AS FOLLOWS:' }}</div>
        <div class="list">
            @foreach($ratingScaleLines ?? [] as $line)
                <div>{{ $line }}</div>
            @endforeach
        </div>

        <div class="subhead" style="margin-top:6px;">{{ $template['interpretationTitle'] ?? 'INTERPRETATION OF TOTAL RATING SCORE:' }}</div>
        <div class="list" style="margin-left:0;">
            @foreach($interpretationLines ?? [] as $line)
                <div>{{ $line }}</div>
            @endforeach
        </div>

        <div class="recommend">
            {{ $template['recommendationLabel'] ?? 'RECOMMENDATION: REGULAR EMPLOYMENT' }}
            <span class="{{ $firstResult === 'Passed' ? 'box checked' : 'box' }}"></span> YES
            <span class="{{ $firstResult === 'Failed' ? 'box checked' : 'box' }}"></span> NO
        </div>

        <div class="bottom-block">
            <div class="comments-title">{{ $template['remarksLabel'] ?? 'COMMENTS / REMARKS:' }}</div>
            <div class="comments-line">{{ ($firstResult ?? 'N/A') . ': ' . ($evaluation->comment_1 ?? '-') }}</div>

            <table class="manager">
                <tr>
                    <td class="manager-field"><span class="manager-label">{{ $template['ratedByLabel'] ?? 'Rated by:' }}</span><span class="manager-line"><span class="manager-name">{{ $evaluation->rated_by ? substr($evaluation->rated_by, 0, 25) : '' }}</span></span></td>
                    <td class="manager-field"><span class="manager-date-label">Date:</span><span class="manager-line manager-date-line"></span></td>
                </tr>
                <tr>
                    <td class="manager-field"><span class="manager-label">{{ $template['reviewedByLabel'] ?? 'Reviewed by:' }}</span><span class="manager-line"><span class="manager-name">{{ $evaluation->reviewed_by ? substr($evaluation->reviewed_by, 0, 25) : '' }}</span></span></td>
                    <td class="manager-field"><span class="manager-date-label">Date:</span><span class="manager-line manager-date-line"></span></td>
                </tr>
                <tr>
                    <td class="manager-field"><span class="manager-label">{{ $template['approvedByLabel'] ?? 'Approved by:' }}</span><span class="manager-line"><span class="manager-name">{{ $evaluation->approved_by ? substr($evaluation->approved_by, 0, 25) : '' }}</span></span></td>
                    <td class="manager-field"><span class="manager-date-label">Date:</span><span class="manager-line manager-date-line"></span></td>
                </tr>
            </table>
        </div>
    </div>
@endif

@if($showSecond)
    <div class="doc {{ $showFirst ? 'page-break' : '' }}">
        <div class="header">
            @if(!empty($template['evaluationLogoImage']))
                <div class="logo-wrap">
                    <img class="logo-image" src="{{ $template['evaluationLogoImage'] }}" alt="Office Logo">
                </div>
            @endif
            @if(!empty($template['headerDetails']))
                <div class="address">{{ $template['headerDetails'] }}</div>
            @endif
            <div class="company">{{ $template['companyName'] ?? 'Company Name' }}</div>
            <div class="title">{{ $template['title'] ?? 'PERFORMANCE APPRAISAL' }}</div>
        </div>

        <div class="meta">
            <div class="meta-row">
                <span class="meta-label">{{ $template['metaNameLabel'] ?? 'NAME' }}</span>
                <span class="meta-value-line"><span class="meta-value">{{ $fullName }}</span></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">{{ $template['metaDepartmentLabel'] ?? 'DEPARTMENT/JOB TITLE' }}</span>
                <span class="meta-value-line"><span class="meta-value">{{ $deptTitle }}</span></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">{{ $template['metaRatingPeriodLabel'] ?? 'RATING PERIOD' }}</span>
                <span class="meta-value-line">
                    <span class="meta-value">{{ $secondEvalDate }}</span>
                    <span class="eval-tag">(2nd Evaluation)</span>
                </span>
            </div>
        </div>

        <table class="criteria">
            <thead>
                <tr>
                    <th style="width:70%;">{{ $template['criteriaHeader'] ?? 'CRITERIA' }}</th>
                    <th style="width:30%;">{{ $template['ratingHeader'] ?? 'RATING' }}</th>
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

        <table class="total-row">
            <tr>
                <td class="total-label-cell">TOTAL SCORE</td>
                <td class="total-score-cell"><span class="total-value-line">{{ $evaluation->score_2 ?? '' }}</span></td>
            </tr>
        </table>

        <div class="agreement">
            {{ $template['agreementText'] ?? 'The above appraisal was discussed with me by my superior and I' }}
            <span class="{{ ($evaluation->agreement_2 ?? '') === 'agree' ? 'box checked' : 'box' }}"></span> agree
            <span class="{{ ($evaluation->agreement_2 ?? '') === 'disagree' ? 'box checked' : 'box' }}"></span> disagree on the following items:
        </div>

        <table class="sign-row">
            <tr>
                <td>
                    <span class="line-label">SIGNATURE OF EMPLOYEE:</span>
                    <span class="line signature-line">&nbsp;</span>
                </td>
                <td>
                    <span style="color:#000; font-weight:700; text-decoration:none;">DATE:</span>
                    <span class="line" style="width:55%;"></span>
                </td>
            </tr>
        </table>

        <div class="subhead">{{ $template['ratingScaleTitle'] ?? 'EMPLOYEE SHALL BE RATED AS FOLLOWS:' }}</div>
        <div class="list">
            @foreach($ratingScaleLines ?? [] as $line)
                <div>{{ $line }}</div>
            @endforeach
        </div>

        <div class="subhead" style="margin-top:6px;">{{ $template['interpretationTitle'] ?? 'INTERPRETATION OF TOTAL RATING SCORE:' }}</div>
        <div class="list" style="margin-left:0;">
            @foreach($interpretationLines ?? [] as $line)
                <div>{{ $line }}</div>
            @endforeach
        </div>

        <div class="recommend">
            {{ $template['recommendationLabel'] ?? 'RECOMMENDATION: REGULAR EMPLOYMENT' }}
            <span class="{{ $secondResult === 'Passed' ? 'box checked' : 'box' }}"></span> YES
            <span class="{{ $secondResult === 'Failed' ? 'box checked' : 'box' }}"></span> NO
        </div>

        <div class="bottom-block">
            <div class="comments-title">{{ $template['remarksLabel'] ?? 'COMMENTS / REMARKS:' }}</div>
            <div class="comments-line">{{ ($secondResult ?? 'N/A') . ': ' . ($evaluation->comment_2 ?? '-') }}</div>

            <table class="manager">
                <tr>
                    <td class="manager-field"><span class="manager-label">{{ $template['ratedByLabel'] ?? 'Rated by:' }}</span><span class="manager-line"><span class="manager-name">{{ $evaluation->rated_by_2 ? substr($evaluation->rated_by_2, 0, 25) : '' }}</span></span></td>
                    <td class="manager-field"><span class="manager-date-label">Date:</span><span class="manager-line manager-date-line"></span></td>
                </tr>
                <tr>
                    <td class="manager-field"><span class="manager-label">{{ $template['reviewedByLabel'] ?? 'Reviewed by:' }}</span><span class="manager-line"><span class="manager-name">{{ $evaluation->reviewed_by_2 ? substr($evaluation->reviewed_by_2, 0, 25) : '' }}</span></span></td>
                    <td class="manager-field"><span class="manager-date-label">Date:</span><span class="manager-line manager-date-line"></span></td>
                </tr>
                <tr>
                    <td class="manager-field"><span class="manager-label">{{ $template['approvedByLabel'] ?? 'Approved by:' }}</span><span class="manager-line"><span class="manager-name">{{ $evaluation->approved_by_2 ? substr($evaluation->approved_by_2, 0, 25) : '' }}</span></span></td>
                    <td class="manager-field"><span class="manager-date-label">Date:</span><span class="manager-line manager-date-line"></span></td>
                </tr>
            </table>
        </div>
    </div>
@endif

</body>
</html>
