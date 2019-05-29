workflow "Run all on push" {
  on = "push"
  resolves = ["3. Secret"]
}

action "1. Install" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "install"
}

action "2. Build" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["1. Install"]
  args = "run build"
}

action "3. Secret" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["2. Build"]
  args = "run secret"
  secrets = ["EXAMPLE_SECRET"]
}
