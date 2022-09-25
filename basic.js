const CircleCI = require("@circleci/circleci-config-sdk")

const main = async () => {
  const config = new CircleCI.Config()
  const workflow = new CircleCI.Workflow('build')
  config.addWorkflow(workflow)

  const nodeExecutor = new CircleCI.executors.DockerExecutor('cimg/node:lts', 'small')
  const buildJob = new CircleCI.Job('build', nodeExecutor, [
    new CircleCI.commands.Checkout(),
    new CircleCI.commands.Run({
      name: 'install',
      command: 'npm ci',
    }),
    new CircleCI.commands.Run({
      name: 'build',
      command: 'npm run build',
    })
  ])
  config.addJob(buildJob)
  workflow.addJob(buildJob)

  const testJob = new CircleCI.Job('test', nodeExecutor, [
    new CircleCI.commands.Checkout(),
    new CircleCI.commands.Run({
      name: 'install',
      command: 'npm ci',
    }),
    new CircleCI.commands.Run({
      name: 'test',
      command: 'npm run test',
    })
  ])
  config.addJob(testJob)
  workflow.addJob(testJob)

  console.log(config.stringify())
  console.warn(config.stringify())
}
main()




