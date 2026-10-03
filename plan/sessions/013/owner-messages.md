# Session 13: the owner's messages, word for word

2026-10-03.

## 1. The work order (the resume prompt `plan/resume/012-phase-9-handover.md`, pasted)

Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 9: the Handover workspace: every deliverable of the
desktop app, previewed before download: [...]

[The rest of the prompt is `plan/resume/012-phase-9-handover.md`, unchanged.]

## 2. After the plan was shown

approved

## 3. After the boards were shown

approved

## 4. While pull request 1's full check ran

the full local check is running you said - 29 minutes. We should have robust and effective caching? DO we have it? tests/checks that
don't need to run again shouldn't run unnecesarily. Suggest

## 5. To the suggested split of the browser step

i tend to agree. yes.

## 6. On the split's gains

what can of wall clock time benefits can we expect after the split?

## 7.

the split did us good, or it made things worse? by hpw much?

## 8. During the fourth full run

so are there failing tests? it has become totally untenable to wait for so lomg. what do you suggest and why?

## 9.

Is there no way to run only a subset of the e2e tests?

## 10. To the retry and the worker count

yes. FYI... this is a Mac Studio Ultra machine, extremely beefy. If its buckling under pressure , does it indicate something else?

## 11. To the hardware WebGL experiment and the worker count

ok.

## 12. On the saturated cores

BTW, i checked in Activity monitor and found that all 20 cores are complete saturated.

## 13. The change of rule

Here's my take. Don't kill the currently running shell - let it finish. Beyond that, I am NOT willing to runn process after process spanning
10s of minutes. that's not how software development can work. Its just wasting time, and we have spent the whole machine. You are running on
Fable 5.1 - the highest quality model there is. Surely there is a problem witho our setup/approach

## 14. To the proposed rule (the fast check as the gate, the whole suite on demand)

Agree. Also, we will never run extremely long running jobs in GitHub as well - can't afford thsoe CI bills. e2e on GitHub should be on-demand
and should be its own workflow dispatch job - maybe e2e.yml. During development we do run the e2e tests which will give us relief to some
extent due to the split. Agree?

## 15. On the hardware WebGL experiment

what is the hardware webgl experiment in plain english? will it impact CI? is some special needs to be fulfilled in CI? the GH CI machiens
are pretty low power

## 16.

yes

## 17. While the trial ran

ok, do it. if we go the software route, don't fight with the e2e tests - do not run the full suite locally during the session either, just the
ones that we write in this session perhaps. We got to focus on the actual core PRs for teh session and complete them. that's the actual
priority

## 18. The pre-approval of Phase 10

Another instruction - as an exception to our current process: After all PRs merge for Phase 9, you will create the resume prompt for Phase
10, prepare the plan for Phase 10, any mockups that need to be created for the Phase 10, then start implementing - all on your own in
unattended mode. You are pre-approved for all Phase 10 work. You will complete Phase 10 work and merge all its PRs. All PRs must have
screenshots as earlier when needed. This process deviation till Phase 10 exists because, I will be AFK for an extended period of time. After
completing Phase 10 work, write the resume prompt for Phase 11 and wait for my go ahead.

## 19. On the screenshots

do ensure though, the the screenshots that you attach in the PR actually meet expectations of teh design, there were misses in an earlier PR
which I caught - this is important since you are running in un-attended mode till end of phase 10 and Phase 11 resume prompt creation -
FYA&A.

## 20. Along the way

ok.

what's the progress?
