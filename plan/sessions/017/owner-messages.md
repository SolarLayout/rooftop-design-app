# Session 17: the owner's messages, word for word

2026-10-05. Pasted command output and screenshots are named, not copied.

1. (pasted the resume prompt `plan/resume/016-phase-13-interview.md`: begin Phase 13 with the owner's interview)
2. The python engine side code is based on the original desktop app (pyqt5) - rooftop-design (repo) which was a POC and was developer by a non software developer. That repo had probably picked up much of the code from PVlayout_advance which is itself unsound in algorithms and is garbage production quality code. I suspect much of the memory and compute time issues because of those bad algorithms and un-otmised code. As a matter of fact solarlayout cloud product (studio) was about to build highly optimized versions and even at utility scale, the heavy compute lambdas don't blow the box even at thousands of acres of land. By my estimates, the compute for roofto at 30000 sq meters compute should happen in a flash and memory usage very tine , less than 512 mb probably if done right. You shoudl see ADR-14 in solarlayout repo
3. no, ADR-14 made sense for solarlayout mvp and studio, that uses DB, heavy artillery etc. On the contrary rooftop is pure stateless API at the monent. That's because its a simpler archotecture and setup for now. The product is free for all as a marketing stunt and teh product will eventually become paid and productionized and full server side functionality, persistence, databased backed state and storage and all simulations/projects stored server side etc... so ADR-14 is not binding at teh moment on rooftop - do do full ADR-14 it might take an extended period of arch/design/development.

   SCALE-BUDGET annotations not needed right now on rooftop.

   - no memory gate test needed and we don't want to bloat CI 

   - 30 K sq meters is the limit for rooftop and our testing here should be enoung.

   You should do all the optimization and testing related the memory consumption etc on this box
4. don't ask me, you should try and show me numbers and suggest. I suspect bad optimization and bad agos and wrong complexities of algos devastating the engine IMHO
5. parity with desktop app's outputs only - functional pieces no algos and software engineering or prigramming.

   Q4 scope waits
6. nothing specific, cover the rest yourself and read it back
7. looks good. you will optimize your work. you will not run endless UI tests or pythion tests mindlessly since they take a long time. We can write appropriate tests at the end of our work. Not tons of PRs mindlessly. We prove things locally first.
8. related to shading etc, try to see if we can be innovative - solar-mms-modeller repo does everyuthing in the UI side very successfully
9. keep all, go ahead with PR 1
10. PR #102 CI failed
11. merge both when green, then push for the 10 s target
12. also you are free to deploy to staging when its needed. we don't want unnecessray deploys and long stretches of waiting
13. where do results stand as of now?
14. 6 MB appears to be an unvalid limit. realostic files go to what sizes?
15. we will size for 3 mb. based on that how much memory we need for Lambda?
16. what is the bug you are talking about? is it real? tell me in simple terms
17. average to hourly. what mem we would need for lambda?
18. run the aws comand yourself
19. then do production the same way
20. yes. any more optimizations we wanted to do or had planned?
21. yes, do the one more PR
22. dumb question. why is even matplotlib needed? Our UI is all Next.js app
23. ok, we are done with perf. i am happy with results. is staging and prod deployment complete and teh smoke result from the deployment jobs in? if not, do it, and post the results here. and that will be all
24. so at this point, after all the optimizations there is no loss in fidelity in results, right?
25. i don't understand this gobbledegok. explain in simple terms if we lost parity or not
26. what is #99 and #100 - are they mission critical?
