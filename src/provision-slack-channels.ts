/*
Here's a script to invite users to a set of default channels on Slack
*/
export async function process({ user }: { user: User }) {
  // user needs to be an existing slack user (run slack provisioning first and run slack sync first)
  if (!user.slackUserId) {
    return;
  }
  // change your channels IDs here, or apply your business logic (channels IDs can be copy/pasted from the bottom of the "Open channel details" modal on Slack)
  const defaultChannels: string[] = ["C09MQ458YKZ", "C09MZ5PP0JX"];

  await zygon.slack.inviteToConversations({
    slackUserId: user.slackUserId,
    slackConversationIds: defaultChannels,
  });
}
