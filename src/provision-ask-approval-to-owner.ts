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
  const owners = await zygon.app.getOwners({ appId: app.id });
  const primaryOwner = owners.find((o) => o.order === 0)?.owner;

  if (!primaryOwner) return;

  const approval = await zygon.approval.ask({
    approverId: primaryOwner.id,
    todoId: task.id,
  });

  if (approval.status === "Denied") {
    await zygon.user.notify({
      userIds: [task.targetId!],
      subject: `Your access request has been rejected by ${primaryOwner.fullName}`,
      message: "",
    });
  }

  const { appInstanceId, targetId } = task;

  if (!appInstanceId || !targetId) return;

  await zygon.account.upsert({
    appInstanceId,
    collaboratorId: targetId,
    status: "active",
  });
}
