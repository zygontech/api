export async function process({
  zygon,
  account,
}: {
  zygon: Zygon;
  account: Account;
}) {
  const owners = await zygon.app.getOwners({ appId: account.appInstanceId });
  const primaryOwner = owners.find((o) => o.order === 0)?.owner;

  if (!primaryOwner) return;

  const task = await zygon.task.create({
    status: "Pending",
    type: "CreateAppAccount",
    appInstanceId: account.appInstanceId,
    targetId: account.collaboratorId,
    assigneeId: primaryOwner.id,
    roles: account.roles,
  });

  const approval = await zygon.approval.ask({
    approverId: primaryOwner.id,
    todoId: task.id,
  });

  if (approval.status === "Denied") {
    await zygon.account.update({
      id: account.id,
      status: "notExisting",
    });
    await zygon.user.notify({
      userIds: [task.targetId!],
      subject: `Your access request has been rejected by ${primaryOwner.fullName}`,
      message: "",
    });
  }
}
