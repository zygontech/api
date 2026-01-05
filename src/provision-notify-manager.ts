export async function process({ account }: { account: Account }) {
  const user = await zygon.user.getById({ id: account.collaboratorId });
  const app = await zygon.app.getById({ id: account.appInstanceId });
  if (!user.zygonManagerId) return;
  // notify manager
  await zygon.user.notify({
    userIds: [user.zygonManagerId],
    subject: "access deny",
    message: `${user.primaryEmail} asked to access app ${app.name}`,
  });
}
