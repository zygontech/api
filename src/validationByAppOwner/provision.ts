/*
 * @param {Zygon} zygon - access to the Zygon API
 * @param {Task} task - Details of the matched task
 * @param {User} target - Details of the task target
 * @param {User} assignee - Details of the task assignee
 * @param {App} app - Details of the task app
 * @param {Doer} doer - Details of the doer
 */
export async function process({
  zygon,
  task,
  app,
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

  // Workflow suspends and waits for app owner to respond
  const approval = await zygon.approval.ask({
    approverId: primaryOwner.id,
    todoId: task.id,
  });

  if (approval.status === "Denied") {
    await zygon.user.notify({
      userIds: [task.targetId!],
      subject: `Your access request has been rejected by ${primaryOwner.fullName}`,
      message: `Your request for ${task.roles.join(", ")} in ${app.name} has been denied.`,
    });
  }

  const { appInstanceId, targetId } = task;

  if (!appInstanceId || !targetId) return;

  await zygon.account.upsert({
    appInstanceId,
    collaboratorId: targetId,
    status: "active",
  });

  return {
    approved: true,
    approvedBy: `${primaryOwner.fullName} - ${primaryOwner.primaryEmail}`,
  };
}
