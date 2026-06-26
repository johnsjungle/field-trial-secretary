# ASFA Hound Record Mapping

The ASFA Records Program thread and exported data provide a strong starting point for the dog record in Field Trial Secretary.

The legacy ASFA table is named `Hounds`. In this application, the neutral table name is `dogs`, because the app may handle AKC and ASFA workflows.

## Legacy ASFA Fields Found

From the ASFA hounds export:

- `HoundKey`
- `Breed`
- `RegNumber`
- `CallName`
- `RegName`
- `PreFix`
- `PostFix`
- `Sex`
- `DOB`
- `OwnerName`
- `OwnerCity`
- `OwnerState`
- `OwnerCountry`
- `ASFATitle`
- `CurPoints`
- `Q1ST`
- `Q2ND`
- `InitialDate`
- `LastTrialDate`
- `TotalPoints`
- `NumOfTrials`
- `Num1stPlacement`
- `Num2ndtPlacement`
- `Num3rdPlacement`
- `Num4thPlacement`
- `NumNBQ`
- `DisqualifiedInd`
- `DismissedInd`
- `IneligibleFlag`
- `Inactive`
- `Pending`
- `Void`

Later ASFA web-app work added:

- Multiple registration numbers per hound.
- Cleaned registration-number search field.
- Unknown DOB flag.
- Disciplinary clearance records.

## Field Trial Secretary Mapping

| ASFA field | New field |
| --- | --- |
| `HoundKey` | `dogs.legacy_hound_key` |
| `Breed` | `dogs.breed_id` |
| `RegNumber` | `dogs.registration_number` |
| cleaned `RegNumber` | `dogs.registration_number_clean` |
| `CallName` | `dogs.call_name` |
| `RegName` | `dogs.registered_name` |
| `PreFix` | `dogs.conformation_prefix` |
| `PostFix` | `dogs.performance_suffix` |
| `Sex` | `dogs.sex` |
| `DOB` | `dogs.date_of_birth` |
| unknown DOB | `dogs.date_of_birth_unknown` |
| `ASFATitle` | `dogs.asfa_title` |
| `CurPoints` | `dogs.current_points` |
| `Q1ST` | `dogs.q1st_count` |
| `Q2ND` | `dogs.q2nd_count` |
| `InitialDate` | `dogs.initial_trial_date` |
| `LastTrialDate` | `dogs.last_trial_date` |
| `TotalPoints` | `dogs.lifetime_points` |
| `NumOfTrials` | `dogs.lifetime_trial_count` |
| placement counts | `dogs.lifetime_first_count`, `lifetime_second_count`, etc. |
| `DisqualifiedInd` | `dogs.is_disqualified` |
| `DismissedInd` | `dogs.is_dismissed` |
| `IneligibleFlag` | `dogs.is_ineligible` |
| `Inactive` | `dogs.is_inactive` |
| `Pending` | `dogs.is_pending` |
| `Void` | `dogs.is_void` |

Owner fields should live in `people` and `dog_people`, not directly on `dogs`, so the same person can own or handle multiple dogs.

## Additions Needed For Trial Secretary Work

The field trial secretary app also needs fields and related tables that the legacy hound record does not fully cover:

- First-time entry tracking per trial.
- Certificate and registration document attachments.
- AKC/ASFA verification status.
- Import source and import review status.
- Handler information separate from owner information.
- Entry-specific status such as absent, withdrawn, excused, dismissed, or disqualified.
- Score-entry source and review status for future judge phone/tablet scoring.

