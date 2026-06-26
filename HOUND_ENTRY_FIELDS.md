# Hound Entry Fields

Real lure coursing entry workflows need two related but different records:

- Master hound record: the dog known to the program.
- Trial entry record: the dog entered in a specific trial, class, and association.

## Master Hound Fields

Core identity:

- Call name
- Registered name
- Breed
- Sex
- Date of birth
- Breeder
- Sire
- Dam

Owner/contact:

- Owner name
- Owner email
- Owner phone
- Owner address, city, state, postal code, and country should be added next.

Registration:

- One hound can have multiple registration numbers.
- Each registration number needs:
  - Registry or agency, such as AKC, ASFA, CKC, FCI, NGA, UKC, foreign registry, or other.
  - Registration type, such as regular, PAL/ILP, FSS, foreign, critique, or other.
  - Registration number.
  - Primary flag.
  - Active flag.
  - Verification status.
  - Verification provider.
  - Verified date.

## Trial Entry Fields

Trial-specific information:

- Hound selected from master database, or created during entry.
- Class/stake entered.
- Registration number used for this trial.
- Registry used for this trial.
- Handler.
- Entry number.
- First-time entry flag.
- Certificate required flag.
- Certificate/document status.

## Verification Direction

The app should not assume internet access or assume that every registry has an API.

Suggested verification states:

- not_checked
- pending
- verified
- failed
- manual_override

Suggested provider handling:

- AKC can be added later if an official usable API or approved lookup method is available.
- ASFA may need local records or manual verification unless an official lookup endpoint exists.
- Other registries should remain manual until supported.

The secretary should always be able to continue offline and resolve verification items later.

