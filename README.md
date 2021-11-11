# setup-infracost

Sets up Infracost CLI in your GitHub Actions workflow.  Show cloud cost estimates for Terraform in pull requests.

This `setup-infracost` action downloads and installs the Infracost CLI.  Subsequent steps in the same job can run this CLI in the same way it is run on the command line.

## Usage

By default, the latest version of the Infracost CLI is installed, but a specific version can be specified:

```yaml
steps:
- uses: infracost/setup-infracost@v1
  with:
    version: 0.9.13
```

It is usually convenient to configure the Infracost API key:

```yaml
steps:
- uses: infracost/setup-infracost@v1
  with:
    api_key: ${{ secrets.INFRACOST_API_KEY }}
```

Typically this action will be used in conjunction with the `setup-terraform` action to comment on a pull request with the cost estimate for a terraform project.

```yaml
on:
  pull_request:
    paths:
      - '**.tf'
      - '**.tfvars'
      - '**.tfvars.json'
jobs:
  infracost:
    runs-on: ubuntu-latest
    name: Show infracost diff
    steps:
      - name: Check out repository
        uses: actions/checkout@v2

      - name: "Instance infracost"
        uses: infracost/setup-infracost@v1
        with:
          version: latest
          api_key: ${{ secrets.INFRACOST_API_KEY }}

      - name: "Install terraform"
        uses: hashicorp/setup-terraform@v1

      - name: "Terraform init"
        id: init
        run: terraform init
        working-directory: terraform

      - name: "Terraform plan"
        id: plan
        run: terraform plan -out plan.tfplan
        working-directory: terraform

      - name: "Terraform show"
        id: show
        run: terraform show -json plan.tfplan
        working-directory: terraform

      - name: "Save Plan JSON"
        run: echo '${{ steps.show.outputs.stdout }}' > plan.json # Do not change

      - name: "Infracost breakdown"
        run: infracost breakdown --path plan.json --format json > breakdown.json

      - name: "Infracost output"
        run: infracost output --no-color --format github-comment --path breakdown.json > comment.md

      - name: "Post comment"
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          path: comment.md
```

## Inputs

The action supports the following inputs:

- `version` - (optional) Version of Infracost CLI to install. E.g. 0.9.13

- `api_key` - (optional) The Infracost API key.

- `currency` - (optional) Preferred currency code (ISO 4217).  E.g. EUR

- `pricing_api_endpoint` - (optional) The address of a self hosted Cloud Pricing API.  See https://www.infracost.io/docs/cloud_pricing_api/self_hosted


## Outputs

This action does not set any direct outputs.
