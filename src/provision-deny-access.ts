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
  if (user.googleOrgUnitPath !== "/Clevel") {
    await zygon.account.delete({ id: account.id });

    const admins = await zygon.user.getMany({ labelNames: "admins" });

    await zygon.user.notify({
      userIds: admins.map((a) => a.id),
      subject: "access deny",
      message: `We deny access for ${user.primaryEmail} to app ${app.name}`,
    });
  }
}
