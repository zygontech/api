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
  // write your custom logic here to map roles
  const roles = target.role === "admin" ? ["admin"] : ["regular"];

  const { appInstanceId, targetId } = task;

  if (!appInstanceId || !targetId) return;

  const account = await zygon.account.getFirst({
    appInstanceId,
    collaboratorId: targetId,
  });

  await zygon.account.update({ id: account.id, roles });
}
