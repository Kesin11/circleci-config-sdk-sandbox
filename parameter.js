const CircleCI = require("@circleci/circleci-config-sdk")

const main = async () => {
  const config = new CircleCI.Config()
  const workflow = new CircleCI.Workflow('build')
  config.addWorkflow(workflow)

  // Define executor
  const nodeExecutor = new CircleCI.executors.DockerExecutor('cimg/node:<< parameters.tag >>', 'small')
  const reusableExecutor = new CircleCI.reusable.ReusableExecutor(
    'node',
    nodeExecutor,
    new CircleCI.parameters.CustomParametersList([
      new CircleCI.parameters.CustomParameter('tag', 'string', 'lts')
    ])
  )
  config.addReusableExecutor(reusableExecutor)

  // Define commands
  const reusableInstallCommand = new CircleCI.reusable.ReusableCommand('install', [
    new CircleCI.commands.Checkout(),
    new CircleCI.commands.Run({
      name: 'Install',
      command: 'npm ci',
    }),
  ])
  config.addReusableCommand(reusableInstallCommand)

  const allowedNpmTasks = ['build', 'test']
  const reusableNpmCommand = new CircleCI.reusable.ReusableCommand('npm_run', [
    new CircleCI.commands.Run({
      name: 'npm << parameters.task >>',
      command: 'npm run <<parameters.task >>',
    }),
  ],
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomEnumParameter('task', allowedNpmTasks)
  ])
  )
  config.addReusableCommand(reusableNpmCommand)

  // Define reusing executor and command
  const reusedExecutor = new CircleCI.reusable.ReusedExecutor(reusableExecutor)
  const reusedInstallCommand =  new CircleCI.reusable.ReusedCommand(reusableInstallCommand)

  // build job
  // Using ParameterizedJob for define job parameters
  const buildJob = new CircleCI.reusable.ParameterizedJob('build', reusedExecutor)
  buildJob
    .addStep(reusedInstallCommand)
    .addStep(new CircleCI.reusable.ReusedCommand(reusableNpmCommand, { task: 'build' }))
    .defineParameter('tag', 'string')
  config.addJob(buildJob)
  workflow.addJob(buildJob, { 'tag': 'lts' })

  // test job
  const testJob = new CircleCI.reusable.ParameterizedJob('test', reusedExecutor)
  testJob
    .addStep(reusedInstallCommand)
    .addStep(new CircleCI.reusable.ReusedCommand(reusableNpmCommand, { task: 'test' }))
    .defineParameter('tag', 'string')
  config.addJob(testJob)
  workflow.addJob(testJob, { 'tag': '16' })

  // Output
  console.log(config.stringify())
  console.warn(config.stringify())
}
main()
