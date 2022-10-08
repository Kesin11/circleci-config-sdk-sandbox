const CircleCI = require("@circleci/circleci-config-sdk")
// Manual trigger sample
// https://support.circleci.com/hc/en-us/articles/360050351292-How-to-Trigger-a-Workflow-via-CircleCI-API-v2

const main = async () => {
  const TRIGGER_NAME = 'manual_deploy'
  const config = new CircleCI.Config()

  // Workflow condition
  const when = new CircleCI.logic.When(
    new CircleCI.logic.conditional.Truthy(`<< pipeline.parameters.${TRIGGER_NAME} >>`)
  )
  const workflow = new CircleCI.Workflow('deploy', [], when)
  config.addWorkflow(workflow)

  // Pipeline parameters
  config.defineParameter(TRIGGER_NAME, 'boolean', false)

  const nodeExecutor = new CircleCI.executors.DockerExecutor('cimg/node:lts', 'small')
  const deployJob = new CircleCI.Job('deploy', nodeExecutor, [
    new CircleCI.commands.Checkout(),
    new CircleCI.commands.Run({
      name: 'install',
      command: 'npm ci',
    }),
    new CircleCI.commands.Run({
      name: 'deploy',
      command: 'npm run deploy',
    })
  ])
  config.addJob(deployJob)
  workflow.addJob(deployJob)

  // Output
  console.log(config.stringify())
  console.warn(config.stringify())
}
main()
