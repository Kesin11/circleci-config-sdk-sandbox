const CircleCI = require("@circleci/circleci-config-sdk")

const main = async () => {
  const config = new CircleCI.Config()
  const workflow = new CircleCI.Workflow('build')
  config.addWorkflow(workflow)

  // Define executor
  const dockerExecutor = new CircleCI.executors.DockerExecutor('cimg/base:2022.03', undefined, { environment: {
    IMAGE: "ghcr.io/kesin11/circleci-cli-sandbox"
  }})
  const reusableExecutor = new CircleCI.reusable.ReusableExecutor('cimg-docker', dockerExecutor)
  config.addReusableExecutor(reusableExecutor)

  // Define command
  const setupDockerCommand = new CircleCI.reusable.ReusableCommand('setup-docker', [
    new CircleCI.commands.SetupRemoteDocker({version: "20.10.11"}),
    new CircleCI.commands.Run("docker version")
  ])
  const setupBuildxCommand = new CircleCI.reusable.ReusableCommand('setup-buildx', [
    new CircleCI.commands.Run({
      name: "Show docker info",
      command: [
        "docker version",
        "docker buildx version",
        "docker context inspect"
      ].join('\n')
    }),
    new CircleCI.commands.Run({
      name: "Setup docker buildx",
      command: [
        "docker context create circleci",
        "docker buildx create --use circleci",
        "docker buildx ls",
        "docker context inspect circleci",
      ].join('\n')
    })
  ])
  config.addReusableCommand(setupDockerCommand)
  config.addReusableCommand(setupBuildxCommand)

  // Define reusing executor and command
  const reusedExecutor = new CircleCI.reusable.ReusedExecutor(reusableExecutor)
  const reusedSetupDocker =  new CircleCI.reusable.ReusedCommand(setupDockerCommand)
  const reusedSetupBuildx =  new CircleCI.reusable.ReusedCommand(setupBuildxCommand)

  // build job
  const buildJob = new CircleCI.Job('docker-build-registry-cache', reusedExecutor, [
    new CircleCI.commands.Checkout(),
    reusedSetupDocker,
    reusedSetupBuildx,
    new CircleCI.commands.Run({
      name: 'docker login',
      command: 'echo $GITHUB_CR_PAT | docker login ghcr.io -u kesin11 --password-stdin',
    }),
    new CircleCI.commands.Run({
      name: 'Docker build with registry cache',
      command: 'docker buildx build --progress=plain -f Dockerfile --cache-to=type=registry,mode=max,ref=$IMAGE:cache --cache-from=type=registry,ref=$IMAGE:cache -t $IMAGE:latest .'}),
  ])
  config.addJob(buildJob)
  workflow.addJob(buildJob)

  // Output
  console.log(config.stringify())
  console.warn(config.stringify())
}
main()
