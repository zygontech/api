export async function process({
  zygon,
  account,
  user,
  app,
  doer,
}: {
  zygon: Zygon;
  account: Account;
  user: User;
  app: App;
  doer: Doer;
}) {
  if (!user.zygonManagerId) return;

  // notify manager
  await zygon.user.notify({
    userIds: [user.zygonManagerId],
    subject: "access deny",
    message: `${user.primaryEmail} asked to access app ${app.name}`,
  });
}
