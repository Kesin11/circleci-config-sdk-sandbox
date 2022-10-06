const CircleCI = require("@circleci/circleci-config-sdk")

const main = async () => {
  const config = new CircleCI.Config()
  const workflow = new CircleCI.Workflow('build')
  config.addWorkflow(workflow)

  const nodeOrb = new CircleCI.orb.OrbImport(
    'node',
    'circleci',
    'node',
    '5.0.3',
    'Description: circleci/node orbs',
    // OrbImportManifest
    {
      executors: {
        'default': new CircleCI.parameters.CustomParametersList([])
      },
      jobs: {
        'test': new CircleCI.parameters.CustomParametersList([])
      },
      commands: {
        'install-packages': new CircleCI.parameters.CustomParametersList([])
      }
    }
  )
  config.importOrb(nodeOrb)

  // Using orb executors and commands
  const nodeExecutor = new CircleCI.reusable.ReusedExecutor(nodeOrb.executors['default'], { tag: 'lts'})
  const buildJob = new CircleCI.Job('build', nodeExecutor, [
    new CircleCI.commands.Checkout(),
    new CircleCI.reusable.ReusedCommand(nodeOrb.commands['install-packages'], {
      'pkg-manager': 'npm',
      'cache-version': 'v2'
    }),
    new CircleCI.commands.Run({
      name: 'build',
      command: 'npm run build',
    })
  ])
  config.addJob(buildJob)
  workflow.addJob(buildJob)

  // Using orb jobs
  workflow.addJob(nodeOrb.jobs['test'], {
    'run-command': 'test:ci',
    'version': 'lts'
  })

  console.log(config.stringify())
  console.warn(config.stringify())
}
main()
