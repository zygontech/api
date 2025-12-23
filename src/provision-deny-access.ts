export async function process({
  zygon,
  task,
  target,
  assignee,
  app,
  doer,
}: {
  zygon: Zygon;
  task: Task;
  target: User;
  assignee: User;
  app: App;
  doer: Doer;
}) {
  if (target.googleOrgUnitPath !== "/Clevel") {
    const admins = await zygon.user.getMany({ labelNames: "admins" });

    await zygon.user.notify({
      userIds: admins.map((a) => a.id),
      subject: "access deny",
      message: `We deny access for ${target.primaryEmail} to app ${app.name}`,
    });
  }
}
