# Field Trial Secretary v0.4.6 beta

Adds a complete AKC JC/QC test workflow and the official paperwork needed to run and close out those tests.

- Adds an AKC-only **JC/QC** area where test entries can be added at any point during the trial.
- Allows a hound to enter JC, QC, the regular trial, or any combination without mixing the test and trial results.
- Tracks test order, judges, QC partners, pending/pass/fail/scratch status, and notes.
- Prints the official AKC JC/QC test record sheet and places test results before regular trial results in the final packet.
- Prints an individual official QC certificate for each pending or passing QC hound, with owner and judge signature lines left ready for the event.
- Adds the official Judges' Book cover, prefilled with event and judge contact information, to the trial closeout tools and final packet.
- Prevents QC certificates from being generated for failed or scratched test entries.
- Includes regression coverage for JC/QC data handling, PDF generation, certificate eligibility, Judges' Book output, and final packet order.

This release retains the safe first-run database setup, one-click verified updater, and archive reliability improvements from earlier v0.4 releases.
