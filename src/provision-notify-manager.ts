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
  if (!target.zygonManagerId) return;

  // notify manager
  await zygon.user.notify({
    userIds: [target.zygonManagerId],
    subject: "access deny",
    message: `${target.primaryEmail} asked to access app ${app.name}`,
  });
}
