# Session 14: the owner's messages, word for word

2026-10-04. The record of the session is written at its end; this file grows as the session goes.

## 1. The work order (the resume prompt `plan/resume/014-phase-11-hardening.md`, pasted)

Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 11: hardening for the tradeshow [...]

[The rest of the prompt is `plan/resume/014-phase-11-hardening.md`, unchanged.]

## 2. While the session read and checked

what are you currently doing?

## 3. After the plan was shown

explain the plaan to me in simple/functional english one at a time, i will scope/descope basis that.

## 4. To item 1 (the stand on a production build)

agree in principle. But the product will be built and deployed to staging/production whose infra/mechanics we will build. Vercel will host
the UI app. the API ,ost probably in AWS as Lambda function. My other production apps leverage this type of production deployment topology.
We will work on prod deployment in another dedicated PR (piece of work - whose details we will lay out at that time). Instaed of `bun stand`
, maybe `bun start` may run the app like a prod setup from a built Next.js app? push back, or suggest sequencing with reasons.

## 5. To the question where the stand runs from

in the tradeshow, the product will be demoed from live production - rooftop.solarlayout.app (staging will be
rooftop.staging.solarlayout.app for pre-prod testing). prod and staging share nothing.

## 6. Item 1, final form

keep item 1 in this form

## 7. Item 2 (the browser tests cheaper)

keep

## 8. Item 3 (the base's imports), a question

when you say, `one biger pull request that runs every test` do you mean e2e tast or the fast lane?

## 9. Item 3, decided

you can keep perhaps. But I am not sure if the massive e2e suite can ever run on CI with such low power machines

## 10. Item 4 (the audits and the guide), a question

how long the parity audit and numbers audit would take? drop if it would take hours for you do it (you, claude code - not me, human)
Operators guide is useful.

## 11. Item 4, decided

drop all three for now, and file a GH issue instead. This is because, i will test end to end first myself (by hand) and would be able to
give feedback

## 12. Item 5 (the journeys)

not needed - low value at this point. file a GH issue - in which i will decide the fate of e2e tests based on my actual testing, value it
provides, cost etc.

## 13. Item 6 (resilience), to the roof limit of 10 hectares

these appear to be absurd numbers for rooftop. we must mimit to realistic rooftop sizes actually possible in practiice and standard in solar
rooftop design world. We should politely refuse beyond the limit with clear verbiage and reason and thell them what to do. agree on rest -
decide on the value it gives and the probability of those failures

## 14. When the session looked in the handbook

handbook was for utility scale - no rooftop information there

## 15. To the proposed 30,000 m²

30,000 sq meters is approx how many meteres length and width?

## 16. Item 6, decided

ok

## 17. Item 7 (Present's fixes)

keep, but tell me what is this "Present" mode?

## 18. After Present was explained

i would much love to see this working to get a feel for it! Maybe after we have the `bun start` so that it would be fast. what's the effort
involved in step 7 and quantume of work?

## 19. Item 7, decided

For task 7, file a GH issue. I will record a video and it will serve me well for now - cheaper option.

## 20. Item 8 (pytest on GitHub)

keep. The python API will run in AWS Lambda when we deploy, so all bad code related to algorithmic soundness need to be fixed. API should be
fast, optimized both in time and space(memory).

## 21. To the sequencing of the API's performance

agree. API performation gets its dedicated GH issue now

## 22. Item 9 (keyboard, reduced motion, browsers)

not needed at the moment - file GH issue instead

## 23. Item 10 (polish)

keep

## 24. The Layers button

Build it
