# The API on AWS: what exists and how it was made

The API runs on AWS Lambda as a container image behind a Function URL that streams (`plan/phase-12-plan.md`). Everything
here was made by hand, once, by the owner, from the commands below; CI only builds images and moves aliases, when the
owner starts it (`.github/workflows/deploy.yml`, with the environment chosen). The files beside this one are the documents the commands apply.

Account `378240665051`, region `ap-south-1`, CLI profile `journium-dev`. That profile defaults to `us-east-1`: every
command names the region. Under zsh write `${ENV}:live` with braces (`$ENV:l…` is one of zsh's modifiers), and never keep
several options in one variable (`R="--region … --profile …"`): zsh passes it as one word and every command fails. In bash, an
array: `R=(--region ap-south-1 --profile journium-dev)` and `"${R[@]}"`.

| Thing | Staging | Production |
|---|---|---|
| ECR repository (shared: production runs staging's image) | `solarlayout/rooftop-api` | same |
| Function | `solarlayout-rooftop-api-staging` | `solarlayout-rooftop-api-prod` |
| Alias the Function URL serves | `live` | `live` |
| Execution role (logs only) | `solarlayout-rooftop-api-staging-execution` | `solarlayout-rooftop-api-prod-execution` |
| GitHub's role (its environment alone) | `solarlayout-rooftop-github-staging` | `solarlayout-rooftop-github-prod` |
| Reserved concurrency | 50 | 100 (the owner's say, 2026-10-05; first 2 and 10). A ceiling and a slice of the account's 2,500, at no cost; 2,350 stay for the account's other functions |
| Simulation threads (`ROOFTOP_SIMULATION_THREADS`) | 1 | 1 (D61; was 2 at creation) |

## 1. The ECR repository (done 2026-10-05)

```
aws ecr create-repository --repository-name solarlayout/rooftop-api \
  --image-tag-mutability MUTABLE --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --tags Key=owner,Value=solarlayout Key=app,Value=rooftop --region ap-south-1 --profile journium-dev
```

Images are tagged with their commit (never moved); functions run an image by its digest.

## 2. The account's Lambda limits (read 2026-10-05)

`aws lambda get-account-settings`: 2,500 concurrent executions, all unreserved. A function of 10,240 MB was created,
run (`memory_limit_in_mb: 10240`) and deleted: this account is not held to 3,008 MB, whatever older notes say.

## 3. The roles (done 2026-10-05)

The execution roles, one per environment (`lambda-execution-trust.json`: the Lambda service, for this account alone):

```
for ENV in staging prod; do
  aws iam create-role --role-name solarlayout-rooftop-api-${ENV}-execution \
    --assume-role-policy-document file://infra/aws/lambda-execution-trust.json \
    --tags Key=owner,Value=solarlayout Key=app,Value=rooftop Key=env,Value=${ENV} --profile journium-dev
  aws iam attach-role-policy --role-name solarlayout-rooftop-api-${ENV}-execution \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole --profile journium-dev
done
```

GitHub's roles, one per GitHub environment, through the account's GitHub OIDC provider (`github-<env>-trust.json`:
the subject `repo:SolarLayout@279592171/rooftop-design-app@1394664976:environment:Staging` or `:Production` alone; `github-<env>-policy.json`: push to
and read the one repository, update, publish and alias its own function, nothing else; no `iam:PassRole`):

```
for ENV in staging prod; do
  aws iam create-role --role-name solarlayout-rooftop-github-${ENV} \
    --assume-role-policy-document file://infra/aws/github-${ENV}-trust.json \
    --tags Key=owner,Value=solarlayout Key=app,Value=rooftop Key=env,Value=${ENV} --profile journium-dev
  aws iam put-role-policy --role-name solarlayout-rooftop-github-${ENV} --policy-name rooftop-github-${ENV} \
    --policy-document file://infra/aws/github-${ENV}-policy.json --profile journium-dev
done
```

The subject carries the owner's and the repository's IDs: this repository uses GitHub's immutable subject claims (on by
default for repositories made after 2026-07-15; `gh api repos/SolarLayout/rooftop-design-app/actions/oidc/customization/sub`
says `use_immutable_subject: true` and the prefix). The owner's other repository, older, has the plain form. The roles
were first made with the plain form, which never matches here; their trust was replaced with:

```
for ENV in staging prod; do
  aws iam update-assume-role-policy --role-name solarlayout-rooftop-github-${ENV} \
    --policy-document file://infra/aws/github-${ENV}-trust.json --profile journium-dev
done
```

Checked with `aws iam simulate-principal-policy`: each role is allowed `UpdateFunctionCode`, `PublishVersion`,
`UpdateAlias` on its own function and `PutImage` on the repository; denied the other environment's function,
configuration changes, deletes, Function URLs, image deletes, and every other repository.

## 4. GitHub (done 2026-10-05)

Environments `Staging` and `Production`, each deployable from `main` alone, each with the secret `AWS_ROLE_ARN` (its
role above). Repository variables `AWS_REGION`, `AWS_ACCOUNT_ID`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; secret
`VERCEL_TOKEN` (scoped to the SolarLayout team).

## 5. The functions (done 2026-10-05: staging from `adddc6d`, production from the same image after its smoke)

The first run of `deploy` to Staging pushes the image of its commit and then stops at the web app's build, which needs
`ROOFTOP_API_ORIGIN` (the Function URL, made here) before anything else moves. With that commit's image (`<sha>`), for each
environment:

```
ENV=staging   # then prod
F=solarlayout-rooftop-api-${ENV}
IMAGE=378240665051.dkr.ecr.ap-south-1.amazonaws.com/solarlayout/rooftop-api:<sha>
RESERVED=50   # 100 for prod

aws logs create-log-group --log-group-name /aws/lambda/${F} --region ap-south-1 --profile journium-dev
aws logs put-retention-policy --log-group-name /aws/lambda/${F} --retention-in-days 30 --region ap-south-1 --profile journium-dev

aws lambda create-function --function-name ${F} --package-type Image --code ImageUri=${IMAGE} \
  --architectures arm64 --memory-size 10240 --timeout 900 \
  --role arn:aws:iam::378240665051:role/solarlayout-rooftop-api-${ENV}-execution \
  --environment "Variables={ROOFTOP_SIMULATION_THREADS=1}" \
  --tags owner=solarlayout,app=rooftop,env=${ENV} --region ap-south-1 --profile journium-dev
aws lambda wait function-active-v2 --function-name ${F} --region ap-south-1 --profile journium-dev

V=$(aws lambda publish-version --function-name ${F} --query Version --output text --region ap-south-1 --profile journium-dev)
aws lambda create-alias --function-name ${F} --name live --function-version ${V} --region ap-south-1 --profile journium-dev
aws lambda put-function-concurrency --function-name ${F} --reserved-concurrent-executions ${RESERVED} \
  --region ap-south-1 --profile journium-dev

aws lambda create-function-url-config --function-name ${F} --qualifier live \
  --auth-type NONE --invoke-mode RESPONSE_STREAM --region ap-south-1 --profile journium-dev
aws lambda add-permission --function-name ${F} --qualifier live --statement-id public-function-url \
  --action lambda:InvokeFunctionUrl --principal "*" --function-url-auth-type NONE \
  --region ap-south-1 --profile journium-dev
aws lambda add-permission --function-name ${F} --qualifier live --statement-id public-function-url-invoke \
  --action lambda:InvokeFunction --principal "*" --invoked-via-function-url \
  --region ap-south-1 --profile journium-dev
```

Both permissions: since October 2025 a Function URL with auth `NONE` answers 403 unless its policy holds
`lambda:InvokeFunctionUrl` and `lambda:InvokeFunction` (the second limited to calls through the URL). The flag
`--invoked-via-function-url` needs a recent AWS CLI.

The Function URL's auth is `NONE` (decision 2): the API is public through the web origin in any case; the guard is the
reserved concurrency. The URL goes into Vercel as that environment's `ROOFTOP_API_ORIGIN`, and nowhere else.
Memory starts at 10,240 MB and is fitted from the `REPORT` lines' `Max Memory Used` on staging (decision 3).

## Rollback

The API: `aws lambda update-alias --function-name <F> --name live --function-version <previous>`; each deploy's summary
on GitHub prints the command with the version it moved from. Both sides at once: `deploy` with the earlier commit (to
Production, a commit that passed staging's smoke).
