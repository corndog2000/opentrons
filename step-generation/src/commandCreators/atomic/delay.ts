import type { PauseArgs, CommandCreator } from '../../types'
export const delay: CommandCreator<PauseArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'delay',
        params: {
          ...(args.message != null
            ? {
                message: args.message,
              }
            : null),
          wait: args.wait,
        },
      },
    ],
  }
}
