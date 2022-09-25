const CircleCI = require("@circleci/circleci-config-sdk")

const main = async () => {
  const config = new CircleCI.Config()
  const workflow = new CircleCI.Workflow('build')
  config.addWorkflow(workflow)

  // Define executor
  const nodeExecutor = new CircleCI.executors.DockerExecutor('cimg/node:lts', 'small')
  const reusableExecutor = new CircleCI.reusable.ReusableExecutor('node', nodeExecutor)
  config.addReusableExecutor(reusableExecutor)

  // Define command
  const reusableInstallCommand = new CircleCI.reusable.ReusableCommand('install', [
    new CircleCI.commands.Checkout(),
    new CircleCI.commands.Run({
      name: 'Install',
      command: 'npm ci',
    }),
  ])
  config.addReusableCommand(reusableInstallCommand)

  // Define reusing executor and command
  const reusedExecutor = new CircleCI.reusable.ReusedExecutor(reusableExecutor)
  const reusedInstallCommand =  new CircleCI.reusable.ReusedCommand(reusableInstallCommand)

  // build job
  const buildJob = new CircleCI.Job('build', reusedExecutor, [
    reusedInstallCommand,
    new CircleCI.commands.Run({
      name: 'build',
      command: 'npm run build',
    })
  ])
  config.addJob(buildJob)
  workflow.addJob(buildJob)

  // test job
  const testJob = new CircleCI.Job('test', reusedExecutor, [
    reusedInstallCommand,
    new CircleCI.commands.Run({
      name: 'test',
      command: 'npm run test',
    })
  ])
  config.addJob(testJob)
  workflow.addJob(testJob)

  // Output
  console.log(config.stringify())
  console.warn(config.stringify())
}
main()
