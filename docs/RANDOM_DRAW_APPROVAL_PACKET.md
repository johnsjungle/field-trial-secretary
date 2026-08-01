# Field Trial Secretary Random Draw Approval Packet

## Review version

- Application version: 0.2.0
- Source commit: `62973b0763cf6752855f6bfeb250bddbc4fbd2fa`
- Production source: `app/script.js`
- Core code extract: `docs/random-draw-code-extract.js`

This packet describes how the application assigns hounds to courses and blanket
colors. It is intended for rules review and test approval. The code extract is a
copy of the production draw primitives; it is not a second implementation used
by the application.

## Summary

The draw uses the browser/operating system cryptographic random-number generator,
`crypto.getRandomValues()`. It does not use `Math.random()` for trial draws.

Random ordering uses an in-place Fisher-Yates shuffle. Random integer selection
uses rejection sampling so that reducing a 32-bit random value to a smaller range
does not introduce modulo bias.

The random result is then constrained by the approved lure coursing rules:

1. Determine the required number and size of courses.
2. Randomize the eligible hounds.
3. Assign hounds to courses, while attempting owner separation where applicable.
4. Randomize hound order within each regular course.
5. Assign blanket colors in display order: Yellow, Pink, Blue.

The displayed Yellow/Pink/Blue order does not make the draw non-random. Hounds
are randomized before those colors are assigned.

## Course-size rules

### Regular breed stakes

| Hounds | Course sizes |
| ---: | --- |
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 2, 2 |
| 5 | 3, 2 |
| 6 | 3, 3 |
| 7 | 3, 2, 2 |
| 8 | 3, 3, 2 |
| 9 | 3, 3, 3 |

The same pattern continues: courses of three are created until the remaining
four hounds are divided into two courses of two.

### Singles and LCI

Singles and LCI hounds run individually, but each draw-order course section is
filled before the next is opened:

| Hounds | Course sections |
| ---: | --- |
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 3, 1 |
| 5 | 3, 2 |
| 6 | 3, 3 |
| 7 | 3, 3, 1 |

For these groups, owner-separation markings are used only to avoid placing the
same owner's hounds consecutively when possible.

## Owner separation

For regular stakes, the program:

1. Randomizes all hounds.
2. Identifies separation groups that contain more than one hound.
3. Randomly assigns each hound to the least-filled eligible course.
4. Prefers a course that does not already contain the same separation group.
5. If separation is mathematically impossible, uses any least-filled course.

This is deliberately a best-effort rule. It never removes a hound or creates an
invalid course merely to guarantee separation.

For Singles and LCI, the program tests up to 61 secure random orders (the first
order plus 60 additional attempts) and retains the order with the fewest adjacent
hounds from the same separation group. It stops early if it finds an order with
no such adjacency.

## Event-specific use

### Preliminary draw

- Includes only hounds marked present at roll call.
- Refuses to draw while any hound remains unchecked.
- Groups hounds by breed and stake, including approved mixed-stake grouping.
- Uses the core course and blanket algorithm.
- Becomes locked once preliminary scoring begins or the trial is explicitly
  locked.

### Finals draw

- Refuses to draw until all required preliminary scores and outcomes for the
  requested stake or breed are complete.
- Excludes hounds with an ineligible outcome.
- Uses the same course sizing, owner-separation, shuffle, and blanket algorithm
  as the preliminary draw.

### Tie, BOB, and combined tie/BOB runoffs

- Includes only unresolved, active hounds for that runoff.
- Requires at least two eligible hounds.
- Uses regular course sizing and the same secure random assignment.
- Clears scores for a newly created runoff round while retaining prior rounds in
  runoff history.

### BIF

- Requires at least one assigned BIF judge.
- Includes only current BOB winners explicitly marked as running BIF.
- Uses regular course sizing and the same secure random assignment.

## Randomness properties

### What is guaranteed

- Random bytes come from `crypto.getRandomValues()`, a cryptographically secure
  random-number source supplied by the browser and operating system.
- Fisher-Yates gives every permutation the same probability when supplied with
  unbiased random integers.
