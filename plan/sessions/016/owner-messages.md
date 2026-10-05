# Session 16: the owner's messages, word for word

2026-10-05. Pasted command output and screenshots are named, not copied.

1. hi
2. for now some inputs. I have added vercel-cli - try to see if you can access. the team in vercel is solarlayout. you will find many  projects, i have added the solarlayout-rooftop-app (API - next.js) project there - two environments staging and Production. see if you can see them there. Its not wired to any backend yet. I have added teh domains - rooftop.solarlayout.app and rooftop.staging.solarlayout.app . check these and we will talk after that
3. (added the directory `/Users/arunkpatra/codebase/solarlayout`) yes, we will have have the deployment jobs (env aware like we have in solarlayout), study the deployment related jobs over there to get a hang of teh setup/infra , alos you will find AWS_RESOURCES.md over there which will give you a picture of the lay of the land.

   After that we will talk
4. now the important questions. DO we use websocket or SSE that require long connections?
5. good. so our tech stack holds up and deployment and normal functioning should be possible? also the python API will be dockerized for the lambda deployment? if so we will be creating the ECR repo? GitHub actions need secrets for working successfully? I think we use some sort of access in GH for solarlayout that authorizes the GH action?
6. write the Phase 12 plan. I understand this work will be collaborative and needs my hands. ready to work with you - you will give me steps one at a time, preferably now, so that you can work effectively. Agree? suggest or push back
7. (pasted the output of `aws ecr create-repository`: the repository `solarlayout/rooftop-api` in ap-south-1)
8. You are authorized - execute the command yourself
9. Are you sure we are not already authorized to use 10,240 MB? IMO we should try to create the Lambda with that memory and check on our side first. Also, when we do real testing, we should see how much actual memory we consume and bring down the memory to save costs and match (with some headroom) as actually what we need
10. run it yourself
11. done, role created
12. (pasted the output of the throwaway function at 10,240 MB: created, invoked with `memory_limit_in_mb: 10240`, deleted)
13. done, prod role created
14. done, both github roles created
15. done. check
16. done, docker is running. check
17. done. also updated aws cli to latest
18. why did we have so vastly different approach for prod/staging deployment of the vercel app than the solartlayout vercel apps. there in that workflow we have user input for the environment name and it deployes to vercel (i think we have some vercel.json files etc which says that auto deploy is not done on push and is alwaays manual deployment.
19. one workflow with the dropdown. no automatic staging - we are cost conscious
20. why is "check" running when there were no application code changes?
21. why are you running fast check when you made no code changes?
22. Is the #94 PR expected to run checks?
23. CI passed
24. (ran `gh workflow run deploy -f environment=Staging`)
25. run it yourself
26. put this yourself -  ROOFTOP_API_ORIGIN ; then tell me how to create teh esri key step by step one step at a time
27. (two screenshots: the local Esri key's privileges and its details)
28. (screenshot: "Where will you use these credentials?")
29. (screenshot: "Item access")
30. Its asking for the privileges... which ones to choose?
31. exp date and ref urls
32. title, tags, summary
33. done, staging key saved to vercel
34. start it yourself
35. yes. ESRI prod key made and set in vercel prod env
36. go
37. vercel prod app env vars?
38. go, run the roof at the limit on staging
39. this look svery suspicious and fishy. file a GH issue to investigate as what take so much memory. it must be bad algorithms, raw arrays etc, not vectorized using numpy etc, bad algos with O n square cost etc....  What else is pending for deployment phase 12? The optimization is phase 13
40. yes, apply 1, then do 2 to 5
41. what's this : `Found two issues: a 6.5 MB payload triggers AWS's own 413 error (not ours), and a 5.5 MB payload hits a 429 concurrency` - what is sending these large payloads and to whome? legit or error?
42. is the large files that you sent actually possible?
43. what's this concurrentcy cap? we want the app to be prod ready? what's this "joker" values of 10, 25 etc?
44. what is this rserved concurrency? what is being reserved? is it like some lambdas are kept "hot" and we are billed?
45. ok, set production to 100 and staging to 50.
46. point 5 done. ok.
    point 4 - open a GH issue.
    Point 3- not needed
    point 2 and 1 - Open GH issue
47. did you put 1 thread on both? how is this being controlled?
48. yes, move it into the image. But first, tell  me what memory was used with 1 thread at the limit
49. deployment to staging and prod complete
50. update STATE and write the resume prompt for next session. In next session you must interview me for my inpputs , i have many regarding bad code taking so much memory etc.