- Rejection sampling prevents modulo bias in random integer selection.
- A hound is not intentionally favored by name, entry order, registration
  number, score, owner, or prior blanket color.
- Course and blanket display is normalized to Yellow, Pink, Blue after the
  randomized hound order is established.

### What is not guaranteed

- Two consecutive draws are not guaranteed to look different. A repeated result
  is possible in a fair random process.
- Owner separation is not guaranteed when the entries make it impossible.
- The current draw cannot be recreated from a saved seed. Fresh operating-system
  randomness is used for every draw.
- Statistical tests can detect significant bias; they cannot prove that every
  future random result will look evenly distributed.

## Audit and operational controls

- Every draw receives a unique ID and creation timestamp.
- Preliminary redraws and preliminary manual changes are recorded in the
  preliminary draw audit list.
- The UI identifies a preliminary draw that has manual alterations.
- Previous repeated tie-runoff scores are retained in runoff history.
- Scoring locks prevent ordinary preliminary or finals redraws after the
  applicable scoring stage is locked.

Recommended before production approval:

1. Decide whether the existing non-reproducible secure draw is preferred.
2. If exact replay is required, approve a future seeded draw and seed-recording
   design before implementation.
3. Require all draw types, including finals, runoffs, and BIF, to write the same
   detailed audit record as preliminary draws.
4. Record an algorithm version and eligible-entry fingerprint with every draw.

## Approval checklist

- [ ] Approve the regular course-size pattern.
- [ ] Approve the Singles/LCI fill-order pattern.
- [ ] Approve Yellow/Pink/Blue assignment after random hound ordering.
- [ ] Approve owner separation as best effort rather than absolute.
- [ ] Approve up to 60 extra attempts to reduce adjacent-owner conflicts in
      Singles/LCI.
- [ ] Approve use of the operating system cryptographic random source.
- [ ] Approve non-reproducible draws, or request a recorded-seed design.
- [ ] Approve redraw and manual-override controls.
- [ ] Approve the proposed test plan.

## Proposed test plan

### Rule tests

1. Test entry counts 1 through at least 100 and verify the expected course sizes.
2. Verify every eligible hound appears exactly once in every generated draw.
3. Verify no ineligible or absent hound appears.
4. Verify each course has no more than three hounds.
5. Verify each course has unique, valid colors in Yellow/Pink/Blue display order.
6. Verify Singles/LCI fill one section before proceeding to the next.
7. Verify feasible owner-separation cases are honored.
8. Verify impossible separation cases still retain every hound exactly once.
9. Verify mixed stakes preserve each hound's original stake for scoring.
10. Verify redraw locks after scoring begins.

### Statistical tests

For several representative groups, generate at least 100,000 draws:

1. Count how often each hound receives each blanket color.
2. Count how often each hound appears in each course.
3. Count pairings between every pair of hounds.
4. Apply chi-square goodness-of-fit tests at a pre-approved significance level.
5. Confirm there is no association with input order, hound name, owner, or prior
   draw.

Owner-separation tests must be analyzed separately because that rule intentionally
changes pairing probabilities.

### Failure and audit tests

1. Attempt a draw with unchecked roll-call entries.
2. Attempt finals before all required preliminary scores are entered.
3. Attempt BIF without a judge or selected BIF runner.
4. Redraw a group and verify the audit entry and timestamp.
5. Make a manual preliminary move/color change and verify the alteration marker
   and audit description.
6. Simulate closing the application immediately after a draw and verify the
   saved SQLite record after restart.

## Production code locations

Line numbers refer to the review commit above:

- Preliminary entry point: `app/script.js:5838`
- Preliminary group construction: `app/script.js:5903`
- Owner-separation ordering: `app/script.js:6213`
- Course sizing and assignment: `app/script.js:6282`
- Secure shuffle/random integer: `app/script.js:6342`
- Tie runoff construction: `app/script.js:7978`
- BIF construction: `app/script.js:8579`
- BOB/combined runoff construction: `app/script.js:10683`
- Finals construction: `app/script.js:11086`

